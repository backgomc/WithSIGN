const express = require('express');
const router = express.Router();
const { Document } = require('../models/Document');
const { Template } = require('../models/Template');
const { User } = require('../models/User');
const fs = require('fs');
const { hexCrypto } = require('../common/utils');
const config = require('../config/key');
const { generateToken, ValidateToken, renewalToken } = require('../middleware/adminAuth');

// -- 로그인/아웃 --
// /api/admin/auth        (GET)
// /api/admin/sso
// /api/admin/refresh
// /api/admin/login
// /api/admin/logout
// -- 사용자 관리 --
// /api/admin/user/list
// /api/admin/user/info
// /api/admin/user/update (권한 변경)
// /api/admin/user/sync   (연계 수동)
// -- 부서 관리 --
// /api/admin/org/list
// /api/admin/org/info
// /api/admin/org/sync    (연계 수동)
// -- 문서 관리 --
// /api/admin/document/list
// /api/admin/document/info
// -- 템플릿 관리 --
// /api/admin/templates/list
// /api/admin/templates/info
// /api/admin/templates/insert
// /api/admin/templates/delete

// 인증 여부 확인
router.get('/auth', ValidateToken, (req, res) => {
  var uid = req.body._id;
  User.findOne({ _id: uid }, (err, user) => {
    if (err) return res.json({ success: false, error: err });
    if (!user) {
      return res.json({
        success: false,
        message: '입력하신 ID에 해당하는 유저가 없습니다.'
      });
    }
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        JOB_TITLE: user.JOB_TITLE,
        DEPART_CODE: user.DEPART_CODE,
        OFFICE_CODE: user.OFFICE_CODE
      }
    });
  });
});

// SSO Token -> 사번 추출 -> 사용자 검색 -> 로그인
router.post('/sso', (req, res) => {
});

// 토큰 갱신
router.post('/refresh', renewalToken, (req, res) => {
  var _id = req.body._id;
  var _tk = req.body._tk;
  console.log(_tk);
  User.findOne({ _id: _id, adminJWT: req.headers['refresh-token'] }, (err, user) => {
    console.log(user);
    if (err) return res.json({ success: false, error: err });
    if (!user) return res.json({ success: false, message: 'No User!!' });
    res.cookie('__aToken__', _tk,  { httpOnly: true, maxAge: 60*60*1000 });
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        JOB_TITLE: user.JOB_TITLE,
        DEPART_CODE: user.DEPART_CODE,
        OFFICE_CODE: user.OFFICE_CODE
      }
    });
  });
});

// 로그인
router.post('/login', (req, res) => {

  var uid;
  if (req.body.SABUN) {
    uid = hexCrypto(req.body.SABUN);
  } else if (req.body.email) {
    uid = hexCrypto(req.body.email);
  } else {
    return res.json({
      success: false,
      message: '잘못된 ID입니다.'
    });
  }
  console.log('uid: '+ uid);

  // 사용자 검색 (사번 또는 이메일)
  User.findOne({ uid: uid }, (err, user) => {
    if (err) return res.json({ success: false, error: err });
    if (!user) {
      return res.json({
        success: false,
        message: '입력하신 ID에 해당하는 유저가 없습니다.'
      });
    }

    // 비밀번호 확인
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (err) return res.json({ success: false, error: err });
      if (!isMatch) return res.json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
      if (!user.terms || !user.privacy) return res.json({ success: false, user: user._id, message: '약관 동의가 필요합니다.' });

      // 토큰 생성
      var {accessToken, refreshToken} = generateToken(user);
      
      // Refresh 토큰 DB 저장
      User.updateOne({ _id: user._id }, {adminJWT: refreshToken}, (err, result) => {
        if (err) return res.json({ success: false, message: err });
        console.log(result);
        res.cookie('__aToken__', accessToken,  { httpOnly: true, maxAge: 24*60*1000 });
        res.status(200).json({
          success: true,
          user: {
            _id: user._id,
            name: user.name,
            JOB_TITLE: user.JOB_TITLE,
            DEPART_CODE: user.DEPART_CODE,
            OFFICE_CODE: user.OFFICE_CODE,
            __rToken__: refreshToken
          }
        });
      });
    });
  });
});

// 로그아웃
router.post('/logout', ValidateToken, (req, res) => {
  User.findOneAndUpdate({ uid: req.user.uid }, { adminJWT: '' }, (err) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({success: true});
  });
});

// 사용자 관리 > 목록
router.post('/user/list', ValidateToken, async (req, res) => {
console.log(req.cookies);
  // 페이징 처리
  const current = req.body.pagination.current;
  const pageSize = req.body.pagination.pageSize;
  var start = 0;
  if (current > 1) {
    start = (current - 1) * pageSize;
  }

  var order = 'name';
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

  // 단어검색 
  var searchStr = {};

  console.log(searchStr);

  // 전체 건수
  var totalCount = await User.countDocuments(searchStr).exec();

  User
    .aggregate([
      {
        $lookup: {
          from: 'orgs',
          localField: 'DEPART_CODE',
          foreignField: 'DEPART_CODE',
          as: 'orgInfo'
        }
      },
      {
        $match: searchStr
      }
    ])
    .sort({ [order]: dir })   //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .exec((err, documents) => {
      // console.log(documents);
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, documents: documents, total: totalCount });
    });
});

// 사용자 관리 > 상세
router.post('/user/info', ValidateToken, (req, res) => {
  return res.json({ success: true, message: 'user/info' });
});

// 사용자 관리 > 변경(권한)
router.post('/user/update', ValidateToken, (req, res) => {
  return res.json({ success: true, message: '/user/update' });
});

// 문서 관리 > 목록
router.post('/document/list', ValidateToken, async (req, res) => {

  // 페이징 처리
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
      // console.log(documents);
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, documents: documents, total: totalCount });
    });
});

// 문서 관리 > 상세
router.post('/document/info', ValidateToken, (req, res) => {
  return res.json({ success: true, message: '/document/info' });
});

// 템플릿 관리 > 목록
router.post('/templates/list', ValidateToken, async (req, res) => {

  // 페이징 처리
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
router.post('/templates/info', ValidateToken, (req, res) => {
  return res.json({ success: true, message: '/templates/info' });
});

// 템플릿 관리 > 등록
router.post('/templates/insert', ValidateToken, (req, res) => {
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
router.post('/templates/delete', ValidateToken, (req, res) => {

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
