require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const CareerRoadmap = require('../models/CareerRoadmap');
const config = require('../config');

const seed = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB for seeding...');

    await Promise.all([
      User.deleteMany(), Company.deleteMany(), Job.deleteMany(),
      Application.deleteMany(), Notification.deleteMany(),
      Settings.deleteMany(), CareerRoadmap.deleteMany()
    ]);

    const company = await Company.create({
      name: 'TechVision Inc.',
      website: 'https://techvision.example.com',
      industry: 'Technology',
      size: '201-500',
      description: 'Leading AI and cloud solutions provider',
      location: 'San Francisco, CA',
      subscription: 'pro'
    });

        const recruiter = await User.create({
      name: 'Sarah Mitchell',
      email: 'recruiter@techvision.com',
      password: 'recruiter123',
      role: 'recruiter',
      isVerified: true,
      companyId: company._id,
      skills: ['Hiring', 'Technical Assessment', 'Team Building']
    });

    company.recruiters.push(recruiter._id);
    await company.save();

    const candidate = await User.create({
      name: 'Alex Chen',
      email: 'alex@example.com',
      password: 'candidate123',
      role: 'candidate',
      isVerified: true,
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'AWS'],
      experience: 5,
      location: 'New York, NY',
      bio: 'Full-stack developer passionate about building scalable applications',
      githubUsername: 'alexchen-dev',
      githubConnected: true
    });

    const jobs = await Job.insertMany([
      {
        title: 'Senior Full Stack Engineer',
        company: company._id,
        recruiter: recruiter._id,
        description: 'Join our engineering team to build next-generation recruitment AI platform.',
        requirements: ['5+ years experience', 'React & Node.js expertise', 'System design skills'],
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
        experienceMin: 4, experienceMax: 8,
        salaryMin: 120000, salaryMax: 180000,
        location: 'Remote', type: 'full-time', status: 'active'
      },
      {
        title: 'Machine Learning Engineer',
        company: company._id,
        recruiter: recruiter._id,
        description: 'Build and deploy ML models for resume screening and candidate matching.',
        requirements: ['3+ years ML experience', 'Python, TensorFlow/PyTorch', 'NLP experience'],
        skills: ['Python', 'TensorFlow', 'NLP', 'Machine Learning', 'AWS'],
        experienceMin: 3, experienceMax: 7,
        salaryMin: 140000, salaryMax: 200000,
        location: 'San Francisco, CA', type: 'full-time', status: 'active'
      },
      {
        title: 'Frontend Developer Intern',
        company: company._id,
        recruiter: recruiter._id,
        description: 'Summer internship building beautiful, responsive UIs.',
        requirements: ['CS student', 'HTML/CSS/JS knowledge', 'React basics'],
        skills: ['HTML', 'CSS', 'JavaScript', 'React'],
        experienceMin: 0, experienceMax: 1,
        salaryMin: 25, salaryMax: 35,
        location: 'Remote', type: 'internship', status: 'active'
      }
    ]);

    await Application.create({
      candidate: candidate._id,
      job: jobs[0]._id,
      status: 'screening',
      aiScore: 87,
      skillMatch: 92,
      ranking: 2,
      timeline: [
        { status: 'applied', note: 'Application submitted' },
        { status: 'screening', note: 'AI screening completed - high match' }
      ]
    });

    await CareerRoadmap.create({
      user: candidate._id,
      title: 'Path to Tech Lead',
      nodes: [
        { id: '1', type: 'skill', label: 'JavaScript Mastery', progress: 85, x: 100, y: 200, completed: true },
        { id: '2', type: 'project', label: 'Open Source', progress: 60, x: 300, y: 150 },
        { id: '3', type: 'certification', label: 'AWS Certified', progress: 30, x: 500, y: 200 },
        { id: '4', type: 'company', label: 'Senior Role', progress: 40, x: 700, y: 100 },
        { id: '5', type: 'goal', label: 'Tech Lead', progress: 15, x: 900, y: 200 }
      ],
      connections: [
        { from: '1', to: '2' }, { from: '2', to: '3' },
        { from: '3', to: '4' }, { from: '4', to: '5' }
      ],
      progress: 45
    });

    await Notification.insertMany([
      { user: candidate._id, title: 'Application Update', message: 'Your application for Senior Full Stack Engineer is being reviewed', type: 'application' },
      { user: recruiter._id, title: 'New Application', message: 'Alex Chen applied for Senior Full Stack Engineer', type: 'application' }
    ]);

    const defaultSettings = [
      { key: 'OPENAI_API_KEY', value: '', category: 'api', isSecret: true },
      { key: 'GITHUB_CLIENT_ID', value: '', category: 'oauth', isSecret: false },
      { key: 'GITHUB_CLIENT_SECRET', value: '', category: 'oauth', isSecret: true },
      { key: 'GITHUB_PAT', value: '', category: 'oauth', isSecret: true },
      { key: 'GOOGLE_CLIENT_ID', value: '', category: 'oauth', isSecret: false },
      { key: 'GOOGLE_CLIENT_SECRET', value: '', category: 'oauth', isSecret: true },
      { key: 'GMAIL_CLIENT_ID', value: '', category: 'email', isSecret: false },
      { key: 'GMAIL_CLIENT_SECRET', value: '', category: 'email', isSecret: true },
      { key: 'OUTLOOK_CLIENT_ID', value: '', category: 'email', isSecret: false },
      { key: 'OUTLOOK_CLIENT_SECRET', value: '', category: 'email', isSecret: true },
      { key: 'MONGODB_URI', value: config.mongodbUri, category: 'database', isSecret: true },
      { key: 'JWT_SECRET', value: '', category: 'security', isSecret: true },
      { key: 'SMTP_HOST', value: 'smtp.gmail.com', category: 'email', isSecret: false },
      { key: 'SMTP_PORT', value: '587', category: 'email', isSecret: false },
      { key: 'SMTP_USER', value: '', category: 'email', isSecret: false },
      { key: 'SMTP_PASS', value: '', category: 'email', isSecret: true },
      { key: 'EMAIL_FROM', value: 'noreply@recruitment-platform.com', category: 'email', isSecret: false }
    ];
    await Settings.insertMany(defaultSettings);

    console.log('\n✅ Seed completed!\n');
    console.log('Demo Accounts:');
    console.log('  Recruiter: recruiter@techvision.com / recruiter123');
    console.log('  Candidate: alex@example.com / candidate123\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
