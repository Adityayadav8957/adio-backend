# Use a lightweight Debian-based Node.js image
FROM node:20-bookworm-slim

# Install system dependencies
# python3 & ffmpeg are required for yt-dlp and audio processing
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first to leverage cache
COPY package*.json ./

# Install Node.js dependencies
# This includes running the postinstall script for yt-dlp-exec
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
