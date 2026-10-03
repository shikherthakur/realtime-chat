const storage=require("../storage");
const allowedFileTypes=require("../config/allowedFileTypes");

const {
    sendMessage, 
    getMessages, 
    sendFileMessage}=require("../services/message");
    

async function handleSendMessage(req, res)
{
    
    try{
        const currentUserId=req.user.userId;
        const conversationId=req.body.conversationId;
        const content=req.body.content;

        const message= await sendMessage(currentUserId, conversationId, content);      
        
        if(message.code === "INVALID_CONVERSATION")
        {
            return res.status(400).json({error: message.error});
        }
        
        if(message.code === "NOT_PARTICIPANT")
        {
            return res.status(403).json({error: message.error});
        }

        if(message.code === "CONVERSATION_NOT_FOUND")
        {
            return res.status(404).json({error: message.error});
        }

        if(message.code === "INVALID_CONTENT")
        {
            return res.status(400).json({error: message.error});
        }

        return res.status(200).json(message);
    }
    catch(err)
    {
        
        return res.status(500).json({error : "Internal Server error"});
    }
}

async function handleUploadMessage(req, res){

    try{

        const { fileTypeFromFile } = await import("file-type");

        const currentUserId=req.user.userId;
        const conversationId=req.body.conversationId;
        const file=req.file;

        if(!file)
        {
            return res.status(400).json({
                error: "File is required"
            });
        }

        const detectedType = await fileTypeFromFile(file.path);

        if(!detectedType)
        {
            await storage.deleteTempFile(file).catch(()=>{});

            return res.status(400).json({
                error: "Unable to determine file type"
            });
        }

        if(!allowedFileTypes.includes(detectedType.mime))
        {
            await storage.deleteTempFile(file).catch(()=>{});

            return res.status(400).json({
                error: "File type is not allowed"
            });
        }

        if(detectedType.mime !== file.mimetype)
        {
            await storage.deleteTempFile(file).catch(()=>{});

            return res.status(400).json({
                error: "File content does not match its MIME type"
            });
        }
        

        const message=await sendFileMessage(currentUserId, conversationId, file);

        if(message.code)
        {
            await storage.deleteTempFile(file).catch(()=>{});

            if(message.code === "INVALID_CONVERSATION")
            {
                return res.status(400).json({error: message.error});
            }
            
            if(message.code === "NOT_PARTICIPANT")
            {
                return res.status(403).json({error: message.error});
            }

            if(message.code === "CONVERSATION_NOT_FOUND")
            {
                return res.status(404).json({error: message.error});
            }

            if(message.code === "FILE_REQUIRED")
            {
                return res.status(400).json({error: message.error});
            }
            return res.status(400).json({
                error: message.error
            });
        }

        await storage.deleteTempFile(file).catch((err) => {
            console.log("TEMP FILE CLEANUP ERROR:", err);
        });

        const io=req.app.get("io");
        
        io.to(conversationId).emit("new-message", message);

        return res.status(200).json(message);
    }
    catch(err){
        if (req.file) {
            await storage.deleteTempFile(req.file).catch(() => {});
        }
        console.log("UPLOAD MESSAGE ERROR:", err);
        return res.status(500).json({error : "Internal Server error"});
    }
}

async function handleGetMessages(req, res)
{
    try{
        
        const page=Number(req.query.page ?? 1);
        const limit=Number(req.query.limit ?? 20);

        if( Number.isNaN(page) || Number.isNaN(limit) || page < 1 || limit < 1 || limit > 100)
        {
            return res.status(400).json({error:"Invalid pagination parameters"});
        }

        const currentUserId=req.user.userId;
        const conversationId=req.params.conversationId;
        const messages=await getMessages(currentUserId, conversationId, page, limit);

        if(messages.code === "INVALID_CONVERSATION")
        {
            return res.status(400).json({error: messages.error});
        }

        if(messages.code === "CONVERSATION_NOT_FOUND")
        {
            return res.status(404).json({error: messages.error});
        }

        if(messages.code === "NOT_PARTICIPANT")
        {
            return res.status(403).json({error: messages.error});
        }

        return res.status(200).json(messages);
    }
    catch(err)
    {
        console.log("GET MESSAGES ERROR:", err);
        return res.status(500).json({error : "Internal Server error"});
    }

}


module.exports={handleSendMessage, handleGetMessages, handleUploadMessage};