# OneMeet — Frontend Architecture & Client Layer

This directory contains the entire frontend client application for OneMeet, built with **modern Vanilla JavaScript (ES6+)**, **Custom Design System (CSS3 with Glassmorphism & Micro-animations)**, **WebRTC API**, and **HTML5 Canvas**.

---

## 📁 Directory Structure

```
frontend/
├── css/
│   ├── global.css        # Core tokens, reset, typography, buttons, glass cards, navbar
│   ├── auth.css          # Auth layouts, 6-digit OTP inputs, step transitions
│   ├── dashboard.css     # Atmospheric cosmic mesh, stats cards, meeting schedules
│   ├── meeting.css       # Video grid layouts, participant tiles, control docks
│   └── whiteboard.css    # Canvas toolbars, color palettes, stroke size selectors
├── js/
│   ├── config.js         # Dynamic environment host & WebSocket URL resolver
│   ├── api.js            # Fetch wrapper with CSRF injection & cookie handling
│   ├── auth.js           # Auth handlers, 6-box OTP auto-advancing, countdown timer
│   ├── webrtc.js         # PeerConnection mesh, ICE gathering, track management
│   ├── websocket.js      # Robust WebSocket client with auto-reconnection
│   ├── dashboard.js      # Live search, quick actions, schedule management
│   ├── meeting.js        # Meeting lifecycle, screen sharing, audio/video toggles
│   ├── chat.js           # Live chat message rendering & notifications
│   ├── whiteboard.js     # HTML5 collaborative canvas stroke drawing & undo/redo
│   └── ui.js             # Toast notifications, modal dialogs, theme switches
├── index.html            # Public landing page with features showcase
├── dashboard.html        # User workspace dashboard & meeting management
├── meeting.html          # WebRTC HD multi-participant video conference room
├── login.html            # Account sign-in
├── register.html         # 2-step registration with interactive 6-digit OTP
├── verify-otp.html       # Standalone email verification page
├── forgot-password.html  # 2-step OTP password reset
├── join.html             # Fast room join by 6-digit meeting code
└── profile.html          # User profile settings & password changes
```

---

## 🌐 Dynamic API & WebSocket Configuration

The client automatically detects its host environment (`localhost:8080`, custom ports, or production domains like Vercel):
- **Local Dev Server**: Connects automatically to `http://127.0.0.1:8080/api` and `ws://127.0.0.1:8080/ws/*`.
- **Runtime Override**: You can override endpoints at any time in browser console:
  ```javascript
  localStorage.setItem('onemeet_api_url', 'https://api.yourdomain.com/api');
  localStorage.setItem('onemeet_ws_url', 'wss://api.yourdomain.com');
  ```

---

## ⚡ Standalone Dev Server (Optional)

If running a separate static file server:
```bash
# From workspace root
npx serve frontend -l 3000
```
