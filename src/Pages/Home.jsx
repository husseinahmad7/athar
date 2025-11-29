import React, { useState, useEffect } from 'react';
import { api } from '@/api/db';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Target, BookOpen, Calendar, Plus } from 'lucide-react';
import HijriCalendar from '@/components/dhikr/HijriCalendar';
import PrayerTimesWidget from '@/components/dhikr/PrayerTimesWidget';

import DhikrCard from '@/components/dhikr/DhikrCard';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
        
        // Load or create user settings
        const results = await api.entities.UserSettings.list();
        if (results.length > 0) {
          setSettings(results[0]);
        } else {
          // Create default settings
          const newSettings = await api.entities.UserSettings.create({});
          setSettings(newSettings);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadData();
  }, []);
  
  const { data: logs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['recent-logs'],
    queryFn: async () => {
      const allLogs = await api.entities.DhikrLog.list('-created_date', 100);
      console.log('Fetched logs:', allLogs.length, allLogs);
      return allLogs;
    }
  });
  
  // Refetch logs when navigating back to home
  useEffect(() => {
    refetchLogs();
  }, [refetchLogs]);
  
  const { data: goals = [] } = useQuery({
    queryKey: ['active-goals'],
    queryFn: () => api.entities.Goal.filter({ is_completed: false })
  });
  
  const { data: schedules = [] } = useQuery({
    queryKey: ['dhikr-schedules'],
    queryFn: () => api.entities.DhikrSchedule.list()
  });
  
  const { data: todayDhikr = [], isLoading } = useQuery({
    queryKey: ['today-dhikr', logs.map(l => l.id).join(',')],
    queryFn: async () => {
      const allDhikrs = await api.entities.Dhikr.filter({ is_active: true });
      console.log('All active dhikrs:', allDhikrs.length);
      
      if (logs.length === 0) {
        // No logs yet, show first 3 active dhikrs
        console.log('No logs, showing first 3 dhikrs');
        return allDhikrs.slice(0, 3);
      }
      
      // Get dhikrs that have been logged, with their last log time
      const dhikrLastLog = new Map();
      logs.forEach(log => {
        // Normalize dhikr_id to number for comparison
        const dhikrId = typeof log.dhikr_id === 'string' ? parseInt(log.dhikr_id) : log.dhikr_id;
        const existingLog = dhikrLastLog.get(dhikrId);
        if (!existingLog || new Date(log.created_date) > new Date(existingLog.created_date)) {
          dhikrLastLog.set(dhikrId, log);
        }
      });
      
      console.log('Dhikr last logs:', Array.from(dhikrLastLog.entries()));
      
      // Get dhikrs that have logs
      const recentDhikrs = allDhikrs.filter(dhikr => {
        const hasLog = dhikrLastLog.has(dhikr.id);
        console.log(`Checking dhikr ${dhikr.id} (${dhikr.arabic_text}): ${hasLog}`);
        return hasLog;
      });
      
      // Sort by most recent interaction
      const sortedDhikrs = recentDhikrs.sort((a, b) => {
        const aLog = dhikrLastLog.get(a.id);
        const bLog = dhikrLastLog.get(b.id);
        return new Date(bLog.created_date) - new Date(aLog.created_date);
      });
      
      console.log('Sorted recent dhikrs:', sortedDhikrs.map(d => d.arabic_text));
      
      // If less than 3, fill with other active dhikrs
      if (sortedDhikrs.length < 3) {
        const usedIds = new Set(sortedDhikrs.map(d => d.id));
        const remainingDhikrs = allDhikrs.filter(d => !usedIds.has(d.id));
        return [...sortedDhikrs, ...remainingDhikrs].slice(0, 3);
      }
      
      return sortedDhikrs.slice(0, 3);
    },
    enabled: true
  });
  
  // Calculate streak
  const calculateStreak = () => {
    if (!logs.length) return 0;
    
    const dates = [...new Set(logs.map(log => log.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];
      
      if (dates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  const streak = calculateStreak();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 islamic-pattern" dir="rtl">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-arabic-bold text-emerald-900 mb-2">
            درر
          </h1>
          <p className="text-lg text-gray-600 font-arabic">
            رفيقك في رحلة الذكر والعبادة
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Streak */}
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <Flame className="w-12 h-12 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-1">{streak}</div>
              <div className="text-sm opacity-90 font-arabic">سلسلة الأيام</div>
            </CardContent>
          </Card>
          
          {/* Active Goals */}
          <Card className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <Target className="w-12 h-12 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-1">{goals.length}</div>
              <div className="text-sm opacity-90 font-arabic">أهداف نشطة</div>
            </CardContent>
          </Card>
          
          {/* Total Count Today */}
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-1">
                {logs.filter(l => l.date === new Date().toISOString().split('T')[0])
                  .reduce((sum, l) => sum + l.count_completed, 0)}
              </div>
              <div className="text-sm opacity-90 font-arabic">أذكار اليوم</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Dhikr */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-arabic-bold text-gray-900">
                  أذكاري النشطة
                </h2>
                <Link to={createPageUrl('DhikrLibrary')}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 font-arabic">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة ذكر
                  </Button>
                </Link>
              </div>
              
              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-12 text-gray-500 font-arabic">
                    جاري التحميل...
                  </div>
                ) : todayDhikr.length === 0 ? (
                  <Card className="p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-arabic mb-4">
                      لم تضف أي أذكار بعد
                    </p>
                    <Link to={createPageUrl('DhikrLibrary')}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 font-arabic">
                        ابدأ الآن
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  todayDhikr.map(dhikr => (
                    <DhikrCard
                      key={dhikr.id}
                      dhikr={dhikr}
                      onStart={(d) => navigate(createPageUrl('Counter', { dhikr: d.id }))}
                      onEdit={(d) => navigate(createPageUrl('DhikrLibrary', { edit: d.id }))}
                      onDelete={async (d) => {
                        if (confirm('هل تريد حذف هذا الذكر؟')) {
                          await api.entities.Dhikr.delete(d.id);
                          window.location.reload();
                        }
                      }}
                      compact={true}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Prayer Times */}
            <PrayerTimesWidget
              lat={settings?.latitude || 32.6027}
              lng={settings?.longitude || 44.0197}
              fajrAngle={settings?.fajr_angle || 12}
              maghribAngle={settings?.maghrib_angle || 6}
            />
            
            {/* Hijri Calendar */}
            <HijriCalendar adjustment={settings?.hijri_adjustment || 0} />
            
            {/* Quick Actions */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <h3 className="text-lg font-arabic-bold text-gray-900">
                  روابط سريعة
                </h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={createPageUrl('Goals')}>
                  <Button variant="outline" className="w-full justify-start font-arabic">
                    <Target className="w-4 h-4 ml-2" />
                    الأهداف
                  </Button>
                </Link>
                <Link to={createPageUrl('Calendar')}>
                  <Button variant="outline" className="w-full justify-start font-arabic">
                    <Calendar className="w-4 h-4 ml-2" />
                    التقويم
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
