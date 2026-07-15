const prompts = require('./aiPrompts');

class PromptBuilder {
  static buildResumePrompt(resume, job) {
    return prompts.resumeScreeningPrompt({ resume, job });
  }

  static buildGithubPrompt(username, repos) {
    return prompts.githubAnalysisPrompt({ username, repos });
  }

  static buildInterviewPrompt(role, skills, count, repoDetails) {
    return prompts.interviewQuestionsPrompt({ role, skills, count, repoDetails });
  }

  static buildCareerPrompt(profile, repoSummary) {
    return prompts.careerRoadmapPrompt({ profile, repoSummary });
  }

  static buildRepositoryPrompt(repo) {
    return prompts.repositoryAnalysisPrompt({ repo });
  }

  static buildRecruiterPrompt(query, context) {
    return prompts.recruiterAssistantPrompt({ query, context });
  }

  static buildCandidatePrompt(action, context) {
    return prompts.candidateAssistantPrompt({ action, context });
  }

  static buildProjectChatPrompt(repoName, question, contextText) {
    return `
      You are the AI Project Knowledge Assistant.
      Answer the question about this repository "${repoName}" based ONLY on the candidate's profile, resume, LinkedIn, and GitHub repositories.
      
      Here is the unified candidate context:
      ${contextText}

      Current Question: "${question}"
      
      Formulate a detailed, premium, professional markdown response answering the question. If the user asks about Docker, JWT, database, etc. explain it reference to the files and details provided. Do not invent any outside details, rely on standard implementations matching their technologies.
      
      Return a JSON object:
      {
        "response": "markdown response here"
      }
    `;
  }


  // Custom visualizer prompts
  static buildProjectVisualizationsPrompt(repoName, contextText) {
    return `
      Create architecture, database, dependency, and mind map visualizations for repository "${repoName}".
      Context:\n${contextText}

      Provide clean, working Mermaid.js diagrams for:
      - Dependency Graph
      - Architecture Diagram
      - Database Relationship Diagram
      - API Flow Diagram
      - Technology Mind Map

      Return a JSON object exactly with these fields:
      {
        "dependencyGraph": "Mermaid diagram code here",
        "architectureDiagram": "Mermaid diagram code here",
        "databaseDiagram": "Mermaid diagram code here",
        "apiFlowDiagram": "Mermaid diagram code here",
        "mindMap": "Mermaid diagram code here"
      }
    `;
  }

  // Custom project intelligence prompt
  static buildProjectIntelligencePrompt(repoName, contextText) {
    return `
      Analyze the repository "${repoName}".
      Based on the profile, project context, and file list:
      ${contextText}

      Evaluate and structure:
      - Project Overview
      - Architecture Summary
      - Folder Explanation
      - Technology Stack
      - Database Flow
      - Authentication Flow
      - API Flow
      - Dependencies
      - Code Complexity Score (1-100)
      - Contribution Summary
      - Repository Timeline
      - Commit Summary
      - Important Files
      - Unused Files
      - Dead Code Detection
      - Security Warnings
      - Project Score (1-100)
      - Portfolio Score (1-100)
      - Technical Score (1-100)
      - Interview Difficulty (Easy/Medium/Hard)
      - ATS Project Score (1-100)

      Return a JSON object exactly with these fields:
      {
        "projectOverview": "Description",
        "architectureSummary": "Summary",
        "folderExplanation": "Explanation",
        "techStack": ["React", "Express", "MongoDB"],
        "databaseFlow": "Flow description",
        "authFlow": "Auth flow details",
        "apiFlow": "API paths description",
        "dependencies": ["express", "mongoose"],
        "codeComplexity": 78,
        "contributionSummary": "Contribution details",
        "timeline": "Timeline summary",
        "commitSummary": "Commits summary",
        "importantFiles": ["server.js", "controllers/authController.js"],
        "unusedFiles": ["test-old.js"],
        "deadCode": "Dead code details",
        "securityWarnings": ["Outdated packages", "JWT secret hardcoded in fallback mode"],
        "projectScore": 85,
        "portfolioScore": 88,
        "technicalScore": 90,
        "interviewDifficulty": "Medium",
        "atsScore": 87
      }
    `;
  }
}

module.exports = PromptBuilder;
