const {createClient}=require("redis");

const publisher=createClient({
    url: "redis://localhost:6379"
});

publisher.on("error", (err) => {
    console.log("Redis Publisher Error:", err);
});

async function publisherEvent()
{
    await publisher.connect();
    console.log("Publisher connected to Redis.");
    await publisher.publish("chat-events", "Hello from Publisher");
    await publisher.quit();
}

publisherEvent();
