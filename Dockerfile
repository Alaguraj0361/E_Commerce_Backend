FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and configuration
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to dist
RUN npm run build

# Ensure uploads directory exists
RUN mkdir -p uploads

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
