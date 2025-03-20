const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Folder } = require('../models/Folder');
const { Document } = require('../models/Document');
const { ValidateToken } = require('../middleware/auth');

// 폴더 생성 (전체 로우 생성)
router.post('/createFolder', ValidateToken, (req, res) => {
  if (!req.body.user || !req.body.folderName) return res.json({ success: false, message: 'input value not enough!' });
  var folder = new Folder(req.body);
  folder.save((err) => {
    if (err) return res.json({ success: false, err });
    return res.json({ success: true });
  });
});

// 폴더 수정 (관련 필드 수정)
router.post('/updateFolder', ValidateToken, async (req, res) => {
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
router.post('/deleteFolder', ValidateToken, async (req, res) => {
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
    Document.updateMany({}, { $pull: {'folders': req.body._id} }, (err) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).send({success: true});
    });
  });
});

// 폴더 조회 (폴더 기준 목록)
router.post('/selectFolder', ValidateToken, async (req, res) => {
  if (!req.body._id || !req.body.user) return res.json({ success: false, message: 'input value not enough!' });

  try {

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

    // if (req.body._id === 'DEFAULT') {
    //   // 기본 폴더 조회
      
    //   let folders = await Folder.find({ 'user': req.body.user }, {'_id': 1}).exec();
    //   Document.find({'deleted': {$ne: true}, 'folders': {$nin: folders}, $or: [
    //     // 요청자 본인
    //     {'user': req.body.user},
    //     // 참여자 본인
    //     {$and:[{'orderType': {$ne:'S'}}, {'users': {$in:[req.body.user]}}]}, // 동차
    //     {$and:[{'orderType':      'S' }, {'users': {$in:[req.body.user]}}  , {'signed': true}]}, // 순차이면서 전체 서명 완료
    //     {$and:[{'orderType':      'S' }, {'users': {$in:[req.body.user]}}  , {'signedBy.user': req.body.user}]}, // 순차이면서 본인 서명 완료
    //     {$and:[{'orderType':      'S' }, {'users': {$in:[req.body.user]}}  , {'usersTodo': {$in:[req.body.user]}}]}  // 순차이면서 본인 서명 차례
    //   ]}, {'_id': 1, 'docTitle': 1, 'docType': 1, 'docRef': 1, 'thumbnail': 1, 'downloads': 1, 'requestedTime': 1, 'recentTime': 1, 'signed': 1})
    //   .exec(function(err, docs) {
    //     if (err) return res.json({ success: false, err });
    //     return res.status(200).send({success: true, docs: docs});
    //   });
    // } else {
      // 그외 폴더 조회
      Folder.findOne({ '_id': req.body._id, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}}} }]})
      .populate({path: 'docs._id',
                 select: {'docType': 1, 'docTitle': 1, 'docRef': 1, 'thumbnail': 1, 'attachFiles':1, 'downloads': 1, 'requestedTime': 1, 'recentTime': 1, 'signed': 1, 'signedTime': 1, 'signedBy': 1,  'canceledBy': 1, 'deletedBy': 1, 'user': 1, 'users': 1},
                 populate: [
                  {
                    path: 'user',
                    select: {name: 1, JOB_TITLE: 2, DEPART_CODE: 3, thumbnail: 4}
                  },
                  {
                    path: 'users',
                    select: {name: 1, JOB_TITLE: 2, DEPART_CODE: 3}
                  } 
                 ]
                })
      .exec(function(err, folder) {
        if (err) return res.json({ success: false, err });
        let docs = [];
        if (folder.docs && folder.docs.length > 0) {
          docs = folder.docs.filter(item => item?._id).map(item => {
            return {'_id': item?._id?._id,
                    'docTitle': item?.alias,
                    'originTitle': item?._id?.docTitle,
                    'docRef': item?._id?.docRef,
                    'thumbnail': item?._id?.thumbnail,
                    'attachFiles': item?._id?.attachFiles,
                    'downloads': item?._id?.downloads,
                    'requestedTime': item?._id?.requestedTime,
                    'recentTime': item?._id?.recentTime,
                    'signed': item?._id?.signed,
                    'signedTime': item?._id?.signedTime,
                    'signedBy': item?._id?.signedBy,
                    'canceledBy': item?._id?.canceledBy,
                    'deletedBy': item?._id?.sigdeletedByned,
                    'folders': [],
                    'user': item?._id?.user,
                    'users': item?._id?.users,}
          });
        }
        return res.status(200).send({success: true, docs: docs});
      });

  } catch (error) {
    return res.json({ success: false, error })
  }

  
  // }
});

// 폴더 목록 (폴더 목록 조회)
router.post('/listFolder', ValidateToken, async (req, res) => {
  if (!req.body.user) return res.json({ success: false, message: 'input value not enough!' });

  try {
    // ['P1810053', 'A00000' ,'A15000' ... ]
    let orgs = [];
    if (req.body.includeOption) { 
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

      if (user.length > 0) {
        orgs = user[0].orgs.map(item => item.DEPART_CODE);
        orgs.push(user[0].SABUN);
      }
      // ----------------- 사용자 [사번, 소속 부서 코드] 종료 -----------------
    }
    
    Folder.find({ $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}}} }] })
    .populate({path: 'user', select: {'_id': 1, 'name': 1, 'JOB_TITLE': 1}})
    .sort({ 'folderName': 1 })
    .then((folder, err) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).send({success: true, folders: folder});
    });
  } catch (error) {
    return res.json({ success: false, error })
  }

});

// 파일 이동 (docs 필드 변경) -> Documents Collection 의 folders Field 변경 (*주의*)
router.post('/moveDocInFolder', ValidateToken, async (req, res) => {
  if (!req.body.user || !req.body.sourceId || !req.body.targetId || !req.body.docIds ) return res.json({ success: false, message: 'input value not enough!' });

  // sourceId='xxxxxxx' --> targetId='xxxxxxx' 정상 처리
  // sourceId='DEFAULT' --> targetId='xxxxxxx' 삭제 없음
  // sourceId='xxxxxxx' --> targetId='DEFAULT' 복사 없음
  // sourceId='???????' --> targetId='???????' 동작 없음
  if (req.body.sourceId === req.body.targetId) return res.status(200).send({success: true});
  
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

  // 1. 기존 폴더의 파일 삭제   >>>>>>> 멀티 처리 변경 (*중요*)
  // if (req.body.sourceId !== 'DEFAULT') {
  //   Folder.findOneAndUpdate({ '_id': req.body.sourceId, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {$pull: {'docs': {$in: docs}}}, (err) => {
  //     if (err) return res.json({ success: false, err });
  //     Document.updateMany({'_id': {$in: req.body.docIds}}, { $pull: {'folders': req.body.sourceId} }, (err) => {
  //       if (err) return res.json({ success: false, err });
  //     });
  //   });
  // }
  // 2. 타겟 폴더로 파일 복사
  // if (req.body.targetId !== 'DEFAULT' ) {
  //   Folder.findOneAndUpdate({ '_id': req.body.targetId, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {$addToSet: {'docs': docs}}, (err) => {
  //     if (err) return res.json({ success: false, err });
  //     Document.updateMany({'_id': {$in: req.body.docIds}}, { $addToSet: {'folders': req.body.targetId} }, (err) => {
  //       if (err) return res.json({ success: false, err });
  //     });
  //   });
  // }

  // 복사용 문서 배열
  let docs = [];
  let temp;

  // 1. 기존 폴더의 문서 삭제
  if ( typeof req.body.sourceId === 'string' ) {

    // 복사용 문서 조회
    temp = await Folder.findOne({'_id': req.body.sourceId}, {'docs': 1});
    docs = temp.docs.filter(item => req.body.docIds.find(e => e === item.id));
    
    // [폴더 관리]에서 문서 이동시 기존 폴더의 정보 삭제 - sourceId 단일 = xxxxx
    Folder.findOneAndUpdate({ '_id': req.body.sourceId, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {$pull: {'docs': {'_id': {$in: req.body.docIds}}}}, (err, folder) => {
      if (err) return res.json({ success: false, err });
      Document.updateMany({'_id': {$in: req.body.docIds}}, { $pull: {'folders': req.body.sourceId} }, (err) => {
        if (err) return res.json({ success: false, err });
      });
    });

  } else {

    // 복사용 문서 조회
    temp = await Document.find({'_id': {$in: req.body.docIds}});
    docs = temp.map(item => {
      return {'_id': new mongoose.Types.ObjectId(item._id), 'alias': item.docTitle}
    });

    // [내 문서함]에서 문서 이동시 기존 폴더의 정보 삭제 - sourceId 멀티 = [{docId: xxx, folderId: xxx}, ... {docId: xxx, folderId: xxx}]
    req.body.sourceId.forEach(pairInfo => {
      if ( pairInfo.folderId ) {
        Folder.findOneAndUpdate({ '_id': pairInfo.folderId, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {$pull: {'docs': {'_id': pairInfo.docId}}}, (err) => {
          if (err) return res.json({ success: false, err });
          Document.findOneAndUpdate({'_id': pairInfo.docId}, { $pull: {'folders': pairInfo.folderId} }, (err) => {
            if (err) return res.json({ success: false, err });
          });
        });
      }
    });
    
  }

  // 2. 타겟 폴더로 문서 복사
  Folder.findOneAndUpdate({ '_id': req.body.targetId, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {$pull: {'docs': {'_id': docs.map(e=>e._id)}}}, (err) => {
    if (err) return res.json({ success: false, err });
    Folder.findOneAndUpdate({ '_id': req.body.targetId, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {$addToSet: {'docs': docs}}, (err) => {
      if (err) return res.json({ success: false, err });
      Document.updateMany({'_id': {$in: req.body.docIds}}, { $addToSet: {'folders': req.body.targetId} }, (err) => {
        if (err) return res.json({ success: false, err });
      });
    });
  });

  return res.status(200).send({success: true});
});

// 파일 복사(to Folder) === moveFodler 복사와 동일
// router.post('/copyDocInFolder', async (req, res) => {
//   if (!req.body.user || !req.body.targetId || !req.body.docIds ) return res.json({ success: false, message: 'input value not enough!' });

//   // ----------------- 사용자 [사번, 소속 부서 코드] 시작 -----------------
//   let user = await User.aggregate([
//     { $match: {'_id': new mongoose.Types.ObjectId(req.body.user)} },
//     { $graphLookup: {
//       'from': 'orgs',
//       'startWith': '$DEPART_CODE',
//       'connectFromField': 'PARENT_NODE_ID',
//       'connectToField': 'DEPART_CODE',
//       'as': 'orgs',
//       'maxDepth': 10,
//       'depthField': 'LEVEL'
//     } },
//   ]).exec();

//   // ['P1810053', 'A00000' ,'A15000' ... ]
//   let orgs = [];
//   if (user.length > 0) {
//     orgs = user[0].orgs.map(item => item.DEPART_CODE);
//     orgs.push(user[0].SABUN);
//   }
//   // ----------------- 사용자 [사번, 소속 부서 코드] 종료 -----------------

//   let documents = await Document.find({'_id': {$in: req.body.docIds}});

//   if (documents.length > 0) {
//     let docs = documents.map(item => {
//       return {'_id': new mongoose.Types.ObjectId(item._id), 'alias': item.docTitle}
//     });
//     Folder.findOneAndUpdate({ '_id': req.body.targetId, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {$addToSet: {'docs': docs}}, (err) => {
//       if (err) return res.json({ success: false, err });
//       Document.updateMany({'_id': {$in: req.body.docIds}}, { $addToSet: {'folders': req.body.targetId} }, (err) => {
//         if (err) return res.json({ success: false, err });
//         return res.status(200).send({success: true});
//       });
//     });
//   }
// });

// 파일 제거(in Folder) === moveFolder 삭제와 동일
router.post('/removeDocInFolder', ValidateToken, async (req, res) => {
  if (!req.body.user || !req.body.sourceId || !req.body.docIds ) return res.json({ success: false, message: 'input value not enough!' });
  
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

  // 복사용 문서 조회
  temp = await Folder.findOne({'_id': req.body.sourceId}, {'docs': 1});
  docs = temp.docs.filter(item => req.body.docIds.find(e => e === item.id));

  // [폴더 관리]에서 문서 이동시 기존 폴더의 정보 삭제 - sourceId 단일 = xxxxx
  Folder.findOneAndUpdate({ '_id': req.body.sourceId, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {$pull: {'docs': {'_id': {$in: req.body.docIds}}}}, (err, folder) => {
    if (err) return res.json({ success: false, err });
    Document.updateMany({'_id': {$in: req.body.docIds}}, { $pull: {'folders': req.body.sourceId} }, (err) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).send({success: true});
    });
  });
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
  console.log(targets);
  let shared = (req.body.targets.length > 0) ? true : false;

  Folder.findOneAndUpdate({ '_id': req.body._id, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }]}, {'shared': shared, 'sharedTarget': targets}, (err, folder) => {
    console.log(err);
    if (err) return res.json({ success: false, err });
    return res.status(200).send({success: true});
  });
});

// 문서 수정
router.post('/renameDocTitle', async (req, res) => {
  if (!req.body._id || !req.body.user || !req.body.docId || !req.body.docTitle) return res.json({ success: false, message: 'input value not enough!' });

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

  Folder.findOneAndUpdate({ '_id': req.body._id, 'docs._id': req.body.docId, $or: [{ 'user': req.body.user }, { 'sharedTarget': {$elemMatch: {'target': {$in: orgs}, 'editable': true}} }] }, {'docs.$.alias': req.body.docTitle}, (err, folder) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({success: true});
  });
});

module.exports = router;
