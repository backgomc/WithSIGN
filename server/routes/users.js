const express = require('express');
const router = express.Router();
const { User } = require("../models/User");

const { auth } = require("../middleware/auth");

router.post('/register', (req, res) => {

    // CHECK EMAIL EXISTANCE
    User.findOne({ email: req.body.email }, (err, exists) => {
      if (err) return res.status(400).send(err);
      if(exists){
          return res.json({
            success: false,
              error: "EMAIL EXISTS",
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
  
    // console.log('ping')
    //요청된 이메일을 데이터베이스에서 있는지 찾는다.
    User.findOne({ email: req.body.email }, (err, user) => {
  
      // console.log('user', user)
      if (!user) {
        return res.json({
          success: false,
          message: "제공된 이메일에 해당하는 유저가 없습니다."
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
  
          // 토큰을 저장한다.  어디에 ?  쿠키 , 로컳스토리지 
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
    res.status(200).json({
      _id: req.user._id,
      isAdmin: req.user.role === 0 ? false : true,
      isAuth: true,
      email: req.user.email,
      name: req.user.name,
      lastname: req.user.lastname,
      role: req.user.role,
      image: req.user.image
    })
  })
  
  router.post('/logout', auth, (req, res) => {
    // console.log('req.user', req.user)
    User.findOneAndUpdate({ _id: req.user._id },
      { token: "" }
      , (err, user) => {
        if (err) return res.json({ success: false, err });
        return res.status(200).send({
          success: true
        })
      })
  })
  
  module.exports = router;