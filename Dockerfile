# === ЭТАП 1: СБОРКА СИСТЕМЫ (BUILDER) ===
FROM node:22-alpine AS builder
WORKDIR /app

# Устанавливаем зависимости для сборки нативных бинарников Node.js
RUN apk add --no-cache libc6-compat

# Копируем файлы конфигурации и пакетного менеджера Yarn
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Чистая установка всех зависимостей (включая devDependencies для сборки)
RUN yarn install --frozen-lockfile

# Копируем исходный код проекта
COPY . .

# Принудительная генерация типов Prisma под вашу NoSQL MongoDB схему
RUN yarn prisma:generate

# Создаем оптимизированный промышленный Production Build Next.js 15
RUN yarn build

# === ЭТАП 2: ЗАПУСК СИСТЕМЫ (RUNNER) ===
FROM node:22-alpine AS runner
WORKDIR /app

# Переводим систему в режим промышленной эксплуатации
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.5.0"

# Копируем из первого этапа только те файлы, которые нужны для работы (без исходного кода)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Открываем порт для сетевого трафика
EXPOSE 3000

# Запуск долгоживущего Node.js процесса
CMD ["yarn", "start"]
