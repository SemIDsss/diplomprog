# /Dockerfile (в корне проекта)
FROM node:22-alpine

WORKDIR /app

# 1. Копируем конфигурации и схему
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# 2. Устанавливаем базовые пакеты бэкенда
WORKDIR /app/backend
RUN npm install

# 3. Копируем исходный код бэкенда
COPY backend/ ./

# 4. Генерируем типы Prisma в стандартную системную директорию node_modules
RUN npx prisma generate --schema=../prisma/schema.prisma

# 5. Компилируем TypeScript в JavaScript
RUN npx tsc

EXPOSE 4000

CMD ["node", "dist/server.js"]
