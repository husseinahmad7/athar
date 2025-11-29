import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Sun, Sunrise, Sunset, Moon } from 'lucide-react';

function calculatePrayerTimes(date, lat, lng, fajrAngle = 12, maghribAngle = 6) {
  // Get timezone offset in hours
  const timezoneOffset = -date.getTimezoneOffset() / 60;
  
  // Day of year calculation
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
  
  // Solar declination (degrees)
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear + 284) * Math.PI / 180);
  
  // Equation of time (minutes)
  const B = (360 / 365) * (dayOfYear - 81);
  const EoT = 9.87 * Math.sin(2 * B * Math.PI / 180) - 7.53 * Math.cos(B * Math.PI / 180) - 1.5 * Math.sin(B * Math.PI / 180);
  
  // Calculate hour angle for given elevation angle
  const calculateHourAngle = (elevationAngle) => {
    const latRad = lat * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    const elevRad = elevationAngle * Math.PI / 180;
    
    const cosH = (Math.sin(elevRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
    
    if (cosH > 1 || cosH < -1) return null;
    
    return Math.acos(cosH) * 180 / Math.PI;
  };
  
  // Solar noon (local time)
  const solarNoon = 12 + timezoneOffset - (lng / 15) - (EoT / 60);
  
  // Calculate prayer times
  const fajrHA = calculateHourAngle(-fajrAngle);
  const sunriseHA = calculateHourAngle(-0.833);
  const sunsetHA = calculateHourAngle(-0.833);
  const maghribHA = calculateHourAngle(-maghribAngle);
  
  const fajrTime = solarNoon - (fajrHA / 15);
  const sunriseTime = solarNoon - (sunriseHA / 15);
  const dhuhrTime = solarNoon;
  const sunsetTime = solarNoon + (sunsetHA / 15);
  const maghribTime = solarNoon + (maghribHA / 15);
  
  const formatTime = (decimalHours) => {
    if (decimalHours === null) return '--:--';
    let hours = Math.floor(decimalHours);
    let minutes = Math.round((decimalHours - hours) * 60);
    
    if (minutes === 60) {
      hours++;
      minutes = 0;
    }
    
    // Handle negative and overflow
    while (hours < 0) hours += 24;
    hours = hours % 24;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  // Calculate Asr (when shadow = object length + noon shadow)
  const asrHA = calculateHourAngle(-Math.atan(1 / (1 + Math.tan(Math.abs(lat - declination) * Math.PI / 180))) * 180 / Math.PI);
  const asrTime = solarNoon + (asrHA / 15);
  
  // Isha is typically 90 minutes after Maghrib
  const ishaTime = maghribTime + 1.5;
  
  return {
    fajr: formatTime(fajrTime),
    sunrise: formatTime(sunriseTime),
    dhuhr: formatTime(dhuhrTime),
    asr: formatTime(asrTime),
    maghrib: formatTime(maghribTime),
    isha: formatTime(ishaTime)
  };
}

export default function PrayerTimesWidget({ lat = 24.7136, lng = 46.6753, fajrAngle = 12, maghribAngle = 12 }) {
  const [times, setTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState('');
  
  useEffect(() => {
    const now = new Date();
    const prayerTimes = calculatePrayerTimes(now, lat, lng, fajrAngle, maghribAngle);
    setTimes(prayerTimes);
    
    // Determine next prayer
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const prayers = [
      { name: 'الفجر', time: prayerTimes.fajr },
      { name: 'الشروق', time: prayerTimes.sunrise },
      { name: 'الظهر', time: prayerTimes.dhuhr },
      { name: 'العصر', time: prayerTimes.asr },
      { name: 'المغرب', time: prayerTimes.maghrib },
      { name: 'العشاء', time: prayerTimes.isha }
    ];
    
    for (const prayer of prayers) {
      if (prayer.time && prayer.time !== '--:--') {
        const [h, m] = prayer.time.split(':').map(Number);
        const prayerMinutes = h * 60 + m;
        if (prayerMinutes > currentMinutes) {
          setNextPrayer(prayer.name);
          break;
        }
      }
    }
  }, [lat, lng, fajrAngle, maghribAngle]);
  
  if (!times) return null;
  
  const prayerItems = [
    { name: 'الفجر', time: times.fajr, icon: Moon, color: 'text-indigo-600' },
    { name: 'الظهر', time: times.dhuhr, icon: Sun, color: 'text-amber-500' },
    { name: 'المغرب', time: times.maghrib, icon: Sunset, color: 'text-rose-500' }
  ];
  
  return (
    <Card className="p-6 bg-white shadow-lg" dir="rtl">
      <h3 className="text-xl font-arabic-bold text-emerald-900 mb-4">مواقيت الصلاة</h3>
      <div className="space-y-3">
        {prayerItems.map((prayer) => {
          const Icon = prayer.icon;
          const isNext = prayer.name === nextPrayer;
          return (
            <div 
              key={prayer.name}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                isNext ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${prayer.color}`} />
                <span className={`font-arabic text-lg ${isNext ? 'font-bold text-emerald-900' : 'text-gray-700'}`}>
                  {prayer.name}
                </span>
              </div>
              <span className={`font-bold text-lg ${isNext ? 'text-emerald-700' : 'text-gray-600'}`}>
                {prayer.time}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}