#!/bin/bash

echo "=================================="
echo "🚀 Starting LangGraph x402 Frontend"
echo "=================================="
echo ""

# Check if in correct directory
if [ ! -d "frontend" ]; then
  echo "❌ Error: frontend directory not found"
  echo "Please run this script from the langgraph-x402-agent directory"
  exit 1
fi

# Check if .env.local exists
if [ ! -f "frontend/.env.local" ]; then
  echo "📝 Creating .env.local..."
  if [ -f ".env" ]; then
    cp .env frontend/.env.local
    echo "✅ Copied .env to frontend/.env.local"
  else
    echo "⚠️  Warning: .env not found, creating empty .env.local"
    touch frontend/.env.local
  fi
fi

# Install dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

echo ""
echo "✅ Starting development server..."
echo "🌐 Frontend will be available at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd frontend && npm run dev
