const { run, all } = require('../db');

const lastMessageAt = {}; // map user_id -> timestamp
const COOLDOWN = 1500;

function canSend(userId){
  const now = Date.now();
  const key = userId || 'anon';
  if(lastMessageAt[key] && now - lastMessageAt[key] < COOLDOWN) return false;
  lastMessageAt[key] = now;
  return true;
}

function saveChat({user_id, username, avatar, message, room='lobby'}){
  run('INSERT INTO chats (user_id, username, avatar, message, room) VALUES (?,?,?,?,?)', [user_id, username, avatar, message, room]);
  const id = this.lastID;
  return id;
}

function getHistory(room='lobby', limit=200){
  return all('SELECT * FROM chats WHERE room=? ORDER BY id DESC LIMIT ?', [room, limit]).reverse();
}

module.exports = { canSend, saveChat, getHistory };
