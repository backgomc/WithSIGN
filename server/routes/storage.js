const express = require('express');
const router = express.Router();
const multer = require('multer'); // file upload module
const config = require("../config/key");
const { Document } = require("../models/Document");
const { Bulk } = require("../models/Bulk");
const fs = require('fs');
const path = require('path');


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

const makeFolder = (dir) => {
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

// 신규 문서 등록
router.post('/upload', upload.single('file'), (req, res) => {

    if (req.file) {
        return res.json({ success: true, file: req.file })
    } else {
        return res.json({ success: false, message: "file upload failed"})
    }
    
})

// TODO: bulk 파일 복사
// 1. docId로 문서 정보가져오기 : docRef
// 2. docId로 bulkId 찾기
// 3. 파일 복사하기 (ex: docToSign/docId -> bulkId/60dbfeec57e078050836b4741625204681539.pdf)
// 4. 복사 경로 response 전달 
router.post('/copyBulk', (req, res) => {

    if (!req.body.docId) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    const docId = req.body.docId

    Document.findOne({ _id: docId }, (err, document) => {
        if (document) {
          const { signedBy, users, xfdf, docRef } = document;
          
          Bulk
          .find({ "docs": {$in:[docId]} })
          .exec((err, bulks) => {
              console.log(bulks);
              if (err) return res.json({success: false, error: err});
              
              if(bulks.length > 0) {
                  const bulkId = bulks[0]._id
                  console.log("bulkId:"+bulkId + " bulks length:"+ bulks.length)
                  console.log("docRef:"+docRef)

                  // 1. 폴더 생성
                  const newDir = config.storageDIR + 'docToSign/' + bulkId
                  makeFolder(newDir);

                  // 기존 파일명 가져오기
                  // const fileName = path.basename(docRef);

                  // 2. 파일 복사
                  const orgPath = config.storageDIR + docRef
                  const newPath = newDir + '/' + docId + ".pdf"

                  console.log("orgPath:"+orgPath)
                  console.log("newPath:"+newPath)

                  fs.copyFile(orgPath, newPath, (err) => {
                    if (err) res.json({success: false, error: "error file copy!"});
                    console.log('file copied!');

                    return res.json({success: true, docRef: "Not found bulkId"});
                  });
                  
              } else {
                return res.json({success: false, error: "Not found bulkId"});
              }

              return res.json({ success: true })

          })

        }
    });
})


module.exports = router;