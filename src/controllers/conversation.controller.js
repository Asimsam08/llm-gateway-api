const prisma = require("../lib/prisma");

const createConversation = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;

    const conversation = await prisma.conversation.create({
      data: {
        title: title || "New Chat",
        userId: userId,
      },
    });

    return res.status(201).json({
      message: "Conversation created successfully",
      conversation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create conversation",
    });
  }
};

module.exports = {
  createConversation,
};
