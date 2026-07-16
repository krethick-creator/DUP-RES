const codingProfileService = require("../services/codingProfileService");

exports.connectLeetCode = async (req, res) => {
  try {
    const profile = await codingProfileService.connectLeetCode(
      req.user,
      req.body,
      { forceRegenerate: false },
    );
    res.json({ success: true, profile });
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ success: false, message: error.message });
  }
};

exports.getLeetCodeProfile = async (req, res) => {
  try {
    const targetUserId =
      req.user.role === "recruiter" && req.query.candidateId
        ? req.query.candidateId
        : req.user._id;
    const profile = await codingProfileService.getLeetCodeProfile(targetUserId);
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncLeetCode = async (req, res) => {
  try {
    const profile = await codingProfileService.syncLeetCode(
      req.user,
      { forceRegenerate: true, forceSync: true },
    );
    res.json({ success: true, profile });
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ success: false, message: error.message });
  }
};

exports.connectHackerRank = async (req, res) => {
  try {
    const profile = await codingProfileService.connectHackerRank(
      req.user,
      req.body,
      { forceRegenerate: false },
    );
    res.json({ success: true, profile });
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ success: false, message: error.message });
  }
};

exports.getHackerRankProfile = async (req, res) => {
  try {
    const targetUserId =
      req.user.role === "recruiter" && req.query.candidateId
        ? req.query.candidateId
        : req.user._id;
    const profile =
      await codingProfileService.getHackerRankProfile(targetUserId);
    const certificates =
      await codingProfileService.getCertificates(targetUserId);
    res.json({ success: true, profile, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncHackerRank = async (req, res) => {
  try {
    const profile = await codingProfileService.syncHackerRank(
      req.user,
      { forceRegenerate: true },
    );
    res.json({ success: true, profile });
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ success: false, message: error.message });
  }
};

exports.uploadCertificate = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Certificate file is required" });

    const forceVerify = req.body.forceVerify === 'true' || req.body.forceVerify === true || req.query.forceVerify === 'true' || req.body.sync === 'true' || req.body.sync === true || req.query.sync === 'true' || req.body.syncCertificate === 'true' || req.body.syncCertificate === true || req.query.syncCertificate === 'true';
    const forceRegenerate = req.body.forceRegenerate === 'true' || req.body.forceRegenerate === true || req.query.forceRegenerate === 'true' || req.body.generate === 'true' || req.body.generate === true || req.query.generate === 'true';

    const result = await codingProfileService.uploadCertificate(
      req.user,
      req.file,
      { forceVerify, forceRegenerate },
    );
    res.status(201).json({
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
    res
      .status(error.status || 400)
      .json({ success: false, message: error.message });
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    const forceVerify = req.body.forceVerify === 'true' || req.body.forceVerify === true || req.query.forceVerify === 'true' || req.body.sync === 'true' || req.body.sync === true || req.query.sync === 'true' || req.body.syncCertificate === 'true' || req.body.syncCertificate === true || req.query.syncCertificate === 'true';
    const forceRegenerate = req.body.forceRegenerate === 'true' || req.body.forceRegenerate === true || req.query.forceRegenerate === 'true' || req.body.generate === 'true' || req.body.generate === true || req.query.generate === 'true';

    const result = await codingProfileService.verifyExistingCertificate(
      req.user,
      req.params.id,
      { forceVerify, forceRegenerate },
    );
    res.json({
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
    res
      .status(error.status || 400)
      .json({ success: false, message: error.message });
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
    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    await codingProfileService.deleteCertificate(req.user, req.params.id);
    res.json({
      success: true,
      message: "Certificate deleted successfully.",
    });
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ success: false, message: error.message });
  }
};

exports.getCandidateSummary = async (req, res) => {
  try {
    const targetUserId =
      req.user.role === "recruiter" && req.query.candidateId
        ? req.query.candidateId
        : req.user._id;
    const summary = await codingProfileService.getCandidateSummary(
      req.user,
      targetUserId,
    );
    if (!summary || !summary.summary) {
      return res.json({
        success: true,
        summary: null,
        message: "No AI analysis available. Click Generate AI Analysis.",
      });
    }
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
