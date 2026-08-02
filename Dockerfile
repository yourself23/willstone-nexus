FROM node:22.23.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001 4242
CMD ["node", "webhook_server.js"]
