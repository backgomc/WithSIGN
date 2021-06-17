const express = require('express');
const router = express.Router();
const { Document } = require("../models/Document");

// 신규 문서 등록
router.post('/addDocumentToSign', (req, res) => {

    if (!req.body.uid || !req.body.email || !req.body.docRef) {
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

  if (!req.body.docId || !req.body.email || !req.body.xfdf) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const docId = req.body.docId
  const email = req.body.email
  const xfdfSigned = req.body.xfdf

  Document.findOne({ _id: req.body.docId }, (err, document) => {
    if (document) {
      const { signedBy, emails, xfdf, docRef } = document;
      console.log("ABC")
      console.log(emails)

      if (!signedBy.includes(email)) {
        const signedByArray = [...signedBy, email];
        const xfdfArray = [...xfdf, xfdfSigned];

        Document.updateOne({ _id: docId }, {xfdf: xfdfArray, signedBy:signedByArray}, (err, result) => {
          if (err) {
            console.log(err);
            return res.json({ success: false, message: err })
        } else {
            
          if (signedByArray.length === emails.length) {
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

  const email = req.body.email
  if (!email) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  Document.find({ "emails": [email], "signed": false })
      .exec((err, documents) => {
          if (err) return res.json({success: false, error: err});
          return res.json({ success: true, documents: documents })
      })
})

  // 사인한 문서 검색 : searchForDocumentsSigned
  // sample : "{"email":"3thzone@naver.com","sortField":"signedTime","sortOrder":"ascend","pagination":{"current":1,"pageSize":2,"total":3}}"
  router.post('/searchForDocumentsSigned', (req, res) => {

    const email = req.body.email
    if (!email) {
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

    Document.countDocuments({ "emails": [email], "signed": true }).exec(function(err, count) {
      recordsTotal = count;
      console.log("recordsTotal:"+recordsTotal)
      
      Document
      .find({ "emails": [email], "signed": true })
      .sort({[order] : dir})    //asc:오름차순 desc:내림차순
      .skip(Number(start))
      .limit(Number(pageSize))
      .exec((err, documents) => {
          if (err) return res.json({success: false, error: err});
          return res.json({ success: true, documents: documents, total:recordsTotal })
      })

    })


  })
  
  module.exports = router;