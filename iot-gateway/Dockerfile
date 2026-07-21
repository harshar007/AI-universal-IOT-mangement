FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files from iot-gateway directory
COPY iot-gateway/package*.json ./

RUN npm install --only=production

# Set NODE_PATH to allow backend imports to resolve node_modules correctly
ENV NODE_PATH=/usr/src/app/node_modules

# Copy gateway source code and backend dependency directory
COPY iot-gateway/ ./
COPY backend/ ../backend/

EXPOSE 5002
EXPOSE 1883

CMD ["node", "src/gateway.js"]
