const {Schema, model}=require("mongoose");

const conversationSchema=new Schema({

    type:{
        type:String,
        enum: ["direct", "group"],
        default:"direct"
    },

    name:{
        type: String
    },

    participants:[
       { type:Schema.Types.ObjectId,
        ref:"User"}
    ]

},{timestamps:true});

const Conversation=model("Conversation", conversationSchema);
module.exports=Conversation;