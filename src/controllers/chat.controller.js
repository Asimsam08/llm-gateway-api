const {generateResponse} = require("../services/gemini.service")
const chat = async (req,res,next)=>{

    try {
        const message = req.body.message

        if(!message) {
            res.status(400).json({
                error : "Message is required"
            })
        }

        const reply = await generateResponse(message)

        res.json({
            message : message,
            reply: reply

        })

    }catch(error){
            next(error)
    }

}



module.exports = {
    chat
}