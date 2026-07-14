const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Invitation Schema
const invitationSchema = new Schema({
  email: { type: String, required: true },
  role: { type: String, default: 'recruiter' },
  department: String,
  team: String,
  token: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Department Schema
const departmentSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  manager: { type: Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

// Team Schema
const teamSchema = new Schema({
  name: { type: String, required: true },
  departmentName: String,
  description: String,
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

// Member Schema
const memberSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['owner', 'admin', 'manager', 'recruiter', 'interviewer', 'hr', 'technical_lead'], 
    default: 'recruiter' 
  },
  department: String,
  team: String,
  permissions: [{ type: String }]
});

// Custom Role Schema
const customRoleSchema = new Schema({
  name: { type: String, required: true },
  permissions: [{ type: String }]
});

// Organization Schema
const organizationSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  logo: { type: String, default: '' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  departments: [departmentSchema],
  teams: [teamSchema],
  members: [memberSchema],
  customRoles: [customRoleSchema],
  invitations: [invitationSchema]
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
