import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Маркетплейс TECHMARKET',
  description: 'Покупка и продажа гаджетов с расчетом логистики',
  appleWebApp: {
    capable: true,
    title: 'TechMarket',
    statusBarStyle: 'default',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <head>
        <link 
          rel="manifest" 
          href="/manifest.json" 
          crossOrigin="use-credentials" 
        />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-slate-50 min-h-screen antialiased text-slate-900 flex flex-col w-full font-sans pb-16 md:pb-0 m-0 p-0">
        
        {/* ВЕРХНИЙ ХЕДЕР: Навигация для десктопов (md:) по Главе 1.4.3 */}
        <header className="hidden md:block w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link 
              href="/" 
              className="text-xl font-black text-blue-600 tracking-tight"
            >
              ⚡ TECH<span className="text-slate-800">MARKET</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-bold text-slate-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">Главная</Link>
              <Link href="/catalog" className="hover:text-blue-600 transition-colors">Каталог</Link>
              <Link href="/profile" className="text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all">
                Личный кабинет
              </Link>
            </nav>
          </div>
        </header>

        {/* ОСНОВНОЙ КОНТЕНТ СТРАНИЦЫ */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col items-center">
          {children}
        </main>

        {/* НИЖНИЙ ТАББАР (Bottom Navigation): Глава 1.4.3 диплома */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-lg flex items-center justify-around z-50 px-2">
          <Link 
            href="/" 
            className="flex flex-col items-center justify-center text-slate-600 min-w-[44px] min-h-[44px] hover:text-blue-600 transition-colors"
          >
            <span className="text-xs font-bold mt-1">Главная</span>
          </Link>
          <Link 
            href="/catalog" 
            className="flex flex-col items-center justify-center text-slate-600 min-w-[44px] min-h-[44px] hover:text-blue-600 transition-colors"
          >
            <span className="text-xs font-bold mt-1">Каталог</span>
          </Link>
          <Link 
            href="/profile" 
            className="flex flex-col items-center justify-center text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 min-w-[44px] min-h-[44px] hover:bg-blue-100 transition-all"
          >
            <span className="text-xs font-black">Профиль</span>
          </Link>
        </nav>

      </body>
    </html>
  );
}

