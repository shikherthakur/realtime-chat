const express=require("express");
const router=express.Router();
const {handlegetHealth}=require("../controllers/health");

router.get("/health",handlegetHealth) ;
    //export router
module.exports=router;