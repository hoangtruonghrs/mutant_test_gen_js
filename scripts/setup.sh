#!/bin/bash

# Setup script for Mutant Test Gen JS
# This script helps users get started quickly

set -e

echo "🔧 Setting up Mutant Test Gen JS..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
if [[ "$NODE_VERSION" == "not installed" ]]; then
    echo "❌ Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi
echo "✅ Node.js $NODE_VERSION detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Setup environment file
if [ ! -f .env ]; then
    echo "🔐 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please edit .env and add your OPENAI_API_KEY"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs reports tests
echo "✅ Directories created"
echo ""

# Check if API key is set
if grep -q "your-openai-api-key-here" .env 2>/dev/null; then
    echo "⚠️  WARNING: OPENAI_API_KEY not configured in .env"
    echo ""
    echo "To set your API key:"
    echo "  1. Get API key from https://platform.openai.com/api-keys"
    echo "  2. Edit .env file and replace 'your-openai-api-key-here' with your key"
    echo "  3. Or export it: export OPENAI_API_KEY=sk-your-key"
    echo ""
fi

# Show next steps
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "  1. Set your OpenAI API key (see warning above if not done)"
echo "  2. Try the example: node cli.js generate examples/calculator.js"
echo "  3. Read the docs: cat docs/QUICKSTART.md"
echo ""
echo "📚 Available commands:"
echo "  node cli.js generate <files>    Generate tests"
echo "  node cli.js init                Create config file"
echo "  node cli.js --help              Show all commands"
echo ""
echo "Happy testing! 🧪"
