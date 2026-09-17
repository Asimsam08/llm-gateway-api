const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,

    new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error(
          `Operation timed out after ${timeoutMs}ms`
        );

        error.code = "ETIMEDOUT";

        reject(error);
      }, timeoutMs);
    }),
  ]);
};

module.exports = withTimeout;