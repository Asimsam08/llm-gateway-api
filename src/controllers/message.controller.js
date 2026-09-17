const prisma = require("../lib/prisma");
const {
  generateWithRetry,
} = require("../services/llm.service");

const retryMessage = async (req, res) => {
  try {
    const messageId = Number(req.params.messageId);

    if (!Number.isInteger(messageId)) {
      return res.status(400).json({
        message: "Invalid message ID",
      });
    }

    // Find the user's message and make sure
    // it belongs to the logged-in user.
    const userMessage =
      await prisma.message.findFirst({
        where: {
          id: messageId,
          role: "user",
          conversation: {
            userId: req.user.id,
          },
        },
        include: {
          conversation: true,
        },
      });

    if (!userMessage) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (userMessage.status !== "FAILED") {
      return res.status(400).json({
        message:
          "Only failed messages can be retried",
      });
    }

    // Change FAILED → PENDING
    await prisma.message.update({
      where: {
        id: userMessage.id,
      },
      data: {
        status: "PENDING",
      },
    });

    try {
      // Retry the SAME message
      const reply = await generateWithRetry(
        userMessage.content
      );

      // Mark original user message completed
      await prisma.message.update({
        where: {
          id: userMessage.id,
        },
        data: {
          status: "COMPLETED",
        },
      });

      // Save new assistant response
      const assistantMessage =
        await prisma.message.create({
          data: {
            role: "assistant",
            content: reply,
            status: "COMPLETED",
            conversationId:
              userMessage.conversationId,
          },
        });

      return res.status(200).json({
        messageId: userMessage.id,
        reply,
        assistantMessageId:
          assistantMessage.id,
      });
    } catch (llmError) {
      console.error(
        "Retry failed:",
        llmError
      );

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
        message:
          "Retry failed. Please try again later.",
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  retryMessage,
};