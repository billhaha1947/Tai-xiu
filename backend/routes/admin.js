const express = require('express');
const router = express.Router();
const { all, run, get } = require('../db');
const { verifyToken } = require('../services/authService');
const gameService = require('../services/gameService');

function checkAdmin(req,res,next){
  const token = (req.headers.authorization||'').replace('Bearer ','');
  const p = verifyToken(token);
  if(!p || !p.is_admin) return res.status(401).json({error:'no'});
  req.admin = p; next();
}

router.use(checkAdmin);

router.get('/users', (req,res)=> {
  const users = all('SELECT id,username,avatar,balance,is_admin,locked FROM users ORDER BY balance DESC');
  res.json({ users });
});

router.post('/set_balance', (req,res) => {
  const { user_id, amount } = req.body;
  run('UPDATE users SET balance=? WHERE id=?', [parseInt(amount,10), user_id]);
  res.json({ ok: true });
});

router.post('/lock', (req,res) => {
  const { user_id, locked } = req.body;
  run('UPDATE users SET locked=? WHERE id=?', [locked?1:0, user_id]);
  res.json({ ok:true });
});

router.get('/bets', (req,res) => {
  const bets = all('SELECT * FROM bets ORDER BY id DESC LIMIT 500');
  res.json({ bets });
});

router.get('/chats', (req,res) => {
  const chats = all('SELECT * FROM chats ORDER BY id DESC LIMIT 500');
  res.json({ chats });
});

router.post('/set_winrate', (req,res) => {
  const { percent, anti_whale } = req.body;
  gameService.setSystemWinrate(percent);
  gameService.toggleAntiWhaler(!!anti_whale);
  res.json({ ok:true });
});

module.exports = router;
