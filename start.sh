#!/bin/bash

# Quantum Labs Discord Bot - Startup Script
# This script installs dependencies and starts the bot with PM2

echo "🚀 Starting Quantum Labs Discord Bot..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

echo "✅ PM2 version: $(pm2 -v)"
echo ""

# Create logs directory
mkdir -p logs

# Stop existing instance if running
echo "🔄 Stopping existing instance (if any)..."
pm2 stop Quantum-Labs 2>/dev/null || true
pm2 delete Quantum-Labs 2>/dev/null || true

# Start bot with PM2
echo "🚀 Starting bot with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Show status
echo ""
echo "✅ Bot started successfully!"
echo ""
pm2 status

echo ""
echo "📋 Useful PM2 Commands:"
echo "   pm2 status              - Show bot status"
echo "   pm2 logs Quantum-Labs   - View bot logs"
echo "   pm2 restart Quantum-Labs - Restart bot"
echo "   pm2 stop Quantum-Labs   - Stop bot"
echo "   pm2 monit               - Monitor bot in real-time"
echo ""

