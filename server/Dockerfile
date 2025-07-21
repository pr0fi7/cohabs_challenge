# server/Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# install deps
COPY package*.json ./
RUN npm ci

# copy rest of your code
COPY . .

# expose and run
EXPOSE 3000
CMD ["npm", "run", "dev"]   # or ["npm","start"] for prod
