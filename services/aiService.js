const AIGateway = require('./AIGateway');
const prompts = require('./aiPrompts');

const getLinkedInData = async (userId) => {
  if (!userId) return null;
  try {
    const LinkedInProfile = require('../models/LinkedInProfile');
    const profile = await LinkedInProfile.findOne({ user: userId });
    if (profile) {
      return {
        name: profile.name,
        headline: profile.headline,
        profileUrl: profile.profileUrl,
        email: profile.email
      };
    }
  } catch (_) {}
  return null;
};

// Route through the centralized AIGateway
const callGemini = async (promptFactory, payload, fallback, userId = null, options = {}) => {
  const featureName = options.featureName || 'general-ai';
  const prompt = typeof promptFactory === 'function' ? promptFactory(payload) : promptFactory;
  
  // Package payload so mock handlers can inspect context if needed
  const extendedOptions = { ...options, payload };
  return await AIGateway.generate(featureName, prompt, fallback, userId, extendedOptions);
};


const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toArray = (value, fallback = []) => (Array.isArray(value) ? value : fallback);

const toObject = (value, fallback = {}) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return fallback;
};

exports.screenResume = async (resume, job, userId = null, options = {}) => {
  const fallback = {
    matchScore: 70,
    recommendation: 'review',
    strengths: ['Strong technical background'],
    weaknesses: ['Needs clearer impact metrics'],
    missingSkills: [],
    explanation: 'Fallback analysis generated because Gemini was unavailable.',
    confidence: 0.5
  };

  const linkedin = await getLinkedInData(userId);
  const data = await callGemini(prompts.resumeScreeningPrompt, { resume, job, linkedin }, fallback, userId, options);
  return {
    ...data,
    module: 'resume-screening',
    matchScore: Math.max(0, Math.min(100, toNumber(data.matchScore, fallback.matchScore))),
    recommendation: data.recommendation || fallback.recommendation,
    strengths: Array.isArray(data.strengths) ? data.strengths : fallback.strengths,
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : fallback.weaknesses,
    missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : fallback.missingSkills,
    explanation: data.explanation || fallback.explanation,
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.parseResume = async (filepath, userId = null, options = {}) => {
  const fallback = {
    parsed: {
      name: 'Unknown',
      email: '',
      phone: '',
      summary: 'Resume content could not be parsed.',
      skills: [],
      experience: [],
      education: [],
      certifications: []
    },
    score: 70,
    atsScore: 70,
    confidence: 0.5,
    rawAnalysis: 'Fallback resume parsing output.'
  };

  const promptPayload = options.ocrText ? `File Path: ${filepath}\nExtracted OCR Text Content:\n${options.ocrText}` : filepath;
  const data = await callGemini(prompts.parseResumePrompt, promptPayload, fallback, userId, options);
  return {
    ...data,
    module: 'resume-parsing',
    parsed: data.parsed || fallback.parsed,
    score: Math.max(0, Math.min(100, toNumber(data.score, fallback.score))),
    atsScore: Math.max(0, Math.min(100, toNumber(data.atsScore, fallback.atsScore))),
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.matchSkills = async (candidateSkills, jobSkills, userId = null, options = {}) => {
  const fallback = {
    matchPercentage: 70,
    matchedSkills: [],
    missingSkills: jobSkills || [],
    transferableSkills: [],
    rationale: 'Fallback skill matching output.'
  };

  const data = await callGemini(prompts.skillMatchingPrompt, { candidateSkills, jobSkills }, fallback, userId, options);
  return {
    ...data,
    module: 'semantic-skill-matching',
    matchPercentage: Math.max(0, Math.min(100, toNumber(data.matchPercentage, fallback.matchPercentage))),
    matchedSkills: Array.isArray(data.matchedSkills) ? data.matchedSkills : fallback.matchedSkills,
    missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : fallback.missingSkills,
    transferableSkills: Array.isArray(data.transferableSkills) ? data.transferableSkills : fallback.transferableSkills,
    rationale: data.rationale || fallback.rationale
  };
};

exports.rankCandidates = async (candidates, userId = null, options = {}) => {
  const fallback = {
    candidates: (candidates || []).map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      score: 75,
      tier: index < 3 ? 'top' : 'good',
      rationale: 'Fallback ranking output.'
    }))
  };

  const data = await callGemini(prompts.rankingPrompt, candidates, fallback, userId, options);
  const ranked = Array.isArray(data.candidates) ? data.candidates : fallback.candidates;
  return {
    ...data,
    module: 'candidate-ranking',
    candidates: ranked.map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      score: Math.max(0, Math.min(100, toNumber(candidate.score, 75))),
      tier: candidate.tier || (index < 3 ? 'top' : index < 10 ? 'good' : 'average')
    }))
  };
};

exports.explainScore = async (score, context, userId = null, options = {}) => {
  const fallback = {
    factors: [
      { factor: 'Technical Skills', weight: 0.35, score: score * 0.9 },
      { factor: 'Experience', weight: 0.25, score: score * 0.85 },
      { factor: 'Education', weight: 0.15, score: score * 0.95 },
      { factor: 'Projects', weight: 0.15, score: score * 0.8 },
      { factor: 'Soft Skills', weight: 0.1, score: score * 0.75 }
    ],
    summary: `Fallback explanation for score ${score}.`,
    confidence: 0.5
  };

  const data = await callGemini(prompts.explainScorePrompt, { score, context }, fallback, userId, options);
  return {
    ...data,
    module: 'explainable-scoring',
    factors: Array.isArray(data.factors) ? data.factors : fallback.factors,
    summary: data.summary || fallback.summary,
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.generateDynamicResume = async (resume, job, userId = null, options = {}) => {
  const fallback = {
    tailoredSummary: `Experienced developer optimized for ${job?.title || 'target role'}`,
    highlightedSkills: resume?.parsed?.skills?.slice(0, 5) || [],
    suggestedChanges: ['Emphasize leadership and measurable impact'],
    resumeProjectSection: [],
    summary: 'Fallback dynamic resume tailoring output.'
  };

  const GitHubRepository = require('../models/GitHubRepository');
  const reposData = userId ? await GitHubRepository.find({ user: userId }).limit(10) : [];
  const repos = reposData.map(r => ({
    name: r.name,
    description: r.description,
    language: r.language,
    topics: r.topics
  }));

  const data = await callGemini(prompts.dynamicResumePrompt, { resume, job, repos }, fallback, userId, options);
  return {
    ...data,
    module: 'dynamic-resume',
    tailoredSummary: data.tailoredSummary || fallback.tailoredSummary,
    highlightedSkills: Array.isArray(data.highlightedSkills) ? data.highlightedSkills : fallback.highlightedSkills,
    suggestedChanges: Array.isArray(data.suggestedChanges) ? data.suggestedChanges : fallback.suggestedChanges,
    resumeProjectSection: Array.isArray(data.resumeProjectSection) ? data.resumeProjectSection : fallback.resumeProjectSection,
    summary: data.summary || fallback.summary
  };
};

exports.simulateResume = async (resume, scenarios, userId = null, options = {}) => {
  const fallback = {
    scenarios: (scenarios || ['FAANG', 'Startup', 'Enterprise']).map((scenario) => ({
      scenario,
      acceptanceRate: 65,
      feedback: `Fallback simulation for ${scenario}`,
      confidence: 0.5
    }))
  };

  const data = await callGemini(prompts.resumeSimulationPrompt, { resume, scenarios }, fallback, userId, options);
  return {
    ...data,
    module: 'resume-simulation',
    scenarios: Array.isArray(data.scenarios) ? data.scenarios : fallback.scenarios
  };
};

exports.checkAuthenticity = async (resume, userId = null, options = {}) => {
  const fallback = {
    authenticityScore: 86,
    flags: [],
    verification: { employment: 'verified', education: 'verified', skills: 'likely-accurate' },
    summary: 'Fallback authenticity check output.'
  };

  const data = await callGemini(prompts.authenticityPrompt, { resume }, fallback, userId, options);
  return {
    ...data,
    module: 'authenticity-checker',
    authenticityScore: Math.max(0, Math.min(100, toNumber(data.authenticityScore, fallback.authenticityScore))),
    flags: Array.isArray(data.flags) ? data.flags : fallback.flags,
    verification: data.verification || fallback.verification,
    summary: data.summary || fallback.summary
  };
};

exports.generateTimeline = async (resume, userId = null, options = {}) => {
  const fallback = {
    timeline: (resume?.parsed?.experience || []).map((experience, index) => ({
      id: index,
      title: experience.role,
      company: experience.company,
      start: experience.startDate,
      end: experience.endDate,
      type: 'experience'
    })),
    summary: 'Fallback timeline output.'
  };

  const data = await callGemini(prompts.timelinePrompt, { resume }, fallback, userId, options);
  return {
    ...data,
    module: 'resume-timeline',
    timeline: Array.isArray(data.timeline) ? data.timeline : fallback.timeline,
    summary: data.summary || fallback.summary
  };
};

exports.generateImprovementReport = async (resume, userId = null, options = {}) => {
  const fallback = {
    overallGrade: 'B+',
    improvements: [
      { area: 'Skills', suggestion: 'Add cloud certifications', priority: 'high' },
      { area: 'Experience', suggestion: 'Quantify project impact', priority: 'medium' },
      { area: 'Format', suggestion: 'Use consistent dates', priority: 'low' }
    ],
    estimatedScoreIncrease: 12,
    summary: 'Fallback improvement report output.'
  };

  const data = await callGemini(prompts.improvementReportPrompt, { resume }, fallback, userId, options);
  return {
    ...data,
    module: 'improvement-report',
    overallGrade: data.overallGrade || fallback.overallGrade,
    improvements: Array.isArray(data.improvements) ? data.improvements : fallback.improvements,
    estimatedScoreIncrease: Number(data.estimatedScoreIncrease || fallback.estimatedScoreIncrease),
    summary: data.summary || fallback.summary
  };
};

exports.analyzeGitHub = async (reposPayload, user, userId = null, options = {}) => {
  const fallback = {
    username: user.githubUsername,
    repos: [],
    portfolioScore: 70,
    totalCommits: 0,
    totalPRs: 0,
    languages: [],
    contributionScore: 70,
    projectComplexity: 70,
    codingConsistency: 70,
    repositoryQuality: 70,
    commitFrequency: 70,
    topRepository: '',
    openSourceContributions: 0,
    aiCandidateSummary: ''
  };

  const username = user.githubUsername;
  const repos = reposPayload.map(r => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stars,
    forks: r.forks,
    topics: r.topics
  }));

  options.featureName = 'github-analysis';
  const data = await callGemini(prompts.githubAnalysisPrompt, { username, repos }, fallback, userId, options);
  return {
    ...data,
    module: 'github-analysis',
    username,
    repos: Array.isArray(data.repos) ? data.repos : fallback.repos,
    portfolioScore: Math.max(0, Math.min(100, toNumber(data.portfolioScore, fallback.portfolioScore))),
    totalCommits: Number(data.totalCommits || fallback.totalCommits),
    totalPRs: Number(data.totalPRs || fallback.totalPRs),
    languages: Array.isArray(data.languages) ? data.languages : fallback.languages,
    contributionScore: Math.max(0, Math.min(100, toNumber(data.contributionScore, fallback.contributionScore))),
    projectComplexity: Math.max(0, Math.min(100, toNumber(data.projectComplexity, fallback.projectComplexity))),
    codingConsistency: Math.max(0, Math.min(100, toNumber(data.codingConsistency, fallback.codingConsistency))),
    repositoryQuality: Math.max(0, Math.min(100, toNumber(data.repositoryQuality, fallback.repositoryQuality))),
    commitFrequency: Math.max(0, Math.min(100, toNumber(data.commitFrequency, fallback.commitFrequency))),
    topRepository: data.topRepository || fallback.topRepository,
    openSourceContributions: Number(data.openSourceContributions || fallback.openSourceContributions),
    aiCandidateSummary: data.aiCandidateSummary || fallback.aiCandidateSummary
  };
};

exports.projectKnowledge = async (projectName, question, userId = null, options = {}) => {
  const fallback = {
    answer: `Based on analysis of ${projectName}: the project is architecturally sound and well organized.`,
    summary: 'Fallback project knowledge output.',
    keyPoints: [],
    confidence: 0.5
  };

  const data = await callGemini(prompts.projectKnowledgePrompt, { projectName, question }, fallback, userId, options);
  return {
    ...data,
    module: 'project-knowledge',
    answer: data.answer || fallback.answer,
    summary: data.summary || fallback.summary,
    keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : fallback.keyPoints,
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.analyzeSkillTransfer = async (skills, userId = null, options = {}) => {
  const fallback = {
    transfers: (skills || []).map((skill) => ({
      skill,
      transferableTo: ['Adjacent Domain'],
      transferability: 70
    })),
    summary: 'Fallback skill transfer analysis.'
  };

  const data = await callGemini(prompts.skillTransferPrompt, { skills }, fallback, userId, options);
  return {
    ...data,
    module: 'skill-transfer',
    transfers: Array.isArray(data.transfers) ? data.transfers : fallback.transfers,
    summary: data.summary || fallback.summary
  };
};

exports.generateCodingAssessment = async (language, difficulty, userId = null, options = {}) => {
  const fallback = {
    title: `${difficulty || 'Medium'} ${language || 'JavaScript'} Challenge`,
    problems: [
      { id: 1, title: 'Two Sum Variant', difficulty: 'easy', points: 100 },
      { id: 2, title: 'LRU Cache Implementation', difficulty: 'medium', points: 200 },
      { id: 3, title: 'Distributed Rate Limiter', difficulty: 'hard', points: 300 }
    ],
    timeLimit: 90,
    summary: 'Fallback coding assessment output.'
  };

  const data = await callGemini(prompts.codingAssessmentPrompt, { language, difficulty }, fallback, userId, options);
  return {
    ...data,
    module: 'coding-assessment',
    title: data.title || fallback.title,
    problems: Array.isArray(data.problems) ? data.problems : fallback.problems,
    timeLimit: Number(data.timeLimit || fallback.timeLimit),
    summary: data.summary || fallback.summary
  };
};

exports.reviewCode = async (code, language, userId = null, options = {}) => {
  const fallback = {
    score: 75,
    issues: [
      { line: 1, severity: 'info', message: 'Review unavailable; fallback output used.' }
    ],
    suggestions: ['Add unit tests', 'Improve error handling'],
    securityIssues: [],
    summary: 'Fallback code review output.'
  };

  const data = await callGemini(prompts.codeReviewPrompt, { code, language }, fallback, userId, options);
  return {
    ...data,
    module: 'code-review',
    score: Math.max(0, Math.min(100, toNumber(data.score, fallback.score))),
    issues: Array.isArray(data.issues) ? data.issues : fallback.issues,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : fallback.suggestions,
    securityIssues: Array.isArray(data.securityIssues) ? data.securityIssues : fallback.securityIssues,
    summary: data.summary || fallback.summary
  };
};

exports.generateInterviewQuestions = async (role, skills, count = 10, userId = null, options = {}) => {
  const fallback = {
    questions: Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      question: `${role || 'Engineer'} question ${index + 1}`,
      type: 'technical',
      difficulty: index < 3 ? 'easy' : index < 7 ? 'medium' : 'hard'
    })),
    summary: 'Fallback interview question output.'
  };

  const GitHubRepository = require('../models/GitHubRepository');
  const repos = userId ? await GitHubRepository.find({ user: userId }).limit(10) : [];
  const repoDetails = repos.map(r => ({
    name: r.name,
    languages: r.languages,
    topics: r.topics
  }));

  const data = await callGemini(prompts.interviewQuestionsPrompt, { role, skills, count, repoDetails }, fallback, userId, options);
  return {
    ...data,
    module: 'interview-questions',
    questions: Array.isArray(data.questions) ? data.questions : fallback.questions,
    summary: data.summary || fallback.summary
  };
};

exports.inferSoftSkills = async (profile, userId = null, options = {}) => {
  const fallback = {
    skills: {
      communication: 75,
      leadership: 70,
      teamwork: 78,
      problemSolving: 80,
      adaptability: 73
    },
    summary: 'Fallback soft-skill analysis output.',
    confidence: 0.5
  };

  const data = await callGemini(prompts.softSkillsPrompt, { profile }, fallback, userId, options);
  return {
    ...data,
    module: 'soft-skill-inference',
    skills: data.skills || fallback.skills,
    summary: data.summary || fallback.summary,
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.candidateSummary = async (profile, userId = null, options = {}) => {
  const fallback = {
    summary: 'Candidate summary unavailable.',
    highlights: [],
    strengths: [],
    risks: [],
    nextSteps: []
  };

  const linkedin = await getLinkedInData(userId);
  const data = await callGemini(prompts.candidateSummaryPrompt, { profile, linkedin }, fallback, userId, options);
  return {
    ...data,
    module: 'candidate-summary',
    summary: data.summary || fallback.summary,
    highlights: toArray(data.highlights, fallback.highlights),
    strengths: toArray(data.strengths, fallback.strengths),
    risks: toArray(data.risks, fallback.risks),
    nextSteps: toArray(data.nextSteps, fallback.nextSteps)
  };
};

exports.recruiterSummary = async (profile, job, userId = null, options = {}) => {
  const fallback = {
    summary: 'Recruiter summary unavailable.',
    interviewFocus: [],
    decisionNotes: [],
    suggestedQuestions: []
  };

  const data = await callGemini(prompts.recruiterSummaryPrompt, { profile, job }, fallback, userId, options);
  return {
    ...data,
    module: 'recruiter-summary',
    summary: data.summary || fallback.summary,
    interviewFocus: toArray(data.interviewFocus, fallback.interviewFocus),
    decisionNotes: toArray(data.decisionNotes, fallback.decisionNotes),
    suggestedQuestions: toArray(data.suggestedQuestions, fallback.suggestedQuestions)
  };
};

exports.personalizedFeedback = async (profile, targetRole, userId = null, options = {}) => {
  const fallback = {
    feedback: 'Personalized feedback could not be generated.',
    priorities: [],
    actions: [],
    expectedImpact: 'Moderate improvement potential.'
  };

  const data = await callGemini(prompts.personalizedFeedbackPrompt, { profile, targetRole }, fallback, userId, options);
  return {
    ...data,
    module: 'personalized-feedback',
    feedback: data.feedback || fallback.feedback,
    priorities: toArray(data.priorities, fallback.priorities),
    actions: toArray(data.actions, fallback.actions),
    expectedImpact: data.expectedImpact || fallback.expectedImpact
  };
};

exports.explainableRanking = async (candidates, userId = null, options = {}) => {
  const fallback = {
    candidates: (candidates || []).map((candidate, index) => ({
      ...candidate,
      score: 75,
      tier: index < 2 ? 'top' : 'good',
      rationale: 'Fallback ranking rationale.'
    })),
    summary: 'Explainable ranking unavailable.'
  };

  const data = await callGemini(prompts.explainableRankingPrompt, { candidates }, fallback, userId, options);
  const ranked = Array.isArray(data.candidates) ? data.candidates : fallback.candidates;
  return {
    ...data,
    module: 'explainable-ranking',
    candidates: ranked.map((candidate, index) => ({
      ...candidate,
      score: Math.max(0, Math.min(100, toNumber(candidate.score, 75))),
      tier: candidate.tier || (index < 2 ? 'top' : 'good'),
      rationale: candidate.rationale || 'No rationale provided.'
    })),
    summary: data.summary || fallback.summary
  };
};

exports.projectQualityAnalysis = async (project, userId = null, options = {}) => {
  const fallback = {
    qualityScore: 75,
    strengths: [],
    risks: [],
    recommendations: [],
    summary: 'Project quality analysis unavailable.'
  };

  const data = await callGemini(prompts.projectQualityPrompt, { project }, fallback, userId, options);
  return {
    ...data,
    module: 'project-quality-analysis',
    qualityScore: Math.max(0, Math.min(100, toNumber(data.qualityScore, fallback.qualityScore))),
    strengths: toArray(data.strengths, fallback.strengths),
    risks: toArray(data.risks, fallback.risks),
    recommendations: toArray(data.recommendations, fallback.recommendations),
    summary: data.summary || fallback.summary
  };
};

exports.skillGapAnalysis = async (candidateSkills, targetSkills, userId = null, options = {}) => {
  const fallback = {
    gapScore: 40,
    missingSkills: [],
    recommendedLearning: [],
    summary: 'Skill gap analysis unavailable.'
  };

  const data = await callGemini(prompts.skillGapPrompt, { candidateSkills, targetSkills }, fallback, userId, options);
  return {
    ...data,
    module: 'skill-gap-analysis',
    gapScore: Math.max(0, Math.min(100, toNumber(data.gapScore, fallback.gapScore))),
    missingSkills: toArray(data.missingSkills, fallback.missingSkills),
    recommendedLearning: toArray(data.recommendedLearning, fallback.recommendedLearning),
    summary: data.summary || fallback.summary
  };
};

exports.generateCareerRoadmap = async (profile, userId = null, options = {}) => {
  const fallback = {
    nodes: [
      { id: '1', type: 'skill', label: 'JavaScript Mastery', progress: 85, x: 100, y: 200 },
      { id: '2', type: 'project', label: 'Open Source Contribution', progress: 60, x: 300, y: 150 },
      { id: '3', type: 'certification', label: 'AWS Certified', progress: 0, x: 500, y: 200 },
      { id: '4', type: 'company', label: 'Senior Engineer Role', progress: 40, x: 700, y: 100 },
      { id: '5', type: 'goal', label: 'Tech Lead', progress: 20, x: 900, y: 200 }
    ],
    connections: [{ from: '1', to: '2' }, { from: '2', to: '3' }, { from: '3', to: '4' }, { from: '4', to: '5' }],
    progress: 45,
    summary: 'Fallback career roadmap output.'
  };

  const GitHubRepository = require('../models/GitHubRepository');
  const repos = userId ? await GitHubRepository.find({ user: userId }).limit(10) : [];
  const repoSummary = repos.map(r => `${r.name} (${r.language || 'Unknown'}): ${r.description || ''}`).join('\n');

  const linkedin = await getLinkedInData(userId);
  const data = await callGemini(prompts.careerRoadmapPrompt, { profile, repoSummary, linkedin }, fallback, userId, options);
  return {
    ...data,
    module: 'career-roadmap',
    nodes: Array.isArray(data.nodes) ? data.nodes : fallback.nodes,
    connections: Array.isArray(data.connections) ? data.connections : fallback.connections,
    progress: Math.max(0, Math.min(100, toNumber(data.progress, fallback.progress))),
    summary: data.summary || fallback.summary
  };
};

exports.analyzeRoadmap = async (roadmap, userId = null, options = {}) => {
  const fallback = {
    analysis: 'Fallback roadmap analysis output.',
    bottlenecks: ['Cloud certification pending'],
    recommendations: ['Focus on system design skills'],
    confidence: 0.5
  };

  const data = await callGemini(prompts.roadmapAnalysisPrompt, { roadmap }, fallback, userId, options);
  return {
    ...data,
    module: 'roadmap-analyzer',
    analysis: data.analysis || fallback.analysis,
    bottlenecks: Array.isArray(data.bottlenecks) ? data.bottlenecks : fallback.bottlenecks,
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : fallback.recommendations,
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.planCompanyGoals = async (company, goals, userId = null, options = {}) => {
  const fallback = {
    plan: (goals || []).map((goal) => ({ goal, timeline: '6 months', milestones: 4, feasibility: 'high' })),
    summary: 'Fallback company goal planning output.'
  };

  const data = await callGemini(prompts.companyGoalsPrompt, { company, goals }, fallback, userId, options);
  return {
    ...data,
    module: 'company-goal-planner',
    plan: Array.isArray(data.plan) ? data.plan : fallback.plan,
    summary: data.summary || fallback.summary
  };
};

exports.getLeaderboard = async (userId = null, options = {}) => {
  const fallback = {
    leaderboard: [
      { rank: 1, name: 'Alex Chen', score: 94, growth: '+12%' },
      { rank: 2, name: 'Sarah Kim', score: 91, growth: '+8%' },
      { rank: 3, name: 'Mike Johnson', score: 88, growth: '+15%' },
      { rank: 4, name: 'You', score: 84, growth: '+10%' },
      { rank: 5, name: 'Emma Wilson', score: 82, growth: '+6%' }
    ]
  };

  const data = await callGemini(prompts.leaderboardPrompt, null, fallback, userId, options);
  return {
    ...data,
    module: 'career-leaderboard',
    leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : fallback.leaderboard
  };
};

exports.benchmarkComparison = async (profile, userId = null, options = {}) => {
  const fallback = {
    benchmarks: {
      skills: { you: 78, average: 65, top10: 92 },
      experience: { you: 5, average: 4, top10: 8 },
      projects: { you: 12, average: 6, top10: 20 },
      certifications: { you: 2, average: 1, top10: 5 }
    },
    summary: 'Fallback benchmark comparison output.'
  };

  const data = await callGemini(prompts.benchmarkPrompt, { profile }, fallback, userId, options);
  return {
    ...data,
    module: 'benchmark-comparison',
    benchmarks: data.benchmarks || fallback.benchmarks,
    summary: data.summary || fallback.summary
  };
};

exports.generateLearningRoadmap = async (skills, userId = null, options = {}) => {
  const fallback = {
    modules: (skills || []).map((skill, index) => ({
      skill,
      courses: [`${skill} Fundamentals`, `Advanced ${skill}`],
      estimatedWeeks: 4 + index * 2,
      priority: index < 2 ? 'high' : 'medium'
    })),
    summary: 'Fallback learning roadmap output.'
  };

  const data = await callGemini(prompts.learningRoadmapPrompt, { skills }, fallback, userId, options);
  return {
    ...data,
    module: 'learning-roadmap',
    modules: Array.isArray(data.modules) ? data.modules : fallback.modules,
    summary: data.summary || fallback.summary
  };
};

exports.predictCareerGrowth = async (profile, userId = null, options = {}) => {
  const fallback = {
    predictions: [
      { year: 1, role: 'Senior Developer', probability: 0.85, salary: '$120K-$150K' },
      { year: 3, role: 'Tech Lead', probability: 0.65, salary: '$150K-$180K' },
      { year: 5, role: 'Engineering Manager', probability: 0.4, salary: '$180K-$220K' }
    ],
    summary: 'Fallback career growth prediction output.'
  };

  const data = await callGemini(prompts.careerGrowthPrompt, { profile }, fallback, userId, options);
  return {
    ...data,
    module: 'career-growth-predictor',
    predictions: Array.isArray(data.predictions) ? data.predictions : fallback.predictions,
    summary: data.summary || fallback.summary
  };
};

exports.calculateLearningScore = async (profile, userId = null, options = {}) => {
  const fallback = {
    score: 78,
    streak: 14,
    weeklyHours: 8,
    certificationsInProgress: 2,
    summary: 'Fallback learning score output.'
  };

  const data = await callGemini(prompts.learningScorePrompt, { profile }, fallback, userId, options);
  return {
    ...data,
    module: 'continuous-learning-score',
    score: Math.max(0, Math.min(100, toNumber(data.score, fallback.score))),
    streak: Number(data.streak || fallback.streak),
    weeklyHours: Number(data.weeklyHours || fallback.weeklyHours),
    certificationsInProgress: Number(data.certificationsInProgress || fallback.certificationsInProgress),
    summary: data.summary || fallback.summary
  };
};

exports.recruiterAssistant = async (query, context, userId = null, options = {}) => {
  const fallback = {
    response: `I recommend focusing on candidates with strong technical backgrounds.`,
    suggestions: ['Schedule interviews for top candidates', 'Update the role requirements'],
    summary: 'Fallback recruiter assistant output.'
  };

  const data = await callGemini(prompts.recruiterAssistantPrompt, { query, context }, fallback, userId, options);
  return {
    ...data,
    module: 'recruiter-assistant',
    response: data.response || fallback.response,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : fallback.suggestions,
    summary: data.summary || fallback.summary
  };
};

exports.recommendJobs = async (profile, userId = null, options = {}) => {
  const fallback = {
    recommendations: [
      { title: 'Senior Full Stack Engineer', company: 'TechVision', match: 92, rationale: 'Strong fit' },
      { title: 'Lead Developer', company: 'CloudScale', match: 87, rationale: 'Strong architecture fit' },
      { title: 'Software Architect', company: 'DataFlow', match: 81, rationale: 'Leadership alignment' }
    ],
    summary: 'Fallback job recommendation output.'
  };

  const data = await callGemini(prompts.jobRecommendationPrompt, { profile }, fallback, userId, options);
  return {
    ...data,
    module: 'job-recommendation',
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : fallback.recommendations,
    summary: data.summary || fallback.summary
  };
};

exports.reverseMatch = async (job, userId = null, options = {}) => {
  const fallback = {
    candidates: [
      { name: 'Candidate A', match: 94, availability: 'immediate' },
      { name: 'Candidate B', match: 89, availability: '2 weeks' },
      { name: 'Candidate C', match: 85, availability: '1 month' }
    ],
    summary: 'Fallback reverse matching output.'
  };

  const data = await callGemini(prompts.reverseMatchPrompt, { job }, fallback, userId, options);
  return {
    ...data,
    module: 'reverse-matching',
    candidates: Array.isArray(data.candidates) ? data.candidates : fallback.candidates,
    summary: data.summary || fallback.summary
  };
};

exports.collectResumes = async (sources, userId = null, options = {}) => {
  const fallback = {
    collected: Array.isArray(sources) ? sources.length : 0,
    processed: 0,
    status: 'ready',
    summary: 'Fallback resume collection output.'
  };

  const data = await callGemini(prompts.resumeCollectionPrompt, { sources }, fallback, userId, options);
  return {
    ...data,
    module: 'auto-resume-collection',
    collected: Number(data.collected || fallback.collected),
    processed: Number(data.processed || fallback.processed),
    status: data.status || fallback.status,
    summary: data.summary || fallback.summary
  };
};

exports.hiringAnalytics = async (companyId, userId = null, options = {}) => {
  const fallback = {
    metrics: {
      totalApplications: 342,
      shortlisted: 45,
      interviewed: 22,
      hired: 8,
      avgTimeToHire: 28,
      conversionRate: 2.3,
      topSources: ['LinkedIn', 'Direct', 'Referral']
    },
    funnel: [
      { stage: 'Applied', count: 342 },
      { stage: 'Screened', count: 120 },
      { stage: 'Shortlisted', count: 45 },
      { stage: 'Interviewed', count: 22 },
      { stage: 'Offered', count: 10 },
      { stage: 'Hired', count: 8 }
    ],
    summary: 'Fallback hiring analytics output.'
  };

  const data = await callGemini(prompts.hiringAnalyticsPrompt, { companyId }, fallback, userId, options);
  return {
    ...data,
    module: 'hiring-analytics',
    metrics: data.metrics || fallback.metrics,
    funnel: Array.isArray(data.funnel) ? data.funnel : fallback.funnel,
    summary: data.summary || fallback.summary
  };
};

exports.suggestInterviewSlots = async (participants, userId = null, options = {}) => {
  const fallback = {
    slots: [
      { date: '2026-07-10', times: ['09:00', '11:00', '14:00'] },
      { date: '2026-07-11', times: ['10:00', '13:00'] }
    ],
    recommended: '09:00',
    summary: 'Fallback interview scheduling output.'
  };

  const data = await callGemini(prompts.interviewSlotsPrompt, { participants }, fallback, userId, options);
  return {
    ...data,
    module: 'interview-scheduling',
    slots: Array.isArray(data.slots) ? data.slots : fallback.slots,
    recommended: data.recommended || fallback.recommended,
    summary: data.summary || fallback.summary
  };
};

exports.trackApplication = async (application, userId = null, options = {}) => {
  const fallback = {
    status: application?.status || 'applied',
    nextSteps: ['Awaiting recruiter review'],
    estimatedDecision: '3-5 business days',
    summary: 'Fallback application tracking output.'
  };

  const data = await callGemini(prompts.applicationTrackingPrompt, { application }, fallback, userId, options);
  return {
    ...data,
    module: 'application-tracking',
    status: data.status || fallback.status,
    nextSteps: Array.isArray(data.nextSteps) ? data.nextSteps : fallback.nextSteps,
    estimatedDecision: data.estimatedDecision || fallback.estimatedDecision,
    summary: data.summary || fallback.summary
  };
};

exports.generateJob = async (prompt, userId = null, options = {}) => {
  const fallback = {
    job: {
      title: 'Senior Full Stack Engineer',
      description: `We are looking for a talented engineer. ${prompt || ''}`,
      requirements: ['5+ years experience', 'React & Node.js', 'System design skills'],
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS']
    },
    summary: 'Fallback AI job creation output.'
  };

  const data = await callGemini(prompts.jobCreationPrompt, { prompt }, fallback, userId, options);
  return {
    ...data,
    module: 'ai-job-creation',
    job: data.job || fallback.job,
    summary: data.summary || fallback.summary
  };
};

exports.candidateAI = async (action, context, userId = null, options = {}) => {
  const fallback = {
    response: 'AI assistant ready to help you improve your candidacy.',
    suggestions: ['Review your resume', 'Practice interview scenarios'],
    summary: 'Fallback candidate AI output.'
  };

  const data = await callGemini(prompts.candidateAssistantPrompt, { action, context }, fallback, userId, options);
  return {
    ...data,
    module: 'candidate-ai',
    response: data.response || fallback.response,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : fallback.suggestions,
    summary: data.summary || fallback.summary
  };
};

exports.analyzeRepository = async (repo, userId = null, options = {}) => {
  const fallback = {
    summary: 'A software repository containing code assets.',
    techStack: [repo.language || 'JavaScript'],
    frameworks: [],
    architecture: 'Model-View-Controller / Single tier standard layout',
    complexityScore: 65,
    documentationScore: 70,
    codeQualityScore: 75,
    suggestions: ['Add systematic unit testing', 'Enhance API documentation'],
    estimatedExperienceLevel: 'Mid-level'
  };
  options.featureName = `repository-analyzer:${repo.name}`;
  const data = await callGemini(prompts.repositoryAnalysisPrompt, { repo }, fallback, userId, options);
  return {
    ...data,
    module: 'repository-analyzer',
    complexityScore: toNumber(data.complexityScore, fallback.complexityScore),
    documentationScore: toNumber(data.documentationScore, fallback.documentationScore),
    codeQualityScore: toNumber(data.codeQualityScore, fallback.codeQualityScore)
  };
};

exports.analyzeCommits = async (commits, stats, userId = null, options = {}) => {
  const fallback = {
    commitFrequency: 'Steady activity',
    codingConsistency: 80,
    weeklyActivity: [5, 4, 3, 2, 6, 8, 1],
    monthlyActivity: [20, 15, 25, 30],
    developmentTimeline: 'Steady continuous progression over the active months',
    longestCodingStreak: stats.longestStreak || 0,
    contributionHeatmap: stats.heatmap || {}
  };
  options.featureName = 'commit-analyzer';
  const data = await callGemini(prompts.commitAnalysisPrompt, { commits, stats }, fallback, userId, options);
  return {
    ...data,
    module: 'commit-analyzer',
    codingConsistency: toNumber(data.codingConsistency, fallback.codingConsistency),
    longestCodingStreak: toNumber(data.longestCodingStreak, fallback.longestCodingStreak)
  };
};

exports.analyzePullRequests = async (pulls, userId = null, options = {}) => {
  const fallback = {
    totalPRs: pulls.length,
    mergedPRs: pulls.filter(p => p.state === 'closed' || p.mergedDate).length,
    openPRs: pulls.filter(p => p.state === 'open').length,
    reviewParticipation: 'Good peer cooperation and code quality checkpoints',
    mergeSuccessRate: 85,
    collaborationScore: 80
  };
  options.featureName = 'pull-request-analyzer';
  const data = await callGemini(prompts.pullRequestAnalysisPrompt, { pulls }, fallback, userId, options);
  return {
    ...data,
    module: 'pull-request-analyzer',
    totalPRs: toNumber(data.totalPRs, fallback.totalPRs),
    mergedPRs: toNumber(data.mergedPRs, fallback.mergedPRs),
    openPRs: toNumber(data.openPRs, fallback.openPRs),
    mergeSuccessRate: toNumber(data.mergeSuccessRate, fallback.mergeSuccessRate),
    collaborationScore: toNumber(data.collaborationScore, fallback.collaborationScore)
  };
};

exports.analyzeIssues = async (issues, userId = null, options = {}) => {
  const fallback = {
    openedIssues: issues.filter(i => i.state === 'open').length,
    closedIssues: issues.filter(i => i.state === 'closed').length,
    bugFixes: issues.filter(i => i.title.toLowerCase().includes('bug') || i.title.toLowerCase().includes('fix')).length,
    featureRequests: issues.filter(i => i.title.toLowerCase().includes('feat') || i.title.toLowerCase().includes('request')).length,
    maintenanceActivity: 'Regular maintenance and debugging operations'
  };
  options.featureName = 'issue-analyzer';
  const data = await callGemini(prompts.issueAnalysisPrompt, { issues }, fallback, userId, options);
  return {
    ...data,
    module: 'issue-analyzer',
    openedIssues: toNumber(data.openedIssues, fallback.openedIssues),
    closedIssues: toNumber(data.closedIssues, fallback.closedIssues),
    bugFixes: toNumber(data.bugFixes, fallback.bugFixes),
    featureRequests: toNumber(data.featureRequests, fallback.featureRequests)
  };
};

exports.generateResumeFromGitHub = async (repos, languages, userId = null, options = {}) => {
  const fallback = {
    projects: (repos || []).slice(0, 3).map(r => ({
      title: r.name,
      description: r.description || 'Full stack repository project.',
      technologiesUsed: [r.language].filter(Boolean),
      keyContributions: 'Designed core features, constructed clean code architectures, and integrated components.',
      achievements: 'Optimized operation speeds and introduced structural modular design patterns.',
      bulletPoints: [
        'Developed full stack architecture matching modern best practices.',
        'Structured modular libraries utilizing clean dependencies.'
      ],
      atsKeywords: [r.language || 'JavaScript', 'Git', 'Software Development']
    }))
  };
  options.featureName = 'resume-generator';
  const data = await callGemini(prompts.resumeGenerationPrompt, { repos, languages }, fallback, userId, options);
  return {
    ...data,
    module: 'resume-generator'
  };
};

exports.detectSkills = async (repos, languages, userId = null, options = {}) => {
  const fallback = {
    languages: (languages || []).map(l => l.name),
    frameworks: [],
    libraries: [],
    databases: ['MongoDB', 'PostgreSQL'],
    cloud: ['AWS', 'GitHub Actions'],
    devops: ['Docker', 'CI/CD'],
    testing: ['Jest'],
    tools: ['Git', 'VS Code'],
    packageManagers: ['npm']
  };
  options.featureName = 'skill-detection';
  const data = await callGemini(prompts.skillDetectionPrompt, { repos, languages }, fallback, userId, options);
  return {
    ...data,
    module: 'skill-detection'
  };
};

exports.companyMatching = async (profile, jobSkills, job, userId = null, options = {}) => {
  const fallback = {
    matchScore: 82,
    matchesSkills: (profile.languages || []).map(l => l.name).filter(n => (jobSkills || []).includes(n)),
    missingSkills: (jobSkills || []).filter(s => !(profile.languages || []).map(l => l.name).includes(s)),
    matchesFrameworks: [],
    contributionScore: profile.contributionScore || 75,
    reasoning: 'Strong matches found across languages and primary developer practices.'
  };
  options.featureName = `company-matching:${job?._id || 'job'}`;
  const data = await callGemini(prompts.companyMatchingPrompt, { profile, jobSkills, job }, fallback, userId, options);
  return {
    ...data,
    module: 'company-matching',
    matchScore: toNumber(data.matchScore, fallback.matchScore),
    contributionScore: toNumber(data.contributionScore, fallback.contributionScore)
  };
};

exports.handleProjectChat = async (repoName, question, textContext, userId = null, options = {}) => {
  const PromptBuilder = require('./PromptBuilder');
  const prompt = PromptBuilder.buildProjectChatPrompt(repoName, question, textContext);
  const fallback = { response: "Placeholder explanation: This project uses a full-stack Node/React structure with local configurations." };
  options.featureName = 'repository-chat';
  options.payload = { repoName, question };
  return await callGemini(() => prompt, {}, fallback, userId, options);
};

exports.handleProjectIntelligence = async (repoName, textContext, userId = null, options = {}) => {
  const PromptBuilder = require('./PromptBuilder');
  const prompt = PromptBuilder.buildProjectIntelligencePrompt(repoName, textContext);
  const fallback = {
    projectOverview: "An advanced Full-Stack Talent Management platform utilizing Node.js and MongoDB.",
    architectureSummary: "A Model-View-Controller (MVC) server-side layout built with Express.",
    folderExplanation: "Root contains the backend server files; client contains dashboard UI assets.",
    techStack: ["Node.js", "Express.js", "React.js", "MongoDB"],
    databaseFlow: "Profiles are cached and saved inside the MongoDB database schema.",
    authFlow: "Uses JSON Web Token (JWT) verification inside Express middleware.",
    apiFlow: "REST APIs are available under /api/auth, /api/github, and /api/ai endpoints.",
    dependencies: ["express", "mongoose", "jsonwebtoken"],
    codeComplexity: 78,
    contributionSummary: "Consistent developer commit patterns.",
    timeline: "Development timeline details.",
    commitSummary: "Initial schema creation and auth configuration.",
    importantFiles: ["server.js", "controllers/authController.js"],
    unusedFiles: ["temp-script.js"],
    deadCode: "No major dead code detected.",
    securityWarnings: ["Hardcoded secrets in defaults"],
    projectScore: 84,
    portfolioScore: 82,
    technicalScore: 86,
    interviewDifficulty: "Medium",
    atsScore: 85
  };
  options.featureName = 'project-intelligence';
  options.payload = { repoName };
  return await callGemini(() => prompt, {}, fallback, userId, options);
};

exports.handleProjectVisualizations = async (repoName, textContext, userId = null, options = {}) => {
  const PromptBuilder = require('./PromptBuilder');
  const prompt = PromptBuilder.buildProjectVisualizationsPrompt(repoName, textContext);
  const fallback = {
    dependencyGraph: `graph TD\n  App[app.js] --> Express[express]`,
    architectureDiagram: `graph LR\n  Client[Client] <--> Server[Express]`,
    databaseDiagram: `erDiagram\n  User ||--o{ Resume : uploads`,
    apiFlowDiagram: `graph TD\n  Request --> AuthCheck`,
    mindMap: `graph TD\n  Root[Project Stack] --> Backend`
  };
  options.featureName = 'project-viz';
  options.payload = { repoName };
  return await callGemini(() => prompt, {}, fallback, userId, options);
};

const buildAiCacheKey = (userId, featureName) => `${userId}:${featureName}`;

const shouldUseAiCache = (state, cooldownMs = 30000) => {
  if (state && state.lastRequestedAt) {
    const msSinceLast = Date.now() - new Date(state.lastRequestedAt).getTime();
    if (msSinceLast < cooldownMs) {
      return { shouldUseCache: true, reason: 'cooldown' };
    }
  }
  return { shouldUseCache: false };
};

const getCooldownMessage = () => 'AI is temporarily busy. Please wait a few seconds and try again.';

exports.synthesizeResume = async (contextStr, userId = null, options = {}) => {
  const fallback = {
    name: 'Synthesized Candidate',
    email: 'synthesized@example.com',
    phone: '',
    location: '',
    summary: 'Synthesized resume summary.',
    skills: [],
    experience: [],
    education: [],
    certifications: []
  };
  options.featureName = 'resume-generator';
  const prompt = `Return a JSON object matching this schema exactly:\n` +
    `{\n` +
    `  "name": "string",\n` +
    `  "email": "string",\n` +
    `  "phone": "string",\n` +
    `  "location": "string",\n` +
    `  "summary": "string",\n` +
    `  "skills": ["string"],\n` +
    `  "experience": [{"company": "string", "role": "string", "startDate": "string", "endDate": "string", "description": "string"}],\n` +
    `  "education": [{"institution": "string", "degree": "string", "year": "string"}],\n` +
    `  "certifications": ["string"]\n` +
    `}\n\n` +
    `Synthesize a clean and modern professional resume from the following candidate information:\n\n` +
    `${contextStr}`;

  const data = await callGemini(prompt, {}, fallback, userId, options);
  return data;
};

exports.advancedSimulate = async (resumeText, companyInfo = null, userId = null, options = {}) => {
  const fallback = {
    overallScore: 78,
    hiringProbability: 60,
    atsCompatibilityScore: 70,
    technicalStrength: 75,
    communicationScore: 80,
    leadershipScore: 65,
    projectQuality: 70,
    experienceQuality: 72,
    educationStrength: 85,
    skillCoverage: 75,
    confidenceScore: 90,
    overallRating: 'Good',
    strengths: ['Solid technical foundations', 'Clear experience timelines'],
    weaknesses: ['Missing clear social/GitHub profile links in header', 'Impact statistics can be quantified further'],
    missingSkills: ['System Design', 'Cloud Architecture'],
    missingKeywords: ['Microservices', 'Kubernetes'],
    recruiterConcerns: ['Short tenure at recent roles'],
    positiveHighlights: ['Graduated from well regarded institution'],
    atsProblems: ['Two column layout may cause text parser warnings'],
    formattingIssues: ['Ensure email and phone icons are uniformly aligned'],
    careerGrowthSuggestions: ['Focus on cloud deployment projects and scalability certifications'],
    priorityImprovements: ['Add impact metrics to CloudTech experience description'],
    companyMatch: companyInfo ? {
      overallMatchScore: 75,
      interviewProbability: 65,
      resumeMatchPercentage: 78,
      atsMatch: 72,
      skillMatch: 75,
      experienceMatch: 70,
      projectMatch: 80,
      leadershipMatch: 60,
      educationMatch: 85,
      cultureFitEstimate: 75,
      recruiterFeedback: {
        positiveObservations: ['Strong React and NodeJS fundamentals matches our tech stack'],
        reasonsForRejection: ['Lack of deep systems architecture tenure'],
        reasonsForShortlisting: ['Strong GitHub profile matches and clear code quality'],
        concerns: ['Candidate might require onboarding guidance for backend scalability'],
        strongestSection: 'Projects',
        weakestSection: 'Experience Descriptions',
        topImprovements: ['Explain contributions to AWS EKS migrations in detail'],
        expectedInterviewQuestions: ['Explain how you migrated CloudTech monolith to microservices'],
        skillsToImprove: ['System design patterns', 'Kubernetes networking'],
        recommendedCertifications: ['AWS Solutions Architect Associate'],
        projectsToAdd: ['Construct a high scalability distributed rate limiter project'],
        expectedSalaryRange: '$120,000 - $145,000 USD',
        careerReadiness: 'Ready for Mid-level systems integration engineering paths',
        learningResources: ['Educative: Scalability and System Design', 'AWS Skill Builder']
      }
    } : null
  };

  options.featureName = 'recruitment-simulation';
  const prompt = `Return a JSON object matching this schema exactly:\n` +
    `{\n` +
    `  "overallScore": number,\n` +
    `  "hiringProbability": number,\n` +
    `  "atsCompatibilityScore": number,\n` +
    `  "technicalStrength": number,\n` +
    `  "communicationScore": number,\n` +
    `  "leadershipScore": number,\n` +
    `  "projectQuality": number,\n` +
    `  "experienceQuality": number,\n` +
    `  "educationStrength": number,\n` +
    `  "skillCoverage": number,\n` +
    `  "confidenceScore": number,\n` +
    `  "overallRating": "Excellent" | "Good" | "Average" | "Needs Improvement",\n` +
    `  "strengths": ["string"],\n` +
    `  "weaknesses": ["string"],\n` +
    `  "missingSkills": ["string"],\n` +
    `  "missingKeywords": ["string"],\n` +
    `  "recruiterConcerns": ["string"],\n` +
    `  "positiveHighlights": ["string"],\n` +
    `  "atsProblems": ["string"],\n` +
    `  "formattingIssues": ["string"],\n` +
    `  "careerGrowthSuggestions": ["string"],\n` +
    `  "priorityImprovements": ["string"],\n` +
    `  "companyMatch": {\n` +
    `    "overallMatchScore": number,\n` +
    `    "interviewProbability": number,\n` +
    `    "resumeMatchPercentage": number,\n` +
    `    "atsMatch": number,\n` +
    `    "skillMatch": number,\n` +
    `    "experienceMatch": number,\n` +
    `    "projectMatch": number,\n` +
    `    "leadershipMatch": number,\n` +
    `    "educationMatch": number,\n` +
    `    "cultureFitEstimate": number,\n` +
    `    "recruiterFeedback": {\n` +
    `      "positiveObservations": ["string"],\n` +
    `      "reasonsForRejection": ["string"],\n` +
    `      "reasonsForShortlisting": ["string"],\n` +
    `      "concerns": ["string"],\n` +
    `      "strongestSection": "string",\n` +
    `      "weakestSection": "string",\n` +
    `      "topImprovements": ["string"],\n` +
    `      "expectedInterviewQuestions": ["string"],\n` +
    `      "skillsToImprove": ["string"],\n` +
    `      "recommendedCertifications": ["string"],\n` +
    `      "projectsToAdd": ["string"],\n` +
    `      "expectedSalaryRange": "string",\n` +
    `      "careerReadiness": "string",\n` +
    `      "learningResources": ["string"]\n` +
    `    }\n  }\n` +
    `}\n\n` +
    `Perform a rigorous simulated recruitment evaluation of the following candidate resume:\n\n` +
    `Candidate Resume:\n${resumeText}\n\n` +
    (companyInfo ? `Target Company/Role Context Details:\n${JSON.stringify(companyInfo)}\n\n` +
     `Important Requirement: Evaluate this candidate's compatibility for this company & role against typical public standards, tech expectations, common recruitment profiles, and guidelines. (Do not claim inside knowledge: verify that you are evaluating based on industry benchmarks and publicly understood engineering hiring expectations for this firm.)` : `Perform a general baseline talent screening simulation matching industry best practices.`);

  const data = await callGemini(prompt, {}, fallback, userId, options);
  return data;
};

module.exports = {
  ...module.exports,
  buildAiCacheKey,
  shouldUseAiCache,
  getCooldownMessage
};

