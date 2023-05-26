const express = require('express');
const router = express.Router();
const multer = require('multer'); // file upload module
const config = require("../config/key");
const { Document } = require("../models/Document");
const { Template } = require('../models/Template');
const { Bulk } = require("../models/Bulk");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { makeFolder, generateRandomName, getUniqueFileName, deleteFolder, today } = require('../common/utils');
const Magic = require('mmmagic').Magic;
const restful = require('../common/restful');
const { ValidateToken } = require('../middleware/auth');
const archiver = require('archiver');

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

        // console.log('file.originalname', file.originalname)
        if (req.body.path.includes('attachfiles')) {
            let newFileName = new Date().valueOf() + path.extname(file.originalname)
            cb(null, newFileName);
        } else {
            cb(null, file.originalname);    
        }
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
const uploadTemp = multer({ dest: config.storageDIR + 'temp/' })

// 신규 문서 등록
router.post('/upload', upload.single('file'), async (req, res) => {
    if (req.file) {
        console.log(req.file.destination)
        console.log(req.file.originalname)
        await restful.callDRMUnpackaging(req.file.destination, req.file.originalname);
        new Magic().detectFile(req.file.destination+req.file.originalname, async function(err, result) {
            console.log('File Content Type : ' + result);

            if (err) {
                return res.json({ success: false, message: 'file upload failed'});
            } else if (result.includes('PDF')) {
                return res.json({ success: true, file: req.file });
            } else if (result.includes('Microsoft')) {
                // PDF로 변환
                const result = await restful.convertOfficeToPDF(req.file.destination, req.file.originalname);
                console.log('result.outputPath:', result.outputPath)
                req.file.path = result.outputPath;
                return res.json({ success: true, file: req.file });
            } else {
                return res.json({ success: false, message: 'file upload failed'});
            }
            // if (err || !result.includes('PDF')) return res.json({ success: false, message: 'file upload failed'});
            // return res.json({ success: true, file: req.file });
        });
    } else {
        return res.json({ success: false, message: 'file upload failed'});
    }
})

// bulk 파일 복사   
// 1. docId로 문서 정보가져오기 : docRef
// 2. docId로 bulkId 찾기
// 3. 파일 복사하기 (ex: docToSign/docId -> bulkId/60dbfeec57e078050836b4741625204681539.pdf)
// 4. 복사 경로 response 전달 
router.post('/copyBulk', ValidateToken, (req, res) => {

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
router.post('/checkHashByFile', uploadTemp.single('file'), async (req, res) => {

    if (!req.file) {
        return res.json({ success: false, message: "input value not enough!" })
    } 
    const file = req.file
    const tmp_path = file.path;

    console.log('file', file)
    console.log('tmp_path', tmp_path)
    console.log('destination', file.destination)
    console.log('originalname', file.originalname)

    // 업로드 파일 암호화 해제 후 hash 값 추출
    console.log(await restful.callDRMUnpackaging(req.file.destination, req.file.filename));

    const file_buffer = fs.readFileSync(tmp_path);
    const hash = crypto.createHash('md5');
    hash.update(file_buffer);
    const hex = hash.digest('hex');

    console.log('md5:'+hex);

    // temp 파일 삭제
    // fs.unlinkSync(tmp_path);

    // DB에 HASH값 체크
    // Document.findOne({ docHash: hex }, (err, document) => {
    //     if(document) {
    //         return res.json({ success: true, isReal: true, hash:hex, document:document })
    //     } else {
    //         return res.json({ success: true, isReal: false, hash:hex })
    //     }
    // })

    // DB에 HASH값 체크, 진본확인증명서 출력을 위해 세부 정보 리턴
    Document
    .findOne({ docHash: hex })
    .populate({
        path: "user", 
        select: {name: 1, JOB_TITLE: 2, DEPART_CODE: 3, thumbnail: 4},
        // match: { name : searchName? searchName : !'' }
    })
    .populate({
        path: "users", 
        select: {name: 1, JOB_TITLE: 2, DEPART_CODE: 3}
    })
    .exec((err, document) => {
        if(document) {
            return res.json({ success: true, isReal: true, hash:hex, document:document })
        } else {
            return res.json({ success: true, isReal: false, hash:hex })
        }
    })
    
})

// file hash 값 업데이트 
router.post('/updateHash', ValidateToken, async (req, res) => {

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
          Document.updateOne({ _id: docId }, {docHash: hex}, async (err, result) => {
              if (err) {
                  res.json({ success: false, message: err });
              } else {
                // 블록체인 해시값 저장
                restful.callSaveDocHash(docId, hex);
                return res.json({ success: true, hash: hex })
              }
          });

        } else {
            res.json({ success: false, message: 'document not found!' });
        }
    })
    
})


// 파일 삭제
router.post('/removeDocument', ValidateToken, (req, res) => {

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


// 파일 삭제
// target : 삭제 파일 경로 (storage/temp/test.pdf)
router.post('/deleteFile', ValidateToken, (req, res) => {

    if (!req.body.target) {
        return res.json({ success: false, message: "input value not enough!" })
    } 
    const target = req.body.target 
    console.log('target:'+target)

    try {
        fs.access(target, fs.constants.F_OK, (err) => { // A
            if (err) return res.json({ success: false, msg: '삭제할 수 없는 파일입니다' });

            fs.unlink(target, (e) => {
                if(err) {
                  console.log(err);
                  return res.json({ success: false, msg: e });
                }
                
                console.log(`${target} 를 정상적으로 삭제했습니다`)
                return res.json({ success: true });
              });

        });
    } catch(e) {
        console.log(e)
        return res.json({ success: false, msg: e });
    }    
})

// 파일 이동 
// origin : 원본 파일 경로 (storage/temp/test.pdf)
// target : 이동 파일 경로 (storage/..../test.pdf)
router.post('/moveFile', ValidateToken, (req, res) => {

    if (!req.body.origin || !req.body.target) {
        return res.json({ success: false, message: "input value not enough!" })
    } 
    const origin = req.body.origin 
    const target = req.body.target 

    console.log('origin:'+origin)
    console.log('target:'+target)

    fs.access(origin, fs.constants.F_OK, (err) => { // A
      if (err) return console.log('not found origin file!');

      const dirName = path.dirname(target)
      makeFolder(dirName)
    //   const fileName = path.basename(origin);
    //   let newPath = config.storageDIR + target + '/' + fileName

      fs.rename(origin, target, (err) => {
        if (err) return console.log('failed move file!');
        return res.json({ success: true, filePath: target })
      })
    });
    
})



// 게사판 첨부 
const storageBoard = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("req.body.path:"+req.body.path)
        if(req.body.path) {
            var newDir = config.storageDIR + req.body.path;
            console.log('newDir:'+newDir)
            
            // 폴더가 없으면 폴더생성 
            makeFolder(newDir);

            cb(null, newDir);
        } else {
            cb(null, config.storageDIR + 'board/');
        }
    },
    filename: function (req, file, cb) {
            cb(null, file.originalname);
            // cb(null, file.fieldname + '-' + Date.now() + file.originalname.match(/\..*$/)[0])
    }
});


// 게시판 파일 업로드 (다건 지원)
router.post('/uploadFiles', upload.array('files'), async (req, res) => {

    console.log('req.files', req.files);
    if (req.files) {
        return res.json({ success: true, files: req.files })
    } else {
        return res.json({ success: false, message: "file upload failed"})
    }    
})

router.get('/:class/:docId', ValidateToken, async (req, res) => {
    // console.log(req.params.class);
    // console.log(req.params.docId);
    if (!req.params.class || !req.params.docId) return res.json({ success: false, message: 'input value not enough!' });
    try {
        var dataInfo;
        if (req.params.class === 'documents') dataInfo = await Document.findOne({ '_id': req.params.docId });
        if (req.params.class === 'templates') dataInfo = await Template.findOne({ '_id': req.params.docId });
        if (dataInfo && dataInfo.docRef) {
            var fileInfo = dataInfo.docRef;
            var filePath = fileInfo.substring(0, fileInfo.lastIndexOf('/'));
            var fileName = fileInfo.substring(fileInfo.lastIndexOf('/')+1, fileInfo.length);
            var copyPath = config.storageDIR + 'temp/' + fileName;
            // console.log(fileName);
            // console.log(filePath);
            // console.log(copyPath);
            if (fs.existsSync(fileInfo)) { // 파일 존재 체크

                // CASE 1: 파일 암호화 후 다운로드
                // await restful.callDRMPackaging(filePath, fileName, copyPath);

                // if (fs.existsSync(copyPath)) { // 비동기 메서드는 try/catch 안먹히므로 파일 선체크 로직 추가
                //     var filestream = fs.createReadStream(copyPath);
                //     filestream.pipe(res);
                // } else {
                //     return res.json({ success: false, message: 'file download failed!' });
                // }

                // CASE 2: 암호화 없이 다운로드
                var filestream = fs.createReadStream(fileInfo);
                filestream.pipe(res);

          } else {
            return res.json({ success: false, message: 'file download failed!' });
          }
        } else {
            return res.json({ success: false, message: 'file download failed!' });
        }
    } catch (e) {
      console.log(e);
      return res.json({ success: false, message: 'file download failed!' });
    }
});

// 다건 파일 다운로드 : 임시로 폴더를 생성 후 zip 파일 다운로드 제공, 배치로 매일 임시 폴더 삭제 처리
router.post('/downloadAll', ValidateToken, async (req, res) => {

    if (!req.body.docIds) return res.json({ success: false, message: 'input value not enough!' });
    const docIds = req.body.docIds; 
    console.log('docIds', docIds);

    try {
        let copyPaths = [];
        let folderDir = config.storageDIR + 'tempDownloads/' + today() + '/' + generateRandomName() + '/'; 
        
        makeFolder(folderDir); // ex) storage/tempDownloads/20230426/3707875322/

        for (const docId of docIds) { 
            let dataInfo = await Document.findOne({ '_id': docId });
            if (dataInfo && dataInfo.docRef) {
                let fileInfo = dataInfo.docRef;
                let filePath = fileInfo.substring(0, fileInfo.lastIndexOf('/'));
                let fileName = fileInfo.substring(fileInfo.lastIndexOf('/')+1, fileInfo.length);
                // let copyPath = config.storageDIR + 'tempDownloads/' + fileName;
                let copyPath = folderDir + dataInfo.docTitle + '.pdf';
                copyPath = getUniqueFileName(copyPath, copyPaths);  // 파일명 중복 방지
                if (fs.existsSync(fileInfo)) {
                    await restful.callDRMPackaging(filePath, fileName, copyPath);
                    copyPaths.push(copyPath);
                }
            }
        }

        console.log('copyPaths', copyPaths)
    
        // 압축 파일을 생성할 output 스트림을 생성
        const zipFilePath = folderDir + 'files.zip';
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // 압축 레벨을 최대로 설정
        });
    
        // output 스트림에 archive를 파이핑
        archive.pipe(output);
    
        // 압축 대상 파일들을 archive에 추가
        for (const file of copyPaths) {
            archive.file(file, { name: path.basename(file) });
        }
    
        await archive.finalize();
    
        if (fs.existsSync(zipFilePath)) { // 비동기 메서드는 try/catch 안먹히므로 파일 선체크 로직 추가

            var filestream = fs.createReadStream(zipFilePath);
            filestream.pipe(res);
        } else {
            return res.json({ success: false, message: 'file download failed!' });
        }

    } catch (e) {
        console.log(e);
        return res.json({ success: false, message: 'file download failed!' });
    }

});

module.exports = router;