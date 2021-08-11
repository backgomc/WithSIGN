const express = require('express');
const router = express.Router();
const { User } = require("../models/User");
const { Org } = require("../models/Org");
var fs = require('fs');
var url = require('url');
const { hexCrypto } = require('../common/utils');

const { auth } = require("../middleware/auth");

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
    User.findOne({ uid: uid }, (err, user) => {
      // console.log('user', user)
      if (!user) {
        return res.json({
          success: false,
          message: "입력하신 ID에 해당하는 유저가 없습니다."
        })
      }
  
      //요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호 인지 확인.
      user.comparePassword(req.body.password, (err, isMatch) => {
        // console.log('err',err)
  
        // console.log('isMatch',isMatch)
  
        if (!isMatch)
          return res.json({ success: false, message: "비밀번호가 틀렸습니다." })
  
        //비밀번호 까지 맞다면 토큰을 생성하기.
        user.generateToken((err, user) => {
          if (err) return res.status(400).send(err);
  
          // 패스워드 빼고 리턴 
          user.password = ""

          // 토큰을 저장한다.  어디에 ?  쿠키 , 로컬스토리지 
          res.cookie("x_auth", user.token)
            .status(200)
            .json({ success: true, user: user })
        })
      })
    })
})
  
  
// role 1 어드민    role 2 특정 부서 어드민 
// role 0 -> 일반유저   role 0이 아니면  관리자 
router.get('/auth', auth, (req, res) => {
  //여기 까지 미들웨어를 통과해 왔다는 얘기는  Authentication 이 True 라는 말.

  // const user = req.user
  // user.compareUid(user.email, (err, isMatch) => {
  //   console.log("isMatch:"+isMatch)
  // })

  // console.log("email crypto: "+hexCrypto(req.user.email))

  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
    uid: req.user.uid,
    JOB_TITLE: req.user.JOB_TITLE
  })
})
  
router.post('/logout', auth, (req, res) => {
  User.findOneAndUpdate({ uid: req.user.uid },
    { token: "" }
    , (err, user) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).send({
        success: true
      })
    })
})

/*
    USER LIST: POST /list
*/
router.post('/list', (req, res) => {

  var searchStr;

  if (req.body.OFFICE_CODE) {
    searchStr = { $and: [{OFFICE_CODE: req.body.OFFICE_CODE}] };
  } else {
    searchStr = {};
  }

  User
  .find(searchStr)
  .sort({"name" : 0})    //0:오름차순 -1:내림차순 //{order : dir};
  .exec(function(err, results) {

      if (err) return next(err)

      res.send({
          success: true,
          users: results
      })
  })
});

/*
    ORG INSERT: POST /org
*/
router.post('/orgInsert', (req, res) => {

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
router.post('/orgList', (req, res) => {

  if (!req.body.OFFICE_CODE) {
    return res.json({ success: false, message: "input value not enough!" })
} 

  Org
  .find({"OFFICE_CODE" : req.body.OFFICE_CODE})
  // .sort({"name" : 0})    //0:오름차순 -1:내림차순 //{order : dir};
  .exec(function(err, results) {

      if (err) return next(err)

      res.send({
          success: true,
          orgs: results
      })
  })
});
  
module.exports = router;