# OmniRoom — Production Deployment Guide 🚀

OmniRoom is built with **Django 5.x + Django Channels (ASGI Daphne) + Vanilla JS + WebRTC**. Because real-time video conferencing, signaling, whiteboard sync, and live chat require persistent WebSockets, we recommend deploying on platforms that support ASGI WebSockets (such as **Render**, **Railway**, **Fly.io**, or **Docker/VPS**).

---

## 🌟 Option 1: Deploy on Render (Recommended & Free Tier Available)

Render natively supports Daphne ASGI WebSockets, PostgreSQL, and background tasks.

### Method A: 1-Click Blueprint Deployment (render.yaml)
1. Push your latest code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Add production deployment configurations"
   git push origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository (`maitysonu15/CodeAlpha_OmniRoom`).
5. Render will automatically read [`render.yaml`](./render.yaml) and provision:
   - **Web Service** (`omniroom` running Daphne ASGI on Python 3.12)
   - **PostgreSQL Database** (`omniroom-db`)
6. Click **Apply**. Your app will build and go live at `https://omniroom.onrender.com`!

### Method B: Manual Web Service on Render
- **Environment**: Python
- **Build Command**: `pip install -r requirements.txt && python backend/manage.py collectstatic --noinput && python backend/manage.py migrate`
- **Start Command**: `daphne -b 0.0.0.0 -p $PORT --proxy-headers config.asgi:application`
- **Environment Variables**:
  - `PYTHONPATH`: `./backend`
  - `DJANGO_SETTINGS_MODULE`: `config.settings`
  - `DEBUG`: `False`
  - `SECRET_KEY`: `<Generate a random secure string>`
  - `ALLOWED_HOSTS`: `.onrender.com,localhost,127.0.0.1`
  - `CSRF_TRUSTED_ORIGINS`: `https://your-service-name.onrender.com`

---

## 🚆 Option 2: Deploy on Railway

Railway offers seamless Docker / Nixpacks deployment with built-in Redis and PostgreSQL add-ons.

1. Install Railway CLI (or use the web dashboard at [railway.app](https://railway.app)):
   ```bash
   npm i -g @railway/cli
   railway login
   ```
2. Initialize project:
   ```bash
   railway init
   railway up
   ```
3. Add **PostgreSQL** and **Redis** plugins from the Railway dashboard.
4. Set environment variables in Railway:
   - `DEBUG`: `False`
   - `USE_REDIS`: `True`
   - `REDIS_URL`: `${{Redis.REDIS_URL}}`
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `ALLOWED_HOSTS`: `*`
   - `CSRF_TRUSTED_ORIGINS`: `https://${{RAILWAY_PUBLIC_DOMAIN}}`

---

## 🪰 Option 3: Deploy on Fly.io

Fly.io runs applications close to users on lightweight Firecracker VMs with full WebSocket support.

1. Install `flyctl`:
   ```powershell
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```
2. Authenticate:
   ```bash
   fly auth login
   ```
3. Launch app:
   ```bash
   fly launch
   ```
4. Deploy:
   ```bash
   fly deploy
   ```

---

## 🐳 Option 4: Self-Hosted / Docker Compose (VPS, DigitalOcean, AWS EC2, Hetzner)

Run OmniRoom locally or on your own Linux server with full Redis + PostgreSQL + ASGI stack:

1. Clone the repository on your server:
   ```bash
   git clone https://github.com/maitysonu15/CodeAlpha_OmniRoom.git
   cd CodeAlpha_OmniRoom
   ```
2. Start all services in the background:
   ```bash
   docker compose up -d --build
   ```
3. Access the application at `http://YOUR_SERVER_IP:8080`.
4. (Optional) Set up Nginx or Caddy with Let's Encrypt SSL for secure `https://` and `wss://`.

---

## ⚡ Option 5: Deploy on Vercel (Frontend & REST API)

> ℹ️ **Note on WebSockets**: Vercel Serverless Functions support HTTP REST APIs but do not support long-lived WebSockets. If you host the frontend / API on Vercel, you can point WebRTC signaling WebSockets to an external Daphne ASGI backend (like Render or Railway) by configuring `localStorage.setItem('onemeet_ws_url', 'wss://your-asgi-backend.onrender.com')`.

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```
3. Deploy to production:
   ```bash
   vercel --prod
   ```
