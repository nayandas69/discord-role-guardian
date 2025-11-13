# Use official Node.js 20 LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create data directory for persistent storage
RUN mkdir -p data

# Expose port for health checks
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]