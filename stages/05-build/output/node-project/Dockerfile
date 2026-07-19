FROM node:24-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --global npm@11.6.2 && npm ci

COPY tsconfig.json ./
COPY migrations ./migrations
COPY public ./public
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000
USER node

CMD ["npm", "start"]
