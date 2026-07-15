const crypto = require('crypto');
const AICacheModel = require('../models/AICache');
const config = require('../config');

class AICache {
  /**
   * Computes a SHA256 hash of a string prompt.
   * @param {string} prompt - The prompt text.
   * @returns {string} The computed hash.
   */
  static getHash(prompt) {
    return crypto.createHash('sha256').update(String(prompt || '')).digest('hex');
  }

  /**
   * Tries to find a valid cached response in MongoDB.
   * @param {string} userId - User ID context.
   * @param {string} featureName - The feature name / task descriptor.
   * @param {string} prompt - The actual prompt text to compare hash.
   * @returns {Promise<Object|null>} The cached data object or null if cache miss.
   */
  static async get(userId, featureName, prompt) {
    // Check if caching is enabled globally
    const cacheEnabled = process.env.AI_CACHE_ENABLED === 'true';
    if (!cacheEnabled) return null;

    try {
      const hash = this.getHash(prompt);
      const cached = await AICacheModel.findOne({ userId, featureName });
      
      if (cached && cached.generatedData && cached.generatedData.promptHash === hash) {
        // Validate TTL
        const ttlSeconds = Number(process.env.AI_CACHE_TTL || 86400);
        const ageMs = Date.now() - new Date(cached.updatedAt).getTime();
        const ttlMs = ttlSeconds * 1000;
        
        if (ageMs < ttlMs) {
          return cached.generatedData.data;
        }
      }
    } catch (err) {
      console.error('[AICache] Retrieval error:', err.message);
    }
    return null;
  }

  /**
   * Sets or updates a cached AI response in MongoDB.
   * @param {string} userId - User ID context.
   * @param {string} featureName - The feature name / task descriptor.
   * @param {string} prompt - The actual prompt text to compute hash.
   * @param {Object} data - The data output payload from AI models.
   */
  static async set(userId, featureName, prompt, data) {
    const cacheEnabled = process.env.AI_CACHE_ENABLED === 'true';
    if (!cacheEnabled) return null;

    try {
      const hash = this.getHash(prompt);
      const payload = {
        promptHash: hash,
        data: data
      };

      await AICacheModel.findOneAndUpdate(
        { userId, featureName },
        { userId, featureName, generatedData: payload, lastActualCallAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error('[AICache] Save error:', err.message);
    }
  }
}

module.exports = AICache;
