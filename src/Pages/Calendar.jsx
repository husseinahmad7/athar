import React, { useState, useEffect } from 'react';
import { api } from '@/api/db';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ProgressChart from '../components/dhikr/ProgressChart';

const HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

function gregorianToHijri(date, adjustment = 0) {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();
  
  let wd;
  if (gMonth < 3) {
    wd = Math.floor((gYear - 1) / 4) * 1461 + Math.floor(((gYear - 1) % 4) * 365.25);
  } else {
    wd = Math.floor(gYear / 4) * 1461 + Math.floor((gYear % 4) * 365.25);
  }
  
  const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  wd += monthDays[gMonth - 1] + gDay;
  
  if (gMonth > 2 && (gYear % 4 === 0 && (gYear % 100 !== 0 || gYear % 400 === 0))) {
    wd++;
  }
  
  const wdHijri = wd - 227015 + adjustment;
  const hYear = Math.floor((wdHijri - 1) / 354.36667) + 1;
  const yearStart = Math.floor((hYear - 1) * 354.36667) + 1;
  const hMonth = Math.floor((wdHijri - yearStart) / 29.5) + 1;
  const monthStart = Math.floor((hMonth - 1) * 29.5) + yearStart;
  const hDay = wdHijri - monthStart + 1;
  
  return {
    year: hYear,
    month: Math.min(hMonth, 12),
    day: Math.floor(hDay),
    monthName: HIJRI_MONTHS[Math.min(hMonth - 1, 11)]
  };
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    api.entities.UserSettings.filter({})
      .then(results => results.length > 0 && setSettings(results[0]));
  }, []);
  
  const { data: logs = [] } = useQuery({
    queryKey: ['logs-calendar'],
    queryFn: () => api.entities.DhikrLog.list('-date', 90)
  });
  
  // Get days in month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Calculate chart data for last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = logs.filter(log => log.date && log.date === dateStr);
    const total = dayLogs.reduce((sum, log) => sum + (log.count_completed || 0), 0);
    
    last7Days.push({
      name: date.toLocaleDateString('ar-SA', { weekday: 'short' }) || '',
      value: total
    });
  }
  
  // Get activity for each day
  const getActivityForDate = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    const dayLogs = logs.filter(log => log.date && log.date === dateStr);
    return dayLogs.reduce((sum, log) => sum + (log.count_completed || 0), 0);
  };
  
  const changeMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };
  
  const hijri = gregorianToHijri(currentDate, settings?.hijri_adjustment || 0);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 islamic-pattern" dir="rtl">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-arabic-bold text-gray-900 mb-2">
            التقويم
          </h1>
          <p className="text-gray-600 font-arabic">
            تابع تقدمك اليومي
          </p>
        </div>
        
        {/* Progress Chart */}
        <ProgressChart data={last7Days} type="bar" />
        
        {/* Calendar */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeMonth(-1)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              
              <div className="text-center">
                <h2 className="text-xl font-arabic-bold text-gray-900">
                  {currentDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-sm text-emerald-600 font-arabic">
                  {hijri.monthName} {hijri.year} هـ
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeMonth(1)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                <div key={day} className="text-center text-sm font-arabic font-semibold text-gray-600 p-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const activity = getActivityForDate(day);
                const isToday = new Date().getDate() === day && 
                               new Date().getMonth() === month && 
                               new Date().getFullYear() === year;
                
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg p-2 flex flex-col items-center justify-center
                      ${isToday ? 'bg-emerald-500 text-white ring-4 ring-emerald-200' : 'bg-gray-50'}
                      ${activity > 0 ? 'bg-emerald-100 border-2 border-emerald-400' : ''}
                      transition-all hover:scale-105 cursor-pointer`}
                  >
                    <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>
                      {day}
                    </span>
                    {activity > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs mt-1 bg-emerald-600 text-white"
                      >
                        {activity}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Legend */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-arabic">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-50 border-2" />
                <span>لا نشاط</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-100 border-2 border-emerald-400" />
                <span>يوم نشط</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500 ring-4 ring-emerald-200" />
                <span>اليوم</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
