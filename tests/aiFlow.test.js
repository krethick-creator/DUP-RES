const assert = require('assert');
const path = require('path');

const { shouldUseAiCache, buildAiCacheKey, getCooldownMessage } = require('../services/aiService');

describe('AI flow safeguards', () => {
    it('builds a stable cache key per user and feature', () => {
        assert.strictEqual(buildAiCacheKey('u1', 'resume-analysis'), 'u1:resume-analysis');
    });

    it('keeps explicit generation allowed while cooldown is active', () => {
        const state = { lastRequestedAt: Date.now() };
        const result = shouldUseAiCache(state, 30_000);
        assert.strictEqual(result.shouldUseCache, true);
        assert.strictEqual(result.reason, 'cooldown');
        assert.strictEqual(getCooldownMessage(), 'AI is temporarily busy. Please wait a few seconds and try again.');
    });
});
