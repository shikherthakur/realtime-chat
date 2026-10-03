const {Schema, model}=require("mongoose");

const messageSchema=new Schema({
    conversationId:{
        type: Schema.Types.ObjectId,
        ref:"Conversation"
    },

    senderId:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },

    messageType:{
        type: String, 
        enum: ["text", "image", "file"],
        default:"text"
    },

    content:{
        type: String
    },

    fileKey:{
        type:String
    },

    originalName:{
        type:String
    },

    mimeType:{
        type:String
    },

    fileSize:{
        type:Number
    }


}, {timestamps:true});

messageSchema.index({
    conversationId: 1,
    createdAt: -1
});

const Message=model("message", messageSchema);

module.exports=Message;