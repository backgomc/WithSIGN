const express = require('express');
const router = express.Router();
const { Template } = require('../models/Template');
const fs = require('fs');
const config = require('../config/key');

// -- 사용자 관리 --
// /api/admin/user/list
// /api/admin/user/info
// /api/admin/user/update
// -- 문서 관리 --
// /api/admin/document/list
// /api/admin/document/info
// -- 템플릿 관리 --
// /api/admin/templates/list
// /api/admin/templates/info
// /api/admin/templates/insert
// /api/admin/templates/delete

// 사용자 관리 > 목록
router.post('/user/list', (req, res) => {
  return res.json({ success: true, message: '/user/list' })
})
// 사용자 관리 > 상세
router.post('/user/info', (req, res) => {
  return res.json({ success: true, message: 'user/info' })
})
// 사용자 관리 > 변경(권한)
router.post('/user/update', (req, res) => {
  return res.json({ success: true, message: '/user/update' })
})

// 문서 관리 > 목록
router.post('/document/list', (req, res) => {
  return res.json({ success: true, message: '/document/list' })
})
// 문서 관리 > 상세
router.post('/document/info', (req, res) => {
  return res.json({ success: true, message: '/document/info' })
})

// 템플릿 관리 > 목록
router.post('/templates/list', (req, res) => {
  // const uid = req.body.uid
  // if (!uid) {
  //     return res.json({ success: false, message: 'input value not enough!' })
  // }

  // 단어검색 
  var searchStr;
  if (req.body.docTitle) {
    var regex = new RegExp(req.body.docTitle[0], 'i')
    searchStr = { $and: [{'docTitle': regex}] };
  } else {
    searchStr = {};
  }

  const current = req.body.pagination.current
  const pageSize = req.body.pagination.pageSize
  var start = 0
  if (current > 1) {
    start = (current - 1) * pageSize
  }

  var order = 'registeredTime' 
  var dir = 'desc'
  if (req.body.sortField) {
    order = req.body.sortField
  }
  if (req.body.sortOrder) {
    if (req.body.sortOrder == 'ascend'){
      dir = 'asc'
    } else {
      dir = 'desc'
    }
  }

  var recordsTotal = 0;

  // Template.countDocuments(searchStr).or([{'user': uid}]).exec(function(err, count) {
    Template.countDocuments(searchStr).or([{'type': 'C'}]).exec(function(err, count) {
    recordsTotal = count;
    console.log('recordsTotal:'+recordsTotal)
    
    Template
    .find(searchStr)
    // .or([{'user': uid}])
    .or([{'type': 'C'}])
    .sort({[order] : dir})    //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .populate({
      path: 'user', 
      select: {name: 1, JOB_TITLE: 2}
    })
    .exec((err, data) => {
        console.log(data);
        if (err) return res.json({success: false, error: err});
        return res.json({ success: true, templates: data, total:recordsTotal })
    })
  })
})

// 템플릿 관리 > 상세
router.post('/templates/info', (req, res) => {
  return res.json({ success: true, message: '/templates/info' })
})

// 템플릿 관리 > 등록
router.post('/templates/insert', (req, res) => {
  if (!req.body.user) {
    return res.json({ success: false, message: 'input value not enough!' })
  }

  const template = new Template(req.body)

  template.save((err, documentInfo) => {
    if (err) return res.json({ success: false, err })
    return res.status(200).json({
      success: true
    })
  })
})

// 템플릿 관리 > 삭제
router.post('/templates/delete', (req, res) => {

  if (!req.body._ids) {
    return res.json({ success: false, message: 'input value not enough!' })
  }
  
  const _ids = req.body._ids

  // 스토리지 파일 삭제
  Template
  .find({'_id' : {$in: _ids} })
  .exec((err, rows) => {
    rows.forEach(template => {
      console.log(template.docRef)
      fs.unlink(config.storageDIR + template.docRef, function (err) {
        if (err) {                                                 
          console.error(err);
          return res.json({ success: false, err });                                    
        }                                                          
        console.log('File has been Deleted');                           
      });
    });

    // DB 삭제
    Template.deleteMany({_id: { $in: _ids}}, function(err) {
      if (err) { return res.json({ success: false, err }) }
      return res.status(200).json({ success: true})     
    })
  })
})

module.exports = router;