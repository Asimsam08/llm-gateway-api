const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const {createConversation} = require("../controllers/conversation.controller")
const router = express.Router()

router.post("/", authMiddleware,createConversation)


module.exports = router