const bcrypt = require('bcryptjs');

let databaseAvailable = false;
let seeded = false;

const state = {
    users: [],
    companies: [],
    jobs: [],
    applications: [],
    notifications: [],
    resumes: [],
    assessments: [],
    roadmaps: [],
    githubProfiles: [],
    settings: [],
    logs: []
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const hashPassword = async (password) => bcrypt.hash(password, 12);
const comparePassword = async (candidate, hash) => bcrypt.compare(candidate, hash);

const ensureSeeded = async () => {
    if (seeded) return;

    const adminPassword = await hashPassword('admin123');
    const recruiterPassword = await hashPassword('recruiter123');
    const candidatePassword = await hashPassword('candidate123');

    const company = {
        _id: createId(),
        name: 'TechVision Inc.',
        website: 'https://techvision.example.com',
        industry: 'Technology',
        size: '201-500',
        description: 'Leading AI and cloud solutions provider',
        location: 'San Francisco, CA',
        subscription: 'pro',
        recruiters: [],
        createdAt: new Date(),
        updatedAt: new Date()
    };
    state.companies.push(company);

    const admin = {
        _id: createId(),
        name: 'Platform Admin',
        email: 'admin@recruitment.com',
        password: adminPassword,
        role: 'admin',
        isVerified: true,
        isActive: true,
        avatar: '',
        phone: '',
        location: '',
        bio: '',
        darkMode: false,
        githubUsername: '',
        githubConnected: false,
        skills: [],
        experience: 0,
        companyId: company._id,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const recruiter = {
        _id: createId(),
        name: 'Sarah Mitchell',
        email: 'recruiter@techvision.com',
        password: recruiterPassword,
        role: 'recruiter',
        isVerified: true,
        isActive: true,
        avatar: '',
        phone: '',
        location: 'San Francisco, CA',
        bio: 'Recruiting leader focused on AI and product engineering teams',
        darkMode: false,
        githubUsername: '',
        githubConnected: false,
        skills: ['Hiring', 'Technical Assessment', 'Team Building'],
        experience: 8,
        companyId: company._id,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const candidate = {
        _id: createId(),
        name: 'Alex Chen',
        email: 'alex@example.com',
        password: candidatePassword,
        role: 'candidate',
        isVerified: true,
        isActive: true,
        avatar: '',
        phone: '+1-555-0100',
        location: 'New York, NY',
        bio: 'Full-stack developer passionate about building scalable applications',
        darkMode: false,
        githubUsername: 'alexchen-dev',
        githubConnected: true,
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'AWS'],
        experience: 5,
        companyId: null,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    };

    company.recruiters.push(recruiter._id);
    state.users.push(admin, recruiter, candidate);

    state.jobs.push(
        {
            _id: createId(),
            title: 'Senior Full Stack Engineer',
            company: company._id,
            recruiter: recruiter._id,
            description: 'Build the next-generation recruitment AI platform.',
            requirements: ['5+ years experience', 'React & Node.js expertise', 'System design skills'],
            skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
            experienceMin: 4,
            experienceMax: 8,
            salaryMin: 120000,
            salaryMax: 180000,
            location: 'Remote',
            type: 'full-time',
            status: 'active',
            aiGenerated: false,
            applicationsCount: 1,
            viewsCount: 42,
            deadline: null,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: createId(),
            title: 'Machine Learning Engineer',
            company: company._id,
            recruiter: recruiter._id,
            description: 'Build and deploy ML models for resume screening and matching.',
            requirements: ['3+ years ML experience', 'Python, TensorFlow/PyTorch', 'NLP experience'],
            skills: ['Python', 'TensorFlow', 'NLP', 'Machine Learning', 'AWS'],
            experienceMin: 3,
            experienceMax: 7,
            salaryMin: 140000,
            salaryMax: 200000,
            location: 'San Francisco, CA',
            type: 'full-time',
            status: 'active',
            aiGenerated: false,
            applicationsCount: 0,
            viewsCount: 18,
            deadline: null,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    );

    state.applications.push({
        _id: createId(),
        candidate: candidate._id,
        job: state.jobs[0]._id,
        resume: null,
        status: 'screening',
        aiScore: 87,
        skillMatch: 92,
        ranking: 2,
        notes: '',
        interviewDate: null,
        offerLetter: '',
        timeline: [{ status: 'applied', date: new Date(), note: 'Application submitted' }],
        createdAt: new Date(),
        updatedAt: new Date()
    });

    state.notifications.push(
        { _id: createId(), user: candidate._id, title: 'Application Update', message: 'Your application for Senior Full Stack Engineer is being reviewed', type: 'application', isRead: false, createdAt: new Date() },
        { _id: createId(), user: recruiter._id, title: 'New Application', message: 'Alex Chen applied for Senior Full Stack Engineer', type: 'application', isRead: false, createdAt: new Date() },
        { _id: createId(), user: admin._id, title: 'Platform Ready', message: 'AI Recruitment Platform seeded successfully', type: 'success', isRead: false, createdAt: new Date() }
    );

    state.settings = [
        { _id: createId(), key: 'OPENAI_API_KEY', value: '', category: 'api', isSecret: true, updatedBy: admin._id },
        { _id: createId(), key: 'GITHUB_CLIENT_ID', value: '', category: 'oauth', isSecret: false, updatedBy: admin._id },
        { _id: createId(), key: 'GITHUB_CLIENT_SECRET', value: '', category: 'oauth', isSecret: true, updatedBy: admin._id },
        { _id: createId(), key: 'GITHUB_PAT', value: '', category: 'oauth', isSecret: true, updatedBy: admin._id },
        { _id: createId(), key: 'GOOGLE_CLIENT_ID', value: '', category: 'oauth', isSecret: false, updatedBy: admin._id },
        { _id: createId(), key: 'GOOGLE_CLIENT_SECRET', value: '', category: 'oauth', isSecret: true, updatedBy: admin._id },
        { _id: createId(), key: 'MONGODB_URI', value: 'mongodb://localhost:27017/ai-recruitment', category: 'database', isSecret: true, updatedBy: admin._id },
        { _id: createId(), key: 'JWT_SECRET', value: '', category: 'security', isSecret: true, updatedBy: admin._id },
        { _id: createId(), key: 'SMTP_HOST', value: 'smtp.gmail.com', category: 'email', isSecret: false, updatedBy: admin._id },
        { _id: createId(), key: 'SMTP_PORT', value: '587', category: 'email', isSecret: false, updatedBy: admin._id },
        { _id: createId(), key: 'SMTP_USER', value: '', category: 'email', isSecret: false, updatedBy: admin._id },
        { _id: createId(), key: 'SMTP_PASS', value: '', category: 'email', isSecret: true, updatedBy: admin._id },
        { _id: createId(), key: 'EMAIL_FROM', value: 'noreply@recruitment-platform.com', category: 'email', isSecret: false, updatedBy: admin._id }
    ];

    state.logs.push({ _id: createId(), user: admin._id, action: 'seed', level: 'info', ip: '127.0.0.1', createdAt: new Date() });
    state.roadmaps.push({
        _id: createId(),
        user: candidate._id,
        title: 'Path to Tech Lead',
        nodes: [
            { id: '1', type: 'skill', label: 'JavaScript Mastery', progress: 85, x: 100, y: 200, completed: true },
            { id: '2', type: 'project', label: 'Open Source', progress: 60, x: 300, y: 150 },
            { id: '3', type: 'certification', label: 'AWS Certified', progress: 30, x: 500, y: 200 },
            { id: '4', type: 'company', label: 'Senior Role', progress: 40, x: 700, y: 100 },
            { id: '5', type: 'goal', label: 'Tech Lead', progress: 15, x: 900, y: 200 }
        ],
        connections: [{ from: '1', to: '2' }, { from: '2', to: '3' }, { from: '3', to: '4' }, { from: '4', to: '5' }],
        progress: 45,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    seeded = true;
};

const setDatabaseAvailable = (value) => { databaseAvailable = value; };
const isDatabaseAvailable = () => databaseAvailable;

const getState = async () => {
    await ensureSeeded();
    return state;
};

const createUser = async (data) => {
    await ensureSeeded();
    const existing = state.users.find((item) => item.email.toLowerCase() === data.email.toLowerCase());
    if (existing) return existing;
    const user = {
        _id: createId(),
        ...data,
        password: data.password ? await hashPassword(data.password) : data.password,
        isActive: data.isActive !== false,
        isVerified: data.isVerified || false,
        avatar: data.avatar || '',
        phone: data.phone || '',
        location: data.location || '',
        bio: data.bio || '',
        darkMode: data.darkMode || false,
        githubUsername: data.githubUsername || '',
        githubConnected: data.githubConnected || false,
        skills: data.skills || [],
        experience: data.experience || 0,
        companyId: data.companyId || null,
        lastLogin: data.lastLogin || null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    state.users.push(user);
    return user;
};

const findUserByEmail = async (email, includePassword = false) => {
    await ensureSeeded();
    const user = state.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return includePassword ? user : { ...user, password: undefined };
};

const findUserById = async (id, includePassword = false) => {
    await ensureSeeded();
    const user = state.users.find((item) => item._id === id);
    if (!user) return null;
    return includePassword ? user : { ...user, password: undefined };
};

const updateUser = async (id, data) => {
    await ensureSeeded();
    const index = state.users.findIndex((item) => item._id === id);
    if (index === -1) return null;
    const existing = state.users[index];
    const updated = {
        ...existing,
        ...data,
        _id: existing._id,
        password: data.password ? await hashPassword(data.password) : existing.password,
        updatedAt: new Date()
    };
    state.users[index] = updated;
    return { ...updated, password: undefined };
};

const listUsers = async (filter = {}) => {
    await ensureSeeded();
    let users = state.users.filter((item) => item.isActive !== false);
    if (filter.role) users = users.filter((item) => item.role === filter.role);
    if (filter.search) {
        const regex = new RegExp(filter.search, 'i');
        users = users.filter((item) => regex.test(item.name) || regex.test(item.email));
    }
    return users.map((user) => ({ ...user, password: undefined }));
};

const createCompany = async (data) => {
    await ensureSeeded();
    const company = { _id: createId(), recruiters: [], createdAt: new Date(), updatedAt: new Date(), ...data };
    state.companies.push(company);
    return company;
};

const listCompanies = async () => state.companies.map((item) => ({ ...item }));

const createJob = async (data) => {
    await ensureSeeded();
    const job = { _id: createId(), applicationsCount: 0, viewsCount: 0, createdAt: new Date(), updatedAt: new Date(), ...data };
    state.jobs.push(job);
    return job;
};

const listJobs = async (filter = {}) => {
    await ensureSeeded();
    let jobs = [...state.jobs];
    if (filter.recruiter) jobs = jobs.filter((job) => job.recruiter === filter.recruiter);
    if (filter.status) jobs = jobs.filter((job) => job.status === filter.status);
    if (filter.search) {
        const regex = new RegExp(filter.search, 'i');
        jobs = jobs.filter((job) => regex.test(job.title) || regex.test(job.description));
    }
    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getJobById = async (id) => {
    await ensureSeeded();
    return state.jobs.find((job) => job._id === id) || null;
};

const updateJob = async (id, data) => {
    await ensureSeeded();
    const index = state.jobs.findIndex((job) => job._id === id);
    if (index === -1) return null;
    state.jobs[index] = { ...state.jobs[index], ...data, updatedAt: new Date() };
    return state.jobs[index];
};

const deleteJob = async (id) => {
    await ensureSeeded();
    const index = state.jobs.findIndex((job) => job._id === id);
    if (index === -1) return null;
    const [removed] = state.jobs.splice(index, 1);
    return removed;
};

const createApplication = async (data) => {
    await ensureSeeded();
    const application = { _id: createId(), timeline: [], createdAt: new Date(), updatedAt: new Date(), ...data };
    state.applications.push(application);
    return application;
};

const listApplications = async (filter = {}) => {
    await ensureSeeded();
    let applications = [...state.applications];
    if (filter.candidate) applications = applications.filter((application) => application.candidate === filter.candidate);
    if (filter.job) applications = applications.filter((application) => application.job === filter.job);
    if (filter.recruiter) {
        const recruiterJobs = state.jobs.filter((job) => job.recruiter === filter.recruiter).map((job) => job._id);
        applications = applications.filter((application) => recruiterJobs.includes(application.job));
    }
    return applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const updateApplication = async (id, data) => {
    await ensureSeeded();
    const index = state.applications.findIndex((application) => application._id === id);
    if (index === -1) return null;
    state.applications[index] = { ...state.applications[index], ...data, updatedAt: new Date() };
    return state.applications[index];
};

const createResume = async (data) => {
    await ensureSeeded();
    const resume = { _id: createId(), createdAt: new Date(), updatedAt: new Date(), ...data };
    state.resumes.push(resume);
    return resume;
};

const listResumes = async (filter = {}) => {
    await ensureSeeded();
    return state.resumes.filter((resume) => !filter.user || resume.user === filter.user).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getResumeById = async (id, userId) => {
    await ensureSeeded();
    return state.resumes.find((resume) => resume._id === id && (!userId || resume.user === userId)) || null;
};

const updateResume = async (id, data) => {
    await ensureSeeded();
    const index = state.resumes.findIndex((resume) => resume._id === id);
    if (index === -1) return null;
    state.resumes[index] = { ...state.resumes[index], ...data, updatedAt: new Date() };
    return state.resumes[index];
};

const createAssessment = async (data) => {
    await ensureSeeded();
    const assessment = { _id: createId(), createdAt: new Date(), updatedAt: new Date(), ...data };
    state.assessments.push(assessment);
    return assessment;
};

const listAssessments = async (filter = {}) => {
    await ensureSeeded();
    return state.assessments.filter((assessment) => !filter.user || assessment.user === filter.user).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getAssessmentById = async (id, userId) => {
    await ensureSeeded();
    return state.assessments.find((assessment) => assessment._id === id && (!userId || assessment.user === userId)) || null;
};

const updateAssessment = async (id, data) => {
    await ensureSeeded();
    const index = state.assessments.findIndex((assessment) => assessment._id === id);
    if (index === -1) return null;
    state.assessments[index] = { ...state.assessments[index], ...data, updatedAt: new Date() };
    return state.assessments[index];
};

const createNotification = async (data) => {
    await ensureSeeded();
    const notification = { _id: createId(), isRead: false, createdAt: new Date(), ...data };
    state.notifications.push(notification);
    return notification;
};

const listNotifications = async (userId) => {
    await ensureSeeded();
    return state.notifications.filter((notification) => notification.user === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const markNotificationRead = async (id) => {
    await ensureSeeded();
    const index = state.notifications.findIndex((notification) => notification._id === id);
    if (index === -1) return null;
    state.notifications[index] = { ...state.notifications[index], isRead: true };
    return state.notifications[index];
};

const listSettings = async () => {
    await ensureSeeded();
    return state.settings;
};

const upsertSettings = async (settings, userId) => {
    await ensureSeeded();
    for (const item of settings) {
        const index = state.settings.findIndex((setting) => setting.key === item.key);
        if (index >= 0) {
            state.settings[index] = { ...state.settings[index], ...item, updatedBy: userId };
        } else {
            state.settings.push({ _id: createId(), key: item.key, value: item.value, category: item.category, isSecret: item.isSecret, updatedBy: userId });
        }
    }
    return state.settings;
};

const createLog = async (data) => {
    await ensureSeeded();
    const log = { _id: createId(), createdAt: new Date(), ...data };
    state.logs.push(log);
    return log;
};

const listLogs = async () => {
    await ensureSeeded();
    return state.logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getGitHubProfile = async (userId) => {
    await ensureSeeded();
    return state.githubProfiles.find((profile) => profile.user === userId) || null;
};

const setGitHubProfile = async (userId, profile) => {
    await ensureSeeded();
    const existing = state.githubProfiles.findIndex((item) => item.user === userId);
    const payload = { _id: createId(), user: userId, ...profile, lastSynced: new Date() };
    if (existing >= 0) state.githubProfiles[existing] = payload; else state.githubProfiles.push(payload);
    return payload;
};

const getRoadmap = async (userId) => {
    await ensureSeeded();
    return state.roadmaps.find((roadmap) => roadmap.user === userId) || null;
};

const setRoadmap = async (userId, data) => {
    await ensureSeeded();
    const existing = state.roadmaps.findIndex((item) => item.user === userId);
    const payload = { _id: createId(), user: userId, ...data, createdAt: new Date(), updatedAt: new Date() };
    if (existing >= 0) state.roadmaps[existing] = payload; else state.roadmaps.push(payload);
    return payload;
};

const comparePasswordHash = async (candidate, hash) => comparePassword(candidate, hash);

module.exports = {
    ensureSeeded,
    setDatabaseAvailable,
    isDatabaseAvailable,
    getState,
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    listUsers,
    createCompany,
    listCompanies,
    createJob,
    listJobs,
    getJobById,
    updateJob,
    deleteJob,
    createApplication,
    listApplications,
    updateApplication,
    createResume,
    listResumes,
    getResumeById,
    updateResume,
    createAssessment,
    listAssessments,
    getAssessmentById,
    updateAssessment,
    createNotification,
    listNotifications,
    markNotificationRead,
    listSettings,
    upsertSettings,
    createLog,
    listLogs,
    getGitHubProfile,
    setGitHubProfile,
    getRoadmap,
    setRoadmap,
    comparePasswordHash,
    hashPassword
};
