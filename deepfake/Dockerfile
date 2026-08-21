# Stage 1: Build Server & Client
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package manifests
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install --prefix server
RUN npm install --prefix client

# Copy application source code
COPY server ./server
COPY client ./client

# Generate Prisma Client & Build TypeScript code
RUN npm --prefix server run prisma:generate
RUN npm --prefix server run build
RUN npm --prefix client run build

# Stage 2: Production Container Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
