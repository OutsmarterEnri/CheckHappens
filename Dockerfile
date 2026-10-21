FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run build:server

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8787 HOST=0.0.0.0 ROOM_DATA_DIR=/app/.room-data
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/package.json /app/LICENSE /app/THIRD_PARTY_NOTICES.md ./
COPY --from=build /app/licenses ./licenses
RUN mkdir -p /app/.room-data && chown -R node:node /app
USER node
EXPOSE 8787
CMD ["node", "dist-server/index.js"]
