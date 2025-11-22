const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('express').json;
const multer = require('multer');
const { UPLOAD_DIR } = require('./config');

const authRoutes = require('./routes/auth');
const betRoutes = require('./routes/bet');
const roundRoutes = require('./routes/round');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(bodyParser());

// static files: serve frontend
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// API base
app.use('/api/auth', authRoutes);
app.use('/api/bet', betRoutes);
app.use('/api/round', roundRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// avatar upload
const upload = multer({ dest: UPLOAD_DIR });
app.post('/api/user/upload_avatar', upload.single('avatar'), (req,res)=>{
  // simple: store filename and set user record
  const token = (req.headers.authorization||'').replace('Bearer ','');
  const { verifyToken } = require('./services/authService');
  const payload = verifyToken(token);
  if(!payload) return res.status(401).json({error:'unauth'});
  const filename = req.file.filename;
  const avatarUrl = `/uploads/${filename}`;
  const { run } = require('./db');
  run('UPDATE users SET avatar=? WHERE id=?', [avatarUrl, payload.id]);
  res.json({ avatar: avatarUrl });
});


module.exports = app;
