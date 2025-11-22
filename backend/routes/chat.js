const express = require('express');
const router = express.Router();
const { all } = require('../db');

router.get('/history', (req,res)=>{
  const room = req.query.room || 'lobby';
  const msgs = all('SELECT * FROM chats WHERE room=? ORDER BY id DESC LIMIT 200', [room]).reverse();
  res.json({ messages: msgs });
});

module.exports = router;
