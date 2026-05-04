# ── Stage 1: Build the Vite app ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Leverage layer caching — only re-run npm install if manifests change
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# VITE_API_URL is injected at build time via --build-arg in docker-compose
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove the default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy the Vite production build
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config: forwards unknown routes to index.html for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
