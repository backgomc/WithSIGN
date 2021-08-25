const express = require('express');
const router = express.Router();
const { Document } = require("../models/Document");

// 신규 문서 등록
router.post('/addDocumentToSign', (req, res) => {

    if (!req.body.user || !req.body.email || !req.body.docRef) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    const document = new Document(req.body)
  
    document.save((err, documentInfo) => {
      if (err) return res.json({ success: false, err })
      return res.status(200).json({
        success: true
      })
    })
})

// 문서 상태 변경 (사인) : updateDocumentToSign
router.post('/updateDocumentToSign', (req, res) => {

  // console.log(req.body.docId)
  // console.log(req.body.uid)
  // console.log(req.body.xfdf)
  if (!req.body.docId || !req.body.user || !req.body.xfdf) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const docId = req.body.docId
  const user = req.body.user
  const xfdfSigned = req.body.xfdf
  const time = new Date()
  var isLast = false;

  Document.findOne({ _id: req.body.docId }, (err, document) => {
    if (document) {
      const { signedBy, users, xfdf, docRef } = document;
      
      console.log(signedBy.some(e => e.user === user))
      if (!signedBy.some(e => e.user === user)) {

        const signedByArray = [...signedBy, {user:user, signedTime:time}];
        const xfdfArray = [...xfdf, xfdfSigned];

        Document.updateOne({ _id: docId }, {xfdf: xfdfArray, signedBy:signedByArray}, (err, result) => {
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

    // 문서제목 검색
    if (req.body.docTitle) {
      andParam['docTitle'] = { $regex: '.*' + req.body.docTitle[0] + '.*', $options: 'i' }
    }

    console.log("status:"+status)

    if (status) {
      if (status == '서명 대기') {
        andParam['signed'] = false
        orParam = [{$and:[{"users": {$in:[user]}}, {"signedBy.user": user}]},  {$and:[{"user": user}, {"users": {$ne:user}}]}]
      } else if (status == '서명 필요') {
        andParam['users'] = {$in:[user]}
        andParam['signed'] = false
        andParam['signedBy.user'] = {$ne:user}
        console.log("서명필요 called")
      } else if (status == '서명 완료') {
        andParam['signed'] = true
        orParam = [{"users": {$in:[user]}}, {"user": user}];
        console.log("서명완료 called")
      } else if (status == '서명 취소') {
        andParam['canceled'] = true
        orParam = [{"users": {$in:[user]}}, {"user": user}];
        console.log("서명취소 called")
      }
    } else {  // 전체 목록 (status 배열에 복수개가 들어오면 전체 목록 호출)
      orParam = [{"users": {$in:[user]}}, {"user": user}];
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
        select: {name: 1, JOB_TITLE: 2},
        // match: { name : searchName? searchName : !'' }
      })
      .populate({
        path: "users", 
        select: {name: 1, JOB_TITLE: 2}
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

  var totalNum = 0;   // 전체문서 건수
  var toSignNum = 0;  // 서명필요 건수
  var signingNum = 0; // 서명대기(진행) 건수

  Document.countDocuments().or([{"users": {$in:[user]}}, {"user": user}]).exec(function(err, count) {
    if (err) return res.json({success: false, error: err});
    totalNum = count;
    console.log("totalNum:"+totalNum);

    Document.countDocuments({ "users": {$in:[user]}, "signed": false, "signedBy.user": {$ne:user} }).exec(function(err, count) {
      if (err) return res.json({success: false, error: err});
      toSignNum = count;
      console.log("toSignNum:"+toSignNum);

      Document.countDocuments({"signed": false})
              .or([ {$and:[{"users": {$in:[user]}}, {"signedBy.user": user}]},  {$and:[{"user": user}, {"users": {$ne:user}}]} ])
              // .and([{"users": {$in:[user]}}, {"signedBy.user": user}])
              // .and([{"user": user}, {"users": {$ne:user}}])
              .exec(function(err, count) {
        
        if (err) return res.json({success: false, error: err});
        signingNum = count;
        console.log("signingNum:"+signingNum);
        return res.json({ success: true, totalNum:totalNum, toSignNum:toSignNum, signingNum:signingNum })
        
      })

    })

    
  })

})  

module.exports = router;