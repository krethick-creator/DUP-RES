const CandidateDashboard = {
  section: 'overview',
  user: null,

  navSections: [
    {
      title: 'Main', items: [
        { id: 'overview', icon: '📊', label: 'Overview' },
        { id: 'profile', icon: '👤', label: 'Profile' },
        { id: 'resume', icon: '📄', label: 'Resume' },
        { id: 'resume-themes', icon: '🎨', label: 'Resume Themes' },
        { id: 'applications', icon: '📋', label: 'Applications' }
      ]
    },
    {
      title: 'AI Tools', items: [
        { id: 'resume-ai', icon: '🤖', label: 'Resume AI' },
        { id: 'assessments', icon: '💻', label: 'AI Project Workspace' },
        { id: 'interview', icon: '🎤', label: 'Interview Prep' },
        { id: 'ai-assistant', icon: '✨', label: 'AI Assistant' }
      ]
    },
    {
      title: 'Career', items: [
        { id: 'roadmap', icon: '🗺️', label: 'Career Roadmap' },
        { id: 'learning', icon: '📚', label: 'Learning Progress' },
        { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
        { id: 'benchmarks', icon: '📈', label: 'Benchmarks' },
        { id: 'growth', icon: '🚀', label: 'Growth Prediction' }
      ]
    },
    {
      title: 'More', items: [
        { id: 'github', icon: '🐙', label: 'GitHub' },
        { id: 'jobs', icon: '💼', label: 'Job Recommendations' },
        { id: 'notifications', icon: '🔔', label: 'Notifications' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
      ]
    }
  ],

  async render(section = 'overview') {
    this.section = section;
    try {
      const data = await API.getMe();
      if (data && data.user) {
        API.setUser(data.user);
      }
    } catch (_) {}
    this.user = API.getUser();
    const sidebar = `
      <div class="sidebar-header">
        <div class="logo" style="display:flex; align-items:center; gap:8px;">${UI.logo('sidebar')} <span style="font-weight:700; font-size:1.1rem; color:var(--text);">TalentAI</span></div>
        <div class="badge badge-primary mt-2">Candidate</div>
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
      profile: () => this.renderProfile(),
      resume: () => this.renderResume(),
      applications: () => this.renderApplications(),
      'resume-ai': () => this.renderResumeAI(),
      assessments: () => this.renderAssessments(),
      interview: () => this.renderInterview(),
      'ai-assistant': () => this.renderAIAssistant(),
      roadmap: () => this.renderRoadmap(),
      learning: () => this.renderLearning(),
      leaderboard: () => this.renderLeaderboard(),
      benchmarks: () => this.renderBenchmarks(),
      growth: () => this.renderGrowth(),
      github: () => this.renderGitHub(),
      jobs: () => this.renderJobs(),
      notifications: () => this.renderNotifications(),
      settings: () => this.renderSettings(),
      'resume-themes': () => this.renderResumeThemes()
    };
    return (renderers[section] || renderers.overview)();
  },

  async renderOverview() {
    let learning = { score: 78 }, apps = { applications: [] }, recs = { recommendations: [] };
    try {
      [learning, apps, recs] = await Promise.all([
        API.getLearningScore().catch(() => learning),
        API.getApplications().catch(() => apps),
        API.getJobRecommendations().catch(() => recs)
      ]);
    } catch (_) { }

    return `
      <div class="page-header"><h2>Dashboard</h2><p class="text-secondary">Welcome back, ${this.user?.name}</p></div>
      <div class="grid grid-4 gap-4 mb-6 stagger">
        ${UI.statCard('Resume Score', '87', '+5% this week', true)}
        ${UI.statCard('Applications', apps.applications?.length || 0, '2 pending')}
        ${UI.statCard('Learning Score', learning.score || 78, '+3% this month', true)}
        ${UI.statCard('Skill Match', '92%', 'Top 15%', true)}
      </div>
      <div class="grid grid-2 gap-6 mt-6">
        <!-- LinkedIn Dashboard Card -->
        <div class="card glass-card hover-lift animate-fade-in" style="padding: 24px; position: relative; overflow: hidden; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid var(--border-color);">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-2">
              <span style="font-size: 20px; font-weight: 700; color: #0077B5; font-family: 'Inter', sans-serif; display: flex; align-items: center; gap: 6px;">
                <span style="background: #0077B5; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 14px;">in</span> LinkedIn
              </span>
              ${this.user?.linkedinConnected ? '<span class="badge badge-success" style="font-size: 10px; display: flex; align-items: center; gap: 4px;">✓ Connected</span>' : '<span class="badge badge-secondary" style="font-size: 10px;">Not Connected</span>'}
            </div>
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 500;">OAuth 2.0 Connected</div>
          </div>
          
          <div class="flex items-center gap-4 mb-4">
            ${this.user?.linkedinConnected && this.user?.linkedinProfilePicture ? `
              <img src="${this.user.linkedinProfilePicture}" style="width: 64px; height: 64px; border-radius: 50%; border: 2px solid #0077B5; object-fit: cover;">
            ` : `
              <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text-muted);">👤</div>
            `}
            <div>
              <h4 style="margin: 0; font-size: 16px; display: flex; align-items: center; gap: 4px;">
                ${this.user?.linkedinConnected ? (this.user?.linkedinName || this.user?.name) : 'Guest Candidate'}
                ${this.user?.linkedinConnected ? '<span class="text-success" title="Verified Account">✔</span>' : ''}
              </h4>
              <div class="text-xs text-secondary" style="margin-top: 2px;">${this.user?.linkedinConnected ? this.user?.linkedinEmail : (this.user?.email || '')}</div>
              <div class="text-xs text-muted" style="margin-top: 4px;">
                Account Status: ${this.user?.linkedinConnected ? '<span class="text-success" style="font-weight: 600;">Active Link</span>' : '<span class="text-secondary">Inactive</span>'}
              </div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px; font-size: 11px; color: var(--text-secondary);" class="flex justify-between items-center">
            <span>Last Synced: <strong>${this.user?.lastLinkedInSync ? new Date(this.user.lastLinkedInSync).toLocaleString() : 'Never'}</strong></span>
            <div class="flex gap-1">
              ${this.user?.linkedinConnected ? `
                <button class="btn btn-secondary btn-xs" id="disconnect-linkedin-dash-btn">Disconnect</button>
                <button class="btn btn-secondary btn-xs" id="reconnect-linkedin-dash-btn">Reconnect</button>
                <button class="btn btn-primary btn-xs" id="sync-linkedin-dash-btn">Sync Again</button>
              ` : `
                <button class="btn btn-primary btn-xs" id="connect-linkedin-dash-btn">Connect LinkedIn</button>
              `}
            </div>
          </div>
        </div>

        <!-- AI Candidate Summary Card -->
        <div class="card glass-card hover-lift animate-fade-in" style="padding: 24px; background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid var(--border-color);">
          <h3 class="mb-3" style="display: flex; align-items: center; gap: 8px; font-size: 15px;">🤖 AI Executive Profile Summary</h3>
          <div class="p-3 rounded" style="background: rgba(37,99,235,0.05); border: 1px solid rgba(37,99,235,0.12); font-size: 12.5px; line-height: 1.6; color: var(--text-color);">
            ${this.user?.linkedinConnected ? `
              Software engineering candidate connected through LinkedIn.<br>
              Profile synchronization completed successfully.<br>
              Ready for recruiter review.
            ` : `
              Please connect your LinkedIn profile to synthesize a tailored AI candidate summary for recruiter evaluation.
            `}
          </div>
          <div class="text-xs text-muted mt-3" style="font-size: 10px;">Generated automatically on every profile sync checkpoint.</div>
        </div>
      </div>

      <div class="card mt-6">
        <h3 class="mb-4">Recommended Jobs</h3>
        ${(recs.recommendations || []).map(j => `
          <div class="leaderboard-item">
            <div><strong>${j.title}</strong><div class="text-sm text-muted">${j.company}</div></div>
            <span class="badge badge-primary">${j.match}% match</span>
          </div>
        `).join('') || UI.emptyState('💼', 'No recommendations yet', 'Complete your profile to get personalized job matches')}
      </div>`;
  },

  renderProfile() {
    const ghConnected = this.user?.githubConnected;
    const liConnected = this.user?.linkedinConnected;
    const googleConnected = this.user?.googleConnected;

    return `
      <div class="page-header"><h2>Profile</h2><p class="text-secondary">Manage your personal information</p></div>
      <div class="grid grid-2 gap-6">
        <div class="card">
          <form id="profile-form">
            <div class="grid grid-2 gap-4">
              <div class="form-group"><label class="form-label">Name</label><input class="form-input" name="name" value="${this.user?.name || ''}"></div>
              <div class="form-group"><label class="form-label">Email</label><input class="form-input" value="${this.user?.email || ''}" disabled></div>
              <div class="form-group"><label class="form-label">Phone</label><input class="form-input" name="phone" placeholder="+1-555-0100" value="${this.user?.phone || ''}"></div>
              <div class="form-group"><label class="form-label">Location</label><input class="form-input" name="location" placeholder="City, Country" value="${this.user?.location || ''}"></div>
            </div>
            <div class="form-group"><label class="form-label">Bio</label><textarea class="form-textarea" name="bio" placeholder="Tell us about yourself">${this.user?.bio || ''}</textarea></div>
            <div class="form-group"><label class="form-label">Skills (comma separated)</label><input class="form-input" name="skills" placeholder="JavaScript, React, Node.js" value="${this.user?.skills?.join(', ') || ''}"></div>
            <button type="submit" class="btn btn-primary">Save Profile</button>
          </form>
        </div>

        <div class="card">
          <h3 class="mb-4">Connected Accounts</h3>
          <div class="flex flex-col gap-4">
            
            <!-- GitHub Account -->
            <div class="flex justify-between items-center p-3 rounded" style="background:var(--bg-secondary); border: 1px solid var(--border-color)">
              <div class="flex items-center gap-3">
                ${UI.getIcon('🐙', 'candidate', '28px')}
                <div>
                  <strong>GitHub</strong>
                  <div class="text-sm text-secondary">${ghConnected ? 'Connected' : 'Not Connected'}</div>
                </div>
              </div>
              <div>
                ${ghConnected ? `
                  <button class="btn btn-secondary btn-sm" id="disconnect-github-btn">Disconnect</button>
                ` : `
                  <button class="btn btn-primary btn-sm" id="connect-github-btn">Connect</button>
                `}
              </div>
            </div>

            <!-- LinkedIn Account Card -->
            <div class="card p-5 rounded animate-fade-in" style="background:var(--bg-secondary); border: 1px solid var(--border-color);">
              <h3 class="mb-4" style="display: flex; align-items: center; justify-content: space-between; font-size: 1.1rem;">
                LinkedIn Connection
                ${liConnected ? '<span class="badge badge-success">✓ Connected</span>' : '<span class="badge badge-secondary">Not Connected</span>'}
              </h3>
              
              <div class="flex items-center gap-4 mb-4">
                ${liConnected && this.user?.linkedinProfilePicture ? `
                  <img src="${this.user.linkedinProfilePicture}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--primary-color); object-fit: cover;">
                ` : `
                  <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 32px; color: var(--primary-color);">👤</div>
                `}
                <div class="flex-1">
                  <table style="width: 100%; border-collapse: collapse; font-size: 12px;" class="text-secondary">
                    <tr><td style="padding: 2px 0;"><strong>Full Name:</strong></td><td>${this.user?.linkedinName || 'N/A'}</td></tr>
                    <tr><td style="padding: 2px 0;"><strong>Email:</strong></td><td>${this.user?.linkedinEmail || 'N/A'}</td></tr>
                    <tr><td style="padding: 2px 0;"><strong>LinkedIn ID:</strong></td><td>${this.user?.linkedinId || 'N/A'}</td></tr>
                    <tr><td style="padding: 2px 0;"><strong>Status:</strong></td><td>${liConnected ? 'Connected' : 'Disconnected'}</td></tr>
                    <tr><td style="padding: 2px 0;"><strong>Last Sync:</strong></td><td>${this.user?.lastLinkedInSync ? new Date(this.user.lastLinkedInSync).toLocaleString() : 'Never'}</td></tr>
                  </table>
                </div>
              </div>

              <!-- Public Profile Link edit and button -->
              <div class="form-group mt-3" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
                <label class="form-label text-sm">Public LinkedIn Profile URL</label>
                <div class="flex gap-2">
                  <input class="form-input" id="profile-linkedin-public-url" placeholder="https://www.linkedin.com/in/yourname" value="${this.user?.linkedinProfileUrl || ''}">
                  <button class="btn btn-secondary btn-sm" id="save-linkedin-url-profile-btn" style="white-space: nowrap;">Save Link</button>
                </div>
              </div>

              <div class="flex justify-between items-center mt-4">
                <div>
                  ${this.user?.linkedinProfileUrl ? `
                    <a href="${this.user.linkedinProfileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">View LinkedIn Profile</a>
                  ` : `
                    <button class="btn btn-primary btn-sm" disabled title="No public LinkedIn profile URL available.">No public LinkedIn profile URL available.</button>
                  `}
                </div>
                <div>
                  ${liConnected ? `
                    <button class="btn btn-secondary btn-sm" id="disconnect-linkedin-btn">Disconnect</button>
                  ` : `
                    <button class="btn btn-primary btn-sm" id="connect-linkedin-btn">Connect LinkedIn</button>
                  `}
                </div>
              </div>
            </div>

            <!-- Candidate Email Status -->
            <div class="flex justify-between items-center p-3 rounded" style="background:var(--bg-secondary); border: 1px solid var(--border-color)">
              <div class="flex items-center gap-3">
                ${UI.getIcon('📧', 'candidate', '28px')}
                <div>
                  <strong>Email Address</strong>
                  <div class="text-sm text-secondary">${this.user?.email || ''}</div>
                  <div class="text-xs text-muted">${this.user?.emailVerified || this.user?.isVerified ? '✅ Email Verified' : '❌ Email Not Verified'}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>`;
  },

  renderResume() {
    const liConnected = this.user?.linkedinConnected;
    return `
      <div class="page-header"><h2>Resume</h2><p class="text-secondary">Upload and manage your resumes</p></div>
      <div class="grid grid-2 gap-6">
        <div class="card">${UI.uploadZone('resume-upload')}</div>
        <div class="card" id="resume-list"><h3 class="mb-4">Your Resumes</h3><div class="spinner"></div></div>
      </div>
      ${liConnected ? `
        <div class="card mt-6 animate-fade-in" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 24px;">
          <h3 class="mb-4" style="display: flex; align-items: center; justify-content: space-between;">
            LinkedIn Profile Integration
            <span class="badge badge-success">✓ Connected</span>
          </h3>
          
          <div class="flex items-center gap-4 mb-4">
            ${this.user.linkedinProfilePicture ? `
              <img src="${this.user.linkedinProfilePicture}" style="width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--primary-color); object-fit: cover;">
            ` : `
              <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--primary-color);">👤</div>
            `}
            <div class="flex-1 grid grid-3 gap-2 text-sm text-secondary">
              <div><strong>LinkedIn Name:</strong> ${this.user.linkedinName || 'N/A'}</div>
              <div><strong>Email:</strong> ${this.user.linkedinEmail || 'N/A'}</div>
              <div><strong>Sync Status:</strong> ${this.user.lastLinkedInSync ? `Synced on ${new Date(this.user.lastLinkedInSync).toLocaleDateString()}` : 'Never'}</div>
            </div>
          </div>

          <div class="form-group mt-3" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
            <label class="form-label text-sm">Public LinkedIn Profile URL</label>
            <div class="flex gap-2">
              <input class="form-input" id="resume-linkedin-public-url" placeholder="https://www.linkedin.com/in/yourname" value="${this.user.linkedinProfileUrl || ''}">
              <button class="btn btn-primary btn-sm" id="save-linkedin-url-resume-btn" style="white-space: nowrap;">Save URL</button>
            </div>
          </div>

          <div class="mt-4">
            ${this.user.linkedinProfileUrl ? `
              <a href="${this.user.linkedinProfileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">View Profile</a>
            ` : `
              <button class="btn btn-secondary btn-sm" disabled>No public LinkedIn profile URL available.</button>
            `}
          </div>
        </div>
      ` : ''}
    `;
  },

  async renderApplications() {
    let apps = [];
    try { const data = await API.getApplications(); apps = data.applications || []; } catch (_) { }

    return `
      <div class="page-header"><h2>Applications</h2><p class="text-secondary">Track your job applications</p></div>
      <div class="card">
        ${apps.length ? UI.table(
      ['Job', 'Status', 'AI Score', 'Skill Match', 'Date'],
      apps.map(a => [
        a.job?.title || 'N/A',
        UI.badge(a.status, a.status === 'shortlisted' ? 'success' : 'primary'),
        `${a.aiScore || 0}%`,
        `${a.skillMatch || 0}%`,
        new Date(a.createdAt).toLocaleDateString()
      ])
    ) : UI.emptyState('📋', 'No applications yet', 'Browse jobs and apply to get started', '<a href="#/candidate/jobs" class="btn btn-primary">Find Jobs</a>')}
      </div>`;
  },

  renderResumeAI() {
    return `
      <div class="page-header"><h2>Resume AI</h2><p class="text-secondary">AI-powered resume tools</p></div>
      <div class="grid grid-3 gap-4 mb-6">
        <button class="card hover-lift text-center" data-ai-action="simulate"><div style="display:flex; justify-content:center; align-items:center; height:32px; margin-bottom:8px;">${UI.getIcon('🎯', 'candidate', '28px')}</div><h4 class="mt-2">Resume Simulation</h4><p class="text-sm text-muted">Test against hiring scenarios</p></button>
        <button class="card hover-lift text-center" data-ai-action="dynamic"><div style="display:flex; justify-content:center; align-items:center; height:32px; margin-bottom:8px;">${UI.getIcon('✨', 'candidate', '28px')}</div><h4 class="mt-2">Dynamic Resume</h4><p class="text-sm text-muted">Tailor for specific jobs</p></button>
        <button class="card hover-lift text-center" data-ai-action="improve"><div style="display:flex; justify-content:center; align-items:center; height:32px; margin-bottom:8px;">${UI.getIcon('📈', 'candidate', '28px')}</div><h4 class="mt-2">Improvement Report</h4><p class="text-sm text-muted">Get actionable feedback</p></button>
      </div>
      <div class="card" id="resume-ai-result"><p class="text-secondary">Select an action above to run AI analysis</p></div>`;
  },

  renderAssessments() {
    return `
      <style>
        .ide-wrapper {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .ide-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: #252526;
          border-bottom: 1px solid #3c3c3c;
        }
        .ide-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .ide-sidebar {
          width: 260px;
          background: #252526;
          border-right: 1px solid #3c3c3c;
          display: flex;
          flex-direction: column;
          font-size: 13px;
        }
        .sidebar-title {
          padding: 8px 12px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 1px;
          color: #858585;
          border-bottom: 1px solid #3c3c3c;
        }
        .repo-select-container {
          padding: 8px;
          border-bottom: 1px solid #3c3c3c;
        }
        .repo-select, .branch-select {
          width: 100%;
          background: #3c3c3c;
          color: #ccc;
          border: 1px solid #6b6b6b;
          border-radius: 4px;
          padding: 4px;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .file-search-container {
          padding: 8px;
          border-bottom: 1px solid #3c3c3c;
        }
        .file-search {
          width: 100%;
          background: #3c3c3c;
          color: #fff;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .file-tree {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        .file-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          cursor: pointer;
          border-radius: 4px;
          user-select: none;
        }
        .file-item:hover {
          background: #2a2d2e;
        }
        .file-item.active {
          background: #37373d;
          color: #fff;
        }
        .ide-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #1e1e1e;
        }
        .ide-tabs {
          display: flex;
          background: #2d2d2d;
          border-bottom: 1px solid #3c3c3c;
          overflow-x: auto;
        }
        .ide-tab {
          padding: 8px 16px;
          cursor: pointer;
          border-right: 1px solid #3c3c3c;
          background: #2d2d2d;
          font-size: 12px;
          color: #969696;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ide-tab.active {
          background: #1e1e1e;
          color: #fff;
          border-bottom: 2px solid var(--primary-color);
        }
        .breadcrumb-bar {
          padding: 6px 16px;
          background: #1e1e1e;
          border-bottom: 1px solid #2d2d2d;
          font-size: 11px;
          color: #858585;
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .monaco-container {
          flex: 1;
          position: relative;
        }
        .readme-container {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background: #1e1e1e;
          color: #e1e4e8;
          line-height: 1.6;
        }
        .readme-container h1, .readme-container h2, .readme-container h3 {
          border-bottom: 1px solid #2d2d2d;
          padding-bottom: 8px;
          margin-top: 24px;
          color: #fff;
        }
        .readme-container pre {
          background: #2d2d2d;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
        }
        .intelligence-container {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background: #18181c;
        }
        .viz-container {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background: #18181c;
        }
        .ide-right-sidebar {
          width: 320px;
          background: #252526;
          border-left: 1px solid #3c3c3c;
          display: flex;
          flex-direction: column;
        }
        .assistant-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .msg {
          padding: 8px 12px;
          border-radius: 8px;
          max-width: 85%;
          font-size: 12.5px;
          line-height: 1.4;
        }
        .msg.user {
          background: var(--primary-color);
          color: #fff;
          align-self: flex-end;
        }
        .msg.assistant {
          background: #2d2d2d;
          color: #e1e4e8;
          align-self: flex-start;
          border: 1px solid #3c3c3c;
        }
        .assistant-presets {
          padding: 8px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
          border-top: 1px solid #3c3c3c;
          background: #1e1e1f;
        }
        .preset-btn {
          background: #2d2d2d;
          border: 1px solid #3c3c3c;
          color: #ccc;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          text-align: left;
        }
        .preset-btn:hover {
          background: #37373d;
          color: #fff;
        }
        .assistant-input-container {
          padding: 8px;
          display: flex;
          gap: 6px;
          border-top: 1px solid #3c3c3c;
          background: #252526;
        }
        .assistant-input {
          flex: 1;
          background: #3c3c3c;
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
        }
        .assistant-send {
          background: var(--primary-color);
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .badge-score {
          background: rgba(37,99,235,0.15);
          color: #3b82f6;
          border: 1px solid rgba(37,99,235,0.3);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 11px;
        }
      </style>
      <div class="page-header flex justify-between items-center">
        <div>
          <h2>AI Project Workspace</h2>
          <p class="text-secondary">Inspect repository code with integrated technical copilot and visualizations</p>
        </div>
      </div>
      <div class="ide-wrapper">
        <div class="ide-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="color:var(--primary-color); font-weight:700;">💻 Project IDE</div>
            <div id="ide-breadcrumb" style="font-size:12px; color:#858585;">Select file</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn btn-secondary btn-xs" id="toggle-edit-mode">Mode: Read Only</button>
            <button class="btn btn-secondary btn-xs" id="toggle-minimap">Toggle Minimap</button>
            <button class="btn btn-primary btn-xs" id="refresh-repo-btn">Sync Repo</button>
          </div>
        </div>
        <div class="ide-body">
          <!-- Left Explorer Sidebar -->
          <div class="ide-sidebar">
            <div class="sidebar-title">Repository Explorer</div>
            <div class="repo-select-container">
              <label style="font-size:10px; color:#858585; display:block; margin-bottom:2px;">Target Repository</label>
              <select class="repo-select" id="workspace-repo-select">
                <option value="">No Repositories Connected</option>
              </select>
              <select class="branch-select" id="workspace-branch-select">
                <option value="main">branch: main</option>
                <option value="master">branch: master</option>
              </select>
            </div>
            <div class="file-search-container">
              <input class="file-search" id="workspace-file-search" placeholder="Search files...">
            </div>
            <div class="file-tree" id="workspace-file-tree">
              <div class="text-center text-muted py-4">Select a repository to explore</div>
            </div>
          </div>

          <!-- Center Workspace -->
          <div class="ide-content">
            <div class="ide-tabs">
              <div class="ide-tab active" data-tab="editor">📝 Code Editor</div>
              <div class="ide-tab" data-tab="readme">📄 README.md</div>
              <div class="ide-tab" data-tab="intelligence">🤖 Repository Intelligence</div>
              <div class="ide-tab" data-tab="visualizations">🕸️ Project Visualization</div>
            </div>
            
            <!-- Code Editor Frame -->
            <div class="workspace-panel-tab" id="panel-editor" style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
              <div class="breadcrumb-bar" id="editor-breadcrumb">
                <span>workspace</span> <span style="color:#858585;">&gt;</span> <span>select file</span>
              </div>
              <div class="monaco-container" id="monaco-editor-container" style="height:100%;"></div>
            </div>

            <!-- README.md Frame -->
            <div class="workspace-panel-tab" id="panel-readme" style="display:none; flex:1; overflow:hidden;">
              <div class="readme-container" id="readme-preview-content">
                <h3>README.md Preview</h3>
                <p class="text-secondary">Please select a repository containing a README file.</p>
              </div>
            </div>

            <!-- Repository Intelligence Frame -->
            <div class="workspace-panel-tab" id="panel-intelligence" style="display:none; flex:1; overflow:hidden;">
              <div class="intelligence-container" id="intelligence-content">
                <div class="text-center py-5"><div class="spinner"></div><p class="mt-2 text-secondary">Analyzing project intelligence...</p></div>
              </div>
            </div>

            <!-- Visualizations Frame -->
            <div class="workspace-panel-tab" id="panel-visualizations" style="display:none; flex:1; overflow:hidden;">
              <div class="viz-container">
                <div class="mb-4 flex gap-2">
                  <button class="btn btn-secondary btn-sm active" data-viz-type="architecture">Architecture</button>
                  <button class="btn btn-secondary btn-sm" data-viz-type="database">Database schema</button>
                  <button class="btn btn-secondary btn-sm" data-viz-type="dependency">Dependencies</button>
                  <button class="btn btn-secondary btn-sm" data-viz-type="flow">API Flow</button>
                  <button class="btn btn-secondary btn-sm" data-viz-type="mindmap">Mind Map</button>
                </div>
                <div id="mermaid-viz-container" style="background:#1e1e1e; padding:20px; border-radius:8px; border:1px solid #3c3c3c; display:flex; justify-content:center;">
                  <div class="mermaid" id="mermaid-canvas"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Sidebar AI assistant -->
          <div class="ide-right-sidebar">
            <div class="sidebar-title" style="display:flex; justify-content:space-between; align-items:center;">
              <span>AI Knowledge Assistant</span>
              <span class="badge-score" id="ide-technical-score">Score: --</span>
            </div>
            <div class="assistant-messages" id="workspace-chat-messages">
              <div class="msg assistant">
                Hello! I am your Project Knowledge Assistant. I can help explain the architecture, security, authentication flow, or database schemas of your selected project. Select a preset question below or ask anything.
              </div>
            </div>
            <div class="assistant-presets">
              <button class="preset-btn" data-q="Explain this project.">💡 Explain this project.</button>
              <button class="preset-btn" data-q="Explain MongoDB schema.">🗄️ Explain database model.</button>
              <button class="preset-btn" data-q="Explain JWT implementation.">🔑 Explain authentication flow.</button>
              <button class="preset-btn" data-q="Generate interview questions from this project.">🎯 Generate interview questions.</button>
            </div>
            <div class="assistant-input-container">
              <input class="assistant-input" id="workspace-chat-input" placeholder="Ask about project code...">
              <button class="assistant-send" id="workspace-chat-send">Send</button>
            </div>
          </div>
        </div>
      </div>`;
  },

  renderInterview() {
    return `
      <div class="page-header"><h2>Interview Preparation</h2><p class="text-secondary">AI-generated interview questions</p></div>
      <div class="card mb-4">
        <div class="flex gap-4">
          <input class="form-input" id="interview-role" placeholder="Target role (e.g. Senior Developer)">
          <button class="btn btn-primary" id="gen-questions">Generate Questions</button>
        </div>
      </div>
      <div class="card" id="interview-questions"><p class="text-secondary">Click generate to create personalized interview questions</p></div>`;
  },

  renderAIAssistant() {
    return `
      <div class="page-header"><h2>AI Assistant</h2><p class="text-secondary">Your personal career AI helper</p></div>
      ${UI.aiChat('candidate-chat')}`;
  },

  renderRoadmap() {
    return `
      <div class="page-header flex justify-between items-center">
        <div><h2>Career Roadmap</h2><p class="text-secondary">Visual interactive career path</p></div>
        <span class="badge badge-primary" id="roadmap-progress">Loading...</span>
      </div>
      <div class="roadmap-container" id="roadmap-viz"></div>
      <div class="grid grid-3 gap-4 mt-6">
        <div class="card"><h4>Skill Gaps</h4><div id="skill-gaps" class="mt-4"><div class="spinner"></div></div></div>
        <div class="card"><h4>Goals</h4><div id="roadmap-goals" class="mt-4"></div></div>
        <div class="card"><h4>Roadmap Analysis</h4><div id="roadmap-analysis" class="mt-4"><div class="spinner"></div></div></div>
      </div>`;
  },

  renderLearning() {
    return `
      <div class="page-header"><h2>Learning Progress</h2><p class="text-secondary">Continuous learning score and roadmap</p></div>
      <div class="grid grid-4 gap-4 mb-6" id="learning-stats"></div>
      <div class="card chart-container"><h3 class="mb-4">Learning Roadmap</h3><div class="chart-wrapper"><canvas id="learning-roadmap-chart"></canvas></div></div>
      <div class="card mt-6" id="learning-modules"></div>`;
  },

  async renderLeaderboard() {
    let data = { leaderboard: [] };
    try { data = await API.getLeaderboard(); } catch (_) { }

    return `
      <div class="page-header"><h2>Career Leaderboard</h2><p class="text-secondary">See how you rank among peers</p></div>
      <div class="card">
        ${(data.leaderboard || []).map(item => `
          <div class="leaderboard-item">
            <span class="leaderboard-rank ${item.rank <= 3 ? 'top' : ''}">#${item.rank}</span>
            ${UI.avatar(item.name)}
            <div><strong>${item.name}</strong></div>
            <span class="leaderboard-score">${item.score}</span>
            <span class="badge badge-success">${item.growth}</span>
          </div>
        `).join('')}
      </div>`;
  },

  async renderBenchmarks() {
    return `
      <div class="page-header"><h2>Benchmark Comparison</h2><p class="text-secondary">Compare yourself to industry averages</p></div>
      <div class="card chart-container"><div class="chart-wrapper"><canvas id="benchmark-chart"></canvas></div></div>`;
  },

  async renderGrowth() {
    return `
      <div class="page-header"><h2>Career Growth Prediction</h2><p class="text-secondary">AI-powered career trajectory forecast</p></div>
      <div id="growth-predictions" class="grid grid-3 gap-4"></div>
      <div class="card chart-container mt-6"><h3 class="mb-4">Growth Timeline</h3><div class="chart-wrapper"><canvas id="growth-chart"></canvas></div></div>`;
  },

  renderGitHub() {
    return `
      <div class="page-header flex justify-between items-center">
        <div><h2>GitHub Dashboard</h2><p class="text-secondary">Repository analysis and portfolio score</p></div>
        <button class="btn btn-primary" id="connect-github">Connect GitHub</button>
      </div>
      <div class="grid grid-4 gap-4 mb-6" id="github-stats"></div>
      <div class="grid grid-2 gap-6 mb-6">
        <div class="card chart-container"><h3 class="mb-4">Languages</h3><div class="chart-wrapper"><canvas id="github-lang-chart"></canvas></div></div>
        <div class="card" id="github-repos"><h3 class="mb-4">Top Repositories</h3><div class="spinner"></div></div>
      </div>
      <div id="github-ai-insights"></div>`;
  },

  async renderJobs() {
    let recs = { recommendations: [] };
    try { recs = await API.getJobRecommendations(); } catch (_) { }

    return `
      <div class="page-header"><h2>Job Recommendations</h2><p class="text-secondary">AI-matched opportunities for you</p></div>
      <div class="grid grid-2 gap-4">
        ${(recs.recommendations || []).map(j => `
          <div class="glass-card p-6 hover-lift">
            <div class="flex justify-between items-center mb-2">
              <h3>${j.title}</h3>
              <span class="badge badge-primary">${j.match}% match</span>
            </div>
            <p class="text-secondary">${j.company}</p>
            <button class="btn btn-primary btn-sm mt-4">View & Apply</button>
          </div>
        `).join('') || UI.emptyState('💼', 'No matches found', 'Update your skills to get better recommendations')}
      </div>`;
  },

  async renderNotifications() {
    let data = { notifications: [] };
    try { data = await API.getNotifications(); } catch (_) { }

    return `
      <div class="page-header"><h2>Notifications</h2></div>
      <div class="card">
        ${(data.notifications || []).map(n => `
          <div class="leaderboard-item ${n.isRead ? '' : ''}" style="cursor:pointer" data-notif-id="${n._id}">
            <div>
              <strong>${n.title}</strong>
              <p class="text-sm text-secondary">${n.message}</p>
              <span class="text-xs text-muted">${new Date(n.createdAt).toLocaleString()}</span>
            </div>
            ${!n.isRead ? '<span class="badge badge-primary">New</span>' : ''}
          </div>
        `).join('') || UI.emptyState('🔔', 'No notifications', 'You\'re all caught up!')}
      </div>`;
  },

  renderSettings() {
    return `
      <div class="page-header"><h2>Settings</h2><p class="text-secondary">Account preferences</p></div>
      <div class="card">
        <h3 class="mb-4">Preferences</h3>
        <div class="flex items-center justify-between mb-4">
          <div><strong>Dark Mode</strong><p class="text-sm text-muted">Toggle dark theme</p></div>
          <div class="toggle-switch" id="settings-dark-toggle"></div>
        </div>
        <div class="flex items-center justify-between mb-4">
          <div><strong>Email Notifications</strong><p class="text-sm text-muted">Receive email updates</p></div>
          <div class="toggle-switch active"></div>
        </div>
        <div class="flex items-center justify-between">
          <div><strong>In-App Notifications</strong><p class="text-sm text-muted">Real-time alerts</p></div>
          <div class="toggle-switch active"></div>
        </div>
      </div>`;
  },

  bind() {
    UI.bindDashboardEvents((section) => {
      window.location.hash = `#/candidate/${section}`;
    });

    // Profile form
    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      try {
        const data = await API.updateProfile({
          name: form.get('name'),
          phone: form.get('phone'),
          location: form.get('location'),
          bio: form.get('bio'),
          skills: form.get('skills')?.split(',').map(s => s.trim()).filter(Boolean)
        });
        API.setUser(data.user);
        UI.toast('Profile updated', 'success');
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    // Resume upload
    UI.bindUploadZone('resume-upload', async (file) => {
      const fd = new FormData();
      fd.append('resume', file);
      try {
        const res = await API.uploadResume(fd);
        if (res && res.resume && res.resume._id) {
          localStorage.setItem('activeResumeId', res.resume._id);
        }
        UI.toast('Resume uploaded and parsed!', 'success');
        this.loadResumes();
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    if (this.section === 'resume') {
      this.loadResumes();
      document.getElementById('save-linkedin-url-resume-btn')?.addEventListener('click', async () => {
        let url = document.getElementById('resume-linkedin-public-url')?.value || '';
        url = url.trim();
        if (url) {
          if (url.startsWith('linkedin.com')) {
            url = 'https://www.' + url;
          } else if (url.startsWith('www.linkedin.com')) {
            url = 'https://' + url;
          } else if (url.startsWith('http://linkedin.com') || url.startsWith('http://www.linkedin.com')) {
            url = url.replace('http://', 'https://');
          }
          const isValid = url.startsWith('https://www.linkedin.com/in/') || url.startsWith('https://linkedin.com/in/');
          if (!isValid) {
            return UI.toast('Please enter a valid LinkedIn profile URL.', 'error');
          }
        }
        try {
          await API.put('/auth/profile', { linkedinProfileUrl: url });
          UI.toast('Public LinkedIn URL saved!', 'success');
          const data = await API.getMe();
          if (data && data.user) API.setUser(data.user);
          const html = await this.render('resume');
          document.getElementById('app').innerHTML = html;
          this.bind();
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    }
    if (this.section === 'overview') {
      this.loadOverviewCharts();
      
      document.getElementById('connect-linkedin-dash-btn')?.addEventListener('click', () => {
        window.location.href = `/api/auth/linkedin?token=${API.token}`;
      });
      document.getElementById('reconnect-linkedin-dash-btn')?.addEventListener('click', () => {
        window.location.href = `/api/auth/linkedin?token=${API.token}`;
      });
      
      document.getElementById('disconnect-linkedin-dash-btn')?.addEventListener('click', async () => {
        try {
          await API.post('/auth/linkedin/disconnect');
          UI.toast('LinkedIn account disconnected', 'success');
          const data = await API.getMe();
          if (data && data.user) API.setUser(data.user);
          const html = await this.render('overview');
          document.getElementById('app').innerHTML = html;
          this.bind();
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      document.getElementById('sync-linkedin-dash-btn')?.addEventListener('click', async (e) => {
        e.target.disabled = true;
        e.target.textContent = 'Syncing...';
        try {
          await API.post('/auth/linkedin/sync');
          UI.toast('LinkedIn profile synced successfully!', 'success');
          const data = await API.getMe();
          if (data && data.user) API.setUser(data.user);
          const html = await this.render('overview');
          document.getElementById('app').innerHTML = html;
          this.bind();
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          e.target.disabled = false;
          e.target.textContent = 'Sync Again';
        }
      });
    }
    if (this.section === 'profile') {
      document.getElementById('save-linkedin-url-profile-btn')?.addEventListener('click', async () => {
        let url = document.getElementById('profile-linkedin-public-url')?.value || '';
        url = url.trim();
        if (url) {
          if (url.startsWith('linkedin.com')) {
            url = 'https://www.' + url;
          } else if (url.startsWith('www.linkedin.com')) {
            url = 'https://' + url;
          } else if (url.startsWith('http://linkedin.com') || url.startsWith('http://www.linkedin.com')) {
            url = url.replace('http://', 'https://');
          }
          const isValid = url.startsWith('https://www.linkedin.com/in/') || url.startsWith('https://linkedin.com/in/');
          if (!isValid) {
            return UI.toast('Please enter a valid LinkedIn profile URL.', 'error');
          }
        }
        try {
          await API.put('/auth/profile', { linkedinProfileUrl: url });
          UI.toast('Public LinkedIn URL saved!', 'success');
          const data = await API.getMe();
          if (data && data.user) API.setUser(data.user);
          const html = await this.render('profile');
          document.getElementById('app').innerHTML = html;
          this.bind();
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    }
    if (this.section === 'roadmap') this.loadRoadmap();
    if (this.section === 'learning') this.loadLearning();
    if (this.section === 'benchmarks') this.loadBenchmarks();
    if (this.section === 'growth') this.loadGrowth();
    if (this.section === 'github') this.loadGitHub();
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
    }

    // AI Assistant
    UI.bindAIChat('candidate-chat', async (text) => {
      const data = await API.candidateAI('interview-prep', { query: text });
      return data.response;
    });

    // Resume AI actions
    document.querySelectorAll('[data-ai-action]').forEach(btn => {
      btn.addEventListener('click', () => this.runResumeAI(btn.dataset.aiAction));
    });

    // ==========================================
    // AI PROJECT WORKSPACE EVENT BINDINGS
    // ==========================================
    if (this.section === 'assessments') {
      let selectedRepo = '';
      let fileTreeData = [];
      let activeFile = '';
      let isEditMode = false;
      let isMinimapEnabled = true;

      // Monaco Initializer function
      const initMonaco = () => {
        const container = document.getElementById('monaco-editor-container');
        if (!container) return;
        
        container.innerHTML = ''; // Clear spinner
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          window.workspaceEditor = monaco.editor.create(container, {
            value: '// Select a file from the Repository Explorer on the left to load code contents.',
            language: 'javascript',
            theme: isDark ? 'vs-dark' : 'vs',
            readOnly: !isEditMode,
            minimap: { enabled: isMinimapEnabled },
            automaticLayout: true,
            fontSize: 13,
            tabSize: 2
          });
        });
      };

      // Load Monaco Editor
      initMonaco();

      // Toggle edit mode
      document.getElementById('toggle-edit-mode')?.addEventListener('click', (e) => {
        isEditMode = !isEditMode;
        e.target.textContent = isEditMode ? 'Mode: Edit Mode' : 'Mode: Read Only';
        e.target.className = isEditMode ? 'btn btn-primary btn-xs' : 'btn btn-secondary btn-xs';
        if (window.workspaceEditor) {
          window.workspaceEditor.updateOptions({ readOnly: !isEditMode });
        }
      });

      // Toggle minimap
      document.getElementById('toggle-minimap')?.addEventListener('click', () => {
        isMinimapEnabled = !isMinimapEnabled;
        if (window.workspaceEditor) {
          window.workspaceEditor.updateOptions({ minimap: { enabled: isMinimapEnabled } });
        }
      });

      // Tab switcher binding
      document.querySelectorAll('.ide-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.ide-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          document.querySelectorAll('.workspace-panel-tab').forEach(p => p.style.display = 'none');
          const panelId = `panel-${tab.dataset.tab}`;
          const panel = document.getElementById(panelId);
          if (panel) panel.style.display = 'flex';

          if (tab.dataset.tab === 'intelligence') {
            loadRepositoryIntelligence();
          } else if (tab.dataset.tab === 'visualizations') {
            loadVisualizations('architecture');
          }
        });
      });

      // Render folder tree file structure
      const renderFileTree = (files) => {
        const treeContainer = document.getElementById('workspace-file-tree');
        if (!treeContainer) return;
        if (files.length === 0) {
          treeContainer.innerHTML = '<div class="text-center text-muted py-4">No files found</div>';
          return;
        }

        treeContainer.innerHTML = files.map(file => {
          const depth = file.path.split('/').length - 1;
          const isDir = file.type === 'tree';
          const icon = isDir ? '📁' : '📄';
          return `
            <div class="file-item" data-path="${file.path}" data-type="${file.type}" style="padding-left: ${8 + depth * 12}px;">
              <span>${icon}</span>
              <span class="file-name">${file.path.split('/').pop()}</span>
            </div>
          `;
        }).join('');

        // Bind clicks on file items
        document.querySelectorAll('.file-item').forEach(item => {
          item.addEventListener('click', async () => {
            const path = item.dataset.path;
            const type = item.dataset.type;
            if (type === 'tree') return; // Folders are flat in list format here

            document.querySelectorAll('.file-item').forEach(f => f.classList.remove('active'));
            item.classList.add('active');

            activeFile = path;
            document.getElementById('ide-breadcrumb').textContent = path;
            document.getElementById('editor-breadcrumb').innerHTML = `
              <span>workspace</span> <span style="color:#858585;">&gt;</span> <span>${path.split('/').join(' &gt; ')}</span>
            `;

            // Load file content
            if (window.workspaceEditor) {
              window.workspaceEditor.setValue('// Loading file content...');
            }
            try {
              const res = await API.get(`/ai/project-workspace/file/${selectedRepo}?path=${encodeURIComponent(path)}`);
              if (res.success && window.workspaceEditor) {
                // Infer syntax language
                let mode = 'javascript';
                if (path.endsWith('.json')) mode = 'json';
                else if (path.endsWith('.md')) mode = 'markdown';
                else if (path.endsWith('.yml') || path.endsWith('.yaml')) mode = 'yaml';
                else if (path.endsWith('.css')) mode = 'css';
                else if (path.endsWith('.html')) mode = 'html';

                const model = monaco.editor.createModel(res.content, mode);
                window.workspaceEditor.setModel(model);
                window.workspaceEditor.updateOptions({ readOnly: !isEditMode });
              }
            } catch (err) {
              if (window.workspaceEditor) {
                window.workspaceEditor.setValue(`// Error loading file:\n// ${err.message}`);
              }
            }
          });
        });
      };

      // Search files filter
      document.getElementById('workspace-file-search')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = fileTreeData.filter(f => f.path.toLowerCase().includes(query));
        renderFileTree(filtered);
      });

      // Load repositories and populate dropdown selector
      const loadWorkspaceRepositories = async () => {
        try {
          const res = await API.getGithubRepositories();
          const select = document.getElementById('workspace-repo-select');
          if (res.repositories && res.repositories.length > 0 && select) {
            select.innerHTML = res.repositories.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
            selectedRepo = res.repositories[0].name;
            loadRepositoryTree();
          } else {
            // Provide a mock project explorer dropdown if no github repos connected
            if (select) {
              select.innerHTML = '<option value="express-mongodb-app">express-mongodb-app (Mock Portfolio)</option>';
              selectedRepo = 'express-mongodb-app';
              loadRepositoryTree();
            }
          }
        } catch (err) {
          console.error(err);
        }
      };

      // Load selected repository file tree
      const loadRepositoryTree = async () => {
        if (!selectedRepo) return;
        const treeContainer = document.getElementById('workspace-file-tree');
        if (treeContainer) treeContainer.innerHTML = '<div class="spinner"></div>';
        try {
          const res = await API.get(`/ai/project-workspace/tree/${selectedRepo}`);
          if (res.success) {
            fileTreeData = res.tree || [];
            renderFileTree(fileTreeData);
            
            // Auto click first file
            const firstFile = fileTreeData.find(f => f.type !== 'tree');
            if (firstFile) {
              setTimeout(() => {
                const el = document.querySelector(`.file-item[data-path="${firstFile.path}"]`);
                el?.click();
              }, 300);
            }

            // Sync README dynamically
            const readmeFile = fileTreeData.find(f => f.path.toLowerCase() === 'readme.md');
            if (readmeFile) {
              const resR = await API.get(`/ai/project-workspace/file/${selectedRepo}?path=${encodeURIComponent(readmeFile.path)}`);
              const preview = document.getElementById('readme-preview-content');
              if (resR.success && preview) {
                preview.innerHTML = `
                  <h3>README.md Preview</h3>
                  <div style="background:#2d2d2d; padding:20px; border-radius:6px; margin-top:12px; font-family:monospace; white-space:pre-wrap; font-size:12.5px;">${resR.content}</div>
                `;
              }
            }
          }
        } catch (err) {
          if (treeContainer) treeContainer.innerHTML = `<div class="text-error text-center py-4">${err.message}</div>`;
        }
      };

      // Load Repository Intelligence details
      const loadRepositoryIntelligence = async () => {
        const container = document.getElementById('intelligence-content');
        if (!container) return;
        container.innerHTML = '<div class="text-center py-5"><div class="spinner"></div><p class="mt-2 text-secondary">Analyzing project intelligence...</p></div>';
        try {
          const res = await API.get(`/ai/project-workspace/intelligence/${selectedRepo}`);
          if (res.success) {
            const data = res.intelligence;
            
            // Update score badges
            document.getElementById('ide-technical-score').textContent = `Score: ${data.technicalScore || 85}`;
            
            container.innerHTML = `
              <div class="grid grid-3 gap-4 mb-6">
                <div class="card" style="background:#252526; border:1px solid #3c3c3c; padding:16px;">
                  <div style="font-size:10px; color:#858585; text-transform:uppercase;">Complexity Rank</div>
                  <div style="font-size:24px; font-weight:700; color:var(--primary-color); margin-top:4px;">${data.codeComplexity}/100</div>
                  <div style="font-size:11px; color:#858585; margin-top:4px;">Complexity Matrix</div>
                </div>
                <div class="card" style="background:#252526; border:1px solid #3c3c3c; padding:16px;">
                  <div style="font-size:10px; color:#858585; text-transform:uppercase;">Interview Difficulty</div>
                  <div style="font-size:24px; font-weight:700; color:#10b981; margin-top:4px;">${data.interviewDifficulty}</div>
                  <div style="font-size:11px; color:#858585; margin-top:4px;">Based on file design</div>
                </div>
                <div class="card" style="background:#252526; border:1px solid #3c3c3c; padding:16px;">
                  <div style="font-size:10px; color:#858585; text-transform:uppercase;">ATS Project Score</div>
                  <div style="font-size:24px; font-weight:700; color:#3b82f6; margin-top:4px;">${data.atsScore}/100</div>
                  <div style="font-size:11px; color:#858585; margin-top:4px;">AI ATS screening weight</div>
                </div>
              </div>

              <div class="card mb-6" style="background:#252526; border:1px solid #3c3c3c; padding:20px;">
                <h3 style="color:#fff; font-size:15px; margin-bottom:12px; border-bottom:1px solid #3c3c3c; padding-bottom:6px;">Project Overview</h3>
                <p style="font-size:13px; line-height:1.6; color:#ccc;">${data.projectOverview}</p>
              </div>

              <div class="grid grid-2 gap-6 mb-6">
                <div class="card" style="background:#252526; border:1px solid #3c3c3c; padding:20px;">
                  <h3 style="color:#fff; font-size:15px; margin-bottom:12px; border-bottom:1px solid #3c3c3c; padding-bottom:6px;">Architecture Summary</h3>
                  <p style="font-size:13px; line-height:1.6; color:#ccc;">${data.architectureSummary}</p>
                  
                  <h4 style="color:#fff; font-size:13px; margin:16px 0 8px 0;">Folder Explanation</h4>
                  <p style="font-size:12.5px; line-height:1.5; color:#ccc;">${data.folderExplanation}</p>
                </div>
                
                <div class="card" style="background:#252526; border:1px solid #3c3c3c; padding:20px;">
                  <h3 style="color:#fff; font-size:15px; margin-bottom:12px; border-bottom:1px solid #3c3c3c; padding-bottom:6px;">Technology Stack</h3>
                  <div class="flex flex-wrap gap-2 mt-2">
                    ${(data.techStack || []).map(t => `<span class="badge badge-primary" style="font-size:11px;">${t}</span>`).join('')}
                  </div>
                  
                  <h4 style="color:#fff; font-size:13px; margin:20px 0 8px 0;">Direct Dependencies</h4>
                  <div class="flex flex-wrap gap-1">
                    ${(data.dependencies || []).map(d => `<span style="background:#3c3c3c; color:#ccc; font-size:10px; padding:2px 6px; border-radius:3px;">${d}</span>`).join('')}
                  </div>
                </div>
              </div>

              <div class="card mb-6" style="background:#252526; border:1px solid #3c3c3c; padding:20px;">
                <h3 style="color:#fff; font-size:15px; margin-bottom:12px; border-bottom:1px solid #3c3c3c; padding-bottom:6px;">System Operations</h3>
                <div class="grid grid-3 gap-4 text-sm mt-3">
                  <div>
                    <strong style="color:#fff; display:block; margin-bottom:4px;">Authentication Flow</strong>
                    <span style="color:#ccc; font-size:12px;">${data.authFlow}</span>
                  </div>
                  <div>
                    <strong style="color:#fff; display:block; margin-bottom:4px;">Database relationship</strong>
                    <span style="color:#ccc; font-size:12px;">${data.databaseFlow}</span>
                  </div>
                  <div>
                    <strong style="color:#fff; display:block; margin-bottom:4px;">API Routing</strong>
                    <span style="color:#ccc; font-size:12px;">${data.apiFlow}</span>
                  </div>
                </div>
              </div>

              <div class="grid grid-2 gap-6">
                <div class="card" style="background:#252526; border:1px solid #3c3c3c; padding:20px;">
                  <h3 style="color:#fff; font-size:15px; margin-bottom:12px; border-bottom:1px solid #3c3c3c; padding-bottom:6px;">Repo Quality Audit</h3>
                  <div class="mb-3">
                    <strong style="color:#fff; font-size:12.5px;">Important Files</strong>
                    <ul style="padding-left:14px; margin-top:4px; font-size:12px; color:#ccc;">
                      ${(data.importantFiles || []).map(f => `<li>${f}</li>`).join('')}
                    </ul>
                  </div>
                  <div class="mb-3">
                    <strong style="color:#f59e0b; font-size:12.5px;">Unused/Temp Files</strong>
                    <ul style="padding-left:14px; margin-top:4px; font-size:12px; color:#ccc;">
                      ${(data.unusedFiles || []).map(f => `<li>${f}</li>`).join('')}
                    </ul>
                  </div>
                  <div>
                    <strong style="color:#ef4444; font-size:12.5px;">Dead Code Flags</strong>
                    <p style="font-size:12px; color:#ccc; margin-top:2px;">${data.deadCode}</p>
                  </div>
                </div>
                
                <div class="card" style="background:#252526; border:1px solid #3c3c3c; padding:20px;">
                  <h3 style="color:#ef4444; font-size:15px; margin-bottom:12px; border-bottom:1px solid #ef4444; padding-bottom:6px;">Security Warnings</h3>
                  <ul style="list-style:none; padding-left:0; margin-top:8px; font-size:12.5px; color:#ccc; display:flex; flex-direction:column; gap:8px;">
                    ${(data.securityWarnings || []).map(w => `<li style="display:flex; gap:6px; align-items:flex-start;"><span style="color:#ef4444;">⚠</span> ${w}</li>`).join('') || '<li>No immediate security vulnerabilities detected.</li>'}
                  </ul>
                </div>
              </div>
            `;
          }
        } catch (err) {
          container.innerHTML = `<div class="text-error">${err.message}</div>`;
        }
      };

      // Load Visualizations
      const loadVisualizations = async (vizType) => {
        const container = document.getElementById('mermaid-canvas');
        if (!container) return;
        container.innerHTML = '<div class="spinner"></div>';
        try {
          const res = await API.get(`/ai/project-workspace/visualizations/${selectedRepo}`);
          if (res.success) {
            const vizs = res.visualizations;
            let code = '';
            if (vizType === 'architecture') code = vizs.architectureDiagram;
            else if (vizType === 'database') code = vizs.databaseDiagram;
            else if (vizType === 'dependency') code = vizs.dependencyGraph;
            else if (vizType === 'flow') code = vizs.apiFlowDiagram;
            else if (vizType === 'mindmap') code = vizs.mindMap;

            // Render Mermaid
            container.removeAttribute('data-processed');
            container.textContent = code;
            
            // Re-render Mermaid via global instance loaded via CDN
            if (typeof mermaid !== 'undefined') {
              mermaid.init(undefined, container);
            }
          }
        } catch (err) {
          container.innerHTML = `<p class="text-error">${err.message}</p>`;
        }
      };

      // Visualization type selector click bindings
      document.querySelectorAll('[data-viz-type]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('[data-viz-type]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          loadVisualizations(btn.dataset.vizType);
        });
      });

      // AI Chat Knowledge Assistant
      const sendWorkspaceChat = async () => {
        const input = document.getElementById('workspace-chat-input');
        const text = input?.value?.trim();
        if (!text) return;
        
        appendMessage(text, 'user');
        if (input) input.value = '';

        try {
          const chatHistory = []; // Optional history tracker
          const res = await API.post('/ai/project-workspace/chat', { repoName: selectedRepo, question: text, history: chatHistory });
          if (res.success) {
            appendMessage(res.response, 'assistant');
          }
        } catch (err) {
          appendMessage(`Failed to obtain AI response: ${err.message}`, 'assistant');
        }
      };

      const appendMessage = (text, sender) => {
        const chatBox = document.getElementById('workspace-chat-messages');
        if (!chatBox) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender}`;
        msgDiv.innerHTML = sender === 'assistant' ? text.split('\n').map(p => `<p style="margin-bottom:4px;">${p}</p>`).join('') : text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
      };

      document.getElementById('workspace-chat-send')?.addEventListener('click', sendWorkspaceChat);
      document.getElementById('workspace-chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendWorkspaceChat();
      });

      // Preset click queries
      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const q = btn.dataset.q;
          const input = document.getElementById('workspace-chat-input');
          if (input) {
            input.value = q;
            sendWorkspaceChat();
          }
        });
      });

      // Repo change event
      document.getElementById('workspace-repo-select')?.addEventListener('change', (e) => {
        selectedRepo = e.target.value;
        loadRepositoryTree();
        // Load default tab
        document.querySelector('.ide-tab[data-tab="editor"]')?.click();
      });

      // Refresh repo tree
      document.getElementById('refresh-repo-btn')?.addEventListener('click', async (e) => {
        e.target.disabled = true;
        e.target.textContent = 'Syncing...';
        try {
          await loadRepositoryTree();
          UI.toast('Sync completed successfully!', 'success');
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          e.target.disabled = false;
          e.target.textContent = 'Sync Repo';
        }
      });

      // Load initial project list
      loadWorkspaceRepositories();
    }


    // Interview questions
    document.getElementById('gen-questions')?.addEventListener('click', async () => {
      const role = document.getElementById('interview-role')?.value || 'Software Engineer';
      try {
        const data = await API.generateInterviewQuestions({ role, count: 10 });
        document.getElementById('interview-questions').innerHTML = (data.questions || []).map(q => `
          <div class="card mb-2 p-4" style="padding:16px">
            <div class="flex justify-between"><strong>${q.question}</strong>${UI.badge(q.type)}</div>
            <span class="text-xs text-muted">${q.difficulty}</span>
          </div>
        `).join('');
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    // GitHub connect
    document.getElementById('connect-github')?.addEventListener('click', () => {
      window.location.href = `/api/auth/github?token=${API.token}`;
    });

    // Profile Connected Accounts bindings
    document.getElementById('connect-github-btn')?.addEventListener('click', () => {
      window.location.href = `/api/auth/github?token=${API.token}`;
    });

    document.getElementById('disconnect-github-btn')?.addEventListener('click', async () => {
      try {
        await API.post('/auth/github/disconnect');
        UI.toast('GitHub account disconnected', 'success');
        const data = await API.getMe();
        if (data && data.user) API.setUser(data.user);
        const html = await this.render('profile');
        document.getElementById('app').innerHTML = html;
        this.bind();
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    document.getElementById('connect-linkedin-btn')?.addEventListener('click', () => {
      window.location.href = `/api/auth/linkedin?token=${API.token}`;
    });

    document.getElementById('disconnect-linkedin-btn')?.addEventListener('click', async () => {
      try {
        await API.post('/auth/linkedin/disconnect');
        UI.toast('LinkedIn account disconnected', 'success');
        const data = await API.getMe();
        if (data && data.user) API.setUser(data.user);
        const html = await this.render('profile');
        document.getElementById('app').innerHTML = html;
        this.bind();
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    document.getElementById('sync-linkedin-btn')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Syncing...';
      try {
        await API.post('/auth/linkedin/sync');
        UI.toast('LinkedIn profile synced successfully!', 'success');
        const data = await API.getMe();
        if (data && data.user) API.setUser(data.user);
        const html = await this.render('profile');
        document.getElementById('app').innerHTML = html;
        this.bind();
      } catch (err) {
        UI.toast(err.message, 'error');
      } finally {
        e.target.disabled = false;
        e.target.textContent = 'Sync Again';
      }
    });

    // ==========================================
    // RESUME THEME SYSTEM BINDINGS
    // ==========================================
    if (this.section === 'resume-themes') {
      let activeResumeId = localStorage.getItem('activeResumeId');
      if (!activeResumeId || activeResumeId === 'null' || activeResumeId === 'undefined') {
        activeResumeId = 'mock-id';
      }

      // Dropdown selector for active resume
      document.getElementById('active-resume-select')?.addEventListener('change', (e) => {
        const id = e.target.value;
        localStorage.setItem('activeResumeId', id);
        this.render('resume-themes').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      });

      // Tab switcher for Preview Mode (Candidate vs Recruiter)
      document.getElementById('btn-mode-candidate')?.addEventListener('click', () => {
        localStorage.setItem('previewMode', 'candidate');
        document.getElementById('btn-mode-candidate').classList.add('active');
        document.getElementById('btn-mode-recruiter').classList.remove('active');
        document.getElementById('preview-candidate-view').style.display = 'block';
        document.getElementById('preview-recruiter-view').style.display = 'none';
      });

      document.getElementById('btn-mode-recruiter')?.addEventListener('click', () => {
        localStorage.setItem('previewMode', 'recruiter');
        document.getElementById('btn-mode-candidate').classList.remove('active');
        document.getElementById('btn-mode-recruiter').classList.add('active');
        document.getElementById('preview-candidate-view').style.display = 'none';
        document.getElementById('preview-recruiter-view').style.display = 'block';
      });

      // Zoom logic
      let zoom = 100;
      const previewEl = document.getElementById('resume-preview-page');
      if (previewEl) {
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
          zoom = Math.min(zoom + 10, 150);
          document.getElementById('zoom-indicator').textContent = `${zoom}%`;
          previewEl.style.transform = `scale(${zoom / 100})`;
        });
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
          zoom = Math.max(zoom - 10, 50);
          document.getElementById('zoom-indicator').textContent = `${zoom}%`;
          previewEl.style.transform = `scale(${zoom / 100})`;
        });
      }

      // Apply theme from gallery
      document.querySelectorAll('[data-apply-theme-name]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (activeResumeId === 'mock-id') {
            return UI.toast('Please select or upload a resume to apply a theme.', 'warning');
          }
          const themeName = btn.dataset.applyThemeName;
          try {
            // Track recently used
            let recently = localStorage.getItem('recentlyUsedThemes') || '';
            let recList = recently.split(',').filter(Boolean);
            recList = [themeName, ...recList.filter(n => n !== themeName)].slice(0, 5);
            localStorage.setItem('recentlyUsedThemes', recList.join(','));

            await API.applyTheme(activeResumeId, themeName);
            UI.toast(`Successfully applied theme: ${themeName}`, 'success');
            this.render('resume-themes').then(html => {
              document.getElementById('app').innerHTML = html;
              this.bind();
            });
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        });
      });

      // Next / Prev theme cycling
      const cycleTheme = async (direction) => {
        if (activeResumeId === 'mock-id') {
          return UI.toast('Please select or upload a resume to cycle themes.', 'warning');
        }
        try {
          const res = await API.getThemes();
          const data = await API.getResumes();
          const rObj = data.resumes.find(r => r._id === activeResumeId);
          const currentThemeName = rObj.selectedTheme || '';
          
          let idx = res.themes.findIndex(t => t.name === currentThemeName || t.key === currentThemeName);
          if (idx === -1) idx = 0;

          if (direction === 'next') {
            idx = (idx + 1) % res.themes.length;
          } else {
            idx = (idx - 1 + res.themes.length) % res.themes.length;
          }

          const targetTheme = res.themes[idx];
          await API.applyTheme(activeResumeId, targetTheme.name);
          UI.toast(`Switched theme to: ${targetTheme.name}`, 'success');
          this.render('resume-themes').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      };

      document.getElementById('next-theme-btn')?.addEventListener('click', () => cycleTheme('next'));
      document.getElementById('prev-theme-btn')?.addEventListener('click', () => cycleTheme('prev'));

      // Favorite theme toggles
      document.querySelectorAll('.favorite-theme-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (activeResumeId === 'mock-id') {
            return UI.toast('Please select or upload a resume to favorite themes.', 'warning');
          }
          const themeId = btn.dataset.themeFavId;
          try {
            await API.favoriteTheme(activeResumeId, themeId);
            UI.toast('Favorite list updated', 'success');
            this.render('resume-themes').then(html => {
              document.getElementById('app').innerHTML = html;
              this.bind();
            });
          } catch (err) {
            UI.toast(err.message, 'error');
          }
        });
      });

      // Search filters
      document.getElementById('search-themes-input')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.theme-item-card').forEach(card => {
          const name = card.dataset.themeName;
          card.style.display = name.includes(query) ? '' : 'none';
        });
      });

      // Category filters
      document.querySelectorAll('.filter-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-cat-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const cat = btn.dataset.cat;
          
          document.querySelectorAll('.theme-item-card').forEach(card => {
            const isFav = card.dataset.themeFav === 'true';
            const popularity = parseInt(card.dataset.themePopularity || '0');
            const score = parseInt(card.dataset.themeAts || '0');
            const dateScore = parseInt(card.dataset.themeId || '0');

            let recently = localStorage.getItem('recentlyUsedThemes') || '';
            let recList = recently.split(',').filter(Boolean);
            const isRecentlyUsed = recList.includes(card.querySelector('strong').innerText);

            if (cat === 'All') {
              card.style.display = '';
            } else if (cat === 'ATS 100%') {
              card.style.display = score >= 98 ? '' : 'none';
            } else if (cat === 'Favorites') {
              card.style.display = isFav ? '' : 'none';
            } else if (cat === 'Recently Used') {
              card.style.display = isRecentlyUsed ? '' : 'none';
            } else if (cat === 'Popular') {
              card.style.display = popularity >= 900 ? '' : 'none';
            } else if (cat === 'Newest') {
              card.style.display = dateScore >= 35 ? '' : 'none';
            } else {
              card.style.display = card.dataset.themeCat === cat ? '' : 'none';
            }
          });
        });
      });

      // Sandboxed Preview modal template load
      document.querySelectorAll('[data-preview-theme-key]').forEach(btn => {
        btn.addEventListener('click', () => {
          const themeKey = btn.dataset.previewThemeKey;
          const modal = document.getElementById('fullscreen-theme-modal');
          const title = document.getElementById('modal-theme-title');
          const content = document.getElementById('modal-theme-content');

          API.getThemeById(themeKey).then(res => {
            if (!res.success) return;
            title.textContent = `Sandboxed Layout Preview — ${res.theme.name}`;
            content.innerHTML = `
              <iframe style="width:100%; height:100%; border:none; background:#FFF; border-radius:6px;" srcdoc="
                <html>
                  <head>
                    <style>
                      ${res.customCss}
                      body { font-family: sans-serif; padding: 20px; color: #333; }
                    </style>
                  </head>
                  <body>
                    ${res.layoutHtml.replace('{{name}}', 'Alex Chen').replace('{{email}}', 'alex.chen@example.com').replace('{{phone}}', '+1 555-0199').replace('{{location}}', 'San Francisco, CA').replace('{{summary}}', 'Professional Backend Developer specializing in Python and AWS pipelines.').replace('{{experience}}', '<div class=experience-item><strong>Senior Developer — Tech Corp</strong><p>Built APIs and distributed microservices with Express.</p></div>').replace('{{skills}}', '<span class=skill-tag>JavaScript</span><span class=skill-tag>NodeJS</span><span class=skill-tag>AWS</span>').replace('{{education}}', '<p>B.S. Computer Science — Stanford University</p>')}
                  </body>
                </html>
              "></iframe>
            `;
            modal.classList.remove('hidden');
          });
        });
      });

      document.getElementById('close-theme-modal')?.addEventListener('click', () => {
        document.getElementById('fullscreen-theme-modal').classList.add('hidden');
      });

      // Instantly save visual styling adjustments
      const autoSaveStyles = async () => {
        const form = document.getElementById('theme-customizer-form');
        if (!form) return;
        const fd = new FormData(form);
        const customization = {
          accentColor: fd.get('accentColor'),
          primaryColor: fd.get('primaryColor'),
          secondaryColor: fd.get('secondaryColor'),
          fontFamily: fd.get('fontFamily'),
          fontSize: parseInt(fd.get('fontSize') || '12'),
          lineHeight: parseFloat(fd.get('lineHeight') || '1.5'),
          margins: parseInt(fd.get('margins') || '20'),
          padding: parseInt(fd.get('padding') || '16'),
          borderRadius: parseInt(fd.get('borderRadius') || '4'),
          pageSize: fd.get('pageSize'),
          headerStyle: fd.get('headerStyle'),
          sidebarPosition: fd.get('sidebarPosition'),
          showIcons: fd.get('showIcons') === 'true'
        };
        
        // Auto update current local elements styles to avoid full redraw lag
        if (previewEl) {
          previewEl.style.color = customization.primaryColor;
          previewEl.style.padding = `${customization.margins}px`;
          previewEl.style.borderRadius = `${customization.borderRadius}px`;
          previewEl.style.fontFamily = customization.fontFamily === 'Lora' ? 'Georgia, serif' : (customization.fontFamily === 'Fira Code' ? 'monospace' : 'system-ui');
          previewEl.style.fontSize = `${customization.fontSize}px`;
          previewEl.style.lineHeight = customization.lineHeight;
        }

        if (activeResumeId === 'mock-id') {
          return;
        }
        try {
          await API.customizeTheme(activeResumeId, customization);
        } catch (_) {}
      };

      document.querySelectorAll('#theme-customizer-form input, #theme-customizer-form select').forEach(el => {
        el.addEventListener('input', autoSaveStyles);
      });

      // Submit visual customizer
      document.getElementById('theme-customizer-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (activeResumeId === 'mock-id') {
          return UI.toast('Please select or upload a resume to save customizer styles.', 'warning');
        }
        await autoSaveStyles();
        UI.toast('Theme customizer styles saved!', 'success');
        this.render('resume-themes').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      });

      // SECTION BUILDER HANDLERS
      // Up/Down reordering
      document.querySelectorAll('.move-sec-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (activeResumeId === 'mock-id') {
            return UI.toast('Please select or upload a resume to reorder sections.', 'warning');
          }
          const section = btn.dataset.secId;
          const direction = btn.dataset.dir;
          
          const data = await API.getResumes();
          const r = data.resumes.find(x => x._id === activeResumeId);
          if (!r) return;

          let order = r.themeCustomization?.sectionOrder || ['summary', 'experience', 'skills', 'education', 'projects', 'achievements', 'certificates', 'languages', 'research'];
          let idx = order.indexOf(section);
          if (idx !== -1) {
            if (direction === 'up' && idx > 0) {
              [order[idx], order[idx - 1]] = [order[idx - 1], order[idx]];
            } else if (direction === 'down' && idx < order.length - 1) {
              [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
            }
            await API.customizeTheme(activeResumeId, { sectionOrder: order });
            this.render('resume-themes').then(html => {
              document.getElementById('app').innerHTML = html;
              this.bind();
            });
          }
        });
      });

      // Hide/Show section builder
      document.querySelectorAll('.toggle-sec-visibility').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (activeResumeId === 'mock-id') {
            return UI.toast('Please select or upload a resume to toggle section visibility.', 'warning');
          }
          const section = btn.dataset.secId;
          const data = await API.getResumes();
          const r = data.resumes.find(x => x._id === activeResumeId);
          if (!r) return;

          let hidden = r.themeCustomization?.hiddenSections || [];
          if (hidden.includes(section)) {
            hidden = hidden.filter(s => s !== section);
          } else {
            hidden.push(section);
          }
          await API.customizeTheme(activeResumeId, { hiddenSections: hidden });
          this.render('resume-themes').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        });
      });

      // Rename section builder
      document.querySelectorAll('.rename-sec-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (activeResumeId === 'mock-id') {
            return UI.toast('Please select or upload a resume to rename sections.', 'warning');
          }
          const section = btn.dataset.secId;
          const newName = prompt(`Enter new display name for "${section}":`);
          if (!newName) return;
          const data = await API.getResumes();
          const r = data.resumes.find(x => x._id === activeResumeId);
          if (!r) return;

          let renamed = r.themeCustomization?.renamedSections || {};
          renamed[section] = newName;
          await API.customizeTheme(activeResumeId, { renamedSections: renamed });
          this.render('resume-themes').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        });
      });

      // Create new section builder
      document.getElementById('add-custom-sec-btn')?.addEventListener('click', async () => {
        if (activeResumeId === 'mock-id') {
          return UI.toast('Please select or upload a resume to add custom sections.', 'warning');
        }
        const title = prompt('Enter new Custom Section title:');
        const content = prompt('Enter content text:');
        if (!title || !content) return;
        const data = await API.getResumes();
        const r = data.resumes.find(x => x._id === activeResumeId);
        if (!r) return;

        let customs = r.themeCustomization?.customSections || [];
        customs.push({ title, content });
        await API.customizeTheme(activeResumeId, { customSections: customs });
        this.render('resume-themes').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      });

      // Profile photo upload helper
      document.getElementById('upload-profile-pic-btn')?.addEventListener('change', async (e) => {
        if (activeResumeId === 'mock-id') {
          return UI.toast('Please select or upload a resume to change profile photo.', 'warning');
        }
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          await API.customizeTheme(activeResumeId, { profilePictureUrl: reader.result });
          this.render('resume-themes').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        };
        reader.readAsDataURL(file);
      });

      // AI Layout Generator Style
      document.getElementById('run-ai-theme-generator-btn')?.addEventListener('click', async (e) => {
        if (activeResumeId === 'mock-id') {
          return UI.toast('Please select or upload a resume to run AI theme generation.', 'warning');
        }
        const promptStr = document.getElementById('ai-generator-prompt')?.value;
        if (!promptStr) return UI.toast('Please write a prompt first (e.g. Apple layout)', 'warning');
        
        e.target.disabled = true;
        e.target.textContent = 'Generating...';
        try {
          await API.generateAITheme(activeResumeId, promptStr);
          UI.toast('AI customized style rules injected successfully!', 'success');
          this.render('resume-themes').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          e.target.disabled = false;
          e.target.textContent = 'Generate Style';
        }
      });

      // Job description optimizer
      document.getElementById('run-jd-optimizer-btn')?.addEventListener('click', async (e) => {
        if (activeResumeId === 'mock-id') {
          return UI.toast('Please select or upload a resume to run JD optimization.', 'warning');
        }
        const jobDescription = document.getElementById('jd-optimizer-textarea')?.value;
        if (!jobDescription) return UI.toast('Paste a job description first', 'warning');
        
        e.target.disabled = true;
        e.target.textContent = 'Analyzing...';
        try {
          const res = await API.optimizeResume(activeResumeId, jobDescription);
          UI.toast('ATS Optimizer checklist computed!', 'success');
          
          const feedback = document.getElementById('jd-optimizer-feedback');
          feedback.classList.remove('hidden');
          feedback.innerHTML = `
            <strong>ATS Compatibility Result:</strong><br>
            Current Match: <strong>${res.currentAtsMatch}%</strong> → Improved: <strong class="text-success">${res.improvedAtsMatch}%</strong><br>
            <div class="mt-2">
              <strong>Injected Skill Keywords:</strong><br>
              ${res.missingKeywords?.map(k => `<span class="badge badge-primary badge-sm mr-1">${k}</span>`).join('') || 'None'}
            </div>
          `;
          
          this.render('resume-themes').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
            document.getElementById('jd-optimizer-feedback').classList.remove('hidden');
            document.getElementById('jd-optimizer-feedback').innerHTML = feedback.innerHTML;
          });
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          e.target.disabled = false;
          e.target.textContent = 'Analyze & Tailor';
        }
      });

      // Load Version history list and bind restores
      if (activeResumeId !== 'mock-id') {
        API.getVersions(activeResumeId).then(res => {
          const list = document.getElementById('versions-history-list');
          if (list) {
            list.innerHTML = (res.versions || []).map(v => `
              <div class="flex justify-between items-center p-2 rounded glass-card text-xs">
                <span>Version ${v.versionNumber}</span>
                <button class="btn btn-ghost btn-xs text-primary restore-ver-btn" data-ver-num="${v.versionNumber}">Restore</button>
              </div>
            `).join('') || '<p class="text-xs text-secondary">No versions saved yet.</p>';

            document.querySelectorAll('.restore-ver-btn').forEach(btn => {
              btn.addEventListener('click', async () => {
                const num = parseInt(btn.dataset.verNum);
                try {
                  await API.restoreVersion(activeResumeId, num);
                  UI.toast(`Restored to Version checkpoint ${num}!`, 'success');
                  this.render('resume-themes').then(html => {
                    document.getElementById('app').innerHTML = html;
                    this.bind();
                  });
                } catch (err) {
                  UI.toast(err.message, 'error');
                }
              });
            });
          }
        }).catch(() => {});
      } else {
        const list = document.getElementById('versions-history-list');
        if (list) {
          list.innerHTML = '<p class="text-xs text-secondary">No versions saved yet.</p>';
        }
      }


      // Duplicate Saved Variants (e.g. Google Resume, Amazon Resume, etc.)
      document.getElementById('duplicate-variant-btn')?.addEventListener('click', async () => {
        const variantName = prompt('Enter a name for this resume variant (e.g. Google Resume, Amazon Resume, Research Resume):');
        if (!variantName) return;
        try {
          const data = await API.getResumes();
          const currentResume = data.resumes.find(r => r._id === activeResumeId);
          if (!currentResume) return;

          const fd = new FormData();
          const fakeBlob = new Blob([JSON.stringify(currentResume.parsed)], { type: 'application/json' });
          fd.append('resume', fakeBlob, `${variantName.replace(/\s+/g, '_')}_resume.json`);

          await API.uploadResume(fd);
          UI.toast(`Created variant: ${variantName}`, 'success');
          
          this.render('resume-themes').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      });

      // Export file buttons handlers
      const downloadTextFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      document.getElementById('exp-pdf-btn')?.addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        const content = document.getElementById('resume-preview-page').outerHTML;
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Resume</title>
              <style>
                body { margin:0; padding:20px; font-family:sans-serif; }
                #resume-preview-page { width:100% !important; min-height:0 !important; box-shadow:none !important; transform:none !important; }
                @media print {
                  body { padding:0; }
                  #resume-preview-page { padding:0 !important; border:none !important; }
                }
              </style>
            </head>
            <body>
              ${content}
              <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
        UI.toast('PDF Export screen loaded', 'success');
      });

      document.getElementById('exp-docx-btn')?.addEventListener('click', () => {
        const text = document.getElementById('resume-preview-page').innerText;
        downloadTextFile(text, 'resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        UI.toast('DOCX export started successfully', 'success');
      });

      document.getElementById('exp-html-btn')?.addEventListener('click', () => {
        const html = document.getElementById('resume-preview-page').outerHTML;
        downloadTextFile(html, 'resume.html', 'text/html');
        UI.toast('HTML export downloaded', 'success');
      });

      document.getElementById('exp-md-btn')?.addEventListener('click', () => {
        const previewEl = document.getElementById('resume-preview-page');
        const markdown = `# ${previewEl.querySelector('h1').innerText}\n\n${previewEl.innerText}`;
        downloadTextFile(markdown, 'resume.md', 'text/markdown');
        UI.toast('Markdown export downloaded', 'success');
      });

      document.getElementById('exp-json-btn')?.addEventListener('click', async () => {
        const data = await API.getResumes();
        const currentResume = data.resumes.find(r => r._id === activeResumeId);
        downloadTextFile(JSON.stringify(currentResume, null, 2), 'resume_schema.json', 'application/json');
        UI.toast('JSON Schema export downloaded', 'success');
      });

      document.getElementById('exp-png-btn')?.addEventListener('click', () => {
        UI.toast('Exporting canvas PNG. Please use PDF Print option for full crisp resolution.', 'info');
        const html = document.getElementById('resume-preview-page').outerHTML;
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="595" height="842">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml">
                ${html}
              </div>
            </foreignObject>
          </svg>
        `;
        downloadTextFile(svg, 'resume_snapshot.svg', 'image/svg+xml');
      });
    }
  },

  async loadResumes() {
    const el = document.getElementById('resume-list');
    if (!el) return;
    try {
      const data = await API.getResumes();
      el.innerHTML = `<h3 class="mb-4">Your Resumes</h3>` +
        (data.resumes?.length ? data.resumes.map(r => `
          <div class="card mb-2 p-4" style="padding:16px">
            <div class="flex justify-between items-center">
              <div><strong>${r.filename}</strong><div class="text-sm text-muted">Score: ${r.score}%</div></div>
              ${UI.badge('Parsed', 'success')}
            </div>
            ${UI.skillTags(r.parsed?.skills?.slice(0, 5))}
          </div>
        `).join('') : UI.emptyState('📄', 'No resumes', 'Upload your first resume'));
    } catch (_) { el.innerHTML = '<p class="text-secondary">Could not load resumes</p>'; }
  },

  loadOverviewCharts() {
    requestAnimationFrame(() => {
      Charts.radar('skills-radar', ['JS', 'React', 'Node', 'Python', 'AWS', 'Docker'], [90, 85, 80, 70, 65, 75]);
      Charts.line('learning-chart', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], [{
        label: 'Learning Hours', data: [12, 18, 15, 22, 20, 28],
        borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', fill: true
      }]);
    });
  },

  async loadRoadmap(force = false) {
    const vizEl = document.getElementById('roadmap-viz');
    const gapsEl = document.getElementById('skill-gaps');
    const analysisEl = document.getElementById('roadmap-analysis');
    const progEl = document.getElementById('roadmap-progress');
    
    if (vizEl) vizEl.innerHTML = '<div class="spinner"></div>';
    if (gapsEl) gapsEl.innerHTML = '<div class="spinner"></div>';
    if (analysisEl) analysisEl.innerHTML = '<div class="spinner"></div>';
    
    try {
      const queryStr = force ? '?generate=true' : '';
      const data = await API.get(`/ai/roadmap${queryStr}`);
      const roadmap = data.roadmap;
      
      if (!roadmap) {
        if (progEl) progEl.textContent = 'Not Started';
        if (vizEl) {
          vizEl.innerHTML = `
            <div style="padding: 40px; text-align: center;">
              <p class="text-secondary mb-4">You have not generated your Career Roadmap yet.</p>
              <button class="btn btn-primary" id="generate-roadmap-btn">Generate Career Roadmap</button>
            </div>`;
          document.getElementById('generate-roadmap-btn')?.addEventListener('click', async (e) => {
            e.target.disabled = true;
            e.target.textContent = 'Generating...';
            await this.loadRoadmap(true);
          });
        }
        if (gapsEl) gapsEl.innerHTML = '<p class="text-secondary">Generate roadmap to see skill gaps</p>';
        if (analysisEl) analysisEl.innerHTML = '<p class="text-secondary">Generate roadmap to see AI analysis</p>';
        return;
      }
      
      if (progEl) progEl.textContent = `${roadmap.progress || 0}% Complete`;
      RoadmapViz.init('roadmap-viz', roadmap);
      
      const analysis = await API.get(`/ai/roadmap/analyze${queryStr}`).catch(() => null);
      if (analysis && analysis.analysis) {
        if (analysisEl) {
          analysisEl.innerHTML = `
            <p>${analysis.analysis.analysis || 'Analysis pending'}</p>
            <ul class="mt-2">${(analysis.analysis.recommendations || []).map(r => `<li>${r}</li>`).join('')}</ul>
            <button class="btn btn-secondary btn-sm mt-4" id="regenerate-roadmap-analysis-btn">Regenerate Analysis</button>`;
          document.getElementById('regenerate-roadmap-analysis-btn')?.addEventListener('click', async (e) => {
            e.target.disabled = true;
            e.target.textContent = 'Analyzing...';
            await this.loadRoadmap(true);
          });
        }
      } else {
        if (analysisEl) {
          analysisEl.innerHTML = `
            <p class="text-secondary mb-2">No AI Roadmap analysis found.</p>
            <button class="btn btn-primary btn-sm" id="generate-roadmap-analysis-btn">Generate AI Analysis</button>`;
          document.getElementById('generate-roadmap-analysis-btn')?.addEventListener('click', async (e) => {
            e.target.disabled = true;
            e.target.textContent = 'Generating...';
            await this.loadRoadmap(true);
          });
        }
      }
      
      if (gapsEl) {
        gapsEl.innerHTML = (roadmap.skillGaps || [
          { skill: 'Cloud', current: 40, required: 80 },
          { skill: 'System Design', current: 55, required: 85 }
        ]).map(g => `
          <div class="mb-3"><div class="flex justify-between text-sm"><span>${g.skill}</span><span>${g.current}/${g.required}</span></div>
          ${UI.progressBar(g.current, g.required)}</div>
        `).join('');
      }
    } catch (err) {
      const msg = err.status === 429 || err.message.includes('429')
        ? "AI is temporarily busy. Please wait a few seconds and try again."
        : err.message;
      UI.toast(msg, 'error');
      if (vizEl) vizEl.innerHTML = `<p class="text-error">${msg}</p>`;
    }
  },

  async loadLearning(force = false) {
    const statsEl = document.getElementById('learning-stats');
    const modulesEl = document.getElementById('learning-modules');
    
    if (statsEl) statsEl.innerHTML = '<div class="spinner"></div>';
    if (modulesEl) modulesEl.innerHTML = '<div class="spinner"></div>';
    
    try {
      const queryStr = force ? '?generate=true' : '';
      const score = await API.get(`/ai/learning-score${queryStr}`);
      const roadmap = await API.get(`/ai/learning-roadmap${queryStr}`);
      
      if (!score.score && (!roadmap.modules || roadmap.modules.length === 0)) {
        if (statsEl) {
          statsEl.innerHTML = `
            <div class="card p-8 text-center" style="grid-column: span 4">
              <p class="text-secondary mb-4">No continuous learning analysis available.</p>
              <button class="btn btn-primary" id="generate-learning-btn">Generate AI Learning Analysis</button>
            </div>`;
          document.getElementById('generate-learning-btn')?.addEventListener('click', async (e) => {
            e.target.disabled = true;
            e.target.textContent = 'Generating...';
            await this.loadLearning(true);
          });
        }
        if (modulesEl) modulesEl.innerHTML = '<p class="text-secondary">Generate analysis to see learning modules</p>';
        return;
      }
      
      if (statsEl) {
        statsEl.innerHTML = `
          ${UI.statCard('Learning Score', score.score, `Streak: ${score.streak} days`, true)}
          ${UI.statCard('Weekly Hours', score.weeklyHours, 'On track', true)}
          ${UI.statCard('Certifications', score.certificationsInProgress, 'In progress')}
          ${UI.statCard('Modules', roadmap.modules?.length || 0, 'Active')}`;
      }
      
      if (roadmap.modules) {
        if (modulesEl) {
          modulesEl.innerHTML = `
            <div class="flex justify-between items-center mb-4">
              <h3>Active Modules</h3>
              <button class="btn btn-secondary btn-sm" id="regenerate-learning-btn">Regenerate Analysis</button>
            </div>` +
            roadmap.modules.map(m => `
              <div class="leaderboard-item">
                <div><strong>${m.skill}</strong><div class="text-sm text-muted">${m.courses?.join(', ')}</div></div>
                <span class="badge badge-${m.priority === 'high' ? 'primary' : 'warning'}">${m.priority}</span>
                <span class="text-sm">${m.estimatedWeeks}w</span>
              </div>
            `).join('');
            
          document.getElementById('regenerate-learning-btn')?.addEventListener('click', async (e) => {
            e.target.disabled = true;
            e.target.textContent = 'Regenerating...';
            await this.loadLearning(true);
          });
        }
        Charts.progress('learning-roadmap-chart', roadmap.modules.map(m => m.skill), roadmap.modules.map(() => Math.floor(30 + Math.random() * 60)));
      }
    } catch (err) {
      const msg = err.status === 429 || err.message.includes('429')
        ? "AI is temporarily busy. Please wait a few seconds and try again."
        : err.message;
      UI.toast(msg, 'error');
      if (statsEl) statsEl.innerHTML = `<p class="text-error">${msg}</p>`;
    }
  },

  async loadBenchmarks(force = false) {
    const chartContainer = document.querySelector('#benchmark-chart')?.parentElement;
    if (!chartContainer) return;
    
    try {
      const queryStr = force ? '?generate=true' : '';
      const data = await API.get(`/ai/benchmarks${queryStr}`);
      const b = data.benchmarks;
      
      if (!b || !b.skills) {
        chartContainer.innerHTML = `
          <div class="text-center p-8">
            <p class="text-secondary mb-4">No benchmarks comparison has been generated yet.</p>
            <button class="btn btn-primary" id="generate-benchmarks-btn">Generate Benchmarks</button>
          </div>`;
        document.getElementById('generate-benchmarks-btn')?.addEventListener('click', async (e) => {
          e.target.disabled = true;
          e.target.textContent = 'Generating...';
          await this.loadBenchmarks(true);
        });
        return;
      }
      
      chartContainer.innerHTML = '<div class="chart-wrapper"><canvas id="benchmark-chart"></canvas></div>';
      requestAnimationFrame(() => {
        Charts.bar('benchmark-chart',
          ['Skills', 'Experience', 'Projects', 'Certifications'],
          [
            { label: 'You', data: [b.skills?.you, b.experience?.you, b.projects?.you, b.certifications?.you], backgroundColor: '#2563EB', borderRadius: 6 },
            { label: 'Average', data: [b.skills?.average, b.experience?.average, b.projects?.average, b.certifications?.average], backgroundColor: '#93C5FD', borderRadius: 6 },
            { label: 'Top 10%', data: [b.skills?.top10, b.experience?.top10, b.projects?.top10, b.certifications?.top10], backgroundColor: '#1D4ED8', borderRadius: 6 }
          ]
        );
      });
    } catch (err) {
      const msg = err.status === 429 || err.message.includes('429')
        ? "AI is temporarily busy. Please wait a few seconds and try again."
        : err.message;
      UI.toast(msg, 'error');
    }
  },

  async loadGrowth(force = false) {
    const predEl = document.getElementById('growth-predictions');
    const chartContainer = document.querySelector('#growth-chart')?.parentElement;
    
    if (predEl) predEl.innerHTML = '<div class="spinner"></div>';
    
    try {
      const queryStr = force ? '?generate=true' : '';
      const data = await API.get(`/ai/career-growth${queryStr}`);
      
      if (!data.predictions) {
        if (predEl) {
          predEl.innerHTML = `
            <div class="card p-8 text-center" style="grid-column: span 3">
              <p class="text-secondary mb-4">No career growth trajectory has been forecast yet.</p>
              <button class="btn btn-primary" id="generate-growth-btn">Predict Career Growth</button>
            </div>`;
          document.getElementById('generate-growth-btn')?.addEventListener('click', async (e) => {
            e.target.disabled = true;
            e.target.textContent = 'Predicting...';
            await this.loadGrowth(true);
          });
        }
        if (chartContainer) chartContainer.innerHTML = '<p class="text-secondary text-center p-4">No prediction chart data available</p>';
        return;
      }
      
      if (predEl) {
        predEl.innerHTML = (data.predictions || []).map(p => `
          <div class="glass-card p-6 hover-lift">
            <div class="text-sm text-muted">Year ${p.year}</div>
            <h3 class="mt-2">${p.role}</h3>
            <div class="mt-4">${UI.progressBar(p.probability * 100)}</div>
            <div class="flex justify-between mt-2 text-sm">
              <span>${Math.round(p.probability * 100)}% probability</span>
              <span class="text-secondary">${p.salary}</span>
            </div>
          </div>
        `).join('') + `
          <div style="grid-column: span 3; text-align: right; margin-top: 10px;">
            <button class="btn btn-secondary btn-sm" id="regenerate-growth-btn">Regenerate Forecast</button>
          </div>`;
          
        document.getElementById('regenerate-growth-btn')?.addEventListener('click', async (e) => {
          e.target.disabled = true;
          e.target.textContent = 'Regenerating...';
          await this.loadGrowth(true);
        });
      }
      
      if (chartContainer) {
        chartContainer.innerHTML = '<canvas id="growth-chart"></canvas>';
        requestAnimationFrame(() => {
          Charts.line('growth-chart', (data.predictions || []).map(p => `Year ${p.year}`), [{
            label: 'Probability', data: (data.predictions || []).map(p => p.probability * 100),
            borderColor: '#2563EB', tension: 0.4
          }]);
        });
      }
    } catch (err) {
      const msg = err.status === 429 || err.message.includes('429')
        ? "AI is temporarily busy. Please wait a few seconds and try again."
        : err.message;
      UI.toast(msg, 'error');
      if (predEl) predEl.innerHTML = `<p class="text-error">${msg}</p>`;
    }
  },

  async loadGitHub() {
    try {
      const [profileData, reposData, langsData, commitsData, prsData, issuesData] = await Promise.all([
        API.getGithubProfile(),
        API.getGithubRepositories(),
        API.getGithubLanguages(),
        API.getGithubCommits(),
        API.getGithubPRs(),
        API.getGithubIssues()
      ]);

      const p = profileData.profile;
      const stats = profileData.stats;
      const repos = reposData.repositories || [];
      const languages = langsData.languages || [];
      const commits = commitsData.commits || [];
      const prs = prsData.pullrequests || [];

      if (!p) {
        document.getElementById('github-repos').innerHTML = `<p class="text-secondary">No GitHub account connected. Use the button above to connect.</p>`;
        return;
      }

      // Hide/Show connect button if connected
      const connectBtn = document.getElementById('connect-github');
      if (connectBtn) connectBtn.style.display = 'none';

      // 1. Render profile summary header
      const statsContainer = document.getElementById('github-stats');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="card flex items-center gap-4" style="grid-column: span 4">
            <img src="${p.avatarUrl || 'https://github.com/identicons/placeholder.png'}" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--border-color);">
            <div style="flex: 1">
              <h3 style="margin: 0">@${p.username}</h3>
              <p class="text-sm text-secondary" style="margin: 4px 0">${p.followers || 0} Followers • ${p.following || 0} Following • ${p.publicRepos || 0} Public Repos</p>
              <p class="text-xs text-muted" style="margin: 0">Last Synced: ${stats?.lastSynced ? new Date(stats.lastSynced).toLocaleString() : (p.lastSynced ? new Date(p.lastSynced).toLocaleString() : 'Never')}</p>
            </div>
            <div class="flex gap-2">
              <a href="https://github.com/${p.username}" target="_blank" class="btn btn-secondary btn-sm">GitHub Profile</a>
              <button class="btn btn-primary btn-sm" id="sync-github-btn">Sync GitHub</button>
            </div>
          </div>
          ${UI.statCard('Repository Count', repos.length)}
          ${UI.statCard('Commit Count', stats?.totalCommits || commits.length)}
          ${UI.statCard('Pull Request Count', stats?.totalPRs || prs.length)}
          ${UI.statCard('Contribution Score', stats?.contributionScore || 70, 'AI Evaluated', true)}
        `;
      }

      // Re-bind sync button
      document.getElementById('sync-github-btn')?.addEventListener('click', async (e) => {
        e.target.disabled = true;
        e.target.innerHTML = '<span class="spinner" style="width: 1rem; height: 1rem; display: inline-block; border: 2px solid var(--primary-color); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></span>Syncing...';
        try {
          await API.syncGithub();
          UI.toast('GitHub profile and repositories synced!', 'success');
          await this.loadGitHub();
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          e.target.disabled = false;
          e.target.textContent = 'Sync GitHub';
        }
      });

      // 2. Render Top Projects
      const reposContainer = document.getElementById('github-repos');
      if (reposContainer) {
        reposContainer.innerHTML = `<h3 class="mb-4">Top Repositories</h3>` +
          repos.slice(0, 5).map((r, i) => `
            <div class="leaderboard-item">
              <div>
                <strong>${r.name}</strong>
                <p class="text-sm text-secondary">${r.description || 'No description provided.'}</p>
              </div>
              <span class="badge badge-primary">#${i + 1}</span>
              <span class="text-sm font-medium">${r.stars || 0} stars</span>
            </div>
          `).join('') || '<p class="text-secondary">No repositories found.</p>';
      }

      // 3. Render Top Languages Chart
      if (languages && languages.length) {
        Charts.pie('github-lang-chart', languages.map(l => l.name), languages.map(l => l.percentage));
      }

      // 4. Render AI Insights
      const aiInsightsContainer = document.getElementById('github-ai-insights');
      if (aiInsightsContainer) {
        const strengthsList = p.aiCandidateStrengths && p.aiCandidateStrengths.length 
          ? p.aiCandidateStrengths.map(s => `<li>• ${s}</li>`).join('') 
          : '<li>No strengths detected yet.</li>';
        const weaknessesList = p.aiCandidateWeaknesses && p.aiCandidateWeaknesses.length 
          ? p.aiCandidateWeaknesses.map(w => `<li>• ${w}</li>`).join('') 
          : '<li>No weaknesses detected yet.</li>';
          
        const skillsObj = p.aiSkillDetection || {};
        const skillCategories = Object.keys(skillsObj)
          .filter(k => Array.isArray(skillsObj[k]) && skillsObj[k].length)
          .map(k => `<div><strong>${k.charAt(0).toUpperCase() + k.slice(1)}:</strong> ${skillsObj[k].join(', ')}</div>`)
          .join('') || '<div>No specific tech stack details detected yet.</div>';

        const questionsList = p.aiInterviewQuestions && p.aiInterviewQuestions.length
          ? p.aiInterviewQuestions.map(q => `<div class="mb-2"><strong>Q: ${q.question}</strong> <span class="badge badge-primary badge-sm">${q.difficulty || 'medium'}</span></div>`).join('')
          : '<div>No interview prep questions generated yet.</div>';

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

        aiInsightsContainer.innerHTML = `
          <div class="grid grid-2 gap-6 mb-6">
            <div class="card">
              <h3 class="mb-4">AI Candidate Summary</h3>
              <p style="line-height: 1.6; margin: 0;">${p.aiCandidateSummary || 'No AI summary generated yet.'}</p>
            </div>
            <div class="card">
              <h3 class="mb-4">Technology Stack & Skill Detection</h3>
              <div class="flex flex-col gap-2">${skillCategories}</div>
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
              <h3 class="mb-4">Suggested Interview Questions</h3>
              <div>${questionsList}</div>
            </div>
          </div>

          <div class="card mb-6">
            <h3 class="mb-4">Optimized Resume Project Descriptions</h3>
            <div>${resumeProjects}</div>
          </div>
        `;
      }

    } catch (err) {
      console.error(err);
      document.getElementById('github-repos').innerHTML = `<p class="text-error">Failed to load GitHub data: ${err.message}</p>`;
    }
  },

  async runResumeAI(action) {
    const el = document.getElementById('resume-ai-result');
    el.innerHTML = '<div class="spinner"></div>';
    const buttons = document.querySelectorAll('[data-ai-action]');
    buttons.forEach(btn => btn.disabled = true);
    try {
      const activeId = localStorage.getItem('activeResumeId');
      const resumes = await API.getResumes();
      const resume = (resumes.resumes || []).find(r => r._id === activeId) || resumes.resumes?.[0];
      if (!resume) { 
        el.innerHTML = UI.emptyState('📄', 'No resume', 'Upload a resume first'); 
        buttons.forEach(btn => btn.disabled = false);
        return; 
      }

      let result;
      if (action === 'simulate') result = await API.simulateResume(resume._id);
      else if (action === 'improve') result = await API.getImprovementReport(resume._id);
      else result = await API.post(`/resumes/${resume._id}/dynamic`, { job: { title: 'Senior Developer' } });

      if (action === 'simulate') {
        const scenarios = result.simulation?.scenarios || [];
        el.innerHTML = `
          <h3 class="mb-4">Resume Simulation Results</h3>
          <div class="grid grid-3 gap-4">
            ${scenarios.map(s => `
              <div class="card p-4">
                <h4 class="mb-2">${s.scenario}</h4>
                <div class="text-xl font-bold mb-2" style="color:var(--primary-color)">${s.acceptanceRate}% Acceptance</div>
                <p class="text-sm text-secondary">${s.feedback}</p>
              </div>
            `).join('') || '<p>No simulation scenarios returned</p>'}
          </div>`;
      } else if (action === 'improve') {
        const report = result.report;
        if (!report) {
          el.innerHTML = `<p class="text-secondary">No improvement report generated. Try clicking regenerate.</p>`;
        } else {
          el.innerHTML = `
            <h3 class="mb-2">Resume Improvement Report</h3>
            <div class="flex justify-between items-center mb-4 p-3 rounded" style="background: rgba(37,99,235,0.06)">
              <div><strong>Overall Grade:</strong> <span class="badge badge-primary">${report.overallGrade}</span></div>
              <div><strong>Estimated Score Increase:</strong> <strong class="text-success">+${report.estimatedScoreIncrease}%</strong></div>
            </div>
            <p class="mb-4">${report.summary || ''}</p>
            <div class="flex flex-col gap-2">
              ${(report.improvements || []).map(imp => `
                <div class="leaderboard-item" style="padding:12px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong>${imp.area}</strong>
                    <div class="text-sm text-muted mt-1">${imp.suggestion}</div>
                  </div>
                  <span class="badge badge-${imp.priority === 'high' ? 'primary' : 'warning'}">${imp.priority}</span>
                </div>
              `).join('') || '<p>No improvements suggested</p>'}
            </div>`;
        }
      } else {
        const dynamic = result.dynamic;
        if (!dynamic) {
          el.innerHTML = `<p class="text-secondary">No dynamic tailoring results returned.</p>`;
        } else {
          el.innerHTML = `
            <h3 class="mb-2">Dynamic Resume (Tailored Summary & Projects)</h3>
            <p class="text-sm text-secondary mb-4">${dynamic.summary || ''}</p>
            <div class="card p-4 mb-4">
              <h4 class="mb-2">Tailored Summary</h4>
              <p class="mt-2" style="font-style: italic">"${dynamic.tailoredSummary}"</p>
            </div>
            <div class="grid grid-2 gap-4 mb-4">
              <div class="card p-4">
                <h4 class="mb-2">Highlighted Skills</h4>
                <div class="flex flex-wrap gap-1">
                  ${(dynamic.highlightedSkills || []).map(s => `<span class="badge badge-primary">${s}</span>`).join('') || 'None'}
                </div>
              </div>
              <div class="card p-4">
                <h4 class="mb-2">Suggested Changes</h4>
                <ul style="list-style: disc; padding-left: 16px;">
                  ${(dynamic.suggestedChanges || []).map(c => `<li>${c}</li>`).join('') || 'None'}
                </ul>
              </div>
            </div>
            <div class="card p-4">
              <h4 class="mb-2">Optimized Projects Section</h4>
              ${(dynamic.resumeProjectSection || []).map(p => `
                <div class="mb-4" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                  <strong>${p.title}</strong>
                  <p class="text-sm text-secondary mt-1">${p.description}</p>
                  <div class="text-xs text-muted mt-1"><strong>Impact:</strong> ${p.impactStatement}</div>
                </div>
              `).join('') || 'No tailored projects section generated'}
            </div>`;
        }
      }
    } catch (err) { 
      const msg = err.status === 429 || err.message.includes('429')
        ? "AI is temporarily busy. Please wait a few seconds and try again."
        : err.message;
      el.innerHTML = `<p class="text-error">${msg}</p>`; 
    } finally {
      buttons.forEach(btn => btn.disabled = false);
    }
  },

  // ==========================================
  // RESUME THEME MARKETPLACE VIEW
  // ==========================================
  async renderResumeThemes() {
    let resumes = [];
    let themes = [];
    try {
      const data = await API.getResumes();
      resumes = data.resumes || [];
      const themeData = await API.getThemes();
      themes = themeData.themes || [];
    } catch (_) {}

    let activeId = localStorage.getItem('activeResumeId');
    if (activeId === 'undefined' || activeId === 'null') {
      activeId = '';
    }
    const selectedResumeId = activeId || (resumes[0] ? resumes[0]._id : 'mock-id');
    
    const isValidId = selectedResumeId && /^[0-9a-fA-F]{24}$/.test(selectedResumeId);
    if (isValidId) {
      localStorage.setItem('activeResumeId', selectedResumeId);
    } else {
      localStorage.setItem('activeResumeId', 'mock-id');
    }

    let realActiveResume = isValidId ? resumes.find(r => r._id === selectedResumeId) : null;
    let activeResume = realActiveResume;
    if (!activeResume) {
      activeResume = {
        _id: 'mock-id',
        filename: 'demo_resume.pdf',
        score: 87,
        parsed: {
          name: 'Alex Chen',
          email: 'alex.chen@example.com',
          phone: '+1 (555) 019-2834',
          location: 'San Francisco, CA',
          summary: 'Experienced Software Engineer with a background in designing high-throughput distributed systems and cloud native architectures.',
          skills: ['JavaScript', 'Python', 'React', 'Docker', 'Kubernetes', 'AWS', 'NodeJS'],
          experience: [
            {
              role: 'Senior Software Engineer',
              company: 'CloudTech Corp',
              startDate: '2023',
              endDate: 'Present',
              description: 'Led a team of 4 engineers to migrate legacy backend monolith to microservices on AWS EKS, reducing page load latency by 40%.'
            }
          ],
          education: [
            {
              degree: 'B.S. Computer Science',
              institution: 'Stanford University',
              year: '2019'
            }
          ]
        },
        themeCustomization: {
          primaryColor: '#0F172A',
          secondaryColor: '#475569',
          accentColor: '#2563EB',
          fontFamily: 'Inter',
          fontSize: 12,
          lineHeight: 1.5,
          margins: 20,
          borderRadius: 4,
          showIcons: true,
          sectionOrder: ['summary', 'experience', 'skills', 'education'],
          hiddenSections: [],
          customSections: []
        }
      };
    }

    // Filter categories
    const categories = ['All', 'Professional', 'Technology', 'Business', 'Creative', 'Research', 'Student', 'Executive', 'ATS 100%', 'Favorites', 'Recently Used', 'Popular', 'Newest'];

    // Load AI recommendation custom matcher based on tech stack
    let recommendedTheme = themes.find(t => t.key === 'google-professional') || themes[0];
    let matchPercentage = 98;
    let matchExplain = 'Your profile indicates strong experience in software systems and structured codebases. We recommend Google Professional for its clean, modern font hierarchy and high 98% ATS parse compatibility.';
    if (activeResume) {
      const skills = (activeResume.parsed?.skills || []).map(s => s.toLowerCase());
      if (skills.some(s => s.includes('research') || s.includes('academic') || s.includes('paper') || s.includes('science'))) {
        recommendedTheme = themes.find(t => t.key === 'research') || themes.find(t => t.key === 'academic') || recommendedTheme;
        matchExplain = 'We recommend Research Professional. Academic roles favor structured timelines and publications sections, ensuring maximum compliance with educational review committees.';
        matchPercentage = 99;
      } else if (skills.some(s => s.includes('design') || s.includes('creative') || s.includes('ui') || s.includes('ux'))) {
        recommendedTheme = themes.find(t => t.key === 'creative') || themes.find(t => t.key === 'meta-modern') || recommendedTheme;
        matchExplain = 'We recommend Creative Portfolio. Creative roles require vibrant, harmonious color schemes and layout spacing to emphasize project presentation and design aesthetics.';
        matchPercentage = 95;
      } else if (skills.some(s => s.includes('python') || s.includes('machine learning') || s.includes('data'))) {
        recommendedTheme = themes.find(t => t.key === 'ai-engineer') || themes.find(t => t.key === 'machine-learning') || recommendedTheme;
        matchExplain = 'We recommend AI Engineer Resume theme. This custom preset optimizes the layout to showcase model details, technical stacks, and dataset projects.';
        matchPercentage = 97;
      } else if (skills.some(s => s.includes('intern') || s.includes('student'))) {
        recommendedTheme = themes.find(t => t.key === 'student') || themes.find(t => t.key === 'internship') || recommendedTheme;
        matchExplain = 'We recommend Internship Resume theme. Designed specifically to emphasize education milestones, capstones, extracurricular achievements over core corporate tenure.';
        matchPercentage = 96;
      }
    }

    // Prepare sections builder ordered list
    const defaultSectionsOrder = ['summary', 'experience', 'skills', 'education', 'projects', 'achievements', 'certificates', 'languages', 'research'];
    const sectionOrder = activeResume?.themeCustomization?.sectionOrder || defaultSectionsOrder;
    const hiddenSections = activeResume?.themeCustomization?.hiddenSections || [];
    const renamedSections = activeResume?.themeCustomization?.renamedSections || {};

    const getSectionDisplayName = (secId) => {
      return renamedSections[secId] || secId.charAt(0).toUpperCase() + secId.slice(1);
    };

    const isRecruiterMode = localStorage.getItem('previewMode') === 'recruiter';

    return `
      <!-- Embedded Canvas Premium Custom Styling -->
      <style>
        .theme-marketplace-workspace {
          display: grid;
          grid-template-columns: 28% 46% 26%;
          gap: 1.5%;
          align-items: start;
        }
        .canvas-btn-group .btn {
          padding: 8px 16px;
          border-radius: 6px;
        }
        .canvas-btn-group .btn.active {
          background: var(--primary-color) !important;
          color: white !important;
          box-shadow: 0 0 10px rgba(37,99,235,0.4);
        }
        .control-slider {
          width: 100%;
          accent-color: var(--primary-color);
        }
        .section-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          margin-bottom: 6px;
        }
        .theme-gallery-img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 6px;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border: 1px solid var(--border-color);
          margin-bottom: 10px;
        }
        .scrollable-sidebar {
          max-height: 85vh;
          overflow-y: auto;
          scrollbar-width: thin;
        }
        .scrollable-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        .scrollable-sidebar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 4px;
        }
        #resume-preview-page {
          background: #ffffff;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          width: 595px;
          min-height: 842px;
          transform-origin: top center;
          transition: all 0.3s ease;
          position: relative;
        }
        @media print {
          body * { visibility: hidden; }
          #resume-preview-page, #resume-preview-page * { visibility: visible; }
          #resume-preview-page { position: absolute; left: 0; top: 0; }
        }
      </style>

      <div class="page-header flex justify-between items-center">
        <div>
          <h2>Enterprise AI Resume Marketplace & Engine</h2>
          <p class="text-secondary">Fully sandboxed Overleaf & Canva-like resume building environment</p>
        </div>
        <div class="flex gap-2">
          <select class="form-select" id="active-resume-select" style="width:250px">
            ${resumes.map(r => `<option value="${r._id}" ${r._id === selectedResumeId ? 'selected' : ''}>📄 ${r.filename}</option>`).join('') || '<option value="">No Resumes Uploaded</option>'}
          </select>
          <button class="btn btn-secondary" id="duplicate-variant-btn">Duplicate Variant</button>
        </div>
      </div>

      ${activeResume ? `
        <!-- THREE-COLUMN CANVA-STYLE THEME BUILDER -->
        <div class="theme-marketplace-workspace">
          
          <!-- COLUMN 1: LOCAL THEME GALLERY -->
          <div class="card p-4 flex flex-col gap-4 scrollable-sidebar">
            <div>
              <h3 class="mb-1">Theme Gallery</h3>
              <p class="text-secondary text-xs">Instantly apply locally stored layouts</p>
            </div>
            <input class="form-input form-input-sm" id="search-themes-input" placeholder="Search themes (e.g. Google)...">
            
            <div class="flex flex-wrap gap-1" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
              ${categories.map(cat => `
                <button class="btn btn-secondary btn-xs filter-cat-btn ${cat === 'All' ? 'active' : ''}" data-cat="${cat}" style="font-size:10px; padding: 2px 6px; margin-bottom: 4px;">${cat}</button>
              `).join('')}
            </div>

            <div class="flex flex-col gap-3" id="gallery-list-container">
              ${themes.map((t) => {
                const isFav = activeResume.favorites?.includes(t.id);
                return `
                  <div class="p-3 rounded glass-card hover-lift theme-item-card" 
                       data-theme-key="${t.key}" 
                       data-theme-name="${t.name.toLowerCase()}" 
                       data-theme-cat="${t.category}" 
                       data-theme-ats="${t.atsScore}"
                       data-theme-popularity="${t.popularity}"
                       data-theme-id="${t.id}"
                       data-theme-fav="${isFav}"
                       style="border: 1px solid var(--border-color)">
                    
                    <div class="theme-gallery-img" style="display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                      <img src="/resume-themes/themes/${t.key}/preview.png" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top:0; left:0;" alt="${t.name}">
                    </div>

                    <div class="flex justify-between items-start mb-1">
                      <strong style="font-size: 13px;">${t.name}</strong>
                      <span class="badge badge-success" style="font-size: 9px; padding: 1px 4px;">${t.atsScore}% ATS</span>
                    </div>
                    <p class="text-xs text-secondary mb-1" style="margin:0">${t.bestFor}</p>
                    
                    <div class="flex items-center justify-between text-xs text-muted mb-2">
                      <span>👍 ${t.popularity} pop</span>
                      <span>📥 ${t.downloads} downloads</span>
                    </div>

                    <div class="flex gap-2">
                      <button class="btn btn-primary btn-xs flex-1" style="font-size:10px; padding: 3px;" data-apply-theme-name="${t.name}">Apply</button>
                      <button class="btn btn-secondary btn-xs" style="font-size:10px; padding: 3px;" data-preview-theme-key="${t.key}">Preview</button>
                      <button class="btn btn-ghost btn-xs favorite-theme-btn" data-theme-fav-id="${t.id}" style="padding: 2px;">
                        ${isFav ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- COLUMN 2: SANDBOXED LIVE RESUME PREVIEW -->
          <div class="flex flex-col gap-4">
            <div class="card p-3 flex justify-between items-center" style="background:var(--bg-secondary)">
              <div class="flex gap-2 items-center">
                <button class="btn btn-sm btn-secondary" id="zoom-out-btn">-</button>
                <span class="text-xs" id="zoom-indicator">100%</span>
                <button class="btn btn-sm btn-secondary" id="zoom-in-btn">+</button>
              </div>

              <!-- Candidate/Recruiter view tabs -->
              <div class="canvas-btn-group flex gap-1" style="background: rgba(0,0,0,0.2); padding: 2px; border-radius: 6px;">
                <button class="btn btn-xs ${!isRecruiterMode ? 'active' : ''}" id="btn-mode-candidate" style="font-size: 11px;">Candidate View</button>
                <button class="btn btn-xs ${isRecruiterMode ? 'active' : ''}" id="btn-mode-recruiter" style="font-size: 11px;">Recruiter View</button>
              </div>

              <div class="flex gap-1">
                <button class="btn btn-sm btn-secondary" id="prev-theme-btn">◀</button>
                <button class="btn btn-sm btn-secondary" id="next-theme-btn">▶</button>
              </div>
            </div>

            <!-- Resume Preview Paper Container -->
            <div style="background:#0F172A; padding:32px 16px; display:flex; justify-content:center; overflow-x:auto; border-radius: 8px; border: 1px solid var(--border-color); min-height: 80vh;">
              
              <!-- Candidate View rendering -->
              <div id="preview-candidate-view" style="display: ${!isRecruiterMode ? 'block' : 'none'};">
                <div id="resume-preview-page" style="
                  background:#FFFFFF; 
                  color:${activeResume.themeCustomization?.primaryColor || '#0F172A'}; 
                  font-family:${activeResume.themeCustomization?.fontFamily === 'Lora' ? 'Georgia, serif' : (activeResume.themeCustomization?.fontFamily === 'Fira Code' ? 'monospace' : 'system-ui')}; 
                  font-size:${activeResume.themeCustomization?.fontSize || 12}px; 
                  line-height:${activeResume.themeCustomization?.lineHeight || 1.5}; 
                  padding:${activeResume.themeCustomization?.margins || 20}px; 
                  border-radius:${activeResume.themeCustomization?.borderRadius || 4}px;
                ">
                  <!-- Header block based on customizable Header Style & Sidebar Position -->
                  <div style="
                    border-bottom: 2px solid ${activeResume.themeCustomization?.accentColor || '#2563EB'}; 
                    padding-bottom: 16px; 
                    margin-bottom: 16px; 
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    text-align: ${activeResume.themeCustomization?.headerStyle === 'centered' ? 'center' : 'left'};
                    flex-direction: ${activeResume.themeCustomization?.headerStyle === 'centered' ? 'column' : 'row'};
                  ">
                    ${activeResume.themeCustomization?.profilePictureUrl ? `
                      <img src="${activeResume.themeCustomization.profilePictureUrl}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid ${activeResume.themeCustomization?.accentColor || '#2563EB'};">
                    ` : ''}
                    <div style="flex: 1;">
                      <h1 style="margin:0 0 4px 0; font-size: 2.2rem; font-weight: 700; color:${activeResume.themeCustomization?.primaryColor || '#0F172A'};">${activeResume.parsed?.name || 'Your Name'}</h1>
                      <div style="color:${activeResume.themeCustomization?.secondaryColor || '#475569'}; font-size:12px;">
                        ${activeResume.themeCustomization?.showIcons ? '📧 ' : ''}${activeResume.parsed?.email || ''} | 
                        ${activeResume.themeCustomization?.showIcons ? '📱 ' : ''}${activeResume.parsed?.phone || ''} | 
                        ${activeResume.themeCustomization?.showIcons ? '📍 ' : ''}${activeResume.parsed?.location || ''}
                      </div>
                    </div>
                  </div>

                  <!-- Ordered dynamic section loop (Section Builder) -->
                  ${sectionOrder.map(secId => {
                    if (hiddenSections.includes(secId)) return '';
                    
                    if (secId === 'summary' && activeResume.parsed?.summary) {
                      return `
                        <div style="margin-bottom: 16px;">
                          <h3 style="color:${activeResume.themeCustomization?.accentColor || '#2563EB'}; margin: 0 0 6px 0; font-size: 1.1rem; text-transform: uppercase;">${getSectionDisplayName('summary')}</h3>
                          <p style="margin: 0; color:${activeResume.themeCustomization?.primaryColor || '#0F172A'}">${activeResume.parsed.summary}</p>
                        </div>
                      `;
                    }

                    if (secId === 'experience' && activeResume.parsed?.experience?.length) {
                      return `
                        <div style="margin-bottom: 16px;">
                          <h3 style="color:${activeResume.themeCustomization?.accentColor || '#2563EB'}; margin: 0 0 8px 0; font-size: 1.1rem; text-transform: uppercase;">${getSectionDisplayName('experience')}</h3>
                          ${activeResume.parsed.experience.map(exp => `
                            <div style="margin-bottom: 12px;">
                              <div style="display:flex; justify-content:space-between; font-weight:600;">
                                <span>${exp.role} — ${exp.company}</span>
                                <span style="font-size:11px; color:${activeResume.themeCustomization?.secondaryColor || '#475569'}">${exp.startDate} - ${exp.endDate}</span>
                              </div>
                              <p style="margin: 4px 0 0 0; color:${activeResume.themeCustomization?.secondaryColor || '#475569'}">${exp.description}</p>
                            </div>
                          `).join('')}
                        </div>
                      `;
                    }

                    if (secId === 'skills' && activeResume.parsed?.skills?.length) {
                      return `
                        <div style="margin-bottom: 16px;">
                          <h3 style="color:${activeResume.themeCustomization?.accentColor || '#2563EB'}; margin: 0 0 8px 0; font-size: 1.1rem; text-transform: uppercase;">${getSectionDisplayName('skills')}</h3>
                          <div style="display:flex; flex-wrap:wrap; gap: 6px;">
                            ${activeResume.parsed.skills.map(skill => `
                              <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; border: 1px solid ${activeResume.themeCustomization?.accentColor || '#2563EB'}; color:${activeResume.themeCustomization?.accentColor || '#2563EB'}; font-weight:500;">
                                ${skill}
                              </span>
                            `).join('')}
                          </div>
                        </div>
                      `;
                    }

                    if (secId === 'education' && activeResume.parsed?.education?.length) {
                      return `
                        <div style="margin-bottom: 16px;">
                          <h3 style="color:${activeResume.themeCustomization?.accentColor || '#2563EB'}; margin: 0 0 8px 0; font-size: 1.1rem; text-transform: uppercase;">${getSectionDisplayName('education')}</h3>
                          ${activeResume.parsed.education.map(edu => `
                            <div style="display:flex; justify-content:space-between; font-weight:600; margin-bottom: 4px;">
                              <span>${edu.degree} — ${edu.institution}</span>
                              <span style="font-size:11px; color:${activeResume.themeCustomization?.secondaryColor || '#475569'}">${edu.year}</span>
                            </div>
                          `).join('')}
                        </div>
                      `;
                    }

                    return '';
                  }).join('')}

                  <!-- Custom sections injected -->
                  ${activeResume.themeCustomization?.customSections?.map(cs => `
                    <div style="margin-bottom: 16px;">
                      <h3 style="color:${activeResume.themeCustomization?.accentColor || '#2563EB'}; margin: 0 0 6px 0; font-size: 1.1rem; text-transform: uppercase;">${cs.title}</h3>
                      <p style="margin:0; color:${activeResume.themeCustomization?.primaryColor || '#0F172A'}">${cs.content}</p>
                    </div>
                  `).join('') || ''}
                </div>
              </div>

              <!-- Recruiter Analysis Preview View -->
              <div id="preview-recruiter-view" style="display: ${isRecruiterMode ? 'block' : 'none'}; width: 595px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 24px; color: var(--text-color);">
                <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 20px;">
                  <h3 style="margin:0;">🔍 Recruiter Assessment Portal</h3>
                  <p class="text-secondary text-xs mt-1">AI-parsed structure & resume keywords quality checklist</p>
                </div>

                <div class="mb-4 flex items-center justify-between p-3 rounded" style="background: rgba(37,99,235,0.06); border: 1px solid var(--primary-color)">
                  <div>
                    <div class="text-xs text-secondary">Resume Strength Index</div>
                    <strong style="font-size: 18px; color: var(--primary-color);">${activeResume.score || 85}% Strength</strong>
                  </div>
                  <span class="badge badge-success">Highly Compatible</span>
                </div>

                <div class="mb-4">
                  <h4 class="mb-2" style="font-size: 13px;">ATS Parsed View & Keyword Highlights</h4>
                  <div style="max-height: 200px; overflow-y:auto; padding:12px; border-radius:6px; border:1px solid var(--border-color); background: rgba(0,0,0,0.3); font-family: monospace; font-size: 11px;">
                    <span style="color:var(--text-color);">${activeResume.parsed?.summary || ''}</span>
                    <hr style="border-color:var(--border-color); margin: 8px 0;">
                    <div>
                      <strong>Extracted Skills:</strong><br>
                      ${(activeResume.parsed?.skills || []).map(s => {
                        const isMatch = ['javascript', 'python', 'docker', 'react', 'kubernetes', 'aws'].includes(s.toLowerCase());
                        return `<span style="color: ${isMatch ? '#10B981' : '#EAB308'}; font-weight: bold; margin-right: 6px;">${s}</span>`;
                      }).join(', ')}
                    </div>
                  </div>
                </div>

                <div class="grid grid-2 gap-4">
                  <div>
                    <h5 class="text-success mb-1">✓ Core Strengths</h5>
                    <ul class="text-xs text-secondary pl-4" style="list-style-type: disc;">
                      <li>Strong technical skill density</li>
                      <li>Clarity of role descriptions</li>
                      <li>ATS friendly header structuring</li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="text-warning mb-1">⚠ Identified Weaknesses</h5>
                    <ul class="text-xs text-secondary pl-4" style="list-style-type: disc;">
                      <li>Missing social link validation</li>
                      <li>Summary contains buzzwords</li>
                      <li>Education section lacks GPA</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            <!-- Export Bar -->
            <div class="card p-4">
              <h4 class="mb-3">Download & Export Options</h4>
              <div class="grid grid-6 gap-2">
                <button class="btn btn-secondary btn-sm" id="exp-pdf-btn">Export PDF</button>
                <button class="btn btn-secondary btn-sm" id="exp-docx-btn">Export DOCX</button>
                <button class="btn btn-secondary btn-sm" id="exp-html-btn">Export HTML</button>
                <button class="btn btn-secondary btn-sm" id="exp-md-btn">Markdown</button>
                <button class="btn btn-secondary btn-sm" id="exp-json-btn">JSON Schema</button>
                <button class="btn btn-secondary btn-sm" id="exp-png-btn">SVG Snapshot</button>
              </div>
            </div>
          </div>

          <!-- COLUMN 3: CUSTOMIZATION PANEL & AI RECOMMENDATIONS -->
          <div class="flex flex-col gap-6 scrollable-sidebar">
            
            <!-- AI Recommendation Card -->
            <div class="card" style="background:var(--bg-secondary); border: 1px dashed var(--primary-color)">
              <h3 class="mb-2">AI Theme Recommendation</h3>
              <div style="font-size:11px; margin-bottom:8px;">
                🤖 Recommended Theme: <strong>${recommendedTheme.name}</strong><br>
                Industry Match: <strong>${matchPercentage}%</strong> | ATS: <strong>${recommendedTheme.atsScore}%</strong>
              </div>
              <p class="text-secondary" style="font-size:11.5px; line-height:1.4; margin:0">
                <strong>Why?</strong> ${matchExplain}
              </p>
            </div>

            <!-- Job Description Optimizer -->
            <div class="card">
              <h3 class="mb-2">ATS JD Optimizer</h3>
              <p class="text-xs text-secondary mb-3">Paste a job description to identify missing skill keywords</p>
              <textarea class="form-textarea form-textarea-sm" style="font-size:11px; min-height:60px;" id="jd-optimizer-textarea" placeholder="Paste target job description here..."></textarea>
              <button class="btn btn-primary btn-xs w-full mt-2" id="run-jd-optimizer-btn">Analyze & Tailor</button>
              <div class="hidden mt-3 p-2 rounded text-xs" id="jd-optimizer-feedback" style="background: rgba(37,99,235,0.1); border:1px solid var(--primary-color)"></div>
            </div>

            <!-- AI Theme Generator Prompt -->
            <div class="card">
              <h3 class="mb-2">AI Design Generator</h3>
              <p class="text-xs text-secondary mb-3">Describe a style (e.g. "Create a minimal layout inspired by Apple's design")</p>
              <input class="form-input form-input-sm" id="ai-generator-prompt" placeholder="e.g. Apple minimalist modern Serif...">
              <button class="btn btn-secondary btn-xs w-full mt-2" id="run-ai-theme-generator-btn">Generate Style</button>
            </div>

            <!-- SECTION BUILDER -->
            <div class="card">
              <h3 class="mb-2">Section Manager (Drag & Reorder)</h3>
              <p class="text-xs text-secondary mb-3">Arrange, rename or hide resume sections</p>
              <div class="flex flex-col gap-1">
                ${sectionOrder.map(secId => {
                  const isHidden = hiddenSections.includes(secId);
                  return `
                    <div class="section-item-row" style="opacity: ${isHidden ? 0.5 : 1};">
                      <span style="font-weight: 500;">${getSectionDisplayName(secId)}</span>
                      <div class="flex gap-1">
                        <button class="btn btn-ghost btn-xs move-sec-btn" data-sec-id="${secId}" data-dir="up">▲</button>
                        <button class="btn btn-ghost btn-xs move-sec-btn" data-sec-id="${secId}" data-dir="down">▼</button>
                        <button class="btn btn-ghost btn-xs rename-sec-btn" data-sec-id="${secId}">✏</button>
                        <button class="btn btn-ghost btn-xs toggle-sec-visibility" data-sec-id="${secId}">${isHidden ? '👁' : '❌'}</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
              <button class="btn btn-secondary btn-xs w-full mt-3" id="add-custom-sec-btn">+ Add Custom Section</button>
            </div>

            <!-- Visual customizer sliders/colors -->
            <div class="card">
              <h3 class="mb-3">Visual Style Options</h3>
              <form id="theme-customizer-form" class="flex flex-col gap-3 text-xs">
                
                <div class="form-group">
                  <label class="form-label text-xs">Profile Picture</label>
                  <input type="file" id="upload-profile-pic-btn" class="form-input" style="font-size:11px;" accept="image/*">
                </div>

                <div class="grid grid-3 gap-2">
                  <div class="form-group">
                    <label class="form-label text-xs">Accent</label>
                    <input type="color" class="form-input" style="height:32px; padding:2px;" name="accentColor" value="${activeResume.themeCustomization?.accentColor || '#2563EB'}">
                  </div>
                  <div class="form-group">
                    <label class="form-label text-xs">Primary</label>
                    <input type="color" class="form-input" style="height:32px; padding:2px;" name="primaryColor" value="${activeResume.themeCustomization?.primaryColor || '#0F172A'}">
                  </div>
                  <div class="form-group">
                    <label class="form-label text-xs">Secondary</label>
                    <input type="color" class="form-input" style="height:32px; padding:2px;" name="secondaryColor" value="${activeResume.themeCustomization?.secondaryColor || '#475569'}">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label text-xs">Header Style</label>
                  <select class="form-select" name="headerStyle">
                    <option value="centered" ${activeResume.themeCustomization?.headerStyle === 'centered' ? 'selected' : ''}>Centered Header</option>
                    <option value="left" ${activeResume.themeCustomization?.headerStyle === 'left' ? 'selected' : ''}>Left Header</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label text-xs">Font Family</label>
                  <select class="form-select" name="fontFamily">
                    <option value="Inter" ${activeResume.themeCustomization?.fontFamily === 'Inter' ? 'selected' : ''}>Inter (Sans)</option>
                    <option value="Roboto" ${activeResume.themeCustomization?.fontFamily === 'Roboto' ? 'selected' : ''}>Roboto (Sans)</option>
                    <option value="Lora" ${activeResume.themeCustomization?.fontFamily === 'Lora' ? 'selected' : ''}>Lora (Serif)</option>
                    <option value="Fira Code" ${activeResume.themeCustomization?.fontFamily === 'Fira Code' ? 'selected' : ''}>Fira Code (Mono)</option>
                  </select>
                </div>

                <div class="grid grid-2 gap-2">
                  <div class="form-group">
                    <label class="form-label text-xs">Font Size (px)</label>
                    <input type="number" class="form-input" name="fontSize" min="8" max="24" value="${activeResume.themeCustomization?.fontSize || 12}">
                  </div>
                  <div class="form-group">
                    <label class="form-label text-xs">Line Height</label>
                    <input type="number" class="form-input" name="lineHeight" step="0.1" min="1" max="2.5" value="${activeResume.themeCustomization?.lineHeight || 1.5}">
                  </div>
                </div>

                <div class="grid grid-2 gap-2">
                  <div class="form-group">
                    <label class="form-label text-xs">Margins (px)</label>
                    <input type="number" class="form-input" name="margins" min="5" max="60" value="${activeResume.themeCustomization?.margins || 20}">
                  </div>
                  <div class="form-group">
                    <label class="form-label text-xs">Border Radius</label>
                    <input type="number" class="form-input" name="borderRadius" min="0" max="20" value="${activeResume.themeCustomization?.borderRadius || 4}">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label text-xs">Page Size</label>
                  <select class="form-select" name="pageSize">
                    <option value="A4" ${activeResume.themeCustomization?.pageSize === 'A4' ? 'selected' : ''}>A4 Standard</option>
                    <option value="Letter" ${activeResume.themeCustomization?.pageSize === 'Letter' ? 'selected' : ''}>US Letter</option>
                    <option value="Legal" ${activeResume.themeCustomization?.pageSize === 'Legal' ? 'selected' : ''}>US Legal</option>
                  </select>
                </div>

                <div class="form-group flex items-center gap-2">
                  <input type="checkbox" name="showIcons" value="true" ${activeResume.themeCustomization?.showIcons ? 'checked' : ''}>
                  <label class="text-xs">Show section / contact icons</label>
                </div>

                <button type="submit" class="btn btn-primary btn-xs w-full mt-1">Save Styles</button>
              </form>
            </div>

            <!-- Version History Restore -->
            <div class="card">
              <h3 class="mb-3">Version History Restore</h3>
              <div class="flex flex-col gap-2" id="versions-history-list" style="max-height:120px; overflow-y:auto;">
                <!-- Dynamically populated -->
              </div>
            </div>

          </div>
        </div>
      ` : `
        <div class="card p-8 text-center">
          <h3>No Resume Selected</h3>
          <p class="text-secondary">Please upload or select a resume document to enable custom layout parameters.</p>
        </div>
      `}

      <!-- sandboxed theme preview modal -->
      <div id="fullscreen-theme-modal" class="hidden" style="position:fixed; top:0; left:0; width:100%; height:100vh; background: rgba(11,14,20,0.95); z-index: 2000; display:flex; flex-col; justify-content:center; align-items:center;">
        <div class="card" style="width: 80%; height: 90vh; display:flex; flex-direction:column; overflow:hidden;">
          <div class="flex justify-between items-center mb-4 pb-2" style="border-bottom: 1px solid var(--border-color)">
            <h3 id="modal-theme-title">Theme Preview</h3>
            <button class="btn btn-ghost" id="close-theme-modal">✕ Close</button>
          </div>
          <div id="modal-theme-content" style="flex:1; overflow-y:auto; display:flex; justify-content:center; background:#1e293b; padding:32px;"></div>
        </div>
      </div>
    `;
  }
};