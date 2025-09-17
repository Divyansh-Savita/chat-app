import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// create express app and http server
const app=express();
const server = http.createServer(app)
// CORS configuration
app.use(cors({
    origin: "https://chat-app-theta-amber-13.vercel.app", // your frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Handle preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://chat-app-theta-amber-13.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// Middleware setup
app.use(express.json({limit:"20mb"}));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

//routes setup
app.use("/api/status",(req,res)=>{res.send("Server is live")})
app.use("/api/auth",userRouter )
app.use("/api/messages",messageRouter)

export const io = new Server(server, {
    cors: {
        origin: "https://chat-app-theta-amber-13.vercel.app",
        methods: ["GET", "POST"],
        credentials: true
    }
});

//store online users
export const userSocketMap={}//{userId:socketId}

// socket.io connection handler
io.on("connection",(socket)=>{
    const userId=socket.handshake.query.userId
    console.log("user connected",userId)

    if(userId) userSocketMap[userId]=socket.id;
    
    // emit online users to all connected details
    io.emit("getOnlineUsers",Object.keys(userSocketMap))

    socket.on("disconnect",()=>{
        console.log("User Disconnected",userId);
        delete userSocketMap[userId]
        io.emit("getOnlineUsers",Object.keys(userSocketMap))
    })
})



//connect to mongodb
await connectDB();
if(process.env.NODE_ENV !=="production"){
const PORT= process.env.PORT || 5000;
server.listen(PORT,()=>console.log("Server is running on PORT:"+PORT))}

//export server for vercel
export default server