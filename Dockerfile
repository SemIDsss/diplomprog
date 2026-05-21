# /Dockerfile (в корне проекта)
FROM node:22-alpine

WORKDIR /app

# 1. Копируем конфигурации и схему
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# 2. Устанавливаем базовые зависимости бэкенда
WORKDIR /app/backend
RUN npm install

# 3. Копируем ВЕСЬ исходный код бэкенда в контейнер
COPY backend/ ./

# 4. ИСПРАВЛЕНО: Генерируем типы Prisma внутри рабочей директории бэкенда, где есть локальный @prisma/client
RUN npx prisma generate --schema=../prisma/schema.prisma

# 5. Компилируем TypeScript в JavaScript
RUN npx tsc

EXPOSE 4000

# Запускаем готовый скомпилированный сервер
CMD ["node", "dist/server.js"]
