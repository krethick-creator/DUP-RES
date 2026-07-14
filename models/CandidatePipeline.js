const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Task / Checklist Schema
const pipelineTaskSchema = new Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  remindersActive: { type: Boolean, default: false }
});

// Attachment Schema
const pipelineAttachmentSchema = new Schema({
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

// Comment Schema
const pipelineCommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  attachments: [pipelineAttachmentSchema],
  createdAt: { type: Date, default: Date.now }
});

// Activity Log Schema (Hiring timeline log)
const pipelineActivitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: String,
  timestamp: { type: Date, default: Date.now }
});

// Candidate Pipeline (Hiring Workflow Card) Schema
const candidatePipelineSchema = new Schema({
  application: { type: Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  stage: { 
    type: String, 
    enum: ['Applied', 'AI Screening', 'Resume Review', 'Recruiter Review', 'Technical Interview', 'Manager Interview', 'HR Interview', 'Offer', 'Accepted', 'Rejected'], 
    default: 'Applied' 
  },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: Date,
  labels: [{ type: String }],
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  assignedMember: { type: Schema.Types.ObjectId, ref: 'User' },
  assignmentHistory: [{
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date, default: Date.now }
  }],
  
  tasks: [pipelineTaskSchema],
  comments: [pipelineCommentSchema],
  activityHistory: [pipelineActivitySchema],
  
  interviewNotes: { type: String, default: '' },
  interviewRecordings: { type: String, default: '' },
  codingFeedback: { type: String, default: '' },
  
  // AI Decisions & Outputs
  aiDecision: {
    bestDepartment: String,
    bestTeam: String,
    bestRecruiter: { type: Schema.Types.ObjectId, ref: 'User' },
    bestTechnicalInterviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    bestInterviewSequence: [String],
    confidenceScore: { type: Number, default: 0 },
    reasoning: String,
    calculatedAt: { type: Date, default: Date.now }
  },
  
  conflictDetails: {
    recruiterScore: Number,
    techLeadScore: Number,
    detectedConflict: { type: Boolean, default: false },
    explanation: String,
    recommendedReviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    reasoning: String,
    calculatedAt: { type: Date, default: Date.now }
  },
  
  aiSummary: {
    candidateSummary: String,
    interviewSummary: String,
    hiringRecommendation: String,
    offerRecommendation: String,
    riskAssessment: String,
    skillGapAnalysis: [String],
    trainingSuggestions: [String],
    confidence: Number,
    calculatedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

module.exports = mongoose.model('CandidatePipeline', candidatePipelineSchema);
