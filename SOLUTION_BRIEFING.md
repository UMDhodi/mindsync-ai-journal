# MindSync AI: Secure Personal Gemini Journal & Cognitive Brainstorming Engine
## Architecture Solution Briefing & Enterprise Security Directives

---

### Executive Summary
**MindSync AI** is a production-grade, multi-tenant personal journal, strategic reflection, and brainstorming web application built for high-security deployment on **Google Cloud Run**. It pairs the reasoning capabilities of **Google Gemini 3.8 Flash** with an enterprise zero-leakage security posture backed by **Firebase Authentication**, **Cloud Firestore** with strict tenant isolation (`/users/{userId}/*`), and **Google Cloud Secret Manager**.

In addition to conversation journaling, MindSync features an automated **MindSync Cognitive Engine & Thought Graph**:
1. **Cognitive Reframing & Perspective Expansion:** Identifies implicit friction, limiting beliefs, or cognitive blind spots, offering grounded reframing and growth opportunities.
2. **Emotional Valence & Energy Radar:** Quantifies sentiment valence (-100 to +100), energy/drive levels, dominant emotional state, and mental clarity.
3. **Actionable Takeaways Extraction:** Isolates prioritized next steps with explicit tactical rationales.
4. **Dynamic Concept Mind Map:** Generates an interactive ontological graph of ideas, challenges, breakthroughs, and milestone nodes.
5. **Zero-Knowledge E2E Encrypted Vault Mode:** Client-side Web Crypto AES-GCM (256-bit PBKDF2) ensuring unencrypted journal content never touches cloud servers when enabled.

---

### Architecture & Data Isolation Blueprint

```
+--------------------------------------------------------------------------+
|                                CLIENT TIER                               |
|   React 19 + Vite + Tailwind CSS + Lucide Icons                          |
|   - Firebase Auth SDK (JWT Token generation & automatic refresh)         |
|   - Multi-Turn Gemini Journaling & Brainstorming Workspace                |
|   - MindSync Cognitive Reframing & Knowledge Graph View                  |
|   - Client-side E2E Encryption Toggle (Web Crypto AES-GCM 256-bit)       |
+------------------------------------+-------------------------------------+
                                     | Bearer ID Token (JWT)
                                     v
+--------------------------------------------------------------------------+
|                         BACKEND TIER (Cloud Run)                         |
|   Node.js + Express API + Static SPA Ingress                             |
|   - Firebase Admin SDK (Cryptographic Token Validation)                  |
|   - Strict Tenant Scoping: req.user.uid enforcement on all paths         |
|   - Google Cloud Secret Manager (@google-cloud/secret-manager)           |
|     -> In-memory TTL caching (10 min), zero client-side exposure         |
|     -> Graceful local fallback to environment variables                  |
|   - Gemini API Client (@google/genai & gemini-3.8-flash)                 |
|     -> Multi-turn chat context builder & prompt injection heuristic guard|
|     -> Automated Structured Summarization & Cognitive Engine             |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                           GOOGLE CLOUD SERVICES                          |
|   1. Firebase Authentication: Identity provider & RS256 token signer     |
|   2. Cloud Firestore: Hierarchical user-isolated document store          |
|      (/users/{userId}/sessions, /summaries, /graphs)                     |
|      + Enforced via firestore.rules & Server Controller validation       |
|   3. Secret Manager: 'gemini-api-key' secret storage with IAM PoLP       |
|   4. Cloud Run: Serverless auto-scaling stateless container execution    |
+--------------------------------------------------------------------------+
```

---

### Threat Model & Security Checklist (OWASP Top 10 for LLMs)

| Threat ID | Threat Vector | MindSync AI Mitigation Control |
| :--- | :--- | :--- |
| **LLM01** | **Prompt Injection** | Pre-execution heuristic scanner detects jailbreak patterns (`Ignore prior instructions`, `DAN mode`). Strict XML/markdown boundary demarcation. Hardened system instruction in `geminiService.ts`. |
| **LLM02** | **Insecure Output Handling** | Structured JSON schema enforcement via `@google/genai` `responseSchema` and Zod validation. Zero direct shell/`eval` execution. Safe HTML rendering. |
| **LLM04** | **Model Denial of Service** | Strict Zod request payload limits (max 12,000 chars per message), rate limiting, and defensive error propagation without application crashes. |
| **LLM06** | **Sensitive Data Disclosure** | Optional Zero-Knowledge Client-Side AES-GCM encryption. API keys strictly server-side cached via GCP Secret Manager; zero secrets in client bundles. |
| **LLM07** | **Insecure Plugin Design** | All downstream data persistence queries strictly parameterized through `/users/{userId}/*` path scopes. |
| **LLM10** | **Unbounded Consumption** | Efficient token management with `gemini-3.8-flash` optimized for low-latency reasoning and controlled output token lengths. |

---

### STRIDE Security Matrix

- **Spoofing:** Prevented by Firebase ID token verification. Unauthenticated requests are rejected with 401 Unauthorized before business logic runs.
- **Tampering:** Zero client trust. Request body schemas validated against Zod strict models. Firestore rules assert `request.auth.uid == userId`.
- **Repudiation:** Every message and reflection is timestamped and immutable inside the user's subcollection `/users/{userId}/sessions/{sessionId}/messages/`.
- **Information Disclosure:** Server secrets reside in GCP Secret Manager with in-memory TTL caching. No stack traces returned to client endpoints.
- **Denial of Service:** Fast single-bundle serving, stateless Cloud Run containers with auto-scaling (0-10 instances), and bounded message payloads.
- **Elevation of Privilege:** Strict hierarchical path parameterization prevents cross-tenant record reads or writes.

---

### Step-by-Step Instructions: Configuring Google AI Studio

To configure Google AI Studio with the Security Constitution:
1. Open [Google AI Studio](https://aistudio.google.com).
2. Navigate to **System Instructions** (or **System Prompt**).
3. Copy the contents of `GOOGLE_AI_STUDIO_CONSTITUTION.md` and paste them into the system instruction field.
4. Select the model: `gemini-3.8-flash` (or `gemini-3.1-pro-preview` for deep reasoning).
5. In **Model Settings**, set Temperature to `0.7` and Top-P to `0.95`.

---

### Local Development & Verification

#### Prerequisites
- Node.js 20+
- npm

#### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Express API + Vite SPA on port 3000)
npm run dev

# 3. Open browser
http://localhost:3000
```

#### Dual-Mode Authentication
- **Live Firebase Mode:** Connects to Firebase Auth (`gen-ai-7d0f4`) using standard Google Sign-In or Email/Password.
- **Mock/Emulated Sandbox Mode:** For frictionless evaluation without live cloud billing or external dependencies, toggle the Sandbox mode in the authentication panel or navigation bar to test tenant isolation with pre-configured identities.

---

### Cloud Run Production Deployment

```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Run automated deployment script
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh
```
Or execute through Google Cloud Build:
```bash
gcloud builds submit --config=cloudbuild.yaml
```
