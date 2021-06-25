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

  console.log(req.body.docId)
  console.log(req.body.uid)
  console.log(req.body.xfdf)
  if (!req.body.docId || !req.body.uid || !req.body.xfdf) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const docId = req.body.docId
  const uid = req.body.uid
  const xfdfSigned = req.body.xfdf

  Document.findOne({ _id: req.body.docId }, (err, document) => {
    if (document) {
      const { signedBy, users, xfdf, docRef } = document;
      
      if (!signedBy.includes(uid)) {
        const signedByArray = [...signedBy, uid];
        const xfdfArray = [...xfdf, xfdfSigned];

        Document.updateOne({ _id: docId }, {xfdf: xfdfArray, signedBy:signedByArray}, (err, result) => {
          if (err) {
            console.log(err);
            return res.json({ success: false, message: err })
        } else {
            
          if (signedByArray.length === users.length) {
            const time = new Date();

            Document.updateOne({ _id: docId }, 
              {signed: true, signedTime:time}, (err, result) => {
                if (err) {
                  console.log(err);
                  return res.json({ success: false, message: err })
                }
            });
          }

          return res.json({ success: true, docRef: docRef, xfdfArray: xfdfArray })

        }
        })
      }

    }
  });


  // const document = new Document(req.body)

  // document.save((err, documentInfo) => {
  //   if (err) return res.json({ success: false, err })
  //   return res.status(200).json({
  //     success: true
  //   })
  // })
})

// 사인 대상 문서 검색 : searchForDocumentToSign
router.post('/searchForDocumentToSign', (req, res) => {

  // const uid = req.body.email
  // if (!uid) {
  //     return res.json({ success: false, message: "input value not enough!" })
  // } 

  // Document.find({ "users": [uid], "signed": false })
  //     .exec((err, documents) => {
  //         if (err) return res.json({success: false, error: err});
  //         return res.json({ success: true, documents: documents })
  //     })

  const uid = req.body.uid
  if (!uid) {
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

  Document.countDocuments({ "users": {$in:[uid]}, "signed": false, "signedBy": {$nin:[uid]} }).exec(function(err, count) {
    recordsTotal = count;
    console.log("recordsTotal:"+recordsTotal)
    
    Document
    .find({ "users": {$in:[uid]}, "signed": false, "signedBy": {$nin:[uid]} })
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

  // 사인한 문서 검색 : searchForDocumentsSigned 
  // sample : "{"email":"3thzone@naver.com","sortField":"signedTime","sortOrder":"ascend","pagination":{"current":1,"pageSize":2,"total":3}}"
  router.post('/searchForDocumentsSigned', (req, res) => {

    const uid = req.body.uid
    if (!uid) {
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

    Document.countDocuments({ "users": {$in:[uid]}, "signed": true }).exec(function(err, count) {
      recordsTotal = count;
      console.log("recordsTotal:"+recordsTotal)
      
      Document
      .find({ "users": {$in:[uid]}, "signed": true })
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

    const uid = req.body.uid
    if (!uid) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    // 단어검색 
    // ISSUE1: 이름 검색의 경우 populate 의 match 함수를 사용해야 하는데 전체 글 수와 매치가 어려움 
    // ISSUE2: 같은 단어를 넣어도 조회됬다가 안됬다가 하는 현상 발생 
    var searchStr;
    // var searchName;
    console.log("docTitle:"+req.body.docTitle)
    console.log("name:"+req.body.name)
    if (req.body.docTitle) {
      var regex = new RegExp(req.body.docTitle[0], "i")
      searchStr = { $and: [{'docTitle': regex}] };
    // } else if (req.body.name) {
    //   var regex = new RegExp(req.body.name[0], "i")
    //   searchStr = req.body.name[0];
    //   searchName = req.body.name[0]
    } else {
        searchStr = {};
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

    Document.countDocuments(searchStr).or([{ "users": {$in:[uid]} }, {"user": uid}]).exec(function(err, count) {
      recordsTotal = count;
      console.log("recordsTotal:"+recordsTotal)
      
      Document
      .find(searchStr).or([{ "users": {$in:[uid]} }, {"user": uid}])
      .sort({[order] : dir})    //asc:오름차순 desc:내림차순
      .skip(Number(start))
      .limit(Number(pageSize))
      // .populate("user", {name: 1, email: 2})
      .populate({
        path: "user", 
        select: {name: 1, email: 2},
        // match: { name : searchName? searchName : !'' }
      })
      .exec((err, documents) => {
          console.log(documents);
          // documents = documents.filter(function(document) {
          //   return document.user
          // });
          if (err) return res.json({success: false, error: err});
          return res.json({ success: true, documents: documents, total:recordsTotal })
      })

    })

  })

  module.exports = router;