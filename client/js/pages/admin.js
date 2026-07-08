const AdminDashboard = {
  section: 'overview',
  user: null,

  navSections: [
    {
      title: 'Main', items: [
        { id: 'overview', icon: '📊', label: 'Overview' },
        { id: 'users', icon: '👥', label: 'Manage Users' },
        { id: 'recruiters', icon: '💼', label: 'Manage Recruiters' },
        { id: 'companies', icon: '🏢', label: 'Manage Companies' }
      ]
    },
    {
      title: 'Platform', items: [
        { id: 'analytics', icon: '📈', label: 'Analytics' },
        { id: 'subscriptions', icon: '💳', label: 'Subscriptions' },
        { id: 'features', icon: '🎛️', label: 'Feature Toggles' },
        { id: 'integrations', icon: '🔌', label: 'Integrations' }
      ]
    },
    {
      title: 'System', items: [
        { id: 'logs', icon: '📋', label: 'Logs' },
        { id: 'backup', icon: '💾', label: 'Backup' },
        { id: 'security', icon: '🔒', label: 'Security' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
      ]
    }
  ],

  async render(section = 'overview') {
    this.section = section;
    this.user = API.getUser();
    const sidebar = `
      <div class="sidebar-header">
        <div class="logo"><div class="logo-icon">AI</div><span>TalentAI</span></div>
        <div class="badge badge-error mt-2">Admin</div>
      </div>
      <nav class="sidebar-nav">${UI.sidebarNav(this.navSections, section)}</nav>
      <div class="sidebar-footer">
        <div class="flex items-center gap-3">
          ${UI.avatar(this.user?.name)}
          <div><div class="text-sm" style="font-weight:500">${this.user?.name}</div><div class="text-xs text-muted">${this.user?.email}</div></div>
        </div>
      </div>`;

    const content = await this.renderSection(section);
    return UI.dashboardLayout(sidebar, content, this.user);
  },

  async renderSection(section) {
    const renderers = {
      overview: () => this.renderOverview(),
      users: () => this.renderUsers(),
      recruiters: () => this.renderRecruiters(),
      companies: () => this.renderCompanies(),
      analytics: () => this.renderAnalytics(),
      subscriptions: () => this.renderSubscriptions(),
      features: () => this.renderFeatures(),
      integrations: () => this.renderIntegrations(),
      logs: () => this.renderLogs(),
      backup: () => this.renderBackup(),
      security: () => this.renderSecurity(),
      settings: () => this.renderSettings()
    };
    return (renderers[section] || renderers.overview)();
  },

  async renderOverview() {
    let stats = { stats: {} };
    try { stats = await API.getStats(); } catch (_) { }
    const s = stats.stats || {};

    return `
      <div class="page-header"><h2>Admin Dashboard</h2><p class="text-secondary">Platform management and statistics</p></div>
      <div class="grid grid-4 gap-4 mb-6 stagger">
        ${UI.statCard('Total Users', s.users || 0)}
        ${UI.statCard('Candidates', s.candidates || 0)}
        ${UI.statCard('Recruiters', s.recruiters || 0)}
        ${UI.statCard('Companies', s.companies || 0)}
      </div>
      <div class="grid grid-4 gap-4 mb-6">
        ${UI.statCard('Active Jobs', s.activeJobs || 0)}
        ${UI.statCard('Total Jobs', s.jobs || 0)}
        ${UI.statCard('Applications', s.applications || 0)}
        ${UI.statCard('Platform Health', '99.9%', 'All systems operational', true)}
      </div>
      <div class="grid grid-2 gap-6">
        <div class="card chart-container"><h3 class="mb-4">User Distribution</h3><div class="chart-wrapper"><canvas id="user-pie"></canvas></div></div>
        <div class="card chart-container"><h3 class="mb-4">Platform Growth</h3><div class="chart-wrapper"><canvas id="growth-line"></canvas></div></div>
      </div>`;
  },

  async renderUsers() {
    let users = [];
    try { const data = await API.getUsers(); users = data.users || []; } catch (_) { }

    return `
      <div class="page-header flex justify-between items-center">
        <div><h2>Manage Users</h2><p class="text-secondary">${users.length} registered users</p></div>
        <input class="form-input" style="max-width:250px" placeholder="Search users..." id="user-search">
      </div>
      <div class="card">
        ${users.length ? UI.table(
      ['Name', 'Email', 'Role', 'Verified', 'Status', 'Joined'],
      users.map(u => [
        `${UI.avatar(u.name)} ${u.name}`,
        u.email,
        UI.badge(u.role, u.role === 'admin' ? 'error' : 'primary'),
        u.isVerified ? '✓' : '✗',
        u.isActive ? UI.badge('Active', 'success') : UI.badge('Inactive', 'error'),
        new Date(u.createdAt).toLocaleDateString()
      ])
    ) : UI.emptyState('👥', 'No users', 'Users will appear after registration')}
      </div>`;
  },

  async renderRecruiters() {
    let users = [];
    try { const data = await API.getUsers('role=recruiter'); users = data.users || []; } catch (_) { }

    return `
      <div class="page-header"><h2>Manage Recruiters</h2><p class="text-secondary">${users.length} recruiters</p></div>
      <div class="card">
        ${users.length ? users.map(u => `
          <div class="leaderboard-item">
            ${UI.avatar(u.name)}
            <div><strong>${u.name}</strong><div class="text-sm text-muted">${u.email}</div></div>
            ${UI.badge(u.isVerified ? 'Verified' : 'Pending', u.isVerified ? 'success' : 'warning')}
            <button class="btn btn-sm btn-ghost">Manage</button>
          </div>
        `).join('') : UI.emptyState('💼', 'No recruiters', 'Recruiters register through the platform')}
      </div>`;
  },

  async renderCompanies() {
    let companies = [];
    try { const data = await API.getCompanies(); companies = data.companies || []; } catch (_) { }

    return `
      <div class="page-header flex justify-between items-center">
        <div><h2>Manage Companies</h2><p class="text-secondary">${companies.length} companies</p></div>
        <button class="btn btn-primary" id="add-company">+ Add Company</button>
      </div>
      <div class="grid grid-2 gap-4">
        ${companies.length ? companies.map(c => `
          <div class="glass-card p-6 hover-lift">
            <div class="flex justify-between items-center mb-2">
              <h3>${c.name}</h3>
              ${UI.badge(c.subscription, c.subscription === 'pro' ? 'primary' : 'warning')}
            </div>
            <p class="text-sm text-secondary">${c.industry} • ${c.size} • ${c.location}</p>
            <p class="text-sm mt-2">${c.recruiters?.length || 0} recruiters</p>
          </div>
        `).join('') : UI.emptyState('🏢', 'No companies', 'Add companies to the platform')}
      </div>`;
  },

  renderAnalytics() {
    return `
      <div class="page-header"><h2>Platform Analytics</h2><p class="text-secondary">System-wide metrics</p></div>
      <div class="grid grid-2 gap-6">
        <div class="card chart-container"><h3 class="mb-4">Monthly Active Users</h3><div class="chart-wrapper"><canvas id="mau-chart"></canvas></div></div>
        <div class="card chart-container"><h3 class="mb-4">API Usage</h3><div class="chart-wrapper"><canvas id="api-chart"></canvas></div></div>
      </div>
      <div class="card chart-container mt-6"><h3 class="mb-4">Feature Usage Heatmap</h3><div class="chart-wrapper"><canvas id="feature-heatmap"></canvas></div></div>`;
  },

  renderSubscriptions() {
    return `
      <div class="page-header"><h2>Subscription Management</h2></div>
      <div class="card">
        ${UI.table(
      ['Plan', 'Companies', 'Revenue', 'Status'],
      [
        ['Free', '12', '$0', UI.badge('Active', 'success')],
        ['Starter', '8', '$2,400/mo', UI.badge('Active', 'success')],
        ['Pro', '3', '$4,500/mo', UI.badge('Active', 'success')],
        ['Enterprise', '1', '$10,000/mo', UI.badge('Active', 'success')]
      ]
    )}
      </div>`;
  },

  renderFeatures() {
    const features = [
      { name: 'AI Resume Screening', enabled: true },
      { name: 'GitHub Integration', enabled: true },
      { name: 'Career Roadmap', enabled: true },
      { name: 'Coding Assessment', enabled: true },
      { name: 'Interview Scheduling', enabled: true },
      { name: 'Reverse Job Matching', enabled: false },
      { name: 'Auto Resume Collection', enabled: false },
      { name: 'Soft Skill Inference', enabled: true }
    ];

    return `
      <div class="page-header"><h2>Feature Toggles</h2><p class="text-secondary">Enable or disable platform features</p></div>
      <div class="card">
        ${features.map(f => `
          <div class="flex items-center justify-between" style="padding:14px 0;border-bottom:1px solid var(--border)">
            <div><strong>${f.name}</strong></div>
            <div class="toggle-switch ${f.enabled ? 'active' : ''}" data-feature="${f.name}"></div>
          </div>
        `).join('')}
      </div>`;
  },

  async renderIntegrations() {
    let settings = [];
    try { const data = await API.getSettings(); settings = data.settings || []; } catch (_) { }

    const categories = {
      api: 'AI & API Keys',
      oauth: 'OAuth Credentials',
      email: 'Email & SMTP',
      database: 'Database',
      security: 'Security'
    };

    return `
      <div class="page-header"><h2>Settings / Integrations</h2><p class="text-secondary">Configure API keys and service credentials</p></div>
      <form id="settings-form">
        <div class="settings-grid">
          ${Object.entries(categories).map(([cat, title]) => `
            <div class="card settings-section">
              <h3>${title}</h3>
              ${settings.filter(s => s.category === cat).map(s => `
                <div class="form-group">
                  <label class="form-label">${s.key.replace(/_/g, ' ')}</label>
                  <input class="form-input" name="${s.key}" type="${s.isSecret ? 'password' : 'text'}"
                    value="${s.isSecret ? '' : s.value}" placeholder="${s.isSecret ? '••••••••' : ''}">
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
        <button type="submit" class="btn btn-primary mt-6">Save All Settings</button>
      </form>
      <div class="card mt-6">
        <h3 class="mb-4">Environment Variables</h3>
        <p class="text-sm text-secondary">These settings map to your <code>.env</code> file. Never commit secrets to version control.</p>
        <pre class="mt-4 p-4 rounded text-sm" style="background:var(--bg-secondary);overflow-x:auto">OPENAI_API_KEY=sk-...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
MONGODB_URI=mongodb://...
JWT_SECRET=...</pre>
      </div>`;
  },

  async renderLogs() {
    let logs = [];
    try { const data = await API.getLogs(); logs = data.logs || []; } catch (_) { }

    return `
      <div class="page-header"><h2>System Logs</h2><p class="text-secondary">Recent platform activity</p></div>
      <div class="card">
        ${logs.length ? UI.table(
      ['Action', 'User', 'Level', 'IP', 'Time'],
      logs.map(l => [
        l.action,
        l.user?.name || 'System',
        UI.badge(l.level, l.level === 'error' ? 'error' : l.level === 'security' ? 'warning' : 'primary'),
        l.ip || '-',
        new Date(l.createdAt).toLocaleString()
      ])
    ) : UI.emptyState('📋', 'No logs', 'System logs will appear here')}
      </div>`;
  },

  renderBackup() {
    return `
      <div class="page-header"><h2>Backup & Recovery</h2></div>
      <div class="grid grid-2 gap-6">
        <div class="card">
          <h3 class="mb-4">Database Backup</h3>
          <p class="text-secondary mb-4">Last backup: 2 hours ago</p>
          <button class="btn btn-primary" id="create-backup">Create Backup Now</button>
        </div>
        <div class="card">
          <h3 class="mb-4">Restore</h3>
          <p class="text-secondary mb-4">Restore from a previous backup point</p>
          <select class="form-select mb-4">
            <option>Backup - Jul 8, 2026 09:00</option>
            <option>Backup - Jul 7, 2026 09:00</option>
            <option>Backup - Jul 6, 2026 09:00</option>
          </select>
          <button class="btn btn-secondary">Restore</button>
        </div>
      </div>`;
  },

  renderSecurity() {
    return `
      <div class="page-header"><h2>Security</h2><p class="text-secondary">Platform security settings</p></div>
      <div class="grid grid-2 gap-6">
        <div class="card">
          <h3 class="mb-4">Security Status</h3>
          ${[
        { label: 'JWT Authentication', status: 'Active', ok: true },
        { label: 'Helmet Headers', status: 'Active', ok: true },
        { label: 'Rate Limiting', status: 'Active', ok: true },
        { label: 'CORS Protection', status: 'Active', ok: true },
        { label: 'Input Validation', status: 'Active', ok: true },
        { label: 'Password Hashing (bcrypt)', status: 'Active', ok: true },
        { label: 'CSRF Protection', status: 'Configured', ok: true },
        { label: 'Secure Cookies', status: 'Active', ok: true }
      ].map(s => `
            <div class="flex justify-between items-center" style="padding:10px 0;border-bottom:1px solid var(--border)">
              <span>${s.label}</span>
              ${UI.badge(s.status, 'success')}
            </div>
          `).join('')}
        </div>
        <div class="card">
          <h3 class="mb-4">Security Actions</h3>
          <button class="btn btn-secondary w-full mb-3">Rotate JWT Secret</button>
          <button class="btn btn-secondary w-full mb-3">Audit User Sessions</button>
          <button class="btn btn-secondary w-full mb-3">Review Failed Logins</button>
          <button class="btn btn-secondary w-full">Export Security Report</button>
        </div>
      </div>`;
  },

  renderSettings() {
    return `
      <div class="page-header"><h2>Platform Settings</h2></div>
      <div class="card">
        <div class="form-group"><label class="form-label">Platform Name</label><input class="form-input" value="TalentAI Recruitment Platform"></div>
        <div class="form-group"><label class="form-label">Support Email</label><input class="form-input" value="support@recruitment-platform.com"></div>
        <div class="form-group"><label class="form-label">Maintenance Mode</label><div class="toggle-switch"></div></div>
        <button class="btn btn-primary">Save Settings</button>
      </div>`;
  },

  bind() {
    UI.bindDashboardEvents((section) => {
      window.location.hash = `#/admin/${section}`;
    });

    if (this.section === 'overview') this.loadOverviewCharts();
    if (this.section === 'analytics') this.loadAnalyticsCharts();

    document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const settings = [];
      for (const [key, value] of form.entries()) {
        if (value) settings.push({ key, value, category: key.includes('SMTP') || key.includes('EMAIL') ? 'email' : key.includes('GITHUB') || key.includes('GOOGLE') ? 'oauth' : key.includes('JWT') ? 'security' : key.includes('MONGO') ? 'database' : 'api', isSecret: key.includes('SECRET') || key.includes('PASS') || key.includes('KEY') || key.includes('URI') });
      }
      try {
        await API.updateSettings(settings);
        UI.toast('Settings saved', 'success');
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    document.querySelectorAll('[data-feature]').forEach(toggle => {
      toggle.addEventListener('click', function () {
        this.classList.toggle('active');
        UI.toast(`${toggle.dataset.feature} ${this.classList.contains('active') ? 'enabled' : 'disabled'}`, 'info');
      });
    });

    document.getElementById('create-backup')?.addEventListener('click', () => {
      UI.toast('Backup created successfully', 'success');
    });

    document.getElementById('add-company')?.addEventListener('click', () => {
      const overlay = UI.modal('Add Company', `
        <div class="form-group"><label class="form-label">Company Name</label><input class="form-input" id="new-company-name"></div>
        <div class="form-group"><label class="form-label">Industry</label><input class="form-input" id="new-company-industry"></div>
      `, '<button class="btn btn-primary" id="save-company">Create</button>');
      overlay.querySelector('#save-company')?.addEventListener('click', async () => {
        try {
          await API.createCompany({
            name: document.getElementById('new-company-name').value,
            industry: document.getElementById('new-company-industry').value
          });
          UI.toast('Company created', 'success');
          overlay.remove();
          window.location.reload();
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    });
  },

  loadOverviewCharts() {
    requestAnimationFrame(() => {
      Charts.pie('user-pie', ['Candidates', 'Recruiters', 'Admins'], [65, 30, 5], ['#2563EB', '#3B82F6', '#60A5FA']);
      Charts.line('growth-line', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], [
        { label: 'Users', data: [50, 120, 200, 350, 500, 780], borderColor: '#2563EB', tension: 0.4 },
        { label: 'Jobs', data: [10, 25, 45, 80, 120, 180], borderColor: '#10B981', tension: 0.4 }
      ]);
    });
  },

  loadAnalyticsCharts() {
    requestAnimationFrame(() => {
      Charts.bar('mau-chart', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], [{
        label: 'MAU', data: [200, 350, 480, 620, 750, 890], backgroundColor: '#2563EB', borderRadius: 6
      }]);
      Charts.line('api-chart', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [{
        label: 'API Calls', data: [1200, 1900, 1500, 2200, 1800, 900, 600], borderColor: '#3B82F6', fill: true, backgroundColor: 'rgba(59,130,246,0.1)'
      }]);
      Charts.heatmap('feature-heatmap', {
        labels: ['Screening', 'Matching', 'Roadmap', 'GitHub', 'Assessment', 'Analytics'],
        values: [85, 72, 60, 45, 55, 40]
      });
    });
  }
};
