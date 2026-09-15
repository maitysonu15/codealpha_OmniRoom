/**
 * OmniRoom Commercial-Grade Real-Time Video Conference Engine
 * WebRTC Mesh Signaling, Django Channels WebSockets, Screen Sharing & Collaborative Canvas
 */

let currentMeetingCode = null;
let currentMeetingData = null;
let currentUser = null;
let isHost = false;
let websocketClient = null;
let myChannelName = null;

// Local Media Stream State
let localMediaStream = null;
let screenMediaStream = null;
let isMicActive = true;
let isCameraActive = true;
let isScreenSharing = false;
let isHandRaised = false;

// WebRTC Peer Connections Map: { peerChannelName: { pc, stream, username } }
const peerConnections = new Map();
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Web Audio API Active Speaker Detection
let audioContext = null;
let localAudioAnalyser = null;
let localAudioSource = null;
let speakerAnimId = null;

// UI & Drawer States
let currentActiveDrawerTab = null;
let unreadChatCount = 0;
let meetingStartTime = Date.now();
let timerInterval = null;

// Whiteboard State
let wbCanvas = null;
let wbCtx = null;
let isDrawing = false;
let currentTool = 'pen'; // pen, highlighter, eraser, line, arrow, rect, circle, text
let drawColor = '#6366f1';
let strokeWidth = 3;
let startX = 0;
let startY = 0;
let wbHistory = [];
let wbSnapshot = null;

// Remote Participants Cache
let roomParticipants = new Map();

// High-Definition Glossy Vector SVG Icons
const ICONS = {
  micOn: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  micOff: `<svg class="svg-icon" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  camOn: `<svg class="svg-icon" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  camOff: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m4 0h6a2 2 0 0 1 2 2v4"/><polygon points="23 7 16 12 23 17 23 7"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  micTileOn: `<svg class="svg-icon" style="width: 14px; height: 14px; stroke: #10b981;" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>`,
  micTileOff: `<svg class="svg-icon" style="width: 14px; height: 14px; stroke: #f43f5e;" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/></svg>`,
  pin: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  fullscreen: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  pen: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>`,
  highlighter: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><path d="M18.37 2.63a2.5 2.5 0 0 1 3.54 3.54L7.5 20.58l-5.66 1.42 1.42-5.66z"/></svg>`,
  eraser: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"/></svg>`,
  line: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5"/></svg>`,
  arrow: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  rect: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
  circle: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>`,
  text: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  undo: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
  trash: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  save: `<svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  file: `<svg class="svg-icon" style="width: 20px; height: 20px;" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`
};

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentMeetingCode = urlParams.get('code');

  if (urlParams.get('mic') === 'false') isMicActive = false;
  if (urlParams.get('cam') === 'false') isCameraActive = false;

  if (!currentMeetingCode) {
    showToast('No meeting code provided. Redirecting to dashboard...', 'error');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    return;
  }

  // Force Dark Theme in Meeting Room
  document.documentElement.setAttribute('data-theme', 'dark');

  // Verify User Authentication
  currentUser = await checkAuthStatus();
  if (!currentUser) {
    const guestNumber = Math.floor(1000 + Math.random() * 9000);
    currentUser = {
      id: 'guest_' + guestNumber,
      username: `Guest_${guestNumber}`,
      email: `guest${guestNumber}@omniroom.local`,
      first_name: 'Guest',
      last_name: `${guestNumber}`,
      avatar_url: ''
    };
    localStorage.setItem('omniroom_user', JSON.stringify(currentUser));
    localStorage.setItem('onemeet_user', JSON.stringify(currentUser));
  }

  // Initialize UI
  document.getElementById('display-meeting-code').textContent = currentMeetingCode;
  document.getElementById('local-user-name').textContent = `${currentUser.username} (You)`;
  document.getElementById('local-user-avatar').textContent = currentUser.username.charAt(0).toUpperCase();

  // Start Meeting Duration Timer
  startMeetingTimer();

  // Request Local Media Stream
  await initLocalMediaStream();

  // Load Meeting Details & Connect WebSocket Signaling
  try {
    currentMeetingData = await apiFetch(`/meetings/${currentMeetingCode}/`);
    isHost = (currentMeetingData.host && currentMeetingData.host.id === currentUser.id);

    document.getElementById('display-meeting-name').textContent = currentMeetingData.title || 'Meeting';
    
    // Configure Host Controls if user is host
    if (isHost) {
      const endForAllBtn = document.getElementById('btn-end-for-all');
      if (endForAllBtn) endForAllBtn.style.display = 'inline-flex';
    }

    // Connect to Django Channels WebSocket for room signaling
    initWebSocket(currentMeetingCode, currentUser);
  } catch (err) {
    showToast(`Meeting connection error: ${err.message}`, 'error');
  }

  // Setup Control Bar & Drawer Listeners
  setupMeetingControls();
});

function startMeetingTimer() {
  const timerElem = document.getElementById('meeting-timer');
  if (!timerElem) return;

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - meetingStartTime) / 1000);
    const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    timerElem.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// --------------------------------------------------------------------------
// 1. LOCAL MEDIA STREAM & ACTIVE SPEAKER DETECTION
// --------------------------------------------------------------------------

async function initLocalMediaStream() {
  const videoElem = document.getElementById('local-video-element');
  const avatarElem = document.getElementById('local-user-avatar');
  const micIcon = document.getElementById('local-mic-icon');

  try {
    localMediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true }
    });

    if (videoElem) {
      videoElem.srcObject = localMediaStream;
      videoElem.style.display = isCameraActive ? 'block' : 'none';
      if (avatarElem) avatarElem.style.display = isCameraActive ? 'none' : 'flex';
    }

    // Apply initial mic/cam preferences
    if (localMediaStream.getAudioTracks().length > 0) {
      localMediaStream.getAudioTracks()[0].enabled = isMicActive;
    }
    if (localMediaStream.getVideoTracks().length > 0) {
      localMediaStream.getVideoTracks()[0].enabled = isCameraActive;
    }

    const btnMic = document.getElementById('btn-toggle-mic');
    const btnCam = document.getElementById('btn-toggle-cam');
    if (btnMic) {
      btnMic.classList.toggle('off', !isMicActive);
      btnMic.classList.toggle('active', isMicActive);
      btnMic.innerHTML = isMicActive ? ICONS.micOn : ICONS.micOff;
    }
    if (btnCam) {
      btnCam.classList.toggle('off', !isCameraActive);
      btnCam.classList.toggle('active', isCameraActive);
      btnCam.innerHTML = isCameraActive ? ICONS.camOn : ICONS.camOff;
    }
    if (micIcon) {
      micIcon.innerHTML = isMicActive ? ICONS.micTileOn : ICONS.micTileOff;
      micIcon.className = `mic-status-icon ${isMicActive ? '' : 'mic-muted'}`;
    }

    // Start Audio Analyser for Speaking Indicator
    initSpeakingDetection(localMediaStream);
  } catch (err) {
    console.warn('Microphone or Camera access unavailable:', err);
    showToast('Camera or mic not accessible (using avatar fallback mode)', 'info');
    if (videoElem) videoElem.style.display = 'none';
    if (avatarElem) avatarElem.style.display = 'flex';
  }
}

function initSpeakingDetection(stream) {
  try {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    localAudioSource = audioContext.createMediaStreamSource(stream);
    localAudioAnalyser = audioContext.createAnalyser();
    localAudioAnalyser.fftSize = 64;
    localAudioSource.connect(localAudioAnalyser);

    const localTile = document.getElementById('local-video-tile');
    const dataArray = new Uint8Array(localAudioAnalyser.frequencyBinCount);

    function checkSpeaking() {
      if (isMicActive && localAudioAnalyser) {
        localAudioAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;

        if (avg > 18) {
          if (localTile) localTile.classList.add('speaking');
        } else {
          if (localTile) localTile.classList.remove('speaking');
        }
      } else {
        if (localTile) localTile.classList.remove('speaking');
      }
      speakerAnimId = requestAnimationFrame(checkSpeaking);
    }
    checkSpeaking();
  } catch (e) {
    console.warn('Speaking detection not initialized:', e);
  }
}

// --------------------------------------------------------------------------
// 2. DJANGO CHANNELS WEBSOCKET & WEBRTC SIGNALING
// --------------------------------------------------------------------------

function initWebSocket(meetingCode, user) {
  let wsBase = (typeof window !== 'undefined' && (localStorage.getItem('omniroom_ws_url') || localStorage.getItem('onemeet_ws_url')))
    ? (localStorage.getItem('omniroom_ws_url') || localStorage.getItem('onemeet_ws_url'))
    : (typeof window !== 'undefined' && ((window.OMNIROOM_CONFIG && window.OMNIROOM_CONFIG.WS_URL) || (window.OPENMEET_CONFIG && window.OPENMEET_CONFIG.WS_URL)))
      ? (window.OMNIROOM_CONFIG?.WS_URL || window.OPENMEET_CONFIG?.WS_URL)
      : ((window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + (window.location.host || '127.0.0.1:8080'));

  if (!wsBase.startsWith('ws://') && !wsBase.startsWith('wss://')) {
    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    wsBase = proto + wsBase.replace(/^\/+/, '');
  }

  const wsUrl = `${wsBase.replace(/\/+$/, '')}/ws/meetings/${meetingCode}/`;

  updateConnectionStatus('Connecting...', 'status-warning');
  websocketClient = new WebSocket(wsUrl);

  websocketClient.onopen = () => {
    updateConnectionStatus('🟢 Excellent', 'status-excellent');
    showToast('Connected to OmniRoom live room', 'success');
  };

  websocketClient.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      await handleWebSocketMessage(data);
    } catch (err) {
      console.error('[WebSocket Parse Error]', err);
    }
  };

  websocketClient.onerror = (err) => {
    updateConnectionStatus('🟡 Reconnecting...', 'status-warning');
  };

  websocketClient.onclose = () => {
    updateConnectionStatus('🔴 Disconnected', 'status-warning');
  };
}

function updateConnectionStatus(text, badgeClass) {
  const statusEl = document.getElementById('connection-status-badge');
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.className = `status-badge ${badgeClass}`;
  }
}

async function handleWebSocketMessage(msg) {
  const msgType = msg.type;

  // 1. Connection confirmation
  if (msgType === 'connection_established') {
    myChannelName = msg.channel_name;
    return;
  }

  // 2. User Joined -> Initiate WebRTC Offer if we are an existing participant
  if (msgType === 'user_joined') {
    const peerUser = msg.user;
    const peerChannel = msg.sender_channel;

    if (peerChannel && peerChannel !== myChannelName) {
      showToast(`${peerUser} joined the meeting`, 'info');
      roomParticipants.set(peerChannel, { username: peerUser });
      updateParticipantBadgeCount();

      // Initiate WebRTC peer connection offer
      await createPeerOffer(peerChannel, peerUser);
    }
  }

  // 3. User Left
  else if (msgType === 'user_left') {
    const peerChannel = msg.sender_channel;
    const peerInfo = roomParticipants.get(peerChannel);
    if (peerInfo) {
      showToast(`${peerInfo.username} left the meeting`, 'info');
      removePeerConnection(peerChannel);
      roomParticipants.delete(peerChannel);
      updateParticipantBadgeCount();
    }
  }

  // 4. Direct WebRTC message (Offer, Answer, Candidate)
  else if (msgType === 'direct_message') {
    const senderChannel = msg.sender_channel;
    const senderUser = msg.sender;
    const payload = msg.data;

    if (payload.action === 'webrtc_offer') {
      await handleIncomingOffer(senderChannel, senderUser, payload.offer);
    } else if (payload.action === 'webrtc_answer') {
      await handleIncomingAnswer(senderChannel, payload.answer);
    } else if (payload.action === 'webrtc_candidate') {
      await handleIncomingCandidate(senderChannel, payload.candidate);
    }
  }

  // 5. Room broadcast messages (Chat, Media states, Whiteboard, Hand raise, End room)
  else if (msgType === 'broadcast') {
    const payload = msg.data;
    const sender = msg.sender;

    if (payload.type === 'chat_message') {
      appendChatMessage(sender, payload.message, new Date());
      if (currentActiveDrawerTab !== 'chat') {
        unreadChatCount++;
        updateUnreadBadge();
      }
    } else if (payload.type === 'media_state') {
      updateRemoteMediaState(msg.sender_channel, payload);
    } else if (payload.type === 'whiteboard_draw') {
      applyRemoteWhiteboardDraw(payload);
    } else if (payload.type === 'whiteboard_clear') {
      if (wbCtx && wbCanvas) wbCtx.clearRect(0, 0, wbCanvas.width, wbCanvas.height);
    } else if (payload.type === 'meeting_ended') {
      showToast('The host has ended this meeting for all participants.', 'info');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    }
  }
}

// --------------------------------------------------------------------------
// 3. WEBRTC PEER-TO-PEER MESH ENGINE
// --------------------------------------------------------------------------

function createPeerConnection(peerChannel, peerUser) {
  const pc = new RTCPeerConnection(rtcConfig);

  // Add local media tracks
  if (localMediaStream) {
    localMediaStream.getTracks().forEach(track => {
      pc.addTrack(track, localMediaStream);
    });
  }

  // ICE Candidate exchange
  pc.onicecandidate = (event) => {
    if (event.candidate && websocketClient && websocketClient.readyState === WebSocket.OPEN) {
      websocketClient.send(JSON.stringify({
        target_channel: peerChannel,
        action: 'webrtc_candidate',
        candidate: event.candidate
      }));
    }
  };

  // Remote track received -> Create/Update dynamic tile in video grid
  pc.ontrack = (event) => {
    const remoteStream = event.streams[0] || new MediaStream([event.track]);
    addOrUpdateRemoteVideoTile(peerChannel, peerUser, remoteStream);
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      removePeerConnection(peerChannel);
    }
  };

  peerConnections.set(peerChannel, { pc, username: peerUser });
  return pc;
}

async function createPeerOffer(peerChannel, peerUser) {
  const pc = createPeerConnection(peerChannel, peerUser);
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    websocketClient.send(JSON.stringify({
      target_channel: peerChannel,
      action: 'webrtc_offer',
      offer: offer
    }));
  } catch (err) {
    console.error(`Error creating offer to ${peerUser}:`, err);
  }
}

async function handleIncomingOffer(senderChannel, senderUser, offer) {
  let peerObj = peerConnections.get(senderChannel);
  let pc = peerObj ? peerObj.pc : null;

  if (!pc) {
    pc = createPeerConnection(senderChannel, senderUser);
    roomParticipants.set(senderChannel, { username: senderUser });
    updateParticipantBadgeCount();
  }

  try {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    websocketClient.send(JSON.stringify({
      target_channel: senderChannel,
      action: 'webrtc_answer',
      answer: answer
    }));
  } catch (err) {
    console.error(`Error answering offer from ${senderUser}:`, err);
  }
}

async function handleIncomingAnswer(senderChannel, answer) {
  const peerObj = peerConnections.get(senderChannel);
  if (peerObj && peerObj.pc) {
    try {
      await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('Error applying remote answer:', err);
    }
  }
}

async function handleIncomingCandidate(senderChannel, candidate) {
  const peerObj = peerConnections.get(senderChannel);
  if (peerObj && peerObj.pc) {
    try {
      await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }
}

function addOrUpdateRemoteVideoTile(peerChannel, username, stream) {
  const grid = document.getElementById('video-grid');
  if (!grid) return;

  const tileId = `tile-${peerChannel.replace(/[^a-zA-Z0-9]/g, '_')}`;
  let tile = document.getElementById(tileId);

  if (!tile) {
    tile = document.createElement('div');
    tile.className = 'video-tile';
    tile.id = tileId;
    tile.innerHTML = `
      <video id="video-${tileId}" autoplay playsinline></video>
      <div class="video-avatar-fallback" id="avatar-${tileId}" style="display: none;">${username.charAt(0).toUpperCase()}</div>
      <div class="video-tile-controls">
        <button class="tile-btn" onclick="togglePinTile('${tileId}')" title="Pin Video">${ICONS.pin}</button>
        <button class="tile-btn" onclick="toggleFullscreenTile('${tileId}')" title="Fullscreen">${ICONS.fullscreen}</button>
      </div>
      <div class="participant-overlay" style="display: flex; align-items: center; gap: 6px;">
        <span id="mic-icon-${tileId}" class="mic-status-icon">${ICONS.micTileOn}</span>
        <span>${escapeHtml(username)}</span>
      </div>
    `;
    grid.appendChild(tile);
    grid.setAttribute('data-count', grid.children.length);
  }

  const videoElem = document.getElementById(`video-${tileId}`);
  if (videoElem) {
    videoElem.srcObject = stream;
    videoElem.play().catch(e => console.warn('Auto-play blocked:', e));
  }
}

function removePeerConnection(peerChannel) {
  const peerObj = peerConnections.get(peerChannel);
  if (peerObj && peerObj.pc) {
    peerObj.pc.close();
  }
  peerConnections.delete(peerChannel);

  const tileId = `tile-${peerChannel.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const tile = document.getElementById(tileId);
  if (tile) {
    tile.remove();
    const grid = document.getElementById('video-grid');
    if (grid) grid.setAttribute('data-count', grid.children.length);
  }
}

function updateRemoteMediaState(peerChannel, state) {
  if (!peerChannel) return;
  const tileId = `tile-${peerChannel.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const micIcon = document.getElementById(`mic-icon-${tileId}`);
  const videoElem = document.getElementById(`video-${tileId}`);
  const avatarElem = document.getElementById(`avatar-${tileId}`);

  if (micIcon && state.isMicActive !== undefined) {
    micIcon.innerHTML = state.isMicActive ? ICONS.micTileOn : ICONS.micTileOff;
    micIcon.className = `mic-status-icon ${state.isMicActive ? '' : 'mic-muted'}`;
  }

  if (state.isCameraActive !== undefined) {
    if (videoElem) videoElem.style.display = state.isCameraActive ? 'block' : 'none';
    if (avatarElem) avatarElem.style.display = state.isCameraActive ? 'none' : 'flex';
  }
}

function updateParticipantBadgeCount() {
  const countBadge = document.getElementById('participant-count-badge');
  const count = roomParticipants.size + 1; // Peers + You
  if (countBadge) {
    countBadge.innerHTML = `<svg class="svg-icon" style="width: 13px; height: 13px;" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> <span>${count}</span>`;
  }

  const drawerTitle = document.getElementById('drawer-title');
  if (currentActiveDrawerTab === 'people' && drawerTitle) {
    drawerTitle.textContent = `Participants (${count})`;
    renderParticipantsPanel(document.getElementById('drawer-content'));
  }
}

// --------------------------------------------------------------------------
// 4. MEETING CONTROL BAR HANDLERS & SCREEN SHARING
// --------------------------------------------------------------------------

function setupMeetingControls() {
  // Mic Toggle Button
  const btnMic = document.getElementById('btn-toggle-mic');
  if (btnMic) {
    btnMic.addEventListener('click', toggleMicrophone);
  }

  // Camera Toggle Button
  const btnCam = document.getElementById('btn-toggle-cam');
  if (btnCam) {
    btnCam.addEventListener('click', toggleCamera);
  }

  // Screen Sharing Button
  const btnScreen = document.getElementById('btn-toggle-screen');
  if (btnScreen) {
    btnScreen.addEventListener('click', toggleScreenShare);
  }

  // Raise Hand Button
  const btnHand = document.getElementById('btn-raise-hand');
  if (btnHand) {
    btnHand.addEventListener('click', toggleRaiseHand);
  }

  // Copy Code Pill
  const copyBtn = document.getElementById('btn-copy-id');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(currentMeetingCode);
      showToast('Meeting ID copied to clipboard!', 'info');
    });
  }

  // Drawer Tabs Setup
  setupDrawerTab('btn-toggle-chat', 'chat', 'Meeting Chat', renderChatPanel);
  setupDrawerTab('btn-toggle-people', 'people', 'Participants', renderParticipantsPanel);
  setupDrawerTab('btn-toggle-files', 'files', 'Shared Room Files', renderFilesPanel);
  setupDrawerTab('btn-toggle-whiteboard', 'whiteboard', 'Collaborative Whiteboard', renderWhiteboardPanel);

  const closeDrawerBtn = document.getElementById('btn-close-drawer');
  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeDrawer);
  }

  // Leave & End Meeting Buttons
  const btnLeave = document.getElementById('btn-leave-meeting');
  if (btnLeave) {
    btnLeave.addEventListener('click', () => openModal('modal-confirm-leave'));
  }

  const confirmLeaveBtn = document.getElementById('btn-confirm-leave-action');
  if (confirmLeaveBtn) {
    confirmLeaveBtn.addEventListener('click', leaveMeeting);
  }

  const endForAllBtn = document.getElementById('btn-end-for-all');
  if (endForAllBtn) {
    endForAllBtn.addEventListener('click', endMeetingForAll);
  }

  // Populate Meeting Info Modal
  const infoTitle = document.getElementById('info-meeting-title');
  const infoId = document.getElementById('info-meeting-id');
  const infoLink = document.getElementById('info-meeting-link');
  if (infoTitle && currentMeetingData) infoTitle.value = currentMeetingData.title || 'Instant Meeting';
  if (infoId) infoId.value = currentMeetingCode;
  if (infoLink) infoLink.value = `${window.location.origin}/join.html?code=${currentMeetingCode}`;

  // Keyboard Shortcuts (M for Mic, V for Cam)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'm' || e.key === 'M') toggleMicrophone();
    if (e.key === 'v' || e.key === 'V') toggleCamera();
  });
}

function toggleMicrophone() {
  isMicActive = !isMicActive;
  if (localMediaStream && localMediaStream.getAudioTracks().length > 0) {
    localMediaStream.getAudioTracks()[0].enabled = isMicActive;
  }
  const btnMic = document.getElementById('btn-toggle-mic');
  const micIcon = document.getElementById('local-mic-icon');

  if (btnMic) {
    btnMic.classList.toggle('off', !isMicActive);
    btnMic.classList.toggle('active', isMicActive);
    btnMic.innerHTML = isMicActive ? ICONS.micOn : ICONS.micOff;
  }
  if (micIcon) {
    micIcon.innerHTML = isMicActive ? ICONS.micTileOn : ICONS.micTileOff;
    micIcon.className = `mic-status-icon ${isMicActive ? '' : 'mic-muted'}`;
  }

  showToast(isMicActive ? 'Microphone unmuted' : 'Microphone muted', 'info');
  broadcastMediaState();
}

function toggleCamera() {
  isCameraActive = !isCameraActive;
  if (localMediaStream && localMediaStream.getVideoTracks().length > 0) {
    localMediaStream.getVideoTracks()[0].enabled = isCameraActive;
  }
  const btnCam = document.getElementById('btn-toggle-cam');
  const videoElem = document.getElementById('local-video-element');
  const avatarElem = document.getElementById('local-user-avatar');

  if (btnCam) {
    btnCam.classList.toggle('off', !isCameraActive);
    btnCam.classList.toggle('active', isCameraActive);
    btnCam.innerHTML = isCameraActive ? ICONS.camOn : ICONS.camOff;
  }

  if (isCameraActive && localMediaStream) {
    if (videoElem) videoElem.style.display = 'block';
    if (avatarElem) avatarElem.style.display = 'none';
  } else {
    if (videoElem) videoElem.style.display = 'none';
    if (avatarElem) avatarElem.style.display = 'flex';
  }

  showToast(isCameraActive ? 'Camera enabled' : 'Camera disabled', 'info');
  broadcastMediaState();
}

async function toggleScreenShare() {
  const btnScreen = document.getElementById('btn-toggle-screen');
  const videoStage = document.getElementById('video-stage-main');

  if (!isScreenSharing) {
    try {
      screenMediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true
      });

      isScreenSharing = true;
      if (btnScreen) btnScreen.classList.add('active');

      const screenTrack = screenMediaStream.getVideoTracks()[0];

      // Replace video tracks in peer connections with screen track
      peerConnections.forEach(({ pc }) => {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });

      // Update local preview
      const localVideo = document.getElementById('local-video-element');
      if (localVideo) localVideo.srcObject = screenMediaStream;

      screenTrack.onended = () => stopScreenSharing();
      showToast('Screen sharing started', 'success');
    } catch (err) {
      console.warn('Screen share canceled or denied:', err);
    }
  } else {
    stopScreenSharing();
  }
}

function stopScreenSharing() {
  if (screenMediaStream) {
    screenMediaStream.getTracks().forEach(t => t.stop());
    screenMediaStream = null;
  }
  isScreenSharing = false;

  const btnScreen = document.getElementById('btn-toggle-screen');
  if (btnScreen) btnScreen.classList.remove('active');

  // Restore camera track in peer connections
  if (localMediaStream && localMediaStream.getVideoTracks().length > 0) {
    const camTrack = localMediaStream.getVideoTracks()[0];
    peerConnections.forEach(({ pc }) => {
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(camTrack);
      }
    });

    const localVideo = document.getElementById('local-video-element');
    if (localVideo) localVideo.srcObject = localMediaStream;
  }

  showToast('Screen sharing stopped', 'info');
}

function toggleRaiseHand() {
  isHandRaised = !isHandRaised;
  const btnHand = document.getElementById('btn-raise-hand');
  const localTile = document.getElementById('local-video-tile');

  if (btnHand) btnHand.classList.toggle('active', isHandRaised);

  let handBadge = document.getElementById('local-hand-badge');
  if (isHandRaised) {
    if (!handBadge && localTile) {
      handBadge = document.createElement('span');
      handBadge.id = 'local-hand-badge';
      handBadge.className = 'hand-raised-badge';
      handBadge.textContent = '✋ Hand Raised';
      localTile.appendChild(handBadge);
    }
    showToast('Hand raised', 'info');
  } else {
    if (handBadge) handBadge.remove();
    showToast('Hand lowered', 'info');
  }

  broadcastMediaState();
}

function broadcastMediaState() {
  if (websocketClient && websocketClient.readyState === WebSocket.OPEN) {
    websocketClient.send(JSON.stringify({
      type: 'media_state',
      isMicActive,
      isCameraActive,
      isHandRaised
    }));
  }
}

async function leaveMeeting() {
  if (websocketClient) websocketClient.close();
  if (localMediaStream) localMediaStream.getTracks().forEach(t => t.stop());
  if (screenMediaStream) screenMediaStream.getTracks().forEach(t => t.stop());
  if (speakerAnimId) cancelAnimationFrame(speakerAnimId);
  if (timerInterval) clearInterval(timerInterval);

  try {
    await apiFetch(`/meetings/${currentMeetingCode}/leave/`, { method: 'POST' });
  } catch (e) {}

  window.location.href = 'dashboard.html';
}

async function endMeetingForAll() {
  if (!isHost) return;
  try {
    if (websocketClient && websocketClient.readyState === WebSocket.OPEN) {
      websocketClient.send(JSON.stringify({ type: 'meeting_ended' }));
    }
    await apiFetch(`/meetings/${currentMeetingCode}/end/`, { method: 'POST' });
    showToast('Meeting ended for all attendees.', 'info');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
  } catch (err) {
    showToast(`Error ending meeting: ${err.message}`, 'error');
  }
}

// --------------------------------------------------------------------------
// 5. SLIDE-OUT DRAWER PANELS (CHAT, PARTICIPANTS, FILES, WHITEBOARD)
// --------------------------------------------------------------------------

function setupDrawerTab(btnId, tabKey, titleText, renderFn) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const drawer = document.getElementById('drawer-panel');
    const drawerTitle = document.getElementById('drawer-title');
    const drawerBody = document.getElementById('drawer-content');

    if (!drawer) return;

    if (drawer.classList.contains('hidden') || currentActiveDrawerTab !== tabKey) {
      drawerTitle.textContent = titleText;
      currentActiveDrawerTab = tabKey;
      renderFn(drawerBody);
      drawer.classList.remove('hidden');

      if (tabKey === 'chat') {
        unreadChatCount = 0;
        updateUnreadBadge();
      }
    } else {
      closeDrawer();
    }
  });
}

function closeDrawer() {
  const drawer = document.getElementById('drawer-panel');
  if (drawer) drawer.classList.add('hidden');
  currentActiveDrawerTab = null;
}

function updateUnreadBadge() {
  const badge = document.getElementById('chat-unread-badge');
  if (!badge) return;
  if (unreadChatCount > 0) {
    badge.textContent = unreadChatCount;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

// 1. CHAT PANEL
async function renderChatPanel(container) {
  container.innerHTML = `
    <div class="chat-container">
      <div id="chat-feed" class="chat-messages">
        <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">Loading message history...</p>
      </div>
      <div style="padding: 0 16px 8px; display: flex; gap: 8px;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="sendQuickEmoji('👍')">👍</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="sendQuickEmoji('👏')">👏</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="sendQuickEmoji('🎉')">🎉</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="sendQuickEmoji('❤️')">❤️</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="sendQuickEmoji('✋')">✋</button>
      </div>
      <form onsubmit="handleSendChatMessage(event)" class="chat-input-box">
        <input type="text" id="chat-input-text" class="form-input" placeholder="Send a message to everyone..." required autofocus />
        <button type="submit" class="btn btn-primary btn-sm">Send</button>
      </form>
    </div>
  `;

  try {
    const messages = await apiFetch(`/meetings/${currentMeetingCode}/messages/`);
    const feed = document.getElementById('chat-feed');
    if (!feed) return;

    if (!messages || messages.length === 0) {
      feed.innerHTML = `
        <div class="chat-msg-group">
          <div class="chat-avatar">OM</div>
          <div class="chat-msg-body">
            <div class="chat-msg-meta">
              <span class="chat-sender">OmniRoom System</span>
              <span class="chat-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div class="chat-text">Welcome to ${escapeHtml(currentMeetingData?.title || 'this meeting')}! Messages sent here are synced in real time.</div>
          </div>
        </div>
      `;
    } else {
      feed.innerHTML = '';
      messages.forEach(m => appendChatMessage(m.sender.username, m.message, m.created_at));
    }
  } catch (err) {
    const feed = document.getElementById('chat-feed');
    if (feed) feed.innerHTML = `<p style="color: var(--danger); font-size: 0.85rem;">Failed to load chat history.</p>`;
  }
}

function handleSendChatMessage(event) {
  event.preventDefault();
  const input = document.getElementById('chat-input-text');
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();

  if (websocketClient && websocketClient.readyState === WebSocket.OPEN) {
    websocketClient.send(JSON.stringify({
      type: 'chat_message',
      message: text
    }));
    input.value = '';
  } else {
    showToast('WebSocket is not connected.', 'error');
  }
}

function sendQuickEmoji(emoji) {
  if (websocketClient && websocketClient.readyState === WebSocket.OPEN) {
    websocketClient.send(JSON.stringify({
      type: 'chat_message',
      message: emoji
    }));
  }
}

function appendChatMessage(sender, text, timestamp) {
  const feed = document.getElementById('chat-feed');
  if (!feed) return;

  const isMe = (currentUser && sender === currentUser.username);
  const msgHtml = `
    <div class="chat-msg-group" style="${isMe ? 'opacity: 0.95;' : ''}">
      <div class="chat-avatar">${sender.charAt(0).toUpperCase()}</div>
      <div class="chat-msg-body">
        <div class="chat-msg-meta">
          <span class="chat-sender" style="${isMe ? 'color: #818cf8;' : ''}">${escapeHtml(sender)} ${isMe ? '(You)' : ''}</span>
          <span class="chat-time">${new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div class="chat-text">${escapeHtml(text)}</div>
      </div>
    </div>
  `;
  feed.insertAdjacentHTML('beforeend', msgHtml);
  feed.scrollTop = feed.scrollHeight;
}

// 2. PARTICIPANTS PANEL
function renderParticipantsPanel(container) {
  const participantsList = Array.from(roomParticipants.entries()).map(([channel, info]) => `
    <div class="participant-item">
      <div class="participant-info">
        <div class="chat-avatar" style="width: 32px; height: 32px; font-size: 0.85rem;">${info.username.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight: 600; font-size: 0.88rem; color: white;">${escapeHtml(info.username)}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: flex; align-items: center; gap: 4px;">
          ${ICONS.micTileOn}
          <svg class="svg-icon" style="width: 14px; height: 14px; stroke: #38bdf8;" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        </span>
        ${isHost ? `<button class="btn btn-ghost btn-sm" onclick="removeParticipantByHost('${channel}')" title="Remove">✕</button>` : ''}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="participant-list">
      <div class="participant-item" style="border-color: rgba(99, 102, 241, 0.3);">
        <div class="participant-info">
          <div class="chat-avatar" style="width: 32px; height: 32px; font-size: 0.85rem; background: var(--primary);">${currentUser.username.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight: 600; font-size: 0.88rem; color: white;">
              ${currentUser.username} (You)
              ${isHost ? '<span class="host-badge">HOST</span>' : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          ${isMicActive ? ICONS.micTileOn : ICONS.micTileOff}
          ${isCameraActive ? `<svg class="svg-icon" style="width: 14px; height: 14px; stroke: #38bdf8;" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>` : `<svg class="svg-icon" style="width: 14px; height: 14px; stroke: #f43f5e;" viewBox="0 0 24 24"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m4 0h6a2 2 0 0 1 2 2v4"/><polygon points="23 7 16 12 23 17 23 7"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`}
        </div>
      </div>
      ${participantsList}
    </div>
  `;
}

function removeParticipantByHost(peerChannel) {
  if (!isHost) return;
  showToast('Removing participant from room...', 'info');
  removePeerConnection(peerChannel);
  roomParticipants.delete(peerChannel);
  updateParticipantBadgeCount();
}

// 3. FILES PANEL
async function renderFilesPanel(container) {
  container.innerHTML = `
    <div style="padding: 20px; display: flex; flex-direction: column; height: 100%;">
      <div style="margin-bottom: 16px;">
        <label class="btn btn-primary btn-sm" style="width: 100%; cursor: pointer;">
          📤 Upload Shared File
          <input type="file" id="file-upload-input" style="display: none;" onchange="handleFileUpload(event)" />
        </label>
      </div>
      <div id="shared-files-list" style="flex: 1; overflow-y: auto;">
        <p style="color: var(--text-muted); font-size: 0.88rem; text-align: center; margin-top: 20px;">Loading shared files...</p>
      </div>
    </div>
  `;

  try {
    const files = await apiFetch(`/files/meeting/${currentMeetingCode}/`);
    const listEl = document.getElementById('shared-files-list');
    if (!listEl) return;

    if (!files || files.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-state-icon" style="opacity: 0.5;">
            ${ICONS.file}
          </div>
          <p style="font-size: 0.88rem;">No files shared yet in this meeting.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = files.map(f => `
      <div class="participant-item" style="margin-bottom: 8px;">
        <div class="participant-info">
          <div style="opacity: 0.8; display: flex; align-items: center; color: var(--primary);">${ICONS.file}</div>
          <div>
            <div style="font-weight: 600; font-size: 0.85rem; color: white;">${escapeHtml(f.original_name)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${(f.file_size / 1024).toFixed(1)} KB • by ${f.uploaded_by.username}</div>
          </div>
        </div>
        <a href="${f.file}" target="_blank" download class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.78rem;">Download</a>
      </div>
    `).join('');
  } catch (err) {
    const listEl = document.getElementById('shared-files-list');
    if (listEl) listEl.innerHTML = `<p style="color: var(--danger); font-size: 0.85rem;">Failed to load files.</p>`;
  }
}

async function handleFileUpload(event) {
  const fileInput = event.target;
  if (!fileInput.files || fileInput.files.length === 0) return;

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);

  showToast(`Uploading ${file.name}...`, 'info');

  try {
    await apiFetch(`/files/meeting/${currentMeetingCode}/`, {
      method: 'POST',
      body: formData
    });

    showToast('File shared successfully with room!', 'success');
    renderFilesPanel(document.getElementById('drawer-content'));
  } catch (err) {
    showToast(`Upload failed: ${err.message}`, 'error');
  }
}

// 4. COLLABORATIVE WHITEBOARD CANVAS ENGINE
function renderWhiteboardPanel(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%;">
      <div class="whiteboard-toolbar">
        <button class="wb-tool-btn active" onclick="setWbTool('pen', this)" title="Pen">${ICONS.pen}</button>
        <button class="wb-tool-btn" onclick="setWbTool('highlighter', this)" title="Highlighter">${ICONS.highlighter}</button>
        <button class="wb-tool-btn" onclick="setWbTool('eraser', this)" title="Eraser">${ICONS.eraser}</button>
        <button class="wb-tool-btn" onclick="setWbTool('line', this)" title="Line">${ICONS.line}</button>
        <button class="wb-tool-btn" onclick="setWbTool('arrow', this)" title="Arrow">${ICONS.arrow}</button>
        <button class="wb-tool-btn" onclick="setWbTool('rect', this)" title="Rectangle">${ICONS.rect}</button>
        <button class="wb-tool-btn" onclick="setWbTool('circle', this)" title="Circle">${ICONS.circle}</button>
        <button class="wb-tool-btn" onclick="setWbTool('text', this)" title="Text">${ICONS.text}</button>
        <input type="color" value="#6366f1" onchange="drawColor = this.value" style="width: 28px; height: 28px; border: none; cursor: pointer; border-radius: 4px; background: none;" title="Color Picker" />
        <input type="range" min="1" max="14" value="3" onchange="strokeWidth = this.value" style="width: 50px;" title="Stroke Size" />
        <button class="wb-tool-btn" onclick="undoWhiteboard()" title="Undo">${ICONS.undo}</button>
        <button class="wb-tool-btn" onclick="clearWhiteboard()" title="Clear Canvas">${ICONS.trash}</button>
        <button class="wb-tool-btn" onclick="exportWhiteboardPNG()" title="Export PNG">${ICONS.save}</button>
      </div>
      <div class="wb-canvas-container" id="wb-container">
        <canvas id="wb-canvas" class="wb-canvas"></canvas>
      </div>
    </div>
  `;

  setTimeout(() => initWhiteboardCanvas(), 100);
}

function initWhiteboardCanvas() {
  wbCanvas = document.getElementById('wb-canvas');
  if (!wbCanvas) return;
  const container = document.getElementById('wb-container');

  wbCanvas.width = container.clientWidth || 360;
  wbCanvas.height = container.clientHeight || 500;
  wbCtx = wbCanvas.getContext('2d');
  wbCtx.lineCap = 'round';
  wbCtx.lineJoin = 'round';

  // White background
  wbCtx.fillStyle = '#ffffff';
  wbCtx.fillRect(0, 0, wbCanvas.width, wbCanvas.height);

  // Mouse & Touch events
  wbCanvas.addEventListener('mousedown', startWbDrawing);
  wbCanvas.addEventListener('mousemove', handleWbDrawing);
  wbCanvas.addEventListener('mouseup', stopWbDrawing);
  wbCanvas.addEventListener('mouseleave', stopWbDrawing);

  wbCanvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    wbCanvas.dispatchEvent(mouseEvent);
  });
  wbCanvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    wbCanvas.dispatchEvent(mouseEvent);
  });
  wbCanvas.addEventListener('touchend', () => {
    const mouseEvent = new MouseEvent('mouseup', {});
    wbCanvas.dispatchEvent(mouseEvent);
  });
}

function setWbTool(tool, btn) {
  currentTool = tool;
  document.querySelectorAll('.wb-tool-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function startWbDrawing(e) {
  isDrawing = true;
  const rect = wbCanvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;

  if (currentTool === 'text') {
    const textPrompt = prompt('Enter text:');
    if (textPrompt) {
      wbCtx.font = `${strokeWidth * 6 + 12}px sans-serif`;
      wbCtx.fillStyle = drawColor;
      wbCtx.fillText(textPrompt, startX, startY);
      broadcastWhiteboardStroke({ tool: 'text', text: textPrompt, x: startX, y: startY, color: drawColor, size: strokeWidth });
    }
    isDrawing = false;
    return;
  }

  wbSnapshot = wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height);
  wbCtx.beginPath();
  wbCtx.moveTo(startX, startY);
}

function handleWbDrawing(e) {
  if (!isDrawing) return;
  const rect = wbCanvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  wbCtx.lineWidth = strokeWidth;

  if (currentTool === 'pen') {
    wbCtx.strokeStyle = drawColor;
    wbCtx.globalAlpha = 1.0;
    wbCtx.lineTo(currentX, currentY);
    wbCtx.stroke();
    broadcastWhiteboardStroke({ tool: 'pen', fromX: startX, fromY: startY, toX: currentX, toY: currentY, color: drawColor, width: strokeWidth });
    startX = currentX;
    startY = currentY;
  } else if (currentTool === 'highlighter') {
    wbCtx.strokeStyle = drawColor;
    wbCtx.globalAlpha = 0.3;
    wbCtx.lineWidth = strokeWidth * 3;
    wbCtx.lineTo(currentX, currentY);
    wbCtx.stroke();
    broadcastWhiteboardStroke({ tool: 'highlighter', fromX: startX, fromY: startY, toX: currentX, toY: currentY, color: drawColor, width: strokeWidth * 3 });
    startX = currentX;
    startY = currentY;
  } else if (currentTool === 'eraser') {
    wbCtx.strokeStyle = '#ffffff';
    wbCtx.globalAlpha = 1.0;
    wbCtx.lineWidth = strokeWidth * 4;
    wbCtx.lineTo(currentX, currentY);
    wbCtx.stroke();
    broadcastWhiteboardStroke({ tool: 'eraser', fromX: startX, fromY: startY, toX: currentX, toY: currentY, width: strokeWidth * 4 });
    startX = currentX;
    startY = currentY;
  } else if (['line', 'arrow', 'rect', 'circle'].includes(currentTool)) {
    if (wbSnapshot) wbCtx.putImageData(wbSnapshot, 0, 0);
    wbCtx.globalAlpha = 1.0;
    wbCtx.strokeStyle = drawColor;

    if (currentTool === 'line') {
      wbCtx.beginPath();
      wbCtx.moveTo(startX, startY);
      wbCtx.lineTo(currentX, currentY);
      wbCtx.stroke();
    } else if (currentTool === 'arrow') {
      drawArrow(wbCtx, startX, startY, currentX, currentY);
    } else if (currentTool === 'rect') {
      wbCtx.strokeRect(startX, startY, currentX - startX, currentY - startY);
    } else if (currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
      wbCtx.beginPath();
      wbCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
      wbCtx.stroke();
    }
  }
}

function stopWbDrawing(e) {
  if (!isDrawing) return;
  isDrawing = false;
  wbCtx.closePath();

  if (['line', 'arrow', 'rect', 'circle'].includes(currentTool)) {
    const rect = wbCanvas.getBoundingClientRect();
    const currentX = (e.clientX || startX) - rect.left;
    const currentY = (e.clientY || startY) - rect.top;
    broadcastWhiteboardStroke({ tool: currentTool, fromX: startX, fromY: startY, toX: currentX, toY: currentY, color: drawColor, width: strokeWidth });
  }

  // Save history state for undo
  if (wbCanvas) {
    wbHistory.push(wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height));
    if (wbHistory.length > 20) wbHistory.shift();
  }
}

function drawArrow(ctx, fromx, fromy, tox, toy) {
  const headlen = 12;
  const dx = tox - fromx;
  const dy = toy - fromy;
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function broadcastWhiteboardStroke(strokeData) {
  if (websocketClient && websocketClient.readyState === WebSocket.OPEN) {
    websocketClient.send(JSON.stringify({
      type: 'whiteboard_draw',
      ...strokeData
    }));
  }
}

function applyRemoteWhiteboardDraw(payload) {
  if (!wbCtx || !wbCanvas) return;
  wbCtx.save();
  wbCtx.lineWidth = payload.width || 3;
  wbCtx.strokeStyle = payload.color || '#6366f1';
  wbCtx.fillStyle = payload.color || '#6366f1';
  wbCtx.lineCap = 'round';
  wbCtx.lineJoin = 'round';

  if (payload.tool === 'pen' || payload.tool === 'highlighter') {
    wbCtx.globalAlpha = payload.tool === 'highlighter' ? 0.3 : 1.0;
    wbCtx.beginPath();
    wbCtx.moveTo(payload.fromX, payload.fromY);
    wbCtx.lineTo(payload.toX, payload.toY);
    wbCtx.stroke();
  } else if (payload.tool === 'eraser') {
    wbCtx.strokeStyle = '#ffffff';
    wbCtx.beginPath();
    wbCtx.moveTo(payload.fromX, payload.fromY);
    wbCtx.lineTo(payload.toX, payload.toY);
    wbCtx.stroke();
  } else if (payload.tool === 'line') {
    wbCtx.beginPath();
    wbCtx.moveTo(payload.fromX, payload.fromY);
    wbCtx.lineTo(payload.toX, payload.toY);
    wbCtx.stroke();
  } else if (payload.tool === 'arrow') {
    drawArrow(wbCtx, payload.fromX, payload.fromY, payload.toX, payload.toY);
  } else if (payload.tool === 'rect') {
    wbCtx.strokeRect(payload.fromX, payload.fromY, payload.toX - payload.fromX, payload.toY - payload.fromY);
  } else if (payload.tool === 'circle') {
    const radius = Math.sqrt(Math.pow(payload.toX - payload.fromX, 2) + Math.pow(payload.toY - payload.fromY, 2));
    wbCtx.beginPath();
    wbCtx.arc(payload.fromX, payload.fromY, radius, 0, 2 * Math.PI);
    wbCtx.stroke();
  } else if (payload.tool === 'text') {
    wbCtx.font = `${(payload.size || 3) * 6 + 12}px sans-serif`;
    wbCtx.fillText(payload.text, payload.x, payload.y);
  }
  wbCtx.restore();
}

function undoWhiteboard() {
  if (wbHistory.length > 0 && wbCtx) {
    wbHistory.pop();
    if (wbHistory.length > 0) {
      wbCtx.putImageData(wbHistory[wbHistory.length - 1], 0, 0);
    } else {
      wbCtx.fillStyle = '#ffffff';
      wbCtx.fillRect(0, 0, wbCanvas.width, wbCanvas.height);
    }
  }
}

function clearWhiteboard() {
  if (wbCtx && wbCanvas) {
    wbCtx.fillStyle = '#ffffff';
    wbCtx.fillRect(0, 0, wbCanvas.width, wbCanvas.height);
    wbHistory = [];

    if (websocketClient && websocketClient.readyState === WebSocket.OPEN) {
      websocketClient.send(JSON.stringify({ type: 'whiteboard_clear' }));
    }
    showToast('Whiteboard cleared', 'info');
  }
}

function exportWhiteboardPNG() {
  if (!wbCanvas) return;
  const image = wbCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `omniroom-whiteboard-${currentMeetingCode}.png`;
  link.href = image;
  link.click();
  showToast('Whiteboard exported as PNG!', 'success');
}

// --------------------------------------------------------------------------
// 6. TILE CONTROLS & PIN/FULLSCREEN HELPERS
// --------------------------------------------------------------------------

function togglePinTile(tileId) {
  const tile = document.getElementById(tileId);
  if (!tile) return;
  tile.classList.toggle('pinned-tile');
  showToast('Toggled video pin', 'info');
}

function toggleFullscreenTile(tileId) {
  const tile = document.getElementById(tileId);
  if (!tile) return;
  if (!document.fullscreenElement) {
    tile.requestFullscreen().catch(err => console.warn(err));
  } else {
    document.exitFullscreen().catch(err => console.warn(err));
  }
}

function copyInfoCode() {
  const input = document.getElementById('info-meeting-id');
  if (input) {
    navigator.clipboard.writeText(input.value);
    showToast('Meeting ID copied!', 'success');
  }
}

function copyInfoLink() {
  const input = document.getElementById('info-meeting-link');
  if (input) {
    navigator.clipboard.writeText(input.value);
    showToast('Meeting Link copied!', 'success');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
