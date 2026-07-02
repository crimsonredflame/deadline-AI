# Step 1: Build the React app using Vite
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve using Nginx
FROM nginx:alpine

# 👑 FIX: Pehle default config file ko bilkul delete (remove) kar dete hain taaki koi port 80 ka jhanjhat na rahe
RUN rm /etc/nginx/conf.d/default.conf

# 👑 FIX: Ek dum clean tarike se naye port 8080 ki configuration likhte hain
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Build output ko copy karte hain
COPY --from=build /app/dist /usr/share/nginx/html

# Cloud Run ke liye port open karte hain
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
