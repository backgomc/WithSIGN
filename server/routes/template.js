const express = require('express');
const router = express.Router();
const { Template } = require("../models/Template");
const fs = require('fs');
const config = require("../config/key");
const { generateRandomName, makeFolder, today } = require('../common/utils');
const { ValidateToken } = require('../middleware/auth');

// 템플릿 등록
router.post('/addTemplate', ValidateToken, (req, res) => {

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
          success: true,
          templateInfo: documentInfo
        })
      })

    });  

})

// 템플릿 목록
// type:C (신청서)
// type:G (회사 템플릿)
// type:M (개인)
router.post('/templates', ValidateToken, (req, res) => {

  const uid = req.body.uid
  if (!uid) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  var andParam = {};
  var orParam = {};
  const type = req.body.type;
  // const COMPANY_CODE = req.body.COMPANY_CODE; 

  // if (COMPANY_CODE) {
  //   andParam['COMPANY_CODE'] = COMPANY_CODE;
  // }

  if (type && type === 'C') { // 신청서
    andParam['type'] = 'C'
  } else if (type && type === 'G') { // 회사
    andParam['type'] = 'G'
  } else if (type && type === 'T') { // 전체
    orParam = [{"user": uid}, {"type": 'C'}, {"type": 'G'}];
  } else { // 개인
    andParam['user'] = uid
    // andParam['type'] = {$ne : 'C'}
    andParam['type'] = 'M'
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
router.post('/deleteTemplate', ValidateToken, (req, res) => {

  if (!req.body._ids) {
    return res.json({ success: false, message: "input value not enough!" });
  } 

  const _ids = req.body._ids;
  
  try {
    // 스토리지 파일 삭제 
    Template
    .find({"_id" : {$in: _ids} })
    .exec((err, rows) => {
      rows.forEach(template => {
        console.log(template.docRef);
        console.log(template.customRef);

        fs.unlink(template.docRef, function (err) {            
          if (err) {
            console.error(err);
            // return res.json({ success: false, msg:err });
          }
          console.log('File has been Deleted');    
          
          // 썸네일 이미지 삭제 
          if (template.thumbnail) {
            fs.access(template.thumbnail, fs.constants.F_OK, (err) => { // A
              if (err) return console.log('삭제할 수 없는 파일입니다');
              fs.unlink(template.thumbnail, (err) => err ?
                console.log(err) : console.log(`${template.thumbnail} 를 정상적으로 삭제했습니다`));
            });
          }

          // 사용자 템플릿 삭제
          if (template.customRef) {
            fs.access(template.customRef, fs.constants.F_OK, (err) => { // A
              if (err) return console.log('삭제할 수 없는 파일입니다');
              fs.unlink(template.customRef, (err) => err ?
                console.log(err) : console.log(`${template.customRef} 를 정상적으로 삭제했습니다`));
            });
          }

        });
      });

      // DB 삭제
      Template.deleteMany({_id: { $in: _ids}}, function(err) {
        if (err) { return res.json({ success: false, msg:err }); }
        return res.status(200).json({ success: true});
      });
    });
  } catch(error) {
    console.log(error);
    return res.json({ success: false, msg:error });
  }
});

// 템플릿 설정 등록 및 수정
router.post('/updateTemplate', ValidateToken, async (req, res) => {

  if (!req.body._id || !req.body.user ) return res.json({ success: false, message: 'input value not enough!' });

  if (req.body.isWithPDF) {

    // S. 수신자 SKIPP 처리 ------------------- 2024.09.13
    // 요약: 신청서인 경우 > 마지막 단계 > 모두 수신자인 경우 > Skip 허용 처리 (allowSkip === true)
    const template = await Template.findOne({ '_id': req.body._id });
    let usersOrder = req.body.usersOrder;
    const observers = req.body.observers;
    if (template) {
      if (template.type === 'C') {  // 신청서인 경우
        console.log('usersOrder', usersOrder)
        const maxOrder = Math.max(...usersOrder.map(item => parseInt(item.order)));
        console.log('maxOrder', maxOrder)
        const latestOrders = usersOrder.filter(item => parseInt(item.order) === maxOrder);
        console.log('latestOrders', latestOrders)

        const latestOrdersUsers = latestOrders.map(el => el.user);
        console.log('latestOrdersUsers', latestOrdersUsers)

        // latestOrdersUsers가 모두 수신자인지 여부 체크 
        if (latestOrdersUsers?.every(el => observers.includes(el))) {
          usersOrder = usersOrder?.map(el => {
            if (latestOrdersUsers.includes(el.user)) {
              return {user: el.user, order: el.order, allowSkip: true}
            } else {
              return el;
            }
          })
        }

        console.log('usersOrder changed', usersOrder)

      }
    }
    // E. 수신자 SKIPP 처리 -------------------


    Template.updateOne(
      // { '_id': req.body._id, 'user': req.body.user },
      { '_id': req.body._id },  // 권한이 있는 다른 User 도 수정할 수 있게 변경
      { 'users': req.body.users, 'observers': req.body.observers, 'orderType': req.body.orderType, 'usersOrder': usersOrder, 'usersTodo': req.body.usersTodo, 'signees': req.body.signees, 'hasRequester': req.body.hasRequester, 'requesters': req.body.requesters, 'items': req.body.items, 'docTitle': req.body.docTitle, 'isWithPDF': true },
      (err) => {
        if (err) return res.json({ success: false, message: err });
        return res.json({ success: true});
    });
  } else {
    // 경로 치환
    var ref = req.body.customRef.replace(/(\\)/g,'/');

    var directRef = '';
    if (req.body.directRef) {
      directRef = req.body.directRef.replace(/(\\)/g,'/');
    }

    Template.updateOne(
      { '_id': req.body._id, 'user': req.body.user },
      { 'customRef': ref, 'directRef': directRef, 'users': req.body.users, 'observers': req.body.observers, 'orderType': req.body.orderType, 'usersOrder': req.body.usersOrder, 'usersTodo': req.body.usersTodo, 'signees': req.body.signees, 'hasRequester': req.body.hasRequester, 'requesters': req.body.requesters, 'xfdfIn': req.body.xfdfIn },
      (err) => {
        if (err) return res.json({ success: false, message: err });
        return res.json({ success: true});
    });
  }

});

// 템플릿 상세
router.post('/detail', ValidateToken, (req, res) => {
  if (!req.body.templateId) {
    return res.json({ success: false, message: "input value not enough!" })
  }
  const templateId = req.body.templateId
  
  Template.findOne({ _id: templateId })
  .populate({
    path: "user", 
    select: {name: 1, JOB_TITLE: 2}
  })
  .then((template, err) => {
    if (err) return res.json({success: false, error: err});
    return res.json({ success: true, template: template })
  });
})

// 템플릿 정보 업데이트
router.post('/updateTemplateInfo', ValidateToken, async (req, res) => {

  if (!req.body.templateId ) return res.json({ success: false, message: 'input value not enough!' });

  const templateId = req.body.templateId
  const docTitle = req.body.docTitle
  const docRef = req.body.docRef
  const thumbnail = req.body.thumbnail
  const pageCount = req.body.pageCount

  let thumbnailPath;

  if (thumbnail) {
    const base64Data = thumbnail.split(';base64,').pop();
    const newDir = config.storageDIR + 'thumbnails/' + today() + '/';
    makeFolder(newDir);
    thumbnailPath = newDir+generateRandomName()+'.png';
    console.log('thumbnailPath:'+thumbnailPath)

    fs.writeFile(thumbnailPath, base64Data, {encoding: 'base64'}, function(err) {
      if (err) return res.json({ success: false, err })
      console.log('File created');
    });  
  }

  const updateData = {};

  if (docTitle) {
    updateData.docTitle = docTitle
  }
  if (thumbnailPath) {
    updateData.thumbnail = thumbnailPath
  }
  if (docRef) {
    updateData.docRef = docRef

    // 변경 문서의 페이지수가 줄어든 경우 컴포넌트도 삭제 처리함 
    if (pageCount) {
      const template = await Template.findOne({ _id: templateId });
      if (template) {
        const items = template.items;
        // console.log('pageCount', pageCount)
        // console.log('items', items)
        const newItems = items.filter(item => item.pIdx < pageCount)
        // console.log('newItems', newItems)
        updateData.items = newItems
      }
      
    }
  }


  Template.updateOne(
    { '_id': templateId },
    updateData,
    (err) => {
      if (err) return res.json({ success: false, message: err });
      return res.json({ success: true});
  });

});

module.exports = router;
