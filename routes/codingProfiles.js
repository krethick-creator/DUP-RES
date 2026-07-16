const express = require("express");
const { body, param } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const coding = require("../controllers/codingProfilesController");

const router = express.Router();
router.use(protect);

router.post(
  "/leetcode/connect",
  [
    body("username").optional({ checkFalsy: true }).isString().trim().notEmpty(),
    body("profileUrl").optional({ checkFalsy: true }).isString().trim().notEmpty(),
  ],
  validate,
  coding.connectLeetCode,
);

router.get("/leetcode/profile", coding.getLeetCodeProfile);
router.post("/leetcode/sync", coding.syncLeetCode);

router.post(
  "/hackerrank/connect",
  [
    body("username").optional({ checkFalsy: true }).isString().trim().notEmpty(),
    body("profileUrl").optional({ checkFalsy: true }).isString().trim().notEmpty(),
  ],
  validate,
  coding.connectHackerRank,
);

router.get("/hackerrank/profile", coding.getHackerRankProfile);
router.post("/hackerrank/sync", coding.syncHackerRank);

router.post(
  "/hackerrank/certificates",
  upload.certificate.single("certificate"),
  coding.uploadCertificate,
);
router.get("/hackerrank/certificates", coding.getCertificates);
router.delete(
  "/hackerrank/certificates/:id",
  [param("id").isMongoId()],
  validate,
  coding.deleteCertificate,
);

router.get(
  "/summary",
  authorize("candidate", "recruiter"),
  coding.getCandidateSummary,
);

module.exports = router;
