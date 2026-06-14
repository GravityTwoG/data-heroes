FROM node:24.13.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx watch src/main.ts"]
