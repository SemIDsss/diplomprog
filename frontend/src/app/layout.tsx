import Link from 'next/link';
import { ReactNode } from 'react';

export const metadata = {
  title: 'TechStore - Магазин электроники',
  description: 'Интеграция с 1С, СДЭК и ЮKassa',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* 🔹 ШАПКА САЙТА (HEADER) */}
        <header style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 1000 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '22px', fontWeight: 'bold', letterSpacing: '1px' }}>
              ⚡ TechStore
            </Link>
            <nav style={{ display: 'flex', gap: '25px' }}>
              <Link href="/" style={{ color: '#ccc', textDecoration: 'none', fontWeight: '500' }}>Главная</Link>
              <Link href="/catalog" style={{ color: '#ccc', textDecoration: 'none', fontWeight: '500' }}>Каталог</Link>
              <Link href="/profile" style={{ color: '#ccc', textDecoration: 'none', fontWeight: '500' }}>Личный кабинет</Link>
            </nav>
          </div>
        </header>

        {/* 🔹 ОСНОВНОЙ КОНТЕНТ СТРАНИЦЫ */}
        <main style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
          {children}
        </main>

        {/* 🔹 ПОДВАЛ САЙТА (FOOTER) */}
        <footer style={{ backgroundColor: '#1a1a1a', color: '#888', padding: '40px 20px', borderTop: '1px solid #333', fontSize: '14px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            <div>
              <h4 style={{ color: 'white', marginBottom: '15px' }}>О магазине</h4>
              <p style={{ lineHeight: '1.6' }}>Современный e-commerce сервис с полной автоматизацией склада через 1С, быстрой доставкой СДЭК и защищенными платежами ЮKassa.</p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '15px' }}>Контакты связи</h4>
              <p>📞 Тел: <a href="tel:+78005553535" style={{ color: '#0070f3', textDecoration: 'none' }}>+7 (###) #########</a></p>
              <p>✉️ Email: <a href="mailto:support@techstore.ru" style={{ color: '#0070f3', textDecoration: 'none' }}>###@.ru</a></p>
              <p>📍 Адрес: г. Нижний новгород</p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '15px' }}>Режим работы</h4>
              <p>Прием заказов: Круглосуточно 24/7</p>
              <p>Техническая поддержка: С 09:00 до 21:00 (МСК)</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #333', color: '#555' }}>
            © {new Date().getFullYear()} TechStore. Все права защищены. Развернуто в Docker.
          </div>
        </footer>

      </body>
    </html>
  );
}
