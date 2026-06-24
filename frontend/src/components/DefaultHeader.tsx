'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { menuItems } from '@/constants/navigation';

export default function DefaultHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#1a1a2e] text-white flex items-center justify-between px-4 py-3 border-b border-gray-700 shadow-md h-16">
      <Link href="/" className="text-2xl font-black text-[#ff8012] tracking-tight">
        DIPLOM
      </Link>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-1 rounded-lg hover:bg-gray-800 transition"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={28} className="text-white" /> : <Menu size={28} className="text-white" />}
      </button>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-16 left-0 w-full bg-[#1a1a2e] border-b border-gray-700 shadow-lg z-40 py-2 px-4"
        >
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
          <Link
            href="/login"
            className="block py-2 text-sm font-medium text-gray-300 hover:text-[#ff8012] transition"
            onClick={() => setIsMenuOpen(false)}
          >
            Логин
          </Link>
        </div>
      )}
    </header>
  );
}