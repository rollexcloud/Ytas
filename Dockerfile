# --- Build stage -------------------------------------------------------
FROM node:20-slim AS builder

# Avoid puppeteer auto-downloading Chromium during npm install.
# We will use the distro package instead in the runtime stage.
ENV PUPPETEER_SKIP_DOWNLOAD=1

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build the project
COPY . ./
RUN npm run build

# --- Runtime stage -----------------------------------------------------
FROM node:20-slim

LABEL org.opencontainers.image.source="https://github.com/your/repository"

# Install Chromium & necessary libs for Puppeteer
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    dumb-init \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=8080

WORKDIR /app

# Copy built artefacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
