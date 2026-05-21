'use client';
import { useState } from 'react';
import Link from 'next/link';

// Массив данных для элементов гармошки (картинки, названия категорий и ссылки на них)
const categories = [
  {
    id: 1,
    title: 'Смартфоны',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzdcFZreZ2C323-11Vcp7lvf6M3cQr7ytA_g&s',
    link: '/catalog?category=Смартфоны'
  },
  {
    id: 2,
    title: 'Ноутбуки',
    image: 'https://caseguru.ru/upload/resize_cache/dev2fun_opengraph/960/1200_1200_1/qbfet0bru7rz729l4g7w8jmg000ion4u.png',
    link: '/catalog?category=Ноутбуки'
  },
  {
    id: 3,
    title: 'Аксессуары',
    image: 'https://imgproxy.cdn-tinkoff.ru/t_device_1920_x2/aHR0cHM6Ly9wdWJsaWMtc3RhdGljLnRpbmtvZmZqb3VybmFsLnJ1L2RvbHlhbWUvdXBsb2Fkcy8yMDI0LzAzL0NMOWxaWDlOLWNvdmVyLWgucG5n',
    link: '/catalog?category=Аксессуары'
  },
  {
    id: 4,
    title: 'Аудио',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-o_rHOUlatg3SOA2uAiBqXg8RiltwRhFiow&s',
    link: '/catalog?category=Аудио'
  }
];

export default function HomePage() {
  // Состояние для хранения ID активного (раскрытого) слайда гармошки (по умолчанию раскрыт первый)
  const [activeId, setActiveId] = useState<number>(1);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      
    
      <main style={{ marginTop: '50px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '42px', marginBottom: '20px' }}>Современная техника с быстрой доставкой</h2>
        <p style={{ color: '#666', fontSize: '18px', marginBottom: '40px' }}>
          Интеграция с 1С обеспечивает актуальные остатки, СДЭК и Boxberry — быструю логистику, а ЮKassa — безопасность платежей.
        </p>

        {/* ИНТЕРАКТИВНАЯ ГАРМОШКА ИЗ КЛИКАБЕЛЬНЫХ ИЗОБРАЖЕНИЙ */}
        <div style={{ 
          display: 'flex', 
          width: '100%', 
          height: '400px', 
          gap: '10px', 
          marginBottom: '50px',
          overflow: 'hidden'
        }}>
          {categories.map((cat) => {
            const isActive = activeId === cat.id;
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveId(cat.id)} // Раскрытие при наведении мыши
                onClick={() => setActiveId(cat.id)}      // Поддержка раскрытия по клику на тачскринах
                style={{
                  flex: isActive ? 3 : 0.7, // Активный слайд занимает в 4 раза больше места
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'flex 0.5s cubic-bezier(0.25, 1, 0.5, 1)', // Плавная анимация расширения
                  boxShadow: isActive ? '0 10px 20px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                {/* Компонент-ссылка вокруг изображения делает всю область карточки кликабельной */}
                <Link href={cat.link} style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none' }}>
                  {/* Изображение категории */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${cat.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: isActive ? 'brightness(90%)' : 'brightness(60%)', // Неактивные слайды немного затемняются
                    transition: 'filter 0.5s ease'
                  }} />
                  
                  {/* Текстовая плашка на карточке */}
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                    color: 'white',
                    textAlign: 'left',
                    textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                    pointerEvents: 'none' // Пропускает клики сквозь текст на родительскую ссылку
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: isActive ? '24px' : '16px', // Текст увеличивается при раскрытии карточки
                      fontWeight: 'bold',
                      transition: 'font-size 0.3s ease',
                      whiteSpace: 'nowrap'
                    }}>
                      {cat.title}
                    </h3>
                    {isActive && (
                      <span style={{ 
                        display: 'block', 
                        marginTop: '5px', 
                        fontSize: '14px', 
                        opacity: 0.8,
                        animation: 'fadeIn 0.5s ease forwards'
                      }}>
                        Смотреть товары →
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* CSS-анимация для плавного появления подписи "Смотреть товары" */}
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 0.8; transform: translateY(0); }
          }
        `}</style>

        <Link href="/catalog" style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px 24px', borderRadius: '6px', fontSize: '18px', textDecoration: 'none', fontWeight: 'bold' }}>
          Открыть весь каталог
        </Link>
      </main>
    </div>
  );
}

