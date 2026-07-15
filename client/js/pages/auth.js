const AuthPage = {
  mode: 'login',
  role: 'candidate',

  render(params = {}) {
    this.mode = params.mode || 'login';
    this.role = params.role || 'candidate';

    if (params.token) {
      API.setToken(params.token);
      API.getMe().then(res => {
        if (res && res.user) {
          API.setUser(res.user);
          UI.toast(`Welcome back, ${res.user.name}!`, 'success');
          window.location.hash = res.user.role === 'recruiter' ? '#/recruiter' : '#/candidate';
        }
      });
      return `<div style="padding: 100px; text-align: center;"><div class="spinner"></div><p>Logging in with Google...</p></div>`;
    }

    return `
      <div class="auth-page gradient-bg">
        <div class="glass-card auth-card animate-scale-in">
          <div class="text-center mb-4">
            <div class="logo justify-center" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
              ${UI.logo('login')}
            </div>
          </div>
          <h2>${this.mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p class="subtitle">${this.mode === 'login' ? 'Sign in to your account' : 'Start your journey with AI-powered recruitment'}</p>

          <div class="role-tabs">
            ${['candidate', 'recruiter'].map(r => `
              <button class="role-tab ${this.role === r ? 'active' : ''}" data-role="${r}">
                ${r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            `).join('')}
          </div>

          <form id="auth-form">
            ${this.mode === 'register' ? `
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" name="name" required placeholder="John Doe">
              </div>
            ` : ''}
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" name="email" required placeholder="you@example.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" name="password" required placeholder="••••••••" minlength="6">
            </div>
            ${this.mode === 'login' ? `
              <div class="flex justify-between items-center mb-4">
                <label class="text-sm"><input type="checkbox"> Remember me</label>
                <a href="#/forgot-password" class="text-sm">Forgot password?</a>
              </div>
            ` : ''}
            <button type="submit" class="btn btn-primary w-full" id="auth-submit">
              ${this.mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style="margin: 20px 0; text-align: center; border-top: 1px solid var(--border-color); padding-top: 20px;">
            <a href="/api/auth/google?role=${this.role}" class="btn btn-secondary w-full flex items-center justify-center gap-2" style="background: #ffffff; color: #5f6368; border: 1px solid #dadce0;">
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.7-1.57 2.68-3.88 2.68-6.57z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.35 0-4.33-1.59-5.05-3.73H.95v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.95 10.72A5.4 5.4 0 0 1 3.6 9c0-.6.1-1.17.28-1.72V4.98H.95A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.95 4.02l3-2.3z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.41 0 9 0 5.46 0 2.4 2.07.95 4.98l3 2.3c.72-2.14 2.7-3.7 5.05-3.7z"/></svg>
              Continue with Google
            </a>
          </div>

          <p class="text-center text-sm text-secondary mt-4">
            ${this.mode === 'login'
              ? `Don't have an account? <a href="#/register?role=${this.role}">Sign up</a>`
              : `Already have an account? <a href="#/login?role=${this.role}">Sign in</a>`}
          </p>

          ${this.mode === 'login' ? `
            <div class="mt-6 p-4 rounded" style="background:var(--bg-secondary);font-size:0.8125rem">
              <strong>Demo Accounts:</strong><br>
              Candidate: alex@example.com / candidate123<br>
              Recruiter: recruiter@techvision.com / recruiter123
            </div>
          ` : ''}
        </div>
      </div>`;
  },

  bind() {
    document.querySelectorAll('.role-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.role = tab.dataset.role;
        window.location.hash = `#/${this.mode}?role=${this.role}`;
      });
    });

    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('auth-submit');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div>';

      const form = new FormData(e.target);
      const data = { email: form.get('email'), password: form.get('password'), role: this.role };

      try {
        let result;
        if (this.mode === 'login') {
          result = await API.login(data);
        } else {
          data.name = form.get('name');
          result = await API.register(data);
        }
        API.setToken(result.token);
        API.setUser(result.user);
        UI.toast(`Welcome, ${result.user.name}!`, 'success');
        const routes = { candidate: '#/candidate', recruiter: '#/recruiter' };
        window.location.hash = routes[result.user.role] || '#/candidate';
      } catch (err) {
        UI.toast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = this.mode === 'login' ? 'Sign In' : 'Create Account';
      }
    });
  },

  forgotPasswordRender() {
    return `
      <div class="auth-page gradient-bg">
        <div class="glass-card auth-card animate-scale-in">
          <h2>Reset Password</h2>
          <p class="subtitle">Enter your email to receive a reset link</p>
          <form id="forgot-form">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" name="email" required>
            </div>
            <button type="submit" class="btn btn-primary w-full">Send Reset Link</button>
          </form>
          <p class="text-center text-sm text-secondary mt-4">
            <a href="#/login">Back to login</a>
          </p>
        </div>
      </div>`;
  },

  bindForgot() {
    document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = new FormData(e.target).get('email');
      try {
        await API.forgotPassword(email);
        UI.toast('Reset link sent (check console in dev mode)', 'success');
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });
  }
};
