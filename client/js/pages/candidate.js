const CandidateDashboard = {
  section: 'overview',
  user: null,

  navSections: [
    {
      title: 'Main', items: [
        { id: 'overview', icon: '📊', label: 'Overview' },
        { id: 'profile', icon: '👤', label: 'Profile' },
        { id: 'resume', icon: '📄', label: 'Resume' },
        { id: 'applications', icon: '📋', label: 'Applications' }
      ]
    },
    {
      title: 'AI Tools', items: [
        { id: 'resume-ai', icon: '🤖', label: 'Resume AI' },
        { id: 'assessments', icon: '💻', label: 'Coding Assessment' },
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
    this.user = API.getUser();
    const sidebar = `
      <div class="sidebar-header">
        <div class="logo"><div class="logo-icon">AI</div><span>TalentAI</span></div>
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
      <div class="grid grid-2 gap-6">
        <div class="card chart-container"><h3 class="mb-4">Skills Radar</h3><div class="chart-wrapper"><canvas id="skills-radar"></canvas></div></div>
        <div class="card chart-container"><h3 class="mb-4">Learning Progress</h3><div class="chart-wrapper"><canvas id="learning-chart"></canvas></div></div>
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
    return `
      <div class="page-header"><h2>Profile</h2><p class="text-secondary">Manage your personal information</p></div>
      <div class="card">
        <form id="profile-form">
          <div class="grid grid-2 gap-4">
            <div class="form-group"><label class="form-label">Name</label><input class="form-input" name="name" value="${this.user?.name || ''}"></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" value="${this.user?.email || ''}" disabled></div>
            <div class="form-group"><label class="form-label">Phone</label><input class="form-input" name="phone" placeholder="+1-555-0100"></div>
            <div class="form-group"><label class="form-label">Location</label><input class="form-input" name="location" placeholder="City, Country"></div>
          </div>
          <div class="form-group"><label class="form-label">Bio</label><textarea class="form-textarea" name="bio" placeholder="Tell us about yourself"></textarea></div>
          <div class="form-group"><label class="form-label">Skills (comma separated)</label><input class="form-input" name="skills" placeholder="JavaScript, React, Node.js"></div>
          <button type="submit" class="btn btn-primary">Save Profile</button>
        </form>
      </div>`;
  },

  renderResume() {
    return `
      <div class="page-header"><h2>Resume</h2><p class="text-secondary">Upload and manage your resumes</p></div>
      <div class="grid grid-2 gap-6">
        <div class="card">${UI.uploadZone('resume-upload')}</div>
        <div class="card" id="resume-list"><h3 class="mb-4">Your Resumes</h3><div class="spinner"></div></div>
      </div>`;
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
        <button class="card hover-lift text-center" data-ai-action="simulate"><div style="font-size:2rem">🎯</div><h4 class="mt-2">Resume Simulation</h4><p class="text-sm text-muted">Test against hiring scenarios</p></button>
        <button class="card hover-lift text-center" data-ai-action="dynamic"><div style="font-size:2rem">✨</div><h4 class="mt-2">Dynamic Resume</h4><p class="text-sm text-muted">Tailor for specific jobs</p></button>
        <button class="card hover-lift text-center" data-ai-action="improve"><div style="font-size:2rem">📈</div><h4 class="mt-2">Improvement Report</h4><p class="text-sm text-muted">Get actionable feedback</p></button>
      </div>
      <div class="card" id="resume-ai-result"><p class="text-secondary">Select an action above to run AI analysis</p></div>`;
  },

  renderAssessments() {
    return `
      <div class="page-header flex justify-between items-center">
        <div><h2>Coding Assessment</h2><p class="text-secondary">Test your technical skills</p></div>
        <button class="btn btn-primary" id="start-assessment">Start Assessment</button>
      </div>
      <div class="grid grid-2 gap-6">
        <div class="card" id="assessment-area">
          <h3 class="mb-4">Code Editor</h3>
          <textarea class="form-textarea" id="code-input" style="min-height:300px;font-family:monospace" placeholder="// Write your code here..."></textarea>
          <button class="btn btn-primary mt-4" id="submit-code">Submit for AI Review</button>
        </div>
        <div class="card" id="code-review-result">
          <h3 class="mb-4">AI Code Review</h3>
          <p class="text-secondary">Submit code to get AI-powered review and suggestions</p>
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
      <div class="grid grid-2 gap-6">
        <div class="card chart-container"><h3 class="mb-4">Languages</h3><div class="chart-wrapper"><canvas id="github-lang-chart"></canvas></div></div>
        <div class="card" id="github-repos"><h3 class="mb-4">Top Repositories</h3><div class="spinner"></div></div>
      </div>`;
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
        await API.uploadResume(fd);
        UI.toast('Resume uploaded and parsed!', 'success');
        this.loadResumes();
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    if (this.section === 'resume') this.loadResumes();
    if (this.section === 'overview') this.loadOverviewCharts();
    if (this.section === 'roadmap') this.loadRoadmap();
    if (this.section === 'learning') this.loadLearning();
    if (this.section === 'benchmarks') this.loadBenchmarks();
    if (this.section === 'growth') this.loadGrowth();
    if (this.section === 'github') this.loadGitHub();

    // AI Assistant
    UI.bindAIChat('candidate-chat', async (text) => {
      const data = await API.candidateAI('interview-prep', { query: text });
      return data.response;
    });

    // Resume AI actions
    document.querySelectorAll('[data-ai-action]').forEach(btn => {
      btn.addEventListener('click', () => this.runResumeAI(btn.dataset.aiAction));
    });

    // Assessment
    document.getElementById('start-assessment')?.addEventListener('click', async () => {
      try {
        const data = await API.createAssessment({ language: 'JavaScript', difficulty: 'medium' });
        UI.toast(`Assessment started: ${data.assessment.title}`, 'success');
        window._currentAssessment = data.assessment._id;
      } catch (err) { UI.toast(err.message, 'error'); }
    });

    document.getElementById('submit-code')?.addEventListener('click', async () => {
      const code = document.getElementById('code-input')?.value;
      if (!code) return UI.toast('Write some code first', 'warning');
      try {
        const id = window._currentAssessment || 'new';
        if (id === 'new') {
          const a = await API.createAssessment({ language: 'JavaScript', type: 'code-review' });
          window._currentAssessment = a.assessment._id;
        }
        const data = await API.submitAssessment(window._currentAssessment, { code });
        const review = data.assessment.feedback;
        document.getElementById('code-review-result').innerHTML = `
          <h3 class="mb-4">AI Code Review — Score: ${data.assessment.score}/100</h3>
          ${(review?.suggestions || []).map(s => `<p>• ${s}</p>`).join('')}
          ${(review?.issues || []).map(i => `<p class="text-sm text-muted">Line ${i.line}: ${i.message}</p>`).join('')}`;
        UI.toast('Code reviewed!', 'success');
      } catch (err) { UI.toast(err.message, 'error'); }
    });

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
    document.getElementById('connect-github')?.addEventListener('click', async (e) => {
      const username = prompt('Enter your GitHub username:', 'alexchen-dev');
      if (!username) return;
      e.target.disabled = true;
      const originalText = e.target.textContent;
      e.target.textContent = 'Connecting...';
      try {
        await API.connectGitHub(username);
        UI.toast('GitHub connected and analyzed!', 'success');
        await this.loadGitHub();
      } catch (err) {
        const msg = err.status === 429 || err.message.includes('429')
          ? "AI is temporarily busy. Please wait a few seconds and try again."
          : err.message;
        UI.toast(msg, 'error');
      } finally {
        e.target.disabled = false;
        e.target.textContent = originalText;
      }
    });
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
      const data = await API.getGitHubProfile();
      const p = data.profile;
      if (!p) {
        document.getElementById('github-repos').innerHTML = `<p class="text-secondary">No GitHub account connected. Use the button above to connect.</p>`;
        return;
      }
      document.getElementById('github-stats').innerHTML = `
        ${UI.statCard('Portfolio Score', p.portfolioScore || 0)}
        ${UI.statCard('Commits', p.totalCommits || 0)}
        ${UI.statCard('Pull Requests', p.totalPRs || 0)}
        ${UI.statCard('Repositories', p.repos?.length || 0)}`;

      document.getElementById('github-repos').innerHTML = `<h3 class="mb-4">Top Repositories</h3>` +
        (p.repos || []).map(r => `
          <div class="leaderboard-item">
            <div><strong>${r.name}</strong><div class="text-sm text-muted">${r.language} • ⭐ ${r.stars}</div></div>
            <span class="badge badge-primary">#${r.rank}</span>
            <span class="text-sm">${r.qualityScore}/100</span>
          </div>
        `).join('') + `
          <div style="text-align: right; margin-top: 15px;">
            <button class="btn btn-secondary btn-sm" id="sync-github-btn">Sync Repositories</button>
          </div>`;
          
      document.getElementById('sync-github-btn')?.addEventListener('click', async (e) => {
        e.target.disabled = true;
        e.target.textContent = 'Syncing...';
        try {
          await API.post('/ai/github/sync');
          UI.toast('GitHub repositories synced!', 'success');
          await this.loadGitHub();
        } catch (err) {
          const msg = err.status === 429 || err.message.includes('429')
            ? "AI is temporarily busy. Please wait a few seconds and try again."
            : err.message;
          UI.toast(msg, 'error');
        }
      });

      if (p.languages) {
        Charts.pie('github-lang-chart', p.languages.map(l => l.name), p.languages.map(l => l.percentage));
      }
    } catch (_) { }
  },

  async runResumeAI(action) {
    const el = document.getElementById('resume-ai-result');
    el.innerHTML = '<div class="spinner"></div>';
    const buttons = document.querySelectorAll('[data-ai-action]');
    buttons.forEach(btn => btn.disabled = true);
    try {
      const resumes = await API.getResumes();
      const resume = resumes.resumes?.[0];
      if (!resume) { 
        el.innerHTML = UI.emptyState('📄', 'No resume', 'Upload a resume first'); 
        buttons.forEach(btn => btn.disabled = false);
        return; 
      }

      let result;
      if (action === 'simulate') result = await API.simulateResume(resume._id);
      else if (action === 'improve') result = await API.getImprovementReport(resume._id);
      else result = await API.post(`/resumes/${resume._id}/dynamic`, { job: { title: 'Senior Developer' } });

      el.innerHTML = `<pre style="white-space:pre-wrap;font-size:0.875rem">${JSON.stringify(result, null, 2)}</pre>`;
    } catch (err) { 
      const msg = err.status === 429 || err.message.includes('429')
        ? "AI is temporarily busy. Please wait a few seconds and try again."
        : err.message;
      el.innerHTML = `<p class="text-error">${msg}</p>`; 
    } finally {
      buttons.forEach(btn => btn.disabled = false);
    }
  }
};