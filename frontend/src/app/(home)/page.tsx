'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { menuItems } from '@/constants/navigation';

const images = {
  group32: '/images/group-3-2.png',
  group12112: '/images/group-1-2-1-1-2.png',
  group31: '/images/group-3-1.png',
  group12111: '/images/group-1-2-1-1-1.png',
  group41: '/images/group-4-1.png',
  image2: '/images/image-2.png',
};

// Интерфейс для блока с контактами
interface BottomBlock {
  top: number;
  left: number;
  width: number;
  height: number;
  content: string;
}

// Интерфейс для конфигурации экрана
interface Config {
  width: number;
  height: number;
  decorativeImages: { src: string; top: number; left: number; width: number; height: number; }[];
  bottomBlock?: BottomBlock; // необязательное поле
  buttonLeft: number;
  buttonWidth: number;
  buttonHeight: number;
  buttonGap: number;
  buttonStartTop: number;
  fontSize: string;
}

const configs: Record<string, Config> = {
  '3840': {
    width: 3840,
    height: 2160,
    decorativeImages: [
      { src: images.group32, top: 80, left: 1204, width: 1457, height: 1624 },
      { src: images.group12112, top: 553, left: 2362, width: 1478, height: 1607 },
    ],
    bottomBlock: {
      top: 1800,
      left: 1210,
      width: 1445,
      height: 297,
      content: '📞 +7 +7 (#########)\n✉️ andr.semidark@yandex.ru\n Нижний Новгород'
    },
    buttonLeft: 96,
    buttonWidth: 984,
    buttonHeight: 177,
    buttonGap: 258,
    buttonStartTop: 337,
    fontSize: 'text-4xl',
  },
  '2560': {
    width: 2560,
    height: 1440,
    decorativeImages: [
      { src: images.group32, top: 80, left: 857, width: 935, height: 1042 },
      { src: images.group12112, top: 409, left: 1612, width: 948, height: 1031 },
    ],
    bottomBlock: {
      top: 1173,
      left: 857,
      width: 935,
      height: 227,
      content: '📞 +7 (#########)\n✉️ andr.semidark@yandex.ru\n Нижний Новгород'
    },
    buttonLeft: 73,
    buttonWidth: 637,
    buttonHeight: 112,
    buttonGap: 163,
    buttonStartTop: 244,
    fontSize: 'text-3xl',
  },
  '1920': {
    width: 1920,
    height: 1080,
    decorativeImages: [
      { src: images.group32, top: 68, left: 693, width: 667, height: 743 },
      { src: images.group12112, top: 345, left: 1244, width: 676, height: 735 },
    ],
    bottomBlock: {
      top: 850,
      left: 693,
      width: 667,
      height: 160,
      content: '📞 +7 (#########)\n✉️ andr.semidark@yandex.ru\n Нижний Новгород'
    },
    buttonLeft: 68,
    buttonWidth: 461,
    buttonHeight: 79,
    buttonGap: 115,
    buttonStartTop: 183,
    fontSize: 'text-2xl',
  },
  '1440': {
    width: 1440,
    height: 1024,
    decorativeImages: [
      { src: images.group32, top: 57, left: 436, width: 654, height: 729 },
      { src: images.group12112, top: 507, left: 964, width: 476, height: 517 },
    ],
    bottomBlock: {
      top: 830,
      left: 436,
      width: 654,
      height: 150,
      content: '📞 +7 (#########)\n✉️ andr.semidark@yandex.ru\n Нижний Новгород'
    },
    buttonLeft: 35,
    buttonWidth: 359,
    buttonHeight: 79,
    buttonGap: 115,
    buttonStartTop: 172,
    fontSize: 'text-2xl',
  },
  '1366': {
    width: 1366,
    height: 768,
    decorativeImages: [
      { src: images.group32, top: 62, left: 470, width: 493, height: 550 },
      { src: images.group12112, top: 227, left: 850, width: 516, height: 541 },
    ],
    bottomBlock: {
      top: 640,
      left: 470,
      width: 493,
      height: 110,
      content: '📞  +7 (#########)\n✉️ andr.semidark@yandex.ru\n Нижний Новгород'
    },
    buttonLeft: 41,
    buttonWidth: 349,
    buttonHeight: 64,
    buttonGap: 93,
    buttonStartTop: 156,
    fontSize: 'text-xl',
  },
  '1280': {
    width: 1280,
    height: 720,
    decorativeImages: [
      { src: images.group32, top: 44, left: 436, width: 454, height: 506 },
      { src: images.group12112, top: 215, left: 810, width: 470, height: 505 },
    ],
    // bottomBlock отсутствует
    buttonLeft: 32,
    buttonWidth: 328,
    buttonHeight: 56,
    buttonGap: 82,
    buttonStartTop: 132,
    fontSize: 'text-xl',
  },
  '1024': {
    width: 1024,
    height: 768,
    decorativeImages: [
      { src: images.group32, top: 40, left: 339, width: 441, height: 492 },
      { src: images.group12112, top: 404, left: 670, width: 353, height: 364 },
    ],
    bottomBlock: {
      top: 596,
      left: 339,
      width: 441,
      height: 139,
      content: '📞  +7 (#########)\n✉️ andr.semidark@yandex.ru\n Нижний Новгород'
    },
    buttonLeft: 21,
    buttonWidth: 269,
    buttonHeight: 65,
    buttonGap: 95,
    buttonStartTop: 135,
    fontSize: 'text-lg',
  },
};

export default function HomePage() {
  const router = useRouter();
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [desktopScale, setDesktopScale] = useState(1);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (windowWidth >= 1024 && windowWidth > 0 && windowHeight > 0) {
      let cfg;
      if (windowWidth >= 3840) cfg = configs['3840'];
      else if (windowWidth >= 2560) cfg = configs['2560'];
      else if (windowWidth >= 1920) cfg = configs['1920'];
      else if (windowWidth >= 1440) cfg = configs['1440'];
      else if (windowWidth >= 1366) cfg = configs['1366'];
      else if (windowWidth >= 1280) cfg = configs['1280'];
      else if (windowWidth >= 1024) cfg = configs['1024'];

      if (cfg) {
        const { width, height } = cfg;
        const scaleX = windowWidth / width;
        const scaleY = windowHeight / height;
        const newScale = Math.min(scaleX, scaleY, 1.2);
        setDesktopScale(Math.max(newScale, 0.5));
      }
    }
  }, [windowWidth, windowHeight]);

  let config: Config | undefined;
  if (windowWidth >= 3840) config = configs['3840'];
  else if (windowWidth >= 2560) config = configs['2560'];
  else if (windowWidth >= 1920) config = configs['1920'];
  else if (windowWidth >= 1440) config = configs['1440'];
  else if (windowWidth >= 1366) config = configs['1366'];
  else if (windowWidth >= 1280) config = configs['1280'];
  else if (windowWidth >= 1024) config = configs['1024'];

  // ==================== МОБИЛЬНАЯ ВЕРСИЯ ====================
  if (windowWidth < 1024 || !config) {
    const goToCatalog = () => router.push('/catalog');
    const goToAbout = () => router.push('/about');

    const imageLayers = [
      {
        src: images.group31,
        alt: 'Illustration background with paw prints and heart',
        className:
          'absolute top-[20.4%] left-[1%] w-[92.5%] h-[47.5%] object-cover',
        onClick: goToCatalog,
      },
      {
        src: images.group12111,
        alt: 'Decorative lower illustration',
        className:
          'absolute top-[57.1%] left-[14.2%] w-[85.8%] h-[42.9%] object-cover',
      },
      {
        src: images.group41,
        alt: 'Decorative bottom-left paw element',
        className:
          'absolute top-[88.6%] left-0 w-[28.1%] h-[9.3%] object-cover',
        onClick: goToAbout,
      },
      {
        src: images.image2,
        alt: 'Heart illustration',
        className:
          'absolute top-[31.6%] left-[24.6%] w-[52%] h-[23.9%] object-cover',
        onClick: goToCatalog,
      },
    ];

    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col overflow-hidden">
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
          <div
            ref={menuRef}
            className="fixed top-16 left-0 w-full bg-[#1a1a2e] border-b border-gray-700 shadow-lg z-40 py-2 px-4"
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
          </div>
        )}
        <div className="flex-1 flex items-end justify-start pl-4">
          <div className="relative w-full aspect-[402/874] bg-[#1a1a2e] overflow-hidden shadow-2xl">
            {imageLayers.map((layer, idx) => (
              <div
                key={idx}
                className={layer.className}
                onClick={layer.onClick}
                style={{ position: 'absolute', cursor: layer.onClick ? 'pointer' : 'default' }}
              >
                <Image
                  src={layer.src}
                  alt={layer.alt}
                  fill
                  className="object-cover pointer-events-none select-none"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  draggable={false}
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== ДЕСКТОПНАЯ ВЕРСИЯ ====================
  const {
    width,
    height,
    decorativeImages,
    bottomBlock = null, // теперь тип BottomBlock | null
    buttonLeft,
    buttonWidth,
    buttonHeight,
    buttonGap,
    buttonStartTop,
    fontSize,
  } = config;

  const buttonTops = Array.from({ length: 6 }, (_, i) => buttonStartTop + i * buttonGap);

  return (
    <main className="bg-gray-100 w-full h-screen flex items-center justify-center overflow-hidden">
      <div
        className="relative bg-white overflow-hidden shadow-2xl flex-shrink-0"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${desktopScale})`,
          transformOrigin: 'center center',
        }}
      >
        <header className="absolute top-0 left-0 w-full z-40 bg-[#1a1a2e] text-white flex items-center justify-between px-8 py-3 border-b border-gray-700 h-16">
          <Link href="/" className="text-2xl font-black tracking-tight hover:text-[#ff8012] transition">
            DIPLOM
          </Link>
          <div>
            {user ? (
              <span className="text-sm font-medium text-gray-300">{user.email || 'Профиль'}</span>
            ) : (
              <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-[#ff8012] transition">
                Войти
              </Link>
            )}
          </div>
        </header>

        <nav aria-label="Primary navigation" className="absolute inset-0">
          <ul className="m-0 p-0 list-none relative w-full h-full">
            {menuItems.map((item, index) => {
              const top = buttonTops[index];
              return (
                <li key={item.href} style={{ position: 'absolute', left: `${buttonLeft}px`, top: `${top}px` }}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-center bg-[#ff8012] text-white font-bold shadow-lg hover:bg-[#e06a00] transition-colors duration-200 rounded-[30px] ${fontSize}`}
                    style={{
                      width: `${buttonWidth}px`,
                      height: `${buttonHeight}px`,
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {decorativeImages.map((img, idx) => (
          <img
            key={idx}
            className="absolute object-cover pointer-events-none select-none"
            style={{
              top: `${img.top}px`,
              left: `${img.left}px`,
              width: `${img.width}px`,
              height: `${img.height}px`,
            }}
            src={img.src}
            alt=""
            aria-hidden="true"
          />
        ))}

        {bottomBlock && (
          <div
            className="absolute bg-[#ff8012] rounded-[30px] pointer-events-none select-none flex items-center justify-center text-white text-sm font-medium whitespace-pre-line text-center"
            style={{
              top: `${bottomBlock.top}px`,
              left: `${bottomBlock.left}px`,
              width: `${bottomBlock.width}px`,
              height: `${bottomBlock.height}px`,
            }}
            aria-hidden="true"
          >
            {bottomBlock.content}
          </div>
        )}
      </div>
    </main>
  );
}