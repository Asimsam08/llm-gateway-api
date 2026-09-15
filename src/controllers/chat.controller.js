const { conversation, message } = require("../lib/prisma")
const {generateResponse} = require("../services/gemini.service")
const chat = async (req,res,next)=>{

    try {
        const {message, conversationId} = req.body
        

        if(!conversationId) {
             return res.status(400).json({
                error : "conversationId is required"
            })
        }
    

        if(!message) {
          return  res.status(400).json({
                error : "Message is required"
            })
        }

        const conversation = await prisma.conversation.findFirst({
            where : {
                id : conversationId,
                userId: req.user.id
            }
        })

        if(!conversation) {
            return res.status(404).json({
                message : "No conversation found for this user"
            })
        }

        await prisma.message.create({
            data : {
                role : "user",
                content : message,
                conversationId : conversationId
            }
        })

        const reply = await generateResponse(message)

        await prisma.message.create({
            role : "assistant",
            content: reply,
            conversationId : conversationId
        })

        res.json({
            message : message,
            reply: reply

        })

    }catch(error){

        console.error(error)
        res.status(500).json({
            message : "Internal Server Error"
        })
    }

}



module.exports = {
    chat
}