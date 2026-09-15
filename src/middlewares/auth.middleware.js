const jwt = require("jsonwebtoken");
const { message } = require("../lib/prisma");
const authMiddleware = async (req, res, next) => {

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log(token)

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(decoded)

      req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware
  

