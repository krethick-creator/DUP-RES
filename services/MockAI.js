class MockAI {
  static screenResume(resume, job) {
    return {
      matchScore: 88,
      recommendation: 'shortlist',
      strengths: ['Strong backend developer alignment', 'Extensive knowledge of Node.js and MongoDB', 'Secured session management using JWT'],
      weaknesses: ['Missing Docker orchestration details', 'Redis caching metrics not quantified'],
      missingSkills: ['Docker', 'Redis', 'Kubernetes'],
      explanation: 'Candidate meets 88% of core requirements. Solid Node.js/Mongoose skills.',
      confidence: 0.9
    };
  }

  static parseResume(filepath) {
    return {
      parsed: {
        name: 'Mock Candidate',
        email: 'candidate@mock.com',
        phone: '+1-555-0100',
        summary: 'Experienced software engineer focusing on backend services, API designs, and database architectures.',
        skills: ['JavaScript', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB', 'React.js', 'HTML5', 'CSS3', 'Git'],
        experience: [
          {
            company: 'TechCorp Solutions',
            role: 'Software Engineer',
            startDate: '2023-01',
            endDate: 'Present',
            description: 'Maintained core Node.js backend services and integrated authentication systems using OAuth.'
          }
        ],
        education: [
          {
            institution: 'State University',
            degree: 'B.S. Computer Science',
            year: '2022'
          }
        ],
        certifications: ['AWS Cloud Practitioner']
      },
      score: 82,
      atsScore: 85,
      confidence: 0.9,
      rawAnalysis: 'High quality parsed data returned from Mock parsing tool.'
    };
  }

  static analyzeGitHub(username, repos) {
    return {
      username: username || 'mock-user',
      repos: (repos || []).map(r => ({
        name: r.name,
        rank: 1,
        qualityScore: 85,
        summary: 'A well structured repository containing scalable code paths and clear documentation.',
        architecture: 'Model-View-Controller (MVC) server deployment.'
      })),
      portfolioScore: 85,
      totalCommits: 350,
      totalPRs: 42,
      languages: [
        { name: 'JavaScript', percentage: 70 },
        { name: 'TypeScript', percentage: 20 },
        { name: 'HTML/CSS', percentage: 10 }
      ],
      contributionScore: 80,
      projectComplexity: 78,
      codingConsistency: 85,
      repositoryQuality: 82,
      commitFrequency: 75,
      topRepository: repos?.[0]?.name || 'mock-repo',
      openSourceContributions: 8,
      aiCandidateSummary: 'Highly active candidate with consistent commit patterns and robust documentation habits.'
    };
  }

  static explainProject(repoName, question) {
    return {
      response: `### Explanation for ${repoName}\n\nBased on repository inspection:
- **Authentication**: Uses a token-based JWT implementation. Signed payloads verify requests via an Express middleware layer.
- **Database**: Mongoose schemas map documents directly into MongoDB collections. Compiles caching targets recursively.
- **API Routing**: Clear REST design exposing endpoints under \`/api/auth\`, \`/api/github\`, and \`/api/ai\` namespace.

This design is production-ready, ensuring fast loads and clean vertical separation.`,
      summary: 'Fallback explanation of project structure.',
      keyPoints: ['JWT security', 'MongoDB modeling', 'Express routing'],
      confidence: 0.85
    };
  }

  static getProjectIntelligence(repoName) {
    return {
      projectOverview: 'An advanced Full-Stack Talent Management platform utilizing AI engines for parsing, evaluating, and filtering candidate profiles.',
      architectureSummary: 'A Model-View-Controller (MVC) server-side layout built with Express, integrated with a React Single Page Application frontend.',
      folderExplanation: 'Root contains the backend files, server.js handles connection, models holds schemas, client contains client dashboard UI assets.',
      techStack: ['Node.js', 'Express.js', 'React.js', 'MongoDB', 'Socket.IO', 'Monaco Editor'],
      databaseFlow: 'Candidate profiles are synced and stored in MongoDB. AI caching layers are saved inside AICache schema.',
      authFlow: 'Uses JSON Web Token (JWT) verification inside Express middleware and local browser token storage.',
      apiFlow: 'REST APIs are available under /api/auth, /api/github, and /api/ai endpoints.',
      dependencies: ['express', 'mongoose', 'jsonwebtoken', 'bcryptjs', 'socket.io'],
      codeComplexity: 78,
      contributionSummary: 'Strong commit velocity with documentation benchmarks. Focused on core components, database integration, and helper scripts.',
      timeline: 'Development started recently with major contributions to authorization and model setups.',
      commitSummary: 'Initial schema creation, auth controller implementation, front-end dashboard alignment.',
      importantFiles: ['server.js', 'controllers/authController.js', 'models/User.js'],
      unusedFiles: ['temp-script.js'],
      deadCode: 'No significant dead code identified. Deprecated local auth paths are clean.',
      securityWarnings: ['Hardcoded secrets in default settings', 'Limiter package configuration missing production rates'],
      projectScore: 84,
      portfolioScore: 82,
      technicalScore: 86,
      interviewDifficulty: 'Medium',
      atsScore: 85
    };
  }

  static getProjectVisualizations(repoName) {
    return {
      dependencyGraph: `graph TD
  App[app.js] --> Express[express]
  App --> Mongoose[mongoose]
  App --> JWT[jsonwebtoken]
  Mongoose --> MongoDB[(MongoDB)]`,
      architectureDiagram: `graph LR
  Client[SPA Client] <--> LoadBalancer[Express Port 5000]
  LoadBalancer <--> Controllers[Controllers]
  Controllers <--> Models[Mongoose Models]
  Models <--> DB[(MongoDB Cache)]`,
      databaseDiagram: `erDiagram
  User ||--o{ Resume : uploads
  User ||--o{ Assessment : completes
  User ||--o{ GitHubRepository : syncs
  User {
    string id
    string name
    string email
  }
  Resume {
    string filename
    string score
  }`,
      apiFlowDiagram: `graph TD
  Request[Client Request] --> AuthCheck{Auth Middleware}
  AuthCheck -- Success --> Controller[Execute Controller]
  AuthCheck -- Fail --> Error[401 Unauthorized]
  Controller --> DBQuery[Mongoose DB Call]
  DBQuery --> Response[Send JSON Response]`,
      mindMap: `graph TD
  Root[Project Stack]
  Root --> Backend[Node.js / Express]
  Root --> Frontend[Vanilla SPA / Charts]
  Root --> Database[MongoDB Cache]
  Root --> AI[Gemini 2.5 API]`
    };
  }

  static recruiterAssistant(query, context) {
    return {
      response: `### AI Hiring Evaluation\n\nBased on unified profile analysis:\n- **Technical Match**: The candidate possesses a strong profile matching Node.js, Express, and MongoDB. Their GitHub score of 82 indicates a clean coding style.\n- **Hiring Decision**: Recommended for **Shortlist**.\n- **Suggested Questions**: Ask about their experience with distributed state caching and database replication patterns.`,
      suggestions: ['Move to technical interview stage', 'Send programming challenge'],
      summary: 'Recruiter assistant fallback advice.'
    };
  }

  static candidateAI(action, context) {
    return {
      response: 'I am here to guide your career. Your profile has high scores in JavaScript, React, and MongoDB. I suggest taking an AWS certified practitioner course to cover the missing cloud skills.',
      suggestions: ['Prepare for System Design', 'Take AWS Cloud Course'],
      summary: 'Candidate career help.'
    };
  }

  static generateInterview(role, skills, count, repoDetails) {
    return {
      questions: Array.from({ length: count || 5 }, (_, idx) => ({
        id: idx + 1,
        question: `How would you scale a Node.js API that leverages a MongoDB caching model similar to the one used in your project?`,
        type: 'technical',
        difficulty: idx % 2 === 0 ? 'medium' : 'hard'
      })),
      summary: 'Mock interview questions generated.'
    };
  }
}

module.exports = MockAI;
