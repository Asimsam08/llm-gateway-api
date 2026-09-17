const prisma = require("../lib/prisma");
const { generateWithRetry } = require("../services/llm.service");
const {buildContext } = require("../services/context.service")
const chat = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        error: "conversationId is required",
      });
    }

    if (!message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: req.user.id,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        message: "No conversation found for this user",
      });
    }

    // save user message as pending

    const userMessage = await prisma.message.create({
      data: {
        role: "user",
        content: message.trim(),
        conversationId,
        status: "PENDING",
      },
    });

    try {

      const context = await buildContext({
        conversationId,
        currentMessage: message.trim()
      })
      const reply = await generateWithRetry(context.messages);

      // Mark user message as completed

      await prisma.message.update({
        where: {
          id: userMessage.id,
        },

        data: {
          status: "COMPLETED",
        },
      });

      // save assistant response

      const assistantMessage = await prisma.message.create({
        data: {
          role: "assistant",
          content: reply,
          conversationId: conversationId,
          status: "COMPLETED",
        },
      });

      return res.status(200).json({
        message: message.trim(),
        reply: reply,
        messageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      });
    } catch (llmError) {
      console.error("LLM generation failed:", llmError);

      // All automatic retries failed
      await prisma.message.update({
        where: {
          id: userMessage.id,
        },
        data: {
          status: "FAILED",
        },
      });

      return res.status(503).json({
        messageId: userMessage.id,
        status: "FAILED",
        message: "Unable to generate a response right now. Please try again.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  chat,
};
