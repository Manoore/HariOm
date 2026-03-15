#!/bin/bash

# Divine App - Frontend Deployment to Firebase Hosting
# Project: divine-104d4

set -e

echo "🚀 Deploying Divine App Frontend to Firebase Hosting..."

# Variables
PROJECT_ID="divine-104d4"

cd /app/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  yarn install
fi

# Build the production version
echo "🏗️ Building production bundle..."
yarn build

# Deploy to Firebase
echo "☁️ Deploying to Firebase Hosting..."
npx firebase-tools deploy --only hosting --project ${PROJECT_ID} --token "${FIREBASE_TOKEN}"

echo ""
echo "✅ Frontend deployed successfully!"
echo "🌐 Frontend URL: https://${PROJECT_ID}.web.app"
echo ""
