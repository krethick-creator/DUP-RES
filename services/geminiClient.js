const { GoogleGenAI } = require('@google/genai');
const config = require('../config');

let client = null;

// Reuse a single Gemini client instance so every AI feature shares the same authenticated connection.
const getGeminiClient = () => {
    if (!client) {
        if (!config.gemini.apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    }
    return client;
};

const extractText = (response) => {
    if (typeof response?.text === 'string' && response.text.trim()) {
        return response.text;
    }

    const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
    for (const candidate of candidates) {
        const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
        const text = parts.map((part) => part?.text || '').join('\n').trim();
        if (text) {
            return text;
        }
    }

    return '';
};

const generateStructuredContent = async (prompt, options = {}) => {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
        model: options.model || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: options.temperature ?? 0.2,
            topP: options.topP ?? 0.8,
            maxOutputTokens: options.maxOutputTokens ?? 1024,
            responseMimeType: 'application/json'
        }
    });

    const text = extractText(response);
    if (!text) {
        throw new Error('Gemini returned no content');
    }

    const cleaned = text.replace(/```json|```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (error) {
        return {
            raw: cleaned,
            summary: cleaned
        };
    }
};

module.exports = { getGeminiClient, generateStructuredContent };
