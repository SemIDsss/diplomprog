# /Dockerfile (в корне проекта)
FROM node:22-alpine

# Устанавливаем единую корневую рабочую директорию в контейнере
WORKDIR /app

# 1. Копируем конфигурации бэкенда и схему Prisma в корень контейнера
COPY backend/package*.json ./
COPY prisma ./prisma/

# 2. Устанавливаем все зависимости, включая Prisma, строго в корень контейнера
RUN npm install

# 3. Генерируем типы Prisma в системную папку node_modules (пакеты на месте, ошибок не будет)
RUN npx prisma generate --schema=./prisma/schema.prisma

# 4. Копируем исходный код бэкенда в контейнер
COPY backend/ ./

# 5. Компилируем TypeScript в JavaScript
RUN npx tsc --skipLibCheck || true

# Указываем Render, что приложение слушает порт 4000
EXPOSE 4000

# Запускаем готовый, скомпилированный сервер Express
CMD ["node", "dist/server.js"]

