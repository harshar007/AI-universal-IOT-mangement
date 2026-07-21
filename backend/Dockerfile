# Use the official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to utilize Docker build caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose port 5000 (which Express is configured to run on)
EXPOSE 5000

# Set environment variable defaults
ENV NODE_ENV=production
ENV PORT=5000

# Run the server using Node directly for better signal handling (SIGTERM, etc.)
CMD ["node", "server.js"]
