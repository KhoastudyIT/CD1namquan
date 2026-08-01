# ── Build stage ──────────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# URL API được nhúng lúc build (Vite import.meta.env.VITE_API_URL)
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Serve stage (nginx tĩnh) ─────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
