/* script.js - complete
   - requires index.html elements:
     #usernameDisplay, #balance, #logoutBtn, #resetBalance,
     #betAmount, #taiBtn, #xiuBtn, .dice, #dice1,#dice2,#dice3, #result
   - users stored under 'users' in localStorage
   - current user stored in 'currentUser'
*/

const DEFAULT_BALANCE = 1000;

// user storage helpers
function getUsers(){ return JSON.parse(localStorage.getItem('users') || '[]'); }
function saveUsers(users){ localStorage.setItem('users', JSON.stringify(users)); }

// ensure admin exists (again safe if login.html didn't create)
(function ensureAdmin(){
  const users = getUsers();
  if(!users.some(u => u.role === 'admin')){
    users.push({ username: 'admin', password: 'trolladmin', balance: 1000000, role: 'admin' });
    saveUsers(users);
    console.log('Default admin created: admin / trolladmin');
  }
})();

// require login
const currentUser = localStorage.getItem('currentUser');
if(!currentUser){ location.href = 'login.html'; }

let users = getUsers();
let userIndex = users.findIndex(u => u.username === currentUser);
if(userIndex === -1){
  alert('Người dùng không tồn tại — vui lòng đăng nhập lại.');
  localStorage.removeItem('currentUser');
  location.href = 'login.html';
}
let user = users[userIndex];

// DOM references
const unameEl = document.getElementById('usernameDisplay');
const balanceEl = document.getElementById('balance');
const logoutBtn = document.getElementById('logoutBtn');
const resetBtn = document.getElementById('resetBalance');
const betInput = document.getElementById('betAmount');
const taiBtn = document.getElementById('taiBtn');
const xiuBtn = document.getElementById('xiuBtn');
const diceContainer = document.querySelector('.dice');
const d1El = document.getElementById('dice1');
const d2El = document.getElementById('dice2');
const d3El = document.getElementById('dice3');
const resultEl = document.getElementById('result');

unameEl.textContent = user.username;
let balance = Number(user.balance || DEFAULT_BALANCE);
renderBalance();

// logout
logoutBtn.addEventListener('click', ()=>{
  localStorage.removeItem('currentUser');
  location.href = 'login.html';
});

// reset balance for current user
resetBtn.addEventListener('click', ()=>{
  if(!confirm('Reset số dư về ' + DEFAULT_BALANCE + '₫ cho tài khoản này?')) return;
  balance = DEFAULT_BALANCE;
  saveBalance();
  renderBalance();
});

// helpers
function renderBalance(){
  balanceEl.textContent = balance + '₫';
}
function saveBalance(){
  users[userIndex].balance = balance;
  saveUsers(users);
}
function emoji(n){ return ["⚀","⚁","⚂","⚃","⚄","⚅"][Math.max(1,Math.min(6,n)) - 1]; }

// disable/enable controls while spinning
function setControls(enabled){
  taiBtn.disabled = !enabled;
  xiuBtn.disabled = !enabled;
  betInput.disabled = !enabled;
  resetBtn.disabled = !enabled;
}

// spinning CSS class handled in style.css: .dice.shaking .die { animation... }
function startSpin(){
  diceContainer.classList.add('shaking');
  setControls(false);
}
function stopSpin(){
  diceContainer.classList.remove('shaking');
  setControls(true);
}

// main play logic: uses mode from localStorage.gameMode (set in admin.html)
taiBtn.addEventListener('click', ()=> play('Tài'));
xiuBtn.addEventListener('click', ()=> play('Xỉu'));

function play(choice){
  const bet = Math.max(1, parseInt(betInput.value) || 0);
  if(bet <= 0){ alert('Nhập số cược hợp lệ (>=1)'); return; }
  if(bet > balance){ alert('Không đủ tiền!'); return; }

  // start animation
  resultEl.textContent = '🎲 Đang lắc xúc xắc...';
  resultEl.style.color = '#fff';
  startSpin();

  // animation duration
  setTimeout(()=> {
    stopSpin();

    const roll = ()=> Math.ceil(Math.random()*6);
    const mode = localStorage.getItem('gameMode') || 'random';
    let d1,d2,d3;

    if(mode === 'allTai'){
      // force sum >= 11
      do { d1=roll(); d2=roll(); d3=roll(); } while(d1+d2+d3 < 11);
    } else if(mode === 'allXiu'){
      do { d1=roll(); d2=roll(); d3=roll(); } while(d1+d2+d3 >= 11);
    } else if(mode === 'taiHigh'){
      if(Math.random() < 0.7) do { d1=roll(); d2=roll(); d3=roll(); } while(d1+d2+d3 < 11);
      else do { d1=roll(); d2=roll(); d3=roll(); } while(d1+d2+d3 >= 11);
    } else if(mode === 'xiuHigh'){
      if(Math.random() < 0.7) do { d1=roll(); d2=roll(); d3=roll(); } while(d1+d2+d3 >= 11);
      else do { d1=roll(); d2=roll(); d3=roll(); } while(d1+d2+d3 < 11);
    } else {
      d1=roll(); d2=roll(); d3=roll();
    }

    const sum = d1 + d2 + d3;

    // show faces
    d1El.textContent = emoji(d1);
    d2El.textContent = emoji(d2);
    d3El.textContent = emoji(d3);

    const resultType = sum >= 11 ? 'Tài' : 'Xỉu';
    if(resultType === choice){
      balance += bet;
      resultEl.textContent = `🎉 Kết quả: ${resultType}! Bạn thắng +${bet}₫`;
      resultEl.style.color = '#00ff88';
    } else {
      balance -= bet;
      resultEl.textContent = `😢 Kết quả: ${resultType}! Bạn thua -${bet}₫`;
      resultEl.style.color = '#ff5555';
    }

    saveBalance();
    renderBalance();

  }, 1400);
}
