const http = require('http');
const app = require('./app');
const { startSocket } = require('./socket/io'); // will export function to accept server
const { PORT } = require('./config');
require('./init_db'); // ensure DB + seed

const server = http.createServer(app);
const ioModule = require('./socket/io');
ioModule.startSocket(server);

server.listen(PORT, ()=> {
  console.log('Server listening on', PORT);
});
