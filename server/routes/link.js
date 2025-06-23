// server/routes/link.js
const express = require('express');
const router = express.Router();
const { Link } = require("../models/Link");
const { Document } = require("../models/Document");
const { ValidateToken } = require('../middleware/auth');

// 신규 링크서명 등록
router.post('/addLink', ValidateToken, (req, res) => {

    if (!req.body.user) {
        return res.json({ success: false, message: "input value not enough!" })
    } 

    const link = new Link(req.body)
  
    link.save((err, link) => {
      if (err) return res.json({ success: false, err })
      return res.status(200).json({
        success: true,
        linkId: link._id
      })
    })
})

// 링크서명 목록 조회
router.post('/list', ValidateToken, (req, res) => {

  const user = req.body.systemId
  if (!user) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const status = req.body.status
  
  // 단어검색 
  const current = req.body.pagination.current
  const pageSize = req.body.pagination.pageSize
  var start = 0
  if (current > 1) {
    start = (current - 1) * pageSize
  }

  var order = "requestedTime" 
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
  
  var andParam = {};
  var orParam = {};

  andParam['user'] = user

  // 링크 제목 검색
  if (req.body.linkTitle) {
    andParam['linkTitle'] = { $regex: '.*' + req.body.linkTitle[0] + '.*', $options: 'i' }
  }
  
  console.log("status:"+status)

  if (status) {
    if (status == '취소') {
      andParam['canceled'] = true
    } else if (status == '완료') {
      andParam['signed'] = true
    } else if (status == '진행중') {
      andParam['canceled'] = false
      andParam['signed'] = false
    } 
  }

  Link.countDocuments(andParam).or(orParam).exec(function(err, count) {
    recordsTotal = count;
    console.log("recordsTotal:"+recordsTotal)
    
    Link
    .find(andParam).or(orParam)
    .sort({[order] : dir})    //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .populate({
      path: "user", 
      select: {name: 1, JOB_TITLE: 2, DEPART_CODE: 3}
    })
    .populate({
      path: "docs"
    })
    .exec((err, links) => {
        if (err) return res.json({success: false, error: err});
        return res.json({ success: true, links: links, total:recordsTotal })
    })

  })

})

// 링크서명 상세 조회
router.post('/detail', ValidateToken, (req, res) => {
    const { linkId } = req.body;
    const userId = req.body.systemId;

    if (!linkId) {
        return res.json({ success: false, message: "input value not enough!" })
    }

    Link.findOne({
        _id: linkId,
        user: userId
    })
    .populate('user', 'name JOB_TITLE')
    .populate('docs')
    .then(link => {
        if (!link) {
            return res.status(200).json({
                success: false,
                error: '링크서명을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            link: link
        });
    })
    .catch(err => {
        console.error('링크서명 상세 조회 에러:', err);
        res.status(200).json({
            success: false,
            error: err.message
        });
    });
});

// 링크서명 수정
router.post('/updateLink', ValidateToken, (req, res) => {
    const { linkId } = req.body;
    const userId = req.body.systemId;

    if (!linkId) {
        return res.json({ success: false, message: "input value not enough!" })
    }

    Link.findOneAndUpdate(
        { _id: linkId, user: userId },
        req.body,
        { new: true }
    )
    .then(updatedLink => {
        if (!updatedLink) {
            return res.status(200).json({
                success: false,
                error: '링크서명을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            link: updatedLink
        });
    })
    .catch(err => {
        console.error('링크서명 수정 에러:', err);
        res.status(200).json({
            success: false,
            error: err.message
        });
    });
});

// 링크서명 삭제
router.post('/deleteLink', ValidateToken, (req, res) => {
    const { linkId } = req.body;
    const userId = req.body.systemId;

    if (!linkId) {
        return res.json({ success: false, message: "input value not enough!" })
    }

    Link.findOneAndUpdate(
        { _id: linkId, user: userId },
        { 
            deleted: true, 
            deletedBy: [{ user: userId, deletedTime: new Date() }] 
        },
        { new: true }
    )
    .then(deletedLink => {
        if (!deletedLink) {
            return res.status(200).json({
                success: false,
                error: '링크서명을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            message: '링크서명이 삭제되었습니다.'
        });
    })
    .catch(err => {
        console.error('링크서명 삭제 에러:', err);
        res.status(200).json({
            success: false,
            error: err.message
        });
    });
});

// 링크서명 취소
router.post('/cancelLink', ValidateToken, (req, res) => {
    const { linkId, message } = req.body;
    const userId = req.body.systemId;

    if (!linkId) {
        return res.json({ success: false, message: "input value not enough!" })
    }

    Link.findOneAndUpdate(
        { _id: linkId, user: userId },
        { 
            canceled: true,
            canceledBy: [{ user: userId, canceledTime: new Date(), message: message }]
        },
        { new: true }
    )
    .then(canceledLink => {
        if (!canceledLink) {
            return res.status(200).json({
                success: false,
                error: '링크서명을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            message: '링크서명이 취소되었습니다.'
        });
    })
    .catch(err => {
        console.error('링크서명 취소 에러:', err);
        res.status(200).json({
            success: false,
            error: err.message
        });
    });
});

// 링크서명 알림 발송
router.post('/notify', ValidateToken, (req, res) => {
    const { linkId } = req.body;
    const userId = req.body.systemId;

    if (!linkId) {
        return res.json({ success: false, message: "input value not enough!" })
    }

    Link.findOne({
        _id: linkId,
        user: userId
    })
    .populate('docs')
    .then(link => {
        if (!link) {
            return res.status(200).json({
                success: false,
                error: '링크서명을 찾을 수 없습니다.'
            });
        }

        // TODO: 실제 알림 발송 로직 구현
        // link.externalEmails 배열의 이메일들에게 알림 발송
        console.log('링크서명 알림 발송:', link.linkTitle);

        res.status(200).json({
            success: true,
            message: '알림이 발송되었습니다.'
        });
    })
    .catch(err => {
        console.error('링크서명 알림 발송 에러:', err);
        res.status(200).json({
            success: false,
            error: err.message
        });
    });
});

// 링크서명에 문서 추가
router.post('/addDocument', ValidateToken, (req, res) => {
    const { linkId, docId } = req.body;
    const userId = req.body.systemId;

    if (!linkId || !docId) {
        return res.json({ success: false, message: "input value not enough!" })
    }

    // 1. Document를 docType: 'L'로 업데이트
    Document.findByIdAndUpdate(
        docId,
        { docType: 'L', linkId: linkId },
        { new: true }
    )
    .then(document => {
        if (!document) {
            return res.status(200).json({
                success: false,
                error: '문서를 찾을 수 없습니다.'
            });
        }

        // 2. Link에 문서 추가
        return Link.findOneAndUpdate(
            { _id: linkId, user: userId },
            { $addToSet: { docs: docId } },
            { new: true }
        );
    })
    .then(link => {
        if (!link) {
            return res.status(200).json({
                success: false,
                error: '링크서명을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            message: '문서가 링크서명에 추가되었습니다.',
            link: link
        });
    })
    .catch(err => {
        console.error('링크서명 문서 추가 에러:', err);
        res.status(200).json({
            success: false,
            error: err.message
        });
    });
});

module.exports = router;