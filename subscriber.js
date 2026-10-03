const {createClient}=require("redis");
const subscriber=createClient({
    url: "redis://localhost:6379"
});

subscriber.on("error", (err) => {
    console.log("Redis Subscriber Error:", err);
});

async function subscriberEvent()
{
    await subscriber.connect();
    console.log("Subscriber connected to Redis.");
    await subscriber.subscribe(("chat-events"), (message)=>{
        console.log(message);
        
    })
}
subscriberEvent()
