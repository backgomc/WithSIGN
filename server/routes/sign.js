const express = require('express');
const router = express.Router();
const { Sign } = require("../models/Sign");
const fs = require('fs');
const config = require("../config/key");
const { encrypt, decrypt } = require('../common/utils');
const { ValidateToken } = require('../middleware/auth');

// 템플릿 등록
router.post('/addSign', ValidateToken, (req, res) => {

    if (!req.body.user || !req.body.signData) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    const sign = new Sign(req.body)

    sign.signData = encrypt(sign.signData)
    
    sign.save((err, signInfo) => {
      if (err) return res.json({ success: false, err })
      return res.status(200).json({
        success: true
      })
    })
})

// 사인 목록
router.post('/signs', ValidateToken, (req, res) => {

  const user = req.body.user
  if (!user) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  // 정렬
  var order = "registeredTime" 
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

  Sign
  .find({"user": user})
  .sort({[order] : dir})    //asc:오름차순 desc:내림차순
  .populate({
    path: "user", 
    select: {name: 1, JOB_TITLE: 2}
  })
  .exec((err, data) => {
      // console.log(data);
      if (err) return res.json({success: false, error: err});

      // 복호화
      const newData = data.map(sign => {
        sign.signData = decrypt(sign.signData)
        return sign
      })

      return res.json({ success: true, signs: newData })
  })

})

// 템플릿 삭제
router.post('/deleteSign', ValidateToken, (req, res) => {

  if (!req.body._id) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const _id = req.body._id
  
  // DB 삭제
  Sign.deleteOne({_id: _id}, function(err) {
    if (err) { return res.json({ success: false, err }) }
    return res.status(200).json({ success: true})    
  })

  
})

module.exports = router;