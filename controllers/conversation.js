const {createConversation, createGroupConversation, getUserConversations}=require("../services/user");


async function handleCreateConversation(req, res)
{
    try{
        const currentUserId=req.user.userId;
        const targetUserId=req.body.userId;
        const conversation=await createConversation(currentUserId,targetUserId);

        if(conversation.code === "SELF_CONVERSATION")
        {
            return res.status(400).json({error: conversation.error});
        }

        if(conversation.code === "USER_NOT_FOUND")
        {
            return res.status(404).json({error: conversation.error});
        }
        if(conversation.code === "INVALID_USER_ID")
        {
            return res.status(400).json({error: conversation.error});
        }
        return res.status(200).json(conversation);
    }
    catch(err)
    {
        return res.status(500).json({error : "Internal Server error"});
    }
}


async function handleCreateGroupConversation(req, res)
{
    try{
        const currentUserId=req.user.userId;
        const {name, userIds}=req.body;
        const conversation= await createGroupConversation(currentUserId, name, userIds);

        if(conversation.code === "INVALID_GROUP_NAME")
        {
            return res.status(400).json({error: conversation.error});
        }

        if(conversation.code === "INVALID_USER_IDS")
        {
            return res.status(400).json({error: conversation.error});
        }

        if(conversation.code === "NO_GROUP_MEMBERS")
        {
            return res.status(400).json({error: conversation.error});
        }

        if(conversation.code === "DUPLICATE_USERS")
        {
            return res.status(400).json({error: conversation.error});
        }

        if(conversation.code === "CURRENT_USER_INCLUDED")
        {
            return res.status(400).json({error: conversation.error});
        }

        if(conversation.code === "INVALID_USER_ID")
        {
            return res.status(400).json({error: conversation.error});
        }

        if(conversation.code === "USER_NOT_FOUND")
        {
            return res.status(404).json({error: conversation.error});
        }

        return res.status(200).json(conversation);
    }
    catch(err)
    {
        return res.status(500).json({error : "Internal Server error"});
    }
}

async function handleGetUserConversations(req, res)
{
    try{
        const currentUserId=req.user.userId;

        const conversations=
            await getUserConversations(currentUserId);

        return res.status(200).json(conversations);
    }
    catch(err)
    {
        console.log("GET CONVERSATIONS ERROR:", err);

        return res.status(500).json({
            error:"Internal Server error"
        });
    }
}

module.exports={handleCreateConversation, handleCreateGroupConversation, handleGetUserConversations}