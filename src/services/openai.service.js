const OpenAI = require("openai")

const openai = new OpenAI({
    apiKey : process.env.OPENAI_API_KEY
})

const generateResponse = async (message)=>{
   const response = await openai.responses.create({
    model : "got-4o-mini",
    input: message
   })

   return response.output_text
}

module.exports = {
    generateResponse
}