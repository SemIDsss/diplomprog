FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma

WORKDIR /app/backend
RUN npm install --registry=https://registry.npmmirror.com

COPY backend/ .
RUN npm run build   # компилируем TypeScript

EXPOSE 5000
CMD ["node", "dist/index.js"]