const express = require('express');
const router = express.Router();
const multer = require('multer'); // file upload module
const config = require("../config/key");
const { Document } = require("../models/Document");
const { Bulk } = require("../models/Bulk");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


// const upload = multer({ dest: 'storage/docToSign/' })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("req.body.path:"+req.body.path)
        console.log("req.body.isLast:"+req.body.isLast)
        
        if(req.body.path) {
            // 폴더가 없으면 폴더생성 
            const newDir = config.storageDIR + req.body.path;
            makeFolder(newDir);

            cb(null, config.storageDIR + req.body.path);
        } else {
            cb(null, config.storageDIR + 'docToSign/');
        }
    },
    filename: (req, file, cb) => {

        // Hash 값 저장은 별도 메서드로 호출
        // file.stream.on('data', function(chunk){
        //     hash.update(chunk)
        // })
        // file.stream.on('end', function() {
        //     var hashMD5 = hash.digest('hex')
        //     console.log('hashMD5:'+hashMD5)
        //     console.log("req.body.docId:"+req.body.docId)
        // })

        cb(null, file.originalname);
    }
})

const storageTemp = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('AAA')
        const tempURL = config.storageDIR + 'temp/';
        makeFolder(tempURL);
        cb(null, tempURL);
    },
    filename: (req, file, cb) => {
        console.log('BBB')
        console.log('file.originalname:'+file.originalname)
        cb(null, file.originalname);
    }
})

const upload = multer({storage});
// const uploadTemp = multer({storageTemp});
const uploadTemp = multer({ dest: config.storageDIR + 'temp/' })

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

// bulk 파일 복사
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

                    // 3. document 파일 위치 업데이트 
                    Document.updateOne({ _id: docId }, {docRef: 'docToSign/' + bulkId + '/' + docId + ".pdf"}, (err, result) => {
                        if (err) {
                            res.json({ success: false, message: err });
                        } else {
                           return res.json({ success: true }); 
                        }
                    });
                  });
                  
              } else { 
                return res.json({success: false, error: "Not found bulkId"});
              }

            //   return res.json({ success: true })

          })

        }
    });
})


// FILE HASH 값 확인 By docRef 
router.post('/checkHashByDocRef', (req, res) => {

    if (!req.body.docRef) {
        return res.json({ success: false, message: "input value not enough!" })
    } 
    const docRef = req.body.docRef 

    const file_buffer = fs.readFileSync(config.storageDIR+docRef);

    const hash = crypto.createHash('md5');
    hash.update(file_buffer);
    const hex = hash.digest('hex');

    console.log('md5:'+hex);

    return res.json({ success: true, hash: hex })
    
})


/**
 * @TITLE: 업로드 파일의 진본여부를 확인
 * @DESCRIPTION: 업로드 파일의 HASH값을 추출하여 DB에 저장된 값과 비교하여 진본 결과를 도출 
 * @PARAM: file
 * @RETURN: isReal(true/false)
 */
router.post('/checkHashByFile', uploadTemp.single('file'), (req, res) => {

    if (!req.file) {
        return res.json({ success: false, message: "input value not enough!" })
    } 
    const file = req.file
    const tmp_path = file.path;

    console.log('file:'+file)
    console.log('tmp_path:'+tmp_path)

    const file_buffer = fs.readFileSync(tmp_path);
    const hash = crypto.createHash('md5');
    hash.update(file_buffer);
    const hex = hash.digest('hex');

    console.log('md5:'+hex);

    // temp 파일 삭제
    fs.unlinkSync(tmp_path);

    // DB에 HASH값 체크
    Document.findOne({ docHash: hex }, (err, document) => {
        if(document) {
            return res.json({ success: true, isReal: true, hash:hex })
        } else {
            return res.json({ success: true, isReal: false, hash:hex })
        }
    })
    
})

// file hash 값 업데이트 
router.post('/updateHash', (req, res) => {

    if (!req.body.docId) {
        return res.json({ success: false, message: "input value not enough!" })
    }

    const docId = req.body.docId

    Document.findOne({ _id: docId }, (err, document) => {

        if (document) {
          const { docRef } = document;

          const file_buffer = fs.readFileSync(config.storageDIR+docRef);

          const hash = crypto.createHash('md5');
          hash.update(file_buffer);
          const hex = hash.digest('hex');
      
          console.log('md5:'+hex);
      
          // DOCUMENT에 HASH 값 저장
          Document.updateOne({ _id: docId }, {docHash: hex}, (err, result) => {
              if (err) {
                  res.json({ success: false, message: err });
              } else {
                  return res.json({ success: true, hash: hex })
              }
          });

        } else {
            res.json({ success: false, message: 'document not found!' });
        }
    })
    
})

module.exports = router;