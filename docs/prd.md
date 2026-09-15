# OneMeet --- Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** OneMeet\
**Product Type:** Real-Time Video Conferencing & Collaboration Platform\
**Primary Goal:** Build a secure, modern, multi-user communication
platform for video meetings, screen sharing, file sharing, collaborative
whiteboard, authentication, and real-time communication.

OneMeet is intended as a college/major project demonstrating practical
skills across frontend engineering, Django backend development, WebRTC
media streaming, real-time communication, database design,
authentication, file handling, and security.

## 2. Problem Statement

Users need a single web application where they can create or join a
meeting and communicate using video/audio while collaborating through
screen sharing, chat, file sharing, and a shared whiteboard.

## 3. Target Users

-   Students
-   Project teams
-   Teachers/mentors
-   Small teams
-   Anyone needing a private browser-based meeting room

## 4. Core Requirements

### 4.1 User Authentication

-   User registration
-   User login
-   User logout
-   Secure password hashing using Django's authentication system
-   Protected authenticated pages
-   User profile/basic account information

### 4.2 Meeting Management

-   Create a meeting
-   Generate a unique meeting ID/code
-   Join a meeting using a meeting ID
-   Meeting host identification
-   Participant list
-   Leave/end meeting
-   Meeting status
-   Meeting history for authenticated users

### 4.3 Multi-user Video Calling

-   Camera enable/disable
-   Microphone enable/disable
-   Multi-user WebRTC video
-   Local video preview
-   Remote participant video tiles
-   Participant join/leave handling
-   Connection status indicators

### 4.4 Screen Sharing

-   Start screen sharing
-   Stop screen sharing
-   Share screen/window/browser tab through WebRTC
-   Notify other participants when screen sharing is active

### 4.5 Real-Time Communication

-   WebSocket-based real-time communication
-   WebRTC signaling
-   Participant presence
-   Real-time chat
-   Meeting events
-   Whiteboard synchronization

### 4.6 File Sharing

-   Upload files within a meeting
-   List shared files
-   Download files
-   Show filename, size, uploader, and timestamp
-   Validate file type and size
-   Authorize access to meeting files

### 4.7 Collaborative Whiteboard

-   Shared HTML Canvas whiteboard
-   Freehand drawing
-   Eraser
-   Line
-   Rectangle
-   Circle
-   Text
-   Color selection
-   Clear board
-   Undo/redo where practical
-   Real-time synchronization between participants

### 4.8 Security

-   Django authentication
-   CSRF protection
-   Secure password hashing
-   Server-side validation
-   Authorization checks
-   Meeting membership checks
-   File access checks
-   Environment variables for secrets
-   Secure CORS configuration
-   Production HTTPS readiness
-   WebRTC encrypted media where supported by the browser/network

## 5. Recommended Technology Stack

### Frontend

-   HTML5
-   CSS3
-   Vanilla JavaScript
-   Responsive design
-   Fetch API
-   WebRTC APIs
-   HTML Canvas

### Backend

-   **Python**
-   **Django**
-   Django REST Framework where API endpoints are useful
-   Django Channels for WebSocket support
-   Redis as the production-ready channel layer
-   SQLite for initial development; PostgreSQL for production

### Real-Time / Media

-   WebRTC for audio/video and screen sharing
-   Django Channels/WebSockets for signaling and real-time events
-   STUN/TURN configuration for production WebRTC connectivity

### Storage

-   Django media storage for development
-   Production object storage or persistent media storage can be added
    later

## 6. Non-Functional Requirements

-   Responsive on desktop, tablet, and mobile
-   Clean modern UI
-   Modular codebase
-   Clear separation between frontend and backend
-   Secure configuration
-   Good error handling
-   Maintainable Django architecture
-   No hard-coded credentials
-   No secrets committed to Git

## 7. MVP Scope

The MVP must include:

1.  Registration/login/logout
2.  Dashboard
3.  Create meeting
4.  Join meeting
5.  Multi-user WebRTC video/audio
6.  Camera/microphone controls
7.  Screen sharing
8.  Real-time chat
9.  File sharing
10. Collaborative whiteboard
11. Participant list
12. Meeting leave/end
13. Basic security and authorization

## 8. Future Enhancements

-   Meeting recording
-   Meeting scheduling
-   Calendar integration
-   Host moderation controls
-   Raise hand
-   Reactions
-   Noise suppression
-   Virtual backgrounds
-   Meeting transcription
-   Cloud storage
-   Email invitations
-   Advanced analytics

## 9. Acceptance Criteria

The project is considered complete when:

-   A user can register and log in.
-   An authenticated user can create a meeting.
-   Another authenticated user can join using the meeting ID.
-   Multiple users can communicate using browser camera/microphone.
-   Users can turn camera/microphone on and off.
-   A user can share their screen.
-   Users can exchange real-time chat messages.
-   Users can upload/download authorized meeting files.
-   Participants can draw on a synchronized whiteboard.
-   Unauthorized users cannot access protected meeting/file resources.
-   The application runs locally using documented setup commands.
-   Production configuration is separated from development
    configuration.
