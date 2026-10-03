const { createClient } = require("redis");

const redisClient=createClient({
    url:process.env.REDIS_URL
});

const pubClient=redisClient.duplicate();
const subClient=redisClient.duplicate();

redisClient.on("error", (err)=>{
    console.log("Redis client error", err); 
});

pubClient.on("error", (err)=>{
    console.log("Redis publisher error", err);
});

subClient.on("error", (err)=>{
    console.log("Redis subscriber error", err);
});


async function connectRedis(){
    await redisClient.connect();
    await pubClient.connect();
    await subClient.connect();
    console.log("Redis Connected.");
}

module.exports={redisClient, pubClient, subClient, connectRedis};