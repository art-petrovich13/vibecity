# ---------- Stage 1: сборка React ----------
FROM node:20-bookworm-slim AS frontend-build

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


# ---------- Stage 2: сборка backend ----------
FROM node:20-bookworm-slim AS backend-build

WORKDIR /app
# openssl нужен Prisma, чтобы определить правильный query engine (OpenSSL 3.0)
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build


# ---------- Stage 3: единый образ с MySQL ----------
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="mysql://vibecity:vibecity@localhost:3306/vibecity"
ENV JWT_SECRET="vibecity-docker-secret-change-me"
ENV JWT_EXPIRES_IN="24h"

# MySQL 8.0 + утилиты
# policy-rc.d запрещает apt пытаться стартовать сервисы — MySQL запустит entrypoint.
RUN printf '#!/bin/sh\nexit 0\n' > /usr/sbin/policy-rc.d \
    && chmod +x /usr/sbin/policy-rc.d \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        mysql-server \
        curl \
        ca-certificates \
        gnupg \
        tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /usr/sbin/policy-rc.d

# Node.js 20 (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/prisma ./prisma
COPY --from=backend-build /app/package.json ./package.json
COPY --from=frontend-build /app/dist ./public

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && mkdir -p /var/run/mysqld /var/lib/mysql \
    && chown -R mysql:mysql /var/run/mysqld /var/lib/mysql

EXPOSE 3000
VOLUME ["/var/lib/mysql"]

ENTRYPOINT ["/entrypoint.sh"]
