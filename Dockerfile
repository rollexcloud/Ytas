# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for build
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install all dependencies for building
RUN npm ci

# Copy source code
COPY . .

# Build the client
RUN npx vite build

# Build the production server
RUN npx esbuild server/production-entry.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.js

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install runtime dependencies for video processing
RUN apk add --no-cache \
    ffmpeg

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the production server
CMD ["node", "dist/server.js"]