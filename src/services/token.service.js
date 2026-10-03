const  {GoogleGenAI} =  require('@google/genai');
const { toGeminiContents } = require("./gemini.service")

const MODEL = "gemini-3.6-flash";

const ai = new GoogleGenAI({
    apiKey : process.env.GEMINI_API_KEY
})

const countTokens = async (contents) => {

  const content  = toGeminiContents(contents);


  console.log(
    "COUNT TOKENS INPUT:",
    JSON.stringify(content, null, 2)
  );

  const response = await ai.models.countTokens({
    model: MODEL,
    contents : content,
  });

  return response.totalTokens;
};

module.exports = {
  countTokens,
};