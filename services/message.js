const mongoose=require("mongoose");
const Conversation=require("../models/conversation");
const Message=require("../models/message");


const storage=require("../storage");


async function sendMessage(currentUserId, conversationId, content)
{
    if(!mongoose.Types.ObjectId.isValid(conversationId))
    {
        return {error:"Invalid Conversation Id", code: "INVALID_CONVERSATION"};
    }

    const findConversation= await Conversation.findById(conversationId);
    if(!findConversation)
    {
        return {error:"Conversation does not exist", code: "CONVERSATION_NOT_FOUND"};
    }
    
    const isParticipant=findConversation.participants.some(
        (participantId)=>{
           return participantId.toString() === currentUserId.toString();
        }
    );

    if(!isParticipant)
    {
        return {error:"You are not a participant in this conversation",
            code: "NOT_PARTICIPANT"
        };
    }

    if(!content ||!content.trim())
    {
        return {error: "Message content is required",
            code: "INVALID_CONTENT"};
    }

    const createMessage=await Message.create({

        conversationId: conversationId,
        senderId: currentUserId,
        content: content
    });
    await createMessage.populate("senderId", "name profilePicture");
    return createMessage;
}

async function sendFileMessage(currentUserId, conversationId, file)
{
    if(!mongoose.Types.ObjectId.isValid(conversationId))
    {
        return {
            error:"Invalid Conversation Id", 
            code: "INVALID_CONVERSATION"
        };
    }

    const findConversation=await Conversation.findById(conversationId);

    if(!findConversation)
    {
         return {
            error:"Conversation does not exist", 
            code: "CONVERSATION_NOT_FOUND"
        };
    }

   const isParticipant=findConversation.participants.some(
        (participantId)=>{
           return participantId.toString() === currentUserId.toString();
        }
    );

    if(!isParticipant)
    {
        return {error:"You are not a participant in this conversation",
            code: "NOT_PARTICIPANT"
        };
    }

    if(!file){
        return {
            error: "File is required",
            code: "FILE_REQUIRED"
        };
    }

    const messageType=file.mimetype.startsWith("image/") ? "image" : "file";
    
    const uploadedFile=await storage.upload(file);
    
    try{
        
        const createMessage=await Message.create({
        conversationId: conversationId,
        senderId : currentUserId,
        messageType : messageType,
        // fileUrl : uploadedFile.url,
        fileKey: uploadedFile.key,
        originalName : file.originalname,
        mimeType : file.mimetype,
        fileSize : file.size
    });

        await createMessage.populate("senderId", "name profilePicture");
        const fileUrl=await storage.getFileUrl(createMessage.fileKey);

        return {
            ...createMessage.toObject(),
            fileUrl
        };
    }
    catch(err){
        await storage.deleteFile(uploadedFile.key).catch(()=>{});
        throw err;
    }
    

}


async function getMessages(currentUserId, conversationId, page, limit)
{

    const skip=(page-1)*limit;

    if(!mongoose.Types.ObjectId.isValid(conversationId))
    {
        return {error:"Invalid Conversation Id", code: "INVALID_CONVERSATION"};
    }

    const findConversation=await Conversation.findById(conversationId);
    if(!findConversation)
    {
        return {error:"Conversation does not exist", code: "CONVERSATION_NOT_FOUND"};
    }

    const isParticipant=findConversation.participants.some((participantId)=>{

        return participantId.toString() === currentUserId.toString();

    })

    if(!isParticipant)
    {
        return {error:"You are not a participant in this conversation",
            code: "NOT_PARTICIPANT"
        };
    }

    const messages=await Message.find({conversationId})
    .populate("senderId", "name profilePicture")
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit + 1)
    .lean();

    const hasMore=messages.length > limit;
    if(hasMore)
    {
        messages.pop();
    }
    
    for(const message of messages)
    {
        if(message.fileKey)
        {
            message.fileUrl=await storage.getFileUrl(message.fileKey);
        }
    }

    return {messages, hasMore};
}

module.exports={sendMessage, getMessages, sendFileMessage};