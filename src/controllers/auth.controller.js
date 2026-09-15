const bcrypt = require("bcryptjs")
const prisma = require("../lib/prisma")
const jwt = require("jsonwebtoken")

const register = async (req,res)=>{

    try{
       
        const {email, password, name} = req.body
       
        if(!email || !password || !name) {
          return res.status(400).json({
                message : "Email and password are required"
            })
        }

        const existingUser = await prisma.user.findUnique({
            where : {
                email,
            }
        })

       if(existingUser) {
       return res.status(409).json({
            message: "User already exists"
        })
       } 


       const passwordHash = await bcrypt.hash(password,10)
       
    // create User
    
    const user = await prisma.user.create({
        data : {
            email,
            passwordHash,
            name
        }
    })


    res.status(201).json({
     message : "User created successfully",
     user : {
        id : user.id,
        email: user.email,
        createAt : user.createdAt
     }
    })

    }catch(error) {
        console.error(error)
        res.status(500).json({
            message : "Registration Failed"
        })
    }

}


const login = async (req,res)=>{
    try{
    const {email,password} = req.body


    if(!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        })
    }

    const user = await prisma.user.findUnique({
        where : {
            email,
        }
    })

    console.log("user",user)
    
    if(!user) {
        return res.status(401).json({
            message : "Invalid email or password"

        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if(!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        {
            userId : user.id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    )

    return res.status(200).json({
        message: "Login Successful",
        token
    })
}catch(error){

    console.error(error)
    res.status(500).json({
        message : "Login Failed"
    })

}
}

module.exports = {
    register, login
}