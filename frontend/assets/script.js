// Main frontend logic (ES module)
import { initSocket, socket } from './socket.js';

/* ---------- Helpers ---------- */
const token = localStorage.getItem('taixiu_token') || null;
function authHeaders(){ return token ? {'Authorization': 'Bearer '+token} : {}; }
function formatTs(iso){ try { const d = new Date(iso); return d.toLocaleString(); } catch(e){ return iso; } }

/* ---------- Dice UI ---------- */
function createDiceElement(){
  const wrap = document.createElement('div');
  wrap.className = 'dice-wrap';
  const cube = document.createElement('div'); cube.className='dice'; cube.id='cube';
  const faces = ['front','back','right','left','top','bottom'];
  const faceValues = {front:1, back:6, right:3, left:4, top:2, bottom:5};
  faces.forEach(fn=>{
    const f = document.createElement('div'); f.className='face '+fn;
    f.innerHTML = `<div class="dots">${renderDots(faceValues[fn])}</div>`;
    cube.appendChild(f);
  });
  wrap.appendChild(cube);
  return wrap;
}
function renderDots(n){
  // simple representation: show n as text for clarity on small cube
  return `<div class="text-3xl font-bold">${n}</div>`;
}
function setCubeRotation(cubeEl, diceArray){
  // Map dice array to a dramatic rotation sequence
  // We'll rotate cube randomly then set to final orientation by sum
  const rx = Math.floor(Math.random()*720)+360;
  const ry = Math.floor(Math.random()*720)+360;
  cubeEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  // after transition, show final result as text overlay
  setTimeout(()=> {
    const total = diceArray.reduce((a,b)=>a+b,0);
    cubeEl.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900">${diceArray.join(' • ')}</div>`;
  }, 900);
}

/* ---------- Bet box component ---------- */
function mountBetBox(root){
  root.innerHTML = `
    <div class="p-3 neon-border rounded">
      <div class="flex items-center gap-3">
        <button id="btn-tai" class="btn-neon w-1/3">Tài</button>
        <button id="btn-xiu" class="btn-neon w-1/3">Xỉu</button>
        <input id="bet-amount" class="input-neon w-1/3" placeholder="Số xu"/>
      </div>
      <div class="mt-3 text-sm text-gray-300" id="bet-msg"></div>
    </div>
  `;
  root.querySelector('#btn-tai').addEventListener('click', ()=>placeBet('tai'));
  root.querySelector('#btn-xiu').addEventListener('click', ()=>placeBet('xiu'));
}
async function placeBet(choice){
  const amt = parseInt(document.getElementById('bet-amount').value || 0);
  if(!amt || amt <=0) return showBetMsg('Nhập số xu hợp lệ');
  // get current round id
  const r = await fetch('/round/current'); const jr = await r.json();
  const round = jr.round;
  if(!round) return showBetMsg('Chưa có ván hiện tại');
  try{
    const res = await fetch('/bet/place', {method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify({choice, amount: amt, round_id: round.id})});
    const j = await res.json();
    if(!res.ok) return showBetMsg(j.error || 'Lỗi đặt cược');
    // update balance UI
    localStorage.setItem('taixiu_user', JSON.stringify(j.user));
    updateHeaderUser();
    showBetMsg('Đặt cược thành công: ' + choice + ' ' + amt + ' xu');
  } catch(e){ showBetMsg('Lỗi kết nối'); }
}
function showBetMsg(m){ const el=document.getElementById('bet-msg'); if(el) el.innerText = m; }

/* ---------- Chat component ---------- */
function mountChat(root){
  root.innerHTML = `
    <div class="chat-window p-2" id="chat-window"></div>
    <div class="mt-2 flex gap-2">
      <input id="chat-input" class="input-neon flex-1" placeholder="Gõ chat..."/>
      <button id="chat-send" class="btn-neon">Gửi</button>
    </div>
  `;
  document.getElementById('chat-send').addEventListener('click', sendChat);
  document.getElementById('chat-input').addEventListener('keydown', e=>{ if(e.key==='Enter') sendChat(); });
  loadChatHistory();
}
async function loadChatHistory(){
  const res = await fetch('/chat/history?room=lobby');
  const j = await res.json();
  const win = document.getElementById('chat-window');
  win.innerHTML = j.messages.map(m=>renderChatMsg(m)).join('');
  win.scrollTop = win.scrollHeight;
}
function renderChatMsg(m){
  return `<div class="p-2 neon-border mb-2">
    <div class="flex items-center gap-2">
      <img src="${m.avatar || 'assets/avatar-default.png'}" class="w-8 h-8 rounded-full"/>
      <div>
        <div class="text-sm font-bold">${m.username} <span class="text-xs text-gray-400">${formatTs(m.created_at)}</span></div>
        <div class="text-sm text-gray-200">${escapeHtml(m.message)}</div>
      </div>
    </div>
  </div>`;
}
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }
async function sendChat(){
  const msg = document.getElementById('chat-input').value.trim();
  if(!msg) return;
  const user = JSON.parse(localStorage.getItem('taixiu_user') || '{}');
  // optimistic emit via socket if available
  if(window.socket && window.socket.connected){
    window.socket.emit('chat_message', {message: msg, room:'lobby', username: user.username, avatar: user.avatar});
    document.getElementById('chat-input').value='';
    return;
  }
  // fallback: POST to API (if implemented)
  const res = await fetch('/chat/send', {method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body:JSON.stringify({message:msg, room:'lobby'})});
  if(res.ok){ document.getElementById('chat-input').value=''; loadChatHistory(); }
}

/* ---------- Header / user ---------- */
function updateHeaderUser(){
  const u = JSON.parse(localStorage.getItem('taixiu_user') || '{}');
  document.getElementById('header-username').innerText = u.username || 'Khách';
  document.getElementById('header-balance').innerText = (u.balance!=null? u.balance:'-') + ' xu';
  document.getElementById('header-avatar').src = u.avatar || 'assets/avatar-default.png';
}
document.getElementById('btn-logout')?.addEventListener('click', ()=>{
  localStorage.removeItem('taixiu_token'); localStorage.removeItem('taixiu_user'); window.location = '/login.html';
});
document.getElementById('btn-profile')?.addEventListener('click', ()=> window.location = '/profile.html');
document.getElementById('btn-leader')?.addEventListener('click', ()=> window.location = '/leaderboard.html');

/* ---------- Round handling via socket ---------- */
(async function initApp(){
  // mount components
  const betBoxRoot = document.getElementById('bet-box-root');
  if(betBoxRoot) mountBetBox(betBoxRoot);

  const chatRoot = document.getElementById('chat-root');
  if(chatRoot) mountChat(chatRoot);

  const diceBox = document.getElementById('dice-box');
  if(diceBox){ diceBox.appendChild(createDiceElement()); }

  updateHeaderUser();

  // init socket
  const s = initSocket(()=>{});
  window.socket = s;

  s.on('connected', ()=> console.log('connected server'));
  s.on('round_start', (data)=> {
    console.log('round_start', data);
    document.getElementById('round-timer').innerText = String(data.round ? 20 : 20);
    // clear dice display
    const cube = document.getElementById('cube');
    if(cube) cube.innerHTML = '';
  });
  s.on('round_tick', (data)=> {
    if(document.getElementById('round-timer')) document.getElementById('round-timer').innerText = data.left;
  });
  s.on('round_end', (data)=> {
    // show dice + settle animations
    const diceArr = data.round.dice.split(',').map(x=>parseInt(x));
    const cube = document.getElementById('cube');
    if(cube) {
      // animate roll
      setCubeRotation(cube, diceArr);
      // winner animation: highlight winners in bet-history
      playWinEffects(data.settled || []);
    }
    // update balance by fetching /auth/me
    fetch('/auth/me', {headers: authHeaders()}).then(r=>r.json()).then(j=>{ if(j.user){ localStorage.setItem('taixiu_user', JSON.stringify(j.user)); updateHeaderUser(); } });
    // reload recent rounds
    loadRounds();
    // reload bet history (simple)
    loadBetHistory();
    // reload chat maybe
  });

  // chat message from server (if ws emits)
  s.on('chat_message', m=>{
    // append to chat window
    const win = document.getElementById('chat-window');
    if(win){ win.insertAdjacentHTML('beforeend', renderChatMsg(m)); win.scrollTop = win.scrollHeight; }
  });

  // initial load: rounds, leaderboard
  await loadRounds();
  await loadLeaderboard();
  await loadBetHistory();
})();

/* ---------- Utility: load recent rounds & leaderboards ---------- */
async function loadRounds(){
  const res = await fetch('/round/history'); if(!res.ok) return;
  const j = await res.json();
  const container = document.getElementById('recent-rounds');
  if(!container) return;
  container.innerHTML = j.rounds.slice(0,12).map(r=>`<div class="p-2 neon-border text-center">${r.result ? `<div class="font-bold">${r.result.toUpperCase()}</div><div class="text-sm">${r.dice||''}</div>` : `<div class="text-sm text-gray-400">Waiting</div>`}</div>`).join('');
}
async function loadLeaderboard(){
  // use admin/users endpoint; if unauthorized, fallback to local cached users
  let res = await fetch('/admin/users', {headers: authHeaders()});
  let html = '';
  if(res.ok){
    const j = await res.json();
    html = j.users.slice(0,6).map(u=>`<div class="flex justify-between p-2 neon-border">${u.username}<span>${u.balance}</span></div>`).join('');
  } else {
    const u = JSON.parse(localStorage.getItem('taixiu_user')||'null');
    if(u) html = `<div class="flex justify-between p-2 neon-border">${u.username}<span>${u.balance}</span></div>`;
  }
  document.getElementById('leaderboard').innerHTML = html;
}
async function loadBetHistory(){
  // quick list: last bets (not endpoint in REST for regular users) -> fallback to fetching round history and bets per round could be improved
  const res = await fetch('/admin/bets', {headers: authHeaders()});
  if(!res.ok) { document.getElementById('bet-history').innerText = 'No data'; return; }
  const j = await res.json();
  document.getElementById('bet-history').innerHTML = j.bets.slice(0,12).map(b=>`<div class="p-2 neon-border">${b.created_at} • u:${b.user_id} • ${b.choice} • ${b.amount} • won:${b.won}</div>`).join('');
}

/* ---------- Win effects ---------- */
function playWinEffects(settled){
  // highlight wins
  const winners = settled.filter(b=>b.won);
  if(winners.length){
    // flash page header
    document.querySelector('header')?.classList.add('win-effect');
    setTimeout(()=> document.querySelector('header')?.classList.remove('win-effect'), 1200);
    // increase counter visually
    winners.forEach(w=>{
      // find user if current user won, show ring
      const me = JSON.parse(localStorage.getItem('taixiu_user')||'{}');
      if(me.id === w.user_id){
        // animate header balance
        const hb = document.getElementById('header-balance');
        if(hb) {
          hb.classList.add('win-effect');
          setTimeout(()=> hb.classList.remove('win-effect'),1200);
        }
      }
    });
  }
          }
