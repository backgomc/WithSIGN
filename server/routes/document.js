const express = require('express');
const router = express.Router();
const { Document } = require("../models/Document");
const requestIp = require('request-ip');
const fs = require('fs');
const config = require("../config/key");
const { generateRandomName, makeFolder, today } = require('../common/utils');
const { DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_TOCONFIRM } = require('../common/constants');
const restful = require('../common/restful');

// 신규 문서 등록  
router.post('/addDocumentToSign', (req, res) => {

  if (!req.body.user || !req.body.docRef) {
    return res.json({ success: false, message: 'input value not enough!' });
  }

  // 대량 전송외 참여자에 본인만 있을 경우 제한
  // if (!req.body.docType !== 'B' && req.body.users.length === 1 && req.body.users[0] === req.body.user) {
  //   return res.json({ success: false, message: 'input value not enough!' });
  // }

  const document = new Document(req.body)

  console.log('document:', document)

  document.save((err, document) => {
    if (err) return res.json({ success: false, err })

    // 쪽지 보내기 
    if (document.orderType == 'S') { //순차 발송: 대상자에게만 메시지 발송
      restful.callNotify(document.user, document.usersTodo,'[WithSIGN] 서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.');
    } else { //동차 발송: 전체에게 메시지 발송
      restful.callNotify(document.user, document.users,'[WithSIGN] 서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.');
    }
    
    return res.status(200).json({
      success: true,
      documentId: document._id
    })
  })

  // console.log("req.body.user:"+req.body.user)
  // console.log("req.body.docRef:"+req.body.docRef)

  // if (!req.body.user || !req.body.docRef) {
  //     return res.json({ success: false, message: "input value not enough!" })
  // } 

  // const document = new Document(req.body)

  // // 썸네일 이미지는 스토리지에 올리기
  // const base64Data = document.thumbnail.split(';base64,').pop();

  // const newDir = config.storageDIR + 'thumbnails/' + today() + '/';
  // makeFolder(newDir);
  // const fullPath = newDir+generateRandomName()+'.png';
  // console.log('fullPath:'+fullPath)

  // fs.writeFile(fullPath, base64Data, {encoding: 'base64'}, function(err) {
  //   if (err) return res.json({ success: false, err })
  //   console.log('File created');

  //   document.thumbnail = fullPath
  //   document.save((err, document) => {
  //     if (err) return res.json({ success: false, err })
  //     return res.status(200).json({
  //       success: true,
  //       documentId: document._id
  //     })
  //   })

  // });  
})

// 썸네일 저장
router.post('/addThumbnail', (req, res) => {

  console.log("req.body.user:"+req.body.user)

  if (!req.body.user || !req.body.thumbnail) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const thumbnail = req.body.thumbnail
  // 썸네일 이미지는 스토리지에 올리기
  const base64Data = thumbnail.split(';base64,').pop();

  const newDir = config.storageDIR + config.thumbnailDIR + today() + '/';
  makeFolder(newDir);
  const fullPath = newDir+generateRandomName()+'.png';
  console.log('fullPath:'+fullPath)

  fs.writeFile(fullPath, base64Data, {encoding: 'base64'}, function(err) {
    if (err) return res.json({ success: false, err })
    console.log('File created');

    return res.status(200).json({
      success: true,
      thumbnail: fullPath
    })

  });  
  
})


// 문서 상태 변경 (사인) : updateDocumentToSign
router.post('/updateDocumentToSign', (req, res) => {

  // TODO 서명자의 IP 정보 남기기
  // console.log("client IP: " +requestIp.getClientIp(req));

  // console.log(req.body.docId)
  // console.log(req.body.uid)
  // console.log(req.body.xfdf)
  if (!req.body.docId || !req.body.user || !req.body.xfdf) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const docId = req.body.docId
  const user = req.body.user
  const xfdfSigned = req.body.xfdf
  const usersTodo = req.body.usersTodo

  const time = new Date()
  const ip = requestIp.getClientIp(req)
  var isLast = false;

  Document.findOne({ _id: req.body.docId }, (err, document) => {
    if (document) {
      const { signedBy, users, xfdf, docRef } = document;
      
      console.log(signedBy.some(e => e.user === user))
      if (!signedBy.some(e => e.user === user)) {

        const signedByArray = [...signedBy, {user:user, signedTime:time, ip:ip}];
        const xfdfArray = [...xfdf, xfdfSigned];

        Document.updateOne({ _id: docId }, {xfdf: xfdfArray, signedBy:signedByArray, usersTodo:usersTodo}, (err, result) => {
          if (err) {
            console.log(err);
            return res.json({ success: false, message: err })
          } else {
            
            if (signedByArray.length === users.length) {
              // const time = new Date();
              isLast = true
              
              Document.updateOne({ _id: docId }, 
                {signed: true, signedTime:time}, (err, result) => {
                  if (err) {
                    console.log(err);
                    return res.json({ success: false, message: err })
                  }
              });
              
              // 문서 완료 시 요청자에게 쪽지 보내기 : 일반 전송만 (대량 전송 제외)
              if (document.docType == 'G') {
                console.log('쪽지 전송 OK: 완료')
                restful.callNotify(null, document.user,'[WithSIGN] 서명(수신) 완료 알림', '['+document.docTitle+']' + ' 의 서명(수신)이 완료되었습니다.');
              } 

            } else {
              if (document.orderType == 'S') {
                
                if (usersTodo?.length > 0) {

                  // 22.02.07: 동차에 서명할 사람이 여러 명인 경우 최초에만 메시지 발송하기
                  var arr = document.usersOrder?.filter(e => e.user == usersTodo[0])
                  if (arr?.length > 0) {
                    var sameOrderArr = document.usersOrder?.filter(e => e.order == arr[0].order)
                    if (sameOrderArr?.length == usersTodo?.length) { // 같은 차례에 처음 메시지를 보낸다고 판단 => 메시지 발송
                      // 메시지 발송하기 
                      console.log('쪽지 전송 OK: 순차 전송')
                      restful.callNotify(document.user, usersTodo,'[WithSIGN] 서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.');
                    } else {
                      console.log('쪽지 전송 NO: 이미 쪽지 보냄')
                    }
                  }

                  // 쪽지 보내기 (순차 발송 - 서명 대상자에게)
                  // restful.callNotify(document.user, usersTodo,'[WithSIGN] 서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.');
                }
              }
            }

            return res.json({ success: true, docRef: docRef, xfdfArray: xfdfArray, isLast: isLast })
        }
        })
      }
    }
  });
})

// 문서 취소 : updateDocumentToSign
router.post('/updateDocumentCancel', (req, res) => {

  console.log("docId:"+req.body.docId)
  console.log("user:"+req.body.user)
  console.log("message:"+req.body.message)
  if (!req.body.docId || !req.body.user) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const docId = req.body.docId
  const user = req.body.user
  const message = req.body.message
  const time = new Date()

  Document.findOne({ _id: req.body.docId }, (err, document) => {
    if (document) {
      const { canceled, canceledBy } = document;
      
      console.log(canceledBy.some(e => e.user === user))
      if (!canceledBy.some(e => e.user === user)) {

        const canceledByArray = [...canceledBy, {user:user, canceledTime:time, message: message}];

        Document.updateOne({ _id: docId }, {canceled: true, canceledBy:canceledByArray}, (err, result) => {
          if (err) {
            console.log(err);
            return res.json({ success: false, message: err })
          } else {
            return res.json({ success: true })
          }
        })
      } else {
        return res.json({ success: false, message: "이미 서명취소 처리되었습니다." })
      }
    }
  });
})

// 사인 대상 문서 검색 : searchForDocumentToSign
router.post('/searchForDocumentToSign', (req, res) => {

  const user = req.body.user
  if (!user) {
      return res.json({ success: false, message: "input value not enough!" })
  }
 
  const current = req.body.pagination.current
  const pageSize = req.body.pagination.pageSize
  var start = 0
  if (current > 1) {
    start = (current - 1) * pageSize
  }

  var order = "signedTime" 
  var dir = "desc"
  if (req.body.sortField) {
    order = req.body.sortField
  }
  if (req.body.sortOrder) {
    if (req.body.sortOrder == "ascend"){
      dir = "asc"
    } else {
      dir = "desc"
    }
  }

  var recordsTotal = 0;

    Document.countDocuments({ "users": {$in:[user]}, "signed": false, "signedBy.user": {$ne:user} }).exec(function(err, count) {
    recordsTotal = count;
    console.log("recordsTotal:"+recordsTotal)
    
    Document
    .find({ "users": {$in:[user]}, "signed": false, "signedBy.user": {$ne:user} })
    .sort({[order] : dir})    //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .populate("user", {name: 1, JOB_TITLE: 2})
    .exec((err, documents) => {
        console.log(documents);
        if (err) return res.json({success: false, error: err});
        return res.json({ success: true, documents: documents, total:recordsTotal })
    })
  })
  
})

  // 사인한 문서 검색 : searchForDocumentsSigned 
  // sample : "{"email":"3thzone@naver.com","sortField":"signedTime","sortOrder":"ascend","pagination":{"current":1,"pageSize":2,"total":3}}"
  router.post('/searchForDocumentsSigned', (req, res) => {

    const user = req.body.user
    if (!user) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    const current = req.body.pagination.current
    const pageSize = req.body.pagination.pageSize
    var start = 0
    if (current > 1) {
      start = (current - 1) * pageSize
    }

    var order = "signedTime" 
    var dir = "desc"
    if (req.body.sortField) {
      order = req.body.sortField
    }
    if (req.body.sortOrder) {
      if (req.body.sortOrder == "ascend"){
        dir = "asc"
      } else {
        dir = "desc"
      }
    }

    var recordsTotal = 0;

    Document.countDocuments({ "users": {$in:[user]}, "signed": true }).exec(function(err, count) {
      recordsTotal = count;
      console.log("recordsTotal:"+recordsTotal)
      
      Document
      .find({ "users": {$in:[user]}, "signed": true })
      .sort({[order] : dir})    //asc:오름차순 desc:내림차순
      .skip(Number(start))
      .limit(Number(pageSize))
      .populate("user", {name: 1, email: 2})
      .exec((err, documents) => {
          console.log(documents);
          if (err) return res.json({success: false, error: err});
          return res.json({ success: true, documents: documents, total:recordsTotal })
      })
    })

  })

  // 문서전체 
  // 조건1: users 에 내가 포함 + 작성자 user정보가 나인 문서
  // [서명종료된 문서: signed = true]
  // [서명진행중 문서: signed = false]
  // [취소된 문서: canceled = true]
  // [내가서명해야할 문서: emails:[email], signed = false]
  router.post('/documents', (req, res) => {

    const user = req.body.user
    if (!user) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    // 단어검색 
    // ISSUE1: 이름 검색의 경우 populate 의 match 함수를 사용해야 하는데 전체 글 수와 매치가 어려움 
    // ISSUE2: 같은 단어를 넣어도 조회됬다가 안됬다가 하는 현상 발생 
    // var searchStr;

    // console.log("req.body.docTitle:"+req.body.docTitle)
    // if (req.body.docTitle) {
    //   var regex = new RegExp(req.body.docTitle[0], "i")
    //   searchStr = { $and: [{'docTitle': regex}] };
    // } else {
    //     searchStr = {};
    // }

    const status = req.body.status

    const current = req.body.pagination.current
    const pageSize = req.body.pagination.pageSize
    var start = 0
    if (current > 1) {
      start = (current - 1) * pageSize
    }

    var order = "requestedTime" 
    var dir = "desc"
    if (req.body.sortField) {
      order = req.body.sortField
    }
    if (req.body.sortOrder) {
      if (req.body.sortOrder == "ascend"){
        dir = "asc"
      } else {
        dir = "desc"
      }
    }

    var recordsTotal = 0;
    
    var andParam = {};
    var orParam = {};
    var orParam2 = {};

    // 문서제목 검색
    if (req.body.docTitle) {
      andParam['docTitle'] = { $regex: '.*' + req.body.docTitle[0] + '.*', $options: 'i' }
    }

    console.log("status:"+status)

    var includeBulk = false;
    if (req.body.includeBulk) {
      includeBulk = req.body.includeBulk;
    }

    if (status && status != "") {
      if (status == DOCUMENT_SIGNING) {
        console.log("AA")
        andParam['signed'] = false
        andParam['canceled'] = false
        orParam = [{$and:[{"users": {$in:[user]}}, {"signedBy.user": user}]},  {$and:[{"user": user}, {"users": {$ne:user}}]}]
        if(!includeBulk) {
          andParam['docType'] = "G"
        }
      } else if (status == DOCUMENT_TOSIGN) {
        andParam['users'] = {$in:[user]}
        andParam['signed'] = false
        andParam['canceled'] = false
        andParam['signedBy.user'] = {$ne:user}
        console.log("서명필요 called")
        // 서명 필요는 대량발송 건과 관계없이 다 보여준다.
        // if(!includeBulk) {
        //   andParam['docType'] = "G"
        // }

        // 순차 서명인 경우: 자기 차례인 경우에만 보여준다.
        // 동차 서명인 경우: 전부 보여준다. 
        orParam = [{$and:[{"orderType": 'S'}, {"usersTodo": {$in:[user]}}]}, {"orderType": {$ne:'S'}}]


      } else if (status == DOCUMENT_SIGNED) {
        andParam['signed'] = true
        orParam = [{"users": {$in:[user]}}, {"user": user}];
        if(!includeBulk) {
          andParam['docType'] = "G"
        }
        console.log("서명완료 called")
      } else if (status == DOCUMENT_CANCELED) {
        andParam['canceled'] = true
        orParam = [{"users": {$in:[user]}}, {"user": user}];
        if(!includeBulk) {
          andParam['docType'] = "G"
        }
        console.log("서명취소 called")
      }
    } else {  // 전체 목록 (status 배열에 복수개가 들어오면 전체 목록 호출)

      // 순차 발송인 경우
      // 본인이 서명할 차례의 문서, 서명한 문서 (= 진행중 또는 완료단계) 표시  
      // 본인이 요청자인 경우는 무조건 표시, 화면단에서 본인의 서명 차례가 아닌 경우 서명 대기 상태로 표시 필요 
      var condition = {$or:[ {"orderType": {$ne:'S'}}, {$and:[{"orderType": 'S'},  {$or:[ {"usersTodo": {$in:[user]}}, {"signedBy.user": user} ]} ]}]}

      if(includeBulk) {
        orParam = [ {$and:[ {"users": {$in:[user]}}, condition]} , {"user": user}];
      } else { // 전체 목록의 경우 대량발송 포함이 아니어도 서명 필요 건은 포함해서 출력해 준다.
        orParam = [ {$and:[ {"users": {$in:[user]}}, condition]}, {$and:[{"user": user}, {"docType": "G"}]} ];  
      }

      // if(includeBulk) {
      //   orParam = [{"users": {$in:[user]}}, {"user": user}];
      // } else { // 전체 목록의 경우 대량발송 포함이 아니어도 서명 필요 건은 포함해서 출력해 준다.
      //   orParam = [{"users": {$in:[user]}}, {$and:[{"user": user}, {"docType": "G"}]} ];  
      // }

      console.log("전체목록 called")
    }


    Document.countDocuments(andParam).or(orParam).exec(function(err, count) {
      recordsTotal = count;
      console.log("recordsTotal:"+recordsTotal)
      
      Document
      .find(andParam).or(orParam)
      .sort({[order] : dir})    //asc:오름차순 desc:내림차순
      .skip(Number(start))
      .limit(Number(pageSize))
      // .populate("user", {name: 1, email: 2})
      .populate({
        path: "user", 
        select: {name: 1, JOB_TITLE: 2, DEPART_CODE: 3, thumbnail: 4},
        // match: { name : searchName? searchName : !'' }
      })
      .populate({
        path: "users", 
        select: {name: 1, JOB_TITLE: 2, DEPART_CODE: 3}
      })
      .exec((err, documents) => {
          // console.log(documents);
          // documents = documents.filter(function(document) {
          //   return document.user
          // });
          if (err) return res.json({success: false, error: err});
          return res.json({ success: true, documents: documents, total:recordsTotal })
      })

    })

  })

// 문서 통계 : 서명 필요 건수, 서명 대기 건수, 전체 문서 건수
router.post('/statics', (req, res) => {

  const user = req.body.user
  if (!user) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  var totalNum = 0;    // 전체문서 건수
  var toSignNum = 0;   // 서명필요 건수
  var signingNum = 0;  // 서명대기(진행) 건수
  var canceledNum = 0; // 서명취소 건수
  var signedNum = 0;   // 서명완료 건수

  Document.countDocuments().or([{"users": {$in:[user]}}, {"user": user}]).exec(function(err, count) {
    if (err) return res.json({success: false, error: err});
    totalNum = count;
    console.log("totalNum:"+totalNum);

    Document.countDocuments({ "users": {$in:[user]}, "signed": false, "canceled": false, "signedBy.user": {$ne:user} }).exec(function(err, count) {
      if (err) return res.json({success: false, error: err});
      toSignNum = count;
      console.log("toSignNum:"+toSignNum);

      Document.countDocuments({"signed": false, "canceled": false})
              .or([ {$and:[{"users": {$in:[user]}}, {"signedBy.user": user}]},  {$and:[{"user": user}, {"users": {$ne:user}}]} ])
              // .and([{"users": {$in:[user]}}, {"signedBy.user": user}])
              // .and([{"user": user}, {"users": {$ne:user}}])
              .exec(function(err, count) {
        
        if (err) return res.json({success: false, error: err});
        signingNum = count;
        console.log("signingNum:"+signingNum);

        Document.countDocuments({"canceled": true}).or([{"users": {$in:[user]}}, {"user": user}]).exec(function(err, count) {
          if (err) return res.json({success: false, error: err});
          canceledNum = count;

          Document.countDocuments({"signed": true}).or([{"users": {$in:[user]}}, {"user": user}]).exec(function(err, count) {
            if (err) return res.json({success: false, error: err});
            signedNum = count;
            return res.json({ success: true, totalNum:totalNum, toSignNum:toSignNum, signingNum:signingNum, canceledNum:canceledNum, signedNum:signedNum })
          })

        })
          
      })

    })

    
  })

})  

// 문서 불러오기
router.post('/document', (req, res) => {

  console.log("docId:"+req.body.docId)

  if (!req.body.docId) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const docId = req.body.docId

  Document
    .findOne({ _id: docId })
    .populate("user", {name: 1, JOB_TITLE: 2})
    .exec((err, document) => {
    if (document) {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: err })
      } else {
        return res.json({ success: true, document:document })
      }      

    }
  });
})

module.exports = router;