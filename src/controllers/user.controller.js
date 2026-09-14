const prisma = require("../lib/prisma");

const createUser = async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
      },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create user",
    });
  }
};

module.exports = {
  createUser,
};
