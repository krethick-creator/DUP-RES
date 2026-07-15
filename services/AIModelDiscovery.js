const { getGeminiClient } = require('./geminiClient');
const Logger = require('../utils/logger');

class AIModelDiscovery {
  static verifiedModels = [];
  static failedModels = []; // Array of { name, reason }

  static resolvedMainModel = '';
  static resolvedFastModel = '';
  static resolvedEmbeddingModel = '';
  
  static isReady = false;

  /**
   * Initializes model discovery and runs active verification on candidate models.
   */
  static async init() {
    const aiEnabled = process.env.AI_ENABLED === 'true';
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';

    const configuredMain = process.env.GEMINI_MAIN_MODEL || 'gemini-3.5-flash';
    const configuredFast = process.env.GEMINI_FAST_MODEL || 'gemini-2.5-flash';
    const configuredEmbed = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';

    const cleanMain = configuredMain.replace(/^models\//, '');
    const cleanFast = configuredFast.replace(/^models\//, '');
    const cleanEmbed = configuredEmbed.replace(/^models\//, '');

    if (!aiEnabled) {
      this.resolvedMainModel = cleanMain;
      this.resolvedFastModel = cleanFast;
      this.resolvedEmbeddingModel = cleanEmbed;
      this.verifiedModels = [cleanMain, cleanFast, cleanEmbed];
      this.isReady = true;

      this.printStartupReport({
        apiKeyLoaded: apiKey ? 'YES' : 'NO',
        configuredMain: cleanMain,
        configuredFast: cleanFast,
        configuredEmbed: cleanEmbed,
        status: 'READY (MOCK_MODE)'
      });
      return;
    }

    try {
      const client = getGeminiClient();

      // Define static verification candidate lists
      const candidatesToVerify = [
        cleanMain,
        cleanFast,
        cleanEmbed,
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-embedding-2',
        'gemini-embedding-001'
      ];

      const uniqueCandidates = [...new Set(candidatesToVerify)];

      // Verify each candidate model using real API queries
      for (const modelName of uniqueCandidates) {
        const isEmbed = modelName.includes('embed');

        try {
          if (isEmbed) {
            await client.models.embedContent({
              model: modelName,
              contents: 'Hello'
            });
          } else {
            await client.models.generateContent({
              model: modelName,
              contents: 'Hello',
              config: { maxOutputTokens: 1 }
            });
          }
          this.verifiedModels.push(modelName);
        } catch (err) {
          this.failedModels.push({
            name: modelName,
            reason: err.message || 'Verification call failed'
          });
        }
      }

      // Resolve final model configurations
      this.resolvedMainModel = this.resolveVerifiedModel(cleanMain, 'main', ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.0-flash']);
      this.resolvedFastModel = this.resolveVerifiedModel(cleanFast, 'fast', ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.0-flash']);
      this.resolvedEmbeddingModel = this.resolveVerifiedModel(cleanEmbed, 'embedding', ['gemini-embedding-2', 'gemini-embedding-001']);

      this.isReady = this.verifiedModels.length > 0;

      this.printStartupReport({
        apiKeyLoaded: apiKey ? 'YES' : 'NO',
        configuredMain: cleanMain,
        configuredFast: cleanFast,
        configuredEmbed: cleanEmbed,
        status: this.isReady ? 'READY' : 'OFFLINE'
      });
    } catch (err) {
      this.resolvedMainModel = cleanMain;
      this.resolvedFastModel = cleanFast;
      this.resolvedEmbeddingModel = cleanEmbed;
      this.verifiedModels = [cleanMain, cleanFast, cleanEmbed];
      this.isReady = false;

      this.printStartupReport({
        apiKeyLoaded: apiKey ? 'YES' : 'NO',
        configuredMain: cleanMain,
        configuredFast: cleanFast,
        configuredEmbed: cleanEmbed,
        status: `OFFLINE (Verification error: ${err.message})`
      });
    }
  }

  /**
   * Helper to resolve configured model name to verified fallback list.
   */
  static resolveVerifiedModel(configuredName, type, fallbackOrder) {
    if (this.verifiedModels.includes(configuredName)) {
      return configuredName;
    }

    // Try fallback options
    for (const model of fallbackOrder) {
      if (this.verifiedModels.includes(model)) {
        return model;
      }
    }

    // Try any verified model matching the category type
    if (type === 'embedding') {
      const match = this.verifiedModels.find(m => m.includes('embed'));
      if (match) return match;
    } else {
      const match = this.verifiedModels.find(m => !m.includes('embed'));
      if (match) return match;
    }

    return configuredName; // Absolute fallback
  }

  /**
   * Outputs the startup diagnostics report to the console.
   */
  static printStartupReport(data) {
    if (!Logger.isAiStartupEnabled) return;

    let sdkVersion = 'unknown';
    try {
      const rootPkg = require('../package.json');
      sdkVersion = rootPkg.dependencies['@google/genai'] || 'unknown';
    } catch (e) {}

    Logger.info('\n====================================');
    Logger.info('AI STARTUP REPORT');
    Logger.info('====================================');
    Logger.info(`API Key Loaded:\n${data.apiKeyLoaded}`);
    Logger.info(`SDK Version:\n${sdkVersion}`);
    Logger.info(`\nConfigured Models:\n\nMain:\n${data.configuredMain}\n\nFast:\n${data.configuredFast}\n\nEmbedding:\n${data.configuredEmbed}`);
    
    Logger.info('\nVerification Results:');
    const isMainSuccess = this.verifiedModels.includes(data.configuredMain);
    const isFastSuccess = this.verifiedModels.includes(data.configuredFast);
    const isEmbedSuccess = this.verifiedModels.includes(data.configuredEmbed);

    Logger.info(`\nMain:\n${isMainSuccess ? 'SUCCESS' : 'FAILED'}`);
    Logger.info(`Fast:\n${isFastSuccess ? 'SUCCESS' : 'FAILED'}`);
    Logger.info(`Embedding:\n${isEmbedSuccess ? 'SUCCESS' : 'FAILED'}`);

    Logger.info('\nFallbacks Applied:');
    const fastFallback = data.configuredFast !== this.resolvedFastModel ? this.resolvedFastModel : 'None';
    const mainFallback = data.configuredMain !== this.resolvedMainModel ? this.resolvedMainModel : 'None';
    const embedFallback = data.configuredEmbed !== this.resolvedEmbeddingModel ? this.resolvedEmbeddingModel : 'None';
    
    Logger.info(`\nFast:\n${fastFallback}`);
    Logger.info(`Main:\n${mainFallback}`);
    Logger.info(`Embedding:\n${embedFallback}`);

    Logger.info('\nVerified Models:');
    if (this.verifiedModels.length === 0) {
      Logger.info('- None');
    } else {
      this.verifiedModels.forEach(m => Logger.info(`- ${m}`));
    }

    Logger.info('\nRejected Models:');
    if (this.failedModels.length === 0) {
      Logger.info('- None');
    } else {
      this.failedModels.forEach(f => {
        Logger.info(`\nModel:\n${f.name}`);
        Logger.info(`Reason:\n${f.reason}`);
      });
    }

    Logger.info(`\nResolved Models:\n\nMain:\n${this.resolvedMainModel}\n\nFast:\n${this.resolvedFastModel}\n\nEmbedding:\n${this.resolvedEmbeddingModel}`);
    Logger.info(`\nGateway Status:\n${data.status}`);
    Logger.info('====================================\n');
  }
}

module.exports = AIModelDiscovery;
