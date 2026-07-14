/**
 * API Client — Handles all REST API communication
 */
const API = {
  base: '/api',
  token: localStorage.getItem('token') || '',

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  setUser(user) {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  },

  async request(endpoint, options = {}) {
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    try {
      const res = await fetch(`${this.base}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    } catch (error) {
      if (error.message === 'Not authorized, no token' || error.message === 'Not authorized, token invalid') {
        API.setToken('');
        API.setUser(null);
        window.location.hash = '#/login';
      }
      throw error;
    }
  },

  get(endpoint) { return this.request(endpoint); },
  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },

  // Auth
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),

  // Resumes
  uploadResume: (formData) => API.post('/resumes/upload', formData),
  getResumes: () => API.get('/resumes'),
  simulateResume: (id, scenarios) => API.post(`/resumes/${id}/simulate`, { scenarios }),
  getImprovementReport: (id) => API.get(`/resumes/${id}/improvement`),
  getResumeTimeline: (id) => API.get(`/resumes/${id}/timeline`),

  // Jobs
  getJobs: (params = '') => API.get(`/jobs${params ? '?' + params : ''}`),
  getJob: (id) => API.get(`/jobs/${id}`),
  createJob: (data) => API.post('/jobs', data),
  aiCreateJob: (data) => API.post('/jobs/ai/generate', data),
  applyJob: (id, resumeId) => API.post(`/jobs/${id}/apply`, { resumeId }),
  rankCandidates: (jobId) => API.get(`/jobs/${jobId}/rankings`),

  // Applications
  getApplications: () => API.get('/applications'),
  updateApplication: (id, data) => API.put(`/applications/${id}`, data),

  // AI
  connectGitHub: () => API.post('/ai/github/connect', {}),
  getGitHubProfile: (candidateId = '') => API.get(`/ai/github/profile${candidateId ? '?candidateId=' + candidateId : ''}`),
  getGitHubInsights: (candidateId = '') => API.get(`/ai/github/insights${candidateId ? '?candidateId=' + candidateId : ''}`),
  getRepositoryAnalysis: (repoName, candidateId = '') => API.get(`/ai/github/analysis/repo/${repoName}${candidateId ? '?candidateId=' + candidateId : ''}`),
  getCommitAnalysis: (candidateId = '') => API.get(`/ai/github/analysis/commits${candidateId ? '?candidateId=' + candidateId : ''}`),
  getPRAnalysis: (candidateId = '') => API.get(`/ai/github/analysis/prs${candidateId ? '?candidateId=' + candidateId : ''}`),
  getIssueAnalysis: (candidateId = '') => API.get(`/ai/github/analysis/issues${candidateId ? '?candidateId=' + candidateId : ''}`),
  getGeneratedResume: (candidateId = '') => API.get(`/ai/github/analysis/resume${candidateId ? '?candidateId=' + candidateId : ''}`),
  getDetectedSkills: (candidateId = '') => API.get(`/ai/github/analysis/skills${candidateId ? '?candidateId=' + candidateId : ''}`),
  getCompanyMatch: (data, candidateId = '') => API.post(`/ai/github/analysis/match${candidateId ? '?candidateId=' + candidateId : ''}`, data),
  getRoadmap: () => API.get('/ai/roadmap'),
  updateRoadmap: (data) => API.put('/ai/roadmap', data),
  getLeaderboard: () => API.get('/ai/leaderboard'),
  getBenchmarks: () => API.get('/ai/benchmarks'),
  getCareerGrowth: () => API.get('/ai/career-growth'),
  getLearningScore: () => API.get('/ai/learning-score'),
  getJobRecommendations: () => API.get('/ai/job-recommendations'),
  createAssessment: (data) => API.post('/ai/assessments', data),
  getAssessments: () => API.get('/ai/assessments'),
  submitAssessment: (id, data) => API.post(`/ai/assessments/${id}/submit`, data),
  generateInterviewQuestions: (data) => API.post('/ai/interview-questions', data),
  candidateAI: (action, context) => API.post('/ai/candidate-ai', { action, context }),
  recruiterAssistant: (query, context) => API.post('/ai/recruiter-assistant', { query, context }),
  getHiringAnalytics: () => API.get('/ai/hiring-analytics'),
  scheduleInterview: (data) => API.post('/ai/schedule-interview', data),

  // Profile / General
  globalSearch: (q) => API.get(`/auth/search?q=${encodeURIComponent(q)}`),
  getNotifications: () => API.get('/auth/notifications'),
  markNotificationRead: (id) => API.put(`/auth/notifications/${id}/read`),

  // GitHub REST Caching API
  getGithubProfile: (candidateId = '') => API.get(`/github/profile${candidateId ? '?candidateId=' + candidateId : ''}`),
  getLinkedinProfile: (candidateId = '') => API.get(`/linkedin/profile${candidateId ? '?candidateId=' + candidateId : ''}`),
  getGithubRepositories: (candidateId = '') => API.get(`/github/repositories${candidateId ? '?candidateId=' + candidateId : ''}`),
  getGithubCommits: (candidateId = '') => API.get(`/github/commits${candidateId ? '?candidateId=' + candidateId : ''}`),
  getGithubPRs: (candidateId = '') => API.get(`/github/pullrequests${candidateId ? '?candidateId=' + candidateId : ''}`),
  getGithubIssues: (candidateId = '') => API.get(`/github/issues${candidateId ? '?candidateId=' + candidateId : ''}`),
  getGithubLanguages: (candidateId = '') => API.get(`/github/languages${candidateId ? '?candidateId=' + candidateId : ''}`),
  syncGithub: () => API.post('/github/sync', {}),

  // Organization Collaboration & Workflow API
  createOrg: (data) => API.post('/org/create', data),
  getOrgs: () => API.get('/org/list'),
  getOrg: (id) => API.get(`/org/${id}`),
  deleteOrg: (id) => API.delete(`/org/${id}`),
  addDepartment: (orgId, data) => API.post(`/org/${orgId}/departments`, data),
  addTeam: (orgId, data) => API.post(`/org/${orgId}/teams`, data),
  inviteMember: (orgId, data) => API.post(`/org/${orgId}/invite`, data),
  removeMember: (orgId, memberId) => API.post(`/org/${orgId}/remove-member`, { memberId }),
  getPipeline: (orgId) => API.get(`/org/${orgId}/pipeline`),
  moveCandidate: (data) => API.post('/org/pipeline/move', data),
  addComment: (cardId, content) => API.post(`/org/pipeline/${cardId}/comments`, { content }),
  addTask: (cardId, data) => API.post(`/org/pipeline/${cardId}/tasks`, data),
  toggleTask: (cardId, taskId) => API.post(`/org/pipeline/${cardId}/tasks/toggle`, { taskId }),
  getWorkload: (orgId) => API.get(`/org/${orgId}/workload`),
  detectConflict: (cardId) => API.get(`/org/pipeline/${cardId}/conflict`),
  getKnowledgeGraph: (orgId) => API.get(`/org/${orgId}/graph`),
  getAuditLogs: (orgId) => API.get(`/org/${orgId}/audit-logs`),

  // AI Resume Theme Marketplace API
  getThemes: () => API.get('/resumes/themes'),
  getThemeById: (id) => API.get(`/resumes/theme/${id}`),
  applyTheme: (resumeId, themeName) => API.post('/resumes/theme/apply', { resumeId, themeName }),
  favoriteTheme: (resumeId, themeId) => API.post('/resumes/theme/favorite', { resumeId, themeId }),
  customizeTheme: (resumeId, customization) => API.post('/resumes/theme/customize', { resumeId, customization }),
  generateAITheme: (resumeId, prompt) => API.post('/resumes/theme/generate', { resumeId, prompt }),
  optimizeResume: (resumeId, jobDescription) => API.post('/resumes/optimize', { resumeId, jobDescription }),
  getVersions: (resumeId) => API.get(`/resumes/versions?resumeId=${resumeId}`),
  restoreVersion: (resumeId, versionNumber) => API.post('/resumes/version/restore', { resumeId, versionNumber })
};
