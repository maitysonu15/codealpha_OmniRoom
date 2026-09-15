/**
 * OmniRoom Dashboard Engine & Workspace Handlers
 */

let allMeetingsCache = [];
let allScheduledMeetingsCache = [];
let allContactsCache = [];
let currentContactFilter = 'all';
let currentUser = null;
let lastCreatedMeeting = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  currentUser = await checkAuthStatus();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // Set greeting & user details
  updateUserHeader(currentUser);

  // Load Meetings, Schedules & Contacts
  await loadRecentMeetings();
  await loadScheduledMeetings();
  await loadDashboardContacts();

  // Setup Listeners
  setupDashboardListeners();
});

function updateUserHeader(user) {
  if (!user) return;
  const displayName = user.first_name || user.username || 'User';
  const welcomeNameEl = document.getElementById('user-name');
  if (welcomeNameEl) welcomeNameEl.textContent = displayName;

  const welcomeBannerNameEl = document.getElementById('welcome-banner-name');
  if (welcomeBannerNameEl) welcomeBannerNameEl.textContent = displayName;

  const userAvatarEl = document.getElementById('user-avatar');
  if (userAvatarEl) {
    if (user.avatar_url && !user.avatar_url.includes('bottts') && (user.avatar_url.startsWith('http') || user.avatar_url.startsWith('data:'))) {
      userAvatarEl.innerHTML = `<img src="${user.avatar_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="${displayName}" onerror="this.parentElement.textContent='${displayName.charAt(0).toUpperCase()}'" />`;
    } else {
      userAvatarEl.textContent = displayName.charAt(0).toUpperCase();
    }
  }

  // Time greeting
  const greetingEl = document.getElementById('time-greeting');
  if (greetingEl) {
    const hours = new Date().getHours();
    if (hours < 12) greetingEl.textContent = 'morning';
    else if (hours < 17) greetingEl.textContent = 'afternoon';
    else greetingEl.textContent = 'evening';
  }
}

function setupDashboardListeners() {
  // Open Create Meeting Modal
  const btnOpenCreate = document.getElementById('btn-open-create-modal');
  if (btnOpenCreate) {
    btnOpenCreate.addEventListener('click', () => openModal('modal-create-meeting'));
  }

  // Join Meeting Form
  const formJoin = document.getElementById('form-join-meeting');
  if (formJoin) {
    formJoin.addEventListener('submit', handleJoinMeeting);
  }

  // Open Schedule Meeting Modal
  const btnSchedule = document.getElementById('btn-schedule-meeting');
  if (btnSchedule) {
    btnSchedule.addEventListener('click', () => openModal('modal-schedule'));
  }

  // Logout Button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', handleLogout);
  }

  // Theme Toggle Button
  const btnTheme = document.getElementById('btn-theme-toggle');
  if (btnTheme) {
    btnTheme.addEventListener('click', toggleTheme);
  }

  // Mobile Sidebar Toggle
  const btnMobileMenu = document.getElementById('btn-mobile-menu');
  const sidebar = document.getElementById('sidebar');
  if (btnMobileMenu && sidebar) {
    btnMobileMenu.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // Sidebar Tab Navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const targetSection = item.getAttribute('data-section');
      switchDashboardTab(targetSection);
    });
  });

  // Enter created room button
  const enterCreatedBtn = document.getElementById('btn-enter-created-room');
  if (enterCreatedBtn) {
    enterCreatedBtn.addEventListener('click', () => {
      if (lastCreatedMeeting) {
        window.location.href = `meeting.html?code=${lastCreatedMeeting.meeting_code}`;
      }
    });
  }

  // Global Search Shortcuts: Ctrl+K or Cmd+K to focus search, Esc to close
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('global-search-input');
      if (searchInput) {
        searchInput.focus();
        openSearchDropdown();
      }
    } else if (e.key === 'Escape') {
      closeSearchDropdown();
      const searchInput = document.getElementById('global-search-input');
      if (searchInput) searchInput.blur();
    }
  });

  // Click outside search container to close dropdown
  document.addEventListener('click', (e) => {
    const container = document.getElementById('global-search-container');
    if (container && !container.contains(e.target)) {
      closeSearchDropdown();
    }
  });
}

function switchDashboardTab(tabName) {
  const panels = document.querySelectorAll('.dashboard-tab-panel');
  panels.forEach(p => p.classList.remove('active'));

  const activePanel = document.getElementById(`panel-${tabName}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  if (tabName === 'meetings') {
    renderAllMeetingsGrid(allMeetingsCache);
  } else if (tabName === 'calendar') {
    renderCalendarSchedules(allScheduledMeetingsCache);
  } else if (tabName === 'files') {
    loadDashboardFiles();
  } else if (tabName === 'people') {
    loadDashboardContacts();
  }
}

async function handleCreateMeetingSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('create-meeting-title').value.trim() || `${currentUser.username}'s Meeting`;
  const description = document.getElementById('create-meeting-desc').value.trim();
  const waiting_room = document.getElementById('create-waiting-room').checked;
  const mute_on_entry = document.getElementById('create-mute-entry').checked;
  const require_auth = document.getElementById('create-require-auth').checked;

  try {
    const data = await apiFetch('/meetings/create/', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        waiting_room,
        mute_on_entry,
        require_auth
      })
    });

    lastCreatedMeeting = data;
    closeModal('modal-create-meeting');

    // Populate Ready Modal
    document.getElementById('ready-meeting-code').value = data.meeting_code;
    const meetingUrl = `${window.location.origin}/join.html?code=${data.meeting_code}`;
    document.getElementById('ready-meeting-url').value = meetingUrl;

    openModal('modal-meeting-ready');
    loadRecentMeetings();
  } catch (err) {
    showToast(`Failed to create meeting: ${err.message}`, 'error');
  }
}

function copyMeetingCode() {
  const input = document.getElementById('ready-meeting-code');
  if (input) {
    navigator.clipboard.writeText(input.value);
    showToast('Meeting code copied to clipboard!', 'success');
  }
}

function copyMeetingLink() {
  const input = document.getElementById('ready-meeting-url');
  if (input) {
    navigator.clipboard.writeText(input.value);
    showToast('Meeting link copied to clipboard!', 'success');
  }
}

async function handleScheduleSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('schedule-title').value.trim();
  const start_time = document.getElementById('schedule-time').value;
  const description = document.getElementById('schedule-desc').value.trim();

  if (!start_time) {
    showToast('Please select a start date and time.', 'error');
    return;
  }

  try {
    const data = await apiFetch('/meetings/scheduled/', {
      method: 'POST',
      body: JSON.stringify({
        title,
        start_time: new Date(start_time).toISOString(),
        description
      })
    });

    closeModal('modal-schedule');
    showToast('Meeting scheduled successfully!', 'success');
    await loadScheduledMeetings();
  } catch (err) {
    showToast(`Scheduling failed: ${err.message}`, 'error');
  }
}

async function handleJoinMeeting(e) {
  e.preventDefault();
  const inputEl = document.getElementById('input-meeting-code');
  let code = inputEl ? inputEl.value.trim() : '';

  if (code.includes('code=')) {
    const match = code.match(/code=([a-zA-Z0-9-]+)/);
    if (match) code = match[1];
  }

  if (!code) {
    showToast('Please enter a valid meeting code.', 'error');
    return;
  }

  window.location.href = `join.html?code=${encodeURIComponent(code)}`;
}

async function loadRecentMeetings() {
  const container = document.getElementById('recent-meetings-container');
  if (!container) return;

  container.innerHTML = Array(3).fill(0).map(() => `
    <div class="meeting-card skeleton" style="height: 150px;"></div>
  `).join('');

  try {
    const meetings = await apiFetch('/meetings/');
    allMeetingsCache = meetings || [];

    if (allMeetingsCache.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>
          <h3>No recent meetings found</h3>
          <p>You haven't participated in any calls yet. Start an instant room or share an invite link to begin collaborating.</p>
          <button class="btn btn-primary btn-sm" onclick="openModal('modal-create-meeting')" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Start Instant Meeting</span>
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = allMeetingsCache.slice(0, 6).map(m => renderMeetingCardHTML(m)).join('');
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <p style="color: var(--danger);">Unable to load meeting history.</p>
      </div>
    `;
  }
}

async function loadScheduledMeetings() {
  const container = document.getElementById('scheduled-meetings-container');
  if (!container) return;

  try {
    const scheduled = await apiFetch('/meetings/scheduled/');
    allScheduledMeetingsCache = scheduled || [];

    if (allScheduledMeetingsCache.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon-box" style="background: linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%); color: #34d399;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <h3>No scheduled meetings</h3>
          <p>Plan upcoming conferences, set custom calendar times, and configure waiting rooms in advance.</p>
          <button class="btn btn-secondary btn-sm" onclick="openModal('modal-schedule')" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Schedule a Meeting</span>
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = allScheduledMeetingsCache.map(s => `
      <div class="meeting-card">
        <div class="meeting-card-header">
          <span class="meeting-code-tag">${s.meeting_code}</span>
          <span class="badge badge-primary" style="display: inline-flex; align-items: center; gap: 4px;">
            <svg class="svg-icon" style="width: 12px; height: 12px;" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Scheduled
          </span>
        </div>
        <div class="meeting-card-body">
          <h4>${escapeHtml(s.title)}</h4>
          <div class="meeting-card-meta">
            <svg class="svg-icon" style="width: 14px; height: 14px; opacity: 0.7;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${new Date(s.start_time).toLocaleString()}</span>
          </div>
          ${s.description ? `<p style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 14px;">${escapeHtml(s.description)}</p>` : ''}
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="meeting.html?code=${s.meeting_code}" class="btn btn-primary btn-sm" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <span>Start Call</span>
          </a>
          <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${window.location.origin}/join.html?code=${s.meeting_code}'); showToast('Invite link copied!', 'info');" title="Copy Invite Link">
            <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Failed to load scheduled meetings:', err);
  }
}

function renderMeetingCardHTML(m) {
  return `
    <div class="meeting-card">
      <div class="meeting-card-header">
        <span class="meeting-code-tag">${m.meeting_code}</span>
        <span class="badge ${m.is_active ? 'badge-success' : 'badge-warning'}">
          ${m.is_active ? 'Active' : 'Ended'}
        </span>
      </div>
      <div class="meeting-card-body">
        <h4>${escapeHtml(m.title || 'Instant Meeting')}</h4>
        <div class="meeting-card-meta">
          <svg class="svg-icon" style="width: 14px; height: 14px; opacity: 0.7;" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Host: ${m.host.username} • ${new Date(m.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <a href="join.html?code=${m.meeting_code}" class="btn btn-secondary btn-sm" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <span>Rejoin Room</span>
        </a>
        <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${window.location.origin}/join.html?code=${m.meeting_code}'); showToast('Meeting link copied!', 'info');" title="Copy Link">
          <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
    </div>
  `;
}

function renderAllMeetingsGrid(meetings) {
  const container = document.getElementById('all-meetings-container');
  if (!container) return;

  if (!meetings || meetings.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <p>No meetings found matching your filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = meetings.map(m => renderMeetingCardHTML(m)).join('');
}

function filterMeetings(filterType, btnElem) {
  document.querySelectorAll('.meeting-tab-pill').forEach(b => b.classList.remove('active'));
  if (btnElem) btnElem.classList.add('active');

  if (filterType === 'active') {
    renderAllMeetingsGrid(allMeetingsCache.filter(m => m.is_active));
  } else if (filterType === 'past') {
    renderAllMeetingsGrid(allMeetingsCache.filter(m => !m.is_active));
  } else {
    renderAllMeetingsGrid(allMeetingsCache);
  }
}

function renderCalendarSchedules(schedules) {
  const container = document.getElementById('calendar-schedule-list');
  if (!container) return;

  if (!schedules || schedules.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <svg class="svg-icon" style="width: 36px; height: 36px; opacity: 0.5;" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <p>No upcoming scheduled meetings on your calendar.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = schedules.map(s => `
    <div class="meeting-card">
      <div class="meeting-card-header">
        <span class="meeting-code-tag">${s.meeting_code}</span>
        <span class="badge badge-primary">Scheduled</span>
      </div>
      <div class="meeting-card-body">
        <h4>${escapeHtml(s.title)}</h4>
        <div class="meeting-card-meta">
          <svg class="svg-icon" style="width: 14px; height: 14px; opacity: 0.7;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>${new Date(s.start_time).toLocaleString()}</span>
        </div>
      </div>
      <a href="meeting.html?code=${s.meeting_code}" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
        <svg class="svg-icon" style="width: 14px; height: 14px;" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        <span>Launch Call</span>
      </a>
    </div>
  `).join('');
}

async function loadDashboardFiles() {
  const container = document.getElementById('dashboard-files-container');
  if (!container) return;

  container.innerHTML = `<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1;">Loading shared files...</p>`;

  try {
    // Aggregated list from recent meetings
    container.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; padding: 36px; text-align: center;">
        <div class="empty-state-icon" style="margin-bottom: 14px;">
          <svg class="svg-icon" style="width: 44px; height: 44px; opacity: 0.6; color: var(--primary);" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h3>Secure File Storage</h3>
        <p style="margin-top: 6px; color: var(--text-muted); max-width: 500px; margin-left: auto; margin-right: auto;">
          Files uploaded during active meetings are stored securely and accessible to verified room participants.
        </p>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color: var(--danger);">Failed to load files.</p>`;
  }
}

let currentSearchFilter = 'all';

function openSearchDropdown() {
  const dropdown = document.getElementById('search-results-dropdown');
  if (dropdown) {
    dropdown.style.display = 'block';
    renderSearchDropdownContent();
  }
}

function closeSearchDropdown() {
  const dropdown = document.getElementById('search-results-dropdown');
  if (dropdown) {
    dropdown.style.display = 'none';
  }
}

function setSearchFilter(filter) {
  currentSearchFilter = filter;
  document.querySelectorAll('.search-chip').forEach(chip => {
    const text = chip.textContent.toLowerCase();
    chip.classList.toggle('active', 
      (filter === 'all' && text.includes('all')) ||
      (filter === 'meetings' && text.includes('meetings')) ||
      (filter === 'quick' && text.includes('quick'))
    );
  });
  renderSearchDropdownContent();
}

function clearGlobalSearch() {
  const input = document.getElementById('global-search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  if (input) {
    input.value = '';
    input.focus();
    if (clearBtn) clearBtn.style.display = 'none';
    handleSearch('');
  }
}

function renderSearchDropdownContent() {
  const input = document.getElementById('global-search-input');
  const contentEl = document.getElementById('search-dropdown-content');
  if (!contentEl) return;

  const query = input ? input.value.toLowerCase().trim() : '';
  let html = '';

  // 1. Quick Actions Section
  if (currentSearchFilter === 'all' || currentSearchFilter === 'quick') {
    const quickActions = [
      {
        title: 'Start Instant Meeting',
        sub: 'Launch a private conference room immediately',
        icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
        action: "openModal('modal-create-meeting'); closeSearchDropdown();"
      },
      {
        title: 'Join with Code',
        sub: 'Enter an active room code or link',
        icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="10" y1="12" x2="10.01" y2="12"/><line x1="14" y1="12" x2="14.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>',
        action: "document.getElementById('input-join-code')?.focus(); closeSearchDropdown();"
      },
      {
        title: 'Schedule Meeting',
        sub: 'Plan a future call with date and time',
        icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        action: "openModal('modal-schedule'); closeSearchDropdown();"
      }
    ];

    const filteredActions = quickActions.filter(a => !query || a.title.toLowerCase().includes(query) || a.sub.toLowerCase().includes(query));
    if (filteredActions.length > 0) {
      html += `
        <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 10px 4px;">
          ⚡ Quick Actions
        </div>
      `;
      filteredActions.forEach(a => {
        html += `
          <div class="search-item" onclick="${a.action}">
            <div class="search-item-left">
              <div class="search-item-icon">${a.icon}</div>
              <div>
                <div class="search-item-title">${escapeHtml(a.title)}</div>
                <div class="search-item-sub">${escapeHtml(a.sub)}</div>
              </div>
            </div>
            <span style="font-size: 0.72rem; color: #818cf8; font-weight: 700;">➔</span>
          </div>
        `;
      });
    }
  }

  // 2. Matching Meetings Section
  if (currentSearchFilter === 'all' || currentSearchFilter === 'meetings') {
    const matchingMeetings = (allMeetingsCache || []).filter(m =>
      !query ||
      (m.title && m.title.toLowerCase().includes(query)) ||
      (m.meeting_code && m.meeting_code.toLowerCase().includes(query)) ||
      (m.host && m.host.username.toLowerCase().includes(query))
    ).slice(0, 6);

    if (matchingMeetings.length > 0) {
      html += `
        <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px 4px; border-top: ${html ? '1px solid rgba(255,255,255,0.06)' : 'none'}; margin-top: ${html ? '4px' : '0'};">
          📹 Meetings & Rooms (${matchingMeetings.length})
        </div>
      `;
      matchingMeetings.forEach(m => {
        html += `
          <div class="search-item" onclick="window.location.href='meeting.html?code=${encodeURIComponent(m.meeting_code)}'">
            <div class="search-item-left">
              <div class="search-item-icon" style="background: rgba(6, 182, 212, 0.18); color: #22d3ee;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div class="search-item-title">${escapeHtml(m.title || 'Untitled Meeting')}</div>
                <div class="search-item-sub">Code: <span style="font-family: var(--font-mono); color: #a5b4fc; font-weight: 600;">${escapeHtml(m.meeting_code)}</span> • Host: ${escapeHtml(m.host ? m.host.username : 'You')}</div>
              </div>
            </div>
            <a href="meeting.html?code=${encodeURIComponent(m.meeting_code)}" class="btn btn-primary btn-sm" style="padding: 4px 12px; font-size: 0.76rem;" onclick="event.stopPropagation();">Join</a>
          </div>
        `;
      });
    } else if (query && currentSearchFilter === 'meetings') {
      html += `
        <div style="text-align: center; padding: 24px 12px; color: var(--text-muted); font-size: 0.85rem;">
          <div style="font-size: 1.5rem; margin-bottom: 6px;">🔍</div>
          No meetings found for "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
    }
  }

  contentEl.innerHTML = html || `
    <div style="text-align: center; padding: 22px 12px; color: var(--text-muted); font-size: 0.85rem;">
      <div style="font-size: 1.3rem; margin-bottom: 4px;">🔍</div>
      Type to search meetings, contacts, or quick actions...
    </div>
  `;
}

function handleSearch(query) {
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) {
    clearBtn.style.display = query ? 'flex' : 'none';
  }

  renderSearchDropdownContent();

  const q = query.toLowerCase().trim();
  if (!q) {
    renderAllMeetingsGrid(allMeetingsCache);
    return;
  }

  const filtered = allMeetingsCache.filter(m => 
    (m.title && m.title.toLowerCase().includes(q)) ||
    (m.meeting_code && m.meeting_code.toLowerCase().includes(q)) ||
    (m.host && m.host.username.toLowerCase().includes(q))
  );

  const activePanel = document.querySelector('.dashboard-tab-panel.active');
  if (activePanel && activePanel.id === 'panel-meetings') {
    renderAllMeetingsGrid(filtered);
  } else {
    const recentContainer = document.getElementById('recent-meetings-container');
    if (recentContainer) {
      recentContainer.innerHTML = filtered.length > 0
        ? filtered.map(m => renderMeetingCardHTML(m)).join('')
        : `<div class="empty-state" style="grid-column: 1 / -1;"><p>No meetings found for "${escapeHtml(query)}"</p></div>`;
    }
  }
}

/* ==========================================================================
   Contacts & Teammates Engine
   ========================================================================== */

function getAvatarGradient(name) {
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

async function loadDashboardContacts() {
  const container = document.getElementById('dashboard-contacts-container');
  try {
    const contacts = await apiFetch('/auth/contacts/');
    if (Array.isArray(contacts)) {
      allContactsCache = contacts;
    } else {
      allContactsCache = [];
    }
    renderContactsList();
  } catch (err) {
    console.error('Error loading contacts from API:', err);
    allContactsCache = [];
    renderContactsList();
  }
}

function getFilteredContacts() {
  const searchInput = document.getElementById('contacts-search-input');
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

  return allContactsCache.filter(c => {
    // Category filter
    if (currentContactFilter === 'online' && c.status !== 'online') return false;
    if (currentContactFilter === 'registered' && !c.is_registered) return false;

    // Search query filter
    if (q) {
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchRole = (c.role || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchRole;
    }

    return true;
  });
}

function renderContactsList(contactsToRender = null) {
  const container = document.getElementById('dashboard-contacts-container');
  if (!container) return;

  const contacts = contactsToRender !== null ? contactsToRender : getFilteredContacts();

  // Update counts
  const totalCount = allContactsCache.length;
  const countAllEl = document.getElementById('count-all-contacts');
  if (countAllEl) countAllEl.textContent = totalCount;
  const countOnlineEl = document.getElementById('count-online-contacts');
  if (countOnlineEl) countOnlineEl.textContent = allContactsCache.filter(c => c.status === 'online').length;
  const countRegEl = document.getElementById('count-registered-contacts');
  if (countRegEl) countRegEl.textContent = allContactsCache.filter(c => c.is_registered).length;

  if (contacts.length === 0) {
    const searchInput = document.getElementById('contacts-search-input');
    const query = searchInput ? searchInput.value.trim() : '';

    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 24px;">
        <div class="empty-state-icon-box">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h3>${query ? 'No contacts matched your search' : 'No Contacts Added Yet'}</h3>
        <p>${query ? `We couldn't find any teammate matching "${escapeHtml(query)}". Try another search or add them.` : 'Add your teammates and collaborators to quickly start 1-on-1 calls and invite them to meetings.'}</p>
        <button class="btn btn-primary" onclick="openModal('modal-add-contact')" style="display: inline-flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Add Contact</span>
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = contacts.map(c => {
    const initial = (c.name || 'U').charAt(0).toUpperCase();
    const grad = getAvatarGradient(c.name);
    const statusClass = `contact-status-${c.status || 'online'}`;
    const statusTitle = c.status === 'online' ? 'Online' : (c.status === 'in_meeting' ? 'In Meeting' : 'Offline');

    return `
      <div class="contact-card" id="contact-card-${c.id}">
        <div class="contact-card-top">
          <div class="contact-avatar-box" style="background: ${grad};">
            ${c.avatar_url ? `<img src="${escapeHtml(c.avatar_url)}" alt="${escapeHtml(c.name)}" class="contact-avatar-img" />` : initial}
            <span class="contact-status-dot ${statusClass}" title="${statusTitle}"></span>
          </div>
          <div class="contact-details">
            <div class="contact-name-row">
              <span class="contact-name">${escapeHtml(c.name)}</span>
              ${c.is_registered ? `<span class="contact-badge-reg" title="Registered OmniRoom User">✓ Verified</span>` : ''}
            </div>
            <span class="contact-role">${escapeHtml(c.role || 'Teammate')}</span>
            <div class="contact-email-row">
              <span class="contact-email" title="${escapeHtml(c.email)}">${escapeHtml(c.email)}</span>
              <button class="btn-copy-email" onclick="copyContactEmail('${escapeHtml(c.email)}', this)" title="Copy email address">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="contact-card-actions">
          <button class="btn-contact-call" onclick="startMeetingWithContact('${escapeHtml(c.name)}', ${c.id})">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <span>Call Now</span>
          </button>
          <button class="btn-contact-delete" onclick="deleteContact(${c.id}, '${escapeHtml(c.name)}')" title="Remove contact">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterContactsCategory(category) {
  currentContactFilter = category;
  document.querySelectorAll('.contacts-filter-chip').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`filter-${category}-contacts`);
  if (activeBtn) activeBtn.classList.add('active');
  renderContactsList();
}

function handleContactSearch(query) {
  renderContactsList();
}

async function handleAddContactSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('add-contact-name');
  const emailInput = document.getElementById('add-contact-email');
  const roleInput = document.getElementById('add-contact-role');
  const submitBtn = document.getElementById('btn-submit-add-contact');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const role = roleInput ? roleInput.value.trim() : 'Teammate';

  if (!name || !email) {
    showToast('Name and email are required.', 'error');
    return;
  }

  const origBtnContent = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>Saving...</span>`;

  try {
    const res = await apiFetch('/auth/contacts/', {
      method: 'POST',
      body: JSON.stringify({ name, email, role })
    });

    showToast(res.message || `Contact ${name} added successfully!`, 'success');
    closeModal('modal-add-contact');
    nameInput.value = '';
    emailInput.value = '';
    if (roleInput) roleInput.value = '';

    await loadDashboardContacts();
  } catch (err) {
    showToast(err.message || 'Failed to add contact.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = origBtnContent;
  }
}

async function deleteContact(id, name) {
  if (!confirm(`Are you sure you want to remove "${name}" from your contacts?`)) {
    return;
  }

  try {
    const res = await apiFetch(`/auth/contacts/${id}/`, {
      method: 'DELETE'
    });
    showToast(res.message || `Contact ${name} removed.`, 'info');
    allContactsCache = allContactsCache.filter(c => c.id !== id);
    renderContactsList();
  } catch (err) {
    showToast(err.message || 'Failed to remove contact.', 'error');
  }
}

async function startMeetingWithContact(name, contactId = null) {
  showToast(`Initiating direct call with ${name}...`, 'info');
  try {
    let meeting;
    if (contactId) {
      meeting = await apiFetch(`/auth/contacts/${contactId}/call/`, {
        method: 'POST'
      });
    } else {
      meeting = await apiFetch('/meetings/create/', {
        method: 'POST',
        body: JSON.stringify({ title: `Meeting with ${name}` })
      });
    }

    if (meeting && meeting.meeting_code) {
      window.location.href = `meeting.html?code=${meeting.meeting_code}`;
    }
  } catch (err) {
    showToast(err.message || 'Failed to start direct meeting.', 'error');
  }
}

function copyContactEmail(email, buttonEl) {
  navigator.clipboard.writeText(email).then(() => {
    showToast(`Copied ${email} to clipboard!`, 'success');
    if (buttonEl) {
      const orig = buttonEl.innerHTML;
      buttonEl.innerHTML = `<span style="color: #10b981; font-size: 0.75rem; font-weight: 700;">✓ Copied</span>`;
      setTimeout(() => { buttonEl.innerHTML = orig; }, 1800);
    }
  }).catch(() => {
    showToast('Failed to copy email', 'error');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

