// socket.js
const socket = io(window.location.origin);

socket.on('connect', ()=> console.log('socket connected'));
socket.on('round_start', (data)=> {
  console.log('round_start', data);
  // set timer UI
});
socket.on('round_tick', (data)=> {
  // update timer
  document.getElementById('round-timer').innerText = data.left;
});
socket.on('round_end', (data)=> {
  console.log('round_end', data);
  // animate dice via three-dice import
  import('./three-dice.js').then(mod=>{
    const dice = data.round.dice.split(',').map(x=>parseInt(x));
    mod.rollToResult(dice);
  });
  // update balances etc.
});
socket.on('chat_message', (m)=> {
  // append to chat window
});
export default socket;
