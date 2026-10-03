const {S3Client, 
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand}=require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const fs = require("fs");

const s3=new S3Client({
    region: process.env.AWS_REGION
});


async function upload(file) {
    
    const command=new PutObjectCommand({

        Bucket: process.env.AWS_S3_BUCKET,
        Key: `chat-files/${file.filename}`,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype
    });
    await s3.send(command);

    return {
        key: `chat-files/${file.filename}`
    };

}

async function deleteFile(key)
{
    const command=new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
    });

    await s3.send(command);

}

async function deleteTempFile(file)
{
    await fs.promises.unlink(file.path);
}


async function getFileUrl(key)
{
    const command=new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET, 
        Key: key
    });

    const url=await getSignedUrl(s3, command, {
        expiresIn: 300
    });

    return url;

}

module.exports={upload, deleteFile, deleteTempFile, getFileUrl};