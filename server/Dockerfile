# Stage 1: install dependencies
FROM node:18-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --production

# Stage 2: copy source & start
FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
EXPOSE 3000

RUN chmod +x ./entrypoint.sh

CMD ["./entrypoint.sh"]