#!/bin/bash

echo "🚀 Starting Complete x402 Payment System"
echo "========================================"
echo ""

# Check if tmux is available
if ! command -v tmux &> /dev/null; then
    echo "⚠️  tmux not found. Starting servers in background..."
    echo ""

    echo "📡 Starting x402 API Server..."
    cd x402-api && npm run dev > ../x402-api.log 2>&1 &
    API_PID=$!
    echo "   PID: $API_PID"
    echo "   Logs: x402-api.log"
    cd ..

    sleep 3

    echo ""
    echo "🤖 Starting LangGraph Agent..."
    npm run dev

else
    echo "Using tmux for better terminal management"
    echo ""
    echo "Creating two terminal panes:"
    echo "  - Left: x402 API Server (port 3001)"
    echo "  - Right: LangGraph Agent"
    echo ""

    # Create a new tmux session with two panes
    tmux new-session -d -s x402 \; \
      send-keys 'cd x402-api && ./start-api.sh' C-m \; \
      split-window -h \; \
      send-keys 'sleep 5 && npm run dev' C-m \; \
      attach-session -d
fi
