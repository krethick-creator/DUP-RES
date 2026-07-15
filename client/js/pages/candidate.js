const CandidateDashboard = {
  section: 'overview',
  user: null,

  navSections: [
    {
      title: 'Main', items: [
        { id: 'overview', icon: '📊', label: 'Overview' },
        { id: 'profile', icon: '👤', label: 'Profile' },
        { id: 'applications', icon: '📋', label: 'Applications' }
      ]
    },
    {
      title: 'AI Resume', items: [
        { id: 'resume-builder', icon: '🛠️', label: 'Resume Builder' },
        { id: 'resume', icon: '📄', label: 'Upload Resume' },
        { id: 'resume-simulation', icon: '🎯', label: 'Resume Simulation' },
        { id: 'resume-screening', icon: '🔍', label: 'Resume Screening' },
        { id: 'resume-improvement', icon: '📈', label: 'Resume Improvement' },
        { id: 'resume-matching', icon: '🤝', label: 'Resume Matching' },
        { id: 'dynamic-resume', icon: '✨', label: 'Dynamic Resume' }
      ]
    },
    {
      title: 'AI Tools', items: [
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
      'resume-builder': () => this.renderResumeBuilder(),
      'resume-simulation': () => this.renderResumeSimulationPage(),
      'resume-screening': () => this.renderResumeScreeningPage(),
      'resume-improvement': () => this.renderResumeImprovementPage(),
      'resume-matching': () => this.renderResumeMatchingPage(),
      'dynamic-resume': () => this.renderDynamicResumePage(),
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
      settings: () => this.renderSettings()
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
            <div class="flex justify-between items-center p-4 rounded" style="background:var(--bg-secondary); border: 1px solid var(--border-color)">
              <div class="flex items-center gap-3">
                ${UI.getIcon('📧', 'candidate', '28px')}
                <div>
                  <strong>Email Address</strong>
                  <div class="text-sm text-secondary mb-1">${this.user?.email || ''}</div>
                  <div class="text-xs flex items-center gap-2">
                    ${this.user?.emailVerified ? `
                      <span class="badge badge-success" style="padding: 2px 8px; font-size:10px;">
                        ✅ ${this.user.verificationMethod === 'google' ? 'Google Verified' : 'Verified'}
                      </span>
                      <span class="text-muted text-xxs">Method: ${this.user.verificationMethod === 'google' ? 'Google OAuth' : 'Email Token'}</span>
                    ` : `
                      <span class="badge badge-warning" style="padding: 2px 8px; font-size:10px;">
                        🟡 Verification Required
                      </span>
                    `}
                  </div>
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
    // AI RESUME BUILDER PAGE BINDINGS
    // ==========================================
    if (this.section === 'resume-builder') {
      const activeResumeId = localStorage.getItem('activeResumeId') || '';

      // Back to landing
      document.getElementById('btn-back-landing')?.addEventListener('click', () => {
        localStorage.removeItem('activeResumeId');
        this.render('resume-builder').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      });

      // Manual start
      document.getElementById('start-manual-btn')?.addEventListener('click', async () => {
        try {
          const fd = new FormData();
          const emptyResume = {
            name: this.user?.name || 'Your Name',
            email: this.user?.email || 'yourname@example.com',
            phone: '',
            location: '',
            summary: 'Experienced professional.',
            skills: ['JavaScript'],
            experience: [],
            education: []
          };
          const fakeBlob = new Blob([JSON.stringify(emptyResume)], { type: 'application/json' });
          fd.append('resume', fakeBlob, 'My_Resume.json');
          const res = await API.uploadResume(fd);
          if (res && res.resume && res.resume._id) {
            localStorage.setItem('activeResumeId', res.resume._id);
          }
          UI.toast('Manual builder workspace initialized!', 'success');
          this.render('resume-builder').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      // AI generation workflow triggering
      document.getElementById('start-ai-btn')?.addEventListener('click', async () => {
        const modal = document.getElementById('ai-workflow-modal');
        if (modal) modal.classList.remove('hidden');

        const steps = [
          'wf-step-1', 'wf-step-2', 'wf-step-3', 'wf-step-4',
          'wf-step-5', 'wf-step-6', 'wf-step-7', 'wf-step-8', 'wf-step-9'
        ];

        let currentStep = 0;
        const progressInterval = setInterval(() => {
          if (currentStep < steps.length) {
            const el = document.getElementById(steps[currentStep]);
            if (el) {
              el.textContent = el.textContent.replace('⏳', '✓');
              el.style.color = '#10B981';
            }
            currentStep++;
            const bar = document.getElementById('workflow-progress-bar');
            if (bar) bar.style.width = `${Math.floor((currentStep / steps.length) * 100)}%`;
          } else {
            clearInterval(progressInterval);
          }
        }, 300);

        try {
          const res = await API.generateAIResume();
          if (res && res.resume && res.resume._id) {
            localStorage.setItem('activeResumeId', res.resume._id);
            UI.toast('AI Resume Generated Successfully!', 'success');
          }
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          setTimeout(() => {
            if (modal) modal.classList.add('hidden');
            this.render('resume-builder').then(html => {
              document.getElementById('app').innerHTML = html;
              this.bind();
            });
          }, 3000);
        }
      });

      // Tab switcher
      const tabHeaderBtns = document.querySelectorAll('.tab-header-btn');
      tabHeaderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tabHeaderBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const targetTab = btn.getAttribute('data-tab');
          document.querySelectorAll('.editor-tab-content').forEach(content => {
            content.classList.remove('active');
          });
          document.getElementById(`tab-content-${targetTab}`).classList.add('active');
        });
      });

      // Dropdown selector for active resume
      document.getElementById('active-resume-select')?.addEventListener('change', (e) => {
        const id = e.target.value;
        localStorage.setItem('activeResumeId', id);
        this.render('resume-builder').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      });

      // Save content info
      document.getElementById('save-content-info-btn')?.addEventListener('click', async () => {
        const parsedData = {
          name: document.getElementById('edit-name')?.value || '',
          email: document.getElementById('edit-email')?.value || '',
          phone: document.getElementById('edit-phone')?.value || '',
          location: document.getElementById('edit-location')?.value || '',
          summary: document.getElementById('edit-summary')?.value || ''
        };
        try {
          await API.updateResumeContent(activeResumeId, { parsed: parsedData });
          UI.toast('Personal info draft saved!', 'success');
          this.render('resume-builder').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      // Add experience row
      document.getElementById('add-exp-btn')?.addEventListener('click', () => {
        const container = document.getElementById('experience-edit-list');
        const count = container.children.length;
        const row = document.createElement('div');
        row.className = 'card p-3 exp-edit-row';
        row.style.background = 'rgba(255,255,255,0.01)';
        row.style.border = '1px solid var(--border-color)';
        row.innerHTML = `
          <div class="grid grid-2 gap-2 mb-2">
            <div class="form-group"><label class="form-label text-xs">Role</label><input class="form-input exp-role" value=""></div>
            <div class="form-group"><label class="form-label text-xs">Company</label><input class="form-input exp-company" value=""></div>
            <div class="form-group"><label class="form-label text-xs">Start Date</label><input class="form-input exp-start" value=""></div>
            <div class="form-group"><label class="form-label text-xs">End Date</label><input class="form-input exp-end" value=""></div>
          </div>
          <div class="form-group">
            <div class="flex justify-between items-center mb-1">
              <label class="form-label text-xs">Description</label>
              <button class="ai-inline-btn" data-action="Improve Bullet Points" data-target="exp-desc-${count}">✨ Improve</button>
            </div>
            <textarea class="form-textarea exp-desc" id="exp-desc-${count}" style="min-height: 80px;"></textarea>
          </div>
          <button class="btn btn-danger btn-xs mt-2 delete-exp-btn">Remove</button>
        `;
        container.appendChild(row);
        row.querySelector('.delete-exp-btn').addEventListener('click', () => row.remove());
      });

      // Add Project row
      document.getElementById('add-project-btn')?.addEventListener('click', () => {
        const container = document.getElementById('projects-edit-list');
        const count = container.children.length;
        const row = document.createElement('div');
        row.className = 'card p-3 proj-edit-row';
        row.style.background = 'rgba(255,255,255,0.01)';
        row.style.border = '1px solid var(--border-color)';
        row.innerHTML = `
          <div class="form-group mb-2"><label class="form-label text-xs">Project Title</label><input class="form-input proj-title" value=""></div>
          <div class="form-group mb-2"><label class="form-label text-xs">Technologies (comma separated)</label><input class="form-input proj-tech" value=""></div>
          <div class="form-group">
            <div class="flex justify-between items-center mb-1">
              <label class="form-label text-xs">Description</label>
              <button class="ai-inline-btn" data-action="Improve Bullet Points" data-target="proj-desc-${count}">✨ Improve</button>
            </div>
            <textarea class="form-textarea proj-desc" id="proj-desc-${count}" style="min-height: 80px;"></textarea>
          </div>
          <button class="btn btn-danger btn-xs mt-2 delete-proj-btn">Remove</button>
        `;
        container.appendChild(row);
        row.querySelector('.delete-proj-btn').addEventListener('click', () => row.remove());
      });

      // Add Education row
      document.getElementById('add-edu-btn')?.addEventListener('click', () => {
        const container = document.getElementById('education-edit-list');
        const row = document.createElement('div');
        row.className = 'card p-3 edu-edit-row';
        row.style.background = 'rgba(255,255,255,0.01)';
        row.style.border = '1px solid var(--border-color)';
        row.innerHTML = `
          <div class="grid grid-3 gap-2">
            <div class="form-group"><label class="form-label text-xs">Institution</label><input class="form-input edu-inst" value=""></div>
            <div class="form-group"><label class="form-label text-xs">Degree</label><input class="form-input edu-degree" value=""></div>
            <div class="form-group"><label class="form-label text-xs">Year</label><input class="form-input edu-year" value=""></div>
          </div>
          <button class="btn btn-danger btn-xs mt-2 delete-edu-btn">Remove</button>
        `;
        container.appendChild(row);
        row.querySelector('.delete-edu-btn').addEventListener('click', () => row.remove());
      });

      // Handle delete clicks for initial list items
      document.querySelectorAll('.delete-exp-btn').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.exp-edit-row').remove());
      });
      document.querySelectorAll('.delete-proj-btn').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.proj-edit-row').remove());
      });
      document.querySelectorAll('.delete-edu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.edu-edit-row').remove());
      });

      // Save Experience
      document.getElementById('save-content-exp-btn')?.addEventListener('click', async () => {
        const experience = [];
        document.querySelectorAll('.exp-edit-row').forEach(row => {
          experience.push({
            role: row.querySelector('.exp-role').value,
            company: row.querySelector('.exp-company').value,
            startDate: row.querySelector('.exp-start').value,
            endDate: row.querySelector('.exp-end').value,
            description: row.querySelector('.exp-desc').value
          });
        });
        try {
          await API.updateResumeContent(activeResumeId, { parsed: { experience } });
          UI.toast('Work history draft saved!', 'success');
          this.render('resume-builder').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      // Save Projects
      document.getElementById('save-content-proj-btn')?.addEventListener('click', async () => {
        const projects = [];
        document.querySelectorAll('.proj-edit-row').forEach(row => {
          projects.push({
            title: row.querySelector('.proj-title').value,
            technologiesUsed: row.querySelector('.proj-tech').value.split(',').map(s => s.trim()).filter(Boolean),
            description: row.querySelector('.proj-desc').value
          });
        });
        try {
          await API.updateResumeContent(activeResumeId, { parsed: { projects } });
          UI.toast('Projects saved!', 'success');
          this.render('resume-builder').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      // Save Skills
      document.getElementById('save-content-skills-btn')?.addEventListener('click', async () => {
        const skills = document.getElementById('edit-skills')?.value?.split(',').map(s => s.trim()).filter(Boolean) || [];
        try {
          await API.updateResumeContent(activeResumeId, { parsed: { skills } });
          UI.toast('Skills saved!', 'success');
          this.render('resume-builder').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      // Save Education
      document.getElementById('save-content-edu-btn')?.addEventListener('click', async () => {
        const education = [];
        document.querySelectorAll('.edu-edit-row').forEach(row => {
          education.push({
            institution: row.querySelector('.edu-inst').value,
            degree: row.querySelector('.edu-degree').value,
            year: row.querySelector('.edu-year').value
          });
        });
        try {
          await API.updateResumeContent(activeResumeId, { parsed: { education } });
          UI.toast('Education saved!', 'success');
          this.render('resume-builder').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      // Inline AI buttons click handlers
      document.querySelectorAll('.ai-inline-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const action = btn.getAttribute('data-action');
          const targetId = btn.getAttribute('data-target');
          const textarea = document.getElementById(targetId);
          if (!textarea) return;

          const originalText = btn.textContent;
          btn.textContent = '⚡...';
          btn.disabled = true;

          try {
            const res = await API.post('/ai/candidate-ai', { action, context: { text: textarea.value } });
            if (res && res.response) {
              textarea.value = res.response;
              UI.toast('Text optimized by AI!', 'success');
            }
          } catch (err) {
            UI.toast(err.message, 'error');
          } finally {
            btn.textContent = originalText;
            btn.disabled = false;
          }
        });
      });

      // Preset theme click handlers
      document.querySelectorAll('.preset-theme-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const presetName = btn.getAttribute('data-preset');
          try {
            await API.post(`/resumes/${activeResumeId}/theme/apply`, { themeKey: presetName });
            UI.toast('Theme applied!', 'success');
            this.render('resume-builder').then(html => {
              document.getElementById('app').innerHTML = html;
              this.bind();
            });
          } catch (err) { UI.toast(err.message, 'error'); }
        });
      });

      // Save styles customizer form submission
      document.getElementById('theme-customizer-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const customization = {
          accentColor: form.get('accentColor'),
          primaryColor: form.get('primaryColor'),
          secondaryColor: form.get('secondaryColor'),
          fontFamily: form.get('fontFamily'),
          fontSize: parseInt(form.get('fontSize')),
          lineHeight: parseFloat(form.get('lineHeight')),
          margins: parseInt(form.get('margins')),
          borderRadius: parseInt(form.get('borderRadius'))
        };
        try {
          await API.post(`/resumes/${activeResumeId}/theme/customize`, { customization });
          UI.toast('Styles saved!', 'success');
          this.render('resume-builder').then(html => {
            document.getElementById('app').innerHTML = html;
            this.bind();
          });
        } catch (err) { UI.toast(err.message, 'error'); }
      });

      // Zoom preview logic
      let zoom = 90;
      const previewEl = document.getElementById('resume-preview-page');
      document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
        zoom = Math.min(zoom + 10, 150);
        if (previewEl) {
          previewEl.style.transform = `scale(${zoom / 100})`;
          document.getElementById('zoom-percent-text').textContent = `${zoom}%`;
        }
      });
      document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
        zoom = Math.max(zoom - 10, 50);
        if (previewEl) {
          previewEl.style.transform = `scale(${zoom / 100})`;
          document.getElementById('zoom-percent-text').textContent = `${zoom}%`;
        }
      });

      // Mode Switch Candidate / Recruiter Preview
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

      // AI Copilot features
      document.getElementById('ai-improve-resume-btn')?.addEventListener('click', async () => {
        const feedback = document.getElementById('ai-copilot-feedback');
        feedback.classList.remove('hidden');
        feedback.innerHTML = '⚡ Generating Professional Rewrite...';
        try {
          const res = await API.post('/ai/candidate-ai', { action: 'Improve Resume', context: { resumeId: activeResumeId } });
          feedback.innerHTML = `<strong>Feedback:</strong><p class="mt-1">${res.response || 'No feedback suggestions returned'}</p>`;
        } catch (err) { feedback.innerHTML = `<span class="text-danger">${err.message}</span>`; }
      });

      document.getElementById('ai-optimize-ats-btn')?.addEventListener('click', async () => {
        const feedback = document.getElementById('ai-copilot-feedback');
        feedback.classList.remove('hidden');
        feedback.innerHTML = '⚡ Optimizing ATS keywords...';
        try {
          const res = await API.post(`/resumes/${activeResumeId}/optimize`, { jobDescription: 'Core systems development, nodeJS, databases' });
          feedback.innerHTML = `<strong>ATS Keywords Optimized:</strong><p class="mt-1">Added missing keywords: ${(res.missingKeywords || []).join(', ') || 'None'}</p>`;
        } catch (err) { feedback.innerHTML = `<span class="text-danger">${err.message}</span>`; }
      });

      document.getElementById('ai-grammar-check-btn')?.addEventListener('click', async () => {
        const feedback = document.getElementById('ai-copilot-feedback');
        feedback.classList.remove('hidden');
        feedback.innerHTML = '⚡ Checking grammar & syntax...';
        try {
          const res = await API.post('/ai/candidate-ai', { action: 'Grammar Check', context: { resumeId: activeResumeId } });
          feedback.innerHTML = `<strong>Grammar Check:</strong><p class="mt-1">${res.response || 'No errors found!'}</p>`;
        } catch (err) { feedback.innerHTML = `<span class="text-danger">${err.message}</span>`; }
      });

      document.getElementById('ai-run-tailor-btn')?.addEventListener('click', async () => {
        const jd = document.getElementById('ai-tailor-jd').value;
        const feedback = document.getElementById('ai-copilot-feedback');
        feedback.classList.remove('hidden');
        feedback.innerHTML = '⚡ Tailoring resume structure...';
        try {
          const res = await API.post(`/resumes/${activeResumeId}/dynamic`, { jobDescription: jd });
          feedback.innerHTML = `<strong>Tailored Recommendations:</strong><p class="mt-1">${res.dynamic?.tailoredSummary || 'Completed!'}</p>`;
        } catch (err) { feedback.innerHTML = `<span class="text-danger">${err.message}</span>`; }
      });

      // Export Buttons
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
            <head><title>Print Resume</title></head>
            <body>${content}<script>window.onload = function() { window.print(); window.close(); }</script></body>
          </html>
        `);
        printWindow.document.close();
      });

      document.getElementById('exp-docx-btn')?.addEventListener('click', () => {
        const text = document.getElementById('resume-preview-page').innerText;
        downloadTextFile(text, 'resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      });

      document.getElementById('exp-html-btn')?.addEventListener('click', () => {
        const html = document.getElementById('resume-preview-page').outerHTML;
        downloadTextFile(html, 'resume.html', 'text/html');
      });
    }

        // ==========================================
    // RESUME SIMULATION PAGE BINDINGS
    // ==========================================
    if (this.section === 'resume-simulation') {
      const resetSimulation = () => {
        localStorage.removeItem('simResumeId');
        localStorage.removeItem('generalSimResult');
        localStorage.removeItem('companySimResult');
        this.render('resume-simulation').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      };

      document.getElementById('btn-reset-simulation')?.addEventListener('click', resetSimulation);

      // Choose Manual Resume
      document.getElementById('choose-manual-sim-btn')?.addEventListener('click', () => {
        const id = document.getElementById('sim-select-manual').value;
        if (!id) return UI.toast('No manual resume available', 'error');
        localStorage.setItem('simResumeId', id);
        this.render('resume-simulation').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      });

      // Choose Dynamic Resume
      document.getElementById('choose-dynamic-sim-btn')?.addEventListener('click', () => {
        const id = document.getElementById('sim-select-dynamic').value;
        if (!id) return UI.toast('No dynamic resume available', 'error');
        localStorage.setItem('simResumeId', id);
        this.render('resume-simulation').then(html => {
          document.getElementById('app').innerHTML = html;
          this.bind();
        });
      });

      // General Simulation Runner
      document.getElementById('btn-run-general-sim')?.addEventListener('click', async (e) => {
        const activeId = localStorage.getItem('simResumeId');
        if (!activeId) return;

        const btn = e.target;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⚡ Simulating Recruiter Evaluation...';

        try {
          const res = await API.advancedSimulateResume(activeId, {});
          if (res && res.simulation) {
            localStorage.setItem('generalSimResult', JSON.stringify(res.simulation));
            UI.toast('General Evaluation Complete!', 'success');
            
            // Re-render and bind to show results
            this.render('resume-simulation').then(html => {
              document.getElementById('app').innerHTML = html;
              this.bind();
            });
          }
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });

      // Populate General Simulation results if they exist in localStorage
      const generalResultStr = localStorage.getItem('generalSimResult');
      if (generalResultStr) {
        const sim = JSON.parse(generalResultStr);
        const resultsContainer = document.getElementById('simulation-general-results');
        const triggerContainer = document.getElementById('sim-general-trigger-container');
        
        if (resultsContainer) resultsContainer.classList.remove('hidden');
        if (triggerContainer) triggerContainer.style.display = 'none';

        // GAUGE
        const overallGauge = document.getElementById('gauge-overall');
        if (overallGauge) {
          overallGauge.textContent = sim.overallScore || 0;
          overallGauge.style.borderColor = (sim.overallScore || 0) >= 80 ? '#10B981' : ((sim.overallScore || 0) >= 60 ? '#3B82F6' : '#EF4444');
        }

        // RATING BADGE
        const ratingBadge = document.getElementById('badge-overall-rating');
        if (ratingBadge) {
          ratingBadge.textContent = sim.overallRating || 'Good';
          ratingBadge.className = `badge mt-2 badge-${sim.overallRating === 'Excellent' ? 'success' : (sim.overallRating === 'Good' ? 'primary' : (sim.overallRating === 'Average' ? 'warning' : 'danger'))}`;
        }

        // PROGRESS BARS
        const setProgress = (textId, fillId, val) => {
          const textEl = document.getElementById(textId);
          const fillEl = document.getElementById(fillId);
          if (textEl) textEl.textContent = `${val || 0}%`;
          if (fillEl) fillEl.style.width = `${val || 0}%`;
        };

        setProgress('text-hiring-prob', 'fill-hiring-prob', sim.hiringProbability);
        setProgress('text-ats-compat', 'fill-ats-compat', sim.atsCompatibilityScore);
        setProgress('text-confidence', 'fill-confidence', sim.confidenceScore);
        setProgress('text-tech-strength', 'fill-tech-strength', sim.technicalStrength);
        setProgress('text-exp-quality', 'fill-exp-quality', sim.experienceQuality);
        setProgress('text-skill-coverage', 'fill-skill-coverage', sim.skillCoverage);
        setProgress('text-comm-score', 'fill-comm-score', sim.communicationScore);
        setProgress('text-lead-score', 'fill-lead-score', sim.leadershipScore);
        setProgress('text-proj-quality', 'fill-proj-quality', sim.projectQuality);
        setProgress('text-edu-strength', 'fill-edu-strength', sim.educationStrength);

        // LISTS
        const populateList = (id, items) => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = (items || []).map(i => `<li>${i}</li>`).join('') || '<li>None identified</li>';
        };

        populateList('list-strengths', [...(sim.strengths || []), ...(sim.positiveHighlights || [])]);
        populateList('list-weaknesses', [...(sim.weaknesses || []), ...(sim.recruiterConcerns || [])]);
        populateList('list-missing', [...(sim.missingSkills || []), ...(sim.missingKeywords || [])]);
        populateList('list-ats', [...(sim.atsProblems || []), ...(sim.formattingIssues || [])]);
        populateList('list-growth', [...(sim.careerGrowthSuggestions || []), ...(sim.priorityImprovements || [])]);
      }

      // Company Simulation Runner
      document.getElementById('btn-run-company-sim')?.addEventListener('click', async (e) => {
        const activeId = localStorage.getItem('simResumeId');
        if (!activeId) return;

        const btn = e.target;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⚡ Running Target Company Simulation...';

        const coData = {
          company: document.getElementById('sim-company-select').value,
          role: document.getElementById('sim-company-role').value,
          yearsOfExperience: document.getElementById('sim-company-yoe').value,
          jobDescription: document.getElementById('sim-company-jd').value
        };

        try {
          const res = await API.advancedSimulateResume(activeId, coData);
          if (res && res.simulation) {
            localStorage.setItem('companySimResult', JSON.stringify(res.simulation));
            UI.toast('Company Simulation Complete!', 'success');
            
            this.render('resume-simulation').then(html => {
              document.getElementById('app').innerHTML = html;
              this.bind();
            });
          }
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });

      // Populate Company simulation results if they exist in localStorage
      const companyResultStr = localStorage.getItem('companySimResult');
      if (companyResultStr) {
        const sim = JSON.parse(companyResultStr);
        const resultsContainer = document.getElementById('simulation-company-results');
        if (resultsContainer) resultsContainer.classList.remove('hidden');

        const coMatch = sim.companyMatch || {};

        const titleEl = document.getElementById('company-sim-title');
        if (titleEl) {
          titleEl.textContent = `${coMatch.company || 'Company'} Compatibility Match Report`;
        }

        const coMatchText = document.getElementById('text-co-match');
        if (coMatchText) coMatchText.textContent = `${coMatch.overallMatchScore || 0}%`;

        const setProgress = (textId, fillId, val) => {
          const textEl = document.getElementById(textId);
          const fillEl = document.getElementById(fillId);
          if (textEl) textEl.textContent = `${val || 0}%`;
          if (fillEl) fillEl.style.width = `${val || 0}%`;
        };

        setProgress('text-co-interview', 'fill-co-interview', coMatch.interviewProbability);
        setProgress('text-co-ats', 'fill-co-ats', coMatch.atsMatch);
        setProgress('text-co-skill', 'fill-co-skill', coMatch.skillMatch);
        setProgress('text-co-exp', 'fill-co-exp', coMatch.experienceMatch);
        setProgress('text-co-proj', 'fill-co-proj', coMatch.projectMatch);
        setProgress('text-co-culture', 'fill-co-culture', coMatch.cultureFitEstimate);

        const recFeedback = coMatch.recruiterFeedback || {};
        const setFeedbackText = (id, text) => {
          const el = document.getElementById(id);
          if (el) el.textContent = text || 'N/A';
        };

        setFeedbackText('text-co-strongest', recFeedback.strongestSection);
        setFeedbackText('text-co-weakest', recFeedback.weakestSection);
        setFeedbackText('text-co-salary', recFeedback.expectedSalaryRange);
        setFeedbackText('text-co-readiness', recFeedback.careerReadiness);

        const populateList = (id, items) => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = (items || []).map(i => `<li>${i}</li>`).join('') || '<li>None identified</li>';
        };

        populateList('list-co-shortlist', recFeedback.reasonsForShortlisting || []);
        populateList('list-co-concerns', recFeedback.concerns || []);
        populateList('list-co-questions', recFeedback.expectedInterviewQuestions || []);
        populateList('list-co-projects', [...(recFeedback.projectsToAdd || []), ...(recFeedback.recommendedCertifications || [])]);

        // PDF Generation Trigger
        document.getElementById('btn-download-pdf-report')?.addEventListener('click', () => {
          const general = JSON.parse(localStorage.getItem('generalSimResult') || '{}');
          
          const metaEl = document.getElementById('print-co-meta');
          if (metaEl) {
            metaEl.innerHTML = `
              <strong>Simulation Target:</strong> ${coMatch.company || 'Specified Company'} | ${coMatch.role || 'Role'}<br>
              <strong>Overall Compatibility Match:</strong> ${coMatch.overallMatchScore || 0}%
            `;
          }

          const baseEl = document.getElementById('print-baseline-summary');
          if (baseEl) {
            baseEl.innerHTML = `
              Overall Score: ${general.overallScore || 0}% (${general.overallRating || 'Good'})<br>
              Hiring Probability: ${general.hiringProbability || 0}%<br>
              ATS Compatibility: ${general.atsCompatibilityScore || 0}%<br><br>
              <strong>Strengths Identified:</strong><br>
              ${(general.strengths || []).map(s => `- ${s}`).join('<br>') || 'None'}
            `;
          }

          const compEl = document.getElementById('print-company-summary');
          if (compEl) {
            compEl.innerHTML = `
              Culture Fit: ${coMatch.cultureFitEstimate || 0}%<br>
              Recruiter Insights: ${(recFeedback.reasonsForShortlisting || []).join(', ') || 'N/A'}<br><br>
              <strong>Top Improvement Recommendations:</strong><br>
              ${(recFeedback.topImprovements || []).map(s => `- ${s}`).join('<br>') || 'None'}
            `;
          }

          window.print();
        });
      }
    }

    // ==========================================
    // RESUME SCREENING PAGE BINDINGS
    // ==========================================
    if (this.section === 'resume-screening') {
      document.getElementById('run-screening-btn')?.addEventListener('click', async () => {
        const id = document.getElementById('screen-resume-select').value;
        if (!id) return UI.toast('Please select a resume', 'error');

        const resultsContainer = document.getElementById('screening-results-container');
        const contentEl = document.getElementById('screening-results-content');
        
        resultsContainer.classList.remove('hidden');
        contentEl.innerHTML = '<div class="spinner"></div>';

        try {
          const res = await API.getResumeTimeline(id);
          contentEl.innerHTML = `
            <div class="card p-4" style="border: 1px solid var(--border-color)">
              <h4>Extracted Professional Timeline</h4>
              <ul class="mt-2 text-xs text-secondary" style="list-style-type: decimal; padding-left: 16px;">
                ${(res.timeline || []).map(t => `
                  <li><strong>${t.title}</strong> at ${t.company} (${t.start} - ${t.end}) [${t.type}]</li>
                `).join('') || '<li>No timeline elements detected</li>'}
              </ul>
            </div>
          `;
        } catch (err) {
          contentEl.innerHTML = `<p class="text-danger">${err.message}</p>`;
        }
      });
    }

    // ==========================================
    // RESUME IMPROVEMENT PAGE BINDINGS
    // ==========================================
    if (this.section === 'resume-improvement') {
      document.getElementById('run-improvement-btn')?.addEventListener('click', async () => {
        const id = document.getElementById('improve-resume-select').value;
        if (!id) return UI.toast('Please select a resume', 'error');

        const resultsContainer = document.getElementById('improvement-results-container');
        const contentEl = document.getElementById('improvement-results-content');
        
        resultsContainer.classList.remove('hidden');
        contentEl.innerHTML = '<div class="spinner"></div>';

        try {
          const res = await API.getImprovementReport(id);
          const report = res.report || {};
          contentEl.innerHTML = `
            <div class="flex justify-between items-center mb-4 p-3 rounded" style="background: rgba(37,99,235,0.06)">
              <div><strong>Grade Level:</strong> <span class="badge badge-primary">${report.overallGrade || 'B'}</span></div>
              <div><strong>Estimated Lift:</strong> <strong class="text-success">+${report.estimatedScoreIncrease || 15}%</strong></div>
            </div>
            <div class="flex flex-col gap-2">
              ${(report.improvements || []).map(imp => `
                <div class="leaderboard-item" style="padding:12px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong>${imp.area}</strong>
                    <div class="text-xs text-muted mt-1">${imp.suggestion}</div>
                  </div>
                  <span class="badge badge-${imp.priority === 'high' ? 'primary' : 'warning'}">${imp.priority}</span>
                </div>
              `).join('') || '<p>All checks passed successfully</p>'}
            </div>
          `;
        } catch (err) {
          contentEl.innerHTML = `<p class="text-danger">${err.message}</p>`;
        }
      });
    }

    // ==========================================
    // RESUME MATCHING PAGE BINDINGS
    // ==========================================
    if (this.section === 'resume-matching') {
      document.getElementById('run-matching-btn')?.addEventListener('click', async () => {
        const resultsContainer = document.getElementById('matching-results-container');
        const contentEl = document.getElementById('matching-results-content');
        
        resultsContainer.classList.remove('hidden');
        contentEl.innerHTML = '<div class="spinner"></div>';

        try {
          const data = await API.getJobRecommendations();
          const recs = data.recommendations || [];
          contentEl.innerHTML = recs.map(j => `
            <div class="leaderboard-item p-4" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color);">
              <div>
                <strong style="font-size:14px;">${j.title}</strong>
                <div class="text-xs text-secondary mt-1">${j.company} | ${j.location || 'Remote'}</div>
              </div>
              <span class="badge badge-primary">${j.match || 80}% Compatibility Match</span>
            </div>
          `).join('') || '<p class="text-secondary text-center">No active job matches found</p>';
        } catch (err) {
          contentEl.innerHTML = `<p class="text-danger">${err.message}</p>`;
        }
      });
    }

    // ==========================================
    // DYNAMIC RESUME PAGE BINDINGS
    // ==========================================
    if (this.section === 'dynamic-resume') {
      document.getElementById('run-dynamic-btn')?.addEventListener('click', async () => {
        const id = document.getElementById('dynamic-resume-select').value;
        const job = document.getElementById('dynamic-job-title').value;
        if (!id) return UI.toast('Please select a resume', 'error');

        const resultsContainer = document.getElementById('dynamic-results-container');
        const contentEl = document.getElementById('dynamic-results-content');
        
        resultsContainer.classList.remove('hidden');
        contentEl.innerHTML = '<div class="spinner"></div>';

        try {
          const res = await API.post(`/resumes/${id}/dynamic`, { jobDescription: job });
          const dynamic = res.dynamic || {};
          contentEl.innerHTML = `
            <div class="card p-4" style="border: 1px solid var(--border-color);">
              <h4>Tailored Executive Summary</h4>
              <p style="font-style: italic; font-size:12px;">"${dynamic.tailoredSummary || 'No summary generated'}"</p>
            </div>
            <div class="grid grid-2 gap-4">
              <div class="card p-3" style="border: 1px solid var(--border-color);">
                <h5>Highlighted Skill Tags</h5>
                <div class="flex flex-wrap gap-1 mt-2">
                  ${(dynamic.highlightedSkills || []).map(s => `<span class="badge badge-primary">${s}</span>`).join('') || 'None'}
                </div>
              </div>
              <div class="card p-3" style="border: 1px solid var(--border-color);">
                <h5>Suggested Layout Changes</h5>
                <ul class="text-xs text-secondary mt-2 pl-4" style="list-style-type:circle;">
                  ${(dynamic.suggestedChanges || []).map(c => `<li>${c}</li>`).join('') || 'None'}
                </ul>
              </div>
            </div>
          `;
        } catch (err) {
          contentEl.innerHTML = `<p class="text-danger">${err.message}</p>`;
        }
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
    async renderResumeBuilder() {
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
    const selectedResumeId = activeId || (resumes[0] ? resumes[0]._id : '');

    if (!selectedResumeId) {
      return `
        <div class="page-header text-center mb-8">
          <h2 style="font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #3B82F6, #10B981); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI Resume Builder</h2>
          <p class="text-secondary mt-2">Create beautiful professional resumes manually or let AI build one for you in seconds.</p>
        </div>

        <div class="grid grid-2 gap-8 max-w-4xl mx-auto" style="margin-top: 40px;">
          <!-- Manual Card -->
          <div class="card glass-card hover-lift text-center" style="padding: 40px 24px; border: 1px solid var(--border-color); display: flex; flex-direction: column; align-items: center; gap: 20px;">
            <div style="font-size: 3rem;">🛠️</div>
            <h3 style="font-size: 1.5rem; font-weight: 700;">Manual Resume</h3>
            <p class="text-secondary" style="font-size: 0.95rem; line-height: 1.6;">Create and edit your resume manually step-by-step using our premium interactive builder and themes.</p>
            <button class="btn btn-primary mt-4" id="start-manual-btn" style="width: 200px;">Create Manually</button>
          </div>

          <!-- AI Card -->
          <div class="card glass-card hover-lift text-center" style="padding: 40px 24px; border: 1px dashed var(--primary-color); display: flex; flex-direction: column; align-items: center; gap: 20px;">
            <div style="font-size: 3rem;">✨</div>
            <h3 style="font-size: 1.5rem; font-weight: 700;">AI Dynamic Resume</h3>
            <p class="text-secondary" style="font-size: 0.95rem; line-height: 1.6;">Let AI automatically generate a tailored professional resume using your profile, uploaded resume, GitHub activity, and account info.</p>
            <button class="btn btn-primary mt-4" id="start-ai-btn" style="width: 200px; background: linear-gradient(135deg, #2563EB, #10B981); border: none;">Generate with AI</button>
          </div>
        </div>

        <!-- Hidden Workflow Modal -->
        <div id="ai-workflow-modal" class="hidden" style="position:fixed; top:0; left:0; width:100%; height:100vh; background: rgba(11,14,20,0.96); z-index: 3000; display:flex; justify-content:center; align-items:center;">
          <div class="card glass-card" style="width: 480px; padding: 32px; border: 1px solid var(--border-color);">
            <h3 class="mb-4 text-center">🤖 AI Synthesis Engine</h3>
            <div class="w-full bg-slate-800 rounded-full h-2.5 mb-6" style="background:#1e293b; border-radius:8px; overflow:hidden;">
              <div id="workflow-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(135deg, #3b82f6, #10b981); transition: width 0.3s ease;"></div>
            </div>
            <div id="workflow-list" class="flex flex-col gap-3 text-sm">
              <div class="workflow-step" id="wf-step-1">⏳ Reading Profile...</div>
              <div class="workflow-step" id="wf-step-2">⏳ Reading Resume...</div>
              <div class="workflow-step" id="wf-step-3">⏳ Reading GitHub...</div>
              <div class="workflow-step" id="wf-step-4">⏳ Selecting Best Projects...</div>
              <div class="workflow-step" id="wf-step-5">⏳ Creating Professional Summary...</div>
              <div class="workflow-step" id="wf-step-6">⏳ Generating Experience...</div>
              <div class="workflow-step" id="wf-step-7">⏳ Optimizing ATS Score...</div>
              <div class="workflow-step" id="wf-step-8">⏳ Applying Resume Theme...</div>
              <div class="workflow-step" id="wf-step-9">⏳ Finalizing Resume...</div>
            </div>
          </div>
        </div>
      `;
    }

    let activeResume = resumes.find(r => r._id === selectedResumeId);
    if (!activeResume) {
      activeResume = {
        _id: selectedResumeId,
        filename: 'New_Resume.pdf',
        score: 80,
        parsed: {
          name: this.user?.name || 'Your Name',
          email: this.user?.email || 'yourname@example.com',
          phone: '',
          location: '',
          summary: '',
          skills: [],
          experience: [],
          education: []
        },
        themeCustomization: {
          primaryColor: '#0f172a',
          accentColor: '#2563eb',
          secondaryColor: '#475569',
          fontFamily: 'Inter',
          fontSize: 12,
          lineHeight: 1.5,
          margins: 20,
          borderRadius: 4,
          showIcons: true,
          sectionOrder: ['summary', 'experience', 'skills', 'education']
        }
      };
    }

    const customization = activeResume.themeCustomization || {};
    const parsed = activeResume.parsed || {};
    const sectionOrder = customization.sectionOrder || ['summary', 'experience', 'skills', 'education'];
    const hiddenSections = customization.hiddenSections || [];
    const getSectionDisplayName = (secId) => secId.charAt(0).toUpperCase() + secId.slice(1);
    const isRecruiterMode = localStorage.getItem('previewMode') === 'recruiter';

    return `
      <style>
        .builder-workspace {
          display: grid;
          grid-template-columns: 50% 50%;
          gap: 20px;
          align-items: start;
        }
        .editor-tab-content {
          display: none;
        }
        .editor-tab-content.active {
          display: block;
        }
        .ai-inline-btn {
          background: rgba(37,99,235,0.06);
          border: 1px solid rgba(37,99,235,0.15);
          color: var(--primary-color);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-inline-btn:hover {
          background: var(--primary-color);
          color: white;
        }
        #resume-preview-page {
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          width: 595px;
          min-height: 842px;
          transform-origin: top center;
          transition: all 0.3s ease;
          position: relative;
        }
      </style>

      <div class="page-header flex justify-between items-center mb-6">
        <div>
          <h2>AI Resume Builder</h2>
          <p class="text-secondary">Fully interactive Overleaf & Canva-style builder with live previews</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" id="btn-back-landing">✕ Reset Builder</button>
          <select class="form-select" id="active-resume-select" style="width:220px">
            ${resumes.map(r => `<option value="${r._id}" ${r._id === selectedResumeId ? 'selected' : ''}>📄 ${r.filename}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="builder-workspace">
        <div class="card" style="padding: 24px; max-height: 85vh; overflow-y: auto;">
          <div class="tabs-nav flex gap-1 mb-6 pb-2" style="border-bottom: 1px solid var(--border-color); overflow-x: auto; white-space: nowrap;">
            <button class="btn btn-ghost btn-xs tab-header-btn active" data-tab="info">Info</button>
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="experience">Experience</button>
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="projects">Projects</button>
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="skills">Skills</button>
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="education">Education</button>
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="theme">Theme</button>
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="ai-assistant">AI Assistant</button>
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="export">Export</button>
          </div>

          <div class="editor-tab-content active" id="tab-content-info">
            <h3 class="mb-4">Personal Info</h3>
            <div class="grid grid-2 gap-4 mb-4">
              <div class="form-group"><label class="form-label text-xs">Name</label><input class="form-input" id="edit-name" value="${parsed.name || ''}"></div>
              <div class="form-group"><label class="form-label text-xs">Email</label><input class="form-input" id="edit-email" value="${parsed.email || ''}"></div>
              <div class="form-group"><label class="form-label text-xs">Phone</label><input class="form-input" id="edit-phone" value="${parsed.phone || ''}"></div>
              <div class="form-group"><label class="form-label text-xs">Location</label><input class="form-input" id="edit-location" value="${parsed.location || ''}"></div>
            </div>
            <div class="form-group">
              <div class="flex justify-between items-center mb-1">
                <label class="form-label text-xs">Summary</label>
                <div class="flex gap-1">
                  <button class="ai-inline-btn" data-action="Improve Summary" data-target="edit-summary">✨ Improve</button>
                  <button class="ai-inline-btn" data-action="Shorten" data-target="edit-summary">Shorten</button>
                  <button class="ai-inline-btn" data-action="Make Professional" data-target="edit-summary">💼 Prof.</button>
                </div>
              </div>
              <textarea class="form-textarea" id="edit-summary" style="min-height: 120px;">${parsed.summary || ''}</textarea>
            </div>
            <button class="btn btn-primary btn-sm mt-4 w-full" id="save-content-info-btn">Save Progress</button>
          </div>

          <div class="editor-tab-content" id="tab-content-experience">
            <div class="flex justify-between items-center mb-4">
              <h3>Work History</h3>
              <button class="btn btn-secondary btn-xs" id="add-exp-btn">+ Add Role</button>
            </div>
            <div id="experience-edit-list" class="flex flex-col gap-4">
              ${(parsed.experience || []).map((exp, idx) => `
                <div class="card p-3 exp-edit-row" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color);">
                  <div class="grid grid-2 gap-2 mb-2">
                    <div class="form-group"><label class="form-label text-xs">Role</label><input class="form-input exp-role" value="${exp.role || ''}"></div>
                    <div class="form-group"><label class="form-label text-xs">Company</label><input class="form-input exp-company" value="${exp.company || ''}"></div>
                    <div class="form-group"><label class="form-label text-xs">Start Date</label><input class="form-input exp-start" value="${exp.startDate || ''}"></div>
                    <div class="form-group"><label class="form-label text-xs">End Date</label><input class="form-input exp-end" value="${exp.endDate || ''}"></div>
                  </div>
                  <div class="form-group">
                    <div class="flex justify-between items-center mb-1">
                      <label class="form-label text-xs">Description</label>
                      <div class="flex gap-1">
                        <button class="ai-inline-btn" data-action="Improve Bullet Points" data-target="exp-desc-${idx}">✨ Improve</button>
                        <button class="ai-inline-btn" data-action="Make Technical" data-target="exp-desc-${idx}">💻 Tech</button>
                      </div>
                    </div>
                    <textarea class="form-textarea exp-desc" id="exp-desc-${idx}" style="min-height: 80px;">${exp.description || ''}</textarea>
                  </div>
                  <button class="btn btn-danger btn-xs mt-2 delete-exp-btn">Remove</button>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-primary btn-sm mt-4 w-full" id="save-content-exp-btn">Save Progress</button>
          </div>

          <div class="editor-tab-content" id="tab-content-projects">
            <div class="flex justify-between items-center mb-4">
              <h3>Projects</h3>
              <button class="btn btn-secondary btn-xs" id="add-project-btn">+ Add Project</button>
            </div>
            <div id="projects-edit-list" class="flex flex-col gap-4">
              ${(parsed.projects || []).map((proj, idx) => `
                <div class="card p-3 proj-edit-row" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color);">
                  <div class="form-group mb-2"><label class="form-label text-xs">Project Title</label><input class="form-input proj-title" value="${proj.title || ''}"></div>
                  <div class="form-group mb-2"><label class="form-label text-xs">Technologies (comma separated)</label><input class="form-input proj-tech" value="${(proj.technologiesUsed || []).join(', ') || ''}"></div>
                  <div class="form-group">
                    <div class="flex justify-between items-center mb-1">
                      <label class="form-label text-xs">Description</label>
                      <div class="flex gap-1">
                        <button class="ai-inline-btn" data-action="Improve Bullet Points" data-target="proj-desc-${idx}">✨ Improve</button>
                      </div>
                    </div>
                    <textarea class="form-textarea proj-desc" id="proj-desc-${idx}" style="min-height: 80px;">${proj.description || ''}</textarea>
                  </div>
                  <button class="btn btn-danger btn-xs mt-2 delete-proj-btn">Remove</button>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-primary btn-sm mt-4 w-full" id="save-content-proj-btn">Save Progress</button>
          </div>

          <div class="editor-tab-content" id="tab-content-skills">
            <h3 class="mb-4">Skills</h3>
            <div class="form-group mb-4">
              <div class="flex justify-between items-center mb-1">
                <label class="form-label text-xs">Skills (Comma separated)</label>
                <button class="ai-inline-btn" data-action="Optimize Skills" data-target="edit-skills">✨ AI Optimize</button>
              </div>
              <textarea class="form-textarea" id="edit-skills" style="min-height: 120px;">${(parsed.skills || []).join(', ') || ''}</textarea>
            </div>
            <button class="btn btn-primary btn-sm mt-4 w-full" id="save-content-skills-btn">Save Progress</button>
          </div>

          <div class="editor-tab-content" id="tab-content-education">
            <div class="flex justify-between items-center mb-4">
              <h3>Education</h3>
              <button class="btn btn-secondary btn-xs" id="add-edu-btn">+ Add Edu</button>
            </div>
            <div id="education-edit-list" class="flex flex-col gap-4">
              ${(parsed.education || []).map(edu => `
                <div class="card p-3 edu-edit-row" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color);">
                  <div class="grid grid-3 gap-2">
                    <div class="form-group"><label class="form-label text-xs">Institution</label><input class="form-input edu-inst" value="${edu.institution || ''}"></div>
                    <div class="form-group"><label class="form-label text-xs">Degree</label><input class="form-input edu-degree" value="${edu.degree || ''}"></div>
                    <div class="form-group"><label class="form-label text-xs">Year</label><input class="form-input edu-year" value="${edu.year || ''}"></div>
                  </div>
                  <button class="btn btn-danger btn-xs mt-2 delete-edu-btn">Remove</button>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-primary btn-sm mt-4 w-full" id="save-content-edu-btn">Save Progress</button>
          </div>

          <div class="editor-tab-content" id="tab-content-theme">
            <h3 class="mb-4">Resume Themes & Custom Styles</h3>
            
            <div class="mb-6">
              <h4 class="mb-2 text-xs text-muted">Theme Presets</h4>
              <div class="grid grid-3 gap-2">
                ${['Modern', 'Minimal', 'Professional', 'Corporate', 'Creative', 'Developer', 'Executive', 'ATS Friendly', 'Classic', 'Dark'].map(preset => `
                  <button class="btn btn-secondary btn-xs preset-theme-btn" data-preset="${preset.toLowerCase().replace(/\s+/g, '-')}">${preset}</button>
                `).join('')}
              </div>
            </div>

            <form id="theme-customizer-form" class="flex flex-col gap-4 text-xs">
              <div class="grid grid-3 gap-2">
                <div class="form-group">
                  <label class="form-label text-xs">Accent</label>
                  <input type="color" class="form-input" style="height:32px; padding:2px;" name="accentColor" value="${customization.accentColor || '#2563eb'}">
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">Primary Color</label>
                  <input type="color" class="form-input" style="height:32px; padding:2px;" name="primaryColor" value="${customization.primaryColor || '#0f172a'}">
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">Secondary</label>
                  <input type="color" class="form-input" style="height:32px; padding:2px;" name="secondaryColor" value="${customization.secondaryColor || '#475569'}">
                </div>
              </div>

              <div class="grid grid-2 gap-2">
                <div class="form-group">
                  <label class="form-label text-xs">Font Family</label>
                  <select class="form-select" name="fontFamily">
                    <option value="Inter" ${customization.fontFamily === 'Inter' ? 'selected' : ''}>Inter (Sans)</option>
                    <option value="Roboto" ${customization.fontFamily === 'Roboto' ? 'selected' : ''}>Roboto (Sans)</option>
                    <option value="Lora" ${customization.fontFamily === 'Lora' ? 'selected' : ''}>Lora (Serif)</option>
                    <option value="Fira Code" ${customization.fontFamily === 'Fira Code' ? 'selected' : ''}>Fira Code (Mono)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">Font Size (px)</label>
                  <input type="number" class="form-input" name="fontSize" min="8" max="24" value="${customization.fontSize || 12}">
                </div>
              </div>

              <div class="grid grid-2 gap-2">
                <div class="form-group">
                  <label class="form-label text-xs">Line Height</label>
                  <input type="number" class="form-input" name="lineHeight" step="0.1" min="1" max="2.5" value="${customization.lineHeight || 1.5}">
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">Margins (px)</label>
                  <input type="number" class="form-input" name="margins" min="5" max="60" value="${customization.margins || 20}">
                </div>
              </div>

              <div class="grid grid-2 gap-2">
                <div class="form-group">
                  <label class="form-label text-xs">Border Radius</label>
                  <input type="number" class="form-input" name="borderRadius" min="0" max="20" value="${customization.borderRadius || 4}">
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">Page Size</label>
                  <select class="form-select" name="pageSize">
                    <option value="A4" ${customization.pageSize === 'A4' ? 'selected' : ''}>A4 Standard</option>
                    <option value="Letter" ${customization.pageSize === 'Letter' ? 'selected' : ''}>US Letter</option>
                  </select>
                </div>
              </div>

              <div class="card p-3 mt-2" style="background: rgba(255,255,255,0.01); border:1px solid var(--border-color);">
                <h4 class="mb-2 text-xs font-semibold">Section Visibility</h4>
                <div class="flex flex-col gap-2">
                  ${sectionOrder.map(secId => {
                    const isHidden = hiddenSections.includes(secId);
                    return `
                      <label class="flex items-center gap-2">
                        <input type="checkbox" class="sec-vis-checkbox" data-sec-id="${secId}" ${!isHidden ? 'checked' : ''}>
                        <span>${getSectionDisplayName(secId)}</span>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-sm w-full mt-2">Save theme styles</button>
            </form>
          </div>

          <div class="editor-tab-content" id="tab-content-ai-assistant">
            <h3 class="mb-4">AI Builder Copilot</h3>
            <p class="text-secondary text-xs mb-4">Leverage Gemini to audit and optimize your entire resume structure.</p>
            <div class="flex flex-col gap-3">
              <button class="btn btn-secondary btn-sm w-full text-left" id="ai-improve-resume-btn">🪄 One-click Professional Rewrite</button>
              <button class="btn btn-secondary btn-sm w-full text-left" id="ai-optimize-ats-btn">🔍 Optimize ATS Keyword Match</button>
              <button class="btn btn-secondary btn-sm w-full text-left" id="ai-grammar-check-btn">✅ Run Grammar & Polish Check</button>
            </div>
            
            <div class="form-group mt-4">
              <label class="form-label text-xs">Tailor Resume for Job</label>
              <textarea class="form-textarea form-textarea-sm" id="ai-tailor-jd" placeholder="Paste target job description here..." style="min-height: 80px;"></textarea>
              <button class="btn btn-primary btn-xs w-full mt-2" id="ai-run-tailor-btn">Tailor Resume for Job</button>
            </div>
            <div id="ai-copilot-feedback" class="hidden mt-3 p-3 rounded text-xs" style="background: rgba(37,99,235,0.06); border: 1px solid var(--primary-color);"></div>
          </div>

          <div class="editor-tab-content" id="tab-content-export">
            <h3 class="mb-4">Export & Variants</h3>
            <div class="flex flex-col gap-3 mb-6">
              <button class="btn btn-primary btn-sm w-full" id="exp-pdf-btn">Export PDF</button>
              <button class="btn btn-secondary btn-sm w-full" id="exp-docx-btn">Export DOCX</button>
              <button class="btn btn-secondary btn-sm w-full" id="exp-html-btn">Export HTML (Single Page)</button>
            </div>

            <div class="card p-3 text-xs" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color);">
              <h4 class="mb-2 font-semibold">Variant Management</h4>
              <button class="btn btn-secondary btn-xs w-full mb-2" id="duplicate-variant-btn">Duplicate Resume Variant</button>
            </div>
          </div>
        </div>

        <div class="card" style="padding: 24px; display: flex; flex-direction: column; align-items: center; background: var(--bg-secondary); max-height: 85vh; overflow-y: auto;">
          <div class="flex justify-between items-center w-full mb-4 pb-2" style="border-bottom: 1px solid var(--border-color)">
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-xs active" id="btn-mode-candidate">Candidate Preview</button>
              <button class="btn btn-ghost btn-xs" id="btn-mode-recruiter">Recruiter View</button>
            </div>
            <div class="flex gap-1 items-center">
              <button class="btn btn-ghost btn-xs" id="zoom-out-btn">➖</button>
              <span id="zoom-percent-text" style="font-size:11px; width:40px; text-align:center;">90%</span>
              <button class="btn btn-ghost btn-xs" id="zoom-in-btn">➕</button>
            </div>
          </div>

          <div style="background:#0F172A; padding:24px 12px; display:flex; justify-content:center; width:100%; border-radius: 8px; overflow-x:auto;">
            <div id="preview-candidate-view" style="display: ${!isRecruiterMode ? 'block' : 'none'};">
              <div id="resume-preview-page" style="
                background:#FFFFFF; 
                color:${customization.primaryColor || '#0f172a'}; 
                font-family:${customization.fontFamily === 'Lora' ? 'Georgia, serif' : (customization.fontFamily === 'Fira Code' ? 'monospace' : 'system-ui')}; 
                font-size:${customization.fontSize || 12}px; 
                line-height:${customization.lineHeight || 1.5}; 
                padding:${customization.margins || 20}px; 
                border-radius:${customization.borderRadius || 4}px;
                transform: scale(0.9);
              ">
                <div style="
                  border-bottom: 2px solid ${customization.accentColor || '#2563eb'}; 
                  padding-bottom: 16px; 
                  margin-bottom: 16px; 
                  display: flex;
                  align-items: center;
                  gap: 16px;
                ">
                  <div style="flex: 1;">
                    <h1 style="margin:0 0 4px 0; font-size: 2.2rem; font-weight: 700; color:${customization.primaryColor || '#0f172a'};">${parsed.name || 'Your Name'}</h1>
                    <div style="color:${customization.secondaryColor || '#475569'}; font-size:12px;">
                      ${customization.showIcons ? '📧 ' : ''}${parsed.email || ''} | 
                      ${customization.showIcons ? '📱 ' : ''}${parsed.phone || ''} | 
                      ${customization.showIcons ? '📍 ' : ''}${parsed.location || ''}
                    </div>
                  </div>
                </div>

                ${sectionOrder.map(secId => {
                  if (hiddenSections.includes(secId)) return '';
                  
                  if (secId === 'summary' && parsed.summary) {
                    return `
                      <div style="margin-bottom: 16px;">
                        <h3 style="color:\${customization.accentColor || '#2563eb'}; margin: 0 0 6px 0; font-size: 1.1rem; text-transform: uppercase;">\${getSectionDisplayName('summary')}</h3>
                        <p style="margin: 0; color:\${customization.primaryColor || '#0f172a'}">\${parsed.summary}</p>
                      </div>
                    `;
                  }

                  if (secId === 'experience' && parsed.experience?.length) {
                    return `
                      <div style="margin-bottom: 16px;">
                        <h3 style="color:\${customization.accentColor || '#2563eb'}; margin: 0 0 8px 0; font-size: 1.1rem; text-transform: uppercase;">\${getSectionDisplayName('experience')}</h3>
                        \${parsed.experience.map(exp => \`
                          <div style="margin-bottom: 12px;">
                            <div style="display:flex; justify-content:space-between; font-weight:600;">
                              <span>\${exp.role} — \${exp.company}</span>
                              <span style="font-size:11px; color:\${customization.secondaryColor || '#475569'}">\${exp.startDate} - \${exp.endDate}</span>
                            </div>
                            <p style="margin: 4px 0 0 0; color:\${customization.secondaryColor || '#475569'}">\${exp.description}</p>
                          </div>
                        \`).join('')}
                      </div>
                    `;
                  }

                  if (secId === 'skills' && parsed.skills?.length) {
                    return `
                      <div style="margin-bottom: 16px;">
                        <h3 style="color:\${customization.accentColor || '#2563eb'}; margin: 0 0 8px 0; font-size: 1.1rem; text-transform: uppercase;">\${getSectionDisplayName('skills')}</h3>
                        <div style="display:flex; flex-wrap:wrap; gap: 6px;">
                          \${parsed.skills.map(skill => \`
                            <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; border: 1px solid \${customization.accentColor || '#2563eb'}; color:\${customization.accentColor || '#2563eb'}; font-weight:500;">
                              \${skill}
                            </span>
                          \`).join('')}
                        </div>
                      </div>
                    `;
                  }

                  if (secId === 'education' && parsed.education?.length) {
                    return `
                      <div style="margin-bottom: 16px;">
                        <h3 style="color:\${customization.accentColor || '#2563eb'}; margin: 0 0 8px 0; font-size: 1.1rem; text-transform: uppercase;">\${getSectionDisplayName('education')}</h3>
                        \${parsed.education.map(edu => \`
                          <div style="display:flex; justify-content:space-between; font-weight:600; margin-bottom: 4px;">
                            <span>\${edu.degree} — \${edu.institution}</span>
                            <span style="font-size:11px; color:\${customization.secondaryColor || '#475569'}">\${edu.year}</span>
                          </div>
                        \`).join('')}
                      </div>
                    `;
                  }
                  return '';
                }).join('')}
              </div>
            </div>

            <div id="preview-recruiter-view" style="display: ${isRecruiterMode ? 'block' : 'none'}; width:100%;">
              <div class="card p-4 text-xs" style="background:#1e293b; color: #fff;">
                <div class="mb-4 flex items-center justify-between p-3 rounded" style="background: rgba(37,99,235,0.06); border: 1px solid var(--primary-color)">
                  <div>
                    <div class="text-xs text-secondary">Resume Strength Index</div>
                    <strong style="font-size: 18px; color: var(--primary-color);">${activeResume.score || 85}% Strength</strong>
                  </div>
                  <span class="badge badge-success">Highly Compatible</span>
                </div>
                <div class="mb-4">
                  <h4 class="mb-2">ATS Extracted Data & Keywords</h4>
                  <div style="max-height: 180px; overflow-y:auto; padding:10px; border-radius:6px; background:#0f172a; font-family:monospace; line-height: 1.4;">
                    <strong>Summary:</strong> ${parsed.summary || 'None'}<br><br>
                    <strong>Keywords:</strong> ${(parsed.skills || []).join(', ')}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  },

  async renderResumeSimulationPage() {
    let resumes = [];
    try {
      const data = await API.getResumes();
      resumes = data.resumes || [];
    } catch (_) {}

    const selectedSimResumeId = localStorage.getItem('simResumeId') || '';

    // Step 1: Select Resume
    if (!selectedSimResumeId) {
      return `
        <div class="page-header text-center mb-8">
          <h2 style="font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #2563EB, #10B981); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI Recruitment Simulator</h2>
          <p class="text-secondary mt-2">Test your profile readiness against rigorous industry baselines and specific target companies.</p>
        </div>

        <div class="max-w-3xl mx-auto mt-6">
          <h3 class="text-center mb-6">Choose Resume for Simulation</h3>
          
          <div class="grid grid-2 gap-6">
            <!-- Uploaded Resume Manual Card -->
            <div class="card glass-card hover-lift p-6 text-center flex flex-col items-center justify-between" style="border: 1px solid var(--border-color); min-height: 250px;">
              <div style="font-size: 2.5rem; margin-bottom: 12px;">📄</div>
              <h4>Uploaded Resume (Manual Resume)</h4>
              <p class="text-secondary text-xs my-3">Use the core resume document uploaded or typed manually in the system.</p>
              <select class="form-select mb-4" id="sim-select-manual" style="font-size:11px;">
                ${resumes.map(r => `<option value="${r._id}">📄 ${r.filename}</option>`).join('') || '<option value="">No Resumes Found</option>'}
              </select>
              <button class="btn btn-primary btn-sm w-full" id="choose-manual-sim-btn">Use Uploaded Resume</button>
            </div>

            <!-- Dynamic Resume Card -->
            <div class="card glass-card hover-lift p-6 text-center flex flex-col items-center justify-between" style="border: 1px dashed var(--primary-color); min-height: 250px;">
              <div style="font-size: 2.5rem; margin-bottom: 12px;">✨</div>
              <h4>Dynamic Resume</h4>
              <p class="text-secondary text-xs my-3">Use the AI-optimized variant tailored inside the Resume Builder.</p>
              <select class="form-select mb-4" id="sim-select-dynamic" style="font-size:11px;">
                ${resumes.map(r => `<option value="${r._id}">✨ ${r.filename}</option>`).join('') || '<option value="">No Resumes Found</option>'}
              </select>
              <button class="btn btn-primary btn-sm w-full" id="choose-dynamic-sim-btn" style="background: linear-gradient(135deg, #2563EB, #10B981); border:none;">Use Dynamic Resume</button>
            </div>
          </div>
        </div>
      `;
    }

    const simResume = resumes.find(r => r._id === selectedSimResumeId) || resumes[0];

    return `
      <style>
        .score-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 4px solid var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 22px;
          color: var(--primary-color);
          margin-bottom: 12px;
          background: rgba(37,99,235,0.04);
        }
        .progress-indicator {
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .progress-indicator-fill {
          height: 100%;
          background: var(--primary-color);
        }
        @media print {
          body * { visibility: hidden; }
          #simulation-printable-report, #simulation-printable-report * { visibility: visible; }
          #simulation-printable-report { position: absolute; left: 0; top: 0; width: 100%; }
        }
      </style>

      <div class="page-header flex justify-between items-center mb-6">
        <div>
          <h2>AI Recruitment Simulator</h2>
          <p class="text-secondary">Simulating: <strong>${simResume?.filename || 'Selected Resume'}</strong></p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-reset-simulation">✕ Choose Another Resume</button>
      </div>

      <!-- STEP 2: GENERAL RESUME SIMULATION RUNNER -->
      <div class="card p-6 mb-6" id="sim-general-trigger-container">
        <h3>Step 1: Perform General Candidate Evaluation</h3>
        <p class="text-secondary text-xs mb-4">Simulate general hiring standards, core strength scoring, and identify formatting & ATS concerns.</p>
        <button class="btn btn-primary" id="btn-run-general-sim">Run General Evaluation</button>
      </div>

      <!-- RESULTS PANEL FOR GENERAL EVALUATION -->
      <div id="simulation-general-results" class="hidden flex flex-col gap-6">
        <div class="grid grid-4 gap-4">
          <div class="card flex flex-col items-center justify-center p-4 text-center">
            <div class="score-circle" id="gauge-overall">0</div>
            <strong>Overall Score</strong>
            <span class="badge mt-2" id="badge-overall-rating">Average</span>
          </div>
          <div class="card p-4">
            <h4 class="mb-2 text-xs text-secondary">Hiring Probability</h4>
            <div class="text-2xl font-bold mb-1" id="text-hiring-prob">0%</div>
            <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-hiring-prob" style="width:0%;"></div></div>
          </div>
          <div class="card p-4">
            <h4 class="mb-2 text-xs text-secondary">ATS Compatibility</h4>
            <div class="text-2xl font-bold mb-1" id="text-ats-compat">0%</div>
            <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-ats-compat" style="width:0%;"></div></div>
          </div>
          <div class="card p-4">
            <h4 class="mb-2 text-xs text-secondary">Confidence Score</h4>
            <div class="text-2xl font-bold mb-1" id="text-confidence">0%</div>
            <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-confidence" style="width:0%;"></div></div>
          </div>
        </div>

        <!-- Metric Details Grid -->
        <div class="grid grid-3 gap-4">
          <div class="card p-4 flex flex-col gap-3">
            <h3>Technical & Domain</h3>
            <div>
              <div class="flex justify-between text-xs mb-1"><span>Technical Strength</span><span id="text-tech-strength">0%</span></div>
              <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-tech-strength" style="width:0%;"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1"><span>Experience Quality</span><span id="text-exp-quality">0%</span></div>
              <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-exp-quality" style="width:0%;"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1"><span>Skill Coverage</span><span id="text-skill-coverage">0%</span></div>
              <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-skill-coverage" style="width:0%;"></div></div>
            </div>
          </div>

          <div class="card p-4 flex flex-col gap-3">
            <h3>Leadership & Style</h3>
            <div>
              <div class="flex justify-between text-xs mb-1"><span>Communication Score</span><span id="text-comm-score">0%</span></div>
              <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-comm-score" style="width:0%;"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1"><span>Leadership Score</span><span id="text-lead-score">0%</span></div>
              <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-lead-score" style="width:0%;"></div></div>
            </div>
          </div>

          <div class="card p-4 flex flex-col gap-3">
            <h3>Structure & Education</h3>
            <div>
              <div class="flex justify-between text-xs mb-1"><span>Project Quality</span><span id="text-proj-quality">0%</span></div>
              <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-proj-quality" style="width:0%;"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1"><span>Education Strength</span><span id="text-edu-strength">0%</span></div>
              <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-edu-strength" style="width:0%;"></div></div>
            </div>
          </div>
        </div>

        <!-- Evaluation Highlights Panels -->
        <div class="grid grid-2 gap-4">
          <div class="card p-4">
            <h4 class="text-success mb-2">✓ Strengths & Positive Highlights</h4>
            <ul id="list-strengths" class="text-xs text-secondary pl-4" style="list-style-type:disc;"></ul>
          </div>
          <div class="card p-4">
            <h4 class="text-warning mb-2">⚠ Weaknesses & Concerns</h4>
            <ul id="list-weaknesses" class="text-xs text-secondary pl-4" style="list-style-type:disc;"></ul>
          </div>
        </div>

        <div class="grid grid-3 gap-4">
          <div class="card p-4">
            <h4>Missing Components</h4>
            <ul id="list-missing" class="text-xs text-secondary pl-4" style="list-style-type:circle;"></ul>
          </div>
          <div class="card p-4">
            <h4>ATS & Formatting Problems</h4>
            <ul id="list-ats" class="text-xs text-secondary pl-4" style="list-style-type:circle;"></ul>
          </div>
          <div class="card p-4">
            <h4>Growth & Improvements</h4>
            <ul id="list-growth" class="text-xs text-secondary pl-4" style="list-style-type:circle;"></ul>
          </div>
        </div>

        <!-- STEP 3: COMPANY MATCHING FORM -->
        <div class="card p-6 mt-4">
          <h3>Step 2: Simulate for a Specific Company</h3>
          <p class="text-secondary text-xs mb-4">Evaluate your resume against typical requirements, technology stacks, and interview benchmarks of target firms.</p>
          
          <div class="grid grid-3 gap-4 mb-4">
            <div class="form-group">
              <label class="form-label text-xs">Target Company</label>
              <select class="form-select" id="sim-company-select">
                <option value="Google">Google</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Amazon">Amazon</option>
                <option value="Meta">Meta</option>
                <option value="Apple">Apple</option>
                <option value="Netflix">Netflix</option>
                <option value="Tesla">Tesla</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Startup">High-Growth Startup</option>
                <option value="Enterprise">General Corporate Enterprise</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label text-xs">Target Role</label>
              <input class="form-input" id="sim-company-role" value="Software Engineer">
            </div>
            <div class="form-group">
              <label class="form-label text-xs">Years of Experience</label>
              <input type="number" class="form-input" id="sim-company-yoe" value="2">
            </div>
          </div>
          <div class="form-group mb-4">
            <label class="form-label text-xs">Job Description (optional)</label>
            <textarea class="form-textarea" id="sim-company-jd" placeholder="Paste target job specification details here..." style="min-height: 80px;"></textarea>
          </div>

          <button class="btn btn-primary" id="btn-run-company-sim">Run Company Simulation</button>
        </div>

        <!-- RESULTS PANEL FOR COMPANY SIMULATION -->
        <div id="simulation-company-results" class="hidden flex flex-col gap-6">
          <div class="card p-6 text-center flex flex-col items-center">
            <h3 id="company-sim-title">Google Compatibility Match Report</h3>
            <div class="text-5xl font-black mt-4 mb-2" style="background: linear-gradient(135deg, #2563EB, #10B981); -webkit-background-clip: text; -webkit-text-fill-color: transparent;" id="text-co-match">0%</div>
            <p class="text-secondary text-xs">This comparison is based on publicly available hiring trends, industry expectations, and AI analysis. It is not based on confidential hiring data.</p>
          </div>

          <div class="grid grid-2 gap-4">
            <!-- Left: Match Scores Breakdown -->
            <div class="card p-4 flex flex-col gap-3">
              <h3>Hiring Benchmarks Compatibility</h3>
              <div>
                <div class="flex justify-between text-xs mb-1"><span>Interview Probability</span><span id="text-co-interview">0%</span></div>
                <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-co-interview" style="width:0%;"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span>ATS Match Ratio</span><span id="text-co-ats">0%</span></div>
                <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-co-ats" style="width:0%;"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span>Core Tech Stack Fit</span><span id="text-co-skill">0%</span></div>
                <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-co-skill" style="width:0%;"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span>Experience Alignment</span><span id="text-co-exp">0%</span></div>
                <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-co-exp" style="width:0%;"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span>Project Relevance</span><span id="text-co-proj">0%</span></div>
                <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-co-proj" style="width:0%;"></div></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span>Culture Fit Estimate</span><span id="text-co-culture">0%</span></div>
                <div class="progress-indicator"><div class="progress-indicator-fill" id="fill-co-culture" style="width:0%;"></div></div>
              </div>
            </div>

            <!-- Right: Senior Recruiter Feedback -->
            <div class="card p-4 flex flex-col gap-3">
              <h3>Senior Recruiter Observations</h3>
              <div class="p-3 rounded text-xs" style="background: rgba(37,99,235,0.04); border: 1px solid var(--border-color); line-height: 1.6;">
                <strong>Strongest Section:</strong> <span id="text-co-strongest">N/A</span><br>
                <strong>Weakest Section:</strong> <span id="text-co-weakest">N/A</span><br>
                <strong>Expected Salary:</strong> <span id="text-co-salary">N/A</span><br>
                <strong>Career Readiness:</strong> <span id="text-co-readiness">N/A</span>
              </div>
              <div class="text-xs text-secondary mt-2">
                <strong>Reasons for Shortlisting:</strong>
                <ul id="list-co-shortlist" style="list-style-type:disc; padding-left:16px;"></ul>
              </div>
              <div class="text-xs text-secondary">
                <strong>Hiring Risks / Concerns:</strong>
                <ul id="list-co-concerns" style="list-style-type:disc; padding-left:16px;"></ul>
              </div>
            </div>
          </div>

          <div class="card p-4">
            <h3>Expected Interview Questions & Core Preparation Gaps</h3>
            <div class="grid grid-2 gap-4 mt-2">
              <div>
                <h5 class="text-xs font-semibold mb-1">Potential Technical Questions</h5>
                <ul id="list-co-questions" class="text-xs text-secondary pl-4" style="list-style-type:decimal;"></ul>
              </div>
              <div>
                <h5 class="text-xs font-semibold mb-1">Recommended Projects & Certifications</h5>
                <ul id="list-co-projects" class="text-xs text-secondary pl-4" style="list-style-type:circle;"></ul>
              </div>
            </div>
          </div>

          <!-- Printable Report & PDF Trigger -->
          <div class="card p-4 flex justify-between items-center">
            <div>
              <h4>Simulation Report Ready</h4>
              <p class="text-secondary text-xs">Print or export the comprehensive recruitment readiness and alignment summary.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-download-pdf-report">Download PDF Report</button>
          </div>
        </div>
      </div>

      <!-- Sandboxed Hidden Element for Printable Report Generation -->
      <div id="simulation-printable-report" class="hidden" style="padding: 40px; background:#fff; color:#000; font-family:sans-serif;">
        <h1 style="border-bottom: 2px solid #2563EB; padding-bottom: 12px;">TalentAI - Advanced Recruitment Simulation Report</h1>
        <div style="margin: 20px 0; font-size:14px; line-height: 1.6;">
          <strong>Target Candidate Resume:</strong> ${simResume?.filename || 'Active Variant'}<br>
          <div id="print-co-meta"></div>
          <hr style="border:1px solid #ddd; margin:16px 0;">
          <h2 style="color:#2563EB;">Overall Baseline Assessment</h2>
          <div id="print-baseline-summary"></div>
          <h2 style="color:#2563EB; margin-top:30px;">Company Fit & Recruiter Remarks</h2>
          <div id="print-company-summary"></div>
        </div>
      </div>
    `;
  },async renderResumeScreeningPage() {
    let resumes = [];
    try {
      const data = await API.getResumes();
      resumes = data.resumes || [];
    } catch (_) {}
    let activeId = localStorage.getItem('activeResumeId') || '';
    if (resumes.length && !activeId) activeId = resumes[0]._id;

    return `
      <div class="page-header mb-6">
        <h2>Resume Screening & Pre-Audit</h2>
        <p class="text-secondary">Simulate recruiter pre-screening and check authenticity, flags, and structure verification.</p>
      </div>

      <div class="card p-6 mb-6">
        <div class="form-group mb-4">
          <label class="form-label">Select Target Resume</label>
          <select class="form-select" id="screen-resume-select" style="max-width: 320px;">
            ${resumes.map(r => `<option value="${r._id}" ${r._id === activeId ? 'selected' : ''}>📄 ${r.filename}</option>`).join('') || '<option value="">No Resumes Uploaded</option>'}
          </select>
        </div>

        <button class="btn btn-primary" id="run-screening-btn">Pre-Screen Resume</button>
      </div>

      <div class="card p-6 hidden" id="screening-results-container">
        <h3>Audit & Integrity Report</h3>
        <div id="screening-results-content" class="mt-4 flex flex-col gap-4"></div>
      </div>
    `;
  },

  async renderResumeImprovementPage() {
    let resumes = [];
    try {
      const data = await API.getResumes();
      resumes = data.resumes || [];
    } catch (_) {}
    let activeId = localStorage.getItem('activeResumeId') || '';
    if (resumes.length && !activeId) activeId = resumes[0]._id;

    return `
      <div class="page-header mb-6">
        <h2>Resume Improvement Roadmap</h2>
        <p class="text-secondary">Generate a step-by-step optimization checklist to maximize your ATS compatibility score.</p>
      </div>

      <div class="card p-6 mb-6">
        <div class="form-group mb-4">
          <label class="form-label">Select Target Resume</label>
          <select class="form-select" id="improve-resume-select" style="max-width: 320px;">
            ${resumes.map(r => `<option value="${r._id}" ${r._id === activeId ? 'selected' : ''}>📄 ${r.filename}</option>`).join('') || '<option value="">No Resumes Uploaded</option>'}
          </select>
        </div>

        <button class="btn btn-primary" id="run-improvement-btn">Generate Improvement Report</button>
      </div>

      <div class="card p-6 hidden" id="improvement-results-container">
        <h3>Prioritized Suggestions</h3>
        <div id="improvement-results-content" class="mt-4 flex flex-col gap-4"></div>
      </div>
    `;
  },

  async renderResumeMatchingPage() {
    let resumes = [];
    try {
      const data = await API.getResumes();
      resumes = data.resumes || [];
    } catch (_) {}
    let activeId = localStorage.getItem('activeResumeId') || '';
    if (resumes.length && !activeId) activeId = resumes[0]._id;

    return `
      <div class="page-header mb-6">
        <h2>Resume Job Matching</h2>
        <p class="text-secondary">Match your resume against active jobs to review skill fit and alignment.</p>
      </div>

      <div class="card p-6 mb-6">
        <div class="form-group mb-4">
          <label class="form-label">Select Target Resume</label>
          <select class="form-select" id="match-resume-select" style="max-width: 320px;">
            ${resumes.map(r => `<option value="${r._id}" ${r._id === activeId ? 'selected' : ''}>📄 ${r.filename}</option>`).join('') || '<option value="">No Resumes Uploaded</option>'}
          </select>
        </div>

        <button class="btn btn-primary" id="run-matching-btn">Analyze Matching Jobs</button>
      </div>

      <div class="card p-6 hidden" id="matching-results-container">
        <h3>Compatibility Matches</h3>
        <div id="matching-results-content" class="mt-4 flex flex-col gap-4"></div>
      </div>
    `;
  },

  async renderDynamicResumePage() {
    let resumes = [];
    try {
      const data = await API.getResumes();
      resumes = data.resumes || [];
    } catch (_) {}
    let activeId = localStorage.getItem('activeResumeId') || '';
    if (resumes.length && !activeId) activeId = resumes[0]._id;

    return `
      <div class="page-header mb-6">
        <h2>Dynamic Resume Tailoring</h2>
        <p class="text-secondary">Synthesize a tailored summary and select highlighted projects for a targeted role.</p>
      </div>

      <div class="card p-6 mb-6">
        <div class="form-group mb-4">
          <label class="form-label">Select Target Resume</label>
          <select class="form-select" id="dynamic-resume-select" style="max-width: 320px;">
            ${resumes.map(r => `<option value="${r._id}" ${r._id === activeId ? 'selected' : ''}>📄 ${r.filename}</option>`).join('') || '<option value="">No Resumes Uploaded</option>'}
          </select>
        </div>

        <div class="form-group mb-4">
          <label class="form-label">Target Job Title / Description</label>
          <input class="form-input" id="dynamic-job-title" placeholder="e.g. Senior Frontend Engineer with React experience">
        </div>

        <button class="btn btn-primary" id="run-dynamic-btn">Tailor Resume Section</button>
      </div>

      <div class="card p-6 hidden" id="dynamic-results-container">
        <h3>AI Dynamic Tailoring Preview</h3>
        <div id="dynamic-results-content" class="mt-4 flex flex-col gap-4"></div>
      </div>
    `;
  }

};