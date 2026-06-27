'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, Sun, Moon } from 'lucide-react';
import { logout } from '@/app/login/actions';

export default function Header() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };

  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">
          C
        </div>
        <span className="font-bold text-base tracking-tight text-slate-100">La Casa Cocina</span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Toggle Theme Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-slate-100 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
          title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        {/* LogOut Button */}
        <button
          onClick={async () => await logout()}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-slate-100 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
