# ====================================================================
# Smart Agro (স্মার্ট এগ্রো) - Production Dockerfile
# ====================================================================

FROM node:18-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies with production flag
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Ensure uploads directory exists and is writable
RUN mkdir -p public/uploads && chmod 777 public/uploads

# Environment settings
ENV NODE_ENV=production
ENV PORT=3000

# Expose HTTP port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start server
CMD ["node", "server.js"]

