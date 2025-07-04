const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User } = require("../models/User");
const { Org } = require("../models/Org");
const restful = require('../common/restful');
const jwt = require('jsonwebtoken');
var fs = require('fs');
var url = require('url');
const { hexCrypto, isEmpty, generateRandomPass } = require('../common/utils');
const { auth, generateToken, ValidateToken, renewalToken } = require("../middleware/auth");

const java = require('java');
const jarFilePath1 = __dirname+'/../lib/INICrypto_v4.0.12.jar';
const jarFilePath2 = __dirname+'/../lib/INISAFECore_v2.1.23.jar';
const jarFilePath3 = __dirname+'/../lib/INISAFEPKI_v1.1.13.jar';
const jarFilePath4 = __dirname+'/../lib/INISAFEToolSet_v1.0.2.jar';
const jarFilePath5 = __dirname+'/../lib/nls_v4.1.3.jar';
const jarFilePath6 = __dirname+'/../lib/NH_SSO.jar';
const jarFilePath7 = __dirname+'/../lib/log4j-1.2.16.jar';
java.classpath.push(jarFilePath1);
java.classpath.push(jarFilePath2);
java.classpath.push(jarFilePath3);
java.classpath.push(jarFilePath4);
java.classpath.push(jarFilePath5);
java.classpath.push(jarFilePath6);
java.classpath.push(jarFilePath7);

router.post('/register', (req, res) => {

    // CHECK EMAIL EXISTANCE
    User.findOne({ email: req.body.email }, (err, exists) => {
      if (err) return res.status(400).send(err);
      if(exists){
          return res.json({
            success: false,
              error: "이미 가입된 Email이 존재합니다.",
               code: 4
          });
        } else {
          // SAVE USER 
          const user = new User(req.body)
                  
          user.save((err, userInfo) => {
            if (err) return res.json({ success: false, err })
            return res.status(200).json({
              success: true
            })
          })
        }
    });

})
  
router.post('/login', (req, res) => {
  
    var uid;
    if (req.body.SABUN) {
      uid = hexCrypto(req.body.SABUN)
    } else if (req.body.email) {
      uid = hexCrypto(req.body.email)
    } else {
      return res.json({
        success: false,
        message: "잘못된 ID입니다."
      })
    }

    console.log("uid: "+ uid)
    //요청된 이메일을 데이터베이스에서 있는지 찾는다.
    // User.findOne({ email: req.body.email }, (err, user) => {
    User.findOne({ uid: uid, 'use': true }, (err, user) => {
      // console.log('user', user)
      if (!user) {
        return res.json({
          success: false,
          message: "입력하신 ID에 해당하는 유저가 없습니다."
        })
      }
  
      //요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호 인지 확인.
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (err) return res.json({ success: false, error: err });
        if (!isMatch) return res.json({ success: false, message: "비밀번호가 일치하지 않습니다." })

        // console.log('user:'+user)
        // console.log(typeof user.terms)
        if (!user.terms || !user.privacy || req.body.SABUN === req.body.password) {
          return res.json({ success: false, user: user._id, message: "약관 동의가 필요합니다." })
        }

        // 토큰 생성
        var {accessToken, refreshToken} = generateToken(user);

        // Refresh 토큰 DB 저장
        User.updateOne({ '_id': user._id }, {'tokenJWT': refreshToken}, async (err, result) => {
          if (err) return res.json({ success: false, message: err });
          console.log(result);

          // 조직 정보 셋팅
          let OFFICE_NAME = '';
          let DEPART_NAME = '';        
          const orgInfo = await Org.findOne({ DEPART_CODE: user?.DEPART_CODE });
          if(orgInfo) {
            OFFICE_NAME = orgInfo.OFFICE_NAME;
            DEPART_NAME = orgInfo.DEPART_NAME;
          }
          user.OFFICE_NAME = OFFICE_NAME;
          user.DEPART_NAME = DEPART_NAME;

          // 패스워드 제외 셋팅 
          user.password = ""

          // Refresh 토큰 셋팅
          user.__rToken__ = refreshToken;

          res.cookie('__aToken__', accessToken,  { httpOnly: true, maxAge: 12*60*60*1000 });
          res.status(200).json({
            success: true,
            user: user
          });
        });

        //비밀번호 까지 맞다면 토큰을 생성하기.
        // user.generateToken(async (err, user) => {
        //   if (err) return res.status(400).send(err);
  
        //   // 패스워드 빼고 리턴 
        //   user.password = ""

        //   // 조직 정보 셋팅
        //   let OFFICE_NAME = '';
        //   let DEPART_NAME = '';        
        //   const orgInfo = await Org.findOne({ DEPART_CODE: user?.DEPART_CODE });
        //   if(orgInfo) {
        //     OFFICE_NAME = orgInfo.OFFICE_NAME;
        //     DEPART_NAME = orgInfo.DEPART_NAME;
        //   }
        //   user.OFFICE_NAME = OFFICE_NAME;
        //   user.DEPART_NAME = DEPART_NAME;

        //   // 토큰을 저장한다.  어디에 ?  쿠키 , 로컬스토리지 
        //   res.cookie("x_auth", user.token)
        //     .status(200)
        //     .json({ success: true, user: user })
        // })


      })
    })
})
  
  
// role 1 어드민    role 2 특정 부서 어드민 
// role 0 -> 일반유저   role 0이 아니면  관리자 
router.get('/auth', ValidateToken, async (req, res) => {
  //여기 까지 미들웨어를 통과해 왔다는 얘기는  Authentication 이 True 라는 말.

  // const user = req.user
  // user.compareUid(user.email, (err, isMatch) => {
  //   console.log("isMatch:"+isMatch)
  // })

  // console.log("email crypto: "+hexCrypto(req.user.email))

  const uid = req.body.systemId;

  User.findOne({ '_id': uid, 'use': true }, async (err, user) => {
    if (err) return res.json({ success: false, error: err });
    if (!user) {
      return res.json({
        success: false,
        message: '입력하신 ID에 해당하는 유저가 없습니다.'
      });
    }

    let OFFICE_NAME = '';
    let DEPART_NAME = '';
  
    const orgInfo = await Org.findOne({ DEPART_CODE: user.DEPART_CODE });
    if(orgInfo) {
      OFFICE_NAME = orgInfo.OFFICE_NAME;
      DEPART_NAME = orgInfo.DEPART_NAME;
    }

    user.OFFICE_NAME = OFFICE_NAME;
    user.DEPART_NAME = DEPART_NAME;

    // 패스워드 제외 셋팅 
    user.password = ""

    // 관리자 유무 셋팅 
    user.isAdmin = user.role === 0 ? false : true;
    user.isAuth = true;

    return res.status(200).json({
      success: true,
      user: user
    });
  });


  // let OFFICE_NAME = '';
  // let DEPART_NAME = '';

  // const orgInfo = await Org.findOne({ DEPART_CODE: req.user.DEPART_CODE });
  // if(orgInfo) {
  //   OFFICE_NAME = orgInfo.OFFICE_NAME;
  //   DEPART_NAME = orgInfo.DEPART_NAME;
  // }
  
  // res.status(200).json({
  //   _id: req.user._id,
  //   isAdmin: req.user.role === 0 ? false : true,
  //   isAuth: true,
  //   email: req.user.email,
  //   name: req.user.name,
  //   lastname: req.user.lastname,
  //   role: req.user.role,
  //   image: req.user.image,
  //   uid: req.user.uid,
  //   JOB_TITLE: req.user.JOB_TITLE,
  //   DEPART_CODE: req.user.DEPART_CODE,
  //   OFFICE_CODE: req.user.OFFICE_CODE,
  //   OFFICE_NAME: OFFICE_NAME,
  //   DEPART_NAME: DEPART_NAME,
  //   SABUN: req.user.SABUN,
  //   thumbnail: req.user.thumbnail
  // })


})

// SSO Token -> 사번 추출 -> 사용자 검색 -> 로그인
router.post('/sso', (req, res) => {
  var LoginUtil = java.import('com.nonghyupit.sso.LoginUtil');
  var sabun = LoginUtil.getIdSync(req.body.token)
  console.log('token : ' + req.body.token)
  console.log('sabun : ' + sabun)

  var uid;
  if (sabun) {
    uid = hexCrypto(sabun)
  } else {
    return res.json({
      success: false,
      message: "잘못된 ID입니다."
    })
  }
  console.log("uid: "+ uid)

  User.findOne({ uid: uid, 'use': true }, (err, user) => {
    if (user) {
      if (!user.terms || !user.privacy) return res.json({ success: false, user: user._id, message: "약관 동의가 필요합니다." });

      // 토큰 생성
      var {accessToken, refreshToken} = generateToken(user);

      User.updateOne({ '_id': user._id }, {'tokenJWT': refreshToken}, async (err, result) => {
        if (err) return res.json({ success: false, message: err });
        console.log(result);

        // 조직 정보 셋팅
        let OFFICE_NAME = '';
        let DEPART_NAME = '';        
        const orgInfo = await Org.findOne({ DEPART_CODE: user?.DEPART_CODE });
        if(orgInfo) {
          OFFICE_NAME = orgInfo.OFFICE_NAME;
          DEPART_NAME = orgInfo.DEPART_NAME;
        }
        user.OFFICE_NAME = OFFICE_NAME;
        user.DEPART_NAME = DEPART_NAME;

        // 패스워드 제외 셋팅 
        user.password = ""

        // Refresh 토큰 셋팅
        user.__rToken__ = refreshToken;

        res.cookie('__aToken__', accessToken,  { httpOnly: true, maxAge: 12*60*60*1000 });
        res.status(200).json({
          success: true,
          isAuth: true,
          user: user
        });  

      });

      // user.generateToken(async (err, user) => {
      //   if (err) return res.status(400).send(err);
      //   user.password = ""

      //   // 조직 정보 셋팅
      //   let OFFICE_NAME = '';
      //   let DEPART_NAME = '';        
      //   const orgInfo = await Org.findOne({ DEPART_CODE: user?.DEPART_CODE });
      //   if(orgInfo) {
      //     OFFICE_NAME = orgInfo.OFFICE_NAME;
      //     DEPART_NAME = orgInfo.DEPART_NAME;
      //   }
      //   user.OFFICE_NAME = OFFICE_NAME;
      //   user.DEPART_NAME = DEPART_NAME;

      //   res.cookie("x_auth", user.token)
      //     .status(200)
      //     .json({ success: true, isAuth: true, user: user })
      // })
    } else {
      return res.json({
        success: false,
        message: "입력하신 ID에 해당하는 유저가 없습니다."
      })
    }
  })
})

//모바일 NHWith 인증(NHWith 쪽지 접속)
//reqID로 with서버 확인 -> 전달받은 사번으로 사용자 정보 확인
router.post('/withAuth', async (req, res) => {
  let reqID = req.body.reqID
  console.log(reqID)

  //reqID 입력된 경우
  if(reqID){
    //모바일 기기 및 웹뷰여부 확인
    const userAgent = req.headers['user-agent']; // `User-Agent` 헤더

    //if(isWebView(userAgent) || isMobile(userAgent)){
    if(isWebView(userAgent)){
      console.log('isWebView true!');
    } else {
      return res.json({ success: false, message: "req wv fail" })
    }

    try{
      //req정보 확인
      let result = await restful.callNHWithAuth(reqID)

      if(result){
        if(result.data.success){
          uid = hexCrypto(result.data.records[0].sabun)
          console.log(uid)

          User.findOne({ uid: uid, 'use': true }, (err, user) => {
            if (user) {
              if (!user.terms || !user.privacy) return res.json({ success: false, user: user._id, message: "약관 동의가 필요합니다." });
        
              // 토큰 생성
              var {accessToken, refreshToken} = generateToken(user);
        
              User.updateOne({ '_id': user._id }, {'tokenJWT': refreshToken}, async (err, result) => {
                if (err) return res.json({ success: false, message: err });
                console.log(result);
        
                // 조직 정보 셋팅
                let OFFICE_NAME = '';
                let DEPART_NAME = '';        
                const orgInfo = await Org.findOne({ DEPART_CODE: user?.DEPART_CODE });
                if(orgInfo) {
                  OFFICE_NAME = orgInfo.OFFICE_NAME;
                  DEPART_NAME = orgInfo.DEPART_NAME;
                }
                user.OFFICE_NAME = OFFICE_NAME;
                user.DEPART_NAME = DEPART_NAME;
        
                // 패스워드 제외 셋팅 
                user.password = ""
        
                // Refresh 토큰 셋팅
                user.__rToken__ = refreshToken;
        
                res.cookie('__aToken__', accessToken,  { httpOnly: true, maxAge: 12*60*60*1000 });
                res.status(200).json({
                  success: true,
                  isAuth: true,
                  user: user
                });  
        
              });

            } else {
              return res.json({ success: false, message: "WithSign 사용자 정보가 없습니다." })
            }
          })
        } else {
          console.log("req fail")
          return res.json({ success: false, message: "req fail" })
        }
      } else {
        console.log("res fail")
        return res.json({ success: false, message: "res fail" })
      }
    } catch (error) {
      console.log("res try fail")
      console.log(error)
      return res.json({ success: false, message: "res try fail" })
    }

  } else {
    console.log("req null")
    return res.json({ success: false, message: "req null" })
  }

})

router.post('/logout', ValidateToken, (req, res) => {

  User.findOneAndUpdate({ '_id': req.body._id }, { 'tokenJWT': '' }, (err) => {
    if (err) return res.json({ success: false, err });
    res.cookie('__aToken__', '__aToken__', { httpOnly: true, maxAge: 0 });
    return res.status(200).send({success: true});
  });

  // User.findOneAndUpdate({ uid: req.user.uid },
  //   { token: "" }
  //   , (err, user) => {
  //     if (err) return res.json({ success: false, err });
  //     return res.status(200).send({
  //       success: true
  //     })
  //   })

})

/*
    USER LIST: POST /list
*/
router.post('/list', ValidateToken, (req, res) => {

  var searchStr;

  try {

    if (req.body.OFFICE_CODE) {
      searchStr = { $and: [{OFFICE_CODE: req.body.OFFICE_CODE}, {use: true}] };
    } else {
      searchStr = { use: true };
    }
  
    User
    .find(searchStr)
    // .sort({"name" : 0})    //0:오름차순 -1:내림차순 //{order : dir};
    .sort({"JOB_CODE" : 0})    //0:오름차순 -1:내림차순 //{order : dir};
    .exec(function(err, results) {
  
        if (err) return next(err)
  
        res.send({
            success: true,
            users: results
        })
    })
    
  } catch (error) {
    return res.json({ success: false, error })
  }
});

/*
    ORG INSERT: POST /org
*/
router.post('/orgInsert', ValidateToken, (req, res) => {

  fs.readFile('./public/mock/org.json', 'utf8', (error, jsonFile) => {
    if (error) return console.log(error);

    const jsonData = JSON.parse(jsonFile);
    // console.log(jsonFile);

    jsonData.forEach(org => {
        console.log(org);

        const orgInfo = new Org()
        orgInfo.OFFICE_NAME = org.OFFICE_NAME
        orgInfo.OFFICE_CODE = org.OFFICE_CODE
        orgInfo.DEPART_CODE = org.DEPART_CODE
        orgInfo.DEPART_NAME = org.DEPART_NAME
        orgInfo.PARENT_NODE_ID = org.PARENT_NODE_ID //이게 오류
        orgInfo.DISPLAY_ORDER = org.DISPLAY_ORDER

        // orgInfo.save((err, orgInfo) => {
        //   if (err) return res.json({ success: false, err })
        // })        
        Org.findOne({ DEPART_CODE: orgInfo.DEPART_CODE }, (err, exists) => {
          if(!exists) {
            orgInfo.save((err, orgInfo) => {
              if (err) return res.json({ success: false, err })
            })
          }
        });
    });
  });

  return res.status(200).json({
    success: true
  })

});


/*
    ORG LIST: POST /orgList
*/
router.post('/orgList', ValidateToken, (req, res) => {

  if (!req.body.OFFICE_CODE) {
    return res.json({ success: false, message: "input value not enough!" })
} 

  Org
  .find({"OFFICE_CODE" : req.body.OFFICE_CODE})
  .sort({"DISPLAY_ORDER" : 0})    //0:오름차순 -1:내림차순 //{order : dir};
  .exec(function(err, results) {

      if (err) return next(err)

      res.send({
          success: true,
          orgs: results
      })
  })
});

/*
    ORG NAME: POST /orgInfo
    INPUT: DEPART_CODE
    OUTPUT: Org
*/
router.post('/orgInfo', ValidateToken, (req, res) => {

  if (!req.body.DEPART_CODE) {
    return res.json({ success: false, message: "input value not enough!" })
  } 

  Org
  .find({"DEPART_CODE" : req.body.DEPART_CODE})
  // .sort({"name" : 0})    //0:오름차순 -1:내림차순 //{order : dir};
  .exec(function(err, results) {

      if (err) return next(err)

      if (results.length > 0) {
        org = results[0]

        res.send({
          success: true,
          org: org
        })
      } else {
        res.send({
          success: false,
          msg: "해당 조직이 없습니다."
        })
      }

  })
});

/*
    ORG NAME: POST /orgInfos
    INPUT: [DEPART_CODE]
    OUTPUT: [Org]
*/
router.post('/orgInfos', ValidateToken, (req, res) => {

  if (!req.body.DEPART_CODES) {
    return res.json({ success: false, message: "input value not enough!" })
  } 

  const DEPART_CODES = req.body.DEPART_CODES
  
  Org
  .find({ 'DEPART_CODE': {$in: DEPART_CODES } })
  // .sort({"name" : 0})    //0:오름차순 -1:내림차순 //{order : dir};
  .exec(function(err, results) {

      if (err) return next(err)

      if (results.length > 0) {
        res.send({
          success: true,
          results: results
        })
      } else {
        res.send({
          success: false,
          msg: "해당 조직이 없습니다."
        })
      }

  })
});

// 유저 업데이트 : updateUser
router.post('/updateUser', ValidateToken, (req, res) => {

  console.log("user:"+req.body.user)
  console.log("email:"+req.body.email)

  if (!req.body.user) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const user = req.body.user
  const email = req.body.email

  User.updateOne({ _id: user }, {email: email}, (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: err })
    } else {
      return res.json({ success: true })
    }
  })

})

// 유저 업데이트 : 약관
router.post('/updateAgreement', (req, res) => {

  console.log("user:"+req.body.user)
  console.log("terms:"+req.body.terms)
  console.log("privacy:"+req.body.privacy)

  if (!req.body.user || !req.body.terms || !req.body.privacy) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const user = req.body.user
  const terms = req.body.terms
  const privacy = req.body.privacy
  const time = new Date()

  User.updateOne({ _id: user }, {terms: terms, privacy: privacy, agreeTime: time}, (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: err })
    } else {
      return res.json({ success: true, user: user })
    }
  })

})


// 유저 비밀번호 : updatePassword
router.post('/updatePassword', (req, res) => {

  console.log("user:"+req.body.user)
  console.log("current:"+req.body.currentPassword)
  console.log("password:"+req.body.password)
  console.log("isNew:"+req.body.isNew)
  
  if (!req.body.user || !req.body.password || !req.body.currentPassword) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const user = req.body.user
  const currentPassword = req.body.currentPassword
  const password = req.body.password
  const isNew = req.body.isNew

  // 현재 비밀번호 일치 여부 확인 
  User.findOne({ _id: user }, (err, user) => {
    // console.log('user', user)
    if (!user) {
      return res.json({
        success: false,
        message: "입력하신 ID에 해당하는 유저가 없습니다."
      })
    }

    //요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호 인지 확인.
    user.comparePassword(currentPassword, (err, isMatch) => {

      if (isNew) isMatch = true // 신규 비밀번호 지정시는 비교 패스 시켜줌
      
      if (!isMatch)
        return res.json({ success: false, message: "현재 비밀번호가 일치하지 않습니다!" })

      user.password = password

      user.save((err, user) => {
        if (err) return res.json({ success: false, message: err })
        return res.json({
          success: true
        })
      })
    })
  })

})


/*
    USER INSERT: POST /insertUsers
*/
router.post('/insertUsers', ValidateToken, (req, res) => {

  fs.readFile('./public/mock/user.json', 'utf8', (error, jsonFile) => {
    if (error) return console.log(error);

    const jsonData = JSON.parse(jsonFile);
    // console.log(jsonFile);

    jsonData.forEach(org => {
        console.log(org);

        const user = new User()
        user.name = org.name
        user.password = org.password
        user.DEPART_CODE = org.DEPART_CODE
        user.OFFICE_CODE = org.OFFICE_CODE
        user.JOB_TITLE = org.JOB_TITLE 
        user.SABUN = org.SABUN
    
        User.findOne({ SABUN: user.SABUN }, (err, exists) => {
          if(exists) {
            User.updateOne({ SABUN: user.SABUN }, {DEPART_CODE: user.DEPART_CODE, OFFICE_CODE: user.OFFICE_CODE, JOB_TITLE: user.JOB_TITLE}, (err, result) => {
              if (err) {
                console.log(err);
                return res.json({ success: false, message: err })
              } 
            })
          } else {
            user.save((err, user) => {
              if (err) {
                console.log(err)
                return res.json({ success: false, err })
              }
            })
          }
        });
    });

    return res.json({
      success: true
    })

  });

})


// paperless 업데이트 : 받은 숫자를 더해준다.
router.post('/updatePaperless', ValidateToken, (req, res) => {

  console.log("user:"+req.body.user)
  console.log("paperless:"+req.body.paperless)

  if (!req.body.user || !req.body.paperless) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const user = req.body.user
  const paperless = req.body.paperless

  User.updateOne({ _id: user }, {$inc: {paperless: paperless, docCount: 1} }, (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: err })
    } else {
      return res.json({ success: true })
    }
  })

})

// paperless : paperless 정보를 리턴한다.
router.post('/paperless', ValidateToken, async (req, res) => {

  if (!req.body.user) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const user = req.body.user


  // 전체 건수
  const totalPaperless = await User.aggregate([
    {$group:{_id:null, total:{$sum:'$paperless'}}}
  ]);

  console.log("totalPaperless", totalPaperless)

  User
  .findOne({ _id: user })
  .exec(function(err, result) {

    if (err) {
      console.log(err);
      return res.json({ success: false, message: err })
    } else {
      
      return res.json({ success: true, 
                        totalPaperless: totalPaperless[0].total,
                        paperless: isEmpty(result?.paperless) ? 0 : result?.paperless,
                        docCount: isEmpty(result?.docCount) ? 0 : result?.docCount })
    }
  })

})

// 인증번호(유효시간 3분) 생성 후 JWT로 보관 및 With 발송
router.post('/certNo', async (req, res) => {
  if (!req.body.argS || !req.body.argN) return res.json({ success: false, message: "input value not enough!" });
  var certNo = generateRandomPass(6, 'onlyNum');
  var ticket = jwt.sign({certNo: certNo}, 'secretToken', {expiresIn: '3m'});
  User.findOneAndUpdate({ SABUN: req.body.argS, name: req.body.argN }, {ticket: ticket}, (err, user) => {
    if (err) return res.json({ success: false, error: err });
    if (user) {
      restful.callNHWithPUSH(null, [req.body.argS], '비밀번호 초기화를 위한 인증번호 안내', '인증번호는 ['+certNo+']입니다.');
      return res.json({success: true});
    } else {
      return res.json({success: false,  message: '사번 또는 이름을 확인할 수 없습니다.'});
    }
  });
});

// 본인확인(사번+이름+인증번호)
router.post('/verify', async (req, res) => {
  if (!req.body.argS || !req.body.argN || !req.body.argC) return res.json({ success: false, message: "input value not enough!" });
  User.findOne({ SABUN: req.body.argS, name: req.body.argN }, (err, user) => {
    if (err) return res.json({ success: false, error: err });
    if (user) {
      jwt.verify(user.ticket, 'secretToken', function (err, payload) {
        if (err) return res.json({ success: false, error: err });
        if (payload.certNo === req.body.argC) {
          return res.json({success: true, user: user._id});
        } else {
          return res.json({success: false,  message: '사번 또는 이름을 확인할 수 없습니다.'});
        }
      });
    } else {
      return res.json({success: false,  message: '사번 또는 이름을 확인할 수 없습니다.'});
    }
  });
});

// 유저 상태 확인
router.post('/check', ValidateToken, (req, res) => {
  if (!req.body.assignees) return res.json({ success: false, message: "input value not enough!" });
  
  var assignees = req.body.assignees;
  var ids = assignees.map((data) => data['key']);
  
  User.find({ '_id': {$in: ids}, 'use': true }, {'_id': 1}).exec(function(err, userList) {
    if (err) return res.json({ success: false, error: err });
    var assigneesCheck = assignees.filter((element) => {
      return userList.some(e => element['key'] == e['_id']);
    });
    return res.json({success: true, assignees: assigneesCheck});
  });
});

// 유저 소속 정보
router.post('/myOrgs', ValidateToken, (req, res) => {
  if (!req.body.user) return res.json({ success: false, message: "input value not enough!" });
  User.aggregate([
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
  ]).exec((err, user) => {
    if (err) return res.json({ success: false, error: err });
    if (user.length > 0) {
      let orgs = user[0].orgs.map(item => item.DEPART_CODE);
      orgs.push(user[0].SABUN);
      return res.json({ success: true, orgs: orgs });
    } else {
      return res.json({ success: false});
    }
  });
});

// 토큰 갱신
router.post('/refresh', renewalToken, (req, res) => {
  var _id = req.body.systemId;
  var _tk = req.body.accessTk;
  // console.log(_tk);
  // console.log('refresh-token:', req.headers['refresh-token'])
  User.findOne({ '_id': _id, 'use': true, 'tokenJWT': req.headers['refresh-token'] }, async (err, user) => {
    // console.log(user);
    if (err) return res.json({ success: false, error: err });
    if (!user) return res.json({ success: false, message: 'No User!!' });
    res.cookie('__aToken__', _tk,  { httpOnly: true, maxAge: 12*60*60*1000 });

    // 조직 정보 셋팅
    let OFFICE_NAME = '';
    let DEPART_NAME = '';        
    const orgInfo = await Org.findOne({ DEPART_CODE: user?.DEPART_CODE });
    if(orgInfo) {
      OFFICE_NAME = orgInfo.OFFICE_NAME;
      DEPART_NAME = orgInfo.DEPART_NAME;
    }
    user.OFFICE_NAME = OFFICE_NAME;
    user.DEPART_NAME = DEPART_NAME;

    // 패스워드 제외 셋팅 
    user.password = ""
     
    res.status(200).json({
      success: true,
      user: user
    });
  });
});

// 웹뷰 판단 함수
function isWebView(userAgent) {
  // iOS 웹뷰 감지
  const isIOSWebView = /iPhone|iPod|iPad/i.test(userAgent) && /AppleWebKit/.test(userAgent) && !/Safari/.test(userAgent) // && !/KAKAOTALK/.test(userAgent)
  // Android 웹뷰 감지
  const isAndroidWebView = /Android/.test(userAgent) && /wv/.test(userAgent) // && !/KAKAOTALK/.test(userAgent)

  return isIOSWebView || isAndroidWebView
}

// 모바일 OS 판단 함수
function isMobile(userAgent) {
  // iOS 감지
  const isIOS = /iPhone|iPod|iPad/i.test(userAgent) && /AppleWebKit/.test(userAgent)
  // Android 감지
  const isAndroid = /Android/.test(userAgent)

  return isIOS || isAndroid
}

module.exports = router;
