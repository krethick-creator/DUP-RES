/**
 * Hash-based SPA Router
 */
const Router = {
  routes: {
    '': { render: () => LandingPage.render(), bind: () => { } },
    'login': { render: (p) => AuthPage.render({ mode: 'login', role: p.role }), bind: () => AuthPage.bind() },
    'register': { render: (p) => AuthPage.render({ mode: 'register', role: p.role }), bind: () => AuthPage.bind() },
    'forgot-password': { render: () => AuthPage.forgotPasswordRender(), bind: () => AuthPage.bindForgot() },
    'candidate': { render: (p) => CandidateDashboard.render(p.section || 'overview'), bind: () => CandidateDashboard.bind(), auth: 'candidate' },
    'recruiter': { render: (p) => RecruiterDashboard.render(p.section || 'overview'), bind: () => RecruiterDashboard.bind(), auth: 'recruiter' }
  },

  parseHash() {
    const hash = window.location.hash.slice(2) || '';
    const [path, query] = hash.split('?');
    const parts = path.split('/');
    const params = { section: parts[1] };
    if (query) {
      query.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[k] = decodeURIComponent(v);
      });
    }
    return { route: parts[0] || '', params };
  },

  async navigate() {
    const { route, params } = this.parseHash();
    const config = this.routes[route] || this.routes[''];

    // Auth guard
    if (config.auth) {
      const user = API.getUser();
      if (!user || !API.token) {
        window.location.hash = `#/login?role=${config.auth}`;
        return;
      }
      if (user.role !== config.auth) {
        const roleRoutes = { candidate: 'candidate', recruiter: 'recruiter' };
        window.location.hash = `#/${roleRoutes[user.role]}`;
        return;
      }
    }

    // Redirect logged-in users away from auth pages
    if (['login', 'register'].includes(route) && API.getUser() && API.token) {
      const user = API.getUser();
      window.location.hash = `#/${user.role}`;
      return;
    }

    const app = document.getElementById('app');
    app.style.opacity = '0';

    if (typeof Charts !== 'undefined') {
      Charts.destroyAll();
    }

    try {
      const html = await config.render(params);
      app.innerHTML = html;
      app.style.opacity = '1';
      config.bind();
    } catch (err) {
      app.innerHTML = `<div class="container" style="padding:60px;text-align:center">
        <h2>Something went wrong</h2><p class="text-secondary mt-2">${err.message}</p>
        <a href="#/" class="btn btn-primary mt-4">Go Home</a></div>`;
      app.style.opacity = '1';
    }
  },

  init() {
    window.addEventListener('hashchange', () => this.navigate());
    this.navigate();
  }
};
