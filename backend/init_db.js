const { run, get } = require('./db');
const fs = require('fs');
const { UPLOAD_DIR } = require('./config');
const bcrypt = require('bcryptjs');

if(!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  avatar TEXT,
  balance INTEGER DEFAULT 10000,
  is_admin INTEGER DEFAULT 0,
  locked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

run(`
CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT,
  ended_at TEXT,
  dice TEXT,
  result TEXT
);
`);

run(`
CREATE TABLE IF NOT EXISTS bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  round_id INTEGER,
  choice TEXT,
  amount INTEGER,
  won INTEGER,
  paid INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

run(`
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  avatar TEXT,
  message TEXT,
  room TEXT DEFAULT 'lobby',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// seed admin if not exists
const admin = get('SELECT * FROM users WHERE is_admin=1 LIMIT 1');
if(!admin){
  const pw = bcrypt.hashSync('admin123', 10);
  run('INSERT INTO users (username,password,balance,is_admin) VALUES (?,?,?,1)', ['admin', pw, 1000000]);
  console.log('Seed admin -> username: admin password: admin123');
}
