-- ============================================
-- 1. Удаляем старые данные
-- ============================================
DELETE FROM products;
DELETE FROM subcategories;
DELETE FROM categories;

-- ============================================
-- 2. Создаём категории (без createdAt/updatedAt)
-- ============================================
INSERT INTO categories (id, name) VALUES 
  (gen_random_uuid()::text, 'Книги'),
  (gen_random_uuid()::text, 'Мебель'),
  (gen_random_uuid()::text, 'Игрушки');

-- ============================================
-- 3. Создаём подкатегории (без createdAt/updatedAt)
-- ============================================
WITH category_ids AS (
  SELECT id, name FROM categories
)
INSERT INTO subcategories (id, name, "categoryId") 
SELECT 
  gen_random_uuid()::text,
  sub.name,
  cat.id
FROM category_ids cat
CROSS JOIN LATERAL (
  VALUES 
    ('Фантастика'),
    ('Классика')
) AS sub(name)
WHERE cat.name = 'Книги'
UNION ALL
SELECT 
  gen_random_uuid()::text,
  sub.name,
  cat.id
FROM category_ids cat
CROSS JOIN LATERAL (
  VALUES 
    ('Стулья'),
    ('Столы')
) AS sub(name)
WHERE cat.name = 'Мебель'
UNION ALL
SELECT 
  gen_random_uuid()::text,
  sub.name,
  cat.id
FROM category_ids cat
CROSS JOIN LATERAL (
  VALUES 
    ('Мягкие игрушки'),
    ('Конструкторы')
) AS sub(name)
WHERE cat.name = 'Игрушки';

-- ============================================
-- 4. Создаём товары (с createdAt и updatedAt)
-- ============================================
WITH subcategory_ids AS (
  SELECT id, name FROM subcategories
)
INSERT INTO products (id, title, description, price, status, "subcategoryId", "createdAt", "updatedAt") 
SELECT 
  gen_random_uuid()::text,
  product.title,
  product.description,
  product.price,
  'APPROVED',
  sub.id,
  NOW(),
  NOW()
FROM subcategory_ids sub
CROSS JOIN LATERAL (
  VALUES 
    ('1984', 'Культовый роман Джорджа Оруэлла', 450),
    ('Преступление и наказание', 'Великий роман Федора Достоевского', 350)
) AS product(title, description, price)
WHERE sub.name = 'Фантастика'
UNION ALL
SELECT 
  gen_random_uuid()::text,
  product.title,
  product.description,
  product.price,
  'APPROVED',
  sub.id,
  NOW(),
  NOW()
FROM subcategory_ids sub
CROSS JOIN LATERAL (
  VALUES 
    ('Война и мир', 'Эпопея Льва Толстого', 500),
    ('Мастер и Маргарита', 'Мистический роман Михаила Булгакова', 400)
) AS product(title, description, price)
WHERE sub.name = 'Классика'
UNION ALL
SELECT 
  gen_random_uuid()::text,
  product.title,
  product.description,
  product.price,
  'APPROVED',
  sub.id,
  NOW(),
  NOW()
FROM subcategory_ids sub
CROSS JOIN LATERAL (
  VALUES 
    ('Деревянный стул', 'Стул из массива дуба', 2500),
    ('Офисное кресло', 'Удобное кресло с подлокотниками', 3500)
) AS product(title, description, price)
WHERE sub.name = 'Стулья'
UNION ALL
SELECT 
  gen_random_uuid()::text,
  product.title,
  product.description,
  product.price,
  'APPROVED',
  sub.id,
  NOW(),
  NOW()
FROM subcategory_ids sub
CROSS JOIN LATERAL (
  VALUES 
    ('Письменный стол', 'Стол с ящиками для работы', 4500),
    ('Журнальный столик', 'Стеклянный столик для гостиной', 2800)
) AS product(title, description, price)
WHERE sub.name = 'Столы'
UNION ALL
SELECT 
  gen_random_uuid()::text,
  product.title,
  product.description,
  product.price,
  'APPROVED',
  sub.id,
  NOW(),
  NOW()
FROM subcategory_ids sub
CROSS JOIN LATERAL (
  VALUES 
    ('Мишка плюшевый', 'Мягкая игрушка 50 см', 1200),
    ('Зайка', 'Плюшевый заяц 40 см', 900)
) AS product(title, description, price)
WHERE sub.name = 'Мягкие игрушки'
UNION ALL
SELECT 
  gen_random_uuid()::text,
  product.title,
  product.description,
  product.price,
  'APPROVED',
  sub.id,
  NOW(),
  NOW()
FROM subcategory_ids sub
CROSS JOIN LATERAL (
  VALUES 
    ('LEGO Город', 'Конструктор с 500 деталями', 3500),
    ('LEGO Космос', 'Конструктор с 300 деталями', 2500)
) AS product(title, description, price)
WHERE sub.name = 'Конструкторы';

-- ============================================
-- 5. Проверяем результат
-- ============================================
SELECT '✅ Категории:' as info, COUNT(*) as count FROM categories
UNION ALL
SELECT '✅ Подкатегории:', COUNT(*) FROM subcategories
UNION ALL
SELECT '✅ Товары:', COUNT(*) FROM products;