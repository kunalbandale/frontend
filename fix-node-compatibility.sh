#!/bin/bash

echo "🔧 Fixing Node.js 18 compatibility issues..."

# Remove node_modules and package-lock.json
echo "📦 Cleaning existing dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Install dependencies
echo "📥 Installing compatible dependencies..."
npm install

echo "✅ Frontend compatibility fix complete!"
echo "🚀 You can now run: npm run dev"

