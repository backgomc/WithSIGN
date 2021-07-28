const express = require('express');
const router = express.Router();
const multer = require('multer'); // file upload module
const config = require("../config/key");

// const upload = multer({ dest: 'storage/docToSign/' })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("req.body.path:"+req.body.path)
        if(req.body.path) {
            cb(null, config.storageDIR + req.body.path + "/");
        } else {
            cb(null, config.storageDIR + 'docToSign/');
        }
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})

const upload = multer({storage});

// 신규 문서 등록
router.post('/upload', upload.single('file'), (req, res) => {

    if (req.file) {
        return res.json({ success: true, file: req.file })
    } else {
        return res.json({ success: false, message: "file upload failed"})
    }
    
})

module.exports = router;