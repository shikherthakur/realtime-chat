const fs=require("fs/promises")
const path=require("path");

async function upload(file)
{

    const permanentPath=path.join("uploads", `stored-${file.filename}`);
    await fs.copyFile(file.path, permanentPath);
    return {
        // key : file.filename,
        key:  `stored-${file.filename}`,
        // url : `/uploads/${file.filename}`
    };

}

async function deleteFile(key){

    const filePath=path.join("uploads", key);

    await fs.unlink(filePath);

}

async function deleteTempFile(file)
{
    await fs.unlink(file.path);
}

async function getFileUrl(key){

    return `/uploads/${key}`;

}

module.exports={upload, deleteFile, deleteTempFile, getFileUrl};