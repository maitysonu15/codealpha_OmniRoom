# OneMeet --- Project Memory

## Project Identity

**Project Name:** OneMeet

**Project Type:** Real-Time Communication and Collaboration Web
Application

**Tagline:** One place. One meeting. One connection.

## Primary Objective

Build a browser-based multi-user communication platform with video
calling, screen sharing, file sharing, collaborative whiteboard,
real-time chat, authentication, and security.

## Non-Negotiable Technology Rule

### Backend MUST be Python Django.

Allowed backend technologies: - Python - Django - Django REST
Framework - Django Channels - Redis - PostgreSQL

Not allowed as backend: - Node.js - Express.js - FastAPI - Flask -
Socket.IO server

Socket.IO is NOT required. Real-time communication must use Django
Channels/WebSockets.

## Frontend

Use: - HTML - CSS - Vanilla JavaScript - WebRTC browser APIs - Canvas
API - Fetch API

A frontend framework is not required for the MVP.

## Real-Time Architecture

Use: - WebRTC for audio/video/screen sharing - Django Channels for
signaling and real-time events - Redis as the channel layer

Django Channels carries signaling/events, not the actual video media
stream.

## Core Features

1.  Authentication
2.  Dashboard
3.  Create meeting
4.  Join meeting
5.  Multi-user video/audio
6.  Camera toggle
7.  Microphone toggle
8.  Screen sharing
9.  Real-time chat
10. File sharing
11. Collaborative whiteboard
12. Participant list
13. Meeting leave/end
14. Security and authorization

## Development Rules

### Rule 1 --- Preserve Working Features

When adding a new feature: - Do not unnecessarily rewrite existing
working code. - Do not remove working functionality. - Do not change
architecture without a clear reason. - Test existing features after
changes.

### Rule 2 --- Django Backend Only

Never introduce a second backend technology just to solve a real-time
problem.

Use Django Channels for WebSockets.

### Rule 3 --- Environment Secrets

Never commit: - `.env` - Django SECRET_KEY - database passwords - TURN
credentials - API secrets

Always maintain `.env.example`.

### Rule 4 --- Security

All protected resources must verify: - Authentication - Authorization -
Meeting membership

### Rule 5 --- Incremental Development

Implement one phase at a time.

Do not mark a feature complete until it has been tested.

### Rule 6 --- Explain Important Changes

For significant architectural changes, explain: - What changed - Why it
changed - Which files changed - How to test it

## Current Starting State

The project is starting from a new codebase.

First implementation task: - Create the OneMeet project structure. -
Create Django backend. - Create frontend. - Configure Django. -
Configure ASGI. - Prepare Django Channels. - Prepare database
configuration. - Prepare environment configuration. - Create initial
authentication foundation. - Do not implement all advanced features in
one step.

## Definition of Done

A feature is done only when: - Code is implemented. - Application starts
successfully. - Relevant API/WebSocket routes work. - Error handling
exists. - Security checks exist where applicable. - Existing features
still work. - The feature is documented briefly.

## Important Future Deployment Requirement

Production real-time communication will require: - HTTPS - ASGI
deployment - Redis - PostgreSQL - STUN/TURN configuration - Proper
CORS/allowed-host configuration - Persistent file storage
