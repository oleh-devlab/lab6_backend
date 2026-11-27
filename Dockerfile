ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

# Спершу лише маніфести: шар із залежностями перебудовується тільки тоді,
# коли змінюються package*.json, а не при кожній правці коду.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Запускати сервер не від root.
USER node

# Решта файлів проєкту (без того, що перелічено в .dockerignore).
COPY . .

EXPOSE 8080

CMD ["node", "main.js"]
