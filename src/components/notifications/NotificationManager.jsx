import { useEffect } from 'react';
import { api } from '@/api/db';
import { toast } from 'sonner';

export default function NotificationManager() {
  useEffect(() => {
    // Check for scheduled dhikr notifications
    const checkNotifications = async () => {
      try {
        const settings = await api.entities.UserSettings.list();
        if (settings.length === 0 || !settings[0].notification_enabled) return;
        
        const schedules = await api.entities.DhikrSchedule.list();
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        for (const schedule of schedules) {
          if (!schedule.is_active) continue;
          
          // Check if it's time for this dhikr
          if (schedule.time_of_day) {
            const [hour, minute] = schedule.time_of_day.split(':').map(Number);
            if (hour === currentHour && minute === currentMinute) {
              const dhikr = await api.entities.Dhikr.get(schedule.dhikr_id);
              if (dhikr) {
                toast.info(`حان وقت الذكر: ${dhikr.name || dhikr.arabic_text}`, {
                  description: 'لا تنسى أذكارك اليوم',
                  duration: 5000
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };
    
    // Check every minute
    const interval = setInterval(checkNotifications, 60000);
    checkNotifications(); // Check immediately
    
    return () => clearInterval(interval);
  }, []);
  
  return null;
}
