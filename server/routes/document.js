const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { Bulk } = require("../models/Bulk");
const { Document } = require("../models/Document");
const requestIp = require('request-ip');
const fs = require('fs');
const config = require("../config/key");
const { generateRandomName, makeFolder, today } = require('../common/utils');
const { DOCUMENT_SIGNED, DOCUMENT_TOSIGN, DOCUMENT_SIGNING, DOCUMENT_CANCELED, DOCUMENT_TOCONFIRM } = require('../common/constants');
const restful = require('../common/restful');
const e = require('express');
const { ValidateToken } = require('../middleware/auth');

// 신규 문서 등록  
router.post('/addDocumentToSign', ValidateToken, (req, res) => {

  if (!req.body.user || !req.body.docRef) {
    return res.json({ success: false, message: 'input value not enough!' });
  }

  // 대량 전송외 참여자에 본인만 있을 경우 제한
  // if (!req.body.docType !== 'B' && req.body.users.length === 1 && req.body.users[0] === req.body.user) {
  //   return res.json({ success: false, message: 'input value not enough!' });
  // }
  const document = new Document(req.body)

  // 서명요청자 ip 정보 추가
  const ip = requestIp.getClientIp(req)
  document.ip = ip

  console.log('document:', document)

  document.save((err, document) => {
    if (err) return res.json({ success: false, err })

    // 쪽지 보내기 
    if (document.orderType == 'S') { //순차 발송: 대상자에게만 메시지 발송
      restful.callNotify(document.user, document.usersTodo,'서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.', null, document._id );
    } else { //동차 발송: 전체에게 메시지 발송
      restful.callNotify(document.user, document.users,'서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.', null, document._id);
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
router.post('/addThumbnail', ValidateToken, (req, res) => {

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
router.post('/updateDocumentToSign', ValidateToken, (req, res) => {

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

        //S. userTodo 서버 베이스로 변경
        var todo = [];
        if (document.orderType == 'S'){
          if(document.usersTodo?.length > 0) {
            if(document.usersTodo?.filter(e => e!= user).length > 0) {
              todo = document.usersTodo?.filter(e => e!= user)
            } else {
              const arr = document.usersOrder?.filter(e => e.user == document.usersTodo[0])
              if (arr?.length > 0) {
                todo = document.usersOrder?.filter(e => e.order == arr[0].order +1).map(e => e.user)
              }
            }
          }
        }
        console.log("todo", todo)
        //E

        Document.updateOne({ _id: docId }, {xfdf: xfdfArray, signedBy:signedByArray, usersTodo:todo, recentTime:time}, (err, result) => {
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
                restful.callNotify(null, document.user,'서명(수신) 완료 알림', '['+document.docTitle+']' + ' 의 서명(수신)이 완료되었습니다.');
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
                      restful.callNotify(document.user, usersTodo,'서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.', null, docId);
                    } else {
                      console.log('쪽지 전송 NO: 이미 쪽지 보냄')
                    }
                  }

                  // 쪽지 보내기 (순차 발송 - 서명 대상자에게)
                  // restful.callNotify(document.user, usersTodo,'서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.');
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

// WITHPDF
// 문서 상태 변경 (사인)
router.post('/update', ValidateToken, (req, res) => {

  // TODO 서명자의 IP 정보 남기기
  // console.log("client IP: " +requestIp.getClientIp(req));

  // console.log(req.body.docId)
  // console.log(req.body.uid)
  // console.log(req.body.xfdf)
  if (!req.body.docId || !req.body.user || !req.body.items) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const docId = req.body.docId
  const user = req.body.user
  const updateItems = req.body.items
  // const usersTodo = req.body.usersTodo

  const time = new Date()
  const ip = requestIp.getClientIp(req)
  var isLast = false;

  Document.findOne({ _id: req.body.docId }, (err, document) => {
    if (document) {
      let { signedBy, canceledBy, users, items, docRef } = document;
      
      console.log(signedBy.some(e => e.user === user))
      if (! (signedBy.some(e => e.user === user) || canceledBy.some(e => e.user === user))) {

        let signedByArray = [...signedBy, {user:user, signedTime:time, ip:ip}];

        // console.log('before items', items);
        // update item : 기존 항목은 update 하고 신규 항목은 추가해준다.
        updateItems.forEach(item => {
          const idx = items.findIndex(el => el.id === item.id);
          console.log('idx', idx);
          if (idx >= 0) {
            items[idx] = item;
          } else {
            items.push(item);
          }
        })
        // console.log('after items', items);

        //S. userTodo 서버 베이스로 변경
        var todo = [];
        if (document.orderType == 'S'){
          if(document.usersTodo?.length > 0) {
            if(document.usersTodo?.filter(e => e!= user).length > 0) {
              todo = document.usersTodo?.filter(e => e!= user)
            } else {
              const arr = document.usersOrder?.filter(e => e.user == document.usersTodo[0])
              if (arr?.length > 0) {
                todo = document.usersOrder?.filter(e => e.order == arr[0].order +1).map(e => e.user)
              }
            }
          }
        }
        console.log("todo", todo)
        //E






        // S. 수신자 SKIPP 처리 ------------------- 2024.09.13
        // 요약: (신청서) 수신자가 마지막 단계에 여러명인 경우 완료처리 해준다. 
        // 1. 수신 요청인지 체크 : user 가 observers 에 포함되어 있는지 확인
        // 2. todo 배열에 사람의 order 가 마지막인지 체크 
        // 3. todo 배열에 나머지도 수신자인지 체크 : todo 배열에 모두가 observers 인지 확인
        // 4. 해당 수신자가 allowSkip=true 인지 ?
        // 5. 위 4가지 조건을 만족 시 todo 배열의 사용자를 signedByArray 에 포함 시킨다.
        // >> signedByArray 의 사용자와 users 가 동일해 지므로 isLast 를 콜백하게 되고 서명완료 문서가 되게 된다.
        if (document.observers.filter(el=> el === user)?.length > 0) {
          console.log('현재 서명자는 수신자!')

          const userOrder = document.usersOrder?.filter(el => el.user === user)?.[0]?.order;
          console.log('userOrder', userOrder)

          if (!(document.usersOrder?.filter(el => el.order === userOrder + 1)?.length > 0)) {
            console.log('현재 서명자가 마지막 단계임')

            if (todo.length > 0 && todo.every(el => document.observers.includes(el))) {
                console.log('todo 에 남은 모두는 수신자임!', todo)

                const allowSkipedTodo = todo.filter(el => document.usersOrder.find(obj => obj.user === el).allowSkip === true)
                console.log('allowSkipedTodo', allowSkipedTodo)
                const passSign = allowSkipedTodo.map(el => {
                  return {user:el, signedTime:time, ip:ip, skipped:true}
                })

                console.log('passSign', passSign)
                signedByArray = [...signedByArray, ...passSign]

            }

          }
        }
        // E. 수신자 SKIPP 처리 -------------------







        Document.updateOne({ _id: docId }, {items: items, signedBy:signedByArray, usersTodo:todo, recentTime:time}, (err, result) => {
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
                restful.callNotify(null, document.user,'서명(수신) 완료 알림', '['+document.docTitle+']' + ' 의 서명(수신)이 완료되었습니다.');
              } 

            } else {
              if (document.orderType == 'S') {
                

                console.log('------------------ SERVER BASE')
                // console.log('usersTodo', usersTodo);
                // console.log('todo', todo);
                // 서버베이스로 변경: usersTodo > todo
                if (todo?.length > 0) {

                  // 22.02.07: 동차에 서명할 사람이 여러 명인 경우 최초에만 메시지 발송하기
                  var arr = document.usersOrder?.filter(e => e.user == todo[0])
                  if (arr?.length > 0) {
                    var sameOrderArr = document.usersOrder?.filter(e => e.order == arr[0].order)
                    if (sameOrderArr?.length == todo?.length) { // 같은 차례에 처음 메시지를 보낸다고 판단 => 메시지 발송
                      // 메시지 발송하기 
                      console.log('쪽지 전송 OK: 순차 전송')
                      restful.callNotify(document.user, todo,'서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.', null, docId );
                    } else {
                      console.log('쪽지 전송 NO: 이미 쪽지 보냄')
                    }
                  }

                  // 쪽지 보내기 (순차 발송 - 서명 대상자에게)
                  // restful.callNotify(document.user, usersTodo,'서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.');
                }
              }
            }

            return res.json({ success: true, docRef: docRef, items: items, isLast: isLast })
        }
        })
      } else {  // 중복 처리 알림
        return res.json({ success: false, message: '이미 처리된 문서입니다!' })
      }
    }
  });
})


// 문서 취소 : updateDocumentToSign
router.post('/updateDocumentCancel', ValidateToken, (req, res) => {

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
      const { canceled, canceledBy, signedBy } = document;
      
      console.log(canceledBy.some(e => e.user === user))
      // if (!canceledBy.some(e => e.user === user)) {
      if (! (signedBy.some(e => e.user === user) || canceledBy.some(e => e.user === user))) {
        const canceledByArray = [...canceledBy, {user:user, canceledTime:time, message: message}];

        Document.updateOne({ _id: docId }, {canceled: true, canceledBy:canceledByArray, recentTime:time}, (err, result) => {
          if (err) {
            console.log(err);
            return res.json({ success: false, message: err })
          } else {
            return res.json({ success: true })
          }
        })

        // 문서 서명 취소 시 요청자에게 쪽지 보내기 : 일반 전송만 (대량 전송 제외)
        if (document.docType == 'G') {
          console.log('쪽지 전송 OK: 서명 취소')
          restful.callNotify(null, document.user,'서명(수신) 취소 알림', '['+document.docTitle+']' + ' 의 서명(수신)이 취소되었습니다.');
        } 

      } else {
        return res.json({ success: false, message: "이미 처리된 문서입니다" })
      }
    }
  });
})

// 요청취소 : updateCancelSigning
// 서명 취소를 등록하고 기존에 서명 이력은 지워준다.
router.post('/updateCancelSigning', ValidateToken, async (req, res) => {

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

  Document.findOne({ _id: req.body.docId }, async (err, document) => {
    if (document) {
      const { canceled, canceledBy, signedBy } = document;
      
      console.log(canceledBy.some(e => e.user === user))

      if (signedBy.some(e => e.user === user)) { // 서명 이력 삭제
        await Document.updateOne({ _id: docId }, {signedBy: []}).exec();
      }
      if (!canceledBy.some(e => e.user === user)) {

        const canceledByArray = [...canceledBy, {user:user, canceledTime:time, message: message}];

        Document.updateOne({ _id: docId }, {canceled: true, canceledBy:canceledByArray, recentTime:time}, (err, result) => {
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
router.post('/searchForDocumentToSign', ValidateToken, (req, res) => {

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
  router.post('/searchForDocumentsSigned', ValidateToken, (req, res) => {

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
  router.post('/documents', ValidateToken, async (req, res) => {

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

    // var order = "requestedTime"
    var order = "recentTime"
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

    andParam['deleted'] = { $ne: true }

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

    // 요청자
    if (req.body.name) {
      var userIds = [];
      var regex = new RegExp(req.body.name[0], 'i');
      var dataList = await User.find({ 'name': regex }).exec();
      for (var idx in dataList) {
        userIds.push(dataList[idx]['_id']);
      }
      andParam['user'] = { $in: userIds };
    }

    // folderId 있을 경우에만 OR 조건 추가 (폴더 접근 권한 체크 추가 필요) - 추후 논의
    // if (req.body.folderId && req.body.folderId !== '') {
    //   andParam['folders'] = req.body.folderId;
    //   // orParam.push( {folders: req.body.folderId } );
    // }
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
      .populate({
        path: "folders",
        select: {folderName: 1, user: 1, docs: 1, shared: 1, sharedTarget: 1},
        populate: {
          path: "user",
          select: {name: 1, JOB_TITLE: 2}
        }
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
router.post('/statics', ValidateToken, (req, res) => {

  const user = req.body.user
  if (!user) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  var totalNum = 0;    // 전체문서 건수
  var toSignNum = 0;   // 서명필요 건수
  var signingNum = 0;  // 서명대기(진행) 건수
  var canceledNum = 0; // 서명취소 건수
  var signedNum = 0;   // 서명완료 건수

  Document.countDocuments({"deleted": {$ne: true}}).or(
    [
      // 본인 요청자
      {"user": user},
      // 본인 참여자
      {$and:[{"orderType": {$ne:'S'}}, {"users": {$in:[user]}}]}, // 동차
      {$and:[{"orderType":      'S'} , {"users": {$in:[user]}}, {"signed": true}]}, // 순차이면서 전체 서명 완료
      {$and:[{"orderType":      'S'} , {"users": {$in:[user]}}, {"signedBy.user": user}]}, // 순차이면서 본인 서명 완료
      {$and:[{"orderType":      'S'} , {"users": {$in:[user]}}, {"usersTodo": {$in:[user]}}]}  // 순차이면서 본인 서명 차례
    ]
  ).exec(function(err, count) {
    if (err) return res.json({success: false, error: err});
    totalNum = count;
    console.log("totalNum:"+totalNum);

    Document.countDocuments({"deleted": {$ne: true}, "signed": false, "canceled": false}).or(
      [ 
        {$and:[{"orderType": {$ne:'S'}}, {"users": {$in:[user]}}, {"signedBy.user": {$ne:user}}]}, // 동차
        {$and:[{"orderType":      'S'} , {"users": {$in:[user]}}, {"usersTodo": {$in:[user]}}]}  // 순차이면서 본인 서명 차례
      ]
    ).exec(function(err, count) {
      if (err) return res.json({success: false, error: err});
      toSignNum = count;
      console.log("toSignNum:"+toSignNum);

      Document.countDocuments({"signed": false, "canceled": false, "deleted": {$ne: true}})
              .or([ {$and:[{"users": {$in:[user]}}, {"signedBy.user": user}]},  {$and:[{"user": user}, {"users": {$ne:user}}]} ])
              // .and([{"users": {$in:[user]}}, {"signedBy.user": user}])
              // .and([{"user": user}, {"users": {$ne:user}}])
              .exec(function(err, count) {
        
        if (err) return res.json({success: false, error: err});
        signingNum = count;
        console.log("signingNum:"+signingNum);

        Document.countDocuments({"canceled": true, "deleted": {$ne: true}}).or([{"users": {$in:[user]}}, {"user": user}]).exec(function(err, count) {
          if (err) return res.json({success: false, error: err});
          canceledNum = count;

          Document.countDocuments({"signed": true, "deleted": {$ne: true}}).or([{"users": {$in:[user]}}, {"user": user}]).exec(function(err, count) {
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
router.post('/document', ValidateToken, (req, res) => {

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

// 문서 폐기 - 취소 상태 문서는 서명 요청자만 폐기 가능
router.post('/delete', ValidateToken, async (req, res) => {
  if (!req.body.usrId || !req.body.docId) {
    return res.json({ success: false, message: 'input value not enough!' });
  }
  Document.findOneAndUpdate(
      { '_id': req.body.docId, 'user': req.body.usrId, 'canceled': true }
    , {'deleted': true, 'deletedBy': [{'user': req.body.usrId, 'deletedTime': new Date()}]}
    ).then((doc, err) => {
    if (err) return res.json({ success: false, err });
    console.log(doc);
    return res.status(200).send({success: true});
  });
});

// 서명 재요청 알림 보내기
router.post('/notify/:type', ValidateToken, async (req, res) => {
  if (!req.params.type || !req.body.usrId) return res.json({ success: false, message: 'input value not enough!' });
  
  if (req.params.type === 'B') {  // 대량
    if (!req.body.bulkId) return res.json({ success: false, message: 'input value not enough!' });
    
    var bulk = await Bulk.findOne({ '_id': req.body.bulkId, 'user': req.body.usrId }).exec();
    if (bulk) {
      var docList = await Document.find({ '_id': {$in: bulk.docs}, 'user': req.body.usrId, 'docType': 'B', 'signed': false, 'canceled': false }).exec();
      var rcvUsers = []
      for (var idx in docList) {
        rcvUsers.push(docList[idx]['users']);
      }
      console.log('rcvUsers : ' + rcvUsers);
      restful.callNotify(req.body.usrId, rcvUsers,'서명(수신) 요청 알림', '['+docList[idx]['docTitle']+']' + ' 서명(수신) 요청 건이 있습니다.', null, req.body.docId );
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }

  } else if (req.params.type === 'G') { // 일반
    if (!req.body.docId) return res.json({ success: false, message: 'input value not enough!' });
    
    var document = await Document.findOne({ '_id': req.body.docId, 'user': req.body.usrId, 'signed': false, 'canceled': false }).exec();
    if (document) {
      if (document.orderType == 'S') { //순차 발송: 대상자에게만 메시지 발송
        restful.callNotify(document.user, document.usersTodo,'서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.', null, req.body.docId );
      } else { //동차 발송: 미서명자에게만 메시지 발송
        document.users = document.users.filter(user => user != document.observers);
        for (var idx in document.signedBy) {
          console.log(document.signedBy[idx]['user']);
          document.users = document.users.filter(user => user != document.signedBy[idx]['user']);
        }
        restful.callNotify(document.user, document.users,'서명(수신) 요청 알림', '['+document.docTitle+']' + ' 서명(수신) 요청 건이 있습니다.', null , req.body.docId );
      }
    }
    
  } else {
    return res.json({ success: false, message: 'input value not enough!' });
  }
});


// 최근시간 업데이트 - 빈값인 경우
router.post('/updateRecentTime', ValidateToken, async (req, res) => {

  Document.find(
      { 'recentTime': null }
    ).then((docs, err) => {

    if (err) return res.json({ success: false, err });

    docs.forEach(doc => {
      console.log(doc._id)
      let recentTime = doc.requestedTime
      if(doc.signed) {  // 서명완료
        recentTime = doc.signedTime
        console.log('서명완료', recentTime)
      } else if(doc.canceled) { //서명취소
        recentTime = doc.canceledBy.length > 0 ? doc.canceledBy.sort((a, b) => b.canceledTime - a.canceledTime)[0].canceledTime : doc.requestedTime
        console.log('서명취소', recentTime)
      } else if (doc.signedBy.length > 0) { //서명진행중
        recentTime = doc.signedBy.sort((a, b) => b.signedTime - a.signedTime)[0].signedTime
        console.log('서명진행중', recentTime)
      } else {
        recentTime = doc.requestedTime
        console.log('서명요청상태', recentTime)
      }

      Document.updateOne({ _id: doc._id }, {recentTime: recentTime}, (err, result) => {
        if (err) {
          console.log(err);
          return res.json({ success: false, message: err })
        }
      });

    })
    
    return res.send({success: true, docsCnt: docs.length});

  });
});

// 문서 다운시 업데이트(최초 1회)
router.post('/updateDownloads', ValidateToken, (req, res) => {
  if (!req.body.usrId || !req.body.docId) {
    return res.json({ success: false, message: 'input value not enough!' });
  }
  Document.findOneAndUpdate( { '_id': req.body.docId }, { $addToSet: {'downloads': req.body.usrId} } ).then((doc, err) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({success: true});
  });
});

// 문서 다운시 업데이트(최초 1회) : 여러 문서 동시에 다운로드 시
router.post('/updateDownloadsAll', ValidateToken, (req, res) => {

  console.log('updateDownloadsAll called', req.body.docIds)
  if (!req.body.usrId || !req.body.docIds) {
    return res.json({ success: false, message: 'input value not enough!' });
  }
  Document.updateMany({'_id': {$in: req.body.docIds}}, {$addToSet: {'downloads': req.body.usrId}}, (err) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({success: true});
  });
});
module.exports = router;