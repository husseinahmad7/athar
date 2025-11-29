import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, BookOpen, Target, Calendar, Settings, LogOut } from 'lucide-react';
import { api } from '@/api/db';
import NotificationManager from '@/components/notifications/NotificationManager';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);
  
  const navItems = [
    { name: 'Home', label: 'الرئيسية', icon: Home },
    { name: 'DhikrLibrary', label: 'المكتبة', icon: BookOpen },
    { name: 'Goals', label: 'الأهداف', icon: Target },
    { name: 'HijriCalendar', label: 'الهجري', icon: Calendar },
    { name: 'Settings', label: 'الإعدادات', icon: Settings }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white" dir="rtl">
      <NotificationManager />
      {/* Top Navigation */}
      <nav className="bg-white border-b-2 border-emerald-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-xl font-arabic-bold">د</span>
              </div>
              <span className="text-2xl font-arabic-bold text-emerald-900 hidden md:block">
                درر
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPageName === item.name;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-arabic transition-all
                      ${isActive 
                        ? 'bg-emerald-100 text-emerald-900 font-bold' 
                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => api.auth.logout()}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-arabic hidden md:block">خروج</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Page Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
      
      {/* Bottom Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-emerald-200 shadow-lg z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-emerald-100 text-emerald-900' 
                    : 'text-gray-600'
                  }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-arabic font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Mobile Spacing */}
      <div className="md:hidden h-20" />
    </div>
  );
}
