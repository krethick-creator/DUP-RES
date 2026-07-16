const express = require("express");
const { body, query } = require("express-validator");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const leetCodeController = require("../controllers/leetcodeController");

const router = express.Router();
router.use(protect);

router.post(
  "/connect",
  [
    body("username").optional({ checkFalsy: true }).isString().trim().notEmpty(),
    body("profileUrl").optional({ checkFalsy: true }).isString().trim().notEmpty(),
  ],
  validate,
  leetCodeController.connect,
);

router.get(
  "/profile",
  [query("candidateId").optional().isMongoId()],
  validate,
  leetCodeController.getProfile,
);

router.get("/sync", leetCodeController.sync);

router.delete("/disconnect", leetCodeController.disconnect);

module.exports = router;
