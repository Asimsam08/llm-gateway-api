const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const isRetryableError = (error) => {
  const status = error?.status ?? error?.response?.status;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    error?.code === "ETIMEDOUT" ||
    error?.code === "ECONNRESET" ||
    error?.name === "TimeoutError"
  );
};



const retryWithBackoff = async (
  operation,
  {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 8000,
  } = {}
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const shouldRetry =
        isRetryableError(error) &&
        attempt < maxAttempts;

      if (!shouldRetry) {
        throw error;
      }

      const exponentialDelay =
        initialDelay * 2 ** (attempt - 1);

      const delay = Math.min(
        exponentialDelay,
        maxDelay
      );

      // Small random delay prevents many requests
      // from retrying at exactly the same time.
      const jitter = Math.floor(Math.random() * 300);

      console.log(
        `LLM attempt ${attempt} failed. Retrying in ${
          delay + jitter
        }ms...`
      );

      await sleep(delay + jitter);
    }
  }

  throw lastError;
};

module.exports = {
  retryWithBackoff,
};