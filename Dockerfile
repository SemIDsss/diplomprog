# /Dockerfile (в корне проекта)
FROM node:22-alpine

WORKDIR /app

# 1. Копируем конфигурации и схему
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# 2. Переходим в папку бэкенда и устанавливаем все пакеты
WORKDIR /app/backend
RUN npm install

# 3. Копируем исходный код бэкенда
COPY backend/ ./
COPY prisma ../prisma/

# 4. Компилируем TypeScript в JavaScript
# Флаг --skipLibCheck предотвратит падение компилятора из-за временного отсутствия типов Prisma
RUN npx tsc --skipLibCheck

EXPOSE 4000

# 5. ИСПРАВЛЕНО: Генерируем типы Prisma ПРЯМО ПЕРЕД запуском сервера, когда контейнер уже стартовал
CMD ["sh", "-c", "npx prisma generate --schema=../prisma/schema.prisma && node dist/server.js"]

