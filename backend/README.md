# OneMeet — Backend Architecture & Service Layer

This directory contains the entire backend implementation for OneMeet, built with **Django 5.0**, **Django REST Framework**, and **Django Channels 4.0 (ASGI WebSockets)**.

---

## 📁 Directory Structure

```
backend/
├── accounts/          # Authentication, User Profiles, Email Verification & OTP
│   ├── models.py      # UserProfile, EmailVerificationOTP
│   ├── views.py       # Register, Login, SendOTP, VerifyOTP, ResetPasswordOTP
│   ├── serializers.py # DRF serializers for auth payloads
│   └── urls.py        # /api/auth/* endpoints
├── meetings/          # Meeting Rooms, Scheduling & WebRTC Signaling
│   ├── models.py      # Meeting, MeetingParticipant, MeetingRecording
│   ├── consumers.py   # WebRTC Signaling Consumer (SDP Offers, Answers, ICE Candidates)
│   ├── views.py       # Meeting CRUD, Join & Leave APIs
│   └── urls.py        # /api/meetings/* endpoints
├── chat/              # In-Meeting Real-time Chat
│   ├── models.py      # ChatMessage
│   ├── consumers.py   # Real-time WebSocket Chat Consumer
│   └── views.py       # Chat history retrieval
├── whiteboard/        # Collaborative Real-time Canvas
│   ├── models.py      # WhiteboardSnapshot
│   ├── consumers.py   # Real-time Canvas Stroke Broadcasting Consumer
│   └── views.py       # Snapshot save/load APIs
├── files/             # File Sharing & Meeting Attachments
│   ├── models.py      # SharedFile
│   ├── views.py       # File Upload, Download & List APIs
│   └── urls.py        # /api/files/* endpoints
├── config/            # Project Configuration
│   ├── asgi.py        # ASGI application for Daphne / WebSockets
│   ├── wsgi.py        # WSGI application
│   ├── settings.py    # Django & Channels settings (reads .env)
│   ├── urls.py        # Root URL routing & static/frontend resolution
│   └── routing.py     # Channels WebSocket routing
├── manage.py          # Django CLI
├── requirements.txt   # Python package dependencies
├── .env.example       # Backend environment variables template
└── db.sqlite3         # Development database (SQLite)
```

---

## ⚡ Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```

3. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Start ASGI Dev Server**:
   ```bash
   python manage.py runserver 8080
   ```

---

## 🔌 Core API Endpoints

- **Authentication & OTP**:
  - `POST /api/auth/send-otp/` — Send 6-digit verification code to email
  - `POST /api/auth/verify-otp/` — Verify 6-digit code
  - `POST /api/auth/register/` — Create account with verified OTP
  - `POST /api/auth/login/` — Authenticate user session
  - `POST /api/auth/logout/` — Terminate session
  - `POST /api/auth/reset-password-otp/` — Reset password using OTP
  - `GET /api/auth/me/` — Retrieve authenticated user profile
- **Meetings**:
  - `GET /api/meetings/` — List user's meetings
  - `POST /api/meetings/create/` — Create new instant/scheduled meeting room
  - `POST /api/meetings/join/` — Validate and join room code
- **Files**:
  - `GET /api/files/` — List meeting files
  - `POST /api/files/upload/` — Upload document/recording attachment
- **WebSockets**:
  - `ws://<host>/ws/signaling/<room_code>/` — WebRTC peer mesh signaling
  - `ws://<host>/ws/chat/<room_code>/` — Live meeting chat
  - `ws://<host>/ws/whiteboard/<room_code>/` — Collaborative whiteboard strokes
