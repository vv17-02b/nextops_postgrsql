FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY nextops-backend/package.json ./nextops-backend/package.json
COPY nextops-frontend/package.json ./nextops-frontend/package.json
RUN yarn install --immutable

FROM deps AS build
COPY . .
ENV DATABASE_URL=postgresql://nextops:build-only@localhost:5432/nextops?schema=public
RUN cd nextops-backend && node node_modules/prisma/build/index.js generate --schema src/prisma/schema.prisma
RUN cd nextops-backend && node node_modules/typescript/bin/tsc -p tsconfig.json

FROM node:22-alpine AS runner

RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/nextops-backend/dist ./nextops-backend/dist
RUN mkdir -p nextops-backend/uploads

EXPOSE 3001
CMD ["node", "nextops-backend/dist/src/main.js"]
