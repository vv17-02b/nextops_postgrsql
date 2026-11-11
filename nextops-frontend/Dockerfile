FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY nextops-frontend/.next/standalone ./
COPY nextops-frontend/.next/static ./nextops-frontend/.next/standalone/nextops-frontend/.next/static
COPY nextops-frontend/public ./nextops-frontend/.next/standalone/nextops-frontend/public

EXPOSE 3000
CMD ["node", "nextops-frontend/server.js"]
