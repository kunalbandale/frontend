@echo off
echo 🔧 Fixing Node.js 18 compatibility issues...

REM Remove node_modules and package-lock.json
echo 📦 Cleaning existing dependencies...
rmdir /s /q node_modules
del package-lock.json

REM Clear npm cache
echo 🧹 Clearing npm cache...
npm cache clean --force

REM Install dependencies
echo 📥 Installing compatible dependencies...
npm install

echo ✅ Frontend compatibility fix complete!
echo 🚀 You can now run: npm run dev
pause

