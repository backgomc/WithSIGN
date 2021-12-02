const express = require('express');
const router = express.Router();
const multer = require('multer'); // file upload module
const config = require("../config/key");
const { Document } = require("../models/Document");
const { Bulk } = require("../models/Bulk");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { makeFolder } = require('../common/utils');


// const upload = multer({ dest: 'storage/docToSign/' })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("req.body.path:"+req.body.path)
        console.log("req.body.isLast:"+req.body.isLast)
        
        if(req.body.path) {

            var newDir = ''
            // 스토리지 폴더가 포함된 경우 제외시킴 (문서 Merge 시 해당됨)
            if (req.body.path.includes(config.storageDIR)) {
                newDir = req.body.path
            } else {
                newDir = config.storageDIR + req.body.path;
            }

            console.log('newDir:'+newDir)
            
            // 폴더가 없으면 폴더생성 
            makeFolder(newDir);

            cb(null, newDir);
        } else {
            cb(null, config.storageDIR + 'documents/');
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

// const java = require('java');

// const jarFilePath1 = __dirname+'/../lib/fasoo-jni-2.8.9u.jar';
// const jarFilePath2 = __dirname+'/../lib/log4j-1.2.16.jar';
// const jarFilePath3 = __dirname+'/../lib/NH_SIGN.jar';
// java.classpath.push(jarFilePath1);
// java.classpath.push(jarFilePath2);
// java.classpath.push(jarFilePath3);

// 신규 문서 등록
router.post('/upload', upload.single('file'), (req, res) => {

    if (req.file) {
        // var DocuUtil = java.import('com.nonghyupit.drm.DocuUtil');
        // console.log('DRM Unpackaging : ' + DocuUtil.unpackagingSync('./'+req.file.destination+'/', req.file.originalname));
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
                  const newDir = config.storageDIR + config.documentDIR + bulkId
                  makeFolder(newDir);

                  // 기존 파일명 가져오기
                  // const fileName = path.basename(docRef);

                  // 2. 파일 복사
                  // DISTO
                //   const orgPath = config.storageDIR + docRef
                  const orgPath = docRef
                  const newPath = newDir + '/' + docId + ".pdf"

                  console.log("orgPath:"+orgPath)
                  console.log("newPath:"+newPath)

                  fs.copyFile(orgPath, newPath, (err) => {
                    if (err) res.json({success: false, error: "error file copy!"});
                    console.log('file copied!');

                    // 3. document 파일 위치 업데이트 
                    // DISTO
                    Document.updateOne({ _id: docId }, {docRef: config.storageDIR + config.documentDIR + bulkId + '/' + docId + ".pdf"}, (err, result) => {
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

    // DISTO
    // const file_buffer = fs.readFileSync(config.storageDIR+docRef);
    const file_buffer = fs.readFileSync(docRef);

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

          //DISTO
        //   const file_buffer = fs.readFileSync(config.storageDIR+docRef);
        const file_buffer = fs.readFileSync(docRef);

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


// 파일 삭제
router.post('/removeDocument', (req, res) => {

    console.log("docId:"+req.body.docId)
    console.log("user:"+req.body.user)
  
    if (!req.body.docId || !req.body.user) {
        return res.json({ success: false, message: "input value not enough!" })
    } 
  
    const docId = req.body.docId
    const user = req.body.user

    Document.findOne({ _id: docId }, (err, document) => {

        if (document) {
          const { docRef } = document;

          // DISTO
        //   const filePath = config.storageDIR+docRef
          const filePath = docRef
          fs.access(filePath, fs.constants.F_OK, (err) => { // A
            if (err) return console.log('삭제할 수 없는 파일입니다');
          
            fs.unlink(filePath, (err) => err ?  
              console.log(err) : console.log(`${filePath} 를 정상적으로 삭제했습니다`));

              // 썸네일도 삭제하기 (벌크가 아닌 경우만 삭제: 벌크인 경우 다른 문서가 같이 참조하므로 ...)
              if(document.docType === 'G') {
                  const thumbnailPath = document.thumbnail
                fs.access(thumbnailPath, fs.constants.F_OK, (err) => { // A
                    if (err) return console.log('삭제할 수 없는 파일입니다');
                  
                    fs.unlink(thumbnailPath, (err) => err ?  
                      console.log(err) : console.log(`${thumbnailPath} 를 정상적으로 삭제했습니다`));
                });
              }
          });
      
          // DOCUMENT에 HASH 값 저장
          Document.deleteOne({ _id: docId }, (err, result) => {
              if (err) {
                  res.json({ success: false, message: err });
              } else {
                  return res.json({ success: true })
              }
          });

        } else {
            res.json({ success: false, message: 'document not found!' });
        }
    })
    
})

module.exports = router;