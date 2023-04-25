const express = require('express');
const router = express.Router();
const { Bulk } = require("../models/Bulk");
const { ValidateToken } = require('../middleware/auth');

// 신규 bulk 등록
router.post('/addBulk', ValidateToken, (req, res) => {

    if (!req.body.user) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    const bulk = new Bulk(req.body)
  
    bulk.save((err, bulk) => {
      if (err) return res.json({ success: false, err })
      return res.status(200).json({
        success: true
      })
    })
})

// bulk 목록 
router.post('/bulks', ValidateToken, (req, res) => {

  const user = req.body.user
  if (!user) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const status = req.body.status
  
  // 단어검색 
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

  andParam['user'] = user

  // 문서제목 검색
  if (req.body.docTitle) {
    andParam['docTitle'] = { $regex: '.*' + req.body.docTitle[0] + '.*', $options: 'i' }
  }
  
  console.log("status:"+status)

  if (status) {
    if (status == '취소') {
      andParam['canceled'] = true
    } else if (status == '완료') {
      andParam['signed'] = true
    } else if (status == '진행중') {
      andParam['canceled'] = false
      andParam['signed'] = false
    } 
  }

  Bulk.countDocuments(andParam).or(orParam).exec(function(err, count) {
    recordsTotal = count;
    console.log("recordsTotal:"+recordsTotal)
    
    Bulk
    .find(andParam).or(orParam)
    .sort({[order] : dir})    //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    // .populate("user", {name: 1, email: 2})
    .populate({
      path: "user", 
      select: {name: 1, JOB_TITLE: 2, DEPART_CODE: 3}
      // match: { name : searchName? searchName : !'' }
    })
    .populate({
      path: "users", 
      select: {name: 1, JOB_TITLE: 2,  DEPART_CODE: 3}
    })
    .populate({
      path: "docs"
      // select: {name: 1, JOB_TITLE: 2}
    })
    .exec((err, bulks) => {
        if (err) return res.json({success: false, error: err});
        return res.json({ success: true, bulks: bulks, total:recordsTotal })
    })

  })

})



module.exports = router;