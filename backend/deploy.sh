#!/bin/bash
# Divine App Backend - Google Cloud Run Deployment Script
# Run this script from the backend directory

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Divine App Backend Deployment ===${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null 2>&1; then
    echo -e "${YELLOW}You need to log in to Google Cloud.${NC}"
    gcloud auth login
fi

# Get project ID
echo -e "${YELLOW}Enter your Google Cloud Project ID:${NC}"
read PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: Project ID is required.${NC}"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
echo "This may take 5-10 minutes..."

gcloud run deploy divine-app-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "MONGO_URL=mongodb+srv://manoore_db_user:q0PhyRC5qkZqkHic@divineconnect.d3grhp6.mongodb.net/?retryWrites=true&w=majority&appName=DivineConnect" \
  --set-env-vars "DB_NAME=divine_app" \
  --set-env-vars "STRIPE_SECRET_KEY=sk_test_51QgI3PHHYDXeQk9QCgUwCLMXKHqqlxyXubu00kwlD2h7s2l8eGMHs8eTtFs1LM5LOCoT767V7jejm8u3s6izZgHc007Xebofzx" \
  --set-env-vars "STRIPE_PUBLISHABLE_KEY=pk_test_51QgI3PHHYDXeQk9QbehRYK4AjVgDBg5PV9qh0cT5YzWVC1qh0PhgV5QumXOCgi7whTcPQOhIBdVC6Ax0uBHiu15A00Xz19yJmD" \
  --set-env-vars "PROKERALA_CLIENT_ID=vedic-portal-2" \
  --set-env-vars "PROKERALA_CLIENT_SECRET=T6VHcaARHF9ss7iq2riTkQW61ZVfomRcHCLMCIcp" \
  --set-env-vars "GOOGLE_PLACES_API_KEY=AIzaSyBr3qP19Vxsv5jeLxccsM0OfK3DWssPTVQ" \
  --set-env-vars "EMERGENT_LLM_KEY=sk-emergent-8162073741b0c8f78B" \
  --set-env-vars "HMS_ACCESS_KEY=69b7079763cbbe924eef9147" \
  --set-env-vars "HMS_SECRET=eRlFPQnB8XVFypA8nJC9zTtEKeggaeHVR9bA6Nm9x0J3YSAMWYa8yf2tyVWu6XRWRzPflytGM2HSFp_5hAzigBmDa5PMK2sqwsnAuSlZYyXneIyzDcudkF_YvnZDVzvvOstT1Kn9Pu6qYR4vDTIpmGU2rKPJupEhT_WVJaECQgk=" \
  --memory 1Gi \
  --timeout 300

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=== DEPLOYMENT SUCCESSFUL! ===${NC}"
    echo ""
    echo -e "${YELLOW}NEXT STEPS:${NC}"
    echo "1. Copy the Service URL shown above"
    echo "2. Update frontend/.env with: REACT_APP_BACKEND_URL=<your-service-url>"
    echo "3. Rebuild frontend: npm run build"
    echo "4. Redeploy to Firebase: npx firebase-tools deploy --only hosting"
else
    echo -e "${RED}Deployment failed. Check the error messages above.${NC}"
    exit 1
fi
