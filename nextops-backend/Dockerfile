FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

COPY package.json yarn.lock .yarnrc.yml ./
COPY nextops-backend/package.json ./nextops-backend/package.json
COPY node_modules ./node_modules
COPY nextops-backend/dist ./nextops-backend/dist
COPY nextops-backend/src/prisma ./nextops-backend/src/prisma

RUN mkdir -p nextops-backend/uploads
EXPOSE 3001
CMD ["node", "nextops-backend/dist/src/main.js"]
