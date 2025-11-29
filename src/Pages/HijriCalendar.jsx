import React, { useState, useEffect } from 'react';
import { api } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Moon, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

function gregorianToHijri(date, adjustment = 0) {
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + adjustment);
  
  const gYear = adjustedDate.getFullYear();
  const gMonth = adjustedDate.getMonth() + 1;
  const gDay = adjustedDate.getDate();
  
  // Julian day calculation
  let a = Math.floor((14 - gMonth) / 12);
  let y = gYear + 4800 - a;
  let m = gMonth + 12 * a - 3;
  let jd = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  // Islamic calendar calculation
  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  let hMonth = Math.floor((24 * l) / 709);
  let hDay = l - Math.floor((709 * hMonth) / 24);
  let hYear = 30 * n + j - 30;
  
  return {
    year: hYear,
    month: hMonth,
    day: hDay,
    monthName: HIJRI_MONTHS[hMonth - 1]
  };
}

export default function HijriCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [adjustment, setAdjustment] = useState(0);
  
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await api.entities.UserSettings.list();
      if (settings.length > 0) {
        setAdjustment(settings[0].hijri_adjustment || 0);
      }
    };
    loadSettings();
  }, []);
  
  const { data: sightings = [] } = useQuery({
    queryKey: ['crescent-sightings'],
    queryFn: () => api.entities.CrescentSighting.list()
  });
  
  const sightingMutation = useMutation({
    mutationFn: (data) => api.entities.CrescentSighting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['crescent-sightings']);
      toast.success('تم تسجيل رؤية الهلال');
    }
  });
  
  const deleteSightingMutation = useMutation({
    mutationFn: (id) => api.entities.CrescentSighting.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['crescent-sightings']);
      toast.success('تم حذف رؤية الهلال');
    }
  });
  
  const today = new Date();
  const hijriDate = gregorianToHijri(today, adjustment);
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const getSightingForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sightings.find(s => s.gregorian_date === dateStr);
  };
  
  const calculateMoonPhase = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Calculate days since known new moon (Jan 6, 2000)
    const knownNewMoon = new Date(2000, 0, 6, 18, 14);
    const diff = date - knownNewMoon;
    const daysSince = diff / (1000 * 60 * 60 * 24);
    
    // Lunar month is approximately 29.53 days
    const lunarMonth = 29.53058867;
    const phase = (daysSince % lunarMonth) / lunarMonth;
    
    // Determine phase name
    let phaseName;
    let phaseEmoji;
    if (phase < 0.0625 || phase >= 0.9375) {
      phaseEmoji = '🌑';
      phaseName = 'محاق';
    } else if (phase < 0.1875) {
      phaseEmoji = '🌒';
      phaseName = 'هلال متزايد';
    } else if (phase < 0.3125) {
      phaseEmoji = '🌓';
      phaseName = 'تربيع أول';
    } else if (phase < 0.4375) {
      phaseEmoji = '🌔';
      phaseName = 'أحدب متزايد';
    } else if (phase < 0.5625) {
      phaseEmoji = '🌕';
      phaseName = 'بدر';
    } else if (phase < 0.6875) {
      phaseEmoji = '🌖';
      phaseName = 'أحدب متناقص';
    } else if (phase < 0.8125) {
      phaseEmoji = '🌗';
      phaseName = 'تربيع أخير';
    } else {
      phaseEmoji = '🌘';
      phaseName = 'هلال متناقص';
    }
    
    return {
      phase: Math.round(phase * 100),
      name: `${phaseEmoji} ${phaseName}`,
      illumination: phase
    };
  };
  

  
  const handleMarkCrescent = (date) => {
    const hijri = gregorianToHijri(date, adjustment);
    sightingMutation.mutate({
      gregorian_date: date.toISOString().split('T')[0],
      hijri_month: hijri.monthName,
      hijri_year: hijri.year,
      is_sighted: true,
      location: 'تسجيل محلي'
    });
  };
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Empty cells for days before month start
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const hijri = gregorianToHijri(date, adjustment);
      const sighting = getSightingForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 border rounded-lg cursor-pointer transition-all hover:border-emerald-500 ${
            isToday ? 'bg-emerald-100 border-emerald-500' : 'border-gray-200'
          } ${sighting ? 'bg-amber-50' : ''}`}
        >
          <div className="text-right">
            <div className="font-bold text-gray-900">{day}</div>
            <div className="text-xs text-gray-600 font-arabic">{hijri.day} {hijri.monthName}</div>
            {sighting && <Moon className="w-3 h-3 text-amber-600 mt-1" />}
          </div>
        </div>
      );
    }
    
    return days;
  };
  
  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 islamic-pattern" dir="rtl">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-arabic-bold text-gray-900 mb-2">
            التقويم الهجري
          </h1>
          <div className="text-xl font-arabic text-emerald-700">
            {hijriDate.day} {hijriDate.monthName} {hijriDate.year} هـ
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <div className="text-lg font-arabic-bold">
                  {currentDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                </div>
                <div className="text-sm text-gray-600 font-arabic">
                  {gregorianToHijri(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), adjustment).monthName} {gregorianToHijri(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), adjustment).year} هـ
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                <div key={day} className="text-center font-arabic-bold text-sm text-gray-600 p-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="font-arabic">
                <Moon className="w-3 h-3 ml-1 text-amber-600" />
                رؤية هلال
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Selected date actions */}
        {selectedDate && (
          <Card className="bg-amber-50 border-2 border-amber-300">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-arabic-bold text-lg">
                    {selectedDate.toLocaleDateString('ar-SA')}
                  </div>
                  <div className="text-sm text-gray-600 font-arabic">
                    {gregorianToHijri(selectedDate, adjustment).day} {gregorianToHijri(selectedDate, adjustment).monthName} {gregorianToHijri(selectedDate, adjustment).year} هـ
                  </div>
                </div>
{getSightingForDate(selectedDate) ? (
                  <Button
                    onClick={() => deleteSightingMutation.mutate(getSightingForDate(selectedDate).id)}
                    variant="destructive"
                    className="font-arabic"
                  >
                    حذف التسجيل
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleMarkCrescent(selectedDate)}
                    className="bg-amber-600 hover:bg-amber-700 font-arabic"
                  >
                    <Moon className="w-4 h-4 ml-2" />
                    تسجيل رؤية الهلال
                  </Button>
                )}
              </div>
              
              {/* Moon Phase Info */}
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <div className="text-center mb-3">
                  {(() => {
                    const moonPhase = calculateMoonPhase(selectedDate);
                    const [emoji, ...nameParts] = moonPhase.name.split(' ');
                    return (
                      <>
                        <div className="text-3xl mb-2">{emoji}</div>
                        <div className="text-sm font-arabic font-semibold text-gray-700">
                          {nameParts.join(' ')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          إضاءة: {moonPhase.phase}%
                        </div>
                      </>
                    );
                  })()}
                </div>
                

              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Recent sightings */}
        {sightings.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-arabic-bold text-lg">رؤية الأهلة المسجلة</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sightings.slice(0, 5).map(sighting => (
                  <div key={sighting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-amber-600" />
                      <div>
                        <div className="font-arabic-bold">{sighting.hijri_month} {sighting.hijri_year} هـ</div>
                        <div className="text-sm text-gray-600">
                          {new Date(sighting.gregorian_date).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                    </div>
                    {sighting.location && (
                      <Badge variant="outline" className="font-arabic">
                        <MapPin className="w-3 h-3 ml-1" />
                        {sighting.location}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
