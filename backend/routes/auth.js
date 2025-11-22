const express = require('express');
const router = express.Router();
const { run, get } = require('../db');
const { hashPass, checkPass, genToken, verifyToken } = require('../services/authService');

// register
router.post('/register', (req,res)=>{
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({error:'missing'});
  const existing = get('SELECT * FROM users WHERE username=?', [username]);
  if(existing) return res.status(400).json({error:'exists'});
  const pw = hashPass(password);
  run('INSERT INTO users (username,password,balance) VALUES (?,?,10000)', [username, pw]);
  const user = get('SELECT * FROM users WHERE id=last_insert_rowid()');
  const token = genToken(user);
  res.json({ token, user });
});

// login
router.post('/login', (req,res)=>{
  const { username, password } = req.body;
  const user = get('SELECT * FROM users WHERE username=?', [username]);
  if(!user) return res.status(401).json({ error:'invalid' });
  if(!checkPass(password, user.password)) return res.status(401).json({error:'invalid'});
  const token = genToken(user);
  res.json({ token, user });
});

// me
router.get('/me', (req,res)=>{
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ','');
  const payload = verifyToken(token);
  if(!payload) return res.status(401).json({error:'unauth'});
  const user = get('SELECT id,username,avatar,balance,is_admin,locked,created_at FROM users WHERE id=?', [payload.id]);
  res.json({ user });
});

module.exports = router;
