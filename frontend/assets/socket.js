// Socket client manager (ES module)
const API_BASE = '/'; // REST endpoints relative root
const SOCKET_URL = window.location.origin; // assumes ws on same host

export let socket = null;
export function initSocket(onConnect){
  if(socket) return socket;
  socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: false });
  socket.on('connect', ()=> {
    console.log('socket connected');
    if(onConnect) onConnect();
  });
  socket.on('disconnect', ()=> console.log('socket disconnected'));
  // default handlers are set in script.js
  socket.connect();
  return socket;
}
