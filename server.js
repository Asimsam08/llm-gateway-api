const express = require("express");
const app = express();
require("dotenv").config();
const chatRoutes = require("./src/routes/chat.routes")
const userRoutes = require("./src/routes/user.routes")
const authRoutes = require("./src/routes/auth.route")
const conversationRoutes = require("./src/routes/conversation.route")
const PORT = process.env.PORT || 3000
app.use(express.json())

app.get("/",(req,res)=>{
    res.json({
        message: "AI Chat API is running"
    });
});

// app.post("/api/chat",(req,res)=>{
//     const message = req.body.message
//     res.json({
//         message: message,
//         reply: "It will come from AI model"
//     });
// });
app.use("/api", chatRoutes)
app.use("/api", userRoutes)
app.use("/api/auth",authRoutes)
app.use("/api/conversations", conversationRoutes)

app.listen(PORT, ()=>{
    console.log(`server is listening on https://localhost:${PORT}`)
})