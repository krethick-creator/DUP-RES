const JSON_ONLY = 'Return valid JSON only. Do not wrap the answer in markdown code fences.';

const baseInstruction = (task, extra = '') => `${task}\n\n${JSON_ONLY}\n\n${extra}`.trim();

module.exports = {
    resumeScreeningPrompt: ({ resume, job }) => baseInstruction(
        'You are an expert recruiter and hiring analyst. Evaluate how well the provided resume matches the provided job description.',
        `Return a JSON object with: matchScore (0-100), recommendation (shortlist, review, or reject), strengths (array of strings), weaknesses (array of strings), missingSkills (array of strings), explanation (string), confidence (0-1).\nResume:\n${JSON.stringify(resume || {}, null, 2)}\n\nJob:\n${JSON.stringify(job || {}, null, 2)}`
    ),

    parseResumePrompt: (filepath) => baseInstruction(
        'You are a resume parsing specialist. Extract structured candidate information from the provided resume file path and infer likely content from the filename and context.',
        `Return a JSON object with: parsed { name, email, phone, summary, skills (array), experience (array of objects with company, role, startDate, endDate, description), education (array), certifications (array) }, score (0-100), atsScore (0-100), confidence (0-1), rawAnalysis (string).\nFile path:\n${filepath || 'unknown'}`
    ),

    skillMatchingPrompt: ({ candidateSkills, jobSkills }) => baseInstruction(
        'You are a senior technical recruiter. Compare candidate skills to job requirements and identify alignment.',
        `Return a JSON object with: matchPercentage (0-100), matchedSkills (array), missingSkills (array), transferableSkills (array), rationale (string).\nCandidate skills:\n${JSON.stringify(candidateSkills || [], null, 2)}\n\nJob skills:\n${JSON.stringify(jobSkills || [], null, 2)}`
    ),

    rankingPrompt: (candidates) => baseInstruction(
        'You are an expert hiring manager. Rank candidates based on their alignment, skills, and experience.',
        `Return a JSON object with: candidates (array of objects with id, name, score (0-100), tier (top, good, average), rationale (string)).\nCandidates:\n${JSON.stringify(candidates || [], null, 2)}`
    ),

    explainScorePrompt: ({ score, context }) => baseInstruction(
        'You are an explainable AI analyst. Explain a candidate score with a transparent breakdown.',
        `Return a JSON object with: factors (array of objects with factor, weight, score), summary (string), confidence (0-1).\nScore:\n${score}\n\nContext:\n${JSON.stringify(context || {}, null, 2)}`
    ),

    dynamicResumePrompt: ({ resume, job }) => baseInstruction(
        'You are a resume optimization specialist. Tailor a candidate resume to a target role.',
        `Return a JSON object with: tailoredSummary (string), highlightedSkills (array), suggestedChanges (array), summary (string).\nResume:\n${JSON.stringify(resume || {}, null, 2)}\n\nTarget job:\n${JSON.stringify(job || {}, null, 2)}`
    ),

    resumeSimulationPrompt: ({ resume, scenarios }) => baseInstruction(
        'You are a hiring simulation analyst. Estimate how a resume would perform in different hiring environments.',
        `Return a JSON object with: scenarios (array of objects with scenario, acceptanceRate (0-100), feedback (string), confidence (0-1)).\nResume:\n${JSON.stringify(resume || {}, null, 2)}\n\nScenarios:\n${JSON.stringify(scenarios || [], null, 2)}`
    ),

    authenticityPrompt: ({ resume }) => baseInstruction(
        'You are an authenticity and fraud-risk analyst. Review a resume for plausibility and inconsistencies.',
        `Return a JSON object with: authenticityScore (0-100), flags (array), verification (object with employment, education, skills), summary (string).\nResume:\n${JSON.stringify(resume || {}, null, 2)}`
    ),

    timelinePrompt: ({ resume }) => baseInstruction(
        'You are a career historian. Turn a resume into a structured professional timeline.',
        `Return a JSON object with: timeline (array of objects with id, title, company, start, end, type), summary (string).\nResume:\n${JSON.stringify(resume || {}, null, 2)}`
    ),

    improvementReportPrompt: ({ resume }) => baseInstruction(
        'You are a resume improvement coach. Produce a prioritized report for raising a resume score.',
        `Return a JSON object with: overallGrade (string), improvements (array of objects with area, suggestion, priority), estimatedScoreIncrease (number), summary (string).\nResume:\n${JSON.stringify(resume || {}, null, 2)}`
    ),

    githubAnalysisPrompt: ({ username }) => baseInstruction(
        'You are a technical portfolio analyst. Review a GitHub profile and summarize the developer’s contribution quality.',
        `Return a JSON object with: portfolioScore (0-100), totalCommits (number), totalPRs (number), languages (array of objects with name and percentage), contributionAnalysis (object with consistency, impact, collaboration), repos (array of objects with name, rank, qualityScore, summary, architecture).\nGitHub username:\n${username || 'unknown'}`
    ),

    projectKnowledgePrompt: ({ projectName, question }) => baseInstruction(
        'You are a project knowledge assistant. Explain a software project and answer a related question.',
        `Return a JSON object with: answer (string), summary (string), keyPoints (array), confidence (0-1).\nProject:\n${projectName || 'unknown'}\n\nQuestion:\n${question || ''}`
    ),

    skillTransferPrompt: ({ skills }) => baseInstruction(
        'You are a career transition advisor. Analyze how existing skills transfer to adjacent domains.',
        `Return a JSON object with: transfers (array of objects with skill, transferableTo (array), transferability (0-100)), summary (string).\nSkills:\n${JSON.stringify(skills || [], null, 2)}`
    ),

    codingAssessmentPrompt: ({ language, difficulty }) => baseInstruction(
        'You are a technical interviewer. Generate a coding assessment challenge for a candidate.',
        `Return a JSON object with: title (string), problems (array of objects with id, title, difficulty, points), timeLimit (number), summary (string).\nLanguage:\n${language || 'JavaScript'}\n\nDifficulty:\n${difficulty || 'Medium'}`
    ),

    codeReviewPrompt: ({ code, language }) => baseInstruction(
        'You are a senior software engineer reviewing production code for correctness and maintainability.',
        `Return a JSON object with: score (0-100), issues (array of objects with line, severity, message), suggestions (array), securityIssues (array), summary (string).\nLanguage:\n${language || 'JavaScript'}\n\nCode:\n${String(code || '').slice(0, 6000)}`
    ),

    interviewQuestionsPrompt: ({ role, skills, count }) => baseInstruction(
        'You are an interview coach. Create interview questions tailored to a role and skill set.',
        `Return a JSON object with: questions (array of objects with id, question, type, difficulty), summary (string).\nRole:\n${role || 'Engineer'}\n\nSkills:\n${JSON.stringify(skills || [], null, 2)}\n\nCount:\n${count || 10}`
    ),

    softSkillsPrompt: ({ profile }) => baseInstruction(
        'You are a talent development expert. Infer likely soft-skill strengths from a candidate profile.',
        `Return a JSON object with: skills (object with communication, leadership, teamwork, problemSolving, adaptability), summary (string), confidence (0-1).\nProfile:\n${JSON.stringify(profile || {}, null, 2)}`
    ),

    candidateSummaryPrompt: ({ profile }) => baseInstruction(
        'You are a recruiting analyst producing a concise, structured candidate summary for a hiring team.',
        `Return a JSON object with: summary (string), highlights (array), strengths (array), risks (array), nextSteps (array).
Profile:
${JSON.stringify(profile || {}, null, 2)}`
    ),

    recruiterSummaryPrompt: ({ profile, job }) => baseInstruction(
        'You are a recruiter assistant writing a concise hiring summary for a recruiter.',
        `Return a JSON object with: summary (string), interviewFocus (array), decisionNotes (array), suggestedQuestions (array).
Profile:
${JSON.stringify(profile || {}, null, 2)}

Job:
${JSON.stringify(job || {}, null, 2)}`
    ),

    personalizedFeedbackPrompt: ({ profile, targetRole }) => baseInstruction(
        'You are a career coach giving personalized feedback to help a candidate improve for a target role.',
        `Return a JSON object with: feedback (string), priorities (array), actions (array), expectedImpact (string).
Profile:
${JSON.stringify(profile || {}, null, 2)}

Target role:
${targetRole || 'target role'}`
    ),

    explainableRankingPrompt: ({ candidates }) => baseInstruction(
        'You are an explainable AI ranking specialist. Rank candidates and justify the order clearly.',
        `Return a JSON object with: candidates (array of objects with id, name, score (0-100), tier, rationale), summary (string).
Candidates:
${JSON.stringify(candidates || [], null, 2)}`
    ),

    projectQualityPrompt: ({ project }) => baseInstruction(
        'You are a software quality analyst reviewing a project for maintainability and execution quality.',
        `Return a JSON object with: qualityScore (0-100), strengths (array), risks (array), recommendations (array), summary (string).
Project:
${JSON.stringify(project || {}, null, 2)}`
    ),

    skillGapPrompt: ({ candidateSkills, targetSkills }) => baseInstruction(
        'You are a learning and development analyst identifying skill gaps for a target role.',
        `Return a JSON object with: gapScore (0-100), missingSkills (array), recommendedLearning (array), summary (string).
Candidate skills:
${JSON.stringify(candidateSkills || [], null, 2)}

Target skills:
${JSON.stringify(targetSkills || [], null, 2)}`
    ),

    careerRoadmapPrompt: ({ profile }) => baseInstruction(
        'You are a career growth strategist. Build a realistic career roadmap for a candidate.',
        `Return a JSON object with: nodes (array of objects with id, type, label, progress, x, y), connections (array of objects with from, to), progress (0-100), summary (string).\nProfile:\n${JSON.stringify(profile || {}, null, 2)}`
    ),

    roadmapAnalysisPrompt: ({ roadmap }) => baseInstruction(
        'You are a career coach reviewing a roadmap for execution risk and opportunity.',
        `Return a JSON object with: analysis (string), bottlenecks (array), recommendations (array), confidence (0-1).\nRoadmap:\n${JSON.stringify(roadmap || {}, null, 2)}`
    ),

    companyGoalsPrompt: ({ company, goals }) => baseInstruction(
        'You are a strategy planner for a company. Turn business goals into practical milestones.',
        `Return a JSON object with: plan (array of objects with goal, timeline, milestones, feasibility), summary (string).\nCompany:\n${JSON.stringify(company || {}, null, 2)}\n\nGoals:\n${JSON.stringify(goals || [], null, 2)}`
    ),

    leaderboardPrompt: () => baseInstruction(
        'You are a career benchmark analyst. Create a realistic leadership leaderboard for professional growth.',
        'Return a JSON object with: leaderboard (array of objects with rank, name, score, growth).'
    ),

    benchmarkPrompt: ({ profile }) => baseInstruction(
        'You are a workforce benchmark analyst. Compare a candidate profile to common benchmarks.',
        `Return a JSON object with: benchmarks (object with skills, experience, projects, certifications), summary (string).\nProfile:\n${JSON.stringify(profile || {}, null, 2)}`
    ),

    learningRoadmapPrompt: ({ skills }) => baseInstruction(
        'You are a learning architect. Build a practical roadmap to improve a set of skills.',
        `Return a JSON object with: modules (array of objects with skill, courses (array), estimatedWeeks, priority), summary (string).\nSkills:\n${JSON.stringify(skills || [], null, 2)}`
    ),

    careerGrowthPrompt: ({ profile }) => baseInstruction(
        'You are a career forecasting specialist. Predict likely career growth based on a professional profile.',
        `Return a JSON object with: predictions (array of objects with year, role, probability, salary), summary (string).\nProfile:\n${JSON.stringify(profile || {}, null, 2)}`
    ),

    learningScorePrompt: ({ profile }) => baseInstruction(
        'You are a learning effectiveness analyst. Estimate continuous learning quality for a professional profile.',
        `Return a JSON object with: score (0-100), streak (number), weeklyHours (number), certificationsInProgress (number), summary (string).\nProfile:\n${JSON.stringify(profile || {}, null, 2)}`
    ),

    recruiterAssistantPrompt: ({ query, context }) => baseInstruction(
        'You are a recruiter AI assistant. Help a recruiter make hiring decisions and next steps.',
        `Return a JSON object with: response (string), suggestions (array), summary (string).\nQuery:\n${query || ''}\n\nContext:\n${JSON.stringify(context || {}, null, 2)}`
    ),

    jobRecommendationPrompt: ({ profile }) => baseInstruction(
        'You are a career matching assistant. Recommend jobs that fit a candidate profile.',
        `Return a JSON object with: recommendations (array of objects with title, company, match (0-100), rationale), summary (string).\nProfile:\n${JSON.stringify(profile || {}, null, 2)}`
    ),

    reverseMatchPrompt: ({ job }) => baseInstruction(
        'You are a recruiting matcher. Find candidates that are a strong fit for a target job.',
        `Return a JSON object with: candidates (array of objects with name, match (0-100), availability), summary (string).\nJob:\n${JSON.stringify(job || {}, null, 2)}`
    ),

    resumeCollectionPrompt: ({ sources }) => baseInstruction(
        'You are a sourcing coordinator. Plan how to collect and process resumes from candidate sources.',
        `Return a JSON object with: collected (number), processed (number), status (string), summary (string).\nSources:\n${JSON.stringify(sources || [], null, 2)}`
    ),

    hiringAnalyticsPrompt: ({ companyId }) => baseInstruction(
        'You are a talent analytics specialist. Summarize hiring funnel performance.',
        `Return a JSON object with: metrics (object with totalApplications, shortlisted, interviewed, hired, avgTimeToHire, conversionRate, topSources), funnel (array of objects with stage and count), summary (string).\nCompany ID:\n${companyId || 'unknown'}`
    ),

    interviewSlotsPrompt: ({ participants }) => baseInstruction(
        'You are an interview coordinator. Suggest interview slots for a set of participants.',
        `Return a JSON object with: slots (array of objects with date, times), recommended (string), summary (string).\nParticipants:\n${JSON.stringify(participants || [], null, 2)}`
    ),

    applicationTrackingPrompt: ({ application }) => baseInstruction(
        'You are an application lifecycle analyst. Explain the likely next steps for an application.',
        `Return a JSON object with: status (string), nextSteps (array), estimatedDecision (string), summary (string).\nApplication:\n${JSON.stringify(application || {}, null, 2)}`
    ),

    jobCreationPrompt: ({ prompt }) => baseInstruction(
        'You are a recruiting operations assistant. Create a structured job description from a brief prompt.',
        `Return a JSON object with: job (object with title, description, requirements, skills), summary (string).\nPrompt:\n${prompt || ''}`
    ),

    candidateAssistantPrompt: ({ action, context }) => baseInstruction(
        'You are a candidate success assistant. Provide a helpful response for a candidate request.',
        `Return a JSON object with: response (string), suggestions (array), summary (string).\nAction:\n${action || 'help'}\n\nContext:\n${JSON.stringify(context || {}, null, 2)}`
    )
};
