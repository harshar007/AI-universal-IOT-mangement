# Use the official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json first to utilize Docker build caching
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose port 5006
EXPOSE 5006

# Set environment variable defaults
ENV NODE_ENV=production
ENV PORT=5006

# Run the server
CMD ["node", "src/server.js"]
