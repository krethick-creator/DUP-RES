const { generateStructuredContent } = require('./geminiClient');
const prompts = require('./aiPrompts');

const MODEL = 'gemini-2.5-flash';

// Every AI capability uses the same Gemini client and a dedicated prompt so the experience stays modular.
const callGemini = async (promptFactory, payload, fallback) => {
  try {
    if (process.env.AI_ENABLED !== "true") {
    return {
        success: false,
        message: "AI is temporarily disabled."
    };
}
    const prompt = typeof promptFactory === 'function' ? promptFactory(payload) : promptFactory;
    const result = await generateStructuredContent(prompt, { model: MODEL, temperature: 0.2, maxOutputTokens: 1200 });
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return { ...fallback, ...result, configured: true, source: 'gemini' };
    }
    return { ...fallback, configured: true, source: 'gemini' };
  } catch (error) {
    console.error('[aiService] Gemini error:', error.message);
    return { ...fallback, configured: false, source: 'fallback', error: error.message };
  }
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

exports.screenResume = async (resume, job) => {
  const fallback = {
    matchScore: 70,
    recommendation: 'review',
    strengths: ['Strong technical background'],
    weaknesses: ['Needs clearer impact metrics'],
    missingSkills: [],
    explanation: 'Fallback analysis generated because Gemini was unavailable.',
    confidence: 0.5
  };

  const data = await callGemini(prompts.resumeScreeningPrompt, { resume, job }, fallback);
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

exports.parseResume = async (filepath) => {
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

  const data = await callGemini(prompts.parseResumePrompt, filepath, fallback);
  return {
    ...data,
    module: 'resume-parsing',
    parsed: data.parsed || fallback.parsed,
    score: Math.max(0, Math.min(100, toNumber(data.score, fallback.score))),
    atsScore: Math.max(0, Math.min(100, toNumber(data.atsScore, fallback.atsScore))),
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.matchSkills = async (candidateSkills, jobSkills) => {
  const fallback = {
    matchPercentage: 70,
    matchedSkills: [],
    missingSkills: jobSkills || [],
    transferableSkills: [],
    rationale: 'Fallback skill matching output.'
  };

  const data = await callGemini(prompts.skillMatchingPrompt, { candidateSkills, jobSkills }, fallback);
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

exports.rankCandidates = async (candidates) => {
  const fallback = {
    candidates: (candidates || []).map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      score: 75,
      tier: index < 3 ? 'top' : 'good',
      rationale: 'Fallback ranking output.'
    }))
  };

  const data = await callGemini(prompts.rankingPrompt, candidates, fallback);
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

exports.explainScore = async (score, context) => {
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

  const data = await callGemini(prompts.explainScorePrompt, { score, context }, fallback);
  return {
    ...data,
    module: 'explainable-scoring',
    factors: Array.isArray(data.factors) ? data.factors : fallback.factors,
    summary: data.summary || fallback.summary,
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.generateDynamicResume = async (resume, job) => {
  const fallback = {
    tailoredSummary: `Experienced developer optimized for ${job?.title || 'target role'}`,
    highlightedSkills: resume?.parsed?.skills?.slice(0, 5) || [],
    suggestedChanges: ['Emphasize leadership and measurable impact'],
    summary: 'Fallback dynamic resume tailoring output.'
  };

  const data = await callGemini(prompts.dynamicResumePrompt, { resume, job }, fallback);
  return {
    ...data,
    module: 'dynamic-resume',
    tailoredSummary: data.tailoredSummary || fallback.tailoredSummary,
    highlightedSkills: Array.isArray(data.highlightedSkills) ? data.highlightedSkills : fallback.highlightedSkills,
    suggestedChanges: Array.isArray(data.suggestedChanges) ? data.suggestedChanges : fallback.suggestedChanges,
    summary: data.summary || fallback.summary
  };
};

exports.simulateResume = async (resume, scenarios) => {
  const fallback = {
    scenarios: (scenarios || ['FAANG', 'Startup', 'Enterprise']).map((scenario) => ({
      scenario,
      acceptanceRate: 65,
      feedback: `Fallback simulation for ${scenario}`,
      confidence: 0.5
    }))
  };

  const data = await callGemini(prompts.resumeSimulationPrompt, { resume, scenarios }, fallback);
  return {
    ...data,
    module: 'resume-simulation',
    scenarios: Array.isArray(data.scenarios) ? data.scenarios : fallback.scenarios
  };
};

exports.checkAuthenticity = async (resume) => {
  const fallback = {
    authenticityScore: 86,
    flags: [],
    verification: { employment: 'verified', education: 'verified', skills: 'likely-accurate' },
    summary: 'Fallback authenticity check output.'
  };

  const data = await callGemini(prompts.authenticityPrompt, { resume }, fallback);
  return {
    ...data,
    module: 'authenticity-checker',
    authenticityScore: Math.max(0, Math.min(100, toNumber(data.authenticityScore, fallback.authenticityScore))),
    flags: Array.isArray(data.flags) ? data.flags : fallback.flags,
    verification: data.verification || fallback.verification,
    summary: data.summary || fallback.summary
  };
};

exports.generateTimeline = async (resume) => {
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

  const data = await callGemini(prompts.timelinePrompt, { resume }, fallback);
  return {
    ...data,
    module: 'resume-timeline',
    timeline: Array.isArray(data.timeline) ? data.timeline : fallback.timeline,
    summary: data.summary || fallback.summary
  };
};

exports.generateImprovementReport = async (resume) => {
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

  const data = await callGemini(prompts.improvementReportPrompt, { resume }, fallback);
  return {
    ...data,
    module: 'improvement-report',
    overallGrade: data.overallGrade || fallback.overallGrade,
    improvements: Array.isArray(data.improvements) ? data.improvements : fallback.improvements,
    estimatedScoreIncrease: Number(data.estimatedScoreIncrease || fallback.estimatedScoreIncrease),
    summary: data.summary || fallback.summary
  };
};

exports.analyzeGitHub = async (username) => {
  const fallback = {
    username,
    repos: [],
    portfolioScore: 70,
    totalCommits: 0,
    totalPRs: 0,
    languages: [],
    contributionAnalysis: { consistency: 70, impact: 70, collaboration: 70 }
  };

  const data = await callGemini(prompts.githubAnalysisPrompt, { username }, fallback);
  return {
    ...data,
    module: 'github-analysis',
    username,
    repos: Array.isArray(data.repos) ? data.repos : fallback.repos,
    portfolioScore: Math.max(0, Math.min(100, toNumber(data.portfolioScore, fallback.portfolioScore))),
    totalCommits: Number(data.totalCommits || fallback.totalCommits),
    totalPRs: Number(data.totalPRs || fallback.totalPRs),
    languages: Array.isArray(data.languages) ? data.languages : fallback.languages,
    contributionAnalysis: data.contributionAnalysis || fallback.contributionAnalysis
  };
};

exports.projectKnowledge = async (projectName, question) => {
  const fallback = {
    answer: `Based on analysis of ${projectName}: the project is architecturally sound and well organized.`,
    summary: 'Fallback project knowledge output.',
    keyPoints: [],
    confidence: 0.5
  };

  const data = await callGemini(prompts.projectKnowledgePrompt, { projectName, question }, fallback);
  return {
    ...data,
    module: 'project-knowledge',
    answer: data.answer || fallback.answer,
    summary: data.summary || fallback.summary,
    keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : fallback.keyPoints,
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.analyzeSkillTransfer = async (skills) => {
  const fallback = {
    transfers: (skills || []).map((skill) => ({
      skill,
      transferableTo: ['Adjacent Domain'],
      transferability: 70
    })),
    summary: 'Fallback skill transfer analysis.'
  };

  const data = await callGemini(prompts.skillTransferPrompt, { skills }, fallback);
  return {
    ...data,
    module: 'skill-transfer',
    transfers: Array.isArray(data.transfers) ? data.transfers : fallback.transfers,
    summary: data.summary || fallback.summary
  };
};

exports.generateCodingAssessment = async (language, difficulty) => {
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

  const data = await callGemini(prompts.codingAssessmentPrompt, { language, difficulty }, fallback);
  return {
    ...data,
    module: 'coding-assessment',
    title: data.title || fallback.title,
    problems: Array.isArray(data.problems) ? data.problems : fallback.problems,
    timeLimit: Number(data.timeLimit || fallback.timeLimit),
    summary: data.summary || fallback.summary
  };
};

exports.reviewCode = async (code, language) => {
  const fallback = {
    score: 75,
    issues: [
      { line: 1, severity: 'info', message: 'Review unavailable; fallback output used.' }
    ],
    suggestions: ['Add unit tests', 'Improve error handling'],
    securityIssues: [],
    summary: 'Fallback code review output.'
  };

  const data = await callGemini(prompts.codeReviewPrompt, { code, language }, fallback);
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

exports.generateInterviewQuestions = async (role, skills, count = 10) => {
  const fallback = {
    questions: Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      question: `${role || 'Engineer'} question ${index + 1}`,
      type: 'technical',
      difficulty: index < 3 ? 'easy' : index < 7 ? 'medium' : 'hard'
    })),
    summary: 'Fallback interview question output.'
  };

  const data = await callGemini(prompts.interviewQuestionsPrompt, { role, skills, count }, fallback);
  return {
    ...data,
    module: 'interview-questions',
    questions: Array.isArray(data.questions) ? data.questions : fallback.questions,
    summary: data.summary || fallback.summary
  };
};

exports.inferSoftSkills = async (profile) => {
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

  const data = await callGemini(prompts.softSkillsPrompt, { profile }, fallback);
  return {
    ...data,
    module: 'soft-skill-inference',
    skills: data.skills || fallback.skills,
    summary: data.summary || fallback.summary,
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.candidateSummary = async (profile) => {
  const fallback = {
    summary: 'Candidate summary unavailable.',
    highlights: [],
    strengths: [],
    risks: [],
    nextSteps: []
  };

  const data = await callGemini(prompts.candidateSummaryPrompt, { profile }, fallback);
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

exports.recruiterSummary = async (profile, job) => {
  const fallback = {
    summary: 'Recruiter summary unavailable.',
    interviewFocus: [],
    decisionNotes: [],
    suggestedQuestions: []
  };

  const data = await callGemini(prompts.recruiterSummaryPrompt, { profile, job }, fallback);
  return {
    ...data,
    module: 'recruiter-summary',
    summary: data.summary || fallback.summary,
    interviewFocus: toArray(data.interviewFocus, fallback.interviewFocus),
    decisionNotes: toArray(data.decisionNotes, fallback.decisionNotes),
    suggestedQuestions: toArray(data.suggestedQuestions, fallback.suggestedQuestions)
  };
};

exports.personalizedFeedback = async (profile, targetRole) => {
  const fallback = {
    feedback: 'Personalized feedback could not be generated.',
    priorities: [],
    actions: [],
    expectedImpact: 'Moderate improvement potential.'
  };

  const data = await callGemini(prompts.personalizedFeedbackPrompt, { profile, targetRole }, fallback);
  return {
    ...data,
    module: 'personalized-feedback',
    feedback: data.feedback || fallback.feedback,
    priorities: toArray(data.priorities, fallback.priorities),
    actions: toArray(data.actions, fallback.actions),
    expectedImpact: data.expectedImpact || fallback.expectedImpact
  };
};

exports.explainableRanking = async (candidates) => {
  const fallback = {
    candidates: (candidates || []).map((candidate, index) => ({
      ...candidate,
      score: 75,
      tier: index < 2 ? 'top' : 'good',
      rationale: 'Fallback ranking rationale.'
    })),
    summary: 'Explainable ranking unavailable.'
  };

  const data = await callGemini(prompts.explainableRankingPrompt, { candidates }, fallback);
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

exports.projectQualityAnalysis = async (project) => {
  const fallback = {
    qualityScore: 75,
    strengths: [],
    risks: [],
    recommendations: [],
    summary: 'Project quality analysis unavailable.'
  };

  const data = await callGemini(prompts.projectQualityPrompt, { project }, fallback);
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

exports.skillGapAnalysis = async (candidateSkills, targetSkills) => {
  const fallback = {
    gapScore: 40,
    missingSkills: [],
    recommendedLearning: [],
    summary: 'Skill gap analysis unavailable.'
  };

  const data = await callGemini(prompts.skillGapPrompt, { candidateSkills, targetSkills }, fallback);
  return {
    ...data,
    module: 'skill-gap-analysis',
    gapScore: Math.max(0, Math.min(100, toNumber(data.gapScore, fallback.gapScore))),
    missingSkills: toArray(data.missingSkills, fallback.missingSkills),
    recommendedLearning: toArray(data.recommendedLearning, fallback.recommendedLearning),
    summary: data.summary || fallback.summary
  };
};

exports.generateCareerRoadmap = async (profile) => {
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

  const data = await callGemini(prompts.careerRoadmapPrompt, { profile }, fallback);
  return {
    ...data,
    module: 'career-roadmap',
    nodes: Array.isArray(data.nodes) ? data.nodes : fallback.nodes,
    connections: Array.isArray(data.connections) ? data.connections : fallback.connections,
    progress: Math.max(0, Math.min(100, toNumber(data.progress, fallback.progress))),
    summary: data.summary || fallback.summary
  };
};

exports.analyzeRoadmap = async (roadmap) => {
  const fallback = {
    analysis: 'Fallback roadmap analysis output.',
    bottlenecks: ['Cloud certification pending'],
    recommendations: ['Focus on system design skills'],
    confidence: 0.5
  };

  const data = await callGemini(prompts.roadmapAnalysisPrompt, { roadmap }, fallback);
  return {
    ...data,
    module: 'roadmap-analyzer',
    analysis: data.analysis || fallback.analysis,
    bottlenecks: Array.isArray(data.bottlenecks) ? data.bottlenecks : fallback.bottlenecks,
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : fallback.recommendations,
    confidence: toNumber(data.confidence, fallback.confidence)
  };
};

exports.planCompanyGoals = async (company, goals) => {
  const fallback = {
    plan: (goals || []).map((goal) => ({ goal, timeline: '6 months', milestones: 4, feasibility: 'high' })),
    summary: 'Fallback company goal planning output.'
  };

  const data = await callGemini(prompts.companyGoalsPrompt, { company, goals }, fallback);
  return {
    ...data,
    module: 'company-goal-planner',
    plan: Array.isArray(data.plan) ? data.plan : fallback.plan,
    summary: data.summary || fallback.summary
  };
};

exports.getLeaderboard = async () => {
  const fallback = {
    leaderboard: [
      { rank: 1, name: 'Alex Chen', score: 94, growth: '+12%' },
      { rank: 2, name: 'Sarah Kim', score: 91, growth: '+8%' },
      { rank: 3, name: 'Mike Johnson', score: 88, growth: '+15%' },
      { rank: 4, name: 'You', score: 84, growth: '+10%' },
      { rank: 5, name: 'Emma Wilson', score: 82, growth: '+6%' }
    ]
  };

  const data = await callGemini(prompts.leaderboardPrompt, null, fallback);
  return {
    ...data,
    module: 'career-leaderboard',
    leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : fallback.leaderboard
  };
};

exports.benchmarkComparison = async (profile) => {
  const fallback = {
    benchmarks: {
      skills: { you: 78, average: 65, top10: 92 },
      experience: { you: 5, average: 4, top10: 8 },
      projects: { you: 12, average: 6, top10: 20 },
      certifications: { you: 2, average: 1, top10: 5 }
    },
    summary: 'Fallback benchmark comparison output.'
  };

  const data = await callGemini(prompts.benchmarkPrompt, { profile }, fallback);
  return {
    ...data,
    module: 'benchmark-comparison',
    benchmarks: data.benchmarks || fallback.benchmarks,
    summary: data.summary || fallback.summary
  };
};

exports.generateLearningRoadmap = async (skills) => {
  const fallback = {
    modules: (skills || []).map((skill, index) => ({
      skill,
      courses: [`${skill} Fundamentals`, `Advanced ${skill}`],
      estimatedWeeks: 4 + index * 2,
      priority: index < 2 ? 'high' : 'medium'
    })),
    summary: 'Fallback learning roadmap output.'
  };

  const data = await callGemini(prompts.learningRoadmapPrompt, { skills }, fallback);
  return {
    ...data,
    module: 'learning-roadmap',
    modules: Array.isArray(data.modules) ? data.modules : fallback.modules,
    summary: data.summary || fallback.summary
  };
};

exports.predictCareerGrowth = async (profile) => {
  const fallback = {
    predictions: [
      { year: 1, role: 'Senior Developer', probability: 0.85, salary: '$120K-$150K' },
      { year: 3, role: 'Tech Lead', probability: 0.65, salary: '$150K-$180K' },
      { year: 5, role: 'Engineering Manager', probability: 0.4, salary: '$180K-$220K' }
    ],
    summary: 'Fallback career growth prediction output.'
  };

  const data = await callGemini(prompts.careerGrowthPrompt, { profile }, fallback);
  return {
    ...data,
    module: 'career-growth-predictor',
    predictions: Array.isArray(data.predictions) ? data.predictions : fallback.predictions,
    summary: data.summary || fallback.summary
  };
};

exports.calculateLearningScore = async (profile) => {
  const fallback = {
    score: 78,
    streak: 14,
    weeklyHours: 8,
    certificationsInProgress: 2,
    summary: 'Fallback learning score output.'
  };

  const data = await callGemini(prompts.learningScorePrompt, { profile }, fallback);
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

exports.recruiterAssistant = async (query, context) => {
  const fallback = {
    response: `I recommend focusing on candidates with strong technical backgrounds.`,
    suggestions: ['Schedule interviews for top candidates', 'Update the role requirements'],
    summary: 'Fallback recruiter assistant output.'
  };

  const data = await callGemini(prompts.recruiterAssistantPrompt, { query, context }, fallback);
  return {
    ...data,
    module: 'recruiter-assistant',
    response: data.response || fallback.response,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : fallback.suggestions,
    summary: data.summary || fallback.summary
  };
};

exports.recommendJobs = async (profile) => {
  const fallback = {
    recommendations: [
      { title: 'Senior Full Stack Engineer', company: 'TechVision', match: 92, rationale: 'Strong fit' },
      { title: 'Lead Developer', company: 'CloudScale', match: 87, rationale: 'Strong architecture fit' },
      { title: 'Software Architect', company: 'DataFlow', match: 81, rationale: 'Leadership alignment' }
    ],
    summary: 'Fallback job recommendation output.'
  };

  const data = await callGemini(prompts.jobRecommendationPrompt, { profile }, fallback);
  return {
    ...data,
    module: 'job-recommendation',
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : fallback.recommendations,
    summary: data.summary || fallback.summary
  };
};

exports.reverseMatch = async (job) => {
  const fallback = {
    candidates: [
      { name: 'Candidate A', match: 94, availability: 'immediate' },
      { name: 'Candidate B', match: 89, availability: '2 weeks' },
      { name: 'Candidate C', match: 85, availability: '1 month' }
    ],
    summary: 'Fallback reverse matching output.'
  };

  const data = await callGemini(prompts.reverseMatchPrompt, { job }, fallback);
  return {
    ...data,
    module: 'reverse-matching',
    candidates: Array.isArray(data.candidates) ? data.candidates : fallback.candidates,
    summary: data.summary || fallback.summary
  };
};

exports.collectResumes = async (sources) => {
  const fallback = {
    collected: Array.isArray(sources) ? sources.length : 0,
    processed: 0,
    status: 'ready',
    summary: 'Fallback resume collection output.'
  };

  const data = await callGemini(prompts.resumeCollectionPrompt, { sources }, fallback);
  return {
    ...data,
    module: 'auto-resume-collection',
    collected: Number(data.collected || fallback.collected),
    processed: Number(data.processed || fallback.processed),
    status: data.status || fallback.status,
    summary: data.summary || fallback.summary
  };
};

exports.hiringAnalytics = async (companyId) => {
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

  const data = await callGemini(prompts.hiringAnalyticsPrompt, { companyId }, fallback);
  return {
    ...data,
    module: 'hiring-analytics',
    metrics: data.metrics || fallback.metrics,
    funnel: Array.isArray(data.funnel) ? data.funnel : fallback.funnel,
    summary: data.summary || fallback.summary
  };
};

exports.suggestInterviewSlots = async (participants) => {
  const fallback = {
    slots: [
      { date: '2026-07-10', times: ['09:00', '11:00', '14:00'] },
      { date: '2026-07-11', times: ['10:00', '13:00'] }
    ],
    recommended: '09:00',
    summary: 'Fallback interview scheduling output.'
  };

  const data = await callGemini(prompts.interviewSlotsPrompt, { participants }, fallback);
  return {
    ...data,
    module: 'interview-scheduling',
    slots: Array.isArray(data.slots) ? data.slots : fallback.slots,
    recommended: data.recommended || fallback.recommended,
    summary: data.summary || fallback.summary
  };
};

exports.trackApplication = async (application) => {
  const fallback = {
    status: application?.status || 'applied',
    nextSteps: ['Awaiting recruiter review'],
    estimatedDecision: '3-5 business days',
    summary: 'Fallback application tracking output.'
  };

  const data = await callGemini(prompts.applicationTrackingPrompt, { application }, fallback);
  return {
    ...data,
    module: 'application-tracking',
    status: data.status || fallback.status,
    nextSteps: Array.isArray(data.nextSteps) ? data.nextSteps : fallback.nextSteps,
    estimatedDecision: data.estimatedDecision || fallback.estimatedDecision,
    summary: data.summary || fallback.summary
  };
};

exports.generateJob = async (prompt) => {
  const fallback = {
    job: {
      title: 'Senior Full Stack Engineer',
      description: `We are looking for a talented engineer. ${prompt || ''}`,
      requirements: ['5+ years experience', 'React & Node.js', 'System design skills'],
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS']
    },
    summary: 'Fallback AI job creation output.'
  };

  const data = await callGemini(prompts.jobCreationPrompt, { prompt }, fallback);
  return {
    ...data,
    module: 'ai-job-creation',
    job: data.job || fallback.job,
    summary: data.summary || fallback.summary
  };
};

exports.candidateAI = async (action, context) => {
  const fallback = {
    response: 'AI assistant ready to help you improve your candidacy.',
    suggestions: ['Review your resume', 'Practice interview scenarios'],
    summary: 'Fallback candidate AI output.'
  };

  const data = await callGemini(prompts.candidateAssistantPrompt, { action, context }, fallback);
  return {
    ...data,
    module: 'candidate-ai',
    response: data.response || fallback.response,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : fallback.suggestions,
    summary: data.summary || fallback.summary
  };
};
