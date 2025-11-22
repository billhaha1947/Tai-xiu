const { Server } = require('socket.io');
const { run, all, get } = require('../db');
const { ROUND_SECONDS } = require('../config');
const { weightedRoll, settleRound } = require('../services/gameService');
const chatService = require('../services/chatService');

let ioInstance = null;
let currentRound = null;
let roundTimer = null;
let secondsLeft = ROUND_SECONDS;

function startSocket(server){
  const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] }});
  ioInstance = io;

  io.on('connection', (socket)=>{
    console.log('socket connected', socket.id);
    socket.on('join', (room='lobby') => { socket.join(room); });
    socket.on('leave', (room='lobby') => { socket.leave(room); });

    socket.on('chat_message', (payload)=>{
      // payload: { tokenUser or user info, message, room }
      const { user_id, username, avatar, message, room='lobby' } = payload;
      if(!chatService.canSend(user_id)) {
        socket.emit('chat_blocked', {msg:'slow down'});
        return;
      }
      // save
      run('INSERT INTO chats (user_id, username, avatar, message, room) VALUES (?,?,?,?,?)', [user_id, username, avatar, message, room]);
      const chat = get('SELECT * FROM chats WHERE id = last_insert_rowid()');
      io.to(room).emit('chat_message', chat);
    });
  });

  startRoundLoop(io);
  return io;
}

function startRoundLoop(io){
  // create initial round
  createNewRound(io);

  // tick every second
  setInterval(()=>{
    if(!currentRound) return;
    secondsLeft--;
    if(secondsLeft <= 0){
      // end round
      endRound(io, currentRound.id);
      // new round after 2 seconds
      setTimeout(()=> createNewRound(io), 2000);
    } else {
      io.emit('round_tick', { left: secondsLeft, round_id: currentRound.id });
    }
  }, 1000);
}

function createNewRound(io){
  const started_at = (new Date()).toISOString();
  run('INSERT INTO rounds (started_at) VALUES (?)', [started_at]);
  const r = get('SELECT * FROM rounds ORDER BY id DESC LIMIT 1');
  currentRound = r;
  secondsLeft = ROUND_SECONDS;
  io.emit('round_start', { round: currentRound, seconds: secondsLeft });
}

function endRound(io, roundId){
  // compute weighted roll
  const { dice, result } = weightedRoll(roundId);
  const diceStr = dice.join(',');
  const ended_at = (new Date()).toISOString();
  run('UPDATE rounds SET ended_at=?, dice=?, result=? WHERE id=?', [ended_at, diceStr, result, roundId]);

  // settle bets
  const settled = settleRound(roundId, result);

  const round = get('SELECT * FROM rounds WHERE id=?', [roundId]);
  io.emit('round_end', { round, settled });
  currentRound = null;
}

module.exports = { startSocket };
