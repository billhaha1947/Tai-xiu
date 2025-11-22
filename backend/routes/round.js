const express = require('express');
const router = express.Router();
const { all, get } = require('../db');

router.get('/current', (req,res) => {
  const r = get('SELECT * FROM rounds ORDER BY id DESC LIMIT 1');
  res.json({ round: r || null });
});
router.get('/history', (req,res) => {
  const rs = all('SELECT * FROM rounds ORDER BY id DESC LIMIT 100');
  res.json({ rounds: rs });
});

module.exports = router;
