import Dexie from 'dexie';

// Initialize IndexedDB
export const db = new Dexie('DhikrApp');

db.version(1).stores({
  dhikr: '++id, name, arabic_text, category, target_count, is_active, created_date',
  dhikrLog: '++id, dhikr_id, date, count_completed, created_date',
  dhikrSchedule: '++id, dhikr_id, schedule_type, time_of_day, days_of_week, is_active',
  goal: '++id, dhikr_id, target_count, start_date, end_date, is_completed, created_date',
  islamicContent: '++id, title, content, content_type, source, tags, created_date',
  userSettings: '++id, latitude, longitude, fajr_angle, maghrib_angle, hijri_adjustment, notification_enabled',
  crescentSighting: '++id, month, year, sighting_date, location, is_confirmed'
});

// Helper to generate unique IDs
const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

// API wrapper to mimic base44 structure
export const api = {
  auth: {
    me: async () => ({ id: 'local-user', name: 'مستخدم' }),
    logout: async () => { /* No-op for offline */ }
  },
  
  entities: {
    Dhikr: {
      list: async (orderBy = '-priority', limit = 100) => {
        let items = await db.dhikr.toArray();

        // Sort by orderBy parameter
        if (orderBy) {
          const desc = orderBy.startsWith('-');
          const field = desc ? orderBy.slice(1) : orderBy;
          items.sort((a, b) => {
            const aVal = a[field] ?? 0;
            const bVal = b[field] ?? 0;
            if (aVal < bVal) return desc ? 1 : -1;
            if (aVal > bVal) return desc ? -1 : 1;
            return 0;
          });
        }

        return items.slice(0, limit);
      },
      filter: async (criteria) => {
        let items = await db.dhikr.toArray();
        if (criteria.is_active !== undefined) {
          items = items.filter(item => item.is_active === criteria.is_active);
        }

        // Sort by priority (highest first) by default
        items.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        return items;
      },
      get: async (id) => await db.dhikr.get(id),
      create: async (data) => {
        const id = await db.dhikr.add({
          ...data,
          created_date: new Date().toISOString()
        });
        return await db.dhikr.get(id);
      },
      update: async (id, data) => {
        await db.dhikr.update(id, data);
        return await db.dhikr.get(id);
      },
      delete: async (id) => await db.dhikr.delete(id)
    },
    
    DhikrLog: {
      list: async (orderBy = 'created_date', limit = 100) => {
        const items = await db.dhikrLog.toArray();
        return items.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, limit);
      },
      filter: async (criteria) => {
        let items = await db.dhikrLog.toArray();
        if (criteria.dhikr_id !== undefined) {
          items = items.filter(item => String(item.dhikr_id) === String(criteria.dhikr_id));
        }
        if (criteria.date) {
          items = items.filter(item => item.date === criteria.date);
        }
        return items;
      },
      create: async (data) => {
        const id = await db.dhikrLog.add({
          ...data,
          created_date: new Date().toISOString()
        });
        return await db.dhikrLog.get(id);
      },
      update: async (id, data) => {
        await db.dhikrLog.update(id, data);
        return await db.dhikrLog.get(id);
      },
      delete: async (id) => await db.dhikrLog.delete(id)
    },
    
    DhikrSchedule: {
      list: async () => await db.dhikrSchedule.toArray(),
      filter: async (criteria) => {
        let items = await db.dhikrSchedule.toArray();
        if (criteria.dhikr_id) {
          items = items.filter(item => item.dhikr_id === criteria.dhikr_id);
        }
        return items;
      },
      create: async (data) => {
        const id = await db.dhikrSchedule.add(data);
        return await db.dhikrSchedule.get(id);
      },
      update: async (id, data) => {
        await db.dhikrSchedule.update(id, data);
        return await db.dhikrSchedule.get(id);
      },
      delete: async (id) => await db.dhikrSchedule.delete(id)
    },
    
    Goal: {
      list: async () => await db.goal.toArray(),
      filter: async (criteria) => {
        let items = await db.goal.toArray();
        if (criteria.is_completed !== undefined) {
          items = items.filter(item => item.is_completed === criteria.is_completed);
        }
        if (criteria.dhikr_id !== undefined) {
          items = items.filter(item => String(item.dhikr_id) === String(criteria.dhikr_id));
        }
        return items;
      },
      create: async (data) => {
        const id = await db.goal.add({
          ...data,
          created_date: new Date().toISOString()
        });
        return await db.goal.get(id);
      },
      update: async (id, data) => {
        await db.goal.update(id, data);
        return await db.goal.get(id);
      },
      delete: async (id) => await db.goal.delete(id)
    },
    
    IslamicContent: {
      list: async () => await db.islamicContent.toArray(),
      filter: async (criteria) => {
        let items = await db.islamicContent.toArray();
        if (criteria.content_type) {
          items = items.filter(item => item.content_type === criteria.content_type);
        }
        return items;
      },
      create: async (data) => {
        const id = await db.islamicContent.add({
          ...data,
          created_date: new Date().toISOString()
        });
        return await db.islamicContent.get(id);
      }
    },
    
    UserSettings: {
      list: async () => await db.userSettings.toArray(),
      create: async (data) => {
        const defaults = {
          latitude: 32.6027,
          longitude: 44.0197,
          fajr_angle: 12,
          maghrib_angle: 6,
          hijri_adjustment: 0,
          notification_enabled: true
        };
        const id = await db.userSettings.add({ ...defaults, ...data });
        return await db.userSettings.get(id);
      },
      update: async (id, data) => {
        await db.userSettings.update(id, data);
        return await db.userSettings.get(id);
      }
    },
    
    CrescentSighting: {
      list: async () => await db.crescentSighting.toArray(),
      create: async (data) => {
        const id = await db.crescentSighting.add(data);
        return await db.crescentSighting.get(id);
      },
      delete: async (id) => await db.crescentSighting.delete(id)
    }
  }
};
