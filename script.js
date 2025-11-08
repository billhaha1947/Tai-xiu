function randomDice() {
  return 1 + Math.floor(Math.random() * 6);
}

function play(choice) {
  const rig = localStorage.getItem('rigMode') || 'none';
  const diceEls = [document.getElementById('dice1'), document.getElementById('dice2'), document.getElementById('dice3')];

  // hiệu ứng xoay xúc xắc
  diceEls.forEach(d => d.classList.add('spin'));
  document.getElementById('result').textContent = "Đang lắc...";
  document.getElementById('sum').textContent = "Tổng: ?";

  setTimeout(() => {
    diceEls.forEach(d => d.classList.remove('spin'));

    let d1 = randomDice(), d2 = randomDice(), d3 = randomDice();
    let sum = d1 + d2 + d3;

    if (rig === 'tai') sum = 12 + Math.floor(Math.random() * 5);
    if (rig === 'xiu') sum = 4 + Math.floor(Math.random() * 6);

    const diceEmoji = ["⚀","⚁","⚂","⚃","⚄","⚅"];
    diceEls[0].textContent = diceEmoji[d1-1];
    diceEls[1].textContent = diceEmoji[d2-1];
    diceEls[2].textContent = diceEmoji[d3-1];

    document.getElementById('sum').textContent = `Tổng: ${sum}`;

    const result = (sum >= 11 && sum <= 17) ? 'tai' : 'xiu';
    const text = choice === result
      ? `✅ Bạn thắng! (${sum} → ${result.toUpperCase()})`
      : `❌ Bạn thua! (${sum} → ${result.toUpperCase()})`;

    document.getElementById('result').textContent = text;
    document.getElementById('result').style.color = (choice === result) ? '#00ff88' : '#ff5555';
  }, 1500);
}