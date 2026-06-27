'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, ChefHat, Package, Settings } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
    { href: '/cocina', label: 'Cocina', icon: ChefHat },
    { href: '/insumos', label: 'Insumos', icon: Package },
    { href: '/config', label: 'Config', icon: Settings },
  ];

  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-semibold transition-colors min-w-[48px] min-h-[48px] ${
                isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? 'scale-110 text-primary' : ''} transition-transform`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
