import { db } from './db';

export async function seedDatabase() {
  // Check if already seeded
  const existingDhikr = await db.dhikr.count();
  if (existingDhikr > 0) {
    console.log('Database already seeded');
    return;
  }
  
  console.log('Seeding database with sample data...');
  
  // Add sample dhikr
  const dhikrData = [
    {
      name: 'سبحان الله',
      arabic_text: 'سُبْحَانَ اللَّهِ',
      category: 'tasbih',
      repetitions: 33,
      target_count: 33,
      reward: 'من قالها مائة مرة غفرت خطاياه وإن كانت مثل زبد البحر',
      source: 'الكافي',
      priority: 1,
      is_active: true,
      is_favorite: false,
      created_date: new Date().toISOString()
    },
    {
      name: 'الحمد لله',
      arabic_text: 'الْحَمْدُ لِلَّهِ',
      category: 'tasbih',
      repetitions: 33,
      target_count: 33,
      reward: 'تملأ الميزان',
      source: 'الكافي',
      priority: 2,
      is_active: true,
      is_favorite: false,
      created_date: new Date().toISOString()
    },
    {
      name: 'الله أكبر',
      arabic_text: 'اللَّهُ أَكْبَرُ',
      category: 'tasbih',
      repetitions: 34,
      target_count: 34,
      reward: 'خير من الدنيا وما فيها',
      source: 'الكافي',
      priority: 3,
      is_active: true,
      is_favorite: false,
      created_date: new Date().toISOString()
    },
    {
      name: 'لا إله إلا الله',
      arabic_text: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
      category: 'general',
      repetitions: 100,
      target_count: 100,
      reward: 'أفضل الذكر',
      source: 'الكافي',
      priority: 4,
      is_active: true,
      is_favorite: true,
      created_date: new Date().toISOString()
    },
    {
      name: 'أستغفر الله',
      arabic_text: 'أَسْتَغْفِرُ اللَّهَ',
      category: 'general',
      repetitions: 100,
      target_count: 100,
      reward: 'من لزم الاستغفار جعل الله له من كل هم فرجا',
      source: 'الكافي',
      priority: 5,
      is_active: true,
      is_favorite: false,
      created_date: new Date().toISOString()
    },
    {
      name: 'آية الكرسي',
      arabic_text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      category: 'quran',
      repetitions: 1,
      target_count: 1,
      reward: 'من قرأها في ليلة لم يزل عليه من الله حافظ',
      source: 'الكافي',
      priority: 6,
      is_active: true,
      is_favorite: true,
      created_date: new Date().toISOString()
    }
  ];
  
  for (const dhikr of dhikrData) {
    await db.dhikr.add(dhikr);
  }
  
  // Add default user settings
  await db.userSettings.add({
    latitude: 32.6027,
    longitude: 44.0197,
    fajr_angle: 12,
    maghrib_angle: 6,
    hijri_adjustment: 0,
    notification_enabled: true,
    current_streak: 0,
    longest_streak: 0
  });
  
  console.log('Database seeded successfully!');
}
