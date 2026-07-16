const express = require("express");
const { body, param, query } = require("express-validator");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const hackerRankController = require("../controllers/hackerrankController");

const router = express.Router();
router.use(protect);

router.post(
  "/connect",
  [
    body("username").optional({ checkFalsy: true }).isString().trim().notEmpty(),
    body("profileUrl").optional({ checkFalsy: true }).isString().trim().notEmpty(),
  ],
  validate,
  hackerRankController.connect,
);

router.get(
  "/profile",
  [query("candidateId").optional().isMongoId()],
  validate,
  hackerRankController.getProfile,
);

router.get(
  "/sync",
  [
    query("username").optional().isString().trim().notEmpty(),
    query("profileUrl").optional().isString().trim().notEmpty(),
  ],
  validate,
  hackerRankController.sync,
);

router.post(
  "/certificates",
  upload.certificate.single("certificate"),
  hackerRankController.uploadCertificate,
);

router.post(
  "/verify-link",
  [body("url").isString().trim().notEmpty()],
  validate,
  hackerRankController.verifyLink,
);

router.get(
  "/certificates",
  [query("candidateId").optional().isMongoId()],
  validate,
  hackerRankController.getCertificates,
);

router.delete(
  "/certificates/:id",
  [param("id").isMongoId()],
  validate,
  hackerRankController.deleteCertificate,
);

router.delete("/disconnect", hackerRankController.disconnect);

module.exports = router;
