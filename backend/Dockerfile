FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 ffmpeg curl unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh
WORKDIR /app
ENV NODE_ENV=production TEMP_DOWNLOAD_DIR=/app/downloads
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY backend/package.json ./
RUN mkdir -p downloads && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]