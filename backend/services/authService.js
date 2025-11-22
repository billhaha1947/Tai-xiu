const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { run, get } = require('../db');

function hashPass(pw){ return bcrypt.hashSync(pw, 10); }
function checkPass(pw, hash){ return bcrypt.compareSync(pw, hash); }

function genToken(user){
  const payload = { id: user.id, username: user.username, is_admin: !!user.is_admin };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token){
  try { return jwt.verify(token, JWT_SECRET); }
  catch(e){ return null; }
}

module.exports = { hashPass, checkPass, genToken, verifyToken };
