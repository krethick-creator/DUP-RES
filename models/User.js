const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  bio: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  darkMode: { type: Boolean, default: false },
  githubId: { type: String, default: '' },
  githubUsername: { type: String, default: '' },
  githubName: { type: String, default: '' },
  githubEmail: { type: String, default: '' },
  githubAvatar: { type: String, default: '' },
  githubAccessToken: { type: String, select: false, default: '' },
  githubProfileUrl: { type: String, default: '' },
  githubConnected: { type: Boolean, default: false },
  linkedinConnected: { type: Boolean, default: false },
  linkedinId: { type: String, default: '' },
  linkedinName: { type: String, default: '' },
  linkedinEmail: { type: String, default: '' },
  linkedinHeadline: { type: String, default: '' },
  linkedinProfilePicture: { type: String, default: '' },
  linkedinProfileUrl: { type: String, default: '' },
  linkedinPublicProfile: { type: String, default: '' },
  linkedinAccessToken: { type: String, select: false, default: '' },
  lastLinkedInSync: { type: Date },
  googleConnected: { type: Boolean, default: false },
  googleId: { type: String, default: '' },
  googleEmail: { type: String, default: '' },
  googleName: { type: String, default: '' },
  googlePicture: { type: String, default: '' },
  lastGoogleSync: { type: Date },
  skills: [{ type: String }],
  experience: { type: Number, default: 0 },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
