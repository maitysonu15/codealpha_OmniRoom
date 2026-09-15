# OneMeet --- System Architecture

## 1. Architecture Overview

OneMeet uses a modular client-server architecture.

``` text
Browser
  |
  | HTTPS / HTTP
  v
Django Application
  |
  +--> Django Authentication
  |
  +--> REST/API Layer
  |
  +--> Django Channels
  |       |
  |       +--> WebSocket signaling
  |       +--> Chat events
  |       +--> Presence
  |       +--> Whiteboard events
  |
  +--> Database
  |
  +--> Media/File Storage

Browser <------ WebRTC ------> Browser
             Audio/Video
             Screen Share

WebRTC may use STUN/TURN for NAT traversal.
```

## 2. Backend Rule

**The backend must be strictly Python Django.**

Do NOT introduce: - Node.js backend - Express.js backend - FastAPI -
Flask - Socket.IO server implemented in Node.js

Real-time functionality must use: - Django Channels - WebSockets -
Python/Django consumers

WebRTC remains a browser-side media technology.

## 3. Recommended Django Structure

``` text
backend/
├── manage.py
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── accounts/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── tests.py
│
├── meetings/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   ├── consumers.py
│   ├── routing.py
│   └── tests.py
│
├── chat/
│   ├── consumers.py
│   ├── routing.py
│   └── tests.py
│
├── whiteboard/
│   ├── consumers.py
│   ├── routing.py
│   └── tests.py
│
├── files/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── tests.py
│
└── requirements.txt
```

## 4. Frontend Structure

``` text
frontend/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── meeting.html
├── css/
│   ├── global.css
│   ├── auth.css
│   ├── dashboard.css
│   └── meeting.css
├── js/
│   ├── api.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── meeting.js
│   ├── webrtc.js
│   ├── websocket.js
│   ├── chat.js
│   ├── files.js
│   └── whiteboard.js
└── assets/
```

## 5. Core Data Models

### User

Use Django's built-in User model initially, with a profile model only if
needed.

### Meeting

Fields: - id - meeting_code - host - title - created_at - started_at -
ended_at - is_active

### MeetingParticipant

Fields: - meeting - user - joined_at - left_at - role

### SharedFile

Fields: - meeting - uploaded_by - file - original_name - file_size -
uploaded_at

### Optional ChatMessage

Fields: - meeting - sender - message - created_at

Persisting chat is optional for MVP; real-time delivery is mandatory.

## 6. REST/API Responsibilities

Django API handles: - Authentication - Meeting creation - Meeting
validation - Meeting membership - File upload - File metadata - File
download authorization - User information

## 7. WebSocket Responsibilities

Django Channels handles: - Meeting room presence - WebRTC signaling
messages - Chat - Whiteboard synchronization - Join/leave
notifications - Real-time meeting state

Example message types:

``` text
join
leave
offer
answer
ice-candidate
chat-message
whiteboard-draw
whiteboard-clear
screen-share-start
screen-share-stop
```

## 8. WebRTC Architecture

For the initial multi-user MVP, use a mesh topology.

``` text
       User A
      /       WebRTC      WebRTC
    /           User B ------ User C
```

This is suitable for a student/MVP project with a small number of
participants.

For larger scale, an SFU architecture such as mediasoup/Janus/LiveKit
could be considered later, but it is NOT required for the initial
OneMeet implementation.

## 9. WebRTC Signaling

Django Channels does not carry the media stream.

Flow:

``` text
User A
  |
  | offer
  v
Django Channels
  |
  | offer
  v
User B

User B
  |
  | answer
  v
Django Channels
  |
  | answer
  v
User A
```

ICE candidates are exchanged similarly.

Actual media flows peer-to-peer when possible.

## 10. File Security

Every file operation must verify: 1. User is authenticated. 2. Meeting
exists. 3. User belongs to the meeting. 4. File belongs to that meeting.

Never expose unrestricted media directories for protected meeting files.

## 11. Environment Configuration

Use `.env` for secrets and environment-specific values.

Example:

``` env
DEBUG=True
SECRET_KEY=change-me
DATABASE_URL=
REDIS_URL=
ALLOWED_HOSTS=
CORS_ALLOWED_ORIGINS=
STUN_SERVER=
TURN_SERVER=
TURN_USERNAME=
TURN_CREDENTIAL=
```

`.env` must be excluded from Git.

Provide `.env.example` with placeholders.

## 12. Development Infrastructure

Minimum: - Python 3.x - Django - Django REST Framework - Django
Channels - Channels Redis - Redis - Database - Browser with WebRTC
support

## 13. Production Architecture

``` text
                    HTTPS
                     |
               Reverse Proxy
                     |
              Django ASGI
              /                 HTTP/API       WebSockets
                        |
                  Django Channels
                        |
                      Redis

Browser A <---------- WebRTC ----------> Browser B
                       |
                 STUN/TURN if needed

Files --> Persistent/Object Storage
DB    --> PostgreSQL
```

## 14. Deployment Principle

The production server must run Django through ASGI for WebSockets.

Do not deploy the real-time backend as a Node/Express service.

## 15. Security Boundaries

-   Authentication boundary
-   Authorization boundary
-   Meeting membership boundary
-   File access boundary
-   WebSocket connection validation
-   Input validation
-   CSRF protection for cookie/session-based API operations
-   Secure cookies in production where applicable
-   HTTPS in production
-   Secret management outside source control
