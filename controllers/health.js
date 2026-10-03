const {getHealthStatus}=require("../services/health.js");
function handlegetHealth(req, res)
{    
    const healthStatus=getHealthStatus();
    return res.json(healthStatus);
}

module.exports={handlegetHealth};