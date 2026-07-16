const HackerRankProfile = require("../models/HackerRankProfile");
const codingProfileService = require("../services/codingProfileService");
const hackerRankService = require("../services/hackerRankService");

const extractUsername = (req) => {
  if (req.body?.username)
    return hackerRankService.normalizeUsername(req.body.username);
  if (req.body?.profileUrl)
    return hackerRankService.normalizeUsername(req.body.profileUrl);
  if (req.query?.username)
    return hackerRankService.normalizeUsername(req.query.username);
  if (req.query?.profileUrl)
    return hackerRankService.normalizeUsername(req.query.profileUrl);
  return null;
};

const extractForceVerify = (req) => {
  return req.body.forceVerify === 'true' || req.body.forceVerify === true || req.query.forceVerify === 'true' || req.body.sync === 'true' || req.body.sync === true || req.query.sync === 'true' || req.body.syncCertificate === 'true' || req.body.syncCertificate === true || req.query.syncCertificate === 'true';
};

const extractForceRegenerate = (req) => {
  return req.body.forceRegenerate === 'true' || req.body.forceRegenerate === true || req.query.forceRegenerate === 'true' || req.body.generate === 'true' || req.body.generate === true || req.query.generate === 'true';
};

exports.connect = async (req, res) => {
  try {
    const username = extractUsername(req);
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Valid HackerRank username or profileUrl is required",
      });
    }

    const profileData =
      await hackerRankService.fetchHackerRankProfile(username);
    const profile = await HackerRankProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        username: profileData.username,
        profileUrl: profileData.profileUrl,
        verified: profileData.verified,
        connected: true,
        lastSynced: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.json({ success: true, profile });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || "Unable to connect HackerRank profile",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const targetUserId =
      req.user.role === "recruiter" && req.query.candidateId
        ? req.query.candidateId
        : req.user._id;

    const profile = await HackerRankProfile.findOne({ userId: targetUserId });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "HackerRank profile not found" });
    }

    return res.json({ success: true, profile });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load HackerRank profile",
    });
  }
};

exports.sync = async (req, res) => {
  try {
    let username = extractUsername(req);
    if (!username) {
      const existing = await HackerRankProfile.findOne({
        userId: req.user._id,
      });
      username = existing?.username || null;
    }
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Valid HackerRank username or profileUrl is required to sync",
      });
    }

    const profileData =
      await hackerRankService.fetchHackerRankProfile(username);
    const profile = await HackerRankProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        username: profileData.username,
        profileUrl: profileData.profileUrl,
        verified: profileData.verified,
        connected: true,
        lastSynced: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.json({ success: true, profile });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || "Unable to sync HackerRank profile",
    });
  }
};

exports.uploadCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Certificate file is required" });
    }

    const forceVerify = extractForceVerify(req);
    const forceRegenerate = extractForceRegenerate(req);

    const result = await codingProfileService.uploadCertificate(
      req.user,
      req.file,
      { forceVerify, forceRegenerate },
    );

    return res.status(201).json({
      success: true,
      verified: result.verified,
      verificationMethod: result.verificationMethod,
      verificationSource: result.verificationSource,
      verificationConfidence: result.verificationConfidence,
      verificationStatus: result.verificationStatus,
      verificationUrl: result.verificationUrl,
      verifiedAt: result.verifiedAt,
      certificate: result,
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || "Unable to upload HackerRank certificate",
    });
  }
};

exports.verifyLink = async (req, res) => {
  try {
    const url = req.body?.url || req.query?.url;
    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid HackerRank certificate URL is required",
      });
    }

    const forceVerify = extractForceVerify(req);

    const verification = await codingProfileService.verifyHackerRankCertificateLink(
      url,
      { forceVerify, userId: req.user._id },
    );

    const certificate = await codingProfileService.saveHackerRankVerifiedCertificate(
      req.user,
      verification,
      { forceRegenerate: extractForceRegenerate(req) },
    );

    return res.status(201).json({
      success: true,
      verified: verification.verified,
      verificationMethod: verification.verificationMethod,
      verificationSource: verification.verificationSource,
      verificationConfidence: verification.verificationConfidence,
      verificationStatus: verification.verificationStatus,
      verificationUrl: verification.verificationUrl,
      verifiedAt: verification.verifiedAt,
      candidateName: verification.candidateName,
      certificateName: verification.certificateName,
      certificateId: verification.certificateId,
      issueDate: verification.issueDate,
      skill: verification.skill,
      difficulty: verification.difficulty,
      certificate,
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || "Unable to verify HackerRank certificate URL",
    });
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    const forceVerify = extractForceVerify(req);
    const forceRegenerate = extractForceRegenerate(req);
    const result = await codingProfileService.verifyExistingCertificate(
      req.user,
      req.params.id,
      { forceVerify, forceRegenerate },
    );

    return res.json({
      success: true,
      verified: result.verified,
      verificationMethod: result.verificationMethod,
      verificationSource: result.verificationSource,
      verificationConfidence: result.verificationConfidence,
      verificationStatus: result.verificationStatus,
      verificationUrl: result.verificationUrl,
      verifiedAt: result.verifiedAt,
      certificate: result.certificate,
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || "Unable to verify HackerRank certificate",
    });
  }
};

exports.getCertificates = async (req, res) => {
  try {
    const targetUserId =
      req.user.role === "recruiter" && req.query.candidateId
        ? req.query.candidateId
        : req.user._id;

    const certificates =
      await codingProfileService.getCertificates(targetUserId);
    return res.json({ success: true, certificates });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load HackerRank certificates",
    });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    await codingProfileService.deleteCertificate(req.user, req.params.id);
    return res.json({
      success: true,
      message: "Certificate deleted successfully.",
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || "Unable to delete HackerRank certificate",
    });
  }
};

exports.disconnect = async (req, res) => {
  try {
    await codingProfileService.disconnectHackerRank(req.user);
    return res.json({
      success: true,
      message: "HackerRank account disconnected successfully.",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to disconnect HackerRank profile",
    });
  }
};
