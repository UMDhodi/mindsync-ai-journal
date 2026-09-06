#!/usr/bin/env bash
# ==============================================================================
# MindSync AI - Cloud Run Automated Deployment Script
# Provisions Secret Manager IAM bindings, builds Docker image, and deploys.
# ==============================================================================
set -euo pipefail

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "gen-ai-7d0f4")}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="mindsync-ai-journal"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"
SECRET_NAME="gemini-api-key"

echo "============================================================"
echo "  MindSync AI: Deploying to Google Cloud Run"
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "============================================================"

# 1. Enable Required GCP APIs
echo "--> Step 1: Enabling necessary Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  --project="${PROJECT_ID}"

# 2. Check or Create Gemini Secret in Secret Manager
echo "--> Step 2: Checking Secret Manager for '${SECRET_NAME}'..."
if ! gcloud secrets describe "${SECRET_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "--> Secret '${SECRET_NAME}' does not exist. Creating..."
  if [ -n "${GEMINI_API_KEY:-}" ]; then
    echo -n "${GEMINI_API_KEY}" | gcloud secrets create "${SECRET_NAME}" \
      --data-file=- \
      --replication-policy="automatic" \
      --project="${PROJECT_ID}"
    echo "--> Secret '${SECRET_NAME}' created."
  else
    echo "WARN: GEMINI_API_KEY environment variable is not set. Please create secret manually."
  fi
else
  echo "--> Secret '${SECRET_NAME}' exists."
fi

# 3. Grant Cloud Run Service Agent permission to access Secret
echo "--> Step 3: Granting Secret Accessor IAM role to Cloud Run compute service account..."
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding "${SECRET_NAME}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}" || true

# 4. Build and Submit Container Image
echo "--> Step 4: Building and pushing container image via Google Cloud Build..."
gcloud builds submit --tag "${IMAGE_TAG}" --project="${PROJECT_ID}" .

# 5. Deploy Container to Cloud Run
echo "--> Step 5: Deploying '${SERVICE_NAME}' to Cloud Run with challenge label..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_TAG}" \
  --region="${REGION}" \
  --platform="managed" \
  --allow-unauthenticated \
  --port=3000 \
  --labels=dev-tutorial=cloud-run-ai-challenge \
  --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GEMINI_SECRET_NAME=${SECRET_NAME}" \
  --set-secrets="GEMINI_API_KEY=${SECRET_NAME}:latest" \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=10 \
  --project="${PROJECT_ID}"

# Retrieve Service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform=managed --region="${REGION}" --format="value(status.url)" --project="${PROJECT_ID}")

echo "============================================================"
echo "  Deployment Complete!"
echo "  MindSync AI Service URL: ${SERVICE_URL}"
echo "============================================================"
