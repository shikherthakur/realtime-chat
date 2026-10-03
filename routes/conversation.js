const express=require("express");
const router=express.Router();

const {handleCreateConversation, handleCreateGroupConversation, handleGetUserConversations}=require("../controllers/conversation");
const authenticateUser=require("../middleware/auth");

router.get("/", authenticateUser, handleGetUserConversations);

router.post("/", authenticateUser, handleCreateConversation);

router.post("/group", authenticateUser, handleCreateGroupConversation);


module.exports=router;