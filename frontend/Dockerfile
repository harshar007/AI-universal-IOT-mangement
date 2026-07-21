# Stage 1: Build static assets
FROM node:20-alpine AS build

WORKDIR /app

# Copy package configuration files
COPY package.json package-lock.json ./

# Install dependencies using clean install with legacy peer deps support
RUN npm ci --legacy-peer-deps

# Copy all application source files
COPY . .

# Build the application (Vite outputs to the "dist" directory by default)
RUN npm run build

# Stage 2: Serve assets with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration to support client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from build stage to Nginx default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for traffic
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
