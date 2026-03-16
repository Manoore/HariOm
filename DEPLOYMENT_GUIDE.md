# Divine App - Backend Deployment Guide (Google Cloud Run)

This guide walks you through deploying the Divine App backend to Google Cloud Run, making your Firebase-hosted website fully functional.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud CLI (gcloud)** installed on your computer
3. **Docker Desktop** installed (optional, for local testing)

---

## Step 1: Install Google Cloud CLI

### Windows
1. Download from: https://cloud.google.com/sdk/docs/install
2. Run the installer
3. Open a new Command Prompt and run: `gcloud init`

### Mac
```bash
brew install google-cloud-sdk
gcloud init
```

### Linux
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

---

## Step 2: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "divine-app-backend")
3. Note your **Project ID** (you'll need it)
4. Enable billing for the project

---

## Step 3: Enable Required APIs

Run these commands in your terminal:

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

---

## Step 4: Configure Authentication

```bash
gcloud auth login
gcloud auth configure-docker
```

---

## Step 5: Deploy to Cloud Run

### Option A: Deploy directly from source (Recommended - Easiest)

Navigate to the backend folder and run:

```bash
cd /path/to/your/project/backend

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
```

### Option B: Build and deploy manually

```bash
# Build the container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/divine-app-backend

# Deploy to Cloud Run
gcloud run deploy divine-app-backend \
  --image gcr.io/YOUR_PROJECT_ID/divine-app-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi
```

---

## Step 6: Note Your Backend URL

After deployment, you'll see output like:
```
Service URL: https://divine-app-backend-xxxxx-uc.a.run.app
```

**Copy this URL** - this is your new production backend URL!

---

## Step 7: Update Frontend Configuration

1. Open `/app/frontend/.env`
2. Change `REACT_APP_BACKEND_URL` to your new Cloud Run URL:
   ```
   REACT_APP_BACKEND_URL=https://divine-app-backend-xxxxx-uc.a.run.app
   ```

---

## Step 8: Rebuild and Redeploy Frontend to Firebase

```bash
cd /path/to/your/project/frontend

# Rebuild with new backend URL
npm run build

# Deploy to Firebase
npx firebase-tools deploy --only hosting
```

---

## Step 9: Verify Deployment

1. Visit your Firebase website
2. Try logging in
3. Add items to cart
4. Complete a test checkout

---

## Troubleshooting

### View Cloud Run Logs
```bash
gcloud run services logs read divine-app-backend --region us-central1
```

### Check Service Status
```bash
gcloud run services describe divine-app-backend --region us-central1
```

### Common Issues

1. **502 Bad Gateway**: Check that all environment variables are set correctly
2. **CORS Errors**: The backend already allows all origins (`allow_origins=["*"]`)
3. **Database Connection Failed**: Verify MongoDB URL and network access

---

## Cost Estimate

Google Cloud Run uses pay-per-use pricing:
- **Free Tier**: 2 million requests/month free
- **Beyond Free Tier**: ~$0.40 per million requests
- **Memory**: ~$0.0000025 per GB-second

For a small to medium app, expect **$0-10/month**.

---

## Security Note

For production, consider:
1. Using Google Secret Manager for sensitive environment variables
2. Setting up a custom domain with SSL
3. Implementing rate limiting
4. Configuring Cloud Armor for DDoS protection

---

## Quick Reference Commands

```bash
# View all deployments
gcloud run services list

# Update environment variable
gcloud run services update divine-app-backend --set-env-vars KEY=VALUE --region us-central1

# Scale service (0 = scale to zero when idle)
gcloud run services update divine-app-backend --min-instances 0 --max-instances 10 --region us-central1

# Delete service
gcloud run services delete divine-app-backend --region us-central1
```
