const AIModelRouter = require('./AIModelRouter');
const AICache = require('./AICache');
const MockAI = require('./MockAI');
const AIModelDiscovery = require('./AIModelDiscovery');
const { getGeminiClient, generateStructuredContent } = require('./geminiClient');
const Logger = require('../utils/logger');

class AIGateway {
  /**
   * Centralized generate function. Matches tasks, validates caches, routes to Gemini, logs and returns results.
   */
  static async generate(taskName, prompt, fallback = {}, userId = null, options = {}) {
    const aiEnabled = process.env.AI_ENABLED === 'true';
    const startTime = Date.now();
    let model = AIModelRouter.getModelForTask(taskName);

    let isVerified = true;
    if (aiEnabled) {
      isVerified = AIModelDiscovery.verifiedModels.includes(model);

      if (!isVerified) {
        const originalModel = model;
        const failedObj = AIModelDiscovery.failedModels.find(f => f.name === originalModel);
        const reason = failedObj ? failedObj.reason : 'Not found in verified list';

        // Attempt fallback to resolved models
        if (model.includes('embed') || taskName.includes('search') || taskName.includes('matching')) {
          model = AIModelDiscovery.resolvedEmbeddingModel;
        } else {
          const fastReference = AIModelRouter.getModelForTask('ats-score');
          const unverifiedTarget = AIModelRouter.getModelForTask(taskName);
          
          if (unverifiedTarget === fastReference) {
            model = AIModelDiscovery.resolvedFastModel;
          } else {
            model = AIModelDiscovery.resolvedMainModel;
          }
        }

        Logger.gateway(`[AI_MODEL]\nRequested:\n${originalModel}\nVerified:\nNO\nFallback:\n${model}\nReason:\n${reason}\n`);
      }

      // Final safety check
      if (!model || !AIModelDiscovery.verifiedModels.includes(model)) {
        return {
          success: false,
          error: "No verified Gemini model available."
        };
      }
    }

    const fallbackUsed = isVerified ? 'NO' : 'YES';

    // 1. If AI is disabled globally, return realistic Mock responses
    if (!aiEnabled) {
      this.log({
        taskName,
        model: 'MOCK',
        executionTimeMs: Date.now() - startTime,
        cacheHit: false,
        status: 'SUCCESS',
        retryCount: 0,
        fallbackUsed: 'NO'
      });

      const mockMethod = this.getMockMethodForTask(taskName);
      if (mockMethod && typeof MockAI[mockMethod] === 'function') {
        const payload = options.payload || {};
        return MockAI[mockMethod](payload.resume || payload.projectName || payload.repoName || prompt, payload.job || payload.question || payload.scenarios);
      }
      return fallback;
    }

    // 2. Cache Lookup
    const force = options.forceRegenerate || false;
    if (userId && !force) {
      const cachedData = await AICache.get(userId, taskName, prompt);
      if (cachedData) {
        this.log({
          taskName,
          model,
          executionTimeMs: Date.now() - startTime,
          cacheHit: true,
          status: 'SUCCESS',
          retryCount: 0,
          fallbackUsed
        });
        return cachedData;
      }
    }

    // 3. Call Gemini
    const resumeText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
    if (Logger.isAiGatewayEnabled) {
      Logger.info('\n=========================');
      Logger.info('GEMINI INPUT');
      Logger.info('=========================');
      Logger.info(`Task:\n${taskName}`);
      Logger.info(`Model:\n${model}`);
      Logger.info(`Prompt Length:\n${prompt.length}`);
      Logger.info(`Resume Length:\n${resumeText.length}`);
      Logger.info(`Resume Preview (first 1000 chars):\n${resumeText.substring(0, 1000)}`);
      Logger.info('=========================\n');
    }

    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const response = await generateStructuredContent(prompt, {
          model: model,
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 1200
        });

        const resolvedData = { ...fallback, ...response, configured: true, source: 'gemini' };

        // 4. Update Cache
        if (userId) {
          await AICache.set(userId, taskName, prompt, resolvedData);
        }

        this.log({
          taskName,
          model,
          executionTimeMs: Date.now() - startTime,
          cacheHit: false,
          status: 'SUCCESS',
          retryCount: attempts - 1,
          fallbackUsed
        });

        return resolvedData;
      } catch (error) {
        lastError = error;
        Logger.warn(`[AIGateway] Attempt ${attempts} failed for task ${taskName}:`, error.message);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, attempts * 500));
        }
      }
    }

    // Log failure
    this.log({
      taskName,
      model,
      executionTimeMs: Date.now() - startTime,
      cacheHit: false,
      status: 'FAILED',
      retryCount: attempts - 1,
      fallbackUsed
    });

    return { ...fallback, configured: false, source: 'fallback', error: lastError?.message };
  }

  /**
   * Centralized embedding function. Generates embeddings using Gemini's Embedding Model.
   */
  static async embed(taskName, text) {
    const aiEnabled = process.env.AI_ENABLED === 'true';
    if (!aiEnabled) {
      return Array.from({ length: 768 }, () => Math.random());
    }

    const model = AIModelRouter.getModelForTask(taskName);
    const client = getGeminiClient();
    const response = await client.models.embedContent({
      model: model,
      contents: text
    });

    if (response?.embedding?.values) {
      return response.embedding.values;
    }
    throw new Error('Failed to generate embeddings from Gemini');
  }

  static log(meta) {
    if (!Logger.isAiGatewayEnabled) return;
    Logger.info('\n[AI_GATEWAY_LOG]');
    Logger.info(`Task:\n${meta.taskName}`);
    Logger.info(`Model:\n${meta.model}`);
    Logger.info(`Execution:\n${meta.executionTimeMs}ms`);
    Logger.info(`Cache:\n${meta.cacheHit ? 'HIT' : 'MISS'}`);
    Logger.info(`Retry:\n${meta.retryCount || 0}`);
    Logger.info(`Fallback:\n${meta.fallbackUsed || 'NO'}`);
    Logger.info(`Status:\n${meta.status}\n`);
  }

  static getMockMethodForTask(taskName) {
    const mapping = {
      'resume-screening': 'screenResume',
      'resume-parsing': 'parseResume',
      'github-analysis': 'analyzeGitHub',
      'project-knowledge': 'explainProject',
      'project-intelligence': 'getProjectIntelligence',
      'project-viz': 'getProjectVisualizations',
      'recruiter-assistant': 'recruiterAssistant',
      'candidate-assistant': 'candidateAI',
      'interview-questions': 'generateInterview'
    };
    return mapping[taskName] || null;
  }
}

module.exports = AIGateway;
