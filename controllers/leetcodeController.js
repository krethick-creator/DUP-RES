const LeetCodeProfile = require("../models/LeetCodeProfile");
const codingProfileService = require("../services/codingProfileService");
const leetCodeService = require("../services/leetcodeService");

const extractUsername = (req) => {
  if (req.body && req.body.username)
    return leetCodeService.normalizeUsername(req.body.username);
  if (req.body && req.body.profileUrl)
    return leetCodeService.normalizeUsername(req.body.profileUrl);
  if (req.query && req.query.username)
    return leetCodeService.normalizeUsername(req.query.username);
  if (req.query && req.query.profileUrl)
    return leetCodeService.normalizeUsername(req.query.profileUrl);
  return null;
};

exports.connect = async (req, res) => {
  try {
    const username = extractUsername(req);
    if (!username) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid LeetCode username or profileUrl is required",
        });
    }

    const profileData = await leetCodeService.fetchLeetCodeProfile(username);
    const profile = await LeetCodeProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        username: profileData.username,
        displayName: profileData.displayName,
        profileUrl: profileData.profileUrl,
        about: profileData.about,
        countryName: profileData.countryName,
        ranking: profileData.ranking,
        reputation: profileData.reputation,
        totalSolved: profileData.totalSolved,
        easySolved: profileData.easySolved,
        mediumSolved: profileData.mediumSolved,
        hardSolved: profileData.hardSolved,
        acceptanceRate: profileData.acceptanceRate,
        successPercentage: profileData.successPercentage,
        totalSubmissions: profileData.totalSubmissions,
        acceptedSubmissions: profileData.acceptedSubmissions,
        currentStreak: profileData.currentStreak,
        submissionCalendar: profileData.submissionCalendar,
        programmingLanguages: profileData.programmingLanguages,
        knownTopics: profileData.knownTopics,
        recentSubmissions: profileData.recentSubmissions,
        recentProblems: profileData.recentProblems,
        contestRating: profileData.contestRating,
        bestRating: profileData.bestRating,
        globalRank: profileData.globalRank,
        totalContests: profileData.totalContests,
        badges: profileData.badges,
        skills: profileData.skills,
        contestHistory: profileData.contestHistory,
        avatar: profileData.avatar,
        lastSynced: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.json({ success: true, profile });
  } catch (error) {
    return res
      .status(error.status || 400)
      .json({
        success: false,
        message: error.message || "Unable to connect LeetCode profile",
      });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const targetUserId =
      req.user.role === "recruiter" && req.query.candidateId
        ? req.query.candidateId
        : req.user._id;
    const profile = await LeetCodeProfile.findOne({ userId: targetUserId });
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "LeetCode profile not found" });
    }
    return res.json({ success: true, profile });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to load LeetCode profile",
      });
  }
};

exports.sync = async (req, res) => {
  try {
    const existing = await LeetCodeProfile.findOne({ userId: req.user._id });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "No LeetCode profile connected." });
    }

    if (
      existing.lastSynced &&
      Date.now() - new Date(existing.lastSynced).getTime() < 24 * 60 * 60 * 1000
    ) {
      return res.json({ success: true, profile: existing });
    }

    const username =
      leetCodeService.normalizeUsername(existing.username) ||
      leetCodeService.normalizeUsername(existing.profileUrl);
    if (!username) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Connected LeetCode profile is missing a valid username",
        });
    }

    const profileData = await leetCodeService.fetchLeetCodeProfile(username);
    existing.username = profileData.username;
    existing.displayName = profileData.displayName;
    existing.profileUrl = profileData.profileUrl;
    existing.about = profileData.about;
    existing.countryName = profileData.countryName;
    existing.ranking = profileData.ranking;
    existing.reputation = profileData.reputation;
    existing.totalSolved = profileData.totalSolved;
    existing.easySolved = profileData.easySolved;
    existing.mediumSolved = profileData.mediumSolved;
    existing.hardSolved = profileData.hardSolved;
    existing.acceptanceRate = profileData.acceptanceRate;
    existing.successPercentage = profileData.successPercentage;
    existing.totalSubmissions = profileData.totalSubmissions;
    existing.acceptedSubmissions = profileData.acceptedSubmissions;
    existing.currentStreak = profileData.currentStreak;
    existing.submissionCalendar = profileData.submissionCalendar;
    existing.programmingLanguages = profileData.programmingLanguages;
    existing.knownTopics = profileData.knownTopics;
    existing.recentSubmissions = profileData.recentSubmissions;
    existing.recentProblems = profileData.recentProblems;
    existing.contestRating = profileData.contestRating;
    existing.bestRating = profileData.bestRating;
    existing.globalRank = profileData.globalRank;
    existing.totalContests = profileData.totalContests;
    existing.badges = profileData.badges;
    existing.skills = profileData.skills;
    existing.contestHistory = profileData.contestHistory;
    existing.avatar = profileData.avatar;
    existing.lastSynced = new Date();
    await existing.save();

    return res.json({ success: true, profile: existing });
  } catch (error) {
    return res
      .status(error.status || 400)
      .json({
        success: false,
        message: error.message || "Unable to sync LeetCode profile",
      });
  }
};

exports.disconnect = async (req, res) => {
  try {
    await codingProfileService.disconnectLeetCode(req.user);
    return res.json({
      success: true,
      message: "LeetCode account disconnected successfully.",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to disconnect LeetCode profile",
    });
  }
};
