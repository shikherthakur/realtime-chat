const multer=require("multer");
const allowedFileTypes=require("../config/allowedFileTypes");

const upload=multer({
    dest: "uploads/",
    limits:{
        fileSize: 5 * 1024 * 1024
    },
    fileFilter:(req, file, cb)=>{
        
        if(allowedFileTypes.includes(file.mimetype))
        {
            cb(null, true);
        }
        else
        {
            cb(new Error("File type is not allowed"));
        }
    }
});

module.exports=upload;