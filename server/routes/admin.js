const express = require('express');
const router = express.Router();
const { Document } = require("../models/Document");
const { Template } = require('../models/Template');
const { User } = require('../models/User');
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
  const current = req.body.pagination.current;
  const pageSize = req.body.pagination.pageSize;
  var start = 0;
  if (current > 1) {
    start = (current - 1) * pageSize;
  }

  var order = 'requestedTime';
  var dir = 'desc';
  if (req.body.sortField) {
    order = req.body.sortField;
  }
  if (req.body.sortOrder) {
    if (req.body.sortOrder == 'ascend') {
      dir = 'asc';
    } else {
      dir = 'desc';
    }
  }

  var recordsTotal = 0;

  var andParam = {};
  var orParam = {};

  // 문서제목 검색
  if (req.body.docTitle) {
    andParam['docTitle'] = { $regex: '.*' + req.body.docTitle[0] + '.*', $options: 'i' }
  }

  Document.countDocuments(andParam).or(orParam).exec(function (err, count) {
    recordsTotal = count;
    console.log('recordsTotal:' + recordsTotal);

    Document
      .find(andParam).or(orParam)
      .sort({ [order]: dir })    //asc:오름차순 desc:내림차순
      .skip(Number(start))
      .limit(Number(pageSize))
      // .populate('user', {name: 1, email: 2})
      .populate({
        path: 'user',
        select: { name: 1, JOB_TITLE: 2, image: 3 },
        // match: { name : searchName? searchName : !'' }
      })
      .populate({
        path: 'users',
        select: { name: 1, JOB_TITLE: 2 }
      })
      .exec((err, documents) => {
        // console.log(documents);
        // documents = documents.filter(function(document) {
        //   return document.user
        // });
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, documents: documents, total: recordsTotal });
      });
  });
});

// 사용자 관리 > 상세
router.post('/user/info', (req, res) => {
  return res.json({ success: true, message: 'user/info' });
});

// 사용자 관리 > 변경(권한)
router.post('/user/update', (req, res) => {
  return res.json({ success: true, message: '/user/update' });
});

// 문서 관리 > 목록
router.post('/document/list', async (req, res) => {

  // 단어검색 
  var searchStr = {};

  // 문서명
  if (req.body.docTitle) {
    var regex = new RegExp(req.body.docTitle[0], 'i');
    searchStr['docTitle'] = new RegExp(regex, 'i');
  }

  // 요청자
  if (req.body.name) {
    var userIds = [];
    var regex = new RegExp(req.body.name[0], 'i');
    var dataList = await User.find({ name: regex }).exec();
    for (var idx in dataList) {
      userIds.push(dataList[idx]['_id']);
    }
    searchStr['user'] = { $in: userIds };
  }

  const current = req.body.pagination.current;
  const pageSize = req.body.pagination.pageSize;
  var start = 0;
  if (current > 1) {
    start = (current - 1) * pageSize;
  }

  var order = 'requestedTime';
  var dir = 'desc';
  if (req.body.sortField) {
    order = req.body.sortField;
  }
  if (req.body.sortOrder) {
    if (req.body.sortOrder == 'ascend') {
      dir = 'asc';
    } else {
      dir = 'desc';
    }
  }

  console.log(searchStr);

  // 전체 건수
  var totalCount = await Document.countDocuments(searchStr).exec();

  Document
    .find(searchStr)
    .sort({ [order]: dir })   //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .populate({
      path: 'user',
      select: { name: 1, JOB_TITLE: 2, image: 3 },
    })
    .populate({
      path: 'users',
      select: { name: 1, JOB_TITLE: 2 }
    })
    .exec((err, documents) => {
      console.log(documents);
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, documents: documents, total: totalCount });
    });
});

// 문서 관리 > 상세
router.post('/document/info', (req, res) => {
  return res.json({ success: true, message: '/document/info' });
});

// 템플릿 관리 > 목록
router.post('/templates/list', async (req, res) => {

  // 단어검색 
  var searchStr = {};

  // 템플릿 이름
  if (req.body.docTitle) {
    var regex = new RegExp(req.body.docTitle[0], 'i');
    searchStr['docTitle'] = new RegExp(regex, 'i');
  }

  // 생성자
  if (req.body.name) {
    var userIds = [];
    var regex = new RegExp(req.body.name[0], 'i');
    var dataList = await User.find({ name: regex }).exec();
    for (var idx in dataList) {
      userIds.push(dataList[idx]['_id']);
    }
    searchStr['user'] = { $in: userIds };
  }

  // 공통 템플릿
  searchStr['type'] = 'C';

  const current = req.body.pagination.current;
  const pageSize = req.body.pagination.pageSize;
  var start = 0;
  if (current > 1) {
    start = (current - 1) * pageSize;
  }

  var order = 'registeredTime';
  var dir = 'desc';
  if (req.body.sortField) {
    order = req.body.sortField;
  }
  if (req.body.sortOrder) {
    if (req.body.sortOrder == 'ascend') {
      dir = 'asc';
    } else {
      dir = 'desc';
    }
  }

  console.log(searchStr);

  // 전체 건수
  var totalCount = await Template.countDocuments(searchStr).exec();

  Template
    .find(searchStr)
    .sort({ [order]: dir })   //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .populate({
      path: 'user',
      select: { name: 1, JOB_TITLE: 2 }
    })
    .exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, templates: data, total: totalCount });
    });
});

// 템플릿 관리 > 상세
router.post('/templates/info', (req, res) => {
  return res.json({ success: true, message: '/templates/info' });
});

// 템플릿 관리 > 등록
router.post('/templates/insert', (req, res) => {
  if (!req.body.user) {
    return res.json({ success: false, message: 'input value not enough!' });
  }

  const template = new Template(req.body);

  template.save((err, documentInfo) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true
    });
  });
});

// 템플릿 관리 > 삭제
router.post('/templates/delete', (req, res) => {

  if (!req.body._ids) {
    return res.json({ success: false, message: 'input value not enough!' });
  }

  const _ids = req.body._ids;

  // 스토리지 파일 삭제
  Template
    .find({ '_id': { $in: _ids } })
    .exec((err, rows) => {
      rows.forEach(template => {
        console.log(template.docRef);
        fs.unlink(config.storageDIR + template.docRef, function (err) {
          if (err) {
            console.error(err);
            return res.json({ success: false, err });
          }
          console.log('File has been Deleted');
        });
      });

      // DB 삭제
      Template.deleteMany({ _id: { $in: _ids } }, function (err) {
        if (err) { return res.json({ success: false, err }); }
        return res.status(200).json({ success: true });
      });
    });
})

module.exports = router;