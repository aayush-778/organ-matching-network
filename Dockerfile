# Stage 1: Build dependencies and compile C++
FROM node:20-bullseye AS builder
WORKDIR /app

# Install the C++ compiler tools
RUN apt-get update && apt-get install -y build-essential

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build the C++ engine, then build the Next.js app
RUN npm run build:engine
RUN npm run build

# Stage 2: Production runtime
FROM node:20-bullseye-slim AS runner
WORKDIR /app

# The compiled C++ binary needs standard libraries to run
RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

# Copy only the built assets from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/cpp-engine ./cpp-engine

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start the Next.js server
CMD ["npm", "start"]