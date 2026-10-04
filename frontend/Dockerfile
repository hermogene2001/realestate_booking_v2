# Production Frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src/
COPY public ./public/
COPY next.config.js ./
COPY tsconfig.json ./

# Build Next.js app
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.next ./.next/
COPY --from=builder /app/public ./public/
COPY --from=builder /app/node_modules ./node_modules/

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
