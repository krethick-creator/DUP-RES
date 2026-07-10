const JSON_ONLY = 'Return valid JSON only. Do not wrap the answer in markdown code fences.';

const baseInstruction = (task, extra = '') => `${task}\n\n${JSON_ONLY}\n\n${extra}`.trim();

module.exports = {
    resumeScreeningPrompt: ({ resume, job }) => baseInstruction(
        'Evaluate how well the resume matches the job description.',
        `Return JSON: matchScore (0-100), recommendation (shortlist, review, or reject), strengths (array), weaknesses (array), missingSkills (array), explanation (string), confidence (0-1).\nResume:${JSON.stringify(resume || {})}\nJob:${JSON.stringify(job || {})}`
    ),

    parseResumePrompt: (filepath) => baseInstruction(
        'Extract structured candidate info from resume file path and filename context.',
        `Return JSON: parsed { name, email, phone, summary, skills (array), experience (array of company, role, startDate, endDate, description), education (array), certifications (array) }, score (0-100), atsScore (0-100), confidence (0-1), rawAnalysis (string).\nFile path:${filepath || 'unknown'}`
    ),

    skillMatchingPrompt: ({ candidateSkills, jobSkills }) => baseInstruction(
        'Compare candidate skills to job requirements and identify alignment.',
        `Return JSON: matchPercentage (0-100), matchedSkills (array), missingSkills (array), transferableSkills (array), rationale (string).\nCandidate skills:${JSON.stringify(candidateSkills || [])}\nJob skills:${JSON.stringify(jobSkills || [])}`
    ),

    rankingPrompt: (candidates) => baseInstruction(
        'Rank candidates based on alignment, skills, and experience.',
        `Return JSON: candidates (array of id, name, score (0-100), tier (top, good, average), rationale (string)).\nCandidates:${JSON.stringify(candidates || [])}`
    ),

    explainScorePrompt: ({ score, context }) => baseInstruction(
        'Explain a candidate score with a transparent breakdown.',
        `Return JSON: factors (array of factor, weight, score), summary (string), confidence (0-1).\nScore:${score}\nContext:${JSON.stringify(context || {})}`
    ),

    dynamicResumePrompt: ({ resume, job, repos }) => baseInstruction(
        'Tailor candidate resume and map their GitHub projects to the target role.',
        `Return JSON: tailoredSummary (string), highlightedSkills (array), suggestedChanges (array), resumeProjectSection (array of objects with title, description, technologiesUsed (array), keyContributions, impactStatement, bulletPoints (array)), summary (string).\nResume:${JSON.stringify(resume || {})}\nTarget job:${JSON.stringify(job || {})}\nGitHub Repos:${JSON.stringify(repos || [])}`
    ),

    resumeSimulationPrompt: ({ resume, scenarios }) => baseInstruction(
        'Estimate how a resume would perform in different hiring environments.',
        `Return JSON: scenarios (array of scenario, acceptanceRate (0-100), feedback (string), confidence (0-1)).\nResume:${JSON.stringify(resume || {})}\nScenarios:${JSON.stringify(scenarios || [])}`
    ),

    authenticityPrompt: ({ resume }) => baseInstruction(
        'Review a resume for plausibility, fraud-risk, and inconsistencies.',
        `Return JSON: authenticityScore (0-100), flags (array), verification (object with employment, education, skills), summary (string).\nResume:${JSON.stringify(resume || {})}`
    ),

    timelinePrompt: ({ resume }) => baseInstruction(
        'Turn a resume into a structured professional timeline.',
        `Return JSON: timeline (array of id, title, company, start, end, type), summary (string).\nResume:${JSON.stringify(resume || {})}`
    ),

    improvementReportPrompt: ({ resume }) => baseInstruction(
        'Produce a prioritized report for raising a resume score.',
        `Return JSON: overallGrade (string), improvements (array of area, suggestion, priority), estimatedScoreIncrease (number), summary (string).\nResume:${JSON.stringify(resume || {})}`
    ),

    githubAnalysisPrompt: ({ username, repos }) => baseInstruction(
        'Analyze the user\'s real GitHub repositories and contributions to evaluate coding skills.',
        `Return JSON: portfolioScore (0-100), totalCommits (number), totalPRs (number), languages (array of name and percentage), contributionScore (0-100), projectComplexity (0-100), codingConsistency (0-100), repositoryQuality (0-100), commitFrequency (0-100), topRepository (string), openSourceContributions (number), aiCandidateSummary (string), repos (array of name, rank, qualityScore, summary, architecture).\nGitHub username:${username || 'unknown'}\nRepos:${JSON.stringify(repos || [])}`
    ),

    projectKnowledgePrompt: ({ projectName, question }) => baseInstruction(
        'Explain a software project and answer a related question.',
        `Return JSON: answer (string), summary (string), keyPoints (array), confidence (0-1).\nProject:${projectName || 'unknown'}\nQuestion:${question || ''}`
    ),

    skillTransferPrompt: ({ skills }) => baseInstruction(
        'Analyze how existing skills transfer to adjacent domains.',
        `Return JSON: transfers (array of skill, transferableTo (array), transferability (0-100)), summary (string).\nSkills:${JSON.stringify(skills || [])}`
    ),

    codingAssessmentPrompt: ({ language, difficulty }) => baseInstruction(
        'Generate a coding assessment challenge for a candidate.',
        `Return JSON: title (string), problems (array of id, title, difficulty, points), timeLimit (number), summary (string).\nLanguage:${language || 'JavaScript'}\nDifficulty:${difficulty || 'Medium'}`
    ),

    codeReviewPrompt: ({ code, language }) => baseInstruction(
        'Review production code for correctness, security, and maintainability.',
        `Return JSON: score (0-100), issues (array of line, severity, message), suggestions (array), securityIssues (array), summary (string).\nLanguage:${language || 'JavaScript'}\nCode:${String(code || '').slice(0, 5000)}`
    ),

    interviewQuestionsPrompt: ({ role, skills, count, repoDetails }) => baseInstruction(
        'Create interview questions tailored to a role, skill set, and their real GitHub projects.',
        `Return JSON: questions (array of id, question, type, difficulty), summary (string).\nRole:${role || 'Engineer'}\nSkills:${JSON.stringify(skills || [])}\nCount:${count || 10}\nGitHub Repos Details:${JSON.stringify(repoDetails || [])}`
    ),

    softSkillsPrompt: ({ profile }) => baseInstruction(
        'Infer likely soft-skill strengths from a candidate profile.',
        `Return JSON: skills (object with communication, leadership, teamwork, problemSolving, adaptability), summary (string), confidence (0-1).\nProfile:${JSON.stringify(profile || {})}`
    ),

    candidateSummaryPrompt: ({ profile }) => baseInstruction(
        'Produce a concise, structured candidate summary for a hiring team.',
        `Return JSON: summary (string), highlights (array), strengths (array), risks (array), nextSteps (array).\nProfile:${JSON.stringify(profile || {})}`
    ),

    recruiterSummaryPrompt: ({ profile, job }) => baseInstruction(
        'Write a concise hiring summary for a recruiter.',
        `Return JSON: summary (string), interviewFocus (array), decisionNotes (array), suggestedQuestions (array).\nProfile:${JSON.stringify(profile || {})}\nJob:${JSON.stringify(job || {})}`
    ),

    personalizedFeedbackPrompt: ({ profile, targetRole }) => baseInstruction(
        'Give personalized feedback to help a candidate improve for a target role.',
        `Return JSON: feedback (string), priorities (array), actions (array), expectedImpact (string).\nProfile:${JSON.stringify(profile || {})}\nTarget role:${targetRole || 'target role'}`
    ),

    explainableRankingPrompt: ({ candidates }) => baseInstruction(
        'Rank candidates and justify the order clearly.',
        `Return JSON: candidates (array of id, name, score (0-100), tier, rationale), summary (string).\nCandidates:${JSON.stringify(candidates || [])}`
    ),

    projectQualityPrompt: ({ project }) => baseInstruction(
        'Review a software project for maintainability and execution quality.',
        `Return JSON: qualityScore (0-100), strengths (array), risks (array), recommendations (array), summary (string).\nProject:${JSON.stringify(project || {})}`
    ),

    skillGapPrompt: ({ candidateSkills, targetSkills }) => baseInstruction(
        'Identify skill gaps for a target role.',
        `Return JSON: gapScore (0-100), missingSkills (array), recommendedLearning (array), summary (string).\nCandidate skills:${JSON.stringify(candidateSkills || [])}\nTarget skills:${JSON.stringify(targetSkills || [])}`
    ),

    careerRoadmapPrompt: ({ profile, repoSummary }) => baseInstruction(
        'Build a realistic career roadmap for a candidate.',
        `Return JSON: nodes (array of id, type, label, progress, x, y), connections (array of from, to), progress (0-100), summary (string).\nProfile:${JSON.stringify(profile || {})}\nGitHub Repositories:\n${repoSummary || 'None'}`
    ),

    roadmapAnalysisPrompt: ({ roadmap }) => baseInstruction(
        'Review a roadmap for execution risk and opportunity.',
        `Return JSON: analysis (string), bottlenecks (array), recommendations (array), confidence (0-1).\nRoadmap:${JSON.stringify(roadmap || {})}`
    ),

    companyGoalsPrompt: ({ company, goals }) => baseInstruction(
        'Turn business goals into practical milestones.',
        `Return JSON: plan (array of goal, timeline, milestones, feasibility), summary (string).\nCompany:${JSON.stringify(company || {})}\nGoals:${JSON.stringify(goals || [])}`
    ),

    leaderboardPrompt: () => baseInstruction(
        'Create a realistic leadership leaderboard for professional growth.',
        'Return JSON: leaderboard (array of rank, name, score, growth).'
    ),

    benchmarkPrompt: ({ profile }) => baseInstruction(
        'Compare a candidate profile to common benchmarks.',
        `Return JSON: benchmarks (object with skills, experience, projects, certifications), summary (string).\nProfile:${JSON.stringify(profile || {})}`
    ),

    learningRoadmapPrompt: ({ skills }) => baseInstruction(
        'Build a practical roadmap to improve a set of skills.',
        `Return JSON: modules (array of skill, courses (array), estimatedWeeks, priority), summary (string).\nSkills:${JSON.stringify(skills || [])}`
    ),

    careerGrowthPrompt: ({ profile }) => baseInstruction(
        'Predict likely career growth based on a professional profile.',
        `Return JSON: predictions (array of year, role, probability, salary), summary (string).\nProfile:${JSON.stringify(profile || {})}`
    ),

    learningScorePrompt: ({ profile }) => baseInstruction(
        'Estimate continuous learning quality for a professional profile.',
        `Return JSON: score (0-100), streak (number), weeklyHours (number), certificationsInProgress (number), summary (string).\nProfile:${JSON.stringify(profile || {})}`
    ),

    recruiterAssistantPrompt: ({ query, context }) => baseInstruction(
        'Help a recruiter make hiring decisions and next steps.',
        `Return JSON: response (string), suggestions (array), summary (string).\nQuery:${query || ''}\nContext:${JSON.stringify(context || {})}`
    ),

    jobRecommendationPrompt: ({ profile }) => baseInstruction(
        'Recommend jobs that fit a candidate profile.',
        `Return JSON: recommendations (array of title, company, match (0-100), rationale), summary (string).\nProfile:${JSON.stringify(profile || {})}`
    ),

    reverseMatchPrompt: ({ job }) => baseInstruction(
        'Find candidates that are a strong fit for a target job.',
        `Return JSON: candidates (array of name, match (0-100), availability), summary (string).\nJob:${JSON.stringify(job || {})}`
    ),

    resumeCollectionPrompt: ({ sources }) => baseInstruction(
        'Plan how to collect and process resumes from candidate sources.',
        `Return JSON: collected (number), processed (number), status (string), summary (string).\nSources:${JSON.stringify(sources || [])}`
    ),

    hiringAnalyticsPrompt: ({ companyId }) => baseInstruction(
        'Summarize hiring funnel performance.',
        `Return JSON: metrics (object with totalApplications, shortlisted, interviewed, hired, avgTimeToHire, conversionRate, topSources), funnel (array of stage and count), summary (string).\nCompany ID:${companyId || 'unknown'}`
    ),

    interviewSlotsPrompt: ({ participants }) => baseInstruction(
        'Suggest interview slots for a set of participants.',
        `Return JSON: slots (array of date, times), recommended (string), summary (string).\nParticipants:${JSON.stringify(participants || [])}`
    ),

    applicationTrackingPrompt: ({ application }) => baseInstruction(
        'Explain the likely next steps for an application.',
        `Return JSON: status (string), nextSteps (array), estimatedDecision (string), summary (string).\nApplication:${JSON.stringify(application || {})}`
    ),

    jobCreationPrompt: ({ prompt }) => baseInstruction(
        'Create a structured job description from a brief prompt.',
        `Return JSON: job (object with title, description, requirements, skills), summary (string).\nPrompt:${prompt || ''}`
    ),

    candidateAssistantPrompt: ({ action, context }) => baseInstruction(
        'Provide a helpful response for a candidate request.',
        `Return JSON: response (string), suggestions (array), summary (string).\nAction:${action || 'help'}\nContext:${JSON.stringify(context || {})}`
    )
};
