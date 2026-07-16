const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hackerRankProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HackerRankProfile",
    },
    fileName: { type: String, required: true, trim: true },
    filePath: { type: String, required: true, trim: true },
    name: { type: String, default: "", trim: true },
    candidateName: { type: String, default: "", trim: true },
    certificateName: { type: String, default: "", trim: true },
    issueDate: { type: Date },
    language: { type: String, default: "", trim: true },
    skill: { type: String, default: "", trim: true },
    difficulty: { type: String, default: "", trim: true },
    verified: { type: Boolean, default: false },
    extractedMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    aiAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    verificationUrl: { type: String, trim: true },
    verificationMethod: { type: String, trim: true },
    verificationSource: { type: String, trim: true },
    verificationConfidence: { type: Number },
    verifiedAt: { type: Date },
    verificationStatus: { type: String, trim: true },
    certificateId: { type: String, trim: true },
    certificateFormat: { type: String, trim: true },
    ocrUsed: { type: Boolean, default: false },
    rawExtractedText: { type: String, default: "" },
  },
  { timestamps: true },
);

certificateSchema.index({ userId: 1 });
module.exports = mongoose.model("Certificate", certificateSchema);
