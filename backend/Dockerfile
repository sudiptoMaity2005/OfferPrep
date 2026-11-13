# Multi-stage production build for OfferPrep Express Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and backend package definitions
COPY package*.json ./
COPY database/package*.json ./database/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci

# Copy database schema and backend source
COPY database ./database
COPY backend ./backend

# Generate Prisma client and compile TypeScript
WORKDIR /app/database
RUN npx prisma generate

WORKDIR /app/backend
RUN npm run build

# Runtime container
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and built dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/database ./database
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/dist ./dist

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "dist/index.js"]
