#!/bin/bash

echo "🚀 Starting x402-Protected Sentiment API Server..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file based on the example."
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server in development mode
echo "🔧 Starting in development mode with hot reload..."
npm run dev
