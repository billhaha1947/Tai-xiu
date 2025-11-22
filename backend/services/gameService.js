const { run, all, get } = require('../db');
const { ROUND_SECONDS, SYSTEM_WINRATE_DEFAULT } = require('../config');
const crypto = require('crypto');

let SYSTEM_WINRATE = SYSTEM_WINRATE_DEFAULT;
let ANTI_WHALER_MODE = false; // admin toggles

function setSystemWinrate(v){ SYSTEM_WINRATE = parseFloat(v); }
function toggleAntiWhaler(b){ ANTI_WHALER_MODE = !!b; }

// utility: all combos for 3 dice
function diceToResult(total){ return (total >= 11 && total <= 17) ? 'tai' : 'xiu'; }

function randomThreeDice(){
  return [rand1to6(), rand1to6(), rand1to6()];
}
function rand1to6(){ return Math.floor(Math.random()*6)+1; }

function weightedRoll(roundId){
  // read total bets for this round
  const sums = get('SELECT SUM(CASE WHEN choice="tai" THEN amount ELSE 0 END) AS tai_sum, SUM(CASE WHEN choice="xiu" THEN amount ELSE 0 END) AS xiu_sum FROM bets WHERE round_id=?', [roundId]);
  const tai = Number(sums.tai_sum || 0);
  const xiu = Number(sums.xiu_sum || 0);
  const total_bets = tai + xiu;

  // baseline: system wants to win SYSTEM_WINRATE% of time
  const houseBias = SYSTEM_WINRATE / 100.0;

  // compute naive probabilities:
  // if no bets, random fair roll
  if(total_bets === 0){
    const dice = randomThreeDice();
    return { dice, result: diceToResult(dice.reduce((a,b)=>a+b,0)) };
  }

  // probability to choose result that favors house:
  // house wants to pick side with less payout to players -> usually pick side with more stake by players? For house to win, choose side opposite to majority bets.
  // We'll compute preferResult probability based on houseBias and imbalance ratio.
  const imbalance = Math.abs(tai - xiu) / (total_bets || 1);
  // if tai > xiu, majority on tai, house should bias to xiu to cause losses
  const majoritySide = tai >= xiu ? 'tai' : 'xiu';
  const minoritySide = tai >= xiu ? 'xiu' : 'tai';

  // base chooseMinorityProb — choose result that causes majority to lose
  let chooseMinorityProb = 0.5 + (houseBias * 0.5) + (imbalance * 0.25);
  if(chooseMinorityProb > 0.95) chooseMinorityProb = 0.95;
  if(chooseMinorityProb < 0.05) chooseMinorityProb = 0.05;

  // Anti-whaler: if enabled, detect users with repeated wins (simple heuristic)
  if(ANTI_WHALER_MODE){
    // find top winners (simple: users who won more than lost recently)
    const winners = all(`SELECT user_id, SUM(CASE WHEN won=1 THEN 1 ELSE 0 END) AS wins, SUM(CASE WHEN won=0 THEN 1 ELSE 0 END) AS losses FROM bets WHERE created_at >= datetime('now','-1 day') GROUP BY user_id HAVING wins >= 5 ORDER BY wins DESC LIMIT 5`);
    if(winners && winners.length > 0){
      // increase houseBias slightly
      chooseMinorityProb = Math.min(0.99, chooseMinorityProb + 0.06);
    }
  }

  // decide which result to aim for
  const aimForMinority = Math.random() < chooseMinorityProb;
  const targetResult = aimForMinority ? minoritySide : majoritySide;

  // pick dice that match targetResult (we'll sample combos until match)
  for(let trials=0; trials<2000; trials++){
    const dice = randomThreeDice();
    const tot = dice.reduce((a,b)=>a+b,0);
    const r = diceToResult(tot);
    if(r === targetResult) return { dice, result: r };
  }
  // fallback
  const dice = randomThreeDice();
  return { dice, result: diceToResult(dice.reduce((a,b)=>a+b,0)) };
}

function settleRound(roundId, result){
  const bets = all('SELECT * FROM bets WHERE round_id = ?', [roundId]);
  const settled = [];
  for(const b of bets){
    const won = (b.choice === result) ? 1 : 0;
    if(won){
      // payout 1:1 -> return stake + win => amount * 2
      run('UPDATE users SET balance = balance + ? WHERE id=?', [b.amount*2, b.user_id]);
      run('UPDATE bets SET won=1, paid=1 WHERE id=?', [b.id]);
    } else {
      run('UPDATE bets SET won=0 WHERE id=?', [b.id]);
    }
    settled.push(Object.assign({}, b, { won }));
  }
  return settled;
}

module.exports = { weightedRoll, diceToResult, settleRound, setSystemWinrate, toggleAntiWhaler };
