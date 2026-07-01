# ── Stage 1: Build Frontend ──
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY web-admin/package*.json ./
RUN npm install --include=dev
COPY web-admin/ .
ENV VITE_API_URL=/api
RUN npm run build

# ── Stage 2: Build Backend ──
FROM node:22-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --include=dev
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/ .
RUN npm run build

# ── Stage 3: Runner ──
FROM node:22-alpine
WORKDIR /app

# Install Nginx and OpenSSL
RUN apk add --no-cache nginx openssl

# Create nginx run directory
RUN mkdir -p /run/nginx

# Copy built backend files and dependencies
COPY --from=backend-builder /app/package*.json ./
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=backend-builder /app/uploads ./uploads

# Copy built frontend assets to nginx public folder
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy configuration files
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY entrypoint.sh ./

RUN chmod +x entrypoint.sh

EXPOSE 80

CMD ["./entrypoint.sh"]
