const express = require('express');
const router = express.Router();
const { Template } = require("../models/Template");

// 템플릿 등록
router.post('/addTemplate', (req, res) => {

    if (!req.body.user) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    const template = new Template(req.body)
  
    template.save((err, documentInfo) => {
      if (err) return res.json({ success: false, err })
      return res.status(200).json({
        success: true
      })
    })
})

  // 템플릿 목록
  router.post('/templates', (req, res) => {

    const uid = req.body.uid
    if (!uid) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    // 단어검색 
    var searchStr;

    if (req.body.docTitle) {
      var regex = new RegExp(req.body.docTitle[0], "i")
      searchStr = { $and: [{'docTitle': regex}] };
    } else {
        searchStr = {};
    }

    const current = req.body.pagination.current
    const pageSize = req.body.pagination.pageSize
    var start = 0
    if (current > 1) {
      start = (current - 1) * pageSize
    }

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

    var recordsTotal = 0;

    Template.countDocuments(searchStr).or([{"user": uid}]).exec(function(err, count) {
      recordsTotal = count;
      console.log("recordsTotal:"+recordsTotal)
      
      Template
      .find(searchStr).or([{"user": uid}])
      .sort({[order] : dir})    //asc:오름차순 desc:내림차순
      .skip(Number(start))
      .limit(Number(pageSize))
      .populate({
        path: "user", 
        select: {name: 1, JOB_TITLE: 2}
      })
      .exec((err, data) => {
          console.log(data);
          if (err) return res.json({success: false, error: err});
          return res.json({ success: true, templates: data, total:recordsTotal })
      })

    })

  })

module.exports = router;