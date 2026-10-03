const express = require("express");

const router = express.Router();

const { uploadChatpdf, chatpdf } = require("../controllers/chatpdf-controller");

const authMiddleware = require("../middlewares/auth.middleware")

router.post("/upload", authMiddleware, uploadChatpdf);
router.post("/chat", authMiddleware, chatpdf);    


module.exports = router;