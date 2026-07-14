const assert = require('assert');
const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const User = require('../models/User');
const resumeController = require('../controllers/resumeController');
const config = require('../config');

describe('Resume Themes Controller Unit Tests', function() {
  this.timeout(10000);
  let tokenUser;
  let testResume;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }

    // Create a mock user and a resume
    tokenUser = await User.create({
      name: 'Test Candidate',
      email: `candidate-${Date.now()}@test.com`,
      password: 'password123',
      role: 'candidate'
    });

    testResume = await Resume.create({
      user: tokenUser._id,
      filename: 'sample_resume.pdf',
      filepath: 'uploads/sample_resume.pdf',
      parsed: {
        name: 'Test Candidate',
        email: tokenUser.email,
        skills: ['JavaScript', 'Python']
      }
    });
  });

  after(async () => {
    if (tokenUser) {
      await Resume.deleteMany({ user: tokenUser._id });
      await User.deleteOne({ _id: tokenUser._id });
    }
    await mongoose.connection.close();
  });

  it('should get themes list (at least 30 unique templates)', async () => {
    const req = {};
    let statusVal, jsonVal;
    const res = {
      status: (s) => { statusVal = s; return res; },
      json: (j) => { jsonVal = j; return res; }
    };

    await resumeController.getThemes(req, res);
    assert.strictEqual(jsonVal.success, true);
    assert.ok(Array.isArray(jsonVal.themes));
    assert.ok(jsonVal.themes.length >= 30);
  });

  it('should apply selected theme', async () => {
    const req = {
      params: { resumeId: testResume._id },
      user: tokenUser,
      body: { themeName: 'Minimal Professional' }
    };
    let jsonVal;
    const res = {
      status: (s) => res,
      json: (j) => { jsonVal = j; return res; }
    };

    await resumeController.applyTheme(req, res);
    assert.strictEqual(jsonVal.success, true);
    assert.strictEqual(jsonVal.resume.selectedTheme, 'Minimal Professional');
  });

  it('should update visual customizations', async () => {
    const req = {
      params: { resumeId: testResume._id },
      user: tokenUser,
      body: {
        customization: {
          accentColor: '#FF5733',
          margins: 25,
          pageSize: 'Letter'
        }
      }
    };
    let jsonVal;
    const res = {
      status: (s) => res,
      json: (j) => { jsonVal = j; return res; }
    };

    await resumeController.customizeTheme(req, res);
    assert.strictEqual(jsonVal.success, true);
    assert.strictEqual(jsonVal.resume.themeCustomization.accentColor, '#FF5733');
    assert.strictEqual(jsonVal.resume.themeCustomization.margins, 25);
    assert.strictEqual(jsonVal.resume.themeCustomization.pageSize, 'Letter');
  });

  it('should favorite a theme', async () => {
    const req = {
      params: { resumeId: testResume._id },
      user: tokenUser,
      body: { themeId: 'google-professional' }
    };
    let jsonVal;
    const res = {
      status: (s) => res,
      json: (j) => { jsonVal = j; return res; }
    };

    await resumeController.favoriteTheme(req, res);
    assert.strictEqual(jsonVal.success, true);
    assert.ok(jsonVal.favorites.includes('google-professional'));
  });

  it('should generate custom layout with AI Theme Generator', async () => {
    const req = {
      params: { resumeId: testResume._id },
      user: tokenUser,
      body: { prompt: 'Inspired by Apple minimalist styling' }
    };
    let jsonVal;
    const res = {
      status: (s) => res,
      json: (j) => { jsonVal = j; return res; }
    };

    await resumeController.generateAITheme(req, res);
    assert.strictEqual(jsonVal.success, true);
    assert.ok(jsonVal.resume.selectedTheme.includes('Apple'));
  });

  it('should optimize skills and summaries with JD keyword optimizer', async () => {
    const req = {
      params: { resumeId: testResume._id },
      user: tokenUser,
      body: { jobDescription: 'Looking for a developer with expert knowledge in Kubernetes and Docker.' }
    };
    let jsonVal;
    const res = {
      status: (s) => res,
      json: (j) => { jsonVal = j; return res; }
    };

    await resumeController.optimizeResume(req, res);
    assert.strictEqual(jsonVal.success, true);
    assert.ok(jsonVal.improvedAtsMatch > 75);
    assert.ok(jsonVal.missingKeywords.includes('Kubernetes'));
  });

  it('should log versions checkpoints list and restore back', async () => {
    const reqList = {
      params: { resumeId: testResume._id },
      user: tokenUser
    };
    let jsonValList;
    const resList = {
      status: (s) => resList,
      json: (j) => { jsonValList = j; return resList; }
    };

    await resumeController.getVersions(reqList, resList);
    assert.strictEqual(jsonValList.success, true);
    assert.ok(jsonValList.versions.length > 0);

    const reqRestore = {
      params: { resumeId: testResume._id },
      user: tokenUser,
      body: { versionNumber: 1 }
    };
    let jsonValRestore;
    const resRestore = {
      status: (s) => resRestore,
      json: (j) => { jsonValRestore = j; return resRestore; }
    };

    await resumeController.restoreVersion(reqRestore, resRestore);
    assert.strictEqual(jsonValRestore.success, true);
  });
});
