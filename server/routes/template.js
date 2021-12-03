const express = require('express');
const router = express.Router();
const { Template } = require("../models/Template");
const fs = require('fs');
const config = require("../config/key");
const { generateRandomName, makeFolder, today } = require('../common/utils');

// 템플릿 등록
router.post('/addTemplate', (req, res) => {

    if (!req.body.user) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    const template = new Template(req.body)

    // 썸네일 이미지는 스토리지에 올리기
    const base64Data = template.thumbnail.split(';base64,').pop();

    const newDir = config.storageDIR + 'thumbnails/' + today() + '/';
    makeFolder(newDir);
    const fullPath = newDir+generateRandomName()+'.png';
    console.log('fullPath:'+fullPath)

    fs.writeFile(fullPath, base64Data, {encoding: 'base64'}, function(err) {
      if (err) return res.json({ success: false, err })
      console.log('File created');

      template.thumbnail = fullPath
      template.save((err, documentInfo) => {
        if (err) return res.json({ success: false, err })
        return res.status(200).json({
          success: true
        })
      })

    });  

})

// 템플릿 목록
// type:C(회사 템플릿)
router.post('/templates', (req, res) => {

  const uid = req.body.uid
  if (!uid) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  var andParam = {};
  var orParam = {};
  const type = req.body.type 
  if (type && type === 'C') {
    andParam['type'] = 'C'
  } else {
    andParam['user'] = uid
    andParam['type'] = {$ne : 'C'}
  }

  console.log('req.body.docTitle:'+req.body.docTitle)
  if (req.body.docTitle) {
    // TODO: 한글검색이 잘 안되는 문제
    andParam['docTitle'] = { $regex: '.*' + req.body.docTitle[0] + '.*', $options: 'i' }
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

  Template.countDocuments(andParam).or(orParam).exec(function(err, count) {
    recordsTotal = count;
    console.log("recordsTotal:"+recordsTotal)
    
    Template
    .find(andParam).or(orParam)
    .sort({[order] : dir})    //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .populate({
      path: "user", 
      select: {name: 1, JOB_TITLE: 2}
    })
    .exec((err, data) => {
        // console.log(data);
        if (err) return res.json({success: false, error: err});
        return res.json({ success: true, templates: data, total:recordsTotal })
    })

  })
})

// 템플릿 삭제
router.post('/deleteTemplate', (req, res) => {

  if (!req.body._ids) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const _ids = req.body._ids
  
  // 스토리지 파일 삭제 
  Template
  .find({"_id" : {$in: _ids} })
  .exec((err, rows) => {
    rows.forEach(template => {
      console.log(template.docRef)
      //DISTO
      // fs.unlink(config.storageDIR + template.docRef, function (err) {    
      try {
        fs.unlink(template.docRef, function (err) {            
          if (err) {                                                 
              console.error(err);
              return res.json({ success: false, err });                                    
          }                                                          
         console.log('File has been Deleted');    
         
         // 썸네일 이미지 삭제 
         fs.access(template.thumbnail, fs.constants.F_OK, (err) => { // A
           if (err) return console.log('삭제할 수 없는 파일입니다');
         
           fs.unlink(template.thumbnail, (err) => err ?  
             console.log(err) : console.log(`${template.thumbnail} 를 정상적으로 삭제했습니다`));
         });

        });        
      } catch(error) {
        console.log(error)
        return res.json({ success: false, error })
      }
    });

    // DB 삭제
    Template.deleteMany({_id: { $in: _ids}}, function(err) {
      if (err) { return res.json({ success: false, err }) }
      return res.status(200).json({ success: true})     
    })
  })
  
})

module.exports = router;