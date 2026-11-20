# PinPoster — Production Deployment Guide

This guide explains how to deploy **PinPoster** for 100% automated 24/7 Pinterest affiliate publishing.

---

## 1. Quick Architecture Overview

* **Backend**: Node.js + Express (Port 5000)
* **Frontend**: React + Vite + Tailwind CSS
* **Database**: MongoDB Atlas (with automatic in-memory fallback for local dev)
* **Storage**: Cloudinary (Recommended for production public image hosting)
* **Image Synthesis**: Google Gemini Imagen 3 / OpenAI DALL-E 3 / Sharp Aesthetic Studio (1080×1920 px)
* **Publishing**: Pinterest Native RSS Auto-Publish (100% automated, zero developer approval required)

---

## 2. Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/pinposter?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT auth tokens | Generate with: `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | 64-char hex key for AES-256 API encryption | Generate with: `openssl rand -hex 32` |
| `CLIENT_URL` | Allowed CORS frontend URL | `https://your-pinposter-frontend.vercel.app` |
| `PUBLIC_BASE_URL` | Public domain for RSS feeds & uploads | `https://your-pinposter-api.onrender.com` |
| `DEFAULT_TIMEZONE` | Timezone for scheduler calculations | `Asia/Kolkata` (or your local timezone) |

### Frontend (`client/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Live backend API URL | `https://your-pinposter-api.onrender.com/api` |

---

## 3. Recommended 1-Click Deployment (Render + Vercel)

### Deploy Backend on Render (Free / Starter Web Service)
1. Push your code to GitHub.
2. In [render.com](https://render.com), click **New Web Service** and select your GitHub repository.
3. Configure the service:
   * **Root Directory**: `server`
   * **Build Command**: `npm install`
   * **Start Command**: `node src/server.js`
4. Add your Environment Variables in Render:
   * `NODE_ENV`: `production`
   * `MONGODB_URI`: Your MongoDB Atlas URI (remember to replace `<db_password>` with your real password)
   * `JWT_SECRET`: A secure random string
   * `ENCRYPTION_KEY`: A 64-character hex key
   * `PUBLIC_BASE_URL`: Your Render service URL (e.g. `https://pinposter-api.onrender.com`)
   * `CLIENT_URL`: Your Vercel frontend URL
5. Click **Create Web Service**.

### Deploy Frontend on Vercel (Free)
1. In [vercel.com](https://vercel.com), click **Add New Project** and select your GitHub repo.
2. Configure:
   * **Root Directory**: `client`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Add Environment Variable:
   * `VITE_API_URL`: `https://pinposter-api.onrender.com/api` (your Render backend URL + `/api`)
4. Click **Deploy**.

---

## 4. Setting Up Pinterest Auto-Publish on Production

1. Once deployed, open your live frontend website and sign in.
2. Navigate to **Auto-Publish (RSS)** in the left sidebar.
3. Your RSS Feed URL will automatically reflect your live production domain:  
   `https://pinposter-api.onrender.com/api/feed/rss/<your-token>`
4. Copy the URL.
5. In Pinterest: Go to **Settings ➔ Bulk create Pins ➔ Auto-publish from RSS feed**.
6. Paste your feed URL, pick your Pinterest board, and click **Save**.

Pinterest will now automatically crawl your live feed and publish your 1080×1920 affiliate Pins on schedule!
