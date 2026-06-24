'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, User } from 'lucide-react';
import { menuItems } from '@/constants/navigation';

// Берем только первые три пункта для мобильного меню (Главная, Каталог, Профиль)
const mobileItems = menuItems.slice(0, 3);

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#1a1a2e] border-t border-gray-700 z-50 flex items-center justify-around h-16 md:hidden">
      {mobileItems.map(({ href, label }) => {
        const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
        const iconMap: Record<string, any> = {
          '/': Home,
          '/catalog': BookOpen,
          '/buyer': User,
        };
        const Icon = iconMap[href] || Home;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center text-xs font-medium transition ${
              isActive ? 'text-[#ff8012]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}