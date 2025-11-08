const DEFAULT_BALANCE = 1000;

// --- Quản lý user ---
function getUsers(){ return JSON.parse(localStorage.getItem('users') || '[]'); }
function saveUsers(users){ localStorage.setItem('users', JSON.stringify(users)); }

const currentUser = localStorage.getItem('currentUser');
if(!currentUser){ location.href = 'login.html'; }

let users = getUsers();
let user = users.find(x => x.username === currentUser);
if(!user){
  alert("User không tồn tại, vui lòng đăng nhập lại!");
  localStorage.removeItem('currentUser');
  location.href = 'login.html';
}

let balance = user.balance;
const balanceEl = document.getElementById('balance');
document.getElementById('usernameDisplay').textContent = user.username;
renderBalance();

document.getElementById('logoutBtn').onclick = ()=>{
  localStorage.removeItem('currentUser');
  location.href = 'login.html';
};

document.getElementById('resetBalance').onclick = ()=>{
  balance = DEFAULT_BALANCE;
  saveBalance();
  renderBalance();
};

function renderBalance(){
  balanceEl.textContent = balance + "₫";
}
function saveBalance(){
  user.balance = balance;
  saveUsers(users);
}

function emoji(num){
  return ["⚀","⚁","⚂","⚃","⚄","⚅"][num-1];
}

document.getElementById('taiBtn').onclick = ()=>play('Tài');
document.getElementById('xiuBtn').onclick = ()=>play('Xỉu');

function play(choice) {
  const bet = parseInt(document.getElementById('betAmount').value);
  const mode = document.getElementById('modeSelect').value;
  if (!bet || bet <= 0) { alert("Nhập số tiền hợp lệ!"); return; }
  if (bet > balance) { alert("Không đủ tiền!"); return; }

  const roll = () => Math.ceil(Math.random() * 6);
  let d1, d2, d3;

  // --- Chọn chế độ ---
  if (mode === "allTai") {
    do { d1 = roll(); d2 = roll(); d3 = roll(); } while (d1 + d2 + d3 < 11);
  } 
  else if (mode === "allXiu") {
    do { d1 = roll(); d2 = roll(); d3 = roll(); } while (d1 + d2 + d3 >= 11);
  }
  else if (mode === "taiHigh") {
    if (Math.random() < 0.7)
      do { d1 = roll(); d2 = roll(); d3 = roll(); } while (d1 + d2 + d3 < 11);
    else
      do { d1 = roll(); d2 = roll(); d3 = roll(); } while (d1 + d2 + d3 >= 11);
  }
  else if (mode === "xiuHigh") {
    if (Math.random() < 0.7)
      do { d1 = roll(); d2 = roll(); d3 = roll(); } while (d1 + d2 + d3 >= 11);
    else
      do { d1 = roll(); d2 = roll(); d3 = roll(); } while (d1 + d2 + d3 < 11);
  }
  else { // random
    d1 = roll(); d2 = roll(); d3 = roll();
  }

  const sum = d1 + d2 + d3;
  const resultType = sum >= 11 ? 'Tài' : 'Xỉu';

  document.getElementById('dice1').textContent = emoji(d1);
  document.getElementById('dice2').textContent = emoji(d2);
  document.getElementById('dice3').textContent = emoji(d3);

  const resultEl = document.getElementById('result');
  if(resultType === choice){
    balance += bet;
    resultEl.textContent = `🎉 Kết quả: ${resultType}! Bạn thắng +${bet}₫`;
    resultEl.style.color = "#00ff88";
  } else {
    balance -= bet;
    resultEl.textContent = `😢 Kết quả: ${resultType}! Bạn thua -${bet}₫`;
    resultEl.style.color = "#ff5555";
  }
  saveBalance();
  renderBalance();
}
