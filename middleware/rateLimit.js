const {redisClient}=require("../config/redis");

async function loginRateLimit(req, res, next) {
    
    try{
        const ip=req.ip;
        const key=`rate-limit:login:${ip}`;
        const requestCount=await redisClient.incr(key);

        if(requestCount === 1)
        {
            await redisClient.expire(key, 60);
        }

        if(requestCount > 5)
        {
            return res.status(429).json({error: "Too many login attempts. Please try again later"});
        }
    }
    catch(err){
        console.log("Rate limiter Redis error:", err);
    }
    
    next();
}

module.exports=loginRateLimit;