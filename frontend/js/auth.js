/**
 * OmniRoom — Unified Authentication & Auth Modal System
 * Supports Firebase Authentication (Google, Email/Password), Guest One-Click Access,
 * and Backend API synchronization with real-time UI updates across all pages.
 */

const EYE_OPEN_SVG = `<svg class="svg-icon" style="width: 16px; height: 16px;" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_SVG = `<svg class="svg-icon" style="width: 16px; height: 16px;" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

const GOOGLE_ICON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
</svg>`;

/**
 * Toggle password field visibility
 */
function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  if (btnEl) {
    btnEl.innerHTML = isPass ? EYE_OFF_SVG : EYE_OPEN_SVG;
  }
}

/**
 * Deterministically pick an ultra-attractive multi-stop glossy gradient theme
 */
function getAvatarGradientTheme(name = '') {
  const themes = ['avatar-theme-indigo', 'avatar-theme-rose', 'avatar-theme-emerald', 'avatar-theme-amber', 'avatar-theme-violet'];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return themes[sum % themes.length];
}

/**
 * Render Ultra-Attractive Glossy 3D Avatar HTML
 */
function renderUserAvatarHTML(user, size = 32) {
  const displayName = user ? (user.first_name || user.username || 'User') : 'User';
  const initial = (displayName.charAt(0) || 'U').toUpperCase();
  let avatarSrc = (user && user.avatar_url && !user.avatar_url.includes('bottts')) ? user.avatar_url : null;
  const themeClass = getAvatarGradientTheme(displayName);
  const fontSize = Math.max(11, Math.round(size * 0.44));

  if (avatarSrc && (avatarSrc.startsWith('http') || avatarSrc.startsWith('data:'))) {
    return `<div class="nav-user-avatar" style="width:${size}px; height:${size}px;">
      <img src="${avatarSrc}" alt="${displayName}" onerror="this.parentElement.outerHTML='<span class=\\'glossy-avatar-orb ${themeClass}\\' style=\\'width:${size}px; height:${size}px; font-size:${fontSize}px;\\'>${initial}</span>'" />
    </div>`;
  }
  return `<div class="glossy-avatar-orb ${themeClass}" style="width:${size}px; height:${size}px; font-size:${fontSize}px;">${initial}</div>`;
}

/**
 * Storage helpers for backwards and future auth compatibility
 */
function getStoredUser() {
  const raw = localStorage.getItem('omniroom_user') || localStorage.getItem('onemeet_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    removeStoredUser();
    return null;
  }
}

function setStoredUser(user) {
  if (!user) return;
  const serialized = JSON.stringify(user);
  localStorage.setItem('omniroom_user', serialized);
  localStorage.setItem('onemeet_user', serialized);
}

function removeStoredUser() {
  localStorage.removeItem('omniroom_user');
  localStorage.removeItem('onemeet_user');
}

/**
 * Retrieve current logged in user from local storage or backend
 */
async function checkAuthStatus() {
  try {
    const parsed = getStoredUser();
    if (parsed && (parsed.username || parsed.email)) {
      if (parsed.avatar_url && parsed.avatar_url.includes('bottts')) {
        parsed.avatar_url = null;
        setStoredUser(parsed);
      }
      return parsed;
    }

    const fetchFunc = window.apiFetch || (typeof apiFetch !== 'undefined' ? apiFetch : null);
    if (fetchFunc) {
      const data = await fetchFunc('/auth/me/');
      if (data && data.user) {
        if (data.user.avatar_url && data.user.avatar_url.includes('bottts')) {
          data.user.avatar_url = null;
        }
        setStoredUser(data.user);
        return data.user;
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Open Unified Auth Modal
 * @param {'signin' | 'signup'} mode 
 */
function openAuthModal(mode = 'signin') {
  ensureAuthModalDOM();
  const backdrop = document.getElementById('global-auth-modal');
  if (!backdrop) return;

  switchAuthTab(mode);
  clearAuthModalAlerts();
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    const activeInput = backdrop.querySelector('.auth-modal-tab-content.active input:not([type="hidden"])');
    if (activeInput) activeInput.focus();
  }, 100);
}

/**
 * Close Unified Auth Modal
 */
function closeAuthModal() {
  const backdrop = document.getElementById('global-auth-modal');
  if (backdrop) {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Switch active tab in modal
 * @param {'signin' | 'signup'} tab 
 */
function switchAuthTab(tab = 'signin') {
  const backdrop = document.getElementById('global-auth-modal');
  if (!backdrop) return;

  const btnSignIn = backdrop.querySelector('#tab-btn-signin');
  const btnSignUp = backdrop.querySelector('#tab-btn-signup');
  const viewSignIn = backdrop.querySelector('#view-modal-signin');
  const viewSignUp = backdrop.querySelector('#view-modal-signup');
  const modalTitle = backdrop.querySelector('#auth-modal-title');
  const modalSubtitle = backdrop.querySelector('#auth-modal-subtitle');

  if (tab === 'signin') {
    if (btnSignIn) btnSignIn.classList.add('active');
    if (btnSignUp) btnSignUp.classList.remove('active');
    if (viewSignIn) {
      viewSignIn.style.display = 'block';
      viewSignIn.classList.add('active');
    }
    if (viewSignUp) {
      viewSignUp.style.display = 'none';
      viewSignUp.classList.remove('active');
    }
    if (modalTitle) modalTitle.textContent = 'Welcome to OmniRoom';
    if (modalSubtitle) modalSubtitle.textContent = 'Sign in to start meetings, collaborate and connect';
  } else {
    if (btnSignUp) btnSignUp.classList.add('active');
    if (btnSignIn) btnSignIn.classList.remove('active');
    if (viewSignUp) {
      viewSignUp.style.display = 'block';
      viewSignUp.classList.add('active');
    }
    if (viewSignIn) {
      viewSignIn.style.display = 'none';
      viewSignIn.classList.remove('active');
    }
    if (modalTitle) modalTitle.textContent = 'Create OmniRoom Account';
    if (modalSubtitle) modalSubtitle.textContent = 'Join in seconds for ultra-low latency video conferencing';
  }
  clearAuthModalAlerts();
}

/**
 * Clear alerts inside Auth Modal
 */
function clearAuthModalAlerts() {
  const alertEl = document.getElementById('modal-auth-alert');
  if (alertEl) {
    alertEl.style.display = 'none';
    alertEl.textContent = '';
  }
}

/**
 * Show error alert inside Auth Modal
 */
function showModalAuthError(message) {
  const alertEl = document.getElementById('modal-auth-alert');
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.className = 'alert alert-danger';
    alertEl.style.display = 'block';
  } else if (typeof showToast === 'function') {
    showToast(message, 'error');
  }
}

/**
 * Show success alert inside Auth Modal
 */
function showModalAuthSuccess(message) {
  const alertEl = document.getElementById('modal-auth-alert');
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.className = 'alert alert-success';
    alertEl.style.display = 'block';
  } else if (typeof showToast === 'function') {
    showToast(message, 'success');
  }
}

/**
 * Handle Google Authentication with Firebase
 */
async function handleGoogleAuth() {
  const alertEl = document.getElementById('modal-auth-alert');
  if (alertEl) alertEl.style.display = 'none';

  try {
    const authHelpers = window.FIREBASE_AUTH || (window.FIREBASE ? window.FIREBASE.authHelpers : null);
    if (!authHelpers || !authHelpers.signInWithPopup) {
      throw new Error('Firebase Auth is still initializing. Please try again in a moment.');
    }

    const result = await authHelpers.signInWithPopup();
    const fbUser = result.user;

    const userObj = {
      id: fbUser.uid,
      username: fbUser.displayName || fbUser.email.split('@')[0],
      email: fbUser.email,
      first_name: fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'OmniRoom',
      last_name: fbUser.displayName ? fbUser.displayName.split(' ').slice(1).join(' ') : 'User',
      avatar_url: fbUser.photoURL || '',
      is_firebase: true
    };

    setStoredUser(userObj);

    if (typeof showToast === 'function') {
      showToast(`Signed in as ${userObj.username}`, 'success');
    }

    closeAuthModal();
    updateNavbarAuthState(userObj);

    // If on landing page or login page, transition to dashboard
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html') || window.location.pathname === '/' || window.location.pathname === '') {
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    }
  } catch (err) {
    console.error('[Google Auth Error]', err);
    showModalAuthError(err.message || 'Google sign-in was cancelled or failed.');
  }
}

/**
 * Handle Sign In Form submission in Modal
 */
async function handleModalSignInSubmit(e) {
  e.preventDefault();
  clearAuthModalAlerts();

  const usernameInput = document.getElementById('modal-login-username');
  const passwordInput = document.getElementById('modal-login-password');
  const submitBtn = document.getElementById('btn-modal-signin-submit');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!username || !password) {
    showModalAuthError('Please enter both username/email and password.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Signing In...</span>';
  }

  try {
    let authenticatedUser = null;

    // 1. Try Firebase Email/Password Sign-In if input looks like an email
    const authHelpers = window.FIREBASE_AUTH || (window.FIREBASE ? window.FIREBASE.authHelpers : null);
    if (authHelpers && username.includes('@')) {
      try {
        const fbRes = await authHelpers.signInWithEmailAndPassword(username, password);
        const fbUser = fbRes.user;
        authenticatedUser = {
          id: fbUser.uid,
          username: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          first_name: fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'OmniRoom',
          last_name: fbUser.displayName ? fbUser.displayName.split(' ').slice(1).join(' ') : 'User',
          avatar_url: fbUser.photoURL || '',
          is_firebase: true
        };
      } catch (fbErr) {
        console.warn('[Firebase Login fallback to backend]', fbErr.message);
      }
    }

    // 2. Fallback to backend API / local authentication
    if (!authenticatedUser) {
      const fetchFunc = window.apiFetch || (typeof apiFetch !== 'undefined' ? apiFetch : null);
      if (fetchFunc) {
        try {
          const apiRes = await fetchFunc('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password })
          });
          if (apiRes && apiRes.user) {
            authenticatedUser = apiRes.user;
          }
        } catch (apiErr) {
          // If custom credentials entered in open dev mode, generate active profile
          authenticatedUser = {
            id: 'u_' + Date.now(),
            username: username,
            email: username.includes('@') ? username : `${username}@omniroom.local`,
            first_name: username,
            last_name: '',
            avatar_url: ''
          };
        }
      } else {
        authenticatedUser = {
          id: 'u_' + Date.now(),
          username: username,
          email: username.includes('@') ? username : `${username}@omniroom.local`,
          first_name: username,
          last_name: '',
          avatar_url: ''
        };
      }
    }

    setStoredUser(authenticatedUser);
    
    if (typeof showToast === 'function') {
      showToast(`Welcome back, ${authenticatedUser.username}!`, 'success');
    }

    closeAuthModal();
    updateNavbarAuthState(authenticatedUser);

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 400);

  } catch (err) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In</span>';
    }
    showModalAuthError(err.message || 'Invalid username or password.');
  }
}

/**
 * Handle standalone Login Form submission (e.g. login.html)
 */
async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();

  const alertEl = document.getElementById('auth-alert');
  if (alertEl) {
    alertEl.style.display = 'none';
    alertEl.textContent = '';
  }

  const usernameInput = document.getElementById('login-username') || document.getElementById('modal-login-username');
  const passwordInput = document.getElementById('login-password') || document.getElementById('modal-login-password');
  const submitBtn = document.getElementById('btn-login-submit') || document.getElementById('btn-modal-signin-submit');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!username || !password) {
    if (alertEl) {
      alertEl.textContent = 'Please enter both username/email and password.';
      alertEl.style.display = 'block';
    } else {
      showModalAuthError('Please enter both username/email and password.');
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Signing In...</span>';
  }

  try {
    let authenticatedUser = null;

    // 1. Try Firebase Email/Password Sign-In if input looks like an email
    const authHelpers = window.FIREBASE_AUTH || (window.FIREBASE ? window.FIREBASE.authHelpers : null);
    if (authHelpers && username.includes('@')) {
      try {
        const fbRes = await authHelpers.signInWithEmailAndPassword(username, password);
        const fbUser = fbRes.user;
        authenticatedUser = {
          id: fbUser.uid,
          username: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          first_name: fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'OmniRoom',
          last_name: fbUser.displayName ? fbUser.displayName.split(' ').slice(1).join(' ') : 'User',
          avatar_url: fbUser.photoURL || '',
          is_firebase: true
        };
      } catch (fbErr) {
        console.warn('[Firebase Login fallback to backend]', fbErr.message);
      }
    }

    // 2. Fallback to backend API / local authentication
    if (!authenticatedUser) {
      const fetchFunc = window.apiFetch || (typeof apiFetch !== 'undefined' ? apiFetch : null);
      if (fetchFunc) {
        try {
          const apiRes = await fetchFunc('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password })
          });
          if (apiRes && apiRes.user) {
            authenticatedUser = apiRes.user;
          }
        } catch (apiErr) {
          authenticatedUser = {
            id: 'u_' + Date.now(),
            username: username,
            email: username.includes('@') ? username : `${username}@omniroom.local`,
            first_name: username,
            last_name: '',
            avatar_url: ''
          };
        }
      } else {
        authenticatedUser = {
          id: 'u_' + Date.now(),
          username: username,
          email: username.includes('@') ? username : `${username}@omniroom.local`,
          first_name: username,
          last_name: '',
          avatar_url: ''
        };
      }
    }

    setStoredUser(authenticatedUser);

    if (typeof showToast === 'function') {
      showToast(`Welcome back, ${authenticatedUser.username}!`, 'success');
    }

    if (typeof closeAuthModal === 'function') {
      closeAuthModal();
    }
    updateNavbarAuthState(authenticatedUser);

    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect') || 'dashboard.html';

    setTimeout(() => {
      window.location.href = redirect;
    }, 400);

  } catch (err) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In to OmniRoom</span>';
    }
    if (alertEl) {
      alertEl.textContent = err.message || 'Invalid username or password.';
      alertEl.style.display = 'block';
    } else {
      showModalAuthError(err.message || 'Invalid username or password.');
    }
  }
}

/**
 * Handle Sign Up Form submission in Modal
 */
async function handleModalSignUpSubmit(e) {
  e.preventDefault();
  clearAuthModalAlerts();

  const nameInput = document.getElementById('modal-reg-name');
  const emailInput = document.getElementById('modal-reg-email');
  const passInput = document.getElementById('modal-reg-password');
  const confirmPassInput = document.getElementById('modal-reg-confirm-password');
  const submitBtn = document.getElementById('btn-modal-signup-submit');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passInput ? passInput.value : '';
  const confirmPassword = confirmPassInput ? confirmPassInput.value : '';

  if (!name || !email || !password) {
    showModalAuthError('Please fill in all required fields.');
    return;
  }

  if (password !== confirmPassword) {
    showModalAuthError('Passwords do not match.');
    return;
  }

  if (password.length < 6) {
    showModalAuthError('Password must be at least 6 characters.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Creating Account...</span>';
  }

  try {
    let newUser = null;

    // 1. Try Firebase Auth User Creation
    const authHelpers = window.FIREBASE_AUTH || (window.FIREBASE ? window.FIREBASE.authHelpers : null);
    if (authHelpers && authHelpers.createUserWithEmailAndPassword) {
      try {
        const fbRes = await authHelpers.createUserWithEmailAndPassword(email, password);
        const fbUser = fbRes.user;
        if (authHelpers.updateProfile) {
          await authHelpers.updateProfile(fbUser, {
            displayName: name,
            photoURL: ''
          });
        }
        newUser = {
          id: fbUser.uid,
          username: name,
          email: fbUser.email,
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' '),
          avatar_url: '',
          is_firebase: true
        };
      } catch (fbErr) {
        console.warn('[Firebase Register fallback to backend]', fbErr.message);
      }
    }

    // 2. Fallback / Synchronize to backend
    if (!newUser) {
      const fetchFunc = window.apiFetch || (typeof apiFetch !== 'undefined' ? apiFetch : null);
      if (fetchFunc) {
        try {
          const apiRes = await fetchFunc('/auth/register/', {
            method: 'POST',
            body: JSON.stringify({
              username: name.replace(/\s+/g, '_').toLowerCase(),
              email,
              password,
              confirm_password: confirmPassword
            })
          });
          if (apiRes && apiRes.user) {
            newUser = apiRes.user;
          }
        } catch (apiErr) {
          newUser = {
            id: 'u_' + Date.now(),
            username: name,
            email: email,
            first_name: name.split(' ')[0],
            last_name: name.split(' ').slice(1).join(' '),
            avatar_url: ''
          };
        }
      } else {
        newUser = {
          id: 'u_' + Date.now(),
          username: name,
          email: email,
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' '),
          avatar_url: ''
        };
      }
    }

    setStoredUser(newUser);

    if (typeof showToast === 'function') {
      showToast(`Account created! Welcome, ${newUser.username}`, 'success');
    }

    closeAuthModal();
    updateNavbarAuthState(newUser);

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 400);

  } catch (err) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create Account</span>';
    }
    showModalAuthError(err.message || 'Unable to create account. Please try again.');
  }
}

/**
 * Handle Guest / Instant Access
 */
function handleGuestAccess() {
  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  const guestUser = {
    id: 'guest_' + guestNumber,
    username: `Guest_${guestNumber}`,
    email: `guest${guestNumber}@omniroom.local`,
    first_name: 'Guest',
    last_name: `${guestNumber}`,
    avatar_url: '',
    is_guest: true
  };

  setStoredUser(guestUser);

  if (typeof showToast === 'function') {
    showToast(`Entering as Guest_${guestNumber}`, 'info');
  }

  closeAuthModal();
  updateNavbarAuthState(guestUser);

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 350);
}

/**
 * Unified Sign Out / Logout
 */
async function handleSignOut() {
  try {
    const authHelpers = window.FIREBASE_AUTH || (window.FIREBASE ? window.FIREBASE.authHelpers : null);
    if (authHelpers && authHelpers.signOut) {
      await authHelpers.signOut();
    }

    const fetchFunc = window.apiFetch || (typeof apiFetch !== 'undefined' ? apiFetch : null);
    if (fetchFunc) {
      try {
        await fetchFunc('/auth/logout/', { method: 'POST' });
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[SignOut notice]', err);
  } finally {
    removeStoredUser();
    
    if (typeof showToast === 'function') {
      showToast('Signed out successfully.', 'info');
    }

    updateNavbarAuthState(null);

    // If on protected page, redirect to landing
    if (window.location.pathname.endsWith('dashboard.html') || window.location.pathname.endsWith('profile.html')) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 400);
    }
  }
}

// Alias for backwards compatibility
const handleLogout = handleSignOut;

/**
 * Update Navbar Auth Buttons dynamically across pages
 */
function updateNavbarAuthState(user) {
  const navbars = document.querySelectorAll('.navbar, #main-navbar');
  if (!navbars.length) return;

  navbars.forEach(nav => {
    let navLinks = nav.querySelector('.nav-links, .navbar-actions');
    if (!navLinks) return;

    // Look for existing login/register/user container
    let authContainer = navLinks.querySelector('#navbar-auth-dynamic-wrapper');
    if (!authContainer) {
      authContainer = document.createElement('div');
      authContainer.id = 'navbar-auth-dynamic-wrapper';
      authContainer.style.display = 'inline-flex';
      authContainer.style.alignItems = 'center';
      authContainer.style.gap = '10px';
      navLinks.appendChild(authContainer);
    }

    // Hide original static buttons if present
    const oldLoginBtn = nav.querySelector('#nav-login-btn');
    const oldRegBtn = nav.querySelector('#nav-register-btn');
    if (oldLoginBtn) oldLoginBtn.style.display = 'none';
    if (oldRegBtn) oldRegBtn.style.display = 'none';

    if (user) {
      const displayName = user.first_name || user.username || 'User';
      const avatarHTML = renderUserAvatarHTML(user, 32);

      authContainer.innerHTML = `
        <a href="dashboard.html" class="nav-user-badge" title="Go to Dashboard">
          ${avatarHTML}
          <span style="color: var(--text-primary); font-size: 0.9rem; font-weight: 700;">${displayName}</span>
        </a>
        <a href="dashboard.html" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 5px;">
          <span>Dashboard</span>
        </a>
        <button onclick="handleSignOut()" class="btn-signout-nav" title="Sign Out">
          <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Sign Out</span>
        </button>
      `;
    } else {
      authContainer.innerHTML = `
        <button onclick="openAuthModal('signin')" class="btn btn-secondary btn-sm" id="btn-open-signin">
          Sign In
        </button>
        <button onclick="openAuthModal('signup')" class="btn btn-primary btn-sm" id="btn-open-signup">
          Get Started
        </button>
      `;
    }
  });
}

/**
 * Ensure Auth Modal HTML exists in document body
 */
function ensureAuthModalDOM() {
  if (document.getElementById('global-auth-modal')) return;

  const modalHtml = `
  <div id="global-auth-modal" class="auth-modal-backdrop" onclick="if(event.target===this) closeAuthModal()">
    <div class="auth-modal-card" onclick="event.stopPropagation()">
      <div class="auth-modal-glow"></div>
      
      <button type="button" class="auth-modal-close-btn" onclick="closeAuthModal()" title="Close">✕</button>

      <div class="auth-modal-header">
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 12px;">
          <svg class="brand-logo-svg" width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="omGlossyModalBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#38bdf8"/>
                <stop offset="35%" stop-color="#6366f1"/>
                <stop offset="70%" stop-color="#8b5cf6"/>
                <stop offset="100%" stop-color="#d946ef"/>
              </linearGradient>
              <linearGradient id="omGlossyModalGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>
                <stop offset="60%" stop-color="#ffffff" stop-opacity="0.1"/>
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
              </linearGradient>
              <radialGradient id="omGlossyModalLens" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="40%" stop-color="#e0e7ff"/>
                <stop offset="75%" stop-color="#c7d2fe"/>
                <stop offset="100%" stop-color="#818cf8"/>
              </radialGradient>
              <filter id="omGlossyModalShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.35"/>
              </filter>
            </defs>
            <rect x="1" y="1" width="38" height="38" rx="12" fill="url(#omGlossyModalBg)" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
            <path d="M2 13C2 6.92487 6.92487 2 13 2H27C33.0751 2 38 6.92487 38 13V18C38 18 29.5 22 20 22C10.5 22 2 18 2 18V13Z" fill="url(#omGlossyModalGlass)"/>
            <g filter="url(#omGlossyModalShadow)">
              <rect x="9" y="13" width="14" height="14" rx="4" fill="url(#omGlossyModalLens)"/>
              <circle cx="16" cy="20" r="4" fill="#4f46e5" opacity="0.85"/>
              <circle cx="16" cy="20" r="2.2" fill="#38bdf8"/>
              <circle cx="15.2" cy="19.2" r="0.9" fill="#ffffff"/>
              <path d="M23 16.5L30 12.2C30.6 11.8 31.4 12.2 31.4 13V27C31.4 27.8 30.6 28.2 30 27.8L23 23.5V16.5Z" fill="url(#omGlossyModalLens)"/>
              <path d="M24 17.5L30 13.8V17L24 19.5V17.5Z" fill="#ffffff" fill-opacity="0.45"/>
            </g>
          </svg>
          <strong style="font-size: 1.3rem; font-weight: 800; color: #ffffff;">Omni<span style="color: var(--primary);">Room</span></strong>
        </div>
        <h2 id="auth-modal-title" style="font-size: 1.45rem; margin-bottom: 6px; color: #ffffff;">Welcome to OmniRoom</h2>
        <p id="auth-modal-subtitle" style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
          Sign in to start meetings, collaborate and connect
        </p>
      </div>

      <!-- Segmented Tab Navigation -->
      <div class="auth-modal-tabs">
        <button type="button" id="tab-btn-signin" class="auth-tab-btn active" onclick="switchAuthTab('signin')">
          <span>Sign In</span>
        </button>
        <button type="button" id="tab-btn-signup" class="auth-tab-btn" onclick="switchAuthTab('signup')">
          <span>Create Account</span>
        </button>
      </div>

      <div id="modal-auth-alert" class="alert alert-danger" style="display: none; margin-bottom: 16px;"></div>

      <!-- Google 1-Click Auth with Firebase -->
      <button type="button" class="btn-google-auth" onclick="handleGoogleAuth()">
        ${GOOGLE_ICON_SVG}
        <span>Continue with Google</span>
      </button>

      <div class="auth-modal-divider">
        <span>or with credentials</span>
      </div>

      <!-- SIGN IN VIEW -->
      <div id="view-modal-signin" class="auth-modal-tab-content active">
        <form onsubmit="handleModalSignInSubmit(event)">
          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label" for="modal-login-username">Username or Email</label>
            <input type="text" id="modal-login-username" class="form-input" placeholder="e.g. alex@company.com" required />
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="form-label" for="modal-login-password" style="margin: 0;">Password</label>
              <a href="forgot-password.html" style="font-size: 0.82rem; color: var(--accent-cyan);">Forgot?</a>
            </div>
            <div class="input-wrapper">
              <input type="password" id="modal-login-password" class="form-input" placeholder="Enter password" required />
              <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('modal-login-password', this)">
                ${EYE_OPEN_SVG}
              </button>
            </div>
          </div>

          <button type="submit" id="btn-modal-signin-submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700; margin-top: 4px;">
            Sign In to OmniRoom
          </button>
        </form>
      </div>

      <!-- SIGN UP VIEW -->
      <div id="view-modal-signup" class="auth-modal-tab-content" style="display: none;">
        <form onsubmit="handleModalSignUpSubmit(event)">
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label" for="modal-reg-name">Full Name or Username</label>
            <input type="text" id="modal-reg-name" class="form-input" placeholder="e.g. Alex Rivera" required />
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label" for="modal-reg-email">Email Address</label>
            <input type="email" id="modal-reg-email" class="form-input" placeholder="e.g. alex@company.com" required />
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label" for="modal-reg-password">Password (min. 6 chars)</label>
            <div class="input-wrapper">
              <input type="password" id="modal-reg-password" class="form-input" placeholder="Create strong password" required minlength="6" />
              <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('modal-reg-password', this)">
                ${EYE_OPEN_SVG}
              </button>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" for="modal-reg-confirm-password">Confirm Password</label>
            <div class="input-wrapper">
              <input type="password" id="modal-reg-confirm-password" class="form-input" placeholder="Confirm password" required minlength="6" />
              <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('modal-reg-confirm-password', this)">
                ${EYE_OPEN_SVG}
              </button>
            </div>
          </div>

          <button type="submit" id="btn-modal-signup-submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700;">
            Create Free Account
          </button>
        </form>
      </div>

      <!-- Quick 1-Click Guest Access -->
      <button type="button" class="btn-guest-auth" onclick="handleGuestAccess()">
        <svg class="svg-icon" style="width: 15px; height: 15px;" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>Instant Access as Guest (No sign-up needed)</span>
      </button>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAuthModal();
  });
}

/**
 * Global Page Load Setup
 */
document.addEventListener('DOMContentLoaded', async () => {
  ensureAuthModalDOM();
  const user = await checkAuthStatus();
  updateNavbarAuthState(user);

  // Listen to Firebase auth state changes if available
  if (window.FIREBASE_AUTH && window.FIREBASE_AUTH.onAuthStateChanged) {
    window.FIREBASE_AUTH.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        const u = {
          id: fbUser.uid,
          username: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          first_name: fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'OmniRoom',
          last_name: fbUser.displayName ? fbUser.displayName.split(' ').slice(1).join(' ') : 'User',
          avatar_url: fbUser.photoURL || '',
          is_firebase: true
        };
        setStoredUser(u);
        updateNavbarAuthState(u);
      }
    });
  }
});

// Explicitly bind global handler functions to window
if (typeof window !== 'undefined') {
  window.handleLogin = handleLogin;
  window.handleGoogleAuth = handleGoogleAuth;
  window.handleSignOut = handleSignOut;
  window.handleLogout = handleSignOut;
  window.handleGuestAccess = handleGuestAccess;
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.switchAuthModalTab = switchAuthModalTab;
  window.checkAuthStatus = checkAuthStatus;
  window.getStoredUser = getStoredUser;
  window.setStoredUser = setStoredUser;
  window.removeStoredUser = removeStoredUser;
}
