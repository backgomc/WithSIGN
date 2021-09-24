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
      select: {name: 1, JOB_TITLE: 2}
    })
    .exec((err, data) => {
        console.log(data);
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
  }).then((board, err) => {
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
  
  // DB 삭제
  Board.deleteMany({_id: { $in: _ids}}, function(err) {
    if (err) { return res.json({ success: false, err }) }
    return res.status(200).json({ success: true})     
  })
  
})

module.exports = router;