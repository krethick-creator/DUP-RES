const User = require('../models/User');
const GitHubRepository = require('../models/GitHubRepository');
const config = require('../config');

const syncUserGitHubData = async (userId, targetUsername = null) => {
  let token = '';
  if (userId) {
    const user = await User.findById(userId).select('+githubAccessToken');
    if (user && user.githubAccessToken) {
      token = user.githubAccessToken;
    }
  }
  if (!token) {
    token = config.github.pat;
  }

  const headers = {
    'User-Agent': 'ai-recruitment-platform'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Fetch profile
  const profileUrl = targetUsername 
    ? `https://api.github.com/users/${targetUsername}`
    : `https://api.github.com/user`;
  
  const profileRes = await fetch(profileUrl, { headers });
  if (!profileRes.ok) {
    throw new Error(`Failed to fetch profile: ${profileRes.statusText}`);
  }
  const profileData = await profileRes.json();
  const username = profileData.login;

  // 2. Fetch user repos
  const reposUrl = targetUsername
    ? `https://api.github.com/users/${targetUsername}/repos?per_page=100`
    : `https://api.github.com/user/repos?per_page=100&type=owner`;

  const reposRes = await fetch(reposUrl, { headers });
  if (!reposRes.ok) {
    throw new Error(`Failed to fetch repositories: ${reposRes.statusText}`);
  }
  const repos = await reposRes.json();

  const savedRepos = [];
  const languageAgg = {};

  for (const repo of repos) {
    const owner = repo.owner.login;
    const name = repo.name;

    // Fetch primary languages details
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${name}/languages`, {
      headers
    });
    const languages = langRes.ok ? await langRes.json() : {};

    // Aggregate languages
    Object.keys(languages).forEach(l => {
      languageAgg[l] = (languageAgg[l] || 0) + languages[l];
    });

    // Fetch branches
    const branchesRes = await fetch(`https://api.github.com/repos/${owner}/${name}/branches?per_page=10`, {
      headers
    });
    const branchesData = branchesRes.ok ? await branchesRes.json() : [];
    const branches = branchesData.map(b => b.name);

    // Fetch releases
    const releasesRes = await fetch(`https://api.github.com/repos/${owner}/${name}/releases?per_page=5`, {
      headers
    });
    const releases = releasesRes.ok ? await releasesRes.json() : [];

    // Fetch commits
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${name}/commits?per_page=15`, {
      headers
    });
    const commits = commitsRes.ok ? await commitsRes.json() : [];

    // Fetch pull requests
    const pullsRes = await fetch(`https://api.github.com/repos/${owner}/${name}/pulls?state=all&per_page=10`, {
      headers
    });
    const pullRequests = pullsRes.ok ? await pullsRes.json() : [];

    // Fetch issues
    const issuesRes = await fetch(`https://api.github.com/repos/${owner}/${name}/issues?state=all&per_page=10`, {
      headers
    });
    const issues = issuesRes.ok ? await issuesRes.json() : [];

    // Fetch contributors
    const contribRes = await fetch(`https://api.github.com/repos/${owner}/${name}/contributors?per_page=10`, {
      headers
    });
    const contributors = contribRes.ok ? await contribRes.json() : [];

    // Fetch README
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${name}/readme`, {
      headers
    });
    let readmeText = '';
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      if (readmeData.content) {
        readmeText = Buffer.from(readmeData.content, 'base64').toString('utf8');
      }
    }

    // Save Repository Detail to Database
    const repoDoc = await GitHubRepository.findOneAndUpdate(
      { user: userId, repoId: repo.id },
      {
        user: userId,
        repoId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        htmlUrl: repo.html_url,
        size: repo.size,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        openIssuesCount: repo.open_issues_count,
        language: repo.language || '',
        languages,
        topics: repo.topics || [],
        createdDate: new Date(repo.created_at),
        updatedDate: new Date(repo.updated_at),
        defaultBranch: repo.default_branch,
        readme: readmeText,
        license: repo.license?.name || '',
        homepage: repo.homepage || '',
        archived: repo.archived,
        visibility: repo.visibility,
        latestCommit: commits[0] || null,
        commits,
        pullRequests,
        issues,
        contributors,
        branches,
        releases,
        contributionActivity: commits.length
      },
      { upsert: true, new: true }
    );
    savedRepos.push(repoDoc);
  }

  // Format language percentages
  const totalLangBytes = Object.values(languageAgg).reduce((a, b) => a + b, 0);
  const formattedLanguages = Object.keys(languageAgg).map(name => ({
    name,
    percentage: totalLangBytes ? Math.round((languageAgg[name] / totalLangBytes) * 100) : 0
  })).sort((a, b) => b.percentage - a.percentage);

  return {
    profile: profileData,
    repos: savedRepos,
    languages: formattedLanguages,
    totalCommits: savedRepos.reduce((sum, r) => sum + r.commits.length, 0),
    totalPRs: savedRepos.reduce((sum, r) => sum + r.pullRequests.length, 0)
  };
};

module.exports = { syncUserGitHubData };
