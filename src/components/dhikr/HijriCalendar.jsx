import React from 'react';
import { Card } from "@/components/ui/card";
import { Moon, Star } from 'lucide-react';

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

export default function HijriCalendar({ adjustment = 0, className = "" }) {
  const today = new Date();
  const hijri = gregorianToHijri(today, adjustment);
  
  return (
    <Card className={`p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-emerald-900">التقويم الهجري</h3>
        </div>
        <Star className="w-4 h-4 text-amber-500" />
      </div>
      
      <div className="text-center" dir="rtl">
        <div className="text-5xl font-arabic-bold text-emerald-900 mb-2">
          {hijri.day}
        </div>
        <div className="text-2xl font-arabic text-emerald-700 mb-1">
          {hijri.monthName}
        </div>
        <div className="text-xl font-arabic text-emerald-600">
          {hijri.year} هـ
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-emerald-200 text-center text-sm text-emerald-600">
        {today.toLocaleDateString('ar-SA') || new Date().toISOString().split('T')[0]}
      </div>
    </Card>
  );
}