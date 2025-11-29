// Utility functions

export function createPageUrl(pageName, params = {}) {
  const routes = {
    Home: '/',
    Counter: '/counter',
    DhikrLibrary: '/dhikr-library',
    Goals: '/goals',
    Calendar: '/calendar',
    HijriCalendar: '/hijri-calendar',
    Settings: '/settings',
  };
  
  const path = routes[pageName] || '/';
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
