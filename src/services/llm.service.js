const {generateResponse} = require("./gemini.service")
const {
  retryWithBackoff,
} = require("../utils/retry");
const withTimeout = require("../utils/withTimeout");

const generateWithRetry = async (message) => {
  return retryWithBackoff(
    () => {
      return withTimeout(
        generateResponse(message),
        30000
      );
    },
    {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 8000,
    }
  );
};

module.exports = {
  generateWithRetry,
};