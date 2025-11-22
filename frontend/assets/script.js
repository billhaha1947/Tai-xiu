// script.js (ES module)
import socket from './socket.js';
import { initThree, rollToResult } from './three-dice.js';

document.addEventListener('DOMContentLoaded', async ()=> {
  // init three.js dice
  initThree();

  // init UI from local user if any
  const user = JSON.parse(localStorage.getItem('taixiu_user') || '{}');
  if(user.username){
    document.getElementById('header-username').innerText = user.username;
    document.getElementById('header-id').innerText = user.id || '-';
    document.getElementById('header-balance').innerText = (user.balance!=null? user.balance : 10000);
    document.getElementById('header-avatar').src = user.avatar || 'assets/avatar-default.png';
  }

  // socket event handlers
  window.addEventListener('sx_round_tick', e => {
    const left = e.detail.left;
    document.getElementById('round-timer').innerText = left;
    // progress ring
    const total = 20;
    const progress = Math.max(0, Math.min(1, left / total));
    const circumference = 2 * Math.PI * 50; // r=50
    const dash = circumference * progress;
    const el = document.getElementById('timer-progress');
    if(el) el.style.strokeDashoffset = (circumference - dash).toString();
    // glow when <3s
    const ring = document.getElementById('timer-ring');
    if(left <= 3) ring.classList.add('urgent'); else ring.classList.remove('urgent');
  });

  window.addEventListener('sx_round_end', e => {
    const r = e.detail.round || {};
    const dice = (r.dice || '1,2,3').split(',').map(x=>parseInt(x));
    rollToResult(dice);
    // update user balance by calling /api/auth/me if token present
    const token = localStorage.getItem('taixiu_token');
    if(token){
      fetch('/api/auth/me', { headers:{ 'Authorization':'Bearer '+token } })
        .then(res=>res.json()).then(j=>{ if(j.user){ localStorage.setItem('taixiu_user', JSON.stringify(j.user)); document.getElementById('header-balance').innerText = j.user.balance; } }).catch(()=>{});
    }
    // show short result flash
    const flash = document.getElementById('result-flash');
    const txt = document.getElementById('result-text');
    txt.innerText = r.result ? ('KẾT QUẢ: ' + r.result.toUpperCase()) : '';
    flash.classList.remove('hidden');
    setTimeout(()=> flash.classList.add('hidden'), 2200);
  });

  // chat
  document.getElementById('chat-send').addEventListener('click', sendChat);
  document.getElementById('chat-input').addEventListener('keydown', e => { if(e.key==='Enter') sendChat(); });
  window.addEventListener('sx_chat_message', e => appendChat(e.detail));

  function sendChat(){
    const msg = document.getElementById('chat-input').value.trim();
    if(!msg) return;
    const u = JSON.parse(localStorage.getItem('taixiu_user') || '{}');
    socket.emit('chat_message', { user_id: u.id || null, username: u.username || 'Khách', avatar: u.avatar || 'assets/avatar-default.png', message: msg, room:'lobby' });
    document.getElementById('chat-input').value = '';
  }
  function appendChat(m){
    const win = document.getElementById('chat-window');
    const el = document.createElement('div'); el.className='p-2 neon-card mb-2';
    el.innerHTML = `<div class="flex gap-3 items-start"><img src="${m.avatar||'assets/avatar-default.png'}" class="w-8 h-8 rounded-full"/><div><div class="text-sm font-bold">${m.username} <span class="text-xs text-gray-400 ml-2">${m.created_at||''}</span></div><div class="text-sm text-gray-200">${escapeHtml(m.message)}</div></div></div>`;
    win.appendChild(el);
    win.scrollTop = win.scrollHeight;
  }
  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

  // betting
  document.getElementById('btn-bet-tai').addEventListener('click', ()=> placeBet('tai'));
  document.getElementById('btn-bet-xiu').addEventListener('click', ()=> placeBet('xiu'));

  async function placeBet(choice){
    const amtEl = document.getElementById(choice==='tai' ? 'bet-tai' : 'bet-xiu');
    const amt = parseInt(amtEl.value || 0);
    if(!amt || amt <= 0) return alert('Nhập số xu hợp lệ');
    // get round
    const rr = await (await fetch('/api/round/current')).json();
    if(!rr.round) return alert('No active round');
    const tok = localStorage.getItem('taixiu_token') || '';
    const res = await fetch('/api/bet/place', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+tok },
      body: JSON.stringify({ choice, amount: amt, round_id: rr.round.id })
    });
    const j = await res.json();
    if(!res.ok) return alert(j.error || 'Lỗi đặt cược');
    // update header balance if returned
    if(j.user) { localStorage.setItem('taixiu_user', JSON.stringify(j.user)); document.getElementById('header-balance').innerText = j.user.balance; }
    amtEl.value = '';
  }

  // initial fetch: rounds history & leaderboard (best-effort)
  fetch('/api/round/history').then(r=>r.json()).then(j=>{
    const cont = document.getElementById('recent-rounds');
    if(j.rounds) {
      cont.innerHTML = '';
      j.rounds.slice(0,8).forEach(rr=>{
        const d = document.createElement('div'); d.className='w-6 h-6 rounded-full ' + (rr.result==='tai' ? 'bg-green-400' : 'bg-yellow-300'); cont.appendChild(d);
      });
    }
  });
  fetch('/api/admin/users').then(r=>r.json()).then(j=>{
    const lb = document.getElementById('leaderboard');
    if(j.users) lb.innerHTML = j.users.slice(0,6).map(u=>`<div class="flex justify-between p-2 neon-card">${u.username}<span>${u.balance}</span></div>`).join('');
  }).catch(()=>{});

});
