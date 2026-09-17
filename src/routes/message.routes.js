const express = require("express");

const authenticate = require("../middlewares/auth.middleware");

const {
  retryMessage,
} = require("../controllers/message.controller");

const router = express.Router();

router.post(
  "/:messageId/retry",
  authenticate,
  retryMessage
);

module.exports = router;