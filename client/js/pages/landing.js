const LandingPage = {
  render() {
    return `
      <nav class="landing-nav">
        <div class="container flex justify-between items-center">
          <div class="logo" style="display:flex; align-items:center; gap:8px;">
            ${UI.logo('navbar')}
            <span style="font-weight:700; font-size:1.1rem; color:var(--text);">TalentAI</span>
          </div>
          <div class="flex items-center gap-4">
            <a href="#/login" class="btn btn-ghost">Sign In</a>
            <a href="#/register" class="btn btn-primary">Get Started</a>
          </div>
        </div>
      </nav>

      <section class="hero gradient-bg">
        <div class="container">
          <div class="hero-content animate-slide-up">
            <div class="hero-badge">${UI.getIcon('✨', 'candidate', '18px')} AI-Powered Recruitment Platform</div>
            <h1>Intelligent <span class="text-gradient">Talent Evaluation</span> for the Modern Era</h1>
            <p>Harness the power of AI to screen resumes, match skills semantically, rank candidates, and accelerate your hiring pipeline with explainable insights.</p>
            <div class="flex gap-4">
              <a href="#/register" class="btn btn-primary btn-lg">Start Free Trial</a>
              <a href="#/login" class="btn btn-secondary btn-lg">View Demo</a>
            </div>
          </div>
        </div>
      </section>

      <section class="container">
        <div class="feature-grid stagger">
          ${[
            { icon: '🧠', title: 'AI Resume Screening', desc: 'Automatically parse, score, and rank resumes with explainable AI scoring.' },
            { icon: '🎯', title: 'Semantic Skill Matching', desc: 'Match candidates to roles using deep semantic analysis, not just keywords.' },
            { icon: '📊', title: 'Hiring Analytics', desc: 'Real-time dashboards with funnel analysis, conversion rates, and insights.' },
            { icon: '🗺️', title: 'Career Roadmaps', desc: 'Interactive visual roadmaps with skill gaps, goals, and growth predictions.' },
            { icon: '💻', title: 'GitHub Integration', desc: 'Analyze repositories, contributions, and generate portfolio scores automatically.' },
            { icon: '🤖', title: 'AI Assistants', desc: 'Dedicated AI assistants for recruiters and candidates with contextual insights.' }
          ].map(f => `
            <div class="glass-card feature-card hover-lift">
              <div class="feature-icon">${UI.getIcon(f.icon, 'candidate', '28px')}</div>
              <h3>${f.title}</h3>
              <p class="text-secondary mt-2">${f.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="container" style="padding-bottom:80px">
        <div class="glass-card p-6 text-center">
          <h2>Ready to transform your hiring?</h2>
          <p class="text-secondary mt-2 mb-4">Join thousands of companies using AI to find the best talent faster.</p>
          <div class="flex justify-center gap-6 mt-4">
            <a href="#/login?role=candidate" class="btn btn-secondary">I'm a Candidate</a>
            <a href="#/login?role=recruiter" class="btn btn-primary">I'm a Recruiter</a>
          </div>
        </div>
      </section>`;
  }
};
