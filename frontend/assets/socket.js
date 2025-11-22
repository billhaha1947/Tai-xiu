// socket.js (ES module)
const socket = io(window.location.origin, { transports:['websocket'] });

socket.on('connect', ()=> console.log('[socket] connected'));
socket.on('disconnect', ()=> console.log('[socket] disconnected'));

// dispatch events for script.js
socket.on('round_start', (d)=> window.dispatchEvent(new CustomEvent('sx_round_start', {detail:d})));
socket.on('round_tick', (d)=> window.dispatchEvent(new CustomEvent('sx_round_tick', {detail:d})));
socket.on('round_end', (d)=> window.dispatchEvent(new CustomEvent('sx_round_end', {detail:d})));
socket.on('chat_message', (m)=> window.dispatchEvent(new CustomEvent('sx_chat_message', {detail:m})));

export default socket;
