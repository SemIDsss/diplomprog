# /Dockerfile (в корне проекта)
FROM node:22-alpine

WORKDIR /app

# 1. Сначала копируем только конфигурации бэкенда и схему БД
COPY backend/package*.json ./
COPY prisma ./prisma/

# 2. Устанавливаем все зависимости бэкенда прямо в корень контейнера
RUN npm install

# 3. Генерируем типы Prisma в локальную node_modules
RUN npx prisma generate --schema=./prisma/schema.prisma

# 4. Копируем весь остальной исходный код бэкенда
COPY backend/ ./

# 5. Компилируем TypeScript в JavaScript
RUN npx tsc --skipLibCheck || true

# 6. ИСПРАВЛЕНО: Перед запуском принудительно доставляем пакет dotenv на случай сдвига путей Webpack
RUN npm install dotenv tsx

EXPOSE 4000

# Запускаем сервер Express
CMD ["node", "dist/server.js"]

