# /Dockerfile (в корне проекта)
# ИСПРАВЛЕНО: Переходим на Node.js 22, который официально требует Prisma 7
FROM node:22-alpine

WORKDIR /app

# 1. Копируем конфигурации бэкенда и глобальную схему Prisma
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# 2. Устанавливаем все зависимости бэкенда
WORKDIR /app/backend
RUN npm install

# 3. Копируем весь исходный код бэкенда в контейнер
COPY backend/ ./

# 4. ИСПРАВЛЕНО: Жестко ставим клиент и запускаем генерацию в одном слое
RUN npm install @prisma/client prisma && npx prisma generate --schema=../prisma/schema.prisma

# 5. Компилируем TypeScript в JavaScript
RUN npx tsc

EXPOSE 4000

CMD ["node", "dist/server.js"]
