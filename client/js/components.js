/**
 * Reusable UI Components
 */

const UI = {
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
  },

  modal(title, content, actions = '') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="flex justify-between items-center mb-4">
          <h3>${title}</h3>
          <button class="btn btn-ghost btn-icon modal-close">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        ${actions ? `<div class="flex gap-3 mt-6 justify-end">${actions}</div>` : ''}
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    return overlay;
  },

  skeleton(width = '100%', height = '20px') {
    return `<div class="skeleton" style="width:${width};height:${height}"></div>`;
  },

  statCard(label, value, change = '', positive = true) {
    return `
      <div class="glass-card stat-card hover-lift">
        <span class="stat-label">${label}</span>
        <span class="stat-value stat-number">${value}</span>
        ${change ? `<span class="stat-change ${positive ? 'positive' : 'negative'}">${change}</span>` : ''}
      </div>`;
  },

  badge(text, type = '') {
    return `<span class="badge badge-${type}">${text}</span>`;
  },

  avatar(name, size = '') {
    const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
    return `<div class="avatar ${size}">${initials}</div>`;
  },

  emptyState(icon, title, desc, action = '') {
    return `
      <div class="empty-state">
        <div class="icon">${icon}</div>
        <h3>${title}</h3>
        <p class="text-secondary mt-2">${desc}</p>
        ${action ? `<div class="mt-4">${action}</div>` : ''}
      </div>`;
  },

  progressBar(value, max = 100) {
    const pct = Math.min(100, (value / max) * 100);
    return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
  },

  skillTags(skills = []) {
    return `<div class="skill-tags">${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>`;
  },

  table(headers, rows) {
    return `
      <div class="table-wrapper">
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>`;
  },

  tabs(items, active = 0) {
    return `
      <div class="tabs" data-tabs>
        ${items.map((t, i) => `<button class="tab ${i === active ? 'active' : ''}" data-tab="${i}">${t}</button>`).join('')}
      </div>`;
  },

  uploadZone(id = 'file-upload') {
    return `
      <div class="upload-zone" id="${id}">
        <div class="icon">📄</div>
        <p><strong>Drop your resume here</strong> or click to browse</p>
        <p class="text-sm text-muted mt-2">PDF, DOC, DOCX up to 10MB</p>
        <input type="file" accept=".pdf,.doc,.docx" hidden>
      </div>`;
  },

  aiChat(id = 'ai-chat') {
    return `
      <div class="ai-chat card" id="${id}">
        <div class="ai-messages" id="${id}-messages">
          <div class="ai-message assistant">Hello! I'm your AI assistant. How can I help you today?</div>
        </div>
        <div class="ai-input-bar">
          <input type="text" class="form-input" placeholder="Ask anything..." id="${id}-input">
          <button class="btn btn-primary btn-sm" id="${id}-send">Send</button>
        </div>
      </div>`;
  },

  initParticles(count = 30) {
    const container = document.getElementById('particles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${8 + Math.random() * 12}s`;
      p.style.animationDelay = `${Math.random() * 10}s`;
      p.style.width = p.style.height = `${2 + Math.random() * 3}px`;
      container.appendChild(p);
    }
  },

  dashboardLayout(sidebar, content, user) {
    return `
      <div class="dashboard">
        <aside class="sidebar" id="sidebar">${sidebar}</aside>
        <div class="main-content">
          <header class="topbar">
            <div class="flex items-center gap-4">
              <button class="sidebar-toggle" id="sidebar-toggle">☰</button>
              <div class="search-bar">
                <span>🔍</span>
                <input type="text" placeholder="Search..." id="global-search">
              </div>
            </div>
            <div class="topbar-actions">
              <div class="notification-bell" id="notif-bell" title="Notifications">
                🔔<span class="notification-dot hidden" id="notif-dot"></span>
              </div>
              <div class="toggle-switch" id="dark-mode-toggle" title="Dark Mode"></div>
              <div class="dropdown">
                <button class="flex items-center gap-2 btn btn-ghost" id="user-menu-btn">
                  ${UI.avatar(user?.name || 'U')}
                  <span class="text-sm">${user?.name || 'User'}</span>
                </button>
                <div class="dropdown-menu hidden" id="user-menu">
                  <button class="dropdown-item" data-action="profile">Profile</button>
                  <button class="dropdown-item" data-action="settings">Settings</button>
                  <button class="dropdown-item" data-action="logout">Logout</button>
                </div>
              </div>
            </div>
          </header>
          <div class="page-body" id="page-content">${content}</div>
        </div>
      </div>`;
  },

  sidebarNav(sections, activeSection) {
    return sections.map(sec => `
      <div class="nav-section">
        <div class="nav-section-title">${sec.title}</div>
        ${sec.items.map(item => `
          <button class="nav-item ${activeSection === item.id ? 'active' : ''}" data-section="${item.id}">
            <span class="icon">${item.icon}</span>
            <span>${item.label}</span>
          </button>
        `).join('')}
      </div>
    `).join('');
  },

  bindDashboardEvents(onSectionChange) {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => onSectionChange(btn.dataset.section));
    });

    document.getElementById('user-menu-btn')?.addEventListener('click', () => {
      document.getElementById('user-menu')?.classList.toggle('hidden');
    });

    document.querySelectorAll('#user-menu .dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        if (item.dataset.action === 'logout') {
          API.logout().catch(() => {});
          API.setToken('');
          API.setUser(null);
          window.location.hash = '#/login';
        } else if (item.dataset.action === 'settings') {
          onSectionChange('settings');
        }
      });
    });

    document.getElementById('dark-mode-toggle')?.addEventListener('click', function () {
      this.classList.toggle('active');
      document.documentElement.setAttribute('data-theme', this.classList.contains('active') ? 'dark' : 'light');
    });

    let searchTimeout;
    document.getElementById('global-search')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        if (e.target.value.length < 2) return;
        try {
          const data = await API.globalSearch(e.target.value);
          console.log('Search results:', data.results);
        } catch (_) {}
      }, 300);
    });

    API.getNotifications().then(data => {
      if (data.unread > 0) {
        document.getElementById('notif-dot')?.classList.remove('hidden');
      }
    }).catch(() => {});
  },

  bindUploadZone(zoneId, onUpload) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    const input = zone.querySelector('input[type="file"]');
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', () => { if (input.files[0]) onUpload(input.files[0]); });
  },

  bindAIChat(chatId, onSend) {
    const input = document.getElementById(`${chatId}-input`);
    const send = document.getElementById(`${chatId}-send`);
    const messages = document.getElementById(`${chatId}-messages`);
    const submit = async () => {
      const text = input.value.trim();
      if (!text) return;
      messages.innerHTML += `<div class="ai-message user">${text}</div>`;
      input.value = '';
      messages.scrollTop = messages.scrollHeight;
      try {
        const response = await onSend(text);
        messages.innerHTML += `<div class="ai-message assistant">${response}</div>`;
        messages.scrollTop = messages.scrollHeight;
      } catch (e) {
        messages.innerHTML += `<div class="ai-message assistant">Sorry, something went wrong.</div>`;
      }
    };
    send?.addEventListener('click', submit);
    input?.addEventListener('keypress', (e) => { if (e.key === 'Enter') submit(); });
  }
};
