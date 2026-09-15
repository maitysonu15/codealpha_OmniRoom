# OmniRoom

> **Tagline:** Universal Real-Time Collaboration & Meeting Space

OmniRoom is a commercial-grade, real-time video conferencing and workspace collaboration web application inspired by Google Meet, Zoom, and Discord with original branding. Built for high performance, zero-compromise privacy, and rich interactivity, OmniRoom provides instant video meetings, screen sharing, real-time chat, collaborative canvas whiteboards, Firebase authentication, and secure file sharing.

---

## 🚀 Technology Stack

### Backend (Strict Python Stack)
- **Language**: Python 3.12+
- **Core Framework**: Django 5.x
- **REST API**: Django REST Framework (DRF)
- **Real-Time WebSockets & Signaling**: Django Channels (ASGI)
- **Channel Layer**: Redis (`channels_redis`) with in-memory dev fallback (`InMemoryChannelLayer`)
- **Database**: SQLite (Development) / PostgreSQL (Production ready)

> ⚠️ **Backend Policy**: OmniRoom's backend is implemented strictly using Python, Django, DRF, and Django Channels. Node.js, Express.js, Socket.IO server, and FastAPI are explicitly avoided.

### Frontend
- **HTML5 & CSS3**: Vanilla CSS with OmniRoom Obsidian Cosmic Aurora design system, glassmorphism, responsive video grid, and custom tokens.
- **JavaScript**: Pure Vanilla JavaScript (ES6+), WebRTC Mesh Engine, Fetch API, WebSockets API, and Canvas API.
- **Authentication**: Firebase Authentication (Google 1-Click Popup, Email/Password) + Django Session Auth with dynamic configuration via `.env`.

---

## 📁 Repository Folder Structure

```text
OmniRoom/
│
├── frontend/                  # Separate Frontend Application
│   ├── index.html             # Landing Page
│   ├── login.html             # User Sign In Page
│   ├── register.html          # Account Registration Page
│   ├── dashboard.html         # User Dashboard Page
│   ├── meeting.html           # Meeting Room Interface Page
│   ├── css/
│   │   ├── global.css         # Design system tokens, buttons, resets, toasts
│   │   ├── auth.css           # Auth form layout and alert styles
│   │   ├── dashboard.css      # Dashboard grid, cards, and meeting cards
│   │   └── meeting.css        # Video grid, control bar, and drawer panels
│   └── js/
│       ├── api.js             # Fetch wrapper with CSRF & session cookie handling
│       ├── auth.js            # Authentication logic & session checks
│       ├── dashboard.js       # Meeting creation & recent meeting list
│       └── meeting.js         # WebSocket room client & meeting UI controls
│
├── backend/                   # Strict Django Backend
│   ├── manage.py
│   ├── config/                # Django Configuration Package
│   │   ├── __init__.py
│   │   ├── settings.py        # Settings, DRF, Channels, CORS, Media
│   │   ├── urls.py            # Root URL Dispatcher
│   │   ├── asgi.py            # ASGI application routing HTTP & WebSockets
│   │   └── wsgi.py            # WSGI application setup
│   │
│   ├── accounts/              # User Authentication & Profile App
│   ├── meetings/              # Meeting Room & Channels Consumer App
│   ├── chat/                  # Real-Time Chat App
│   ├── whiteboard/            # Collaborative Canvas App
│   ├── files/                 # Secure File Sharing App
│   └── requirements.txt       # Python dependencies
│
├── .env                       # Environment variables (ignored in Git)
├── .env.example               # Example environment template
├── .gitignore                 # Excludes secrets, sqlite, venv, pycache
├── README.md                  # Project documentation
├── prd.md                     # Product Requirements Document
├── design.md                  # Design Specification
├── architecture.md            # System Architecture
├── phases.md                  # Development Roadmap & Phase Status
└── memory.md                  # Architectural Constraints & Memory
```

---

## 🛠️ Local Development Setup Guide

### 1. Environment Setup

#### Clone / Access Project Directory
```bash
git clone https://github.com/maitysonu15/CodeAlpha_OmniRoom.git
cd CodeAlpha_OmniRoom
```

#### Create Virtual Environment

**Windows (PowerShell / Command Prompt):**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

**Windows:**
```powershell
copy .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

### 3. Database Setup & Migrations

```bash
cd backend
python manage.py makemigrations accounts meetings chat whiteboard files
python manage.py migrate
```

### 4. Redis Setup (Optional in Local Dev)

For full Redis channel layer support:
- Launch Redis server locally on default port `6379`.
- Set `USE_REDIS=True` in `.env`.
- If Redis is unavailable, OmniRoom automatically falls back to `InMemoryChannelLayer` during local development without breaking.

---

## 🏃 Running the Application

### Start Development Server (ASGI / Daphne)

Run Django with Channels ASGI support:
```bash
cd backend
python manage.py runserver 8000
```
Or directly using Daphne ASGI server:
```bash
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

Access the application in your browser:
- **Landing Page**: `http://127.0.0.1:8000/app/index.html` or open `frontend/index.html` in your browser.
- **REST API Root**: `http://127.0.0.1:8000/api/`
- **Django Admin**: `http://127.0.0.1:8000/admin/`

---

## 📌 Implementation Status

| Feature / Phase | Status | Details |
| :--- | :--- | :--- |
| **Phase 0: Foundation** | ✅ Completed | Directory layout, Django apps, DRF, Channels ASGI config, `.env`, `.gitignore`. |
| **Phase 1: Auth & Dashboard** | ✅ Completed | Registration, Login, Logout, Session & CSRF auth, Protected Dashboard, Meeting creation endpoint. |
| **WebSocket Infrastructure**| ✅ Completed | `MeetingConsumer` connected, room groups joined via Channels, test messaging working. |
| **Phase 2: Meeting Management**| ⏳ Next Phase | Host/Participant roles, role-based meeting controls, ending meetings. |
| **Phase 4: WebRTC Video/Audio**| ⏳ Pending | Peer connection offer/answer signaling over WebSockets. |
| **Phase 5-8: Media/Features**| ⏳ Pending | Screen share, chat persistence, file upload authorization, whiteboard sync. |

---

## 🔜 Next Development Phase

**Phase 2 — Full Meeting Management & Phase 4 — Multi-user WebRTC Signaling**
- WebRTC Peer Connection negotiation over Django Channels WebSockets (`offer`, `answer`, `ice-candidate`).
- Live video & audio stream rendering in meeting grid.
