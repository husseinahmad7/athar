import React, { useState, useEffect } from 'react';
import { api } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Timer } from 'lucide-react';
import { createPageUrl } from '@/utils';
import CounterDisplay from '@/components/dhikr/CounterDisplay';
import VoiceCounter from '@/components/dhikr/VoiceCounter';
import { toast } from 'sonner';

export default function Counter() {
  const navigate = useNavigate();
  const [dhikrId, setDhikrId] = useState(null);
  const [count, setCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [autoSeconds, setAutoSeconds] = useState(10);
  
  const queryClient = useQueryClient();
  
  // Load saved progress from localStorage
  useEffect(() => {
    if (dhikrId) {
      const savedProgress = localStorage.getItem(`dhikr_progress_${dhikrId}`);
      if (savedProgress) {
        const { count: savedCount, timestamp } = JSON.parse(savedProgress);
        // Only restore if less than 1 hour old
        if (Date.now() - timestamp < 3600000) {
          setCount(savedCount);
        }
      }
    }
  }, [dhikrId]);
  
  // Save progress to localStorage
  useEffect(() => {
    if (dhikrId && count > 0) {
      localStorage.setItem(`dhikr_progress_${dhikrId}`, JSON.stringify({
        count,
        timestamp: Date.now()
      }));
    }
  }, [dhikrId, count]);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('dhikr');
    if (id) setDhikrId(id);
  }, []);
  
  const { data: dhikr, isLoading } = useQuery({
    queryKey: ['dhikr', dhikrId],
    queryFn: () => api.entities.Dhikr.list().then(all => all.find(d => String(d.id) === String(dhikrId))),
    enabled: !!dhikrId
  });
  
  const saveMutation = useMutation({
    mutationFn: async (logData) => {
      await api.entities.DhikrLog.create(logData);
      
      // Update user settings streak
      const settings = await api.entities.UserSettings.list();
      if (settings.length > 0) {
        const setting = settings[0];
        const today = new Date().toISOString().split('T')[0];
        const logs = await api.entities.DhikrLog.filter({ date: today });
        
        if (logs.length > 0) {
          await api.entities.UserSettings.update(setting.id, {
            current_streak: (setting.current_streak || 0) + 1,
            longest_streak: Math.max(setting.longest_streak || 0, (setting.current_streak || 0) + 1)
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recent-logs']);
      toast.success('تم حفظ التقدم بنجاح! 🎉', {
        description: 'بارك الله في عملك',
        duration: 3000
      });
    }
  });
  
  // Auto timer mode
  useEffect(() => {
    if (!autoMode || !dhikr) return;
    
    const interval = setInterval(() => {
      setCount(prev => {
        const newCount = prev + 1;
        if (newCount >= dhikr.repetitions) {
          setAutoMode(false);
          handleComplete(newCount);
        }
        return newCount;
      });
    }, autoSeconds * 1000);
    
    return () => clearInterval(interval);
  }, [autoMode, dhikr, autoSeconds]);
  
  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };
  
  const handleDecrement = () => {
    setCount(prev => Math.max(0, prev - 1));
  };
  
  const handleReset = () => {
    if (count > 0 && confirm('هل تريد إعادة تعيين العداد؟')) {
      setCount(0);
      setStartTime(Date.now());
      localStorage.removeItem(`dhikr_progress_${dhikrId}`);
    }
  };
  
  // Save incomplete progress when navigating away
  const saveIncompleteProgress = async () => {
    if (!dhikr || count === 0) return;
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const today = new Date().toISOString().split('T')[0];
    const hijriDate = new Date().toLocaleDateString('ar-SA-u-ca-islamic');
    
    try {
      // Check if there's already a log for today
      const todayLogs = await api.entities.DhikrLog.filter({ 
        dhikr_id: parseInt(dhikrId),
        date: today 
      });
      
      if (todayLogs.length > 0) {
        // Update existing log
        const existingLog = todayLogs[0];
        await api.entities.DhikrLog.update(existingLog.id, {
          count_completed: count,
          completion_percentage: (count / dhikr.repetitions) * 100,
          duration_seconds: duration
        });
      } else {
        // Create new log for incomplete progress
        await api.entities.DhikrLog.create({
          dhikr_id: parseInt(dhikrId),
          date: today,
          hijri_date: hijriDate,
          count_completed: count,
          target_count: dhikr.repetitions,
          completion_percentage: (count / dhikr.repetitions) * 100,
          method: isVoiceActive ? 'voice' : autoMode ? 'auto_timer' : 'manual',
          duration_seconds: duration
        });
      }
      
      // Invalidate queries to refresh home page
      queryClient.invalidateQueries(['recent-logs']);
      queryClient.invalidateQueries(['today-dhikr']);
    } catch (error) {
      console.error('Error saving incomplete progress:', error);
    }
  };
  
  // Save progress when navigating away
  useEffect(() => {
    return () => {
      // This will be called on unmount
      if (count > 0 && dhikrId) {
        saveIncompleteProgress();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleComplete = async (finalCount = count) => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const today = new Date().toISOString().split('T')[0];
    
    // Simple Hijri calculation
    const hijriDate = new Date().toLocaleDateString('ar-SA-u-ca-islamic');
    
    await saveMutation.mutateAsync({
      dhikr_id: parseInt(dhikrId), // Ensure it's a number
      date: today,
      hijri_date: hijriDate,
      count_completed: finalCount,
      target_count: dhikr.repetitions,
      completion_percentage: (finalCount / dhikr.repetitions) * 100,
      method: isVoiceActive ? 'voice' : autoMode ? 'auto_timer' : 'manual',
      duration_seconds: duration
    });
    
    // Update goals progress
    const allGoals = await api.entities.Goal.list();
    const goals = allGoals.filter(g => !g.is_completed);
    console.log('All goals:', allGoals);
    console.log('Checking goals for dhikr:', dhikrId, 'Active Goals:', goals);

    for (const goal of goals) {
      let shouldUpdate = false;
      let dhikrCount = 0;

      console.log('Checking goal:', {
        title: goal.title,
        type: goal.goal_type,
        dhikr_id: goal.dhikr_id,
        dhikr_ids: goal.dhikr_ids,
        current_value: goal.current_value,
        target_value: goal.target_value
      });

      // Check if this dhikr is related to the goal
      const dhikrIdNum = parseInt(dhikrId);

      if (goal.goal_type === 'daily_streak') {
        // Daily streak - any completed dhikr counts
        shouldUpdate = true;
        dhikrCount = finalCount;
        console.log('Matched daily_streak goal');
      } else if (goal.goal_type === 'dhikr_streak') {
        // Dhikr streak - only specific dhikr(s) count
        if (goal.dhikr_ids && Array.isArray(goal.dhikr_ids) && goal.dhikr_ids.length > 0) {
          const matched = goal.dhikr_ids.some(id => parseInt(id) === dhikrIdNum);
          if (matched) {
            shouldUpdate = true;
            dhikrCount = finalCount;
            console.log('Matched dhikr_streak goal');
          }
        }
      } else if (goal.goal_type === 'total_count') {
        // Total count goals track all dhikr
        shouldUpdate = true;
        dhikrCount = finalCount;
        console.log('Matched total_count goal');
      } else if (goal.goal_type === 'monthly_target') {
        // Monthly target - all dhikr count
        shouldUpdate = true;
        dhikrCount = finalCount;
        console.log('Matched monthly_target goal');
      } else if (goal.dhikr_ids && Array.isArray(goal.dhikr_ids) && goal.dhikr_ids.length > 0) {
        // Handle goals that have dhikr_ids (specific or combination)
        const matched = goal.dhikr_ids.some(id => parseInt(id) === dhikrIdNum);
        if (matched) {
          shouldUpdate = true;
          dhikrCount = finalCount;
          console.log('Matched goal with dhikr_ids');
        }
      } else if (goal.goal_type === 'specific_dhikr' && goal.dhikr_id) {
        if (String(goal.dhikr_id) === String(dhikrId)) {
          shouldUpdate = true;
          dhikrCount = finalCount;
          console.log('Matched specific_dhikr goal');
        }
      }

      if (shouldUpdate) {
        // Use the new goal tracking utility
        const { calculateGoalProgress } = await import('../utils/goalTracking.js');
        const updates = calculateGoalProgress(goal, dhikrCount, today);

        if (updates) {
          console.log('Updating goal:', goal.title, 'with updates:', updates);

          await api.entities.Goal.update(goal.id, updates);

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries(['goals']);

          if (updates.is_completed && goal.reward_message) {
            toast.success(goal.reward_message, {
              description: `تم إنجاز الهدف: ${goal.title}`,
              duration: 8000
            });
          }
        }
      }
    }
    
    // Clear saved progress
    localStorage.removeItem(`dhikr_progress_${dhikrId}`);
    
    // Invalidate queries to refresh home page
    queryClient.invalidateQueries(['recent-logs']);
    queryClient.invalidateQueries(['today-dhikr']);
    
    // Reset for next session
    setTimeout(() => {
      setCount(0);
      setStartTime(Date.now());
    }, 2000);
  };
  
  if (isLoading || !dhikr) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-center font-arabic text-gray-600">
          جاري التحميل...
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 islamic-pattern" dir="rtl">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              if (count > 0) {
                await saveIncompleteProgress();
              }
              navigate(createPageUrl('Home'));
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-arabic-bold text-gray-900">
              العداد
            </h1>
          </div>
          {count > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await saveIncompleteProgress();
                toast.success('تم حفظ التقدم');
              }}
              className="font-arabic"
            >
              حفظ
            </Button>
          )}
        </div>
        
        {/* Counter Modes */}
        <Tabs 
          defaultValue="manual" 
          className="w-full"
          onValueChange={(value) => {
            if (value === 'manual') {
              setAutoMode(false);
              setIsVoiceActive(false);
            } else if (value === 'voice') {
              setAutoMode(false);
            } else if (value === 'auto') {
              setIsVoiceActive(false);
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="manual" className="font-arabic">
              يدوي
            </TabsTrigger>
            <TabsTrigger value="voice" className="font-arabic">
              صوتي
            </TabsTrigger>
            <TabsTrigger value="auto" className="font-arabic">
              تلقائي
            </TabsTrigger>
          </TabsList>
          
          {/* Manual Mode */}
          <TabsContent value="manual">
            <CounterDisplay
              count={count}
              target={dhikr.repetitions}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onReset={handleReset}
              onComplete={() => handleComplete()}
              dhikrText={dhikr.arabic_text}
            />
          </TabsContent>
          
          {/* Voice Mode */}
          <TabsContent value="voice" className="space-y-6">
            <CounterDisplay
              count={count}
              target={dhikr.repetitions}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onReset={handleReset}
              onComplete={() => handleComplete()}
              dhikrText={dhikr.arabic_text}
            />
            
            <VoiceCounter
              targetPhrase={dhikr.arabic_text}
              onCount={handleIncrement}
              isActive={isVoiceActive}
              setIsActive={setIsVoiceActive}
            />
          </TabsContent>
          
          {/* Auto Timer Mode */}
          <TabsContent value="auto" className="space-y-6">
            <CounterDisplay
              count={count}
              target={dhikr.repetitions}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onReset={handleReset}
              onComplete={() => handleComplete()}
              dhikrText={dhikr.arabic_text}
            />
            
            <div className="space-y-4">
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                <label className="block text-sm font-arabic font-semibold text-gray-700 mb-2">
                  المدة الزمنية لكل تسبيحة (بالثواني)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={autoSeconds}
                  onChange={(e) => setAutoSeconds(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg text-center text-lg font-bold"
                  disabled={autoMode}
                />
              </div>
              
              <Button
                onClick={() => setAutoMode(!autoMode)}
                size="lg"
                className={`w-full h-16 text-lg font-arabic-bold ${
                  autoMode 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Timer className="w-6 h-6 ml-2" />
                {autoMode ? 'إيقاف المؤقت' : 'بدء المؤقت'}
              </Button>
              
              <p className="text-sm text-center text-gray-600 font-arabic">
                سيتم احتساب تسبيحة واحدة كل {autoSeconds} ثانية
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Dhikr Info */}
        {dhikr.reward && (
          <div className="bg-white rounded-xl border-2 border-emerald-200 p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-900 font-arabic whitespace-pre-wrap">
                <span className="font-bold">الأجر: </span>
                {dhikr.reward}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
