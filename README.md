# PinPoster — AI-Powered Pinterest Affiliate Marketing SaaS

> **Tagline:** One link. Ten creative Pins. An automatically organized publishing queue.

**PinPoster** is a full-stack, production-grade MERN web application engineered for affiliate marketers and content creators. It turns raw product affiliate URLs into high-converting, 10-Pin Pinterest campaigns with AI-crafted SEO titles, descriptions, hashtags, vertical creative imagery, and a global chronological 1-hour interval scheduling engine.

---

## 🌟 Non-Negotiable Core Architecture Rules

1. **No Pinterest Developer API required:** Does not require Developer account approval or API keys.
2. **Zero password/cookie access:** Never asks for, stores, or automates against user Pinterest credentials.
3. **No unauthorized browser automation:** Pure, sanctioned user-driven publishing workflow.
4. **Manual Pinterest Handoff Workspace:** Pins scheduled in the app alert the user when their hourly slot arrives. With 1-click convenience, users download the creative image, copy the title, description, and affiliate link, open Pinterest, and mark as published.
5. **Exact 10-Pin Batch Generation:** Every product submission generates exactly 10 unique visual concepts (Product Hero, Benefits Focus, Problem & Solution, Features Infographic, Lifestyle Scene, Honest Review, Gift Guide, Minimalist Showcase, Daily Routine, Trending Callout).
6. **Preserved Affiliate Links:** The original affiliate destination URL is strictly preserved for all 10 Pins.
7. **Single Global Hourly Queue:** Campaigns share one unified chronological timeline. Campaign A reserves 10 consecutive hours; Campaign B immediately queues into the next 10 consecutive hours after Campaign A.
8. **In-App API Control Center:** Change AI providers (Gemini), image generators, and Cloudinary storage from the dashboard with zero code modifications. Credentials are encrypted at rest with AES-256-GCM.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + Custom Soft UI design system
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Data Fetching:** TanStack Query & Axios with JWT interceptor
- **Analytics & Data Visualization:** Recharts
- **Celebration Effects:** Canvas-Confetti

### Backend
- **Runtime:** Node.js (v18+) & Express.js
- **Database:** MongoDB Atlas / Local MongoDB (Mongoose ORM) with automatic in-memory fallback for instant zero-config testing
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs
- **Security:** Helmet, Express Rate Limiting, SSRF Protection, AES-256-GCM Credential Encryption
- **Validation:** Zod schemas
- **Scraping & Metadata:** Cheerio & Axios with DNS/IP validation
- **Image Processing:** Sharp & Cloudinary integration with local fallback
- **Scheduling Worker:** Persistent MongoDB jobs & `node-cron`

---

## 📂 Application Navigation (13 Core Sections)

1. **Overview:** Executive dashboard with metric cards, upcoming pins, Recharts graphs, and next available slot indicator.
2. **Create Campaign:** Paste affiliate link, auto-extract details, preview & manual edit, select board, and trigger 10-Pin generation.
3. **Campaigns:** List and manage all active campaigns with progress tracking and deletion safeguards.
4. **Campaign Detail:** Deep inspection of a single campaign, showing all 10 Pins, product details, and scheduled slots.
5. **Pin Library:** Grid and list views, search, multi-filter (status, board, campaign), selection, and bulk actions.
6. **Publishing Queue:** Chronological timeline showing "Ready to Publish" pins and upcoming hourly slots.
7. **Scheduled Pins:** Slot reservation timeline ensuring non-overlapping distribution.
8. **Published Pins:** History of manual confirmed pins with manual performance tracking (impressions, clicks, saves).
9. **Boards:** Manually maintained references to your Pinterest boards.
10. **Analytics:** Recharts data visualization (daily activity, status breakdown, board distribution, manual ROI).
11. **API Settings:** Secure control center to configure Google Gemini, image engines, and Cloudinary storage.
12. **Notifications:** Real-time in-app notification center for completed generations and ready pins.
13. **Activity Log:** Immutable audit trail of all platform operations.
14. **Account Settings:** User profile, timezone configuration (e.g. `Asia/Kolkata` standard), and default affiliate disclosure text.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18 or later
- npm v9 or later
- MongoDB (Optional: an embedded in-memory database will automatically activate if no external MongoDB instance is running)

### 1. Clone & Install Dependencies

```bash
# In the root project directory:
npm run install:all
```

Or manually install each workspace:

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Environment Configuration

Copy example environment variables:

```bash
cp server/.env.example server/.env
```

Default `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/pinposter
JWT_SECRET=your_jwt_secret_min_32_characters_long_random_string
ENCRYPTION_KEY=your_aes_256_encryption_key_exactly_64_hex_characters
CLIENT_URL=http://localhost:5173
DEFAULT_TIMEZONE=Asia/Kolkata

# Optional Cloudinary (can also be configured from the UI)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional Gemini API Key default fallback (can also be configured from the UI)
GEMINI_API_KEY=
```

---

### ⚠️ Security Warning & Secret Rotation Guide (Pre-Deployment)

> [!WARNING]
> **ROTATE PREVIOUSLY COMMITTED SECRETS BEFORE DEPLOYMENT:**
> If any MongoDB connection string, database password, or secret key was previously stored in source files or committed to git, **that old value remains accessible in git commit history**. 
> 
> **You must rotate the following before deploying to production:**
> 1. **MongoDB Atlas Password:** Go to [cloud.mongodb.com](https://cloud.mongodb.com) &rarr; Database Access &rarr; Edit User &rarr; Change Password.
> 2. **JWT_SECRET:** Generate a fresh secret in your terminal:
>    ```bash
>    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
>    ```
> 3. **ENCRYPTION_KEY:** Generate a fresh 64-char AES-256 key:
>    ```bash
>    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
>    ```
> 4. **API Keys:** Regenerate any active Gemini or Cloudinary keys if they were ever checked into git.
> 5. **Gitignore:** Verify `.env` is listed in `.gitignore` and never committed.


### 3. Run the Development Servers

Open two terminals:

**Terminal 1 (Backend API & Scheduler):**
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:5000`*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🧪 Automated End-to-End Workflow Verification

A comprehensive 16-step test suite is included to verify the complete product lifecycle:

```bash
cd server
node src/utils/testWorkflow.js
```

**Verifies:**
1. User registration & authentication
2. Board creation & default flag
3. In-app Gemini text AI encrypted configuration
4. Image generation provider configuration
5. Product URL SSRF validation & scraping
6. Automated generation of exactly 10 Pins
7. Unique visual themes, SEO descriptions, and preserved destination URLs
8. Global hourly schedule reservations for Campaign A
9. Continuity check: Campaign B scheduled consecutively 1 hour after Campaign A's 10th slot
10. Pin editing (title, description, board, destination URL)
11. Pin pause & resume (with safe slot release and reassignment)
12. Manual Pinterest handoff workspace & confirmation
13. Manual metrics logging (impressions, clicks, saves)
14. Dashboard analytics recalculation

---

## 🔒 Security & SSRF Protection

- **SSRF Defense:** All submitted product URLs pass through DNS resolution and IP range validation, prohibiting `localhost`, `127.0.0.1`, and private/internal subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`).
- **AES-256-GCM Encryption:** All third-party API credentials entered in the API Settings control center are encrypted before database insertion and masked when returned to the UI.
- **Strict User Isolation:** All Mongoose queries enforce `{ userId: req.userId }` scoping across products, campaigns, pins, boards, and logs.

---

## 🚢 Production Deployment

### Frontend (Vercel)
1. Set the root directory to `client`.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Set environment variable: `VITE_API_URL=https://your-backend.railway.app/api`.

### Backend (Render / Railway)
1. Set the root directory to `server`.
2. Build command: `npm install`.
3. Start command: `node src/server.js`.
4. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, `ENCRYPTION_KEY`, `CLIENT_URL`.
5. Deploy as a persistent web service so the `node-cron` background scheduler worker runs continuously.

---

## 📄 License
ISC License © 2026 PinPoster SaaS
