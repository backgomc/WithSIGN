const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { Document } = require('../models/Document');

// 서명 필요 건수 by SABUN
router.post('/signCount', async (req, res) => {
  if (!req.body.SABUN) return res.json({success: false, error: 'input value not enough!'});
  var user = await User.findOne({'SABUN': req.body.SABUN}, {'_id': 1});
  Document.countDocuments({ 'users': {$in:[user['_id']]}, 'signed': false, 'canceled': false, 'signedBy.user': {$ne: user['_id']} }).exec(function(err, count) {
    if (err) return res.json({success: false, error: err});
    return res.json({ success: true, count: count});
  });
});

module.exports = router;
