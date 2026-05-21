# /Dockerfile (в корне проекта)
FROM node:22-alpine

WORKDIR /app

# 1. Копируем конфигурации и схему
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# 2. Устанавливаем все зависимости бэкенда
WORKDIR /app/backend
RUN npm install

# 3. Копируем исходный код бэкенда
COPY backend/ ./

# 4. Компилируем TypeScript в JavaScript
# Флаг --skipLibCheck игнорирует проверку типов Prisma на этапе компиляции, предотвращая сбои сборки
RUN npx tsc --skipLibCheck

EXPOSE 4000

# 5. ИСПРАВЛЕНО: Генерируем типы Prisma ПРЯМО В МОМЕНТ СТАРТА контейнера в облаке, а затем запускаем сервер
CMD ["sh", "-c", "npx prisma generate --schema=../prisma/schema.prisma && node dist/server.js"]

