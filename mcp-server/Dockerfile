FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5007

ENV NODE_ENV=production
ENV MCP_TRANSPORT=sse
ENV PORT=5007

CMD ["node", "src/index.js", "--transport=sse", "--port=5007"]
