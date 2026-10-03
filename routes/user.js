const express=require("express");
const router=express.Router();


const{handleUserRegister, handleUserLogin, handleGetCurrentUser}=require("../controllers/user");
const authenticateUser = require("../middleware/auth");
const loginRateLimit=require("../middleware/rateLimit");

router.post("/register", handleUserRegister);

router.post("/login", loginRateLimit, handleUserLogin);

router.get("/me", authenticateUser,handleGetCurrentUser);

module.exports=router;