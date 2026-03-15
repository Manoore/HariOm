#!/bin/bash

# Divine App - Backend Deployment to Google Cloud Run
# Project: divine-104d4

set -e

echo "🚀 Deploying Divine App Backend to Google Cloud Run..."

# Variables
PROJECT_ID="divine-104d4"
SERVICE_NAME="divine-backend"
REGION="asia-south1"  # Mumbai region for India
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Authenticate with service account
echo "🔐 Authenticating with Google Cloud..."
gcloud auth activate-service-account --key-file=/app/gcloud-key.json
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "📦 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com --quiet || true
gcloud services enable run.googleapis.com --quiet || true
gcloud services enable containerregistry.googleapis.com --quiet || true

# Build and push Docker image
echo "🏗️ Building Docker image..."
cd /app/backend
gcloud builds submit --tag ${IMAGE_NAME} --quiet

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --port 8080 \
  --set-env-vars "MONGO_URL=${MONGO_URL}" \
  --set-env-vars "DB_NAME=${DB_NAME}" \
  --set-env-vars "JWT_SECRET=${JWT_SECRET}" \
  --set-env-vars "STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}" \
  --set-env-vars "SARVAM_API_KEY=${SARVAM_API_KEY}" \
  --set-env-vars "PROKERALA_CLIENT_ID=${PROKERALA_CLIENT_ID}" \
  --set-env-vars "PROKERALA_CLIENT_SECRET=${PROKERALA_CLIENT_SECRET}" \
  --set-env-vars "GOOGLE_PLACES_API_KEY=${GOOGLE_PLACES_API_KEY}" \
  --set-env-vars "GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_API_KEY}" \
  --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo "✅ Backend deployed successfully!"
echo "🌐 Backend URL: ${SERVICE_URL}"
echo ""
echo "📝 Next steps:"
echo "   1. Update frontend/.env with: REACT_APP_BACKEND_URL=${SERVICE_URL}"
echo "   2. Run deploy-frontend.sh to deploy frontend to Firebase"
