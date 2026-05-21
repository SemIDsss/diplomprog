# /Dockerfile (в корне проекта)
FROM node:20-alpine

WORKDIR /app

# 1. Копируем конфигурации бэкенда и глобальную схему Prisma
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# 2. Устанавливаем все базовые зависимости бэкенда
WORKDIR /app/backend
RUN npm install

# 3. Копируем ВЕСЬ остальной исходный код бэкенда в контейнер
# Теперь Prisma гарантированно увидит всё файловое окружение
COPY backend/ ./

# 4. Генерируем типы Prisma, принудительно указав кастомную папку вывода
RUN npx prisma generate --schema=../prisma/schema.prisma

# 5. Компилируем TypeScript в JavaScript
RUN npx tsc

EXPOSE 4000

CMD ["node", "dist/server.js"]
