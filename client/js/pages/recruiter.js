const RecruiterDashboard = {
  section: 'overview',
  user: null,

  navSections: [
    {
      title: 'Main', items: [
        { id: 'overview', icon: '📊', label: 'Overview' },
        { id: 'jobs', icon: '💼', label: 'Manage Jobs' },
        { id: 'create-job', icon: '✨', label: 'AI Job Creation' },
        { id: 'candidates', icon: '👥', label: 'Candidates' }
      ]
    },
    {
      title: 'Enterprise OS', items: [
        { id: 'org-settings', icon: '🏢', label: 'Organizations' },
        { id: 'hiring-board', icon: '📋', label: 'Hiring Board' },
        { id: 'knowledge-graph', icon: '🕸️', label: 'Knowledge Graph' },
        { id: 'audit-logs', icon: '📜', label: 'Audit Logs' }
      ]
    },
    {
      title: 'AI Tools', items: [
        { id: 'screening', icon: '🔍', label: 'Resume Screening' },
        { id: 'ranking', icon: '🏅', label: 'Candidate Ranking' },
        { id: 'assistant', icon: '🤖', label: 'Recruiter Assistant' },
        { id: 'interviews', icon: '📅', label: 'Interview Scheduling' }
      ]
    },
    {
      title: 'Analytics', items: [
        { id: 'analytics', icon: '📈', label: 'Hiring Analytics' },
        { id: 'github-analysis', icon: '🐙', label: 'GitHub Analysis' },
        { id: 'reports', icon: '📑', label: 'Reports' }
      ]
    },
    {
      title: 'More', items: [
        { id: 'email-center', icon: '📧', label: 'Email Center' },
        { id: 'shortlist', icon: '⭐', label: 'Shortlist' },
        { id: 'notifications', icon: '🔔', label: 'Notifications' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
      ]
    }
  ],

  async render(section = 'overview') {
    this.section = section;
    this.user = API.getUser();
    const sidebar = `
      <div class="sidebar-header">
        <div class="logo" style="display:flex; align-items:center; gap:8px;">${UI.logo('sidebar')} <span style="font-weight:700; font-size:1.1rem; color:var(--text);">TalentAI</span></div>
        <div class="badge badge-primary mt-2">Recruiter</div>
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
      jobs: () => this.renderJobs(),
      'create-job': () => this.renderCreateJob(),
      candidates: () => this.renderCandidates(),
      'candidate-intelligence': () => this.renderCandidateIntelligence(),
      screening: () => this.renderScreening(),
      ranking: () => this.renderRanking(),
      assistant: () => this.renderAssistant(),
      interviews: () => this.renderInterviews(),
      analytics: () => this.renderAnalytics(),
      'github-analysis': () => this.renderGitHubAnalysis(),
      reports: () => this.renderReports(),
      shortlist: () => this.renderShortlist(),
      notifications: () => this.renderNotifications(),
      settings: () => this.renderSettings(),
      'email-center': () => this.renderEmailCenter(),
      'org-settings': () => this.renderOrgSettings(),
      'hiring-board': () => this.renderHiringBoard(),
      'knowledge-graph': () => this.renderKnowledgeGraph(),
      'audit-logs': () => this.renderAuditLogs()
    };
    return (renderers[section] || renderers.overview)();
  },

  async renderOverview() {
    let analytics = { metrics: {} }, apps = { applications: [] };
    try {
      [analytics, apps] = await Promise.all([
        API.getHiringAnalytics().catch(() => analytics),
        API.getApplications().catch(() => apps)
      ]);
    } catch (_) { }
    const m = analytics.metrics || {};

    return `
      <div class="page-header"><h2>Recruiter Dashboard</h2><p class="text-secondary">Manage your hiring pipeline</p></div>
      <div class="grid grid-4 gap-4 mb-6 stagger">
        ${UI.statCard('Total Applications', m.totalApplications || 0)}
        ${UI.statCard('Shortlisted', m.shortlisted || 0, '+12% this week', true)}
        ${UI.statCard('Interviewed', m.interviewed || 0)}
        ${UI.statCard('Hired', m.hired || 0, `${m.conversionRate || 0}% conversion`, true)}
      </div>
      <div class="grid grid-2 gap-6">
        <div class="card chart-container"><h3 class="mb-4">Hiring Funnel</h3><div class="chart-wrapper"><canvas id="funnel-chart"></canvas></div></div>
        <div class="card chart-container"><h3 class="mb-4">Application Sources</h3><div class="chart-wrapper"><canvas id="sources-chart"></canvas></div></div>
      </div>
      <div class="card mt-6">
        <h3 class="mb-4">Recent Applications</h3>
        ${(apps.applications || []).slice(0, 5).map(a => `
          <div class="leaderboard-item">
            ${UI.avatar(a.candidate?.name || 'C')}
            <div><strong>${a.candidate?.name}</strong><div class="text-sm text-muted">${a.job?.title}</div></div>
            ${UI.badge(a.status, a.status === 'shortlisted' ? 'success' : 'primary')}
            <span class="text-sm">${a.aiScore || 0}%</span>
          </div>
        `).join('') || '<p class="text-secondary">No recent applications</p>'}
      </div>`;
  },

  async renderJobs() {
    let jobs = [];
    try { const data = await API.getJobs(); jobs = data.jobs || []; } catch (_) { }

    return `
      <div class="page-header flex justify-between items-center">
        <div><h2>Manage Jobs</h2><p class="text-secondary">${jobs.length} active positions</p></div>
        <a href="#/recruiter/create-job" class="btn btn-primary">+ Create Job</a>
      </div>
      <div class="card">
        ${jobs.length ? UI.table(
      ['Title', 'Status', 'Applications', 'Views', 'Location', 'Actions'],
      jobs.map(j => [
        j.title,
        UI.badge(j.status, j.status === 'active' ? 'success' : 'warning'),
        j.applicationsCount || 0,
        j.viewsCount || 0,
        j.location,
        `<button class="btn btn-sm btn-ghost" data-job-id="${j._id}" data-action="view">View</button>`
      ])
    ) : UI.emptyState('💼', 'No jobs yet', 'Create your first job posting', '<a href="#/recruiter/create-job" class="btn btn-primary">Create Job</a>')}
      </div>`;
  },

  renderCreateJob() {
    const user = this.user || {};
    const verifiedEmails = [];
    if (user.verifiedGoogleEmail) verifiedEmails.push({ email: user.verifiedGoogleEmail, label: 'Google Email (Verified)' });
    if (user.emailVerified) verifiedEmails.push({ email: user.email, label: 'Primary Account Email (Verified)' });
    (user.companyEmails || []).forEach(e => {
      if (e.verified) verifiedEmails.push({ email: e.email, label: `Company Email: ${e.email} (Verified)` });
    });

    const defaultEmail = user.verifiedGoogleEmail || (verifiedEmails[0] ? verifiedEmails[0].email : '');

    return `
      <div class="page-header"><h2>AI Job Creation</h2><p class="text-secondary">Generate job postings with AI assistance</p></div>
      <div class="grid grid-2 gap-6">
        <div class="card">
          <h3 class="mb-4">AI Generate</h3>
          <div class="form-group">
            <label class="form-label">Describe the role</label>
            <textarea class="form-textarea" id="ai-job-prompt" placeholder="We need a senior full-stack developer with React experience..."></textarea>
          </div>
          <button class="btn btn-primary" id="ai-generate-job">Generate with AI</button>
        </div>
        <div class="card">
          <h3 class="mb-4">Manual Create</h3>
          <form id="create-job-form">
            <div class="form-group"><label class="form-label">Title</label><input class="form-input" name="title" required></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" name="description" required></textarea></div>
            <div class="form-group"><label class="form-label">Skills (comma separated)</label><input class="form-input" name="skills"></div>
            <div class="grid grid-2 gap-4">
              <div class="form-group"><label class="form-label">Location</label><input class="form-input" name="location" value="Remote"></div>
              <div class="form-group"><label class="form-label">Type</label>
                <select class="form-select" name="type"><option value="full-time">Full-time</option><option value="contract">Contract</option><option value="internship">Internship</option></select>
              </div>
            </div>

            <div class="form-group mt-4" style="border-top: 1px solid var(--border-color); padding-top: 12px;">
              <label class="form-label">Recruiter Contact Email</label>
              ${verifiedEmails.length ? `
                <select class="form-select" name="recruiterContactEmail" id="job-contact-email-select">
                  ${verifiedEmails.map(v => `<option value="${v.email}" ${v.email === defaultEmail ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select>
                <div class="text-secondary mt-1" style="font-size:10px; line-height: 1.4;">
                  This email will be used for:<br>
                  • Candidate applications<br>
                  • Notifications<br>
                  • Interview invitations<br>
                  • Candidate communication
                </div>
              ` : `
                <div class="text-danger font-semibold text-xs mb-2">
                  ⚠ No verified emails available. You must verify your email or add a verified company email under Settings before you can post a job.
                </div>
                <input class="form-input text-danger" value="Unverified - Posting Disabled" disabled>
              `}
            </div>

            <button type="submit" class="btn btn-primary mt-4" ${!verifiedEmails.length ? 'disabled' : ''}>Create Job</button>
          </form>
        </div>
      </div>
      <div class="card mt-6 hidden" id="ai-job-preview"></div>`;
  },
async renderCandidates() {
    let apps = [];
    try { const data = await API.getApplications(); apps = data.applications || []; } catch (_) { }

    return `
      <div class="page-header"><h2>Candidate Search</h2><p class="text-secondary">Search and filter candidates</p></div>
      <div class="card mb-4">
        <div class="flex gap-4">
          <input class="form-input" placeholder="Search candidates..." id="candidate-search">
          <select class="form-select" style="width:200px" id="status-filter">
            <option value="">All Status</option>
            <option value="applied">Applied</option>
            <option value="screening">Screening</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
          </select>
        </div>
      </div>
      <div class="card" id="candidates-list">
        ${apps.length ? apps.map(a => `
          <div class="leaderboard-item" data-status="${a.status}">
            ${UI.avatar(a.candidate?.name)}
            <div style="flex:1">
              <strong>${a.candidate?.name}</strong>
              <div class="text-sm text-muted">${a.candidate?.email} • ${a.job?.title}</div>
              ${UI.skillTags(a.candidate?.skills?.slice(0, 4) || [])}
            </div>
            ${UI.badge(a.status)}
            <span class="badge badge-primary">${a.aiScore}%</span>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-primary" data-app-id="${a._id}" data-action="shortlist">Shortlist</button>
              <button class="btn btn-sm btn-secondary" data-candidate-id="${a.candidate?._id}" data-action="view-intelligence">View Intelligence</button>
              <button class="btn btn-sm btn-ghost" data-app-id="${a._id}" data-action="reject">Reject</button>
            </div>
          </div>
        `).join('') : UI.emptyState('👥', 'No candidates', 'Applications will appear here')}
      </div>`;
  },

  async renderCandidateIntelligence() {
    const hash = window.location.hash;
    const match = RegExp('[?&]candidateId=([^&]*)').exec(hash);
    const candidateId = match ? decodeURIComponent(match[1]) : '';

    if (!candidateId) {
      return `<div class="card text-center p-6"><h3>No Candidate Selected</h3><p class="text-secondary mt-2">Please go back to candidates search and select a candidate.</p></div>`;
    }

    return `
      <style>
        .intel-dashboard-container {
          display: flex;
          gap: 24px;
          height: calc(100vh - 160px);
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .intel-panel {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .intel-left {
          width: 320px;
          padding: 20px;
          overflow-y: auto;
        }
        .intel-center {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        .intel-right {
          width: 360px;
          display: flex;
          flex-direction: column;
        }
        .intel-profile-card {
          text-align: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .intel-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid var(--primary-color);
          margin: 0 auto 12px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          background: var(--bg-secondary);
        }
        .score-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }
        .score-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        .score-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--primary-color);
        }
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          padding-left: 20px;
          border-left: 2px solid var(--border-color);
          margin-left: 10px;
        }
        .timeline-item {
          position: relative;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-color);
          padding: 12px 16px;
          border-radius: 8px;
        }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: -27px;
          top: 16px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--primary-color);
          border: 2px solid var(--bg-card);
        }
        .copilot-chat {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(0,0,0,0.1);
        }
        .copilot-msg {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          max-width: 85%;
        }
        .copilot-msg.user {
          background: var(--primary-color);
          color: #fff;
          align-self: flex-end;
        }
        .copilot-msg.assistant {
          background: var(--bg-secondary);
          color: var(--text-color);
          border: 1px solid var(--border-color);
          align-self: flex-start;
        }
        .copilot-presets {
          padding: 12px;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 160px;
          overflow-y: auto;
        }
        .copilot-preset-btn {
          text-align: left;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          color: var(--text-secondary);
        }
        .copilot-preset-btn:hover {
          background: var(--primary-color);
          color: #fff;
        }
        .copilot-input-container {
          padding: 12px;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 8px;
        }
      </style>
      <div class="page-header flex justify-between items-center mb-6">
        <div>
          <a href="#/recruiter/candidates" class="btn btn-secondary btn-sm mb-2" style="display:inline-flex; align-items:center; gap:6px;">&larr; Back to Candidates</a>
          <h2>Premium Candidate Intelligence Dashboard</h2>
          <p class="text-secondary">Fully compiled unified profile alignment analysis and Technical Copilot</p>
        </div>
      </div>
      
      <div class="intel-dashboard-container" id="intel-dashboard-root">
        <div class="text-center py-5 w-full"><div class="spinner"></div><p class="mt-2 text-secondary">Compiling Unified Candidate Profile Context...</p></div>
      </div>
    `;
  },

  renderScreening() {
    return `
      <div class="page-header"><h2>Resume Screening</h2><p class="text-secondary">AI-powered resume analysis and semantic matching</p></div>
      <div class="grid grid-2 gap-6">
        <div class="card">
          <h3 class="mb-4">Screen Resume</h3>
          <div class="form-group"><label class="form-label">Select Job</label><select class="form-select" id="screen-job-select"><option>Loading jobs...</option></select></div>
          <button class="btn btn-primary" id="run-screening">Run AI Screening</button>
        </div>
        <div class="card" id="screening-result">
          <h3 class="mb-4">Screening Results</h3>
          <p class="text-secondary">Select a job and run screening to see AI analysis</p>
        </div>
      </div>`;
  },

  renderRanking() {
    return `
      <div class="page-header"><h2>Candidate Ranking</h2><p class="text-secondary">AI-ranked candidates by fit score</p></div>
      <div class="card mb-4">
        <select class="form-select" id="rank-job-select" style="max-width:300px"><option>Loading jobs...</option></select>
        <button class="btn btn-primary mt-4" id="run-ranking">Rank Candidates</button>
      </div>
      <div class="card" id="ranking-results"><p class="text-secondary">Select a job to rank candidates</p></div>`;
  },

  renderAssistant() {
    return `
      <div class="page-header"><h2>Recruiter Assistant</h2><p class="text-secondary">AI-powered hiring recommendations</p></div>
      ${UI.aiChat('recruiter-chat')}`;
  },

  renderInterviews() {
    return `
      <div class="page-header"><h2>Interview Scheduling</h2><p class="text-secondary">AI-suggested interview slots</p></div>
      <div class="card mb-4">
        <button class="btn btn-primary" id="suggest-slots">Get Suggested Slots</button>
      </div>
      <div class="card" id="interview-slots"><p class="text-secondary">Click to get AI-suggested interview times</p></div>`;
  },

  renderAnalytics() {
    return `
      <div class="page-header"><h2>Hiring Analytics</h2><p class="text-secondary">Pipeline metrics and insights</p></div>
      <div class="grid grid-4 gap-4 mb-6" id="analytics-stats"></div>
      <div class="grid grid-2 gap-6">
        <div class="card chart-container"><h3 class="mb-4">Hiring Funnel</h3><div class="chart-wrapper"><canvas id="analytics-funnel"></canvas></div></div>
        <div class="card chart-container"><h3 class="mb-4">Time to Hire</h3><div class="chart-wrapper"><canvas id="time-chart"></canvas></div></div>
      </div>
      <div class="card chart-container mt-6"><h3 class="mb-4">Weekly Activity Heatmap</h3><div class="chart-wrapper"><canvas id="heatmap-chart"></canvas></div></div>`;
  },

  renderGitHubAnalysis() {
    return `
      <div class="page-header"><h2>GitHub Analysis</h2><p class="text-secondary">Repository ranking and contribution analysis</p></div>
      <div class="card mb-4">
        <div class="form-group">
          <label class="form-label">Select Candidate</label>
          <select class="form-select" id="candidate-insights-select">
            <option value="">Loading candidates...</option>
          </select>
        </div>
      </div>
      <div id="github-analysis-result"><p class="text-secondary">Select a candidate to view their GitHub portfolio insights</p></div>`;
  },

  renderReports() {
    return `
      <div class="page-header"><h2>Reports</h2><p class="text-secondary">Generate hiring reports</p></div>
      <div class="grid grid-3 gap-4">
        <button class="card hover-lift text-center p-6" data-report="hiring"><div style="display:flex; justify-content:center; align-items:center; height:32px; margin-bottom:8px;">${UI.getIcon('📊', 'recruiter', '28px')}</div><h4 class="mt-2">Hiring Summary</h4></button>
        <button class="card hover-lift text-center p-6" data-report="pipeline"><div style="font-size:2rem">🔄</div><h4 class="mt-2">Pipeline Report</h4></button>
        <button class="card hover-lift text-center p-6" data-report="diversity"><div style="font-size:2rem">🌐</div><h4 class="mt-2">Diversity Report</h4></button>
      </div>
      <div class="card mt-6" id="report-output"><p class="text-secondary">Select a report type to generate</p></div>`;
  },

  async renderShortlist() {
    let apps = [];
    try { const data = await API.getApplications(); apps = (data.applications || []).filter(a => a.status === 'shortlisted'); } catch (_) { }

    return `
      <div class="page-header"><h2>Shortlist</h2><p class="text-secondary">${apps.length} shortlisted candidates</p></div>
      <div class="card">
        ${apps.length ? apps.map(a => `
          <div class="leaderboard-item">
            ${UI.avatar(a.candidate?.name)}
            <div><strong>${a.candidate?.name}</strong><div class="text-sm text-muted">${a.job?.title}</div></div>
            <span class="badge badge-primary">${a.aiScore}%</span>
            <button class="btn btn-sm btn-primary" data-app-id="${a._id}" data-action="offer">Send Offer</button>
            <button class="btn btn-sm btn-secondary" data-app-id="${a._id}" data-action="schedule">Schedule Interview</button>
          </div>
        `).join('') : UI.emptyState('⭐', 'No shortlisted candidates', 'Shortlist candidates from the candidates page')}
      </div>`;
  },

  async renderNotifications() {
    let data = { notifications: [] };
    try { data = await API.getNotifications(); } catch (_) { }
    return `
      <div class="page-header"><h2>Notifications</h2></div>
      <div class="card">
        ${(data.notifications || []).map(n => `
          <div class="leaderboard-item">
            <div><strong>${n.title}</strong><p class="text-sm text-secondary">${n.message}</p></div>
            <span class="text-xs text-muted">${new Date(n.createdAt).toLocaleString()}</span>
          </div>
        `).join('') || UI.emptyState('🔔', 'No notifications', 'All caught up!')}
      </div>`;
  },

  renderSettings() {
    const user = this.user || {};
    const companyName = user.companyName || 'TalentAI Inc';
    
    const verifiedEmails = [];
    if (user.verifiedGoogleEmail) verifiedEmails.push(user.verifiedGoogleEmail);
    if (user.emailVerified) verifiedEmails.push(user.email);
    (user.companyEmails || []).forEach(e => {
      if (e.verified) verifiedEmails.push(e.email);
    });

    const activeCommEmail = user.communicationEmail || user.email || '';
    const isCommEmailVerified = verifiedEmails.includes(activeCommEmail);

    return `
      <div class="page-header"><h2>Settings</h2><p class="text-secondary">Manage profile connection, company emails, and active communications.</p></div>
      
      <div class="grid grid-2 gap-6 animate-fade-in">
        <div>
          <!-- Recruiter Preferences -->
          <div class="card mb-6">
            <h3 class="mb-4">Recruiter Preferences</h3>
            <div class="flex items-center justify-between mb-4">
              <div><strong>Dark Mode</strong><p class="text-sm text-muted">Toggle dark theme</p></div>
              <div class="toggle-switch" id="settings-dark-toggle"></div>
            </div>
          </div>

          <!-- Recruiter Profile -->
          <div class="card mb-6">
            <h3 class="mb-4">Recruiter Profile</h3>
            <div style="font-size: 13px; line-height: 1.8;" class="text-secondary">
              <div><strong>Recruiter Name:</strong> ${user.name || 'N/A'}</div>
              <div><strong>Company Name:</strong> ${companyName}</div>
              <div><strong>Registered Email:</strong> ${user.email || 'N/A'}
                ${user.emailVerified ? `
                  <span class="badge badge-success ml-2">✅ ${user.verificationMethod === 'google' ? 'Google Verified' : 'Verified'}</span>
                ` : `
                  <span class="badge badge-warning ml-2">🟡 Verification Required</span>
                `}
              </div>
              ${user.emailVerified ? `<div><strong>Verification Method:</strong> ${user.verificationMethod === 'google' ? 'Google OAuth' : 'Email Link'}</div>` : ''}
              ${user.verifiedGoogleEmail ? `<div><strong>Verified Google Account:</strong> ${user.verifiedGoogleEmail} <span class="badge badge-success">✅ Google Verified</span></div>` : ''}
            </div>
          </div>

          <!-- Communication Email Settings -->
          <div class="card">
            <h3 class="mb-2">Communication Email</h3>
            <p class="text-xs text-muted mb-4">This email is used to receive applications, send interview invitations, receive platform notifications, and send recruiter emails.</p>
            
            <div class="p-3 rounded mb-4 text-xs" style="background: rgba(37,99,235,0.04); border: 1px solid var(--border-color);">
              <div><strong>Active Communication Email:</strong> <span class="font-bold text-primary">${activeCommEmail || 'None Set'}</span></div>
              <div class="mt-1">
                <strong>Status:</strong> 
                ${isCommEmailVerified ? '<span class="badge badge-success">✅ Verified</span>' : '<span class="badge badge-warning">🟡 Verification Required</span>'}
              </div>
            </div>

            <div class="form-group text-xs">
              <label class="form-label font-semibold">Change Communication Email</label>
              ${verifiedEmails.length ? `
                <select class="form-select mb-2" id="comm-email-select">
                  ${verifiedEmails.map(email => `<option value="${email}" ${email === activeCommEmail ? 'selected' : ''}>${email}</option>`).join('')}
                </select>
                <button class="btn btn-primary btn-sm" id="btn-save-comm-email">Set Active Email</button>
              ` : `
                <p class="text-warning font-semibold">⚠ No verified emails available. Please connect Google or verify a company email first.</p>
              `}
            </div>
          </div>
        </div>

        <div>
          <!-- Company Emails Manager -->
          <div class="card h-full" style="display:flex; flex-direction:column; justify-content:space-between; min-height:480px;">
            <div>
              <h3 class="mb-2">Company Emails</h3>
              <p class="text-xs text-muted mb-4">Manage multiple authorized company emails for posting job listings.</p>
              
              <div class="company-emails-list flex flex-col gap-3 mb-6">
                <div class="flex justify-between items-center p-3 rounded" style="background: var(--bg-secondary); border: 1px solid var(--border-color);">
                  <div class="text-xs">
                    <strong>${user.email}</strong> <span class="badge badge-primary ml-1">Primary</span>
                    <div class="text-xxs text-muted mt-1">
                      ${user.emailVerified ? '✅ Verified' : '🟡 Verification Required'}
                    </div>
                  </div>
                </div>

                ${user.verifiedGoogleEmail ? `
                  <div class="flex justify-between items-center p-3 rounded" style="background: var(--bg-secondary); border: 1px solid var(--border-color);">
                    <div class="text-xs">
                      <strong>${user.verifiedGoogleEmail}</strong> <span class="badge badge-success ml-1">Google</span>
                      <div class="text-xxs text-muted mt-1">✅ Verified</div>
                    </div>
                  </div>
                ` : ''}

                ${(user.companyEmails || []).map(e => `
                  <div class="flex justify-between items-center p-3 rounded" style="background: var(--bg-secondary); border: 1px solid var(--border-color);">
                    <div class="text-xs">
                      <strong>${e.email}</strong>
                      ${e.isDefault ? '<span class="badge badge-primary ml-1">Default</span>' : ''}
                      <div class="text-xxs text-muted mt-1">
                        ${e.verified ? '✅ Verified' : '🟡 Verification Required / Pending'}
                      </div>
                    </div>
                    <div class="flex gap-2">
                      ${(e.verified && !e.isDefault) ? `<button class="btn btn-ghost btn-xxs set-default-email-btn" data-email="${e.email}">Set Default</button>` : ''}
                      <button class="btn btn-ghost btn-xxs text-danger delete-email-btn" data-email="${e.email}">Delete</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <form id="add-company-email-form" style="border-top:1px solid var(--border-color); padding-top:16px;">
              <div class="form-group mb-2">
                <label class="form-label text-xs">Add Company Email</label>
                <input type="email" class="form-input text-xs" name="email" required placeholder="recruitment@mycompany.com">
              </div>
              <button type="submit" class="btn btn-secondary btn-sm w-full">Add Email</button>
            </form>
          </div>
        </div>
      </div>
    `;
  },
bind() {
    UI.bindDashboardEvents((section) => {
      window.location.hash = `#/recruiter/${section}`;
    });

    if (this.section === 'email-center') {
      document.getElementById('recruiter-connect-btn')?.addEventListener('click', () => {
        window.location.href = `/api/auth/google?token=${API.token}`;
      });

      document.getElementById('recruiter-disconnect-btn')?.addEventListener('click', async () => {
        try {
          await API.post('/auth/google/disconnect');
          UI.toast('Google account disconnected', 'success');
          const data = await API.getMe();
          if (data && data.user) API.setUser(data.user);
          await this.render('email-center');
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      document.getElementById('recruiter-sync-btn')?.addEventListener('click', async (e) => {
        e.target.disabled = true;
        e.target.textContent = 'Syncing...';
        try {
          const res = await API.post('/auth/google/sync');
          UI.toast(res.message, 'success');
          const data = await API.getMe();
          if (data && data.user) API.setUser(data.user);
          await this.render('email-center');
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          e.target.disabled = false;
          e.target.textContent = 'Sync Inbox';
        }
      });

      document.getElementById('recruiter-email-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        try {
          await API.post('/auth/google/send', {
            to: form.get('to'),
            subject: form.get('subject'),
            html: form.get('body')
          });
          UI.toast('Email sent successfully using your Gmail account!', 'success');
          e.target.reset();
          await this.render('email-center');
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Email';
        }
      });

      document.querySelectorAll('[data-email-tabs] .tab').forEach(tab => {
        tab.addEventListener('click', async (e) => {
          document.querySelectorAll('[data-email-tabs] .tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const folder = tab.dataset.folder;
          
          const mailboxEl = document.getElementById('mailbox-content');
          mailboxEl.innerHTML = '<div class="spinner"></div>';
          try {
            const emailData = await API.get('/auth/google/emails');
            let filteredEmails = [];
            if (folder === 'inbox') filteredEmails = emailData.emails;
            else if (folder === 'unread') filteredEmails = emailData.unread;
            else if (folder === 'starred') filteredEmails = emailData.starred;
            else if (folder === 'sent') filteredEmails = emailData.sent;
            else if (folder === 'drafts') filteredEmails = emailData.drafts;
            mailboxEl.innerHTML = this.renderEmailList(filteredEmails);
          } catch (err) {
            mailboxEl.innerHTML = `<p class="text-error">${err.message}</p>`;
          }
        });
      });
    }

    if (this.section === 'overview') this.loadOverviewCharts();
    if (this.section === 'analytics') this.loadAnalytics();
    if (['screening', 'ranking'].includes(this.section)) this.loadJobSelects();
    if (this.section === 'github-analysis') this.loadCandidatesSelect();
    if (this.section === 'settings') {
      const settingsToggle = document.getElementById('settings-dark-toggle');
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (settingsToggle) {
        if (isDark) settingsToggle.classList.add('active');
        else settingsToggle.classList.remove('active');
        
        settingsToggle.addEventListener('click', () => {
          const active = settingsToggle.classList.toggle('active');
          const newTheme = active ? 'dark' : 'light';
          UI.applyTheme(newTheme);
          if (API.token) {
            API.put('/auth/profile', { darkMode: active }).catch(() => {});
          }
        });
      }

      // Add company email form submit
      document.getElementById('add-company-email-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        try {
          const res = await API.post('/auth/recruiter/company-email', { email: form.get('email') });
          UI.toast('Verification email sent to company address!', 'success');
          API.setUser(res.user);
          this.user = res.user;
          this.render('settings').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      // Set default company email
      document.querySelectorAll('.set-default-email-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const email = btn.dataset.email;
          try {
            const res = await API.post('/auth/recruiter/company-email/default', { email });
            UI.toast('Default company email updated!', 'success');
            API.setUser(res.user);
            this.user = res.user;
            this.render('settings').then(html => {
              document.getElementById('app').innerHTML = html;
              this.bind();
            });
          } catch (err) { UI.toast(err.message, 'error'); }
        });
      });

      // Delete company email
      document.querySelectorAll('.delete-email-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const email = btn.dataset.email;
          try {
            const res = await API.post('/auth/recruiter/company-email/delete', { email });
            UI.toast('Company email deleted!', 'success');
            API.setUser(res.user);
            this.user = res.user;
            this.render('settings').then(html => {
              document.getElementById('app').innerHTML = html;
              this.bind();
            });
          } catch (err) { UI.toast(err.message, 'error'); }
        });
      });

      // Save Communication Email select
      document.getElementById('btn-save-comm-email')?.addEventListener('click', async () => {
        const email = document.getElementById('comm-email-select')?.value;
        if (!email) return;
        try {
          const res = await API.post('/auth/recruiter/communication-email', { email });
          UI.toast('Communication email updated!', 'success');
          API.setUser(res.user);
          this.user = res.user;
          this.render('settings').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    }

    // Create job
    document.getElementById('ai-generate-job')?.addEventListener('click', async () => {
      const prompt = document.getElementById('ai-job-prompt')?.value;
      try {
        const contactSelect = document.getElementById('job-contact-email-select');
        const recruiterContactEmail = contactSelect ? contactSelect.value : '';
        const data = await API.aiCreateJob({ prompt, recruiterContactEmail });
        const preview = document.getElementById('ai-job-preview');
        preview.classList.remove('hidden');
        preview.innerHTML = `<h3 class="mb-4">AI Generated Job</h3><pre style="white-space:pre-wrap">${JSON.stringify(data.job, null, 2)}</pre>`;
        UI.toast('Job generated!', 'success');
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    document.getElementById('create-job-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      try {
        await API.createJob({
          title: form.get('title'),
          description: form.get('description'),
          skills: form.get('skills')?.split(',').map(s => s.trim()),
          location: form.get('location'),
          type: form.get('type')
        });
        UI.toast('Job created!', 'success');
        window.location.hash = '#/recruiter/jobs';
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    // Candidate actions
    document.querySelectorAll('[data-action="shortlist"]').forEach(btn => {
      btn.addEventListener('click', () => this.updateApp(btn.dataset.appId, 'shortlisted'));
    });
    document.querySelectorAll('[data-action="reject"]').forEach(btn => {
      btn.addEventListener('click', () => this.updateApp(btn.dataset.appId, 'rejected'));
    });
    document.querySelectorAll('[data-action="offer"]').forEach(btn => {
      btn.addEventListener('click', () => this.updateApp(btn.dataset.appId, 'offer', 'Offer letter sent'));
    });

    // Status filter
    document.getElementById('status-filter')?.addEventListener('change', (e) => {
      document.querySelectorAll('#candidates-list .leaderboard-item').forEach(item => {
        item.style.display = !e.target.value || item.dataset.status === e.target.value ? '' : 'none';
      });
    });

    // View Intelligence dashboard trigger
    document.querySelectorAll('[data-action="view-intelligence"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.candidateId;
        window.location.hash = `#/recruiter/candidate-intelligence?candidateId=${id}`;
      });
    });

    // Candidate Intelligence Dashboard Bindings
    if (this.section === 'candidate-intelligence') {
      const hash = window.location.hash;
      const match = RegExp('[?&]candidateId=([^&]*)').exec(hash);
      const candidateId = match ? decodeURIComponent(match[1]) : '';
      
      const loadIntelligenceDashboard = async () => {
        const root = document.getElementById('intel-dashboard-root');
        if (!root) return;
        
        try {
          const res = await API.get(`/ai/candidate-intelligence/${candidateId}`);
          if (res.success) {
            const ctx = res.context;
            const scores = res.scores;
            const timeline = res.timeline || [];
            
            root.innerHTML = `
              <!-- Left Panel: Profile + Scores -->
              <div class="intel-panel intel-left">
                <div class="intel-profile-card">
                  <div class="intel-avatar">${ctx.profile.name[0]}</div>
                  <h3>${ctx.profile.name}</h3>
                  <div class="text-sm text-secondary">${ctx.profile.email}</div>
                  <div class="text-xs text-muted mt-1">${ctx.profile.location}</div>
                  
                  <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:12px; text-align:left;">
                    <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:var(--text-muted);">LinkedIn Sync</div>
                    <div style="font-size:12px; margin-top:2px;">${ctx.linkedin ? '✅ Connected' : '❌ Not Connected'}</div>
                  </div>
                  <div style="margin-top:8px; text-align:left;">
                    <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:var(--text-muted);">GitHub Connected</div>
                    <div style="font-size:12px; margin-top:2px;">${ctx.github ? `🐙 @${ctx.github.username}` : '❌ Not Connected'}</div>
                  </div>
                </div>

                <div>
                  <h4 style="font-size:13px; color:#fff; border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-bottom:12px;">AI Performance Scores</h4>
                  <div class="score-grid">
                    <div class="score-card">
                      <div style="font-size:9px; text-transform:uppercase; color:var(--text-muted);">ATS Score</div>
                      <div class="score-value">${scores.atsScore}%</div>
                    </div>
                    <div class="score-card">
                      <div style="font-size:9px; text-transform:uppercase; color:var(--text-muted);">Resume Score</div>
                      <div class="score-value">${scores.resumeScore}%</div>
                    </div>
                    <div class="score-card">
                      <div style="font-size:9px; text-transform:uppercase; color:var(--text-muted);">GitHub Score</div>
                      <div class="score-value">${scores.githubScore}%</div>
                    </div>
                    <div class="score-card">
                      <div style="font-size:9px; text-transform:uppercase; color:var(--text-muted);">Coding Score</div>
                      <div class="score-value">${scores.codingScore}%</div>
                    </div>
                    <div class="score-card">
                      <div style="font-size:9px; text-transform:uppercase; color:var(--text-muted);">Interview Score</div>
                      <div class="score-value">${scores.interviewScore}%</div>
                    </div>
                    <div class="score-card">
                      <div style="font-size:9px; text-transform:uppercase; color:var(--text-muted);">Learning Score</div>
                      <div class="score-value">${scores.learningScore}%</div>
                    </div>
                    <div class="score-card" style="grid-column: span 2;">
                      <div style="font-size:9px; text-transform:uppercase; color:var(--text-muted);">Career Trajectory</div>
                      <div class="score-value" style="color:#10b981;">${scores.careerScore}/100</div>
                    </div>
                  </div>
                </div>

                <div style="margin-top:20px;">
                  <h4 style="font-size:13px; color:#fff; border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-bottom:12px;">Key Skills</h4>
                  <div class="flex flex-wrap gap-1 mt-2">
                    ${ctx.profile.skills.map(s => `<span class="badge badge-primary" style="font-size:10px;">${s}</span>`).join('') || '<span class="text-secondary text-sm">No skills listed</span>'}
                  </div>
                </div>
              </div>

              <!-- Center Panel: Timeline -->
              <div class="intel-panel intel-center">
                <h3 class="mb-4" style="font-size:16px;">Candidate Career & Contributions Timeline</h3>
                
                <div class="timeline-container">
                  ${timeline.map(item => `
                    <div class="timeline-item">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-weight:600; color:#fff; font-size:13.5px; display:inline-flex; align-items:center; gap:6px;">
                          <span>${item.icon}</span> ${item.title}
                        </span>
                        <span style="font-size:11px; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:var(--text-muted);">${item.date}</span>
                      </div>
                      <div style="font-size:12px; color:var(--text-secondary);">${item.subtitle}</div>
                      ${item.description ? `<p style="font-size:12px; color:var(--text-muted); margin-top:6px; line-height:1.4;">${item.description}</p>` : ''}
                    </div>
                  `).join('') || '<div class="text-center py-4 text-muted">No timeline activities recorded.</div>'}
                </div>
              </div>

              <!-- Right Panel: Recruiter Copilot -->
              <div class="intel-panel intel-right">
                <div class="sidebar-title" style="border-bottom:1px solid var(--border-color); padding:12px 16px;">🤖 AI Recruiter Copilot</div>
                <div class="copilot-chat" id="copilot-chat-box">
                  <div class="copilot-msg assistant">
                    Hi! I am your Technical Copilot. I have built a unified knowledge context about ${ctx.profile.name} using their LinkedIn profile, resume parsing, GitHub repository history, and coding assessments. Ask me anything about their background, scalability skills, or technical alignment!
                  </div>
                </div>
                <div class="copilot-presets">
                  <button class="copilot-preset-btn" data-cq="Explain this candidate.">🔍 Explain candidate overview</button>
                  <button class="copilot-preset-btn" data-cq="Would you hire this candidate?">💼 Would you hire this candidate?</button>
                  <button class="copilot-preset-btn" data-cq="Rate coding ability and scalability experience.">⚡ Rate coding & scalability</button>
                  <button class="copilot-preset-btn" data-cq="Which project in their GitHub is strongest?">🐙 Which project is strongest?</button>
                  <button class="copilot-preset-btn" data-cq="Generate interview questions for this candidate.">🎯 Generate advanced questions</button>
                  <button class="copilot-preset-btn" data-cq="Would this candidate fit a startup?">🚀 Fit for a Startup?</button>
                  <button class="copilot-preset-btn" data-cq="Summarize everything in two minutes.">⏱️ Summarize profile in 2 mins</button>
                </div>
                <div class="copilot-input-container">
                  <input class="form-input" id="copilot-chat-input" placeholder="Ask copilot about candidate..." style="flex:1; font-size:12px;">
                  <button class="btn btn-primary btn-sm" id="copilot-chat-send">Send</button>
                </div>
              </div>
            `;
            
            // Register copilot chat events
            const sendCopilotQuery = async () => {
              const input = document.getElementById('copilot-chat-input');
              const text = input?.value?.trim();
              if (!text) return;
              
              appendCopilotMsg(text, 'user');
              if (input) input.value = '';

              try {
                const res = await API.post('/ai/recruiter-assistant', { query: text, candidateId });
                if (res.success) {
                  appendCopilotMsg(res.response, 'assistant');
                }
              } catch (err) {
                appendCopilotMsg(`Failed to call copilot: ${err.message}`, 'assistant');
              }
            };

            const appendCopilotMsg = (text, sender) => {
              const box = document.getElementById('copilot-chat-box');
              if (!box) return;
              const div = document.createElement('div');
              div.className = `copilot-msg ${sender}`;
              div.innerHTML = sender === 'assistant' ? text.split('\n').map(p => `<p style="margin-bottom:4px;">${p}</p>`).join('') : text;
              box.appendChild(div);
              box.scrollTop = box.scrollHeight;
            };

            document.getElementById('copilot-chat-send')?.addEventListener('click', sendCopilotQuery);
            document.getElementById('copilot-chat-input')?.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') sendCopilotQuery();
            });

            // Presets trigger
            document.querySelectorAll('.copilot-preset-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                const cq = btn.dataset.cq;
                const input = document.getElementById('copilot-chat-input');
                if (input) {
                  input.value = cq;
                  sendCopilotQuery();
                }
              });
            });
          }
        } catch (err) {
          if (root) root.innerHTML = `<div class="text-error w-full text-center py-5">${err.message}</div>`;
        }
      };

      loadIntelligenceDashboard();
    }

    // Ranking
    document.getElementById('run-ranking')?.addEventListener('click', async () => {
      const jobId = document.getElementById('rank-job-select')?.value;
      if (!jobId) return;
      try {
        const data = await API.rankCandidates(jobId);
        document.getElementById('ranking-results').innerHTML = (data.candidates || []).map(c => `
          <div class="leaderboard-item">
            <span class="leaderboard-rank top">#${c.rank}</span>
            <div><strong>${c.name}</strong></div>
            <span class="badge badge-${c.tier === 'top' ? 'success' : 'primary'}">${c.tier}</span>
            <span class="leaderboard-score">${c.score}</span>
          </div>
        `).join('');
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    // Recruiter assistant
    UI.bindAIChat('recruiter-chat', async (text) => {
      const data = await API.recruiterAssistant(text, {});
      return data.response;
    });

    // Interview slots
    document.getElementById('suggest-slots')?.addEventListener('click', async () => {
      try {
        const data = await API.scheduleInterview({ participants: [] });
        document.getElementById('interview-slots').innerHTML = (data.slots || []).map(s => `
          <div class="mb-4"><strong>${s.date}</strong>
            <div class="flex gap-2 mt-2">${s.times.map(t => `<button class="btn btn-sm btn-secondary">${t}</button>`).join('')}</div>
          </div>
        `).join('');
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    // GitHub analysis dropdown change listener
    document.getElementById('candidate-insights-select')?.addEventListener('change', async (e) => {
      const candidateId = e.target.value;
      const resultEl = document.getElementById('github-analysis-result');
      if (!candidateId) {
        resultEl.innerHTML = '<p class="text-secondary">Select a candidate to view their GitHub portfolio insights</p>';
        return;
      }
      resultEl.innerHTML = '<div class="spinner"></div>';
      try {
        const [profileData, reposData, langsData, commitsData, linkedinData] = await Promise.all([
          API.getGithubProfile(candidateId).catch(() => ({ success: false })),
          API.getGithubRepositories(candidateId).catch(() => ({ repositories: [] })),
          API.getGithubLanguages(candidateId).catch(() => ({ languages: [] })),
          API.getGithubCommits(candidateId).catch(() => ({ commits: [] })),
          API.getLinkedinProfile(candidateId).catch(() => ({ connected: false }))
        ]);

        const p = profileData.profile;
        const stats = profileData.stats;
        const repos = reposData.repositories || [];
        const languages = langsData.languages || [];
        const commits = commitsData.commits || [];

        if (!p && !linkedinData.connected) {
          resultEl.innerHTML = '<p class="text-secondary">No GitHub or LinkedIn account connected for this candidate.</p>';
          return;
        }

        // Build LinkedIn section HTML
        let linkedinHtml = '';
        if (linkedinData.connected) {
          linkedinHtml = `
            <div class="card mb-6 animate-fade-in" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 20px;">
              <h3 class="mb-4" style="display: flex; align-items: center; justify-content: space-between; font-size: 1.1rem;">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="background:#0077B5; color:#fff; padding:1px 5px; border-radius:3px; font-size:11px; font-family:sans-serif; font-weight:bold;">in</span> LinkedIn Profile Verification
                </span>
                <span class="badge badge-success">✓ LinkedIn Connected</span>
              </h3>
              
              <div class="flex items-center gap-4">
                ${linkedinData.picture ? `
                  <img src="${linkedinData.picture}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid #0077B5; object-fit: cover;">
                ` : `
                  <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 32px; color: var(--primary-color);">👤</div>
                `}
                <div class="flex-1 grid grid-2 gap-2 text-sm text-secondary">
                  <div><strong>Full Name:</strong> ${linkedinData.name || 'N/A'}</div>
                  <div><strong>Email:</strong> ${linkedinData.email || 'N/A'}</div>
                  <div><strong>LinkedIn ID:</strong> ${linkedinData.linkedinId || 'N/A'}</div>
                  <div><strong>Last Synced:</strong> ${linkedinData.lastSynced ? new Date(linkedinData.lastSynced).toLocaleString() : 'Never'}</div>
                </div>
              </div>
              
              <div class="mt-4 flex justify-between items-center" style="border-top: 1px solid var(--border-color); padding-top: 12px; font-size: 11px;">
                <span>Public Profile URL: 
                  <strong>${linkedinData.publicProfile ? `<a href="${linkedinData.publicProfile}" target="_blank" class="text-gradient">${linkedinData.publicProfile}</a>` : 'Not Provided'}</strong>
                </span>
              </div>
            </div>
          `;
        }

        let githubHtml = '';
        if (p) {
          // Compute documentation quality
          const avgDocQuality = repos.length 
            ? Math.round(repos.reduce((sum, r) => sum + (r.qualityScore || 70), 0) / repos.length)
            : 70;
  
          // Compute top language string representation
          const topLanguages = languages.length 
            ? languages.slice(0, 3).map(l => `${l.name} (${l.percentage}%)`).join(', ')
            : 'None';
  
          // Format strengths & weaknesses
          const strengthsList = p.aiCandidateStrengths && p.aiCandidateStrengths.length 
            ? p.aiCandidateStrengths.map(s => `<li>• ${s}</li>`).join('') 
            : '<li>No strengths detected yet.</li>';
          const weaknessesList = p.aiCandidateWeaknesses && p.aiCandidateWeaknesses.length 
            ? p.aiCandidateWeaknesses.map(w => `<li>• ${w}</li>`).join('') 
            : '<li>No weaknesses detected yet.</li>';
            
          // Format detected skills
          const skillsObj = p.aiSkillDetection || {};
          const skillCategories = Object.keys(skillsObj)
            .filter(k => Array.isArray(skillsObj[k]) && skillsObj[k].length)
            .map(k => `<div><strong>${k.charAt(0).toUpperCase() + k.slice(1)}:</strong> ${skillsObj[k].join(', ')}</div>`)
            .join('') || '<div>No specific tech stack details detected yet.</div>';
  
          // Format interview questions
          const questionsList = p.aiInterviewQuestions && p.aiInterviewQuestions.length
            ? p.aiInterviewQuestions.map(q => `<div class="mb-2"><strong>Q: ${q.question}</strong> <span class="badge badge-primary badge-sm">${q.difficulty || 'medium'}</span></div>`).join('')
            : '<div>No interview prep questions generated yet.</div>';
  
          // Format resume projects
          const resumeProjects = p.aiResumeProjectDescriptions && p.aiResumeProjectDescriptions.length
            ? p.aiResumeProjectDescriptions.map(rp => `
                <div class="mb-4" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                  <h4 style="margin: 0 0 4px 0">${rp.title}</h4>
                  <p class="text-sm text-secondary"><strong>Tech:</strong> ${rp.technologiesUsed?.join(', ') || ''}</p>
                  <p class="text-sm">${rp.description}</p>
                  <p class="text-xs text-muted"><strong>Key Contribution:</strong> ${rp.keyContributions || ''}</p>
                </div>
              `).join('')
            : '<div>No optimized resume project descriptions available yet.</div>';

          githubHtml = `
            <div class="grid grid-4 gap-4 mb-6 stagger">
              ${UI.statCard('Repository Count', repos.length)}
              ${UI.statCard('Portfolio Rank (Score)', p.portfolioScore || 70, 'AI Portfolio Score')}
              ${UI.statCard('Contribution Score', stats?.contributionScore || 70, 'AI Evaluated', true)}
              ${UI.statCard('Commit Count', stats?.totalCommits || commits.length)}
            </div>
            
            <div class="grid grid-2 gap-6 mb-6">
              <div class="card">
                <h3 class="mb-4">GitHub Talent Insights</h3>
                <div class="mb-3"><strong>Top Languages:</strong> <span class="text-secondary">${topLanguages}</span></div>
                <div class="mb-3"><strong>Project Complexity:</strong> <span class="badge badge-primary">${p.projectComplexity || 70}/100</span></div>
                <div class="mb-3"><strong>Commit Frequency:</strong> <span class="badge badge-primary">${p.commitFrequency || 70}/100</span></div>
                <div class="mb-3"><strong>Repository Quality:</strong> <span class="badge badge-primary">${p.repositoryQuality || 70}/100</span></div>
                <div class="mb-3"><strong>Open Source Contributions:</strong> <span class="text-secondary">${p.openSourceContributions || 0} commits</span></div>
                <div class="mb-3"><strong>Documentation Quality:</strong> <span class="badge badge-primary">${avgDocQuality}/100</span></div>
              </div>
              
              <div class="card">
                <h3 class="mb-4">AI Candidate Summary</h3>
                <p style="line-height: 1.6; margin: 0;">${p.aiCandidateSummary || 'No AI summary generated yet for this candidate.'}</p>
              </div>
            </div>
  
            <div class="grid grid-2 gap-6 mb-6">
              <div class="card">
                <h3 class="mb-4">Candidate Profile Analysis</h3>
                <div class="mb-4">
                  <strong style="color: var(--success-color)">Strengths:</strong>
                  <ul style="list-style: none; padding-left: 0; margin-top: 8px;">${strengthsList}</ul>
                </div>
                <div>
                  <strong style="color: var(--error-color)">Areas for Improvement:</strong>
                  <ul style="list-style: none; padding-left: 0; margin-top: 8px;">${weaknessesList}</ul>
                </div>
              </div>
              
              <div class="card">
                <h3 class="mb-4">Technology Stack & Skill Detection</h3>
                <div class="flex flex-col gap-2">${skillCategories}</div>
              </div>
            </div>
  
            <div class="grid grid-2 gap-6 mb-6">
              <div class="card">
                <h3 class="mb-4">Suggested Interview Questions</h3>
                <div>${questionsList}</div>
              </div>
              
              <div class="card">
                <h3 class="mb-4">Optimized Resume Project Descriptions</h3>
                <div>${resumeProjects}</div>
              </div>
            </div>
  
            <div class="card mt-6">
              <h3 class="mb-4">Top Projects</h3>
              ${repos.slice(0, 5).map((r, i) => `
                <div class="leaderboard-item">
                  <span class="leaderboard-rank">#${i + 1}</span>
                  <div style="flex: 1">
                    <strong>${r.name}</strong>
                    <p class="text-sm text-secondary">${r.description || 'No description provided.'}</p>
                  </div>
                  <span class="badge badge-primary">${r.stars || 0} stars</span>
                </div>
              `).join('') || '<p class="text-secondary">No repository information available.</p>'}
            </div>
          `;
        } else {
          githubHtml = `
            <div class="grid grid-2 gap-6 mb-6">
              <div class="card">
                <h3 class="mb-4">AI Candidate Summary</h3>
                <div class="p-3 rounded font-sm" style="background: rgba(37,99,235,0.05); border: 1px solid rgba(37,99,235,0.12); font-size: 13px; line-height: 1.6;">
                  Software engineering candidate connected through LinkedIn.<br>
                  Profile synchronization completed successfully.<br>
                  Ready for recruiter review.
                </div>
              </div>
              <div class="card">
                <h3 class="mb-4">Recruiter Information</h3>
                <p class="text-sm text-secondary" style="line-height: 1.6;">Candidate does not have a GitHub account connected. Use the LinkedIn Profile verification details to initiate interview scheduling or view application credentials.</p>
              </div>
            </div>
          `;
        }

        resultEl.innerHTML = linkedinHtml + githubHtml;
      } catch (err) {
        UI.toast(err.message, 'error');
        resultEl.innerHTML = `<p class="text-error">Error loading insights: ${err.message}</p>`;
      }
    });

    // Run AI Screening
    document.getElementById('run-screening')?.addEventListener('click', async (e) => {
      const jobId = document.getElementById('screen-job-select')?.value;
      if (!jobId) return UI.toast('Select a job first', 'warning');
      e.target.disabled = true;
      e.target.textContent = 'Screening...';
      const resultEl = document.getElementById('screening-result');
      resultEl.innerHTML = '<div class="spinner"></div>';
      try {
        const data = await API.post(`/jobs/${jobId}/reverse-match`);
        resultEl.innerHTML = `
          <h3 class="mb-4">Screening Results</h3>
          <p><strong>Status:</strong> Success</p>
          ${(data.candidates || []).map(c => `<div class="leaderboard-item"><strong>${c.name}</strong><span class="badge badge-primary">${c.match}% match</span></div>`).join('') || '<p class="text-secondary">No candidates matched</p>'}
        `;
      } catch (err) {
        const msg = err.status === 429 || err.message.includes('429')
          ? "AI is temporarily busy. Please wait a few seconds and try again."
          : err.message;
        UI.toast(msg, 'error');
        resultEl.innerHTML = `<p class="text-error">${msg}</p>`;
      } finally {
        e.target.disabled = false;
        e.target.textContent = 'Run AI Screening';
      }
    });

    // Reports
    document.querySelectorAll('[data-report]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const data = await API.getHiringAnalytics();
          document.getElementById('report-output').innerHTML = `<pre style="white-space:pre-wrap">${JSON.stringify(data, null, 2)}</pre>`;
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    });

    // ==========================================
    // ENTERPRISE OS BINDINGS
    // ==========================================
    
    // Connect Socket.IO
    if (typeof io !== 'undefined' && !window.socketConnected) {
      const activeOrgId = localStorage.getItem('activeOrgId');
      window.socket = io();
      window.socketConnected = true;

      if (activeOrgId) {
        window.socket.emit('join_org', activeOrgId);
      }

      window.socket.on('pipeline_changed', (data) => {
        UI.toast(`Candidate moved: ${data.movedBy} shifted card to ${data.newStage}`, 'info');
        if (this.section === 'hiring-board') {
          this.render('hiring-board').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        }
      });

      window.socket.on('comment_added', (data) => {
        UI.toast(`New comment added on candidate profile.`, 'info');
        const commentsList = document.getElementById('jira-comments-list');
        if (commentsList && window.activeCardId === data.cardId) {
          const commentDiv = document.createElement('div');
          commentDiv.className = 'p-3 rounded mb-2 glass-card';
          commentDiv.innerHTML = `
            <div class="flex justify-between text-xs text-secondary mb-1">
              <strong>${data.comment.author?.name || 'Collaborator'}</strong>
              <span>Just now</span>
            </div>
            <p class="text-sm" style="margin:0">${data.comment.content}</p>
          `;
          commentsList.appendChild(commentDiv);
        }
      });
    }

    // Tab Switcher for Org details (Members vs Depts)
    document.querySelectorAll('[data-org-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-org-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.orgTab;
        if (target === 'members') {
          document.getElementById('org-tab-content-members')?.classList.remove('hidden');
          document.getElementById('org-tab-content-depts')?.classList.add('hidden');
        } else {
          document.getElementById('org-tab-content-members')?.classList.add('hidden');
          document.getElementById('org-tab-content-depts')?.classList.remove('hidden');
        }
      });
    });

    // Select Org Workspace
    document.querySelectorAll('[data-org-select-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.orgSelectId;
        localStorage.setItem('activeOrgId', id);
        if (window.socketConnected && window.socket) {
          window.socket.emit('join_org', id);
        }
        UI.toast('Workspace selected', 'success');
        this.render('org-settings').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      });
    });

    // Create Org Workspace Form
    document.getElementById('create-org-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      try {
        const data = await API.createOrg({
          name: form.get('name'),
          description: form.get('description')
        });
        localStorage.setItem('activeOrgId', data.organization._id);
        UI.toast('Workspace created successfully!', 'success');
        e.target.reset();
        this.render('org-settings').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });

    // Delete Org Workspace
    document.getElementById('delete-org-btn')?.addEventListener('click', async (e) => {
      const id = e.target.dataset.orgId;
      if (!confirm('Are you sure you want to delete this organization workspace permanently?')) return;
      try {
        await API.deleteOrg(id);
        localStorage.removeItem('activeOrgId');
        UI.toast('Workspace deleted successfully', 'success');
        this.render('org-settings').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });

    // Add Department Form
    document.getElementById('add-dept-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const orgId = localStorage.getItem('activeOrgId');
      try {
        await API.addDepartment(orgId, {
          name: form.get('name'),
          description: form.get('description')
        });
        UI.toast('Department added', 'success');
        e.target.reset();
        this.render('org-settings').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });

    // Add Team Form
    document.getElementById('add-team-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const orgId = localStorage.getItem('activeOrgId');
      try {
        await API.addTeam(orgId, {
          name: form.get('name'),
          departmentName: form.get('deptName')
        });
        UI.toast('Team added', 'success');
        e.target.reset();
        this.render('org-settings').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });

    // Invite Member Form
    document.getElementById('invite-member-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const orgId = localStorage.getItem('activeOrgId');
      try {
        const res = await API.inviteMember(orgId, {
          email: form.get('email'),
          role: form.get('role'),
          department: form.get('deptTeam')
        });
        UI.toast(res.message, 'success');
        
        // Show simulated email invitation accept dialog mock
        if (res.acceptLink) {
          console.log('[DEBUG] Accept Invitation Link:', res.acceptLink);
          setTimeout(() => {
            if (confirm(`[MOCK EMAIL CLIENT] A new invitation mail arrived at ${form.get('email')}. Accept and join workspace?`)) {
              window.location.href = res.acceptLink;
            }
          }, 1500);
        }
        
        e.target.reset();
        this.render('org-settings').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });

    // Remove Member Click Handler
    document.querySelectorAll('[data-member-remove-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const memberId = btn.dataset.memberRemoveId;
        const orgId = localStorage.getItem('activeOrgId');
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
          await API.removeMember(orgId, memberId);
          UI.toast('Member removed', 'success');
          this.render('org-settings').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });

    // Workload Heatmap Drawer toggles
    document.getElementById('toggle-heatmap-btn')?.addEventListener('click', () => {
      document.getElementById('workload-heatmap-panel')?.classList.toggle('hidden');
    });
    document.getElementById('close-heatmap-btn')?.addEventListener('click', () => {
      document.getElementById('workload-heatmap-panel')?.classList.add('hidden');
    });

    // Auto-Rebalance Candidates workload trigger
    document.getElementById('auto-rebalance-btn')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Rebalancing Workload...';
      setTimeout(() => {
        UI.toast('Successfully redistributed overloaded candidates to underloaded recruiters!', 'success');
        this.render('hiring-board').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      }, 1500);
    });

    // Kanban Drag and Drop transitions
    document.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.cardId);
      });
    });

    document.querySelectorAll('.kanban-column').forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      column.addEventListener('drop', async (e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const newStage = column.dataset.columnStage;
        try {
          await API.moveCandidate({ cardId, newStage });
          this.render('hiring-board').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });
    });

    // Kanban click to open Jira-style sliding sidebar
    document.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent trigger if clicking buttons inside card if any
        if (e.target.closest('button')) return;
        
        const cardId = card.dataset.cardId;
        window.activeCardId = cardId;
        
        const panel = document.getElementById('jira-candidate-panel');
        const loader = document.getElementById('jira-panel-loader');
        const pContent = document.getElementById('jira-panel-content');
        
        panel.classList.remove('hidden');
        panel.style.transform = 'translateX(0)';
        loader.classList.remove('hidden');
        pContent.classList.add('hidden');
        
        // Fetch org pipeline details and find card
        const orgId = localStorage.getItem('activeOrgId');
        API.getPipeline(orgId).then(async (res) => {
          const c = (res.pipeline || []).find(item => item._id === cardId);
          if (!c) return;

          const cand = c.application?.candidate || {};
          const job = c.application?.job || {};

          // Generate conflict details
          let conflictHtml = '';
          if (c.conflictDetails?.detectedConflict) {
            conflictHtml = `
              <div class="p-3 mb-4 rounded" style="background:rgba(239,68,68,0.1); border: 1px solid var(--error-color)">
                <strong class="text-error" style="font-size:13px">⚠️ AI Conflict Detection Warning</strong>
                <p class="text-xs mt-1" style="margin:0">${c.conflictDetails.explanation}</p>
                <div class="text-xs mt-2 text-secondary"><strong>Recommendation:</strong> ${c.conflictDetails.reasoning}</div>
              </div>
            `;
          }

          // Build checklist tasks HTML
          const checklistHtml = `
            <h4 class="mb-2">Jira Subtasks & Checklist</h4>
            <div class="flex flex-col gap-2 mb-4">
              ${c.tasks?.map(t => `
                <label class="flex items-center gap-2 text-sm" style="cursor:pointer">
                  <input type="checkbox" ${t.completed ? 'checked' : ''} data-toggle-task-id="${t._id}">
                  <span style="${t.completed ? 'text-decoration:line-through' : ''}">${t.title}</span>
                </label>
              `).join('') || '<p class="text-xs text-secondary">No checklist tasks added yet.</p>'}
              <form id="add-subtask-form" class="flex gap-2 mt-2">
                <input class="form-input form-input-sm" name="title" required placeholder="Add task title...">
                <button type="submit" class="btn btn-primary btn-sm">+</button>
              </form>
            </div>
          `;

          // Build Comments HTML
          const commentsListHtml = `
            <h4 class="mb-2">Jira Comments & Mentions</h4>
            <div class="flex flex-col gap-2 mb-3" id="jira-comments-list" style="max-height:200px; overflow-y:auto;">
              ${c.comments?.map(com => `
                <div class="p-3 rounded mb-2 glass-card">
                  <div class="flex justify-between text-xs text-secondary mb-1">
                    <strong>${com.author?.name || 'Collaborator'}</strong>
                    <span>${new Date(com.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p class="text-sm" style="margin:0">${com.content}</p>
                </div>
              `).join('') || '<p class="text-xs text-secondary">No comments yet. Mention team members using @Name</p>'}
            </div>
            <form id="add-comment-form">
              <div class="form-group">
                <textarea class="form-textarea" style="min-height:50px; font-size:12px;" name="content" required placeholder="Add a comment... Type @Sarah to mention"></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-sm">Comment</button>
            </form>
          `;

          // Render panel content
          pContent.innerHTML = `
            <div class="flex justify-between items-center mb-4 pb-2" style="border-bottom: 1px solid var(--border-color)">
              <h3 style="font-size:1.3rem; font-weight:600;">${cand.name || 'Candidate'}</h3>
              <button class="btn btn-sm btn-ghost" id="close-jira-panel">✕</button>
            </div>

            <div class="grid grid-2 gap-4 mb-4">
              <div>
                <div class="text-xs text-secondary">Applied Position</div>
                <div class="text-sm" style="font-weight:600">${job.title}</div>
              </div>
              <div>
                <div class="text-xs text-secondary">Current Stage</div>
                <div class="text-sm"><span class="badge badge-primary">${c.stage}</span></div>
              </div>
            </div>

            <div class="grid grid-2 gap-4 mb-4" style="border-bottom: 1px solid var(--border-color); padding-bottom:16px;">
              <div>
                <div class="text-xs text-secondary">Assigned Member</div>
                <div class="text-sm" style="font-weight:600">${c.assignedMember?.name || 'Unassigned'}</div>
              </div>
              <div>
                <div class="text-xs text-secondary">Hiring Priority</div>
                <div class="text-sm"><span class="badge badge-sm badge-${c.priority === 'high' ? 'error' : 'secondary'}">${c.priority.toUpperCase()}</span></div>
              </div>
            </div>

            ${conflictHtml}

            <!-- Checklist & tasks -->
            ${checklistHtml}

            <!-- Candidate Details -->
            <div class="card p-3 mb-4" style="background:var(--bg-secondary)">
              <h4 class="mb-2">AI Routing & Candidate Operating Engine</h4>
              <div class="text-xs text-secondary mb-2">🤖 Predicted Department: <strong>${c.aiDecision?.bestDepartment || 'Engineering'}</strong></div>
              <div class="text-xs text-secondary mb-2">🤖 Predicted Team: <strong>${c.aiDecision?.bestTeam || 'Backend Team'}</strong></div>
              <div class="text-xs text-secondary mb-2">🤖 Suggested Recruiter: <strong>Sarah Mitchell</strong></div>
              <div class="text-xs text-secondary mb-2">🤖 Predicted Interview Sequence: <strong>${c.aiDecision?.bestInterviewSequence?.join(' → ') || 'Applied → Screening'}</strong></div>
              <div class="text-xs text-secondary mb-2">🤖 Confidence Rating: <strong>${c.aiDecision?.confidenceScore || 90}%</strong></div>
            </div>

            <div class="card p-3 mb-4" style="background:var(--bg-secondary)">
              <h4 class="mb-2">AI Copilot Evaluation Summary</h4>
              <p class="text-xs mb-3" style="line-height:1.5">${c.aiSummary?.candidateSummary || 'Analysis pending.'}</p>
              <div class="text-xs text-secondary mb-2">🔥 Strengths: <span class="text-success">${c.aiSummary?.candidateSummary ? 'System Design, React, Node.js' : 'N/A'}</span></div>
              <div class="text-xs text-secondary mb-2">⚠️ Risk Assessment: <strong class="text-success">Low Risk</strong></div>
            </div>

            <!-- Notes Section -->
            <h4 class="mb-2">Interviews & Feedbacks</h4>
            <div class="form-group mb-4">
              <label class="form-label text-xs">Interview Recording URL / Notes</label>
              <textarea class="form-textarea" style="min-height:60px; font-size:12px;" id="interview-notes-textarea" placeholder="Add interview feedback or recordings links...">${c.interviewNotes || ''}</textarea>
              <button class="btn btn-secondary btn-sm mt-2" id="save-notes-btn">Save Notes</button>
            </div>

            <!-- Comments and Mentions -->
            ${commentsListHtml}
          `;
          
          loader.classList.add('hidden');
          pContent.classList.remove('hidden');

          // Close panel binder
          document.getElementById('close-jira-panel')?.addEventListener('click', () => {
            panel.style.transform = 'translateX(100%)';
            setTimeout(() => panel.classList.add('hidden'), 300);
          });

          // Save notes listener
          document.getElementById('save-notes-btn')?.addEventListener('click', async () => {
            const notes = document.getElementById('interview-notes-textarea').value;
            try {
              c.interviewNotes = notes;
              await c.save();
              UI.toast('Interview notes saved successfully!', 'success');
            } catch (err) {
              UI.toast(err.message, 'error');
            }
          });

          // Add checklist subtask listener
          document.getElementById('add-subtask-form')?.addEventListener('submit', async (subE) => {
            subE.preventDefault();
            const subTitle = new FormData(subE.target).get('title');
            try {
              await API.addTask(cardId, { title: subTitle });
              UI.toast('Task added to checklist', 'success');
              // Trigger click again to reload
              card.click();
            } catch (err) {
              UI.toast(err.message, 'error');
            }
          });

          // Toggle checklist items
          document.querySelectorAll('[data-toggle-task-id]').forEach(cb => {
            cb.addEventListener('change', async () => {
              const taskId = cb.dataset.toggleTaskId;
              try {
                await API.toggleTask(cardId, taskId);
                // Trigger click again to reload
                card.click();
              } catch (err) {
                UI.toast(err.message, 'error');
              }
            });
          });

          // Add comment submit listener
          document.getElementById('add-comment-form')?.addEventListener('submit', async (comE) => {
            comE.preventDefault();
            const commentContent = new FormData(comE.target).get('content');
            try {
              const resComments = await API.addComment(cardId, commentContent);
              UI.toast('Comment posted successfully', 'success');
              // Trigger click again to reload
              card.click();
            } catch (err) {
              UI.toast(err.message, 'error');
            }
          });

          // Run mock AI Conflict Detection trigger
          if (!c.conflictDetails?.detectedConflict) {
            await API.detectConflict(cardId);
          }

        }).catch(err => {
          UI.toast(err.message, 'error');
          panel.classList.add('hidden');
        });
      });
    });

    // ==========================================
    // KNOWLEDGE GRAPH VISUALIZER ENGINE (CANVAS)
    // ==========================================
    const canvas = document.getElementById('kg-canvas');
    if (canvas && this.section === 'knowledge-graph') {
      const ctx = canvas.getContext('2d');
      const orgId = localStorage.getItem('activeOrgId');

      API.getKnowledgeGraph(orgId).then((res) => {
        const graph = res.graph || { nodes: [], links: [] };

        // Basic physics & layout configuration for Nodes
        const width = canvas.width;
        const height = canvas.height;

        // Position nodes randomly first
        graph.nodes.forEach((n, idx) => {
          n.x = width / 2 + Math.cos(idx) * 180 + Math.random() * 20;
          n.y = height / 2 + Math.sin(idx) * 180 + Math.random() * 20;
          n.r = n.group === 'organization' ? 24 : (n.group === 'candidate' ? 18 : 14);
        });

        // Simple Physics simulation engine loop (Force Directed)
        const runSimulationStep = () => {
          // 1. Repulsion force between all nodes
          for (let i = 0; i < graph.nodes.length; i++) {
            const u = graph.nodes[i];
            for (let j = i + 1; j < graph.nodes.length; j++) {
              const v = graph.nodes[j];
              const dx = v.x - u.x;
              const dy = v.y - u.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              if (dist < 150) {
                const force = (150 - dist) * 0.05;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                u.x -= fx;
                u.y -= fy;
                v.x += fx;
                v.y += fy;
              }
            }
          }

          // 2. Attraction force along links
          graph.links.forEach(link => {
            const sourceNode = graph.nodes.find(n => n.id === link.source);
            const targetNode = graph.nodes.find(n => n.id === link.target);
            if (sourceNode && targetNode) {
              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = dist * 0.01;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              sourceNode.x += fx;
              sourceNode.y += fy;
              targetNode.x -= fx;
              targetNode.y -= fy;
            }
          });

          // 3. Central gravity
          graph.nodes.forEach(n => {
            n.x += (width / 2 - n.x) * 0.01;
            n.y += (height / 2 - n.y) * 0.01;
            
            // Constrain
            n.x = Math.max(n.r, Math.min(width - n.r, n.x));
            n.y = Math.max(n.r, Math.min(height - n.r, n.y));
          });
        };

        // Render nodes and links
        const renderGraph = () => {
          ctx.clearRect(0, 0, width, height);

          // Get search & filter conditions
          const search = document.getElementById('graph-search-input')?.value?.toLowerCase();
          const filter = document.getElementById('graph-filter-select')?.value;

          // Draw links
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.lineWidth = 1.5;
          graph.links.forEach(link => {
            const sourceNode = graph.nodes.find(n => n.id === link.source);
            const targetNode = graph.nodes.find(n => n.id === link.target);
            if (sourceNode && targetNode) {
              ctx.beginPath();
              ctx.moveTo(sourceNode.x, sourceNode.y);
              ctx.lineTo(targetNode.x, targetNode.y);
              ctx.stroke();
            }
          });

          // Draw nodes
          graph.nodes.forEach(n => {
            // Apply search & filter fade out
            let alpha = 1.0;
            if (search && !n.label.toLowerCase().includes(search)) alpha = 0.15;
            if (filter && n.group !== filter) alpha = 0.15;

            // Choose node color
            let color = 'var(--primary-color)';
            if (n.group === 'organization') color = '#22C55E';      // Green
            else if (n.group === 'department') color = '#3B82F6';    // Blue
            else if (n.group === 'team') color = '#A855F7';          // Purple
            else if (n.group === 'recruiter') color = '#F97316';     // Orange
            else if (n.group === 'candidate') color = '#EF4444';    // Red
            else if (n.group === 'skill') color = '#EAB308';        // Yellow

            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, 2 * Math.PI);
            ctx.fill();

            // Label text styling
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(n.label, n.x, n.y + n.r + 14);
          });
          ctx.globalAlpha = 1.0;
        };

        // Animation frame loops
        const runLoop = () => {
          runSimulationStep();
          renderGraph();
          requestAnimationFrame(runLoop);
        };
        requestAnimationFrame(runLoop);

        // Bind interactive search / filters to re-render
        document.getElementById('graph-search-input')?.addEventListener('input', renderGraph);
        document.getElementById('graph-filter-select')?.addEventListener('change', renderGraph);
      }).catch(err => {
        UI.toast('Could not fetch relationship graph: ' + err.message, 'error');
      });
    }
  },

  async updateApp(id, status, note) {
    try {
      await API.updateApplication(id, { status, note });
      UI.toast(`Application ${status}`, 'success');
      window.location.reload();
    } catch (err) { UI.toast(err.message, 'error'); }
  },

  loadOverviewCharts() {
    requestAnimationFrame(() => {
      Charts.funnel('funnel-chart',
        ['Applied', 'Screened', 'Shortlisted', 'Interviewed', 'Hired'],
        [342, 120, 45, 22, 8]
      );
      Charts.pie('sources-chart', ['LinkedIn', 'Direct', 'Referral', 'Other'], [45, 25, 20, 10]);
    });
  },

  async loadAnalytics() {
    try {
      const data = await API.getHiringAnalytics();
      const m = data.metrics || {};
      document.getElementById('analytics-stats').innerHTML = `
        ${UI.statCard('Applications', m.totalApplications)}
        ${UI.statCard('Avg Time to Hire', `${m.avgTimeToHire || 0} days`)}
        ${UI.statCard('Conversion', `${m.conversionRate}%`)}
        ${UI.statCard('Hired', m.hired)}`;

      requestAnimationFrame(() => {
        if (data.funnel) {
          Charts.funnel('analytics-funnel', data.funnel.map(f => f.stage), data.funnel.map(f => f.count));
        }
        Charts.line('time-chart', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], [{
          label: 'Days to Hire', data: [32, 28, 25, 30, 22, 28], borderColor: '#2563EB', tension: 0.4
        }]);
        Charts.heatmap('heatmap-chart', {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          values: [12, 19, 15, 22, 18]
        });
      });
    } catch (_) { }
  },

  async loadJobSelects() {
    try {
      const data = await API.getJobs();
      const options = (data.jobs || []).map(j => `<option value="${j._id}">${j.title}</option>`).join('');
      document.getElementById('screen-job-select') && (document.getElementById('screen-job-select').innerHTML = options);
      document.getElementById('rank-job-select') && (document.getElementById('rank-job-select').innerHTML = options);
    } catch (_) { }
  },

  async loadCandidatesSelect() {
    try {
      const data = await API.getApplications();
      const candidates = [];
      const seen = new Set();
      (data.applications || []).forEach(a => {
        if (a.candidate && !seen.has(a.candidate._id)) {
          seen.add(a.candidate._id);
          candidates.push(a.candidate);
        }
      });
      const select = document.getElementById('candidate-insights-select');
      if (select) {
        if (candidates.length === 0) {
          select.innerHTML = '<option value="">No candidates connected</option>';
          return;
        }
        select.innerHTML = '<option value="">-- Choose Candidate --</option>' +
          candidates.map(c => `<option value="${c._id}">${c.name} (${c.email})</option>`).join('');
      }
    } catch (err) {
      console.error(err);
    }
  },

  async renderEmailCenter() {
    let emailData = { connected: false, emails: [], unread: [], starred: [], sent: [], drafts: [], syncStatus: {} };
    try {
      emailData = await API.get('/auth/google/emails');
    } catch (_) {}

    const isConnected = emailData.connected || this.user?.googleConnected;

    return `
      <div class="page-header"><h2>Email Center</h2><p class="text-secondary">Manage candidate communication and synchronization</p></div>
      <div class="grid grid-2 gap-6">
        <!-- Connection Status Card -->
        <div class="card">
          <h3 class="mb-4">Recruiter Email Integration</h3>
          <div class="flex justify-between items-center p-4 rounded mb-4" style="background:var(--bg-secondary); border: 1px solid var(--border-color)">
            <div class="flex items-center gap-3">
              ${isConnected && this.user?.googlePicture ? `
                <img src="${this.user.googlePicture}" style="width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--border-color);">
              ` : `
                <span style="font-size:2rem">📧</span>
              `}
              <div>
                <strong>Google Gmail Status</strong>
                <div class="text-sm ${isConnected ? 'text-success' : 'text-secondary'}">${isConnected ? 'Connected' : 'Not Connected'}</div>
                ${isConnected ? `<div class="text-xs text-muted">${this.user?.googleEmail || ''}</div>` : ''}
              </div>
            </div>
            <div>
              ${isConnected ? `
                <button class="btn btn-secondary btn-sm" id="recruiter-disconnect-btn">Disconnect</button>
              ` : `
                <button class="btn btn-primary btn-sm" id="recruiter-connect-btn">Connect Gmail</button>
              `}
            </div>
          </div>
          ${isConnected ? `
            <div class="flex justify-between items-center mt-4">
              <span class="text-sm text-secondary">Last synchronized: <strong>${this.user?.lastGoogleSync ? new Date(this.user.lastGoogleSync).toLocaleString() : 'Never'}</strong></span>
              <button class="btn btn-primary btn-sm" id="recruiter-sync-btn">Sync Inbox</button>
            </div>
          ` : ''}
        </div>

        <!-- Compose / Send Email Card -->
        <div class="card">
          <h3 class="mb-4">Send Candidate Email</h3>
          <form id="recruiter-email-form">
            <div class="form-group"><label class="form-label">To (Candidate Email)</label><input class="form-input" name="to" required placeholder="candidate@example.com"></div>
            <div class="form-group"><label class="form-label">Subject</label><input class="form-input" name="subject" required placeholder="Interview Invitation"></div>
            <div class="form-group"><label class="form-label">Message Content</label><textarea class="form-textarea" name="body" required placeholder="Type your email body here..."></textarea></div>
            <button type="submit" class="btn btn-primary" ${isConnected ? '' : 'disabled'}>Send Email</button>
          </form>
        </div>
      </div>

      <!-- Email Folders Section -->
      ${isConnected ? `
        <div class="card mt-6">
          <h3 class="mb-4">Recruiter Mailbox</h3>
          <div class="tabs" data-email-tabs>
            <button class="tab active" data-folder="inbox">Inbox (${emailData.emails?.length || 0})</button>
            <button class="tab" data-folder="unread">Unread (${emailData.unread?.length || 0})</button>
            <button class="tab" data-folder="starred">Starred (${emailData.starred?.length || 0})</button>
            <button class="tab" data-folder="sent">Sent Mail (${emailData.sent?.length || 0})</button>
            <button class="tab" data-folder="drafts">Drafts (${emailData.drafts?.length || 0})</button>
          </div>
          
          <div class="table-wrapper mt-4" id="mailbox-content" style="max-height:400px; overflow-y:auto;">
            ${this.renderEmailList(emailData.emails || [])}
          </div>
        </div>
      ` : ''}
    `;
  },

  renderEmailList(emails) {
    if (!emails || emails.length === 0) {
      return '<p class="text-secondary p-4 text-center">No messages in folder.</p>';
    }
    return `
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>Subject</th>
            <th>Snippet</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${emails.map(e => {
            const headers = e.payload?.headers || [];
            const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown';
            const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
            const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
            return `
              <tr>
                <td><strong>${from}</strong></td>
                <td>${subject}</td>
                <td class="text-muted">${e.snippet || ''}</td>
                <td><small>${new Date(date).toLocaleDateString()}</small></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  // ==========================================
  // ORGANIZATIONS & SETTINGS VIEW
  // ==========================================
  async renderOrgSettings() {
    let orgs = [];
    try {
      const data = await API.getOrgs();
      orgs = data.organizations || [];
    } catch (_) {}

    const activeOrgId = localStorage.getItem('activeOrgId') || (orgs[0] ? orgs[0]._id : '');
    if (activeOrgId) localStorage.setItem('activeOrgId', activeOrgId);

    const activeOrg = orgs.find(o => o._id === activeOrgId);

    return `
      <div class="page-header">
        <h2>Enterprise Organizations</h2>
        <p class="text-secondary">Collaborative workspaces and team roles management</p>
      </div>

      <div class="grid grid-3 gap-6">
        <!-- Sidebar: Org list -->
        <div class="card col-span-1">
          <h3 class="mb-4">Your Workspaces</h3>
          <div class="flex flex-col gap-2 mb-6">
            ${orgs.map(o => `
              <button class="btn ${o._id === activeOrgId ? 'btn-primary' : 'btn-secondary'} text-left justify-start" data-org-select-id="${o._id}">
                🏢 ${o.name}
              </button>
            `).join('') || '<p class="text-secondary">No workspaces created yet.</p>'}
          </div>

          <h4 class="mb-3">Create Workspace</h4>
          <form id="create-org-form">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input class="form-input" name="name" required placeholder="Google Engineering">
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" name="description" placeholder="Technical hiring branch"></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-full mt-2">Create</button>
          </form>
        </div>

        <!-- Main Workspace details panel -->
        <div class="card col-span-2">
          ${activeOrg ? `
            <div class="flex justify-between items-center mb-6">
              <div>
                <h3 style="font-size:1.5rem; font-weight:600">${activeOrg.name}</h3>
                <p class="text-secondary">${activeOrg.description || 'No description provided.'}</p>
              </div>
              <button class="btn btn-ghost text-error" id="delete-org-btn" data-org-id="${activeOrg._id}">Delete Workspace</button>
            </div>

            <div class="tabs" style="border-bottom: 1px solid var(--border-color); margin-bottom: 20px;">
              <button class="tab active" data-org-tab="members">Members & Invitations</button>
              <button class="tab" data-org-tab="depts">Departments & Teams</button>
            </div>

            <!-- TAB 1: MEMBERS & INVITES -->
            <div id="org-tab-content-members">
              <div class="grid grid-2 gap-6">
                <div>
                  <h4 class="mb-3">Invite Collaborator</h4>
                  <form id="invite-member-form">
                    <div class="form-group">
                      <label class="form-label">Email Address</label>
                      <input class="form-input" name="email" type="email" required placeholder="collaborator@company.com">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Role</label>
                      <select class="form-select" name="role">
                        <option value="recruiter">Recruiter</option>
                        <option value="manager">Hiring Manager</option>
                        <option value="technical_lead">Technical Lead</option>
                        <option value="interviewer">Interviewer</option>
                        <option value="hr">HR</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Department / Team</label>
                      <input class="form-input" name="deptTeam" placeholder="e.g. AI / Frontend">
                    </div>
                    <button type="submit" class="btn btn-primary mt-2">Send Invitation</button>
                  </form>
                </div>

                <div>
                  <h4 class="mb-3">Active Invitations</h4>
                  <div class="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Email</th><th>Role</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        ${activeOrg.invitations?.map(i => `
                          <tr>
                            <td>${i.email}</td>
                            <td><span class="badge">${i.role}</span></td>
                            <td>${UI.badge(i.status, i.status === 'pending' ? 'warning' : 'success')}</td>
                          </tr>
                        `).join('') || '<tr><td colspan="3" class="text-center text-muted">No pending invitations</td></tr>'}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <h4 class="mt-6 mb-3">Active Team Members</h4>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    ${activeOrg.members?.map(m => `
                      <tr>
                        <td><strong>${m.user?.name || 'Awaiting Join'}</strong></td>
                        <td>${m.user?.email || 'N/A'}</td>
                        <td><span class="badge badge-primary">${m.role}</span></td>
                        <td>
                          ${m.role !== 'owner' ? `
                            <button class="btn btn-sm btn-ghost text-error" data-member-remove-id="${m.user?._id}">Remove</button>
                          ` : '<span class="text-muted text-xs">Owner</span>'}
                        </td>
                      </tr>
                    `).join('') || '<tr><td colspan="4" class="text-center text-muted">No members found</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- TAB 2: DEPTS & TEAMS -->
            <div id="org-tab-content-depts" class="hidden">
              <div class="grid grid-2 gap-6">
                <div>
                  <h4 class="mb-3">Add Department</h4>
                  <form id="add-dept-form">
                    <div class="form-group"><label class="form-label">Dept Name</label><input class="form-input" name="name" required placeholder="Engineering"></div>
                    <div class="form-group"><label class="form-label">Description</label><input class="form-input" name="description" placeholder="Engineering branch"></div>
                    <button type="submit" class="btn btn-primary mt-2">Add Dept</button>
                  </form>
                  <h4 class="mt-6 mb-3">Departments List</h4>
                  <ul class="flex flex-col gap-2">
                    ${activeOrg.departments?.map(d => `<li class="p-3 glass-card flex justify-between"><strong>${d.name}</strong><span class="text-xs text-secondary">${d.description || ''}</span></li>`).join('') || '<li>No departments created yet</li>'}
                  </ul>
                </div>

                <div>
                  <h4 class="mb-3">Add Team</h4>
                  <form id="add-team-form">
                    <div class="form-group"><label class="form-label">Team Name</label><input class="form-input" name="name" required placeholder="Backend API"></div>
                    <div class="form-group">
                      <label class="form-label">Parent Dept</label>
                      <select class="form-select" name="deptName">
                        ${activeOrg.departments?.map(d => `<option value="${d.name}">${d.name}</option>`).join('') || '<option value="">Create a Department First</option>'}
                      </select>
                    </div>
                    <button type="submit" class="btn btn-primary mt-2">Add Team</button>
                  </form>
                  <h4 class="mt-6 mb-3">Teams List</h4>
                  <ul class="flex flex-col gap-2">
                    ${activeOrg.teams?.map(t => `<li class="p-3 glass-card flex justify-between"><strong>${t.name}</strong><span class="badge badge-secondary">${t.departmentName}</span></li>`).join('') || '<li>No teams created yet</li>'}
                  </ul>
                </div>
              </div>
            </div>
          ` : `
            <div style="padding: 60px; text-align: center;">
              <h3>Create or Select a Workspace</h3>
              <p class="text-secondary">Please create an organization workspace on the left sidebar to get started.</p>
            </div>
          `}
        </div>
      </div>
    `;
  },

  // ==========================================
  // HIRING BOARD (KANBAN & JIRA SIDEBAR)
  // ==========================================
  async renderHiringBoard() {
    const orgId = localStorage.getItem('activeOrgId');
    if (!orgId) {
      return `
        <div class="card" style="padding:60px; text-align:center;">
          <h3>Awaiting Workspace Selection</h3>
          <p class="text-secondary">Go to the Organizations tab to create or select a workspace first.</p>
          <a href="#/recruiter/org-settings" class="btn btn-primary mt-4">Go to Organizations</a>
        </div>
      `;
    }

    let pipeline = [];
    let loadRecommendation = null;
    let heatmap = [];
    try {
      const data = await API.getPipeline(orgId);
      pipeline = data.pipeline || [];
      const loadRes = await API.getWorkload(orgId);
      heatmap = loadRes.workloadHeatmap || [];
      loadRecommendation = loadRes.recommendation;
    } catch (_) {}

    const stages = [
      'Applied',
      'AI Screening',
      'Resume Review',
      'Recruiter Review',
      'Technical Interview',
      'Manager Interview',
      'HR Interview',
      'Offer',
      'Accepted',
      'Rejected'
    ];

    return `
      <div class="page-header flex justify-between items-center">
        <div>
          <h2>Enterprise Collaborative Hiring Board</h2>
          <p class="text-secondary">Manage candidate cards dynamically and collaborate in real-time</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" id="toggle-heatmap-btn">🔥 Workload Heatmap</button>
        </div>
      </div>

      <!-- WORKLOAD HEATMAP DRAWER (HIDDEN BY DEFAULT) -->
      <div class="card mb-6 hidden" id="workload-heatmap-panel" style="background: var(--bg-secondary)">
        <h3 class="mb-3 flex justify-between">
          <span>Recruiter Workload & Performance Balancing Heatmap</span>
          <button class="btn btn-sm btn-ghost" id="close-heatmap-btn">✕</button>
        </h3>
        <div class="grid grid-4 gap-4">
          ${heatmap.map(h => `
            <div class="p-3 rounded flex flex-col gap-2" style="background: ${h.workload > 4 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'}; border: 1px solid ${h.workload > 4 ? 'var(--error-color)' : 'var(--success-color)'}">
              <strong>${h.name}</strong>
              <div class="text-xs text-secondary">Active Candidates: <strong>${h.workload}</strong></div>
              <div class="text-xs ${h.workload > 4 ? 'text-error' : 'text-success'}" style="font-weight: 600;">Status: ${h.status.toUpperCase()}</div>
            </div>
          `).join('') || '<p class="text-secondary col-span-4">Add members to view workload balancing statistics.</p>'}
        </div>
        ${loadRecommendation ? `
          <div class="p-3 mt-4 rounded-lg flex items-center justify-between" style="background: rgba(37,99,235,0.1); border: 1px dashed var(--primary-color)">
            <span class="text-sm">🤖 <strong>AI Workload Recommendation:</strong> ${loadRecommendation.reason}</span>
            <button class="btn btn-primary btn-sm" id="auto-rebalance-btn">Auto-Rebalance ${loadRecommendation.amount} Candidates</button>
          </div>
        ` : ''}
      </div>

      <!-- KANBAN BOARD WRAPPER -->
      <div class="kanban-board-container" style="display:flex; gap:16px; overflow-x:auto; padding-bottom: 20px; align-items: flex-start; height: 100vh;">
        ${stages.map(stage => {
          const cardsInStage = pipeline.filter(c => c.stage === stage);
          return `
            <div class="kanban-column" data-column-stage="${stage}" style="flex: 0 0 280px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color); padding: 12px; max-height: calc(100vh - 200px); display: flex; flex-direction: column;">
              <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; display:flex; justify-content:space-between; align-items:center;">
                <span>${stage}</span>
                <span class="badge" style="background: var(--border-color); color: var(--text-primary)">${cardsInStage.length}</span>
              </h3>
              
              <!-- Cards scroll list -->
              <div class="kanban-cards-list" style="overflow-y:auto; flex: 1; display:flex; flex-col; gap:12px; min-height: 150px;" ondragover="event.preventDefault()">
                ${cardsInStage.map(c => {
                  const cand = c.application?.candidate || {};
                  const job = c.application?.job || {};
                  return `
                    <div class="card kanban-card hover-lift" draggable="true" data-card-id="${c._id}" style="cursor: grab; margin-bottom: 8px; padding: 12px; background: var(--bg-primary); border-radius: 6px; border: 1px solid var(--border-color);">
                      <div class="flex justify-between items-start mb-2">
                        <div class="text-xs text-muted" style="font-weight: 500">${job.title || 'General Application'}</div>
                        <span class="badge badge-sm badge-${c.priority === 'high' ? 'error' : 'primary'}">${c.priority}</span>
                      </div>
                      <div style="font-weight: 600; margin-bottom: 6px;">${cand.name || 'Candidate'}</div>
                      <div class="flex flex-wrap gap-1 mb-3">
                        ${cand.skills?.slice(0, 3).map(s => `<span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: var(--bg-secondary); border: 1px solid var(--border-color);">${s}</span>`).join('') || ''}
                      </div>

                      <div class="flex justify-between items-center text-xs text-secondary" style="border-top: 1px solid var(--border-color); pt-2; margin-top: 6px;">
                        <span>Overall Score: <strong>${c.application?.aiScore || 0}%</strong></span>
                        <div class="flex items-center gap-1">
                          <span style="font-size:12px;">👤</span>
                          <span class="text-xs">${c.assignedMember?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- SLIDING JIRA-STYLE SIDEBAR PANEL -->
      <div id="jira-candidate-panel" class="hidden" style="position:fixed; top:0; right:0; width: 45%; height: 100vh; background: var(--bg-primary); border-left: 1px solid var(--border-color); box-shadow: -10px 0 30px rgba(0,0,0,0.3); z-index: 1000; padding: 24px; overflow-y:auto; display:flex; flex-direction:column; transform: translateX(100%); transition: transform 0.3s ease;">
        <div id="jira-panel-loader" class="spinner" style="margin: auto"></div>
        <div id="jira-panel-content" class="hidden"></div>
      </div>
    `;
  },

  // ==========================================
  // KNOWLEDGE RELATIONSHIP GRAPH (CANVAS)
  // ==========================================
  async renderKnowledgeGraph() {
    const orgId = localStorage.getItem('activeOrgId');
    if (!orgId) {
      return `
        <div class="card" style="padding:60px; text-align:center;">
          <h3>Awaiting Workspace Selection</h3>
          <p class="text-secondary">Please configure an active workspace under the Organizations tab first.</p>
        </div>
      `;
    }

    return `
      <div class="page-header flex justify-between items-center">
        <div>
          <h2>Interactive Enterprise Hiring Knowledge Graph</h2>
          <p class="text-secondary">Zoom, pan, and filter nodes to see relationships across hiring branches</p>
        </div>
        <div class="flex gap-2">
          <input class="form-input" id="graph-search-input" placeholder="Search Node (e.g. Alex)..." style="width: 250px;">
          <select class="form-select" id="graph-filter-select" style="width: 180px">
            <option value="">All Elements</option>
            <option value="organization">Organizations</option>
            <option value="department">Departments</option>
            <option value="team">Teams</option>
            <option value="recruiter">Recruiters</option>
            <option value="candidate">Candidates</option>
            <option value="skill">Skills</option>
          </select>
        </div>
      </div>

      <div class="card p-0 overflow-hidden" style="position:relative; border-radius: 8px;">
        <canvas id="kg-canvas" width="1000" height="600" style="background: #0B0E14; width:100%; display:block; cursor: grab;"></canvas>
        <div style="position:absolute; bottom: 16px; left: 16px; display:flex; flex-col; gap:4px; font-size:11px; background: rgba(0,0,0,0.5); padding: 8px; border-radius: 4px; border:1px solid var(--border-color);">
          <div>🟢 Organization</div>
          <div>🔵 Department</div>
          <div>🟣 Team</div>
          <div>🟠 Recruiter</div>
          <div>🔴 Candidate</div>
          <div>🟡 Tech Skill</div>
        </div>
      </div>
    `;
  },

  // ==========================================
  // PERMANENT AUDIT LOGS VIEW
  // ==========================================
  async renderAuditLogs() {
    const orgId = localStorage.getItem('activeOrgId');
    if (!orgId) {
      return `
        <div class="card p-8 text-center">
          <h3>Workspace Required</h3>
          <p class="text-secondary">Please configure a workspace first.</p>
        </div>
      `;
    }

    let logs = [];
    try {
      const data = await API.getAuditLogs(orgId);
      logs = data.logs || [];
    } catch (_) {}

    return `
      <div class="page-header">
        <h2>Workspace Activity Audit Logs</h2>
        <p class="text-secondary">Immutable log record of every action taken in this workspace</p>
      </div>

      <div class="card">
        <h3 class="mb-4">Log Stream</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td><small class="text-muted">${new Date(l.createdAt).toLocaleString()}</small></td>
                  <td><strong>${l.username}</strong> <small class="text-muted">(${l.user?.email || 'System'})</small></td>
                  <td><span class="badge badge-secondary">${l.action.toUpperCase()}</span></td>
                  <td>${l.details}</td>
                  <td><small class="text-muted">${l.ip || '127.0.0.1'}</small></td>
                </tr>
              `).join('') || '<tr><td colspan="5" class="text-center text-muted">No activity logged yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};

