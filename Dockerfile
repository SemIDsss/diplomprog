# /Dockerfile (в корне проекта)
FROM node:22-alpine

WORKDIR /app

# 1. Копируем файлы конфигурации бэкенда и глобальную схему
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# 2. Устанавливаем ВСЕ пакеты бэкенда (включая зависимости из package.json)
WORKDIR /app/backend
RUN npm install

# 3. ИСПРАВЛЕНО: Принудительно устанавливаем @prisma/client и запускаем генерацию 
# строго внутри текущей рабочей директории бэкенда, чтобы пути не терялись
RUN npm install @prisma/client prisma && npx prisma generate --schema=../prisma/schema.prisma

# 4. Копируем весь исходный код бэкенда в контейнер
COPY backend/ ./

# 5. Компилируем TypeScript в JavaScript
RUN npx tsc

EXPOSE 4000

CMD ["node", "dist/server.js"]
