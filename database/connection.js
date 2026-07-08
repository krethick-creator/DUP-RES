const mongoose = require('mongoose');
const config = require('../config');
const fallbackStore = require('../utils/fallbackStore');

const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Assessment = require('../models/Assessment');
const GitHubProfile = require('../models/GitHubProfile');
const CareerRoadmap = require('../models/CareerRoadmap');
const Notification = require('../models/Notification');
const Log = require('../models/Log');
const Settings = require('../models/Settings');

const createQuery = (resultPromise, { modelName, selection, sort, skip, limit } = {}) => {
  const query = {
    select(sel) {
      query.selection = sel;
      return query;
    },
    populate() { return query; },
    sort(sortValue) {
      query.sortValue = sortValue;
      return query;
    },
    skip(skipValue) {
      query.skipValue = skipValue;
      return query;
    },
    limit(limitValue) {
      query.limitValue = limitValue;
      return query;
    },
    exec() {
      return Promise.resolve(resultPromise).then((result) => applyQuery(result, query));
    },
    then(resolve, reject) {
      return Promise.resolve(resultPromise).then((result) => resolve(applyQuery(result, query)), reject);
    },
    catch(reject) {
      return Promise.resolve(resultPromise).catch(reject);
    },
    finally(callback) {
      return Promise.resolve(resultPromise).finally(callback);
    }
  };
  return query;
};

const applyQuery = (result, query) => {
  let data = result;
  if (Array.isArray(data)) {
    if (query.sortValue) {
      const direction = query.sortValue.startsWith('-') ? -1 : 1;
      const key = query.sortValue.replace(/^[+-]/, '');
      data = [...data].sort((a, b) => {
        const left = a[key];
        const right = b[key];
        if (left < right) return -1 * direction;
        if (left > right) return 1 * direction;
        return 0;
      });
    }
    if (typeof query.skipValue === 'number') data = data.slice(query.skipValue);
    if (typeof query.limitValue === 'number') data = data.slice(0, query.limitValue);
  }
  if (query.selection && modelName === 'User' && data && typeof data === 'object') {
    const selection = query.selection;
    const shouldKeepPassword = selection.includes('+password');
    if (!shouldKeepPassword) {
      const clone = { ...data };
      delete clone.password;
      return clone;
    }
  }
  return data;
};

const decorateDocument = (modelName, data, saveHandler) => {
  const doc = { ...data };
  doc.save = async function () {
    return saveHandler(this);
  };
  doc.toObject = () => ({ ...doc });
  doc.toJSON = () => ({ ...doc });
  if (modelName === 'User' && typeof doc.comparePassword !== 'function') {
    doc.comparePassword = async function (candidatePassword) {
      return fallbackStore.comparePasswordHash(candidatePassword, this.password);
    };
  }
  return doc;
};

const patchModel = (Model, modelName, handlers) => {
  if (Model.__fallbackPatched) return;
  Model.find = (filter = {}) => createQuery(Promise.resolve(handlers.find(filter)), { modelName });
  Model.findOne = (filter = {}) => createQuery(Promise.resolve(handlers.findOne(filter)), { modelName });
  Model.findById = (id) => createQuery(Promise.resolve(handlers.findById(id)), { modelName });
  Model.findOneAndUpdate = async (filter, update, options = {}) => {
    const result = await handlers.findOneAndUpdate(filter, update, options);
    return decorateDocument(modelName, result, handlers.save);
  };
  Model.findByIdAndUpdate = async (id, update, options = {}) => {
    const result = await handlers.findByIdAndUpdate(id, update, options);
    return decorateDocument(modelName, result, handlers.save);
  };
  Model.findByIdAndDelete = async (id) => handlers.findByIdAndDelete(id);
  Model.create = async (data) => {
    const result = await handlers.create(data);
    return decorateDocument(modelName, result, handlers.save);
  };
  Model.deleteMany = async (filter = {}) => handlers.deleteMany(filter);
  Model.countDocuments = async (filter = {}) => handlers.countDocuments(filter);
  Model.insertMany = async (data) => handlers.insertMany(data);
  Model.distinct = async (field, filter = {}) => handlers.distinct(field, filter);
  Model.deleteOne = async (filter = {}) => handlers.deleteOne(filter);
  Model.__fallbackPatched = true;
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Running with local fallback data store.');
    fallbackStore.ensureSeeded();
    patchModel(User, 'User', {
      find: (filter) => fallbackStore.listUsers(filter),
      findOne: (filter) => {
        if (filter && filter.email) return fallbackStore.findUserByEmail(filter.email, true);
        if (filter && filter._id) return fallbackStore.findUserById(filter._id, true);
        return Promise.resolve(null);
      },
      findById: (id) => fallbackStore.findUserById(id, false),
      findOneAndUpdate: async (filter, update, options) => {
        const current = await fallbackStore.findUserByEmail(filter.email, true);
        if (!current && options?.upsert) return fallbackStore.createUser(update);
        return fallbackStore.updateUser(current._id, update);
      },
      findByIdAndUpdate: async (id, update) => fallbackStore.updateUser(id, update),
      findByIdAndDelete: async (id) => fallbackStore.updateUser(id, { isActive: false }),
      create: (data) => fallbackStore.createUser(data),
      save: async (doc) => fallbackStore.updateUser(doc._id, doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async (filter) => (await fallbackStore.listUsers(filter)).length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(Company, 'Company', {
      find: () => fallbackStore.listCompanies(),
      findOne: (filter) => Promise.resolve([]),
      findById: async (id) => (await fallbackStore.listCompanies()).find((item) => item._id === id) || null,
      findOneAndUpdate: async (filter, update) => {
        const companies = await fallbackStore.listCompanies();
        const match = companies.find((item) => item._id === filter._id) || null;
        return match ? fallbackStore.createCompany({ ...match, ...update }) : fallbackStore.createCompany(update);
      },
      findByIdAndUpdate: async (id, update) => {
        const companies = await fallbackStore.listCompanies();
        const match = companies.find((item) => item._id === id);
        if (!match) return null;
        return fallbackStore.createCompany({ ...match, ...update });
      },
      create: (data) => fallbackStore.createCompany(data),
      save: async (doc) => Promise.resolve(doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async () => (await fallbackStore.listCompanies()).length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(Job, 'Job', {
      find: (filter) => fallbackStore.listJobs(filter),
      findOne: async (filter) => (await fallbackStore.listJobs(filter))[0] || null,
      findById: (id) => fallbackStore.getJobById(id),
      findOneAndUpdate: async (filter, update) => {
        const job = await fallbackStore.getJobById(filter._id);
        return job ? fallbackStore.updateJob(job._id, update) : fallbackStore.createJob(update);
      },
      findByIdAndUpdate: async (id, update) => fallbackStore.updateJob(id, update),
      findByIdAndDelete: async (id) => fallbackStore.deleteJob(id),
      create: (data) => fallbackStore.createJob(data),
      save: async (doc) => fallbackStore.updateJob(doc._id, doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async (filter) => (await fallbackStore.listJobs(filter)).length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async (field, filter) => {
        const jobs = await fallbackStore.listJobs(filter);
        return [...new Set(jobs.map((job) => job[field]).filter(Boolean))];
      },
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(Application, 'Application', {
      find: (filter) => fallbackStore.listApplications(filter),
      findOne: async (filter) => (await fallbackStore.listApplications(filter))[0] || null,
      findById: async (id) => (await fallbackStore.listApplications()).find((item) => item._id === id) || null,
      findOneAndUpdate: async (filter, update) => {
        const apps = await fallbackStore.listApplications(filter);
        const match = apps[0];
        return match ? fallbackStore.updateApplication(match._id, update) : fallbackStore.createApplication(update);
      },
      findByIdAndUpdate: async (id, update) => fallbackStore.updateApplication(id, update),
      create: (data) => fallbackStore.createApplication(data),
      save: async (doc) => fallbackStore.updateApplication(doc._id, doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async (filter) => (await fallbackStore.listApplications(filter)).length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(Resume, 'Resume', {
      find: (filter) => fallbackStore.listResumes(filter),
      findOne: async (filter) => (await fallbackStore.listResumes(filter))[0] || null,
      findById: async (id) => fallbackStore.getResumeById(id),
      findOneAndUpdate: async (filter, update) => {
        const resume = await fallbackStore.getResumeById(filter._id);
        return resume ? fallbackStore.updateResume(resume._id, update) : fallbackStore.createResume(update);
      },
      findByIdAndUpdate: async (id, update) => fallbackStore.updateResume(id, update),
      create: (data) => fallbackStore.createResume(data),
      save: async (doc) => fallbackStore.updateResume(doc._id, doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async (filter) => (await fallbackStore.listResumes(filter)).length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(Assessment, 'Assessment', {
      find: (filter) => fallbackStore.listAssessments(filter),
      findOne: async (filter) => (await fallbackStore.listAssessments(filter))[0] || null,
      findById: async (id) => fallbackStore.getAssessmentById(id),
      findOneAndUpdate: async (filter, update) => {
        const assessment = await fallbackStore.getAssessmentById(filter._id);
        return assessment ? fallbackStore.updateAssessment(assessment._id, update) : fallbackStore.createAssessment(update);
      },
      findByIdAndUpdate: async (id, update) => fallbackStore.updateAssessment(id, update),
      create: (data) => fallbackStore.createAssessment(data),
      save: async (doc) => fallbackStore.updateAssessment(doc._id, doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async (filter) => (await fallbackStore.listAssessments(filter)).length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(Notification, 'Notification', {
      find: (filter) => fallbackStore.listNotifications(filter.user),
      findOne: async () => null,
      findById: async (id) => (await fallbackStore.listNotifications()).find((item) => item._id === id) || null,
      findByIdAndUpdate: async (id, update) => fallbackStore.markNotificationRead(id),
      create: (data) => fallbackStore.createNotification(data),
      save: async (doc) => fallbackStore.markNotificationRead(doc._id),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async (filter) => (await fallbackStore.listNotifications(filter.user)).filter((item) => item.isRead === false).length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(Log, 'Log', {
      find: () => fallbackStore.listLogs(),
      findOne: async () => null,
      findById: async () => null,
      create: (data) => fallbackStore.createLog(data),
      save: async (doc) => Promise.resolve(doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async () => (await fallbackStore.listLogs()).length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(Settings, 'Settings', {
      find: () => fallbackStore.listSettings(),
      findOne: async (filter) => (await fallbackStore.listSettings()).find((item) => item.key === filter.key) || null,
      findById: async () => null,
      findOneAndUpdate: async (filter, update) => {
        const settings = await fallbackStore.listSettings();
        const match = settings.find((item) => item.key === filter.key);
        return match ? (await fallbackStore.upsertSettings([{ ...match, ...update, key: filter.key }]))[0] : (await fallbackStore.upsertSettings([update]))[0];
      },
      findByIdAndUpdate: async () => null,
      create: (data) => Promise.resolve(data),
      save: async (doc) => Promise.resolve(doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async () => (await fallbackStore.listSettings()).length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(GitHubProfile, 'GitHubProfile', {
      find: async (filter) => [await fallbackStore.getGitHubProfile(filter.user)],
      findOne: async (filter) => fallbackStore.getGitHubProfile(filter.user),
      findById: async () => null,
      findOneAndUpdate: async (filter, update) => fallbackStore.setGitHubProfile(filter.user, update),
      create: (data) => fallbackStore.setGitHubProfile(data.user, data),
      save: async (doc) => fallbackStore.setGitHubProfile(doc.user, doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async () => (await fallbackStore.getState()).githubProfiles.length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    patchModel(CareerRoadmap, 'CareerRoadmap', {
      find: async (filter) => [await fallbackStore.getRoadmap(filter.user)],
      findOne: async (filter) => fallbackStore.getRoadmap(filter.user),
      findById: async () => null,
      findOneAndUpdate: async (filter, update) => fallbackStore.setRoadmap(filter.user, update),
      create: (data) => fallbackStore.setRoadmap(data.user, data),
      save: async (doc) => fallbackStore.setRoadmap(doc.user, doc),
      deleteMany: () => Promise.resolve([]),
      countDocuments: async () => (await fallbackStore.getState()).roadmaps.length,
      insertMany: async (data) => Promise.resolve(data),
      distinct: async () => [],
      deleteOne: async () => ({ deletedCount: 0 })
    });
    return false;
  }
};

module.exports = connectDB;
