const AIModelDiscovery = require('./AIModelDiscovery');

class AIModelRouter {
  /**
   * Resolves the appropriate model name for a given task.
   * @param {string} taskName - Name of the task or feature.
   * @returns {string} The model name resolved during startup.
   */
  static getModelForTask(taskName) {
    const mainModel = AIModelDiscovery.resolvedMainModel || '';
    const fastModel = AIModelDiscovery.resolvedFastModel || '';
    const embeddingModel = AIModelDiscovery.resolvedEmbeddingModel || '';

    // Group 1: Gemini 3.5 Flash (Large Reasoning)
    const reasoningTasks = [
      'recruiter-copilot',
      'recruiter-assistant',
      'candidate-ai',
      'candidate-assistant',
      'resume-generation',
      'resume-improvement',
      'career-roadmap',
      'company-goals',
      'interview-questions',
      'project-knowledge',
      'architecture-explanation',
      'repository-chat',
      'code-explanation',
      'hiring-recommendation',
      'learning-roadmap'
    ];

    // Group 2: Gemini Embedding (Semantic Matching / Search)
    const embeddingTasks = [
      'resume-search',
      'candidate-search',
      'semantic-skill-matching',
      'repository-search',
      'job-matching',
      'reverse-matching',
      'knowledge-base',
      'project-search',
      'recruiter-search',
      'similar-candidates'
    ];

    if (embeddingTasks.includes(taskName.toLowerCase())) {
      return embeddingModel;
    }

    if (reasoningTasks.includes(taskName.toLowerCase())) {
      return mainModel;
    }

    // Default Group: Gemini 2.5 Flash (Fast Tasks)
    return fastModel;
  }
}

module.exports = AIModelRouter;
