const express = require('express');
const router = express.Router();
const { run, get } = require('../db');
const { verifyToken } = require('../services/authService');

// place bet
router.post('/place', (req,res)=>{
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ','');
  const payload = verifyToken(token);
  if(!payload) return res.status(401).json({ error:'unauth' });

  const { choice, amount, round_id } = req.body;
  if(!['tai','xiu'].includes(choice)) return res.status(400).json({ error: 'bad choice' });
  const amt = parseInt(amount,10);
  if(!amt || amt <= 0) return res.status(400).json({ error: 'bad amount' });

  // check user
  const user = get('SELECT * FROM users WHERE id=?', [payload.id]);
  if(!user) return res.status(401).json({error:'no user'});
  if(user.locked) return res.status(403).json({error:'locked'});
  if(user.balance < amt) return res.status(400).json({error:'insufficient'});

  // check round
  const round = get('SELECT * FROM rounds WHERE id=?', [round_id]);
  if(!round) return res.status(400).json({error:'no round'});
  if(round.ended_at) return res.status(400).json({error:'round closed'});

  // withdraw immediately
  run('UPDATE users SET balance = balance - ? WHERE id=?', [amt, user.id]);
  run('INSERT INTO bets (user_id,round_id,choice,amount) VALUES (?,?,?,?)', [user.id, round_id, choice, amt]);

  const updated = get('SELECT id,username,avatar,balance FROM users WHERE id=?', [user.id]);
  res.json({ bet: { round_id, choice, amount:amt }, user: updated });
});

module.exports = router;
