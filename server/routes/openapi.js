const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { Document } = require('../models/Document');

// 서명 필요 건수 by SABUN (JSONP 방식-IE9 이하)
router.get('/signCount', async (req, res) => {
  if (!req.query.SABUN) return res.jsonp({success: false, error: 'input value not enough!'});
  var user = await User.findOne({'SABUN': req.query.SABUN}, {'_id': 1});
  if (!user) return res.jsonp({success: false, error: 'no user!'});
  var userId = user['_id'].toString();
  Document.countDocuments({"deleted": {$ne: true}, "signed": false, "canceled": false}).or(
    [
      {$and:[{"orderType": {$ne:'S'}}, {"users": {$in:[userId]}}, {"signedBy.user": {$ne:userId}}]}, // 동차
      {$and:[{"orderType":      'S'} , {"users": {$in:[userId]}}, {"usersTodo": {$in:[userId]}}]}  // 순차이면서 본인 서명 차례
    ]
  ).exec(function(err, count) {
    if (err) return res.jsonp({success: false, error: err});
    return res.jsonp({ success: true, count: count});
  });
});

// 서명 필요 건수 by SABUN (JSON 방식)
router.post('/signCount', async (req, res) => {
  if (!req.body.SABUN) return res.json({success: false, error: 'input value not enough!'});
  var user = await User.findOne({'SABUN': req.body.SABUN}, {'_id': 1});
  if (!user) return res.json({success: false, error: 'no user!'});
  var userId = user['_id'].toString();
  Document.countDocuments({"deleted": {$ne: true}, "signed": false, "canceled": false}).or(
    [
      {$and:[{"orderType": {$ne:'S'}}, {"users": {$in:[userId]}}, {"signedBy.user": {$ne:userId}}]}, // 동차
      {$and:[{"orderType":      'S'} , {"users": {$in:[userId]}}, {"usersTodo": {$in:[userId]}}]}  // 순차이면서 본인 서명 차례
    ]
  ).exec(function(err, count) {
    if (err) return res.json({success: false, error: err});
    return res.json({ success: true, count: count});
  });
});

module.exports = router;
