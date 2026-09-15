# OneMeet --- Design Specification

## 1. Design Direction

OneMeet should look like a modern SaaS communication product: clean,
minimal, professional, and focused on the meeting experience.

**Design principles:** - Simple navigation - High readability - Strong
visual hierarchy - Meeting controls always easy to access - Responsive
layout - Accessible buttons and forms - Consistent spacing and
typography - Avoid unnecessary visual clutter

## 2. Brand

**Name:** OneMeet

**Suggested tagline:**\
**One place. One meeting. One connection.**

Alternative: **Connect. Collaborate. Communicate.**

## 3. Main Screens

### 3.1 Landing Page

Sections: - Navbar - Hero - Primary CTA: Start Meeting - Secondary CTA:
Join Meeting - Feature cards - Security section - Collaboration
section - Footer

Hero message: \> Meet, share, collaborate --- all in one place.

### 3.2 Authentication

Pages: - Login - Register - Logout - Optional password reset later

Design: - Centered authentication card - Clean form fields - Password
visibility toggle - Validation messages - Loading state - Clear
success/error feedback

### 3.3 Dashboard

Dashboard should contain: - Welcome section - Create Meeting button -
Join Meeting field - Recent meetings - User profile menu - Logout

Suggested layout:

\[Sidebar/Nav\] \[Welcome + Create Meeting\] \[Join Meeting\] \[Recent
Meetings\]

### 3.4 Meeting Room

The meeting room is the most important screen.

Desktop layout:

``` text
+------------------------------------------------------------+
| OneMeet | Meeting ID | Connection | User/Profile           |
+------------------------------------------------------------+
|                                                            |
|                 Video Grid / Screen Share                  |
|                                                            |
|  +-----------+  +-----------+  +-----------+               |
|  | User A    |  | User B    |  | User C    |               |
|  +-----------+  +-----------+  +-----------+               |
|                                                            |
+------------------------------------------------------------+
| Mic | Camera | Screen | Chat | Files | Whiteboard | Leave |
+------------------------------------------------------------+
```

Right-side panel or bottom sheet: - Participants - Chat - Files -
Whiteboard

### 3.5 Whiteboard

Toolbar: - Select - Pencil - Line - Rectangle - Circle - Text - Eraser -
Color - Stroke size - Undo - Redo - Clear

Canvas should occupy most of the available workspace.

## 4. UI Components

Reusable components: - Navbar - Button - Input - Modal - Toast -
Avatar - Badge - Video tile - Control button - Sidebar panel - File
row - Chat message - Loading indicator - Error message

## 5. Color System

Use a restrained professional palette.

Suggested semantic roles: - Primary: blue/indigo - Success: green -
Warning: amber - Error: red - Background: light neutral - Surface:
white - Text: dark neutral - Secondary text: gray

Dark mode can be added after the MVP.

## 6. Responsive Design

### Desktop

-   Full video grid
-   Side panels
-   Full control bar

### Tablet

-   Adaptive video grid
-   Collapsible side panels

### Mobile

-   Single/dual-column video layout
-   Bottom control bar
-   Panels as drawers
-   Touch-friendly controls

## 7. Meeting UX

Important states: - Connecting - Connected - Reconnecting - Camera
blocked - Microphone blocked - Screen sharing active - Participant
joined - Participant left - Meeting ended

Use clear visual feedback instead of relying only on console logs.

## 8. Accessibility

-   Keyboard-accessible controls
-   Visible focus states
-   Meaningful button labels
-   ARIA labels where required
-   Sufficient text contrast
-   Do not communicate status only by color

## 9. Error UX

Errors should be human-readable.

Examples: - "Unable to access your camera. Check browser permissions." -
"Meeting not found." - "You are not authorized to access this file." -
"Connection lost. Reconnecting..."

Never expose stack traces to end users.
