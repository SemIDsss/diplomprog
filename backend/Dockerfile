# backend/Dockerfile
FROM node:20-alpine

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файлы зависимостей бэкенда
COPY backend/package*.json ./backend/
# Копируем схему Prisma из корня проекта
COPY prisma ./prisma/

# Переходим в папку бэкенда и устанавливаем все пакеты, включая Prisma
WORKDIR /app/backend
RUN npm install

# Генерируем клиент Prisma, используя точный путь к схеме внутри контейнера
RUN npx prisma generate --schema=../prisma/schema.prisma

# Копируем весь остальной код бэкенда
COPY backend/ ./

# Компилируем TypeScript в JavaScript
RUN npx tsc

# Открываем порт, который слушает ваш сервер Express
EXPOSE 4000

# Команда для запуска готового сервера
CMD ["node", "dist/server.js"]
