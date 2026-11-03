FROM node:22-alpine AS deps

WORKDIR /app
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY nextops-backend/package.json ./nextops-backend/package.json
COPY nextops-frontend/package.json ./nextops-frontend/package.json
RUN yarn install --immutable

FROM deps AS build
COPY . .
ARG BACKEND_URL=http://backend:3001
ENV BACKEND_URL=${BACKEND_URL}
RUN cd nextops-frontend && node node_modules/next/dist/bin/next build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/nextops-frontend/.next ./nextops-frontend/.next
COPY --from=build /app/nextops-frontend/public ./nextops-frontend/public
COPY --from=build /app/nextops-frontend/next.config.ts ./nextops-frontend/next.config.ts
COPY --from=build /app/nextops-frontend/package.json ./nextops-frontend/package.json

WORKDIR /app/nextops-frontend
EXPOSE 3000
CMD ["node", "../node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
