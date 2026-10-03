require("dotenv").config();

const mongoose=require("mongoose");
const Conversation=require("./models/conversation.js");
const User = require("./models/user.js");
const {Server}=require("socket.io");
const http=require("http");
const express=require("express");
const cookieParser=require("cookie-parser");
const path=require("path");
const {createAdapter}=require("@socket.io/redis-adapter")

const userRouter=require("./routes/user.js")
const conversationRouter=require("./routes/conversation.js");
const messageRouter=require("./routes/message.js");


const connectDB=require("./config/database.js");
const {connectRedis, redisClient, pubClient, subClient}=require("./config/redis.js");

const app=express();

const server=http.createServer(app);
const io=new Server(server);
let isShuttingDown=false;
app.set("io", io);
const port=process.env.PORT || 8000;

const {socketAuth}=require("./middleware/socketAuth.js");
const {sendMessage}=require("./services/message.js")

io.use(socketAuth);


io.on("connection", async(socket)=>{
    console.log("A client connected");

    const joinedConversations=new Set();

   

    const userId=socket.user.userId.toString();
   

    const connectionCount=await redisClient.incr(`presence:user:${userId}`);
   
    

    socket.on("disconnect",async (reason)=>{

        if(isShuttingDown)
        {
            return ;
        }

        const redisConnectionCount=await redisClient.decr(`presence:user:${userId}`);
       

        if(redisConnectionCount === 0)
        {
            await redisClient.del(`presence:user:${userId}`);

            for(const conversationId of joinedConversations)
            {
                const conversation=  await Conversation.findById(conversationId);
                if(!conversation)
                {
                    continue;
                }

                io.to(conversationId).emit("user-offline", {
                    userId: userId
                });
            }
        }
    })


    socket.on("join-room", async (data)=> {

        const currentUserId=socket.user.userId;
        const conversationId=data.roomId;

        if(!mongoose.Types.ObjectId.isValid(conversationId))
        {
            socket.emit("join-error", {
                error: "Invalid conversation ID"
            });
            return ;
        }

        const findConversation=await Conversation.findById(conversationId);

        if(!findConversation)
        {
            socket.emit("join-error", {
                error:"Conversation not found"
            });
            return ;
        }

        const isParticipant=findConversation.participants.some((participantId)=> {
            return participantId.toString() === currentUserId.toString();
        });

        if(!isParticipant)
        {
            socket.emit("join-error", {
                 error: "You are not a participant in this conversation"
            })  
            return;        
        }

        if(findConversation.type === "direct"){
            const otherParticipantId=findConversation.participants.find((participantId)=>
                participantId.toString() !== currentUserId.toString());

            const presence=await redisClient.get(`presence:user:${otherParticipantId.toString()}`);
            
            const isOtherUserOnline=presence !== null;
            

            socket.emit("user-status", {
            userId: otherParticipantId.toString(),
            online: isOtherUserOnline
        });
        }
        else if(findConversation.type === "group")
        {
            const otherParticipants=[];
            for(const participantId of findConversation.participants)
            {
                if(participantId.toString() !== currentUserId.toString())
                {
                    otherParticipants.push(participantId);
                }
            }

            const participantStatuses=[];

            const users=await User.find({
                _id:{
                    $in: otherParticipants
                }
            }).select("name profilePicture");


            const presenceKeys=otherParticipants.map((participantId)=>{
                return `presence:user:${participantId.toString()}`;
            })
            const presenceValues=await redisClient.mGet(presenceKeys);
            for(let i = 0; i < otherParticipants.length; i++)
            {
                const participantId = otherParticipants[i];
                
                
                const presence=presenceValues[i];
                const isOnline=presence !== null;

                const user=users.find((user)=>{
                    return user._id.toString() === participantId.toString();
                });

                if(user)
                {
                    participantStatuses.push({
                    userId: user._id.toString(),
                    name: user.name,
                    online: isOnline                    
                    });                
                }               
            }

            socket.emit("group-user-status", {
                participants: participantStatuses
            });

        }

        
        socket.join(conversationId);
        joinedConversations.add(conversationId);
        

        socket.to(conversationId).emit("user-online", {
            userId: currentUserId.toString()
        });

        

        socket.emit("room-joined",{
            roomId: conversationId
        });        
    });
    
    socket.on("send-message", async(data)=>{
        
        const currentUserId=socket.user.userId;
        const conversationId=data.roomId;
        const content=data.content;

        const message=await sendMessage(currentUserId, conversationId, content);

        if(message.code === "INVALID_CONTENT")
        {
            socket.emit("message-error", {
                error: message.error
            });
            return ;
        }

        io.to(conversationId).emit("new-message", message);
    });

    

});


app.use(express.json());
app.use(cookieParser());


app.use("/users", userRouter);
app.use("/conversations", conversationRouter);
app.use("/messages", messageRouter);

app.use(express.static(path.resolve("./public")));
app.use("/uploads", express.static(path.resolve("./uploads")));


app.get("/", (req, res)=>{
    return res.json({message: "Real Time Chat Server"});
});

async function startServer()
{
    try{
        await connectDB();
        await connectRedis();

        io.adapter(createAdapter(pubClient, subClient));

        server.listen(port,()=>{console.log(`Server Started at Port : ${port}`)});
    }
    catch(err)
    {
        console.log("Failed to start server.", err);
        
    }
}

async function gracefulShutdown(signal) {
    
    console.log(`${signal} received. Shutting down server...`);
    isShuttingDown = true;
    server.close(async()=>{
        console.log("HTTP Server closed.");
        await redisClient.quit();
        await pubClient.quit();
        await subClient.quit();

        await mongoose.connection.close();

        console.log("All connections closed.");
        process.exit(0);        
    })
    

}

startServer();
process.on("SIGINT", ()=>gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));