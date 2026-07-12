FROM node:20-alpine

WORKDIR /app

# Cài dependencies (tận dụng cache layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src
COPY database ./database

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
