# OneMeet --- System Architecture

## 1. Architecture Overview

OneMeet uses a modular client-server architecture:

```text
Browser <---> HTTPS / HTTP <---> Django Backend (DRF / Auth)
Browser <---> WebSockets   <---> Django Channels (ASGI + Redis)
Browser <===> WebRTC (P2P) <===> Browser (Audio/Video/Screen Share)
```

## 2. Backend Rule
**The backend must be strictly Python Django.**
No Node.js, Express, Socket.IO server, FastAPI, or Flask.

Real-time functionality MUST use Django Channels and WebSockets.

## 3. Technology Stack
- **Backend**: Python 3.12, Django 5.x, Django REST Framework, Django Channels, Redis channel layer, SQLite/PostgreSQL.
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (CSS Variables & Flexbox/Grid), Fetch API, WebRTC APIs, Canvas API.
