import React, { useState, useEffect } from 'react';
import { api } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Star } from 'lucide-react';
import DhikrCard from '@/components/dhikr/DhikrCard';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'morning', label: 'أذكار الصباح' },
  { value: 'evening', label: 'أذكار المساء' },
  { value: 'after_prayer', label: 'بعد الصلاة' },
  { value: 'before_sleep', label: 'قبل النوم' },
  { value: 'general', label: 'عام' },
  { value: 'quran', label: 'قرآن' },
  { value: 'salawat', label: 'صلوات' },
  { value: 'tasbih', label: 'تسبيح' },
  { value: 'dua', label: 'دعاء' },
  { value: 'ziyarah', label: 'زيارة' }
];

export default function DhikrLibrary() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDhikr, setEditingDhikr] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [formData, setFormData] = useState({
    arabic_text: '',
    category: 'general',
    repetitions: 1,
    reward: '',
    source: '',
    priority: 0,
    is_active: true
  });
  
  const [scheduleData, setScheduleData] = useState({
    schedule_type: 'daily',
    days_of_week: [],
    prayer_times: [],
    reminder_enabled: true
  });
  
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      api.entities.Dhikr.list().then(all => {
        const dhikr = all.find(d => d.id === editId);
        if (dhikr) {
          setEditingDhikr(dhikr);
          setFormData(dhikr);
          setIsDialogOpen(true);
        }
      });
    }
  }, []);
  
  const { data: dhikrs = [], isLoading } = useQuery({
    queryKey: ['dhikrs'],
    queryFn: () => api.entities.Dhikr.list('-priority', 100)
  });
  
  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Dhikr.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dhikrs']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('تم إضافة الذكر بنجاح');
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Dhikr.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dhikrs']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('تم تحديث الذكر بنجاح');
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Dhikr.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['dhikrs']);
      toast.success('تم حذف الذكر');
    }
  });
  
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => api.entities.Dhikr.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries(['dhikrs']);
    }
  });
  
  const resetForm = () => {
    setFormData({
      arabic_text: '',
      category: 'general',
      repetitions: 1,
      reward: '',
      source: '',
      priority: 0,
      is_active: true
    });
    setScheduleData({
      schedule_type: 'daily',
      days_of_week: [],
      prayer_times: [],
      reminder_enabled: true
    });
    setEditingDhikr(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingDhikr) {
      updateMutation.mutate({ id: editingDhikr.id, data: formData });
    } else {
      try {
        const newDhikr = await createMutation.mutateAsync(formData);
        // Create schedule
        if (newDhikr && newDhikr.id) {
          await api.entities.DhikrSchedule.create({
            dhikr_id: newDhikr.id,
            ...scheduleData
          });
        }
      } catch (error) {
        console.error('Error creating dhikr:', error);
      }
    }
  };
  
  const handleDelete = (dhikr) => {
    if (confirm('هل تريد حذف هذا الذكر؟')) {
      deleteMutation.mutate(dhikr.id);
    }
  };
  
  // Helper function to remove Arabic diacritics
  const removeDiacritics = (text) => {
    if (!text) return '';
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
  };
  
  const filteredDhikrs = dhikrs.filter(dhikr => {
    // Normalize search query and text by removing diacritics
    const normalizedQuery = removeDiacritics(searchQuery);
    const normalizedText = removeDiacritics(dhikr.arabic_text);
    const normalizedReward = removeDiacritics(dhikr.reward || '');
    const normalizedSource = removeDiacritics(dhikr.source || '');
    
    const matchesSearch = normalizedText.includes(normalizedQuery) ||
                         normalizedReward.includes(normalizedQuery) ||
                         normalizedSource.includes(normalizedQuery);
    const matchesCategory = categoryFilter === 'all' || dhikr.category === categoryFilter;
    const matchesFavorite = !showFavoritesOnly || dhikr.is_favorite;
    
    return matchesSearch && matchesCategory && matchesFavorite;
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 islamic-pattern" dir="rtl">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-arabic-bold text-gray-900">
              مكتبة الأذكار
            </h1>
            <p className="text-gray-600 font-arabic mt-1">
              أضف وأدر أذكارك اليومية
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 font-arabic"
                onClick={resetForm}
              >
                <Plus className="w-5 h-5 ml-2" />
                إضافة ذكر جديد
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-arabic-bold">
                  {editingDhikr ? 'تعديل الذكر' : 'إضافة ذكر جديد'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="arabic_text" className="font-arabic">النص العربي *</Label>
                  <Textarea
                    id="arabic_text"
                    value={formData.arabic_text}
                    onChange={(e) => setFormData({...formData, arabic_text: e.target.value})}
                    required
                    className="font-arabic text-xl min-h-24"
                    placeholder="سبحان الله وبحمده..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="font-arabic">التصنيف</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value} className="font-arabic">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="repetitions" className="font-arabic">عدد التكرار</Label>
                    <Input
                      id="repetitions"
                      type="number"
                      min="1"
                      value={formData.repetitions}
                      onChange={(e) => setFormData({...formData, repetitions: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="reward" className="font-arabic">الأجر والفضل</Label>
                  <Textarea
                    id="reward"
                    value={formData.reward}
                    onChange={(e) => setFormData({...formData, reward: e.target.value})}
                    className="font-arabic"
                    placeholder="من قالها مائة مرة..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="source" className="font-arabic">المصدر</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="font-arabic"
                    placeholder="الكافي، رقم الحديث..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority" className="font-arabic">الأولوية (اختياري)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500 mt-1">الأرقام الأعلى تظهر أولاً</p>
                </div>
                
                {/* Schedule Section */}
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-arabic-bold text-lg">التكرار والجدولة</h3>
                  
                  <div>
                    <Label className="font-arabic">نوع التكرار</Label>
                    <Select
                      value={scheduleData.schedule_type}
                      onValueChange={(value) => setScheduleData({...scheduleData, schedule_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily" className="font-arabic">يومياً</SelectItem>
                        <SelectItem value="weekly" className="font-arabic">أسبوعياً</SelectItem>
                        <SelectItem value="prayer_time" className="font-arabic">بعد الصلاة</SelectItem>
                        <SelectItem value="monthly" className="font-arabic">شهرياً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {scheduleData.schedule_type === 'weekly' && (
                    <div>
                      <Label className="font-arabic">أيام الأسبوع</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          {value: 'saturday', label: 'السبت'},
                          {value: 'sunday', label: 'الأحد'},
                          {value: 'monday', label: 'الإثنين'},
                          {value: 'tuesday', label: 'الثلاثاء'},
                          {value: 'wednesday', label: 'الأربعاء'},
                          {value: 'thursday', label: 'الخميس'},
                          {value: 'friday', label: 'الجمعة'}
                        ].map(day => (
                          <label key={day.value} className="flex items-center gap-2 font-arabic">
                            <input
                              type="checkbox"
                              checked={scheduleData.days_of_week.includes(day.value)}
                              onChange={(e) => {
                                const days = e.target.checked
                                  ? [...scheduleData.days_of_week, day.value]
                                  : scheduleData.days_of_week.filter(d => d !== day.value);
                                setScheduleData({...scheduleData, days_of_week: days});
                              }}
                              className="rounded"
                            />
                            {day.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {scheduleData.schedule_type === 'prayer_time' && (
                    <div>
                      <Label className="font-arabic">أوقات الصلاة</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          {value: 'after_fajr', label: 'بعد الفجر'},
                          {value: 'after_dhuhr', label: 'بعد الظهر'},
                          {value: 'after_maghrib', label: 'بعد المغرب'}
                        ].map(prayer => (
                          <label key={prayer.value} className="flex items-center gap-2 font-arabic">
                            <input
                              type="checkbox"
                              checked={scheduleData.prayer_times.includes(prayer.value)}
                              onChange={(e) => {
                                const prayers = e.target.checked
                                  ? [...scheduleData.prayer_times, prayer.value]
                                  : scheduleData.prayer_times.filter(p => p !== prayer.value);
                                setScheduleData({...scheduleData, prayer_times: prayers});
                              }}
                              className="rounded"
                            />
                            {prayer.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="flex-1 font-arabic"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-arabic"
                  >
                    {editingDhikr ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="ابحث في الأذكار (بدون حركات)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-arabic"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="font-arabic"
            >
              <Star className={`w-4 h-4 ml-2 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              المفضلة
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
              <TabsList className="bg-white">
                <TabsTrigger value="all" className="font-arabic">الكل</TabsTrigger>
                <TabsTrigger value="morning" className="font-arabic">صباح</TabsTrigger>
                <TabsTrigger value="evening" className="font-arabic">مساء</TabsTrigger>
                <TabsTrigger value="after_prayer" className="font-arabic">بعد الصلاة</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Dhikr Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-gray-500 font-arabic">
              جاري التحميل...
            </div>
          ) : filteredDhikrs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 font-arabic mb-4">
                {searchQuery || categoryFilter !== 'all' 
                  ? 'لا توجد نتائج للبحث' 
                  : 'لم تضف أي أذكار بعد'}
              </p>
            </div>
          ) : (
            filteredDhikrs.map(dhikr => (
              <DhikrCard
                key={dhikr.id}
                dhikr={dhikr}
                onStart={(d) => navigate(createPageUrl('Counter', { dhikr: d.id }))}
                onEdit={(d) => {
                  setEditingDhikr(d);
                  setFormData(d);
                  setIsDialogOpen(true);
                }}
                onDelete={handleDelete}
                onToggleFavorite={(d) => toggleFavoriteMutation.mutate({ id: d.id, isFavorite: d.is_favorite })}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
