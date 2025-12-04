#!/bin/bash

# Quick Start Script for x402 AI Agent
# This script helps you get started quickly

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║        x402 AI Agent - Quick Start Setup                  ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

echo ""

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your OpenAI API key"
    echo "   Open .env file and set: OPENAI_API_KEY=sk-your-key-here"
    echo ""
    read -p "Press Enter when you've added your API key..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start the API server (in this terminal):"
echo "   python apis/paid_apis.py"
echo ""
echo "2. Open a NEW terminal and run the agent:"
echo "   cd $(pwd)"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "3. Or test the x402 payment flow:"
echo "   python test_x402_flow.py"
echo ""
echo "🚀 Ready to go! Choose your next step above."
echo ""
