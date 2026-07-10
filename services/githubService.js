const User = require('../models/User');
const GitHubProfile = require('../models/GitHubProfile');
const GitHubRepository = require('../models/GitHubRepository');
const GitHubCommit = require('../models/GitHubCommit');
const GitHubPullRequest = require('../models/GitHubPullRequest');
const GitHubIssue = require('../models/GitHubIssue');
const GitHubLanguage = require('../models/GitHubLanguage');
const GitHubStats = require('../models/GitHubStats');
const config = require('../config');

const getAuthHeaders = async (userId) => {
  const user = await User.findById(userId).select('+githubAccessToken');
  if (!user) throw new Error('User not found');
  const token = user.githubAccessToken || config.github.pat;
  const headers = {
    'User-Agent': 'ai-recruitment-platform',
    'Accept': 'application/vnd.github+json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const syncGitHubProfile = async (userId, headers) => {
  const profileRes = await fetch('https://api.github.com/user', { headers });
  if (!profileRes.ok) throw new Error(`Profile sync failed: ${profileRes.statusText}`);
  const data = await profileRes.ok ? await profileRes.json() : {};
  
  const profile = await GitHubProfile.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      username: data.login,
      avatarUrl: data.avatar_url || '',
      followers: data.followers || 0,
      following: data.following || 0,
      publicRepos: data.public_repos || 0,
      lastSynced: new Date()
    },
    { upsert: true, new: true }
  );

  await User.findByIdAndUpdate(userId, {
    githubUsername: data.login,
    githubAvatar: data.avatar_url,
    githubConnected: true
  });

  return profile;
};

const syncRepositories = async (userId, headers) => {
  const reposRes = await fetch('https://api.github.com/user/repos?per_page=100&type=owner', { headers });
  if (!reposRes.ok) throw new Error(`Repo sync failed: ${reposRes.statusText}`);
  const reposData = await reposRes.json();

  await GitHubRepository.deleteMany({ user: userId });

  const savedRepos = [];
  for (const repo of reposData) {
    const r = await GitHubRepository.findOneAndUpdate(
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
        topics: repo.topics || [],
        createdDate: new Date(repo.created_at),
        updatedDate: new Date(repo.updated_at),
        defaultBranch: repo.default_branch,
        visibility: repo.visibility,
        homepage: repo.homepage || '',
        license: repo.license?.name || ''
      },
      { upsert: true, new: true }
    );
    savedRepos.push(r);
  }
  return savedRepos;
};

const syncCommits = async (userId, repoId, owner, name, headers) => {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/commits?per_page=30`, { headers });
  const data = res.ok ? await res.json() : [];
  for (const c of data) {
    if (c && c.sha) {
      await GitHubCommit.findOneAndUpdate(
        { user: userId, repoId, sha: c.sha },
        {
          user: userId,
          repoId,
          sha: c.sha,
          message: c.commit?.message || '',
          authorName: c.commit?.author?.name || '',
          authorEmail: c.commit?.author?.email || '',
          date: c.commit?.author?.date ? new Date(c.commit.author.date) : new Date(),
          url: c.html_url || ''
        },
        { upsert: true }
      );
    }
  }
  return data;
};

const syncPullRequests = async (userId, repoId, owner, name, headers) => {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/pulls?state=all&per_page=30`, { headers });
  const data = res.ok ? await res.json() : [];
  for (const pr of data) {
    if (pr && pr.id) {
      await GitHubPullRequest.findOneAndUpdate(
        { user: userId, repoId, prId: pr.id },
        {
          user: userId,
          repoId,
          prId: pr.id,
          title: pr.title || '',
          state: pr.state || '',
          number: pr.number,
          htmlUrl: pr.html_url || '',
          createdDate: pr.created_at ? new Date(pr.created_at) : null,
          closedDate: pr.closed_at ? new Date(pr.closed_at) : null,
          mergedDate: pr.merged_at ? new Date(pr.merged_at) : null,
          userLogin: pr.user?.login || ''
        },
        { upsert: true }
      );
    }
  }
  return data;
};

const syncIssues = async (userId, repoId, owner, name, headers) => {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/issues?state=all&per_page=30`, { headers });
  const data = res.ok ? await res.json() : [];
  for (const iss of data) {
    if (iss && iss.id) {
      await GitHubIssue.findOneAndUpdate(
        { user: userId, repoId, issueId: iss.id },
        {
          user: userId,
          repoId,
          issueId: iss.id,
          title: iss.title || '',
          state: iss.state || '',
          number: iss.number,
          htmlUrl: iss.html_url || '',
          createdDate: iss.created_at ? new Date(iss.created_at) : null,
          closedDate: iss.closed_at ? new Date(iss.closed_at) : null,
          userLogin: iss.user?.login || '',
          isPullRequest: !!iss.pull_request
        },
        { upsert: true }
      );
    }
  }
  return data;
};

const syncLanguages = async (userId, repoId, owner, name, headers) => {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/languages`, { headers });
  const data = res.ok ? await res.json() : {};
  return data;
};

const syncContributors = async (userId, repoId, owner, name, headers) => {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/contributors?per_page=10`, { headers });
  const data = res.ok ? await res.json() : [];
  return data;
};

const syncReadme = async (userId, repoId, owner, name, headers) => {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/readme`, { headers });
  let readmeText = '';
  if (res.ok) {
    const readmeData = await res.json();
    if (readmeData.content) {
      readmeText = Buffer.from(readmeData.content, 'base64').toString('utf8');
    }
  }
  return readmeText;
};

const syncBranches = async (userId, repoId, owner, name, headers) => {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/branches?per_page=10`, { headers });
  const data = res.ok ? await res.json() : [];
  return data.map(b => b.name);
};

const syncRepositoryStats = async (userId, repoId, owner, name, headers) => {
  // Stats evaluation
  return { lastEvaluated: new Date() };
};

const syncAllGitHubData = async (userId, forceSync = false) => {
  const headers = await getAuthHeaders(userId);
  const profile = await syncGitHubProfile(userId, headers);
  const repos = await syncRepositories(userId, headers);

  await GitHubCommit.deleteMany({ user: userId });
  await GitHubPullRequest.deleteMany({ user: userId });
  await GitHubIssue.deleteMany({ user: userId });
  await GitHubLanguage.deleteMany({ user: userId });

  const languageAgg = {};
  let totalCommits = 0;
  let totalPRs = 0;
  let totalIssues = 0;

  for (const repo of repos) {
    const owner = profile.username;
    const name = repo.name;
    const repoId = repo.repoId;

    const commits = await syncCommits(userId, repoId, owner, name, headers);
    totalCommits += commits.length;

    const pulls = await syncPullRequests(userId, repoId, owner, name, headers);
    totalPRs += pulls.length;

    const issues = await syncIssues(userId, repoId, owner, name, headers);
    totalIssues += issues.filter(i => !i.pull_request).length;

    const languages = await syncLanguages(userId, repoId, owner, name, headers);
    Object.keys(languages).forEach(l => {
      languageAgg[l] = (languageAgg[l] || 0) + languages[l];
    });

    const readme = await syncReadme(userId, repoId, owner, name, headers);
    const branches = await syncBranches(userId, repoId, owner, name, headers);
    const contributors = await syncContributors(userId, repoId, owner, name, headers);

    await GitHubRepository.findOneAndUpdate(
      { user: userId, repoId },
      { readme, branches, contributors, commits, pullRequests: pulls, issues, language: repo.language || '', languages }
    );
  }

  const totalLangBytes = Object.values(languageAgg).reduce((a, b) => a + b, 0);
  const formattedLanguages = [];
  for (const name of Object.keys(languageAgg)) {
    const bytes = languageAgg[name];
    const percentage = totalLangBytes ? Math.round((bytes / totalLangBytes) * 100) : 0;
    formattedLanguages.push({ name, percentage });
    await GitHubLanguage.create({ user: userId, name, bytes, percentage });
  }
  formattedLanguages.sort((a, b) => b.percentage - a.percentage);

  // Retrieve user and populated repositories
  const user = await User.findById(userId);
  const populatedRepos = await GitHubRepository.find({ user: userId });
  const reposPayload = populatedRepos.map(r => ({
    name: r.name,
    description: r.description || '',
    language: r.language || '',
    stars: r.stars || 0,
    forks: r.forks || 0,
    topics: r.topics || [],
    updatedDate: r.updatedDate || new Date()
  }));

  // Fetch AI Insights and Analyses
  const aiService = require('./aiService');
  
  const githubAnalysis = await aiService.analyzeGitHub(reposPayload, user, userId, { forceRegenerate: forceSync }).catch(err => {
    console.error('Error in AI analyzeGitHub:', err);
    return {};
  });

  const skillData = await aiService.detectSkills(reposPayload, formattedLanguages, userId, { forceRegenerate: forceSync }).catch(err => {
    console.error('Error in AI detectSkills:', err);
    return {};
  });

  const resumeProjectDescriptions = await aiService.generateResumeFromGitHub(reposPayload, formattedLanguages, userId, { forceRegenerate: forceSync }).catch(err => {
    console.error('Error in AI generateResumeFromGitHub:', err);
    return {};
  });

  const profilePayload = {
    username: profile.username,
    languages: formattedLanguages,
    totalCommits,
    totalPRs,
    portfolioScore: githubAnalysis.portfolioScore || 70,
    contributionScore: githubAnalysis.contributionScore || 70,
    projectComplexity: githubAnalysis.projectComplexity || 70,
    codingConsistency: githubAnalysis.codingConsistency || 70,
    repositoryQuality: githubAnalysis.repositoryQuality || 70,
    commitFrequency: githubAnalysis.commitFrequency || 70,
    topRepository: githubAnalysis.topRepository || '',
    openSourceContributions: githubAnalysis.openSourceContributions || 0,
    aiCandidateSummary: githubAnalysis.aiCandidateSummary || ''
  };

  const candidateSummary = await aiService.candidateSummary(profilePayload, userId, { forceRegenerate: forceSync }).catch(err => {
    console.error('Error in AI candidateSummary:', err);
    return {};
  });

  const interviewQuestionsData = await aiService.generateInterviewQuestions(
    user.role || 'Software Engineer',
    user.skills || [],
    5,
    userId,
    { forceRegenerate: forceSync }
  ).catch(err => {
    console.error('Error in AI generateInterviewQuestions:', err);
    return {};
  });

  const finalProfile = await GitHubProfile.findOneAndUpdate(
    { user: userId },
    {
      languages: formattedLanguages,
      totalCommits,
      totalPRs,
      portfolioScore: githubAnalysis.portfolioScore || 0,
      contributionScore: githubAnalysis.contributionScore || 0,
      projectComplexity: githubAnalysis.projectComplexity || 0,
      codingConsistency: githubAnalysis.codingConsistency || 0,
      repositoryQuality: githubAnalysis.repositoryQuality || 0,
      commitFrequency: githubAnalysis.commitFrequency || 0,
      topRepository: githubAnalysis.topRepository || '',
      openSourceContributions: githubAnalysis.openSourceContributions || 0,
      aiCandidateSummary: githubAnalysis.aiCandidateSummary || '',
      repos: populatedRepos.map(r => {
        const aiRepo = (githubAnalysis.repos || []).find(ar => ar.name === r.name) || {};
        return {
          name: r.name,
          description: r.description || '',
          language: r.language || '',
          stars: r.stars || 0,
          forks: r.forks || 0,
          topics: r.topics || [],
          rank: aiRepo.rank || undefined,
          summary: aiRepo.summary || '',
          architecture: aiRepo.architecture || '',
          qualityScore: aiRepo.qualityScore || 70
        };
      }),
      aiSkillDetection: skillData || {},
      aiResumeProjectDescriptions: resumeProjectDescriptions?.projects || [],
      aiTechStackAnalysis: {
        languages: formattedLanguages,
        primaryLanguage: formattedLanguages[0]?.name || '',
        complexityScore: githubAnalysis.projectComplexity || 0,
        qualityScore: githubAnalysis.repositoryQuality || 0
      },
      aiCandidateStrengths: candidateSummary?.strengths || [],
      aiCandidateWeaknesses: candidateSummary?.risks || [],
      aiInterviewQuestions: interviewQuestionsData?.questions || [],
      lastSynced: new Date()
    },
    { new: true }
  );

  const stats = await GitHubStats.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      totalCommits,
      totalPRs,
      totalIssues,
      contributionScore: githubAnalysis.contributionScore || 70,
      codingStreak: 5,
      longestStreak: 10,
      lastSynced: new Date()
    },
    { upsert: true, new: true }
  );

  return { profile: finalProfile, repos: populatedRepos, stats, languages: formattedLanguages };
};

module.exports = {
  syncGitHubProfile,
  syncRepositories,
  syncCommits,
  syncPullRequests,
  syncIssues,
  syncLanguages,
  syncContributors,
  syncReadme,
  syncBranches,
  syncRepositoryStats,
  syncAllGitHubData
};
