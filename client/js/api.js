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
  connectGitHub: (username) => API.post('/ai/github/connect', { username }),
  getGitHubProfile: () => API.get('/ai/github/profile'),
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
  markNotificationRead: (id) => API.put(`/auth/notifications/${id}/read`)
};
