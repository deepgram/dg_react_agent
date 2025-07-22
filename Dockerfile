FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy source files
COPY . .

WORKDIR /app/test-app

# Copy package files
#COPY package*.json ./
# COPY ../package*.json ../

# Install dependencies
RUN npm install

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/test-app/dist /usr/share/nginx/html

# Copy nginx config
COPY --from=builder /app/test-app/nginx.conf /etc/nginx/conf.d/default.conf

# Get secrets
RUN --mount=type=secret,id=VITE_DEEPGRAM_API_KEY \
    VITE_DEEPGRAM_API_KEY="$(cat /run/secrets/VITE_DEEPGRAM_API_KEY)"

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 
