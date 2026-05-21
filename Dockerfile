# /Dockerfile (в корне проекта)
FROM node:20-alpine

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем конфигурационные файлы бэкенда и глобальную схему
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# Переходим в директорию бэкенда и устанавливаем зависимости
WORKDIR /app/backend
RUN npm install

# Генерируем клиент Prisma
RUN npx prisma generate --schema=../prisma/schema.prisma

# Копируем весь остальной исходный код бэкенда
COPY backend/ ./

# Компилируем TypeScript в JavaScript
RUN npx tsc

# Открываем порт Express сервера
EXPOSE 4000

# Команда для запуска бэкенда
CMD ["node", "dist/server.js"]
