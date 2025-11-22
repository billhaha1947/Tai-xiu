import socket from './socket.js';
import { setup, rollToResult } from './three-dice.js';

setup(); // init three.js dice

// load current round
fetch('/api/round/current').then(r=>r.json()).then(j=>{
  if(j.round) document.getElementById('round-timer').innerText = '20';
});

// place bet handlers
document.getElementById('btn-bet-tai').addEventListener('click', async ()=>{
  const amt = parseInt(document.getElementById('bet-tai').value||0);
  const round = (await (await fetch('/api/round/current')).json()).round;
  const token = localStorage.getItem('taixiu_token');
  const res = await fetch('/api/bet/place', {
    method:'POST',
    headers: {'Content-Type':'application/json', 'Authorization': 'Bearer '+token},
    body: JSON.stringify({ choice:'tai', amount: amt, round_id: round.id })
  });
  const data = await res.json();
  if(!res.ok) alert(data.error);
  else {
    alert('Đặt thành công');
    // update header balance
  }
});

// chat
document.getElementById('chat-send').addEventListener('click', ()=>{
  const msg = document.getElementById('chat-input').value.trim();
  if(!msg) return;
  const user = JSON.parse(localStorage.getItem('taixiu_user')||'{}');
  socket.emit('chat_message', { user_id: user.id, username: user.username || 'Khách', avatar: user.avatar || '/assets/avatar-default.png', message: msg, room: 'lobby' });
  document.getElementById('chat-input').value = '';
});

// on chat message from server append
socket.on('chat_message', (m)=>{
  const win = document.getElementById('chat-window');
  const el = document.createElement('div');
  el.className = 'p-2 neon-border mb-2';
  el.innerHTML = `<div class="flex gap-2 items-center"><img src="${m.avatar||'assets/avatar-default.png'}" class="w-8 h-8 rounded-full"/> <div><div class="font-bold">${m.username}</div><div class="text-sm text-gray-200">${m.message}</div></div></div>`;
  win.appendChild(el);
  win.scrollTop = win.scrollHeight;
});
