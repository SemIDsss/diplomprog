'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { menuItems } from '@/constants/navigation';

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const loadUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user') {
        loadUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const handleUserUpdated = () => {
      loadUser();
    };
    window.addEventListener('userUpdated', handleUserUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    loadUser();
  }, [pathname]);

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-[#1a1a2e] text-white flex items-center justify-between px-4 py-3 border-b border-gray-700 shadow-md h-16">
        <Link href="/" className="text-2xl font-black text-[#ff8012] tracking-tight">
          DIPLOM
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <span className="text-sm font-medium text-gray-300">{user.email || 'Профиль'}</span>
          ) : (
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-[#ff8012] transition">
              Войти
            </Link>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 rounded-lg hover:bg-gray-800 transition"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={28} className="text-white" /> : <Menu size={28} className="text-white" />}
          </button>
        </div>
      </header>
      {isMenuOpen && (
        <div className="fixed top-16 left-0 w-full bg-[#1a1a2e] border-b border-gray-700 shadow-lg z-40 py-2 px-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 text-sm font-medium text-gray-300 hover:text-[#ff8012] transition"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}