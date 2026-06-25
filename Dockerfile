FROM node:22-alpine

WORKDIR /app

# Копируем package.json и схему Prisma
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma

WORKDIR /app/backend
RUN npm install --registry=https://registry.npmmirror.com

# Копируем весь остальной код
COPY backend/ .

# Генерируем Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 5000

# Запускаем через tsx (без компиляции)
CMD ["npx", "tsx", "src/index.ts"]