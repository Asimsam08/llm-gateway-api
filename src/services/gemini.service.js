const  {GoogleGenAI} =  require('@google/genai');
const ai = new GoogleGenAI({
    apiKey : process.env.GEMINI_API_KEY
})

const generateResponse = async (message)=>{
    const response = await ai.models.generateContent({
        model : 'gemini-3.6-flash',
        contents : message,
        config : {
            systemInstruction : `   You are a helpful AI assistant.

            Rules:
            - Give accurate and clear answers.
            - For technical questions, provide practical examples.
            - For coding questions, provide clean and readable code.
            - For general knowledge, explain concepts simply.
            - For creative requests, follow the user's requested style.
            - If the request is ambiguous, ask for clarification.
            - Avoid unnecessary verbosity.`
        },
    })
    console.log(response.text)
    return response.text
}

module.exports = {
    generateResponse
}