const prisma = require("../lib/prisma")
const CONTEXT_CONFIG = {
  maxRecentMessages: 20,
};

const buildContext = async ({
 conversationId,
  currentMessage,
}
)=>{
const messages = await prisma.message.findMany({
    where : {
        conversationId,
        status :"COMPLETED"
    },
    orderBy : {
        id : "desc"
    },
    take : CONTEXT_CONFIG.maxRecentMessages,
    select : {
        role : true,
        content : true
    }
})

   const recentMessages = messages.reverse();

   return  {
    messages : [
        ...recentMessages,
        {
            role : "user",
            content: currentMessage
        }
    ]
   }
}


module.exports = {
    buildContext,
}