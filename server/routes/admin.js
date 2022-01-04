const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../config/key');
const restful = require('../common/restful');
const { hexCrypto, generateRandomPass } = require('../common/utils');
const { Board } = require('../models/Board');
const { Document } = require('../models/Document');
const { Template } = require('../models/Template');
const { Org } = require('../models/Org');
const { User } = require('../models/User');
const { generateToken, ValidateToken, renewalToken } = require('../middleware/adminAuth');
const { makeFolder } = require('../common/utils');
const fs = require('fs');
const path = require('path');

const java = require('java');
const jarFilePath1 = __dirname+'/../lib/INICrypto_v4.0.12.jar';
const jarFilePath2 = __dirname+'/../lib/INISAFECore_v2.1.23.jar';
const jarFilePath3 = __dirname+'/../lib/INISAFEPKI_v1.1.13jar';
const jarFilePath4 = __dirname+'/../lib/INISAFEToolSet_v1.0.2.jar';
const jarFilePath5 = __dirname+'/../lib/nls_v4.1.3.jar';
const jarFilePath6 = __dirname+'/../lib/log4j-1.2.16.jar';
const jarFilePath7 = __dirname+'/../lib/NH_SSO.jar';
java.classpath.push(jarFilePath1);
java.classpath.push(jarFilePath2);
java.classpath.push(jarFilePath3);
java.classpath.push(jarFilePath4);
java.classpath.push(jarFilePath5);
java.classpath.push(jarFilePath6);
java.classpath.push(jarFilePath7);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('req.body.path : ' + req.body.path);
      
    if (req.body.path) {
      var newDir = config.storageDIR + req.body.path;
      console.log('newDir : ' + newDir);
      makeFolder(newDir);
      cb(null, newDir);
    } else {
      cb(null, config.storageDIR + 'temp/');
    }
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname);
  }
});
const upload = multer({storage});

// -- 로그인/아웃 --
// /admin/auth        (GET)
// /admin/sso
// /admin/refresh
// /admin/login
// /admin/logout
// -- 사용자/부서 관리 --
// /admin/user/list
// /admin/user/info
// /admin/user/update (정보 변경)
// /admin/user/push   (알림 점검)
// /admin/user/sync   (연계 수동)
// /admin/org/list
// /admin/org/info
// /admin/org/sync    (연계 수동)
// -- 문서 관리 --
// /admin/document/list
// /admin/document/info
// /admin/document/down
// /
// -- 템플릿 관리 --
// /admin/templates/list
// /admin/templates/info
// /admin/templates/insert
// /admin/templates/delete
// /admin/templates/upload
// -- 게시판 관리 --
// /admin/board/list
// /admin/board/detail
// /admin/board/insert
// /admin/board/update
// /admin/board/delete
// /admin/board/attach
// /admin/board/addComment
// /admin/board/delComment;

// 시스템 연계 확인용
router.post('/ipronet', (req, res) => {
  // restful.callOrgAPI();
  // restful.callUserAPI();
  // restful.callIpronetMSG('P1650047', 'P1810080;P0610003;P1650047');
  restful.callNotify('6179ff170293112fbceef449',['6179ff170293112fbceef449','6179feef0293112fbceef445'],'title','content');
  // var DocuUtil = java.import('com.nonghyupit.drm.DocuUtil');
  // DocuUtil.unpackagingSync('C:/Users/NHIT_LSW/Desktop/', 'MiNe.xlsx', 'C:/Users/NHIT_LSW/Desktop/TEST.xlsx');
});



///////////////////////////////////////////////////////////////////////// 계정 인증 서비스 시작 /////////////////////////////////////////////////////////////////////////
// 인증 여부 확인
router.get('/auth', ValidateToken, (req, res) => {
  var uid = req.body.systemId;
  User.findOne({ '_id': uid }, (err, user) => {
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
        OFFICE_CODE: user.OFFICE_CODE,
        thumbnail: user.thumbnail
      }
    });
  });
});

// SSO Token -> 사번 추출 -> 사용자 검색 -> 로그인
router.post('/sso', (req, res) => {
  var LoginUtil = java.import('com.nonghyupit.sso.LoginUtil');
  var sabun = LoginUtil.getIdSync(req.body.token);
  console.log('token : ' + req.body.token);
  console.log('sabun : ' + sabun);

  var uid;
  if (sabun) {
    uid = hexCrypto(sabun);
  } else {
    return res.json({ success: false, message: '잘못된 ID입니다.'});
  }
  console.log('uid: '+ uid);

  User.findOne({ 'uid': uid }, (err, user) => {
    if (err) return res.json({ success: false, error: err });
    if (user) {
      // 토큰 생성
      var {accessToken, refreshToken} = generateToken(user);
      User.updateOne({ '_id': user._id }, {'adminJWT': refreshToken}, (err, result) => {
        if (err) return res.json({ success: false, message: err });
        console.log(result);
        res.cookie('__aToken__', accessToken,  { httpOnly: true, maxAge: 12*60*60*1000 });
        res.status(200).json({
          success: true,
          user: {
            _id: user._id,
            name: user.name,
            JOB_TITLE: user.JOB_TITLE,
            DEPART_CODE: user.DEPART_CODE,
            OFFICE_CODE: user.OFFICE_CODE,
            thumbnail: user.thumbnail,
            __rToken__: refreshToken
          }
        });
      });
    } else {
      return res.json({ success: false, message: '입력하신 ID에 해당하는 유저가 없습니다.'});
    }
  });
});

// 토큰 갱신
router.post('/refresh', renewalToken, (req, res) => {
  var _id = req.body.systemId;
  var _tk = req.body.accessTk;
  console.log(_tk);
  User.findOne({ '_id': _id, 'adminJWT': req.headers['refresh-token'] }, (err, user) => {
    // console.log(user);
    if (err) return res.json({ success: false, error: err });
    if (!user) return res.json({ success: false, message: 'No User!!' });
    res.cookie('__aToken__', _tk,  { httpOnly: true, maxAge: 12*60*60*1000 });
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        JOB_TITLE: user.JOB_TITLE,
        DEPART_CODE: user.DEPART_CODE,
        OFFICE_CODE: user.OFFICE_CODE,
        thumbnail: user.thumbnail
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
  User.findOne({ 'uid': uid }, (err, user) => {
    if (err) return res.json({ success: false, error: err });
    if (!user || user.role !== 1) {
      return res.json({
        success: false,
        message: '관리자 계정 정보를 찾을 수 업습니다.'
      });
    }
    
    // 비밀번호 확인
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (err) return res.json({ success: false, error: err });
      if (!isMatch) return res.json({ success: false, message: '비밀번호를 확인할 수 없습니다.' });
      if (!user.terms || !user.privacy) return res.json({ success: false, user: user._id, message: '사용자 페이지에서 약관 동의가 필요합니다.' });

      // 토큰 생성
      var {accessToken, refreshToken} = generateToken(user);
      
      // Refresh 토큰 DB 저장
      User.updateOne({ '_id': user._id }, {'adminJWT': refreshToken}, (err, result) => {
        if (err) return res.json({ success: false, message: err });
        console.log(result);
        res.cookie('__aToken__', accessToken,  { httpOnly: true, maxAge: 12*60*60*1000 });
        res.status(200).json({
          success: true,
          user: {
            _id: user._id,
            name: user.name,
            JOB_TITLE: user.JOB_TITLE,
            DEPART_CODE: user.DEPART_CODE,
            OFFICE_CODE: user.OFFICE_CODE,
            thumbnail: user.thumbnail,
            __rToken__: refreshToken
          }
        });
      });
    });
  });
});

// 로그아웃
router.post('/logout', ValidateToken, (req, res) => {
  User.findOneAndUpdate({ '_id': req.body._id }, { 'adminJWT': '' }, (err) => {
    if (err) return res.json({ success: false, err });
    res.cookie('__aToken__', '__aToken__', { httpOnly: true, maxAge: 0 });
    return res.status(200).send({success: true});
  });
});
///////////////////////////////////////////////////////////////////////// 계정 인증 서비스 종료 /////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////// 사용자/부서 관리 시작 /////////////////////////////////////////////////////////////////////////
// 사용자 관리 > 목록
router.post('/user/list', ValidateToken, async (req, res) => {
console.log(req.cookies);
  // 페이징 처리
  var current = req.body.pagination.current;
  var pageSize = req.body.pagination.pageSize;
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
  var condition = [];
  
  // 사용자
  if (req.body.name && req.body.name != '') {
    condition.push({'name': new RegExp(req.body.name[0], 'i')});
  }

  // 부서명
  if (req.body.org && req.body.org != '') {
    condition.push({'orgInfo.DEPART_NAME': new RegExp(req.body.org[0], 'i')});
  }

  if (condition.length > 0) searchStr = {$and: condition}
  console.log(searchStr);

  // 전체 건수
  var totalCount = await User.aggregate([
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
  ]);
  
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
    .exec((err, users) => {
      // console.log(users);
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, users: users, total: totalCount.length });
    });
});

// 사용자 관리 > 상세
router.post('/user/info', ValidateToken, (req, res) => {
  return res.json({ success: true, message: 'user/info' });
});

// 사용자 관리 > 변경(정보)
router.post('/user/update', ValidateToken, async (req, res) => {
  User.findOne({ '_id': req.body.i }).then((user, err) => {
    if (err) return res.json({ success: false, err });
    if (req.body.k == 'init') {var pwd = generateRandomPass(); user.password = pwd;}
    if (req.body.k == 'flag') user.use = !user.use;
    if (req.body.k == 'auth') user.role = 1 - user.role;
    user.save((err) => {
      if (err) return res.json({ success: false, err });
      if (req.body.k == 'init') restful.callNotify(null, user,'[WithSIGN] 임시 비밀번호 발급', 'WithSIGN 임시 비밀번호는 ' + pwd + ' 입니다.');
      return res.status(200).send({success: true});
    });
  });
});

// 사용자 관리 > 알림(점검)
router.post('/user/sendPush', ValidateToken, (req, res) => {
  restful.callNotify(req.body.sendInfo, req.body.recvInfo, req.body.title, req.body.content, req.body.thumbnail);
  return res.json({success: true,  message: '호출 성공'});
});

// 사용자 관리 > 연계 호출
router.post('/user/sync', ValidateToken, async (req, res) => {
  var result = await restful.callUserAPI();
  if (result && result.status && result.status == 200) {
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
});

// 부서 관리 > 연계 호출
router.post('/org/lis', ValidateToken, (req, res) => {
});

// 부서 관리 > 연계 호출
router.post('/org/info', ValidateToken, (req, res) => {
  if (!req.body.DEPART_CODE) {
    return res.json({ success: false, message: 'input value not enough!' });
  }

  Org.find({ 'DEPART_CODE': {$in: req.body.DEPART_CODE } }).exec(function(err, results) {
    if (err) return res.json({ success: false, message: err });
    if (results.length > 0) {
      return res.send({ success: true, results: results });
    } else {
      return res.send({ success: false,  message: '해당 조직이 없습니다.' });
    }
  });
});

// 부서 관리 > 연계 호출
router.post('/org/sync', ValidateToken, async (req, res) => {
  var result = await restful.callOrgAPI();
  if (result && result.status && result.status == 200) {
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
});
///////////////////////////////////////////////////////////////////////// 사용자/부서 관리 종료 /////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////// 문서 관리 서비스 시작 /////////////////////////////////////////////////////////////////////////
// 문서 관리 > 목록
router.post('/document/list', ValidateToken, async (req, res) => {
  // 페이징 처리
  var current = req.body.pagination.current;
  var pageSize = req.body.pagination.pageSize;
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
    var dataList = await User.find({ 'name': regex }).exec();
    for (var idx in dataList) {
      userIds.push(dataList[idx]['_id']);
    }
    searchStr['user'] = { $in: userIds };
  }

  console.log(searchStr);

  // 전체 건수
  var totalCount = await Document.countDocuments(searchStr).exec();

  Document.find(searchStr)
    .sort({ [order]: dir })   //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .populate({
      path: 'user',
      select: { name: 1, JOB_TITLE: 2, DEPART_CODE: 3 },
    })
    .populate({
      path: 'users',
      select: { name: 1, JOB_TITLE: 2, DEPART_CODE: 3 }
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

// 문서 관리 > 다운(DRM)
router.get('/document/down/:class/:docId', ValidateToken, async (req, res) => {
  console.log(req.params.class);
  console.log(req.params.docId);
  if (!req.params.class || !req.params.docId) return res.json({ success: false, message: 'input value not enough!' });
  try {
      var dataInfo;
      if (req.params.class === 'documents') dataInfo = await Document.findOne({ '_id': req.params.docId });
      if (req.params.class === 'templates') dataInfo = await Template.findOne({ '_id': req.params.docId });
      if (dataInfo && dataInfo.docRef) {
          var fileInfo = dataInfo.docRef;
          var filePath = fileInfo.substring(0, fileInfo.lastIndexOf('/'));
          var fileName = fileInfo.substring(fileInfo.lastIndexOf('/')+1, fileInfo.length);
          var copyPath = filePath.replace(req.params.class, 'temp') + fileName;
          // console.log(fileName);
          // console.log(filePath);
          // console.log(copyPath);
          if (fs.existsSync(fileInfo)) { // 파일 존재 체크
              await restful.callDRMPackaging(filePath, fileName, copyPath);
              var filestream = fs.createReadStream(copyPath);
              filestream.pipe(res);
        } else {
          return res.json({ success: false, message: 'file download failed!' });
        }
      } else {
          return res.json({ success: false, message: 'file download failed!' });
      }
  } catch (e) {
    console.log(e);
    return res.json({ success: false, message: 'file download failed!' });
  }
});
///////////////////////////////////////////////////////////////////////// 문서 관리 서비스 종료 /////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////// 템플릿 문서 관리 시작 /////////////////////////////////////////////////////////////////////////
// 템플릿 관리 > 목록
router.post('/templates/list', ValidateToken, async (req, res) => {

  // 페이징 처리
  var current = req.body.pagination.current;
  var pageSize = req.body.pagination.pageSize;
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
    var dataList = await User.find({ 'name': regex }).exec();
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

  Template.find(searchStr)
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
  
  if (!req.body.user || !req.body.docRef) return res.json({ success: false, message: 'input value not enough!' });
  
  var origin = req.body.docRef;
  var target = req.body.docRef.replace('temp', 'templates');
  
  // File Access
  fs.access(origin, fs.constants.F_OK, (err) => {
    if (err) return console.log('not found origin file!');
    var dirName = path.dirname(target);
    makeFolder(dirName);
    
    // File Move
    fs.rename(origin, target, (err) => {
      if (err) return console.log('failed move file!');
      
      // DB Save
      req.body.docRef = target;
      var template = new Template(req.body);
      template.save((err) => {
        if (err) return res.json({ success: false, err });
        return res.status(200).json({ success: true });
      });
    });
  });
});

// 템플릿 관리 > 삭제
router.post('/templates/delete', ValidateToken, (req, res) => {
  if (!req.body._ids) {
    return res.json({ success: false, message: 'input value not enough!' });
  }

  var _ids = req.body._ids;

  // 스토리지 파일 삭제
  Template.find({ '_id': { $in: _ids } }).exec((err, templates) => {
    if (err) return res.json({ success: false, err });
    templates.forEach(template => {
      console.log(template.docRef);
      fs.unlink(template.docRef, function (err) {
        if (err) console.error(err);
      });
    });
    // DB 삭제
    Template.deleteMany({ '_id': { $in: _ids } }, function (err) {
      if (err) return res.json({ success: false, err });
      return res.status(200).json({ success: true });
    });
  });
});

// 템플릿 관리 > 업로드(임시파일)
router.post('/templates/upload', ValidateToken, upload.single('file'), async (req, res) => {
  if (req.file) {
      await restful.callDRMUnpackaging(req.file.destination, req.file.originalname);
      return res.json({ success: true, file: req.file });
  } else {
      return res.json({ success: false, message: 'file upload failed'});
  }
  
});
///////////////////////////////////////////////////////////////////////// 템플릿 문서 관리 종료 /////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////// 게시판 정보 관리 시작 /////////////////////////////////////////////////////////////////////////
// 게시판 관리 > 목록
router.post('/board/list', ValidateToken, async (req, res) => {

  // 페이징 처리
  var current = req.body.pagination.current;
  var pageSize = req.body.pagination.pageSize;
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
  if (req.body.title) {
    var regex = new RegExp(req.body.title[0], 'i');
    searchStr['title'] = new RegExp(regex, 'i');
  }

  // 생성자
  if (req.body.name) {
    var userIds = [];
    var regex = new RegExp(req.body.name[0], 'i');
    var dataList = await User.find({ 'name': regex }).exec();
    for (var idx in dataList) {
      userIds.push(dataList[idx]['_id']);
    }
    searchStr['user'] = { $in: userIds };
  }

  // 공통 템플릿
  if (req.body.boardType) searchStr['boardType'] = req.body.boardType;

  console.log(searchStr);

  // 전체 건수
  var totalCount = await Board.countDocuments(searchStr).exec();

  Board.find(searchStr)
    .sort({ [order]: dir })   //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .populate({
      path: 'user',
      select: { name: 1, JOB_TITLE: 2 }
    })
    .populate({
      path: 'comments.user', 
      select: {name: 1, JOB_TITLE: 2}
    })
    .exec((err, data) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true, boards: data, total: totalCount });
    });
});

// 게시판 관리 > 상세
router.post('/board/detail', ValidateToken, (req, res) => {
  
  if (!req.body.boardId) return res.json({ success: false, message: 'input value not enough!' });
  
  var boardId = req.body.boardId;
  
  Board.findOne({ '_id': boardId })
  .populate({
    path: 'user', 
    select: {name: 1, JOB_TITLE: 2}
  })
  .populate({
    path: 'comments.user', 
    select: {name: 1, JOB_TITLE: 2, thumbnail: 3}
  })
  .then((board, err) => {
    if (err) return res.json({success: false, error: err});
    return res.json({ success: true, board: board });
  });
});

// 게시판 관리 > 등록
router.post('/board/insert', ValidateToken, (req, res) => {
  if (!req.body.user || !req.body.title || !req.body.content || !req.body.boardType) {
    return res.json({ success: false, message: 'input value not enough!' });
  } 

  var board = new Board(req.body);
  board.save((err) => {
    if (err) return res.json({ success: false, err });
    return res.json({ success: true });
  });
});

// 게시판 관리 > 수정
router.post('/board/update', ValidateToken, (req, res) => {
  if (!req.body.boardId || !req.body.title || !req.body.content) {
    return res.json({ success: false, message: 'input value not enough!' });
  }

  // 첨부파일 삭제
  if (req.body.filesDeleted) {
    req.body.filesDeleted.forEach(file => {
      fs.access(file.url, fs.constants.F_OK, (err) => { // 파일 삭제
        if (err) return console.log('삭제할 수 없는 파일입니다');
        fs.unlink(file.url, (err) => err ? console.log(err) : console.log(`${file.name} 을 정상적으로 삭제했습니다`));
      });
    });
  }

  Board.updateOne({ '_id': req.body.boardId }, {'title': req.body.title, 'content': req.body.content, 'files': req.body.files}, (err) => {
    if (err) return res.json({ success: false, message: err });
    return res.json({ success: true});
  });
});

// 게시판 관리 > 삭제
router.post('/board/delete', ValidateToken, (req, res) => {
  if (!req.body.boardId) {
    return res.json({ success: false, message: 'input value not enough!' });
  }

  // 스토리지 파일 삭제
  Board.findOne({ '_id': req.body.boardId }).exec((err, board) => {
    if (err) return res.json({ success: false, message: err });
    if (board.files.length > 0) {
      board.files.forEach(file => {
        var fileDir = file.destination;
        fs.access(fileDir, fs.constants.F_OK, (err) => {
          if (err) return console.log(err);
          fs.rmdirSync(fileDir, { recursive: true });
        });
      });
    }
    // DB 삭제
    Board.deleteOne({ '_id': req.body.boardId }, function (err) {
      if (err) return res.json({ success: false, err });
      return res.json({ success: true });
    });
  });
});

// 게시판 관리 > 첨부
router.post('/board/attach', ValidateToken, upload.array('files'), (req, res) => {
  if (req.files) {
      return res.json({ success: true, files: req.files });
  } else {
      return res.json({ success: false, message: 'file upload failed'});
  }
});

// 게시판 관리 > 댓글 등록
router.post('/board/addComment', ValidateToken, (req, res) => {
  if (!req.body.user || !req.body.boardId || !req.body.content) {
    return res.json({ success: false, message: 'input value not enough!' });
  }
  Board.updateOne({ '_id': req.body.boardId }, { $addToSet: { 'comments': {'user': req.body.user, 'content': req.body.content} } }, (err) => {
    if (err) return res.json({ success: false, message: err });
    return res.json({ success: true});
  });
});

// 게시판 관리 > 댓글 삭제
router.post('/board/delComment', ValidateToken, (req, res) => {
  if (!req.body.boardId || !req.body.commentId) {
    return res.json({ success: false, message: "input value not enough!" });
  }
  Board.updateOne({ '_id': req.body.boardId }, { $pull: { 'comments': {'_id': req.body.commentId} } }, (err) => {
    if (err) return res.json({ success: false, message: err });
    return res.json({ success: true});
  });
});
///////////////////////////////////////////////////////////////////////// 게시판 정보 관리 종료 /////////////////////////////////////////////////////////////////////////

module.exports = router;
