const bcrypt=require("bcrypt");
const User=require("../models/user");
const jwt=require("jsonwebtoken");
const mongoose=require("mongoose");
const Conversation=require("../models/conversation");
const { redisClient } = require("../config/redis.js");

async function registerUser(userData)
{
    if(!userData.name || !userData.email || !userData.password)
    {
        return {error: "Enter all the details correctly."};
    }

    const existingUser=await User.findOne({email:userData.email});
    if(existingUser)
    {
        return {error:"Email already registered.",
             code: "DUPLICATE_EMAIL"};
    }
    const hashedPassword=await bcrypt.hash(userData.password, 10);
    userData.password=hashedPassword;

    const user=await User.create(userData);

    const {password, ...safeUser}=user.toObject();
    return safeUser;
}

async function loginUser(userData)
{
    if(!userData.email ||!userData.password)
    {
        return {error: "Enter all the details correctly.",
            code:"MISSING_EMAIL"
        };
    }

    const emailFound=await User.findOne({email:userData.email});

    if(!emailFound)
    {
        return {error: "Invalid email or password.", code: "INVALID_CREDENTIALS"};
    }

    const isPasswordCorrect=await bcrypt.compare(userData.password, emailFound.password);
    if(!isPasswordCorrect)
    {
        return {error: "Invalid email or password.", code: "INVALID_CREDENTIALS"};
    }

    const payload={
        userId: emailFound._id,
        email: emailFound.email
    };
    const token=jwt.sign(payload, process.env.JWT_SECRET, {expiresIn:"1h"});
    return {status:"OK", 
        token:token
    };    
}

async function getCurrentUser(userId)
    {
        const cacheKey=`user:${userId}`;
        
        const cachedUser=await redisClient.get(cacheKey);
         
        if(cachedUser)
        {
            return JSON.parse(cachedUser);
        }
       
        const user=await User.findById(userId);
        if(!user)
        {
            return {error:"User not found."};
        }
        const{password, ...safeUser}=user.toObject();
        await redisClient.set(cacheKey, JSON.stringify(safeUser), {EX:300});
        
        return safeUser;
    }

// create conersation
async function createConversation(currentUserId, targetUserId)
{
    if(!mongoose.Types.ObjectId.isValid(targetUserId))
    {
        return {error: "Invalid user ID", code: "INVALID_USER_ID"};
    }
    if(targetUserId === currentUserId)
    {
        return {error:"Self conversation not allowed",
            code: "SELF_CONVERSATION"
        };
    }

    const targetUser=await User.findById(targetUserId);
    if(!targetUser)
    {
        return {error: "User not found", code: "USER_NOT_FOUND"};
    }

    const existingConversation=await Conversation.findOne({
         $and: [
            {
                participants :{
                    $all:[currentUserId, targetUserId]
                }
            },
            {participants:{$size:2}}
        ]
    });

    if(existingConversation)
    {
        
        return existingConversation;
    }
    // otherwise create new conversation
    const newConversation=await Conversation.create({
      participants:[currentUserId, targetUserId]
    });

    
    return newConversation;
}


async function createGroupConversation(currentUserId, name, userIds)
{

    if(!name || !name.trim())
    {
        return {
            error: "Group name is required",
            code: "INVALID_GROUP_NAME"
        }
    }

    if(!Array.isArray(userIds)){
        return {
            error: "userIds must be an array",
            code: "INVALID_USER_IDS"
        }
    }

    if(userIds.length < 1)
    {
        return {
            error: "At least one other user is required",
            code:  "NO_GROUP_MEMBERS"
        }
    }

    const uniqueUserIds=new Set(userIds);
    if(userIds.length > uniqueUserIds.size)
    {
        return {
            error: "Duplicate users are not allowed",
            code: "DUPLICATE_USERS"
        };
    }

    if(userIds.includes(currentUserId))
    {
        return{
            error: "Do not add current user",
            code: "CURRENT_USER_INCLUDED"
        }
    }

    for(const userid of userIds)
    {
        if(!mongoose.Types.ObjectId.isValid(userid))
        {
            return {
                error: "Invalid user ID", 
                code: "INVALID_USER_ID"
            };
        }
    }

    const users=await User.find({
        _id:{
            $in:userIds
        }
    })

    if(users.length < userIds.length)
    {
        return {
            error: "One or more users not found",
            code: "USER_NOT_FOUND"
        }
    }

    const newConversation= await Conversation.create({
        type: "group",
        name: name.trim(),
        participants: [currentUserId, ...userIds]
    });

    return newConversation;

}

async function getUserConversations(currentUserId)
{
    const conversations=await Conversation.find({
        participants:currentUserId
    })
    .populate("participants", "name profilePicture")
    .sort({updatedAt:-1});

    return conversations;
}

module.exports={registerUser, loginUser, getCurrentUser, createConversation, createGroupConversation, getUserConversations};