const jwt=require("jsonwebtoken");

function socketAuth(socket, next)
{
    try{
        const cookie=socket.handshake.headers.cookie;
        const token=cookie.split("=")[1];
        const decoded=jwt.verify(token, process.env.JWT_SECRET);
        
        socket.user=decoded;
        next();
    }
    catch(err)
    {
        next(new Error("Unauthorized"));
    }
   
}

module.exports={socketAuth};