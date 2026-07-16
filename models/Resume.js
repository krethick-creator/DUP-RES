const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  parsed: {
    name: String,
    email: String,
    phone: String,
    location: String,
    summary: String,
    skills: [String],
    experience: [{
      company: String,
      role: String,
      startDate: String,
      endDate: String,
      description: String
    }],
    education: [{
      institution: String,
      degree: String,
      year: String
    }],
    projects: [{
      title: String,
      technologiesUsed: [String],
      description: String
    }],
    certifications: [String],
    languages: [String],
    achievements: [String],
    links: [String]
  },
  score: { type: Number, default: 0 },
  authenticityScore: { type: Number, default: 100 },
  dynamicVersion: { type: String, default: '' },
  simulationResults: { type: mongoose.Schema.Types.Mixed, default: {} },
  improvementReport: { type: mongoose.Schema.Types.Mixed, default: {} },
  isPrimary: { type: Boolean, default: true },
  
  // OCR metadata
  ocrText: { type: String },
  ocrSource: { type: String },
  ocrProcessedAt: { type: Date },
  
  // Theme Marketplace customizer settings
  selectedTheme: { type: String, default: 'Classic Modern' },
  themeCustomization: {
    accentColor: { type: String, default: '#2563EB' },
    primaryColor: { type: String, default: '#0F172A' },
    secondaryColor: { type: String, default: '#475569' },
    fontFamily: { type: String, default: 'Inter' },
    fontSize: { type: Number, default: 12 },
    lineHeight: { type: Number, default: 1.5 },
    margins: { type: Number, default: 20 },
    borderRadius: { type: Number, default: 4 },
    sectionSpacing: { type: Number, default: 16 },
    skillProgressStyle: { type: String, default: 'tags' },
    sectionOrder: [{ type: String }],
    hiddenSections: [{ type: String }],
    customSections: [{
      title: String,
      content: String
    }],
    pageSize: { type: String, default: 'A4' }
  },

  // Enterprise Theme Marketplace features
  favorites: [{ type: String }],
  variants: [{
    name: String,
    selectedTheme: { type: String, default: 'Classic Modern' },
    themeCustomization: mongoose.Schema.Types.Mixed,
    parsed: mongoose.Schema.Types.Mixed
  }],
  versions: [{
    versionNumber: Number,
    customization: mongoose.Schema.Types.Mixed,
    parsed: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
  }],
  aiRecommendation: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
