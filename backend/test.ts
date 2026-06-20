import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Подключение к БД успешно!');
  } catch (error) {
    console.error('❌ Ошибка подключения:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();