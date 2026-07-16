const mongoose = require("mongoose");

const hackerRankProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: { type: String, required: true, trim: true },
    profileUrl: { type: String, required: true, trim: true },
    skills: [{ type: String }],
    verified: { type: Boolean, default: false },
    connected: { type: Boolean, default: false },
    knownSkills: [{ type: mongoose.Schema.Types.Mixed }],
    skillCategories: [{ type: mongoose.Schema.Types.Mixed }],
    languages: [{ type: mongoose.Schema.Types.Mixed }],
    difficultyDistribution: { type: mongoose.Schema.Types.Mixed, default: {} },
    acceptanceRate: { type: Number, default: 0 },
    problemSolvingSummary: { type: String, default: "" },
    lastVerified: { type: Date },
    verificationConfidence: { type: Number, default: 0 },
    lastSynced: { type: Date },
    aiAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);


module.exports = mongoose.model("HackerRankProfile", hackerRankProfileSchema);
