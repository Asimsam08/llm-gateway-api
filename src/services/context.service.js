const prisma = require("../lib/prisma")
const { countTokens } = require("./token.service")
const CONTEXT_CONFIG = {
  maxContextTokens: 4000,
  maxRecentMessages: 100,
};

// const buildContext = async ({
//  conversationId,
//   currentMessage,
// }
// )=>{
// const messages = await prisma.message.findMany({
//     where : {
//         conversationId,
//         status :"COMPLETED"
//     },
//     orderBy : {
//         id : "desc"
//     },
//     take : CONTEXT_CONFIG.maxRecentMessages,
//     select : {
//         role : true,
//         content : true
//     }
// })

// //    const recentMessages = messages.reverse();

//      let low = 0;
//   let high = messages.length;
//   let bestCount = 0;

//   while (low <= high) {
//     const middle = Math.floor(
//       (low + high) / 2
//     );

//     const candidateMessages =
//       messages.slice(0, middle);

//     const tokenCount =
//       await countMessageTokens(
//         candidateMessages
//       );

//     console.log(
//       `Checking ${middle} messages = ${tokenCount} tokens`
//     );

//     if (
//       tokenCount <=
//       CONTEXT_CONFIG.maxContextTokens
//     ) {
//       // This fits.
//       bestCount = middle;

//       // Try to include more messages.
//       low = middle + 1;
//     } else {
//       // Too many tokens.
//       // Try fewer messages.
//       high = middle - 1;
//     }
//   }

//   const selectedMessages =
//     messages
//       .slice(0, bestCount)
//       .reverse();


//    return  {
//     messages : [
//         ...selectedMessages,
//         {
//             role : "user",
//             content: currentMessage
//         }
//     ]
//    }
// }

const buildContext = async ({
  conversationId,
  currentMessage,
}) => {
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      status: "COMPLETED",
    },

    orderBy: {
      id: "desc",
    },

    take: CONTEXT_CONFIG.maxRecentMessages,

    select: {
      role: true,
      content: true,
    },
  });

  let low = 0;
  let high = messages.length;
  let bestMessages = [];

  while (low <= high) {
    const middle = Math.floor(
      (low + high) / 2
    );

    const selectedHistory =
      messages
        .slice(0, middle)
        .reverse();

    const candidateMessages = [
      ...selectedHistory,

      {
        role: "user",
        content: currentMessage,
      },
    ];

    const tokenCount =
      await countTokens(
        candidateMessages
      );

    console.log(
      `History: ${middle} messages | Tokens: ${tokenCount}`
    );

    if (
      tokenCount <=
      CONTEXT_CONFIG.maxContextTokens
    ) {
      bestMessages = candidateMessages;

      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return {
    messages: bestMessages,
  };
};

module.exports = {
  buildContext,
};


module.exports = {
    buildContext,
}