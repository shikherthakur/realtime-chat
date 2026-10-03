const User = require("../models/user");
const{registerUser, loginUser, getCurrentUser}=require("../services/user");


async function handleUserRegister(req, res)
{
    
    try{
        const userData=await registerUser(req.body);
        if(userData.code === "DUPLICATE_EMAIL")
        {
            return res.status(409).json({error:userData.error});
        }
        
        if(userData.error)
        {
            return res.status(400).json({error : userData.error});
        }

        

        return res.status(201).json(userData);

    }
    catch(err)
    {
        console.log(err);
        
        return res.status(500).json({error : "Internal Server error"});
    }   
    
}


async function handleUserLogin(req,res)
{
    try{
        const userData= await loginUser(req.body);
        if(userData.code==="MISSING_EMAIL")
        {
            return res.status(400).json({error : userData.error});
        }

        if(userData.code === "INVALID_CREDENTIALS")
        {
            return res.status(401).json({error:userData.error});
        }


       res.cookie("token", userData.token, {httpOnly : true});
       return res.status(200).json(userData.status);
    }
    catch(err)
    {
         console.log("LOGIN ERROR:", err);

        return res.status(500).json({error: "Internal Server Error."});
    }
    
}


async function handleGetCurrentUser(req, res)
{
    try{
        const userData=await getCurrentUser(req.user.userId);
    if(userData.error)
    {
        return res.status(404).json({error: userData.error});
    }
    return res.status(200).json({userData});
    }
    catch(err)
    {
        return res.status(500).json({error: "Internal Server Error."});
    }
    
}



module.exports={handleUserRegister, handleUserLogin, handleGetCurrentUser};