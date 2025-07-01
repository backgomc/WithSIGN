// server/routes/link.js
const express = require('express');
const router = express.Router();
const config = require('../config/key');
const { Link } = require("../models/Link");
const { Document } = require("../models/Document");
const { User } = require("../models/User");
const { ValidateToken } = require('../middleware/auth');

// 신규 링크서명 등록 (파일 첨부 없이)
router.post('/addLink', ValidateToken, async (req, res) => {
    try {
        const userId = req.body.systemId; // ValidateToken에서 설정됨
        
        if (!userId) {
            return res.json({ success: false, message: "사용자 인증이 필요합니다!" });
        }

        const {
            linkTitle,
            docTitle, 
            accessPassword,
            passwordHint,
            expiryDays,
            approver,
            items // 서명 항목들 (문자열로 받아서 파싱)
        } = req.body;

        console.log('링크서명 생성 요청:', {
            userId,
            linkTitle: linkTitle || docTitle,
            docTitle,
            accessPassword: accessPassword ? '***' : 'none',
            expiryDays,
            approver
        });

        // 필수 필드 검증
        if (!docTitle || !accessPassword) {
            return res.json({ 
                success: false, 
                message: "필수 필드가 누락되었습니다!" 
            });
        }

        // 만료 날짜 계산 (다음날 자정까지 유효)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (parseInt(expiryDays) || 7));
        expiryDate.setHours(23, 59, 59, 999); // 해당 날짜 23:59:59까지 유효

        // Link 데이터 준비
        const linkData = {
            user: userId,
            linkTitle: linkTitle || docTitle, // linkTitle이 없으면 docTitle 사용
            docTitle: docTitle,
            accessPassword: accessPassword,
            passwordHint: passwordHint || '',
            expiryDays: parseInt(expiryDays) || 7,
            expiryDate: expiryDate,
            approver: approver,
            items: items ? (typeof items === 'string' ? JSON.parse(items) : items) : [], // 서명 항목들
            requestedTime: new Date(),
            deleted: false,
            isActive: true, // 기본값: 진행중 상태
            docs: [] // 연결될 문서들 (링크서명에서는 빈 배열)
        };

        console.log('저장할 Link 데이터:', {
            ...linkData,
            accessPassword: '***' // 로그에서는 암호 숨김
        });

        // Link 생성 및 저장
        const link = new Link(linkData);
        const savedLink = await link.save();
        
        console.log('Link 생성 완료:', savedLink._id);

        // 응답 데이터 준비
        const linkUrl = `${config.linkBaseUrl}/sign/link/${savedLink._id}`;
        
        res.status(200).json({
            success: true,
            message: '링크서명이 성공적으로 생성되었습니다.',
            linkId: savedLink._id,
            linkUrl: linkUrl,
            expiryDate: savedLink.expiryDate,
            link: {
                _id: savedLink._id,
                linkTitle: savedLink.linkTitle,
                docTitle: savedLink.docTitle,
                expiryDays: savedLink.expiryDays,
                expiryDate: savedLink.expiryDate,
                requestedTime: savedLink.requestedTime,
                isActive: savedLink.isActive
            }
        });

    } catch (error) {
        console.error('링크서명 생성 에러:', error);
        
        // MongoDB 에러 처리
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: ' 데이터 검증 실패: ' + errorMessages.join(', '),
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: '링크서명 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 링크서명 목록 조회 (간소화된 상태 관리)
router.post('/list', ValidateToken, async (req, res) => {

  const user = req.body.systemId
  if (!user) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  try {
    // 만료된 링크들 자동 비활성화
    await Link.updateMany(
      { 
        expiryDate: { $lt: new Date() }, 
        isActive: true 
      },
      { 
        isActive: false,
        statusUpdatedBy: 'system',
        statusUpdatedTime: new Date()
      }
    );
  } catch (error) {
    console.error('만료된 링크 비활성화 에러:', error);
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
  
  // 삭제된 항목 제외
  andParam['deleted'] = { $ne: true }

  // 링크 제목 검색
  if (req.body.linkTitle) {
    andParam['linkTitle'] = { $regex: '.*' + req.body.linkTitle[0] + '.*', $options: 'i' }
  }
  
  console.log("status:"+status)

  // 간소화된 상태 필터링 (진행중/종료됨만)
  if (status) {
    if (status == '진행중') {
      andParam['isActive'] = true
    } else if (status == '종료됨') {
      andParam['isActive'] = false
    }
  }

  try {
    const count = await Link.countDocuments(andParam).or(orParam);
    recordsTotal = count;
    console.log("recordsTotal:"+recordsTotal)
    
    const links = await Link
      .find(andParam).or(orParam)
      .sort({[order] : dir})
      .skip(Number(start))
      .limit(Number(pageSize))
      .populate({
        path: "user", 
        select: {name: 1, JOB_TITLE: 2, DEPART_CODE: 3}
      })
      .populate({
        path: "docs"
      });

    return res.json({ success: true, links: links, total: recordsTotal });

  } catch (err) {
    console.error('링크 목록 조회 에러:', err);
    return res.json({success: false, error: err});
  }

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

// 링크서명 삭제 (서명자 체크 + soft delete) - 간소화
router.post('/deleteLink', ValidateToken, async (req, res) => {
    try {
        const { linkId } = req.body;
        const userId = req.body.systemId;

        if (!linkId) {
            return res.json({ success: false, message: "input value not enough!" })
        }

        // 1. 링크서명과 연결된 문서들 조회
        const link = await Link.findOne({ _id: linkId, user: userId })
            .populate('docs');

        if (!link) {
            return res.status(200).json({
                success: false,
                error: '링크서명을 찾을 수 없습니다.'
            });
        }

        // 2. 서명자가 있는지 체크 (docs 배열에 문서가 있으면 서명자가 있다고 판단)
        if (link.docs && link.docs.length > 0) {
            return res.status(200).json({
                success: false,
                message: '서명자가 있는 링크서명은 삭제할 수 없습니다.',
                hasSigners: true
            });
        }

        // 3. 링크 상태가 진행중인지 체크 (추가)
        if (link.isActive) {
            return res.status(200).json({
                success: false,
                message: '진행중인 링크는 삭제할 수 없습니다. 먼저 링크를 중지해주세요.',
                isActive: true
            });
        }        

        // 4. 서명자가 없고 중지된 상태일 때만 soft delete 진행
        const deletedLink = await Link.findOneAndUpdate(
            { _id: linkId, user: userId },
            { 
                deleted: true, 
                deletedBy: [{ user: userId, deletedTime: new Date() }] 
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: '링크서명이 삭제되었습니다.'
        });

    } catch (error) {
        console.error('링크서명 삭제 에러:', error);
        res.status(200).json({
            success: false,
            error: error.message
        });
    }
});

// 링크서명 상태 변경 (활성화/비활성화)
router.post('/updateStatus', ValidateToken, async (req, res) => {
    try {
        const { linkId, isActive } = req.body;
        const userId = req.body.systemId;

        if (!linkId || typeof isActive === 'undefined') {
            return res.json({ 
                success: false, 
                message: "필수 파라미터가 누락되었습니다!" 
            });
        }

        // 만료 체크 로직
        if (isActive) {
            const link = await Link.findOne({ _id: linkId, user: userId });
            if (link && new Date() > new Date(link.expiryDate)) {
                return res.json({
                    success: false,
                    error: '만료된 링크는 활성화할 수 없습니다.'
                });
            }
        }

        const updatedLink = await Link.findOneAndUpdate(
            { _id: linkId, user: userId },
            { 
                isActive: isActive,
                statusUpdatedBy: userId,
                statusUpdatedTime: new Date()
            },
            { new: true }
        );

        if (!updatedLink) {
            return res.status(200).json({
                success: false,
                error: '링크서명을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            message: `링크서명이 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
            link: updatedLink
        });

    } catch (error) {
        console.error('링크서명 상태 변경 에러:', error);
        res.status(200).json({
            success: false,
            error: error.message
        });
    }
});

// 링크서명 취소 - 제거 (더 이상 사용하지 않음)
// router.post('/cancelLink', ValidateToken, (req, res) => {
//     // 링크서명에서는 취소 상태를 사용하지 않음
//     // 승인 전 취소는 삭제, 승인 후에는 활성화/비활성화로 관리
// });

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

// 링크 접속 체크 (외부 사용자용)
router.post('/checkAccess', async (req, res) => {
    try {
        const { linkId } = req.body;

        if (!linkId) {
            return res.json({ success: false, message: "링크 ID가 필요합니다!" });
        }

        const link = await Link.findById(linkId)
            .select('linkTitle docTitle isActive deleted expiryDate accessPassword passwordHint expiryDays');

        if (!link) {
            return res.json({ 
                success: false, 
                message: "링크를 찾을 수 없습니다." 
            });
        }

        // 삭제된 링크 체크
        if (link.deleted) {
            return res.json({ 
                success: false, 
                message: "삭제된 링크입니다." 
            });
        }

        // 민감한 정보는 제외하고 필요한 정보만 반환
        const linkInfo = {
            _id: link._id,
            linkTitle: link.linkTitle,
            docTitle: link.docTitle,
            isActive: link.isActive,
            expiryDate: link.expiryDate,
            expiryDays: link.expiryDays,
            passwordHint: link.passwordHint || ''
            // accessPassword는 보안상 반환하지 않음
        };

        res.json({
            success: true,
            link: linkInfo
        });

    } catch (error) {
        console.error('링크 접속 체크 에러:', error);
        res.json({
            success: false,
            message: '링크 접속 확인 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 접근 암호 확인 (외부 사용자용)
router.post('/verifyPassword', async (req, res) => {
    try {
        const { linkId, accessPassword } = req.body;

        if (!linkId || !accessPassword) {
            return res.json({ 
                success: false, 
                message: "필수 정보가 누락되었습니다!" 
            });
        }

        const link = await Link.findById(linkId)
            .select('accessPassword isActive deleted expiryDate');

        if (!link) {
            return res.json({ 
                success: false, 
                message: "링크를 찾을 수 없습니다." 
            });
        }

        // 삭제된 링크 체크
        if (link.deleted) {
            return res.json({ 
                success: false, 
                message: "삭제된 링크입니다." 
            });
        }

        // 추가 상태 체크
        if (!link.isActive) {
            return res.json({ 
                success: false, 
                message: "비활성화된 링크입니다." 
            });
        }

        // 만료 체크
        const now = new Date();
        const expiryDate = new Date(link.expiryDate);
        if (now > expiryDate) {
            return res.json({ 
                success: false, 
                message: "만료된 링크입니다." 
            });
        }

        // 암호 확인
        if (link.accessPassword === accessPassword) {
            res.json({
                success: true,
                message: '접근 암호가 확인되었습니다.'
            });
        } else {
            res.json({
                success: false,
                message: '접근 암호가 올바르지 않습니다.'
            });
        }

    } catch (error) {
        console.error('접근 암호 확인 에러:', error);
        res.json({
            success: false,
            message: '암호 확인 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 팀원 목록 조회 (링크서명 승인자 선택용)
router.post('/teamMembers', ValidateToken, async (req, res) => {
    try {
      const userId = req.body.systemId;
      
      if (!userId) {
        return res.json({ success: false, message: 'systemId is required' });
      }
  
      // 현재 사용자 정보 조회
      const { User } = require("../models/User"); // User 모델 import 추가 필요
      const currentUser = await User.findById(userId).select('DEPART_CODE');
      if (!currentUser || !currentUser.DEPART_CODE) {
        return res.json({ success: false, message: '사용자 부서 정보를 찾을 수 없습니다.' });
      }
  
      // 같은 팀원들 조회 (본인 제외)
      const teamMembers = await User.find({
        DEPART_CODE: currentUser.DEPART_CODE,
        _id: { $ne: userId }, // 본인 제외
        use: true // 활성 사용자만
      }, {
        _id: 1,
        name: 1,
        JOB_TITLE: 1,
        DEPART_CODE: 1
      }).sort({ JOB_CODE: 'asc' }); // 직급 순서대로 정렬
  
      return res.json({ 
        success: true, 
        teamMembers: teamMembers,
        total: teamMembers.length 
      });
  
    } catch (error) {
      console.error('팀원 조회 오류:', error);
      return res.json({ 
        success: false, 
        message: '팀원 조회 중 오류가 발생했습니다.' 
      });
    }
  });

module.exports = router;