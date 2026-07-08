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
        <div class="logo"><div class="logo-icon">AI</div><span>TalentAI</span></div>
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
      screening: () => this.renderScreening(),
      ranking: () => this.renderRanking(),
      assistant: () => this.renderAssistant(),
      interviews: () => this.renderInterviews(),
      analytics: () => this.renderAnalytics(),
      'github-analysis': () => this.renderGitHubAnalysis(),
      reports: () => this.renderReports(),
      shortlist: () => this.renderShortlist(),
      notifications: () => this.renderNotifications(),
      settings: () => this.renderSettings()
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
            <button type="submit" class="btn btn-primary">Create Job</button>
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
              <button class="btn btn-sm btn-ghost" data-app-id="${a._id}" data-action="reject">Reject</button>
            </div>
          </div>
        `).join('') : UI.emptyState('👥', 'No candidates', 'Applications will appear here')}
      </div>`;
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
        <div class="flex gap-4">
          <input class="form-input" id="gh-username" placeholder="GitHub username">
          <button class="btn btn-primary" id="analyze-github">Analyze</button>
        </div>
      </div>
      <div id="github-analysis-result"><p class="text-secondary">Enter a GitHub username to analyze their portfolio</p></div>`;
  },

  renderReports() {
    return `
      <div class="page-header"><h2>Reports</h2><p class="text-secondary">Generate hiring reports</p></div>
      <div class="grid grid-3 gap-4">
        <button class="card hover-lift text-center p-6" data-report="hiring"><div style="font-size:2rem">📊</div><h4 class="mt-2">Hiring Summary</h4></button>
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
    return `
      <div class="page-header"><h2>Settings</h2></div>
      <div class="card">
        <h3 class="mb-4">Recruiter Preferences</h3>
        <div class="flex items-center justify-between mb-4">
          <div><strong>Auto-screening</strong><p class="text-sm text-muted">Automatically screen new applications</p></div>
          <div class="toggle-switch active"></div>
        </div>
        <div class="flex items-center justify-between mb-4">
          <div><strong>Email Alerts</strong><p class="text-sm text-muted">New application notifications</p></div>
          <div class="toggle-switch active"></div>
        </div>
      </div>`;
  },

  bind() {
    UI.bindDashboardEvents((section) => {
      window.location.hash = `#/recruiter/${section}`;
    });

    if (this.section === 'overview') this.loadOverviewCharts();
    if (this.section === 'analytics') this.loadAnalytics();
    if (['screening', 'ranking'].includes(this.section)) this.loadJobSelects();

    // Create job
    document.getElementById('ai-generate-job')?.addEventListener('click', async () => {
      const prompt = document.getElementById('ai-job-prompt')?.value;
      try {
        const data = await API.aiCreateJob({ prompt });
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

    // GitHub analysis
    document.getElementById('analyze-github')?.addEventListener('click', async () => {
      const username = document.getElementById('gh-username')?.value;
      if (!username) return;
      try {
        const data = await API.connectGitHub(username);
        const p = data.profile;
        document.getElementById('github-analysis-result').innerHTML = `
          <div class="grid grid-4 gap-4 mb-6">
            ${UI.statCard('Portfolio Score', p.portfolioScore)}
            ${UI.statCard('Commits', p.totalCommits)}
            ${UI.statCard('PRs', p.totalPRs)}
            ${UI.statCard('Repos', p.repos?.length)}
          </div>
          <div class="card">${(p.repos || []).map(r => `
            <div class="leaderboard-item">
              <div><strong>${r.name}</strong><p class="text-sm text-muted">${r.summary}</p></div>
              <span class="badge badge-primary">${r.qualityScore}/100</span>
            </div>
          `).join('')}</div>`;
      } catch (err) { UI.toast(err.message, 'error'); }
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
  }
};
