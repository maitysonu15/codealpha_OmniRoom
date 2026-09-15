/**
 * OmniRoom API & Global UI Helper Manager
 */
const API_BASE = (typeof window !== 'undefined' && (localStorage.getItem('omniroom_api_url') || localStorage.getItem('onemeet_api_url')))
  ? (localStorage.getItem('omniroom_api_url') || localStorage.getItem('onemeet_api_url'))
  : (typeof window !== 'undefined' && ((window.OMNIROOM_CONFIG && window.OMNIROOM_CONFIG.API_URL) || (window.OPENMEET_CONFIG && window.OPENMEET_CONFIG.API_URL)))
    ? (window.OMNIROOM_CONFIG?.API_URL || window.OPENMEET_CONFIG?.API_URL)
    : (typeof window !== 'undefined' && (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '8080')))
      ? 'http://localhost:8080/api'
      : '/api';

// Initialize Theme from localStorage or Default
function initTheme() {
  const savedTheme = localStorage.getItem('omniroom_theme') || localStorage.getItem('onemeet_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('omniroom_theme', newTheme);
  localStorage.setItem('onemeet_theme', newTheme);
  showToast(`Switched to ${newTheme} theme`, 'info');
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

async function fetchCSRFToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' });
    const data = await res.json();
    return data.csrfToken;
  } catch (err) {
    return null;
  }
}

async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    let csrfToken = getCookie('csrftoken');
    if (!csrfToken) {
      csrfToken = await fetchCSRFToken();
    }
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, config);
  
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { text: await response.text() };
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    if (data) {
      if (typeof data.error === 'string') errorMsg = data.error;
      else if (typeof data.detail === 'string') errorMsg = data.detail;
      else if (typeof data.message === 'string') errorMsg = data.message;
      else if (typeof data === 'object') {
        const fieldErrors = Object.entries(data).map(([k, v]) => {
          const val = Array.isArray(v) ? v.join(' ') : String(v);
          return `${k}: ${val}`;
        });
        if (fieldErrors.length > 0) errorMsg = fieldErrors.join(' | ');
        else errorMsg = JSON.stringify(data);
      }
    }
    throw new Error(errorMsg);
  }

  return data;
}

// Toast Notification Engine
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Dialog Helpers
function openModal(modalId) {
  const backdrop = document.getElementById(modalId);
  if (backdrop) {
    backdrop.classList.add('active');
  }
}

function closeModal(modalId) {
  const backdrop = document.getElementById(modalId);
  if (backdrop) {
    backdrop.classList.remove('active');
  }
}

// Explicit global attachments
if (typeof window !== 'undefined') {
  window.API_BASE = API_BASE;
  window.apiFetch = apiFetch;
  window.getCookie = getCookie;
  window.fetchCSRFToken = fetchCSRFToken;
  window.showToast = showToast;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.toggleTheme = toggleTheme;
  window.initTheme = initTheme;
}

// Run Theme Setup on Script Load
initTheme();
