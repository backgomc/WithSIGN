const express = require('express');
const router = express.Router();
const { Bulk } = require("../models/Bulk");

// TODO: 신규 문서들 등록
router.post('/addBulk', (req, res) => {

    if (!req.body.user) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    const bulk = new Bulk(req.body)
  
    bulk.save((err, bulk) => {
      if (err) return res.json({ success: false, err })
      return res.status(200).json({
        success: true
      })
    })
})


module.exports = router;