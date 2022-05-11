const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User } = require("../models/User");
const { Folder } = require("../models/Folder");
const { Document } = require("../models/Document");

// 폴더 생성 (전체 로우 생성)
router.post('/createFolder', (req, res) => {
  if (!req.body.user || !req.body.folderName) return res.json({ success: false, message: 'input value not enough!' });
  var folder = new Folder(req.body);
  folder.save((err) => {
    if (err) return res.json({ success: false, err });
    return res.json({ success: true });
  });
});

// 폴더 수정 (관련 필드 수정)
router.post('/updateFolder', async (req, res) => {
  if (!req.body._id || !req.body.user || !req.body.folderName) return res.json({ success: false, message: 'input value not enough!' });

  // ----------------- 사용자 [사번, 소속 부서 코드] 시작 -----------------
  let user = await User.aggregate([
    { $match: {'_id': new mongoose.Types.ObjectId(req.body.user)} },
    { $graphLookup: {
      'from': 'orgs',
      'startWith': '$DEPART_CODE',
      'connectFromField': 'PARENT_NODE_ID',
      'connectToField': 'DEPART_CODE',
      'as': 'orgs',
      'maxDepth': 10,
      'depthField': 'LEVEL'
    } },
  ]).exec();

  // ['P1810053', 'A00000' ,'A15000' ... ]
  let orgs = [];
  if (user.length > 0) {
    orgs = user[0].orgs.map(item => item.DEPART_CODE);
    orgs.push(user[0].SABUN);
  }
  // ----------------- 사용자 [사번, 소속 부서 코드] 종료 -----------------

  Folder.findOneAndUpdate({ '_id': req.body._id, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }] }, {'folderName': req.body.folderName}, (err, folder) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({success: true});
  });
});

// 폴더 삭제 (전체 로우 삭제) -> Documents Collection 의 folders Field 변경
router.post('/deleteFolder', async (req, res) => {
  if (!req.body._id || !req.body.user) return res.json({ success: false, message: 'input value not enough!' });
  
  // ----------------- 사용자 [사번, 소속 부서 코드] 시작 -----------------
  let user = await User.aggregate([
    { $match: {'_id': new mongoose.Types.ObjectId(req.body.user)} },
    { $graphLookup: {
      'from': 'orgs',
      'startWith': '$DEPART_CODE',
      'connectFromField': 'PARENT_NODE_ID',
      'connectToField': 'DEPART_CODE',
      'as': 'orgs',
      'maxDepth': 10,
      'depthField': 'LEVEL'
    } },
  ]).exec();

  // ['P1810053', 'A00000' ,'A15000' ... ]
  let orgs = [];
  if (user.length > 0) {
    orgs = user[0].orgs.map(item => item.DEPART_CODE);
    orgs.push(user[0].SABUN);
  }
  // ----------------- 사용자 [사번, 소속 부서 코드] 종료 -----------------
    
  Folder.deleteOne({ '_id': req.body._id, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }] }, (err, folder) => {
    if (err) return res.json({ success: false, err });
    


    // TODO : documents 조회후 필드 업데이트
    


    return res.status(200).send({success: true});
  });
});

// 폴더 조회 (폴더 기준 목록)
router.post('/selectFolder', (req, res) => {
});

// 폴더 목록 (폴더 목록 조회)
router.post('/listFolder', async (req, res) => {
  if (!req.body.user) return res.json({ success: false, message: 'input value not enough!' });
  
    // ----------------- 사용자 [사번, 소속 부서 코드] 시작 -----------------
    let user = await User.aggregate([
      { $match: {'_id': new mongoose.Types.ObjectId(req.body.user)} },
      { $graphLookup: {
        'from': 'orgs',
        'startWith': '$DEPART_CODE',
        'connectFromField': 'PARENT_NODE_ID',
        'connectToField': 'DEPART_CODE',
        'as': 'orgs',
        'maxDepth': 10,
        'depthField': 'LEVEL'
      } },
    ]).exec();
  
    // ['P1810053', 'A00000' ,'A15000' ... ]
    let orgs = [];
    if (user.length > 0) {
      orgs = user[0].orgs.map(item => item.DEPART_CODE);
      orgs.push(user[0].SABUN);
    }
    // ----------------- 사용자 [사번, 소속 부서 코드] 종료 -----------------
  
  Folder.find({ $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}}} }] }).sort({ 'folderName': 1 }).then((folder, err) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({success: true, folders: folder});
  });
});

// 파일 이동 (docs 필드 변경) -> Documents Collection 의 folders Field 변경 (*주의*)
router.post('/moveFolder', async (req, res) => {
  if (!req.body._id || !req.body.user || !req.body.docIds ) return res.json({ success: false, message: 'input value not enough!' });
  
  // ----------------- 사용자 [사번, 소속 부서 코드] 시작 -----------------
  let user = await User.aggregate([
    { $match: {'_id': new mongoose.Types.ObjectId(req.body.user)} },
    { $graphLookup: {
      'from': 'orgs',
      'startWith': '$DEPART_CODE',
      'connectFromField': 'PARENT_NODE_ID',
      'connectToField': 'DEPART_CODE',
      'as': 'orgs',
      'maxDepth': 10,
      'depthField': 'LEVEL'
    } },
  ]).exec();

  // ['P1810053', 'A00000' ,'A15000' ... ]
  let orgs = [];
  if (user.length > 0) {
    orgs = user[0].orgs.map(item => item.DEPART_CODE);
    orgs.push(user[0].SABUN);
  }
  // ----------------- 사용자 [사번, 소속 부서 코드] 종료 -----------------
  
  let documents = await Document.find({'_id': {$in: req.body.docIds}});
  if (documents.length > 0) {
    let docs = documents.map(item => {
      return {'document': item._id, 'alias': item.docTitle}
    });

    // 1. 타겟 폴더로 복사
    Folder.findOneAndUpdate({ '_id': req.body._id, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {'docs': docs}, (err, folder) => {
      if (err) return res.json({ success: false, err });
      Document.updateMany({'_id': {$in: req.body.docIds}}, { $push: {'folders': req.body._id} }, (err) => {
        if (err) return res.json({ success: false, err });
        return res.status(200).send({success: true});
      });
    });

    // 2. 기존 폴더의 권한 있는 경우 문서 정보 삭제
    // Folder.replace() // 여러 폴더 와 권한으로 조회해서 해당문서 제거
    // docList 배열 > item에서 folderList 배열 > 본인 폴더만 추출 > 타겟 폴더 제외한 폴더는 제거 대상 폴더 list
    // 위 최종 list에서 doclist 배열들도 날리기
    
  } else {
    return res.json({ success: false });
  }
});

// 파일 삭제(in Folder)
router.post('/removeDocInFolder', async (req, res) => {

});

// 공유 수정
router.post('/shareFolder', async (req, res) => {
  if (!req.body._id || !req.body.user || !req.body.targets) return res.json({ success: false, message: 'input value not enough!' });
  
  // ----------------- 사용자 [사번, 소속 부서 코드] 시작 -----------------
  let user = await User.aggregate([
    { $match: {'_id': new mongoose.Types.ObjectId(req.body.user)} },
    { $graphLookup: {
      'from': 'orgs',
      'startWith': '$DEPART_CODE',
      'connectFromField': 'PARENT_NODE_ID',
      'connectToField': 'DEPART_CODE',
      'as': 'orgs',
      'maxDepth': 10,
      'depthField': 'LEVEL'
    } },
  ]).exec();

  // ['P1810053', 'A00000' ,'A15000' ... ]
  let orgs = [];
  if (user.length > 0) {
    orgs = user[0].orgs.map(item => item.DEPART_CODE);
    orgs.push(user[0].SABUN);
  }
  // ----------------- 사용자 [사번, 소속 부서 코드] 종료 -----------------
  
  let targets = req.body.targets.map(data => ({target: data.split('|')[0], editable: req.body.editable}));
  let shared = (req.body.targets.length > 0) ? true : false;

  Folder.findOneAndUpdate({ '_id': req.body._id, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {'shared': shared, 'sharedTarget': targets}, (err, folder) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({success: true});
  });
});

module.exports = router;
