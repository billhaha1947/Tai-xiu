// script.js (ES module)
import socket from './socket.js';
import { initThree, rollToResult } from './three-dice.js';

document.addEventListener('DOMContentLoaded', ()=> {
  // init dice
  initThree();

  // header demo (load user if exists)
  const user = JSON.parse(localStorage.getItem('taixiu_user') || '{}');
  if(user.username) {
    document.getElementById('header-username').innerText = user.username;
    document.getElementById('header-id').innerText = user.id || '-';
    document.getElementById('header-balance').innerText = (user.balance!=null? user.balance : 10000);
    document.getElementById('header-avatar').src = user.avatar || 'assets/avatar-default.png';
  }

  // chat send
  document.getElementById('chat-send').addEventListener('click', sendChat);
  document.getElementById('chat-input').addEventListener('keydown', e => { if(e.key === 'Enter') sendChat(); });

  function sendChat(){
    const msg = document.getElementById('chat-input').value.trim();
    if(!msg) return;
    const u = JSON.parse(localStorage.getItem('taixiu_user') || '{}');
    const payload = { user_id: u.id || null, username: u.username || 'Khách', avatar: u.avatar || '/assets/avatar-default.png', message: msg, room:'lobby' };
    socket.emit('chat_message', payload);
    document.getElementById('chat-input').value = '';
  }

  // listen socket forwarded events
  window.addEventListener('sx_round_tick', e => {
    const left = e.detail.left;
    document.getElementById('round-timer').innerText = left;
  });

  window.addEventListener('sx_round_end', e => {
    const r = e.detail.round;
    const settled = e.detail.settled || [];
    // animate dice
    const dice = (r.dice || '1,2,3').split(',').map(x=>parseInt(x));
    rollToResult(dice);

    // update balances by calling /api/auth/me if token present
    const token = localStorage.getItem('taixiu_token');
    if(token){
      fetch('/api/auth/me', { headers: { 'Authorization':'Bearer '+token } }).then(res=>res.json()).then(j=>{
        if(j.user) {
          localStorage.setItem('taixiu_user', JSON.stringify(j.user));
          document.getElementById('header-balance').innerText = j.user.balance;
        }
      }).catch(()=>{});
    }

    // append bet results to history
    if(settled.length){
      const hist = document.getElementById('bet-history');
      settled.slice(0,8).forEach(b=>{
        const el = document.createElement('div'); el.className='p-2 neon-border mb-1 text-sm';
        el.innerText = `${b.created_at || ''} • u:${b.user_id} • ${b.choice} • ${b.amount} • won:${b.won}`;
        hist.prepend(el);
      });
    }
  });

  window.addEventListener('sx_chat_message', e => {
    const m = e.detail;
    appendChat(m);
  });

  function appendChat(m){
    const win = document.getElementById('chat-window');
    const el = document.createElement('div'); el.className='p-2 neon-border mb-2';
    el.innerHTML = `<div class="flex gap-2 items-center"><img src="${m.avatar||'assets/avatar-default.png'}" class="w-8 h-8 rounded-full"/> <div><div class="text-sm font-bold">${m.username} <span class="text-xs text-gray-300 ml-2">${m.created_at?m.created_at:''}</span></div><div class="text-sm text-gray-200">${escapeHtml(m.message)}</div></div></div>`;
    win.appendChild(el);
    win.scrollTop = win.scrollHeight;
  }
  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

  // betting buttons
  document.getElementById('btn-bet-tai').addEventListener('click', ()=>placeBet('tai'));
  document.getElementById('btn-bet-xiu').addEventListener('click', ()=>placeBet('xiu'));

  async function placeBet(choice){
    const amtInput = document.getElementById(choice==='tai' ? 'bet-tai' : 'bet-xiu');
    const amt = parseInt(amtInput.value || 0);
    if(!amt || amt<=0) return alert('Nhập số xu hợp lệ');
    // get current round
    const r = await (await fetch('/api/round/current')).json();
    if(!r.round) return alert('Không có ván hiện tại');
    const token = localStorage.getItem('taixiu_token');
    const res = await fetch('/api/bet/place', {
      method:'POST',
      headers: {'Content-Type':'application/json', 'Authorization': 'Bearer '+(token||'')},
      body: JSON.stringify({ choice, amount: amt, round_id: r.round.id })
    });
    const j = await res.json();
    if(res.ok) {
      alert('Đã đặt: ' + choice + ' ' + amt + ' xu');
      // update header balance local
      if(j.user) { localStorage.setItem('taixiu_user', JSON.stringify(j.user)); document.getElementById('header-balance').innerText = j.user.balance; }
    } else {
      alert(j.error || 'Lỗi đặt cược');
    }
  }

  // small initial loads
  fetch('/api/round/history').then(r=>r.json()).then(j=>{
    const container = document.getElementById('recent-rounds');
    if(j.rounds) j.rounds.slice(0,8).forEach(rr => {
      const dot = document.createElement('div'); dot.className='recent-dot ' + (rr.result==='tai' ? 'bg-green-500' : 'bg-yellow-400');
      container.appendChild(dot);
    });
  });

  // leaderboard (simple)
  fetch('/api/admin/users').then(r=>r.json()).then(j=>{
    if(j.users){
      const lb = document.getElementById('leaderboard');
      lb.innerHTML = j.users.slice(0,6).map(u=>`<div class="flex justify-between p-2 neon-border">${u.username}<span>${u.balance}</span></div>`).join('');
    }
  }).catch(()=>{ /* ignore if not admin */ });

});
