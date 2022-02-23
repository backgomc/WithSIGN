const express = require('express');
const router = express.Router();
const { Board } = require("../models/Board");
const fs = require('fs');
const config = require("../config/key");

// 게시글 등록
router.post('/add', (req, res) => {

  if (!req.body.user || !req.body.title || !req.body.content || !req.body.boardType) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const board = new Board(req.body)

  board.save((err, board) => {
    if (err) return res.json({ success: false, err })
    return res.json({
      success: true
    })
  })
})

// 게시글 목록
router.post('/list', (req, res) => {

  if (!req.body.boardType) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const boardType = req.body.boardType;
  // 단어검색 
  var searchStr;

  if (req.body.title) {
    var regex = new RegExp(req.body.title[0], "i")
    searchStr = { $and: [{'title': regex}] };
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

  Board.countDocuments(searchStr).and([{"boardType": boardType}]).exec(function(err, count) {
    recordsTotal = count;
    console.log("recordsTotal:"+recordsTotal)
    
    Board
    .find(searchStr).and([{"boardType": boardType}])
    .sort({[order] : dir})    //asc:오름차순 desc:내림차순
    .skip(Number(start))
    .limit(Number(pageSize))
    .populate({
      path: "user", 
      select: {name: 1, JOB_TITLE: 2, thumbnail: 3}
    })
    .populate({
      path: "comments.user", 
      select: {name: 1, JOB_TITLE: 2, thumbnail: 3}
    })
    .exec((err, data) => {
        // console.log(data);
        if (err) return res.json({success: false, error: err});
        return res.json({ success: true, boards: data, total:recordsTotal })
    })

  })
})

// 게시글 상세
router.post('/detail', (req, res) => {
  if (!req.body.boardId) {
    return res.json({ success: false, message: "input value not enough!" })
  }
  const boardId = req.body.boardId
  
  Board.findOne({ _id: boardId })
  .populate({
    path: "user", 
    select: {name: 1, JOB_TITLE: 2}
  })
  .populate({
    path: "comments.user", 
    select: {name: 1, JOB_TITLE: 2, thumbnail: 3}
  })
  .then((board, err) => {
    if (err) return res.json({success: false, error: err});
    return res.json({ success: true, board: board })
  });
})

// 게시글 삭제
router.post('/delete', (req, res) => {

  if (!req.body._ids) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const _ids = req.body._ids

  try {

    // 첨부 파일 삭제 
    Board.find({ _id: { $in: _ids}})
    .then((boards, err) => {
      boards.map(board => {

        var fileDir       
        board.files.map(file => {
          // 첨부파일 삭제 
          fileDir = file.destination
          fs.access(file.path, fs.constants.F_OK, (err) => { // 파일 삭제
            if (err) return console.log('삭제할 수 없는 파일입니다');
          
            fs.unlink(file.path, (err) => err ?  
              console.log(err) : console.log(`${file.originalname} 를 정상적으로 삭제했습니다`));
          });
        })
      
        if (fileDir) {
          fs.access(fileDir, fs.constants.F_OK, (err) => { // 폴더 삭제
            if (err) return console.log('삭제할 수 없는 폴더입니다');
          
            fs.rmdir(fileDir, (err) => err ?  
              console.log(err) : console.log(`${fileDir} 를 정상적으로 삭제했습니다`));
          });
        } 
      })
    })

    // 게시글 삭제
    Board.deleteMany({_id: { $in: _ids}}, function(err) {
      if (err) { return res.json({ success: false, err }) }
      return res.status(200).json({ success: true})     
    })

  } catch (error) {
    console.log(error)
    return res.json({ success: false, error })
  }
  
})

// 게시글 수정
router.post('/modify', (req, res) => {

  if (!req.body.boardId || !req.body.title || !req.body.content) {
    return res.json({ success: false, message: "input value not enough!" })
  } 

  const boardId =req.body.boardId
  const title = req.body.title
  const content = req.body.content
  const files = req.body.files
  const filesDeleted = req.body.filesDeleted

  try {

    // 첨부파일 삭제
    if (filesDeleted) {
      filesDeleted.map(file => {
        // 첨부파일 삭제 
        fs.access(file.url, fs.constants.F_OK, (err) => { // 파일 삭제
          if (err) return console.log('삭제할 수 없는 파일입니다');
        
          fs.unlink(file.url, (err) => err ?  
            console.log(err) : console.log(`${file.name} 을 정상적으로 삭제했습니다`));
        });
      })
    }
  
    // 게시글 수정
    Board.updateOne({ _id: boardId }, {title: title, content: content, files: files}, (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: err })
      } else {
        return res.json({ success: true})
      }
    })

  } catch (error) {
    console.log(error)
    return res.json({ success: false, error })
  }
  
})

// 게시글 등록
router.post('/addComment', (req, res) => {

  if (!req.body.user || !req.body.boardId || !req.body.content) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const user = req.body.user 
  const boardId =req.body.boardId
  const content = req.body.content

  Board.findOne({ _id: boardId })
  .then((board, err) => {

    const comment = {user: user, content: content}
    board.comments.push(comment)

    Board.updateOne({ _id: boardId }, {comments: board.comments}, (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: err })
      } else {
        return res.json({ success: true})
      }
    })

  });

})

// 댓글 삭제 
router.post('/deleteComment', (req, res) => {

  if (!req.body.boardId || !req.body.commentId) {
      return res.json({ success: false, message: "input value not enough!" })
  } 

  const boardId = req.body.boardId
  const commentId = req.body.commentId

  console.log("boardId:"+boardId)
  console.log("commentId:"+commentId)

  Board.findOne({ _id: boardId })
  .then((board, err) => {

    let filtered = board.comments.filter((element) => element._id != commentId);
    console.log('filtered:'+filtered)
    Board.updateOne({ _id: boardId }, {comments: filtered}, (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: err })
      } else {
        return res.json({ success: true})
      }
    })

  });
  
})

module.exports = router;