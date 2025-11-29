// Local storage-based data management (replacement for base44)

const generateId = () => Math.random().toString(36).substr(2, 9);

class EntityManager {
  constructor(entityName) {
    this.entityName = entityName;
    this.storageKey = `dhikr_app_${entityName}`;
  }

  getAll() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  save(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  async list(sortBy = '-created_date', limit = 100) {
    let items = this.getAll();
    
    // Sort
    if (sortBy) {
      const desc = sortBy.startsWith('-');
      const field = desc ? sortBy.slice(1) : sortBy;
      items.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (aVal < bVal) return desc ? 1 : -1;
        if (aVal > bVal) return desc ? -1 : 1;
        return 0;
      });
    }
    
    return items.slice(0, limit);
  }

  async filter(criteria) {
    const items = this.getAll();
    return items.filter(item => {
      return Object.entries(criteria).every(([key, value]) => item[key] === value);
    });
  }

  async create(data) {
    const items = this.getAll();
    const newItem = {
      ...data,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    items.push(newItem);
    this.save(items);
    return newItem;
  }

  async update(id, data) {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...data,
        updated_date: new Date().toISOString(),
      };
      this.save(items);
      return items[index];
    }
    throw new Error('Item not found');
  }

  async delete(id) {
    const items = this.getAll();
    const filtered = items.filter(item => item.id !== id);
    this.save(filtered);
    return true;
  }

  async get(id) {
    const items = this.getAll();
    return items.find(item => item.id === id);
  }
}

// Mock auth
const auth = {
  async me() {
    return { id: 'user1', name: 'User' };
  },
  async logout() {
    // Clear all data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('dhikr_app_')) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  }
};

// Export entities
export const storage = {
  auth,
  entities: {
    Dhikr: new EntityManager('Dhikr'),
    DhikrLog: new EntityManager('DhikrLog'),
    DhikrSchedule: new EntityManager('DhikrSchedule'),
    Goal: new EntityManager('Goal'),
    IslamicContent: new EntityManager('IslamicContent'),
    UserSettings: new EntityManager('UserSettings'),
    CrescentSighting: new EntityManager('CrescentSighting'),
  }
};
