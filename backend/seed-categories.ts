import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем создание категорий...');

  // Проверяем, есть ли уже категории
  const existing = await prisma.category.findMany();
  if (existing.length > 0) {
    console.log('⚠️ Категории уже существуют. Пропускаем.');
    return;
  }

  // Создаём категории
  const categories = await prisma.$transaction([
    prisma.category.create({ data: { name: 'Книги' } }),
    prisma.category.create({ data: { name: 'Мебель' } }),
    prisma.category.create({ data: { name: 'Игрушки' } }),
  ]);

  console.log(`✅ Создано ${categories.length} категорий:`);
  categories.forEach(c => console.log(`   - ${c.name} (${c.id})`));

  // Создаём подкатегории
  const books = categories[0];
  const furniture = categories[1];
  const toys = categories[2];

  const subcategories = await prisma.$transaction([
    prisma.subcategory.create({ data: { name: 'Фантастика', categoryId: books.id } }),
    prisma.subcategory.create({ data: { name: 'Классика', categoryId: books.id } }),
    prisma.subcategory.create({ data: { name: 'Стулья', categoryId: furniture.id } }),
    prisma.subcategory.create({ data: { name: 'Столы', categoryId: furniture.id } }),
    prisma.subcategory.create({ data: { name: 'Мягкие игрушки', categoryId: toys.id } }),
    prisma.subcategory.create({ data: { name: 'Конструкторы', categoryId: toys.id } }),
  ]);

  console.log(`✅ Создано ${subcategories.length} подкатегорий:`);
  subcategories.forEach(s => console.log(`   - ${s.name} (категория: ${categories.find(c => c.id === s.categoryId)?.name})`));

  console.log('🎉 Категории и подкатегории успешно созданы!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });