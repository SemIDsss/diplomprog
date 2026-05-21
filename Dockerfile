# /Dockerfile (в корне проекта)
FROM node:22-alpine

WORKDIR /app

# 1. Копируем ТОЛЬКО package.json бэкенда и схему (без lock-файлов, чтобы избежать workspaces)
COPY backend/package.json ./backend/
COPY prisma ./prisma/

# 2. Переходим в папку бэкенда и ставим чистые базовые зависимости
WORKDIR /app/backend
RUN npm install --no-workspaces

# 3. ИСПРАВЛЕНО И ИЗОЛИРОВАНО: Принудительная установка без учета монорепозитория
RUN npm install @prisma/client prisma --no-workspaces && npx prisma generate --schema=../prisma/schema.prisma

# 4. Копируем все остальные файлы проекта
COPY backend/ ./
COPY prisma ../prisma/

# 5. Компилируем TypeScript
RUN npx tsc

EXPOSE 4000

CMD ["node", "dist/server.js"]

