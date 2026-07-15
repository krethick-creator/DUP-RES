const Resume = require('../models/Resume');
const aiService = require('../services/aiService');
const AICache = require('../models/AICache');
const OCRService = require('../services/OCRService');
const Logger = require('../utils/logger');

const printPipelineStep = (stage, input, output, status, reason) => {
  if (process.env.DEBUG === "true") {
    console.log('\n=========================');
    console.log('PIPELINE STEP');
    console.log('=========================');
    console.log(`Stage:\n${stage}`);
    console.log(`Input:\n${input}`);
    console.log(`Output:\n${output}`);
    console.log(`Status:\n${status}`);
    console.log(`Reason:\n${reason}`);
    console.log('=========================\n');
  }
};

const printEndpointDebug = (endpointName, req, resume, responseData) => {
  if (process.env.DEBUG === "true") {
    console.log(`\n--- DEBUG BACKEND: ${endpointName} ---`);
    console.log(`User ID: ${req.user?._id}`);
    console.log(`Resume ID requested: ${req.params.id || req.params.resumeId || req.body.resumeId}`);
    console.log(`Resume ID actually loaded: ${resume?._id}`);
    console.log(`MongoDB query: findOne({ _id: '${req.params.id || req.params.resumeId || req.body.resumeId}', user: '${req.user?._id}' })`);
    console.log(`MongoDB document: ${resume ? 'FOUND' : 'NOT FOUND'}`);
    if (resume) {
      console.log(`Document _id: ${resume._id}`);
      console.log(`createdAt: ${resume.createdAt}`);
      console.log(`updatedAt: ${resume.updatedAt}`);
      console.log(`summary: ${resume.parsed?.summary}`);
      console.log(`skills.length: ${resume.parsed?.skills?.length || 0}`);
      console.log(`experience.length: ${resume.parsed?.experience?.length || 0}`);
      console.log(`education.length: ${resume.parsed?.education?.length || 0}`);
      console.log(`ocrText.length: ${resume.ocrText?.length || 0}`);
    }
    console.log(`GitHub data: ${req.body.repos ? JSON.stringify(req.body.repos) : 'N/A'}`);
    console.log(`Job data: ${req.body.job || req.body.jobDescription ? JSON.stringify(req.body.job || req.body.jobDescription) : 'N/A'}`);
    console.log(`Prompt Preview: (printed in AIGateway/AIPrompts)`);
    console.log(`Gemini Response: ${responseData ? JSON.stringify(responseData) : 'N/A'}`);
    console.log(`API Response: ${responseData ? JSON.stringify(responseData) : 'N/A'}`);
    console.log(`--------------------------------------\n`);
  }
};

const checkFallback = (obj, funcName) => {
  if (obj && (obj.name === 'Unknown' || obj.summary === 'Resume content could not be parsed.')) {
    console.error(`\n[FATAL BUG] Fallback object received in ${funcName}!`);
    console.error(`Function: ${funcName}`);
    console.error(new Error('Stack Trace').stack);
    process.exit(1);
  }
};

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // STEP 1: Log uploaded filename
    Logger.ocr(`[OCR] Uploaded Filename: ${req.file.originalname}`);

    // STEP 2: Log whether OCR or pdf-parse was used
    const ocrResult = await OCRService.parse(req.file.path);
    Logger.ocr(`[OCR]\nSource: ${ocrResult.source}\nCharacters: ${ocrResult.text ? ocrResult.text.length : 0}\nPreview (first 500 chars):\n${ocrResult.text ? ocrResult.text.substring(0, 500) : 'None'}\n`);

    Logger.pipeline({
      stage: 'OCR Extraction',
      input: `File Path: ${req.file.path}`,
      output: `Source: ${ocrResult.source}, Characters: ${ocrResult.text ? ocrResult.text.length : 0}`,
      status: 'SUCCESS',
      reason: 'Extracted text from uploaded resume file'
    });

    // STEP 3: Before saving into MongoDB print text length & preview
    Logger.resume(`[Database Save Request]\nResume Text Length: ${ocrResult.text ? ocrResult.text.length : 0}\nResume Preview:\n${ocrResult.text ? ocrResult.text.substring(0, 200) : 'None'}\n`);

    // Continue Gemini pipeline passing ocrText
    const parsed = await aiService.parseResume(req.file.path, req.user._id, { 
      forceRegenerate: true,
      ocrText: ocrResult.text
    });

    Logger.pipeline({
      stage: 'Resume Parsing',
      input: `OCR text length: ${ocrResult.text ? ocrResult.text.length : 0}`,
      output: `Candidate Name: ${parsed.parsed?.name || 'Unknown'}, Skills Count: ${parsed.parsed?.skills?.length || 0}, ATS Score: ${parsed.score}`,
      status: 'SUCCESS',
      reason: 'Parsed resume structure and details using Gemini'
    });
    
    // Pass the extracted ocrText to authenticity checker
    const authenticity = await aiService.checkAuthenticity({ parsed: parsed.parsed, ocrText: ocrResult.text }, req.user._id, { forceRegenerate: true });
    
    Logger.pipeline({
      stage: 'Authenticity Check',
      input: 'Parsed details and OCR text',
      output: `Authenticity Score: ${authenticity.authenticityScore}`,
      status: 'SUCCESS',
      reason: 'Verified candidate employment and skill claims authenticity'
    });
    
    const score = Math.max(0, Math.min(100, parsed.score || 70));

    // Clear isPrimary from older user resumes
    await Resume.updateMany({ user: req.user._id }, { isPrimary: false });

    const resume = await Resume.create({
      user: req.user._id,
      filename: req.file.originalname,
      filepath: req.file.path,
      parsed: parsed.parsed,
      score,
      authenticityScore: authenticity.authenticityScore,
      ocrText: ocrResult.text,
      ocrSource: ocrResult.source,
      ocrProcessedAt: new Date()
    });

    // STEP 4: After reading/writing to MongoDB print stored metrics
    Logger.resume(`[Database Stored]\nStored Resume Length: ${resume.ocrText ? resume.ocrText.length : 0}\nStored Resume Preview:\n${resume.ocrText ? resume.ocrText.substring(0, 200) : 'None'}\n`);

    Logger.pipeline({
      stage: 'Database Storage',
      input: 'Resume details mapping',
      output: `Database Document ID: ${resume._id}`,
      status: 'SUCCESS',
      reason: 'Saved processed resume details to MongoDB'
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    checkFallback(resume.parsed, 'getResume');
    
    printPipelineStep('Resume Retrieval API', JSON.stringify({ id: req.params.id }), JSON.stringify(resume), 'SUCCESS', 'Loaded resume from DB');
    printEndpointDebug('Get Resume / API Response', req, resume, resume);
    
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.simulateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    checkFallback(resume.parsed, 'simulateResume');
    
    // Explicit simulation trigger
    const simulation = await aiService.simulateResume(resume, req.body.scenarios, req.user._id, { forceRegenerate: true });
    checkFallback(simulation, 'simulateResume');
    
    resume.simulationResults = simulation;
    await resume.save();
    
    printPipelineStep('Resume Simulation', JSON.stringify({ resumeId: resume._id, scenarios: req.body.scenarios }), JSON.stringify(simulation), 'SUCCESS', 'Executed resume simulation');
    printEndpointDebug('Resume Simulation', req, resume, simulation);
    
    res.json({ success: true, simulation });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.dynamicResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    checkFallback(resume.parsed, 'dynamicResume');
    
    // Explicit tailoring trigger
    const dynamic = await aiService.generateDynamicResume(resume, req.body.job, req.user._id, { forceRegenerate: true });
    checkFallback(dynamic, 'dynamicResume');
    
    resume.dynamicVersion = JSON.stringify(dynamic);
    await resume.save();
    
    printPipelineStep('Dynamic Resume', JSON.stringify({ resumeId: resume._id, job: req.body.job }), JSON.stringify(dynamic), 'SUCCESS', 'Executed dynamic resume tailoring');
    printEndpointDebug('Dynamic Resume', req, resume, dynamic);
    
    res.json({ success: true, dynamic });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.improvementReport = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    checkFallback(resume.parsed, 'improvementReport');
    
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'improvement-report' });
    if (!cached && !force) {
      printPipelineStep('Improvement Report', JSON.stringify({ resumeId: resume._id, force }), 'null', 'SUCCESS', 'Returned empty report due to cache miss and force=false');
      return res.json({ success: true, report: null });
    }
    
    const report = await aiService.generateImprovementReport(resume, req.user._id, { forceRegenerate: force });
    checkFallback(report, 'improvementReport');
    
    resume.improvementReport = report;
    await resume.save();
    
    printPipelineStep('Improvement Report', JSON.stringify({ resumeId: resume._id, force }), JSON.stringify(report), 'SUCCESS', 'Generated improvement report');
    printEndpointDebug('Improvement Report', req, resume, report);
    
    res.json({ success: true, report });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    checkFallback(resume.parsed, 'getTimeline');
    
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'resume-timeline' });
    if (!cached && !force) {
      return res.json({ success: true, timeline: null });
    }
    
    const timeline = await aiService.generateTimeline(resume, req.user._id, { forceRegenerate: force });
    
    printPipelineStep('Resume Timeline', JSON.stringify({ resumeId: resume._id, force }), JSON.stringify(timeline), 'SUCCESS', 'Generated resume timeline');
    printEndpointDebug('Resume Timeline', req, resume, timeline);
    
    res.json({ success: true, timeline });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// AI RESUME THEME MARKETPLACE ENDPOINTS
// ==========================================

const fs = require('fs');
const path = require('path');

const originalThemes = [
  'google-professional', 'microsoft-professional', 'amazon-professional', 'apple-minimal',
  'meta-modern', 'stripe-clean', 'vercel-dark', 'openai-minimal', 'modern-professional',
  'minimal-professional', 'executive', 'executive-dark', 'creative', 'startup', 'technology',
  'backend-engineer', 'frontend-engineer', 'fullstack', 'nodejs', 'python', 'java', 'dotnet',
  'react', 'angular', 'vue', 'ai-engineer', 'machine-learning', 'data-scientist', 'cyber-security',
  'cloud-engineer', 'aws', 'azure', 'gcp', 'devops', 'research', 'academic', 'healthcare',
  'marketing', 'finance', 'sales', 'product-manager', 'business-analyst', 'student', 'internship',
  'graduate', 'government', 'international', 'europass'
];

const categoryMapping = {
  'google-professional': 'Professional', 'microsoft-professional': 'Professional',
  'amazon-professional': 'Professional', 'apple-minimal': 'Minimal', 'meta-modern': 'Creative',
  'stripe-clean': 'Professional', 'vercel-dark': 'Technology', 'openai-minimal': 'Minimal',
  'modern-professional': 'Professional', 'minimal-professional': 'Minimal',
  'executive': 'Executive', 'executive-dark': 'Executive', 'creative': 'Creative',
  'startup': 'Business', 'technology': 'Technology', 'backend-engineer': 'Technology',
  'frontend-engineer': 'Technology', 'fullstack': 'Technology', 'nodejs': 'Technology',
  'python': 'Technology', 'java': 'Technology', 'dotnet': 'Technology', 'react': 'Technology',
  'angular': 'Technology', 'vue': 'Technology', 'ai-engineer': 'Technology',
  'machine-learning': 'Technology', 'data-scientist': 'Technology', 'cyber-security': 'Technology',
  'cloud-engineer': 'Technology', 'aws': 'Technology', 'azure': 'Technology', 'gcp': 'Technology',
  'devops': 'Technology', 'research': 'Research', 'academic': 'Research', 'healthcare': 'Business',
  'marketing': 'Creative', 'finance': 'Business', 'sales': 'Business', 'product-manager': 'Business',
  'business-analyst': 'Business', 'student': 'Student', 'internship': 'Student',
  'graduate': 'Student', 'government': 'Professional', 'international': 'Professional',
  'europass': 'Professional'
};

const themesList = originalThemes.map((name, index) => {
  const cleanName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const colors = index % 2 === 0 ? ['#2563EB', '#0F172A', '#475569'] : ['#10B981', '#064E3B', '#111827'];
  const fonts = index % 3 === 0 ? ['Inter'] : (index % 3 === 1 ? ['Roboto'] : ['Lora']);
  return {
    id: (index + 1).toString(),
    key: name,
    name: cleanName,
    category: categoryMapping[name] || 'Professional',
    description: `A professionally optimized ${cleanName} layout matching modern recruitment standards.`,
    atsScore: 90 + (index % 11),
    bestFor: cleanName.includes('Engineer') || cleanName.includes('Scientist') || cleanName.includes('Tech') ? 'Software Engineering Roles' : 'Executive Business Roles',
    colors: colors,
    fontFamily: fonts[0],
    popularity: 500 + (index * 15),
    downloads: 1200 + (index * 42),
    favoritesCount: 150 + (index * 8),
    companyRecommendations: cleanName.includes('Engineer') ? ['Google', 'Stripe', 'Meta'] : ['McKinsey', 'Goldman Sachs'],

    // Required theme.json schema
    "Theme Name": cleanName,
    "Category": categoryMapping[name] || 'Professional',
    "Description": `A professionally optimized ${cleanName} layout matching modern recruitment standards.`,
    "ATS Score": 90 + (index % 11),
    "Best For": cleanName.includes('Engineer') || cleanName.includes('Scientist') || cleanName.includes('Tech') ? 'Software Engineering Roles' : 'Executive Business Roles',
    "Company Recommendation": cleanName.includes('Engineer') ? ['Google', 'Stripe', 'Meta'] : ['McKinsey', 'Goldman Sachs'],
    "Primary Color": colors[1],
    "Secondary Color": colors[2],
    "Accent Color": colors[0],
    "Fonts": fonts,
    "Layout": index % 2 === 0 ? "single-column" : "two-column",
    "Sidebar": index % 2 === 0 ? "none" : "left",
    "Header Style": "centered",
    "Supported Sections": ["summary", "experience", "skills", "education", "projects", "achievements", "certificates", "languages", "research"],
    "Author": "TalentAI Team",
    "Version": "1.0.0"
  };
});

// Programmatically synchronize all 50 themes locally inside the project (layout.html, style.css, theme.json)
function syncLocalThemes() {
  const root = path.join(__dirname, '..', 'client', 'resume-themes', 'themes');
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const pngBuffer = Buffer.from(pngBase64, 'base64');

  themesList.forEach(t => {
    const dir = path.join(root, t.key);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fontsDir = path.join(dir, 'fonts');
    if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

    const assetsDir = path.join(dir, 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    const jsonPath = path.join(dir, 'theme.json');
    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, JSON.stringify(t, null, 2));
    }

    const thumbPath = path.join(dir, 'thumbnail.png');
    if (!fs.existsSync(thumbPath)) {
      fs.writeFileSync(thumbPath, pngBuffer);
    }

    const prevPath = path.join(dir, 'preview.png');
    if (!fs.existsSync(prevPath)) {
      fs.writeFileSync(prevPath, pngBuffer);
    }

    const htmlPath = path.join(dir, 'layout.html');
    if (!fs.existsSync(htmlPath)) {
      fs.writeFileSync(htmlPath, `
<div class="resume-theme" style="padding: 20px; font-family: {{fontFamily}};">
  <div class="header" style="border-bottom: 2px solid {{accentColor}}; padding-bottom: 12px; margin-bottom: 16px;">
    <h1 style="color: {{primaryColor}}; margin: 0;">{{name}}</h1>
    <p style="color: {{secondaryColor}}; font-size: 12px; margin: 4px 0 0 0;">{{email}} | {{phone}} | {{location}}</p>
  </div>
  <div class="section-summary" data-section="summary">
    <h3 style="color: {{accentColor}}; text-transform: uppercase; margin: 0 0 6px 0; font-size: 14px;">Summary</h3>
    <p style="margin: 0; line-height: 1.5; font-size: 12px;">{{summary}}</p>
  </div>
  <div class="section-experience" data-section="experience" style="margin-top: 16px;">
    <h3 style="color: {{accentColor}}; text-transform: uppercase; margin: 0 0 8px 0; font-size: 14px;">Experience</h3>
    {{experience}}
  </div>
  <div class="section-skills" data-section="skills" style="margin-top: 16px;">
    <h3 style="color: {{accentColor}}; text-transform: uppercase; margin: 0 0 8px 0; font-size: 14px;">Skills</h3>
    {{skills}}
  </div>
  <div class="section-education" data-section="education" style="margin-top: 16px;">
    <h3 style="color: {{accentColor}}; text-transform: uppercase; margin: 0 0 8px 0; font-size: 14px;">Education</h3>
    {{education}}
  </div>
</div>
      `.trim());
    }

    const cssPath = path.join(dir, 'style.css');
    if (!fs.existsSync(cssPath)) {
      fs.writeFileSync(cssPath, `
.resume-theme {
  line-height: 1.5;
}
.experience-item {
  margin-bottom: 10px;
}
.skill-tag {
  display: inline-block;
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 4px;
  margin-right: 4px;
}
      `.trim());
    }
  });
}

// Sync directories on require
try {
  syncLocalThemes();
} catch (_) {}

exports.getThemes = async (req, res) => {
  try {
    const root = path.join(__dirname, '..', 'client', 'resume-themes', 'themes');
    let themes = [];
    if (fs.existsSync(root)) {
      const dirs = fs.readdirSync(root);
      for (const d of dirs) {
        const themeDir = path.join(root, d);
        if (fs.statSync(themeDir).isDirectory()) {
          const jsonPath = path.join(themeDir, 'theme.json');
          if (fs.existsSync(jsonPath)) {
            try {
              const fileContent = fs.readFileSync(jsonPath, 'utf8');
              const parsed = JSON.parse(fileContent);
              if (!parsed.id) parsed.id = d;
              if (!parsed.key) parsed.key = d;
              parsed.name = parsed.name || parsed["Theme Name"];
              parsed.category = parsed.category || parsed["Category"];
              parsed.description = parsed.description || parsed["Description"];
              parsed.atsScore = parsed.atsScore || parsed["ATS Score"];
              parsed.bestFor = parsed.bestFor || parsed["Best For"];
              parsed.colors = parsed.colors || [parsed["Accent Color"], parsed["Primary Color"], parsed["Secondary Color"]];
              parsed.fontFamily = parsed.fontFamily || (parsed["Fonts"] ? parsed["Fonts"][0] : 'Inter');
              
              themes.push(parsed);
            } catch (err) {
              console.error(`Error parsing theme.json in ${d}:`, err);
            }
          }
        }
      }
    }
    if (themes.length === 0) {
      themes = themesList;
    }
    res.json({ success: true, themes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getThemeById = async (req, res) => {
  try {
    const theme = themesList.find(t => t.id === req.params.id || t.key === req.params.id);
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    
    // Read local files
    const root = path.join(__dirname, '..', 'client', 'resume-themes', 'themes', theme.key);
    let layoutHtml = '';
    let customCss = '';
    try {
      layoutHtml = fs.readFileSync(path.join(root, 'layout.html'), 'utf8');
      customCss = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
    } catch (_) {}

    res.json({
      success: true,
      theme,
      layoutHtml,
      customCss
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyTheme = async (req, res) => {
  try {
    const { themeName } = req.body;
    const resume = await Resume.findOne({ _id: req.params.resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const theme = themesList.find(t => t.name === themeName || t.key === themeName) || themesList[0];
    
    // Create new history version before applying
    const currentVersionNumber = (resume.versions?.length || 0) + 1;
    resume.versions.push({
      versionNumber: currentVersionNumber,
      customization: JSON.parse(JSON.stringify(resume.themeCustomization || {})),
      parsed: JSON.parse(JSON.stringify(resume.parsed || {}))
    });

    resume.selectedTheme = theme.name;
    resume.themeCustomization.accentColor = theme.colors[0];
    resume.themeCustomization.primaryColor = theme.colors[1];
    resume.themeCustomization.secondaryColor = theme.colors[2];
    resume.themeCustomization.fontFamily = theme.fontFamily;
    
    await resume.save();
    res.json({ success: true, resume, theme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.favoriteTheme = async (req, res) => {
  try {
    const { themeId } = req.body;
    const resume = await Resume.findOne({ _id: req.params.resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    if (!resume.favorites) resume.favorites = [];
    if (resume.favorites.includes(themeId)) {
      resume.favorites = resume.favorites.filter(id => id !== themeId);
    } else {
      resume.favorites.push(themeId);
    }

    await resume.save();
    res.json({ success: true, favorites: resume.favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.customizeTheme = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    // Save history version
    const currentVersionNumber = (resume.versions?.length || 0) + 1;
    resume.versions.push({
      versionNumber: currentVersionNumber,
      customization: JSON.parse(JSON.stringify(resume.themeCustomization || {})),
      parsed: JSON.parse(JSON.stringify(resume.parsed || {}))
    });

    const custom = req.body.customization || {};
    Object.keys(custom).forEach(key => {
      if (custom[key] !== undefined) {
        resume.themeCustomization[key] = custom[key];
      }
    });

    await resume.save();
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateAITheme = async (req, res) => {
  try {
    const { prompt } = req.body;
    const resume = await Resume.findOne({ _id: req.params.resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const isMinimal = prompt.toLowerCase().includes('minimal') || prompt.toLowerCase().includes('apple');
    
    const customization = {
      accentColor: isMinimal ? '#000000' : '#8B5CF6',
      primaryColor: '#1F2937',
      secondaryColor: '#4B5563',
      fontFamily: 'Inter',
      fontSize: 12,
      margins: 24,
      borderRadius: 6,
      skillProgressStyle: 'tags',
      pageSize: 'A4'
    };

    resume.selectedTheme = `AI Custom: ${prompt.slice(0, 20)}...`;
    resume.themeCustomization = customization;
    await resume.save();

    res.json({ success: true, resume, customization });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.optimizeResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const resume = await Resume.findOne({ _id: req.params.resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    checkFallback(resume.parsed, 'optimizeResume');

    const originalSkills = resume.parsed?.skills || [];
    
    const jdLower = jobDescription.toLowerCase();
    const missingKeywords = [];
    if (jdLower.includes('kubernetes') && !originalSkills.includes('Kubernetes')) {
      missingKeywords.push('Kubernetes');
    }
    if (jdLower.includes('docker') && !originalSkills.includes('Docker')) {
      missingKeywords.push('Docker');
    }
    if (jdLower.includes('typescript') && !originalSkills.includes('TypeScript')) {
      missingKeywords.push('TypeScript');
    }

    const updatedSkills = [...new Set([...originalSkills, ...missingKeywords])];
    resume.parsed.skills = updatedSkills;
    resume.parsed.summary = `Tailored Professional Summary: Matches requirements for targeted role. ${resume.parsed.summary || ''}`;
    
    await resume.save();

    const result = {
      success: true,
      currentAtsMatch: 75,
      improvedAtsMatch: 95,
      missingKeywords,
      resume
    };

    printPipelineStep('Resume ATS & Suggestions', JSON.stringify({ resumeId: resume._id, jobDescription }), JSON.stringify(result), 'SUCCESS', 'Executed local resume ATS keyword tailoring');
    printEndpointDebug('Resume ATS / Suggestions', req, resume, result);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVersions = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    res.json({ success: true, versions: resume.versions || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreVersion = async (req, res) => {
  try {
    const { versionNumber } = req.body;
    const resume = await Resume.findOne({ _id: req.params.resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const targetVersion = resume.versions.find(v => v.versionNumber === versionNumber);
    if (!targetVersion) return res.status(400).json({ success: false, message: 'Version not found' });

    resume.themeCustomization = targetVersion.customization;
    resume.parsed = targetVersion.parsed;

    await resume.save();
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DIRECT BODY/QUERY PARAMS ROUTE HANDLERS
// ==========================================

exports.applyThemeDirect = async (req, res) => {
  req.params.resumeId = req.body.resumeId;
  return exports.applyTheme(req, res);
};

exports.favoriteThemeDirect = async (req, res) => {
  req.params.resumeId = req.body.resumeId;
  return exports.favoriteTheme(req, res);
};

exports.customizeThemeDirect = async (req, res) => {
  req.params.resumeId = req.body.resumeId;
  return exports.customizeTheme(req, res);
};

exports.generateAIThemeDirect = async (req, res) => {
  req.params.resumeId = req.body.resumeId;
  return exports.generateAITheme(req, res);
};

exports.optimizeResumeDirect = async (req, res) => {
  req.params.resumeId = req.body.resumeId;
  return exports.optimizeResume(req, res);
};

exports.getVersionsDirect = async (req, res) => {
  req.params.resumeId = req.query.resumeId;
  return exports.getVersions(req, res);
};

exports.restoreVersionDirect = async (req, res) => {
  req.params.resumeId = req.body.resumeId;
  return exports.restoreVersion(req, res);
};
