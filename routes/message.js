const express=require("express");
const multer = require("multer");
const router=express.Router();
const upload=require("../middleware/upload");

const {handleSendMessage, handleGetMessages, handleUploadMessage}=require("../controllers/message");
const authenticateUser=require("../middleware/auth");

router.post("/", authenticateUser, handleSendMessage);

router.get("/:conversationId", authenticateUser, handleGetMessages);

router.post("/upload", authenticateUser, (req, res, next) => {

        upload.single("file")(req, res, (err) => {

            if (err instanceof multer.MulterError) {

                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        error: "File size cannot exceed 5 MB"
                    });
                }

                return res.status(400).json({
                    error: err.message
                });
            }

            if (err) {
                return res.status(400).json({
                    error: err.message
                });
            }

            next();
        });

    },
    handleUploadMessage
);

module.exports= router;