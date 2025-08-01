
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let players = {};
let crashPoint = 0;
let isGameRunning = false;

function generateCrashPoint() {
  return parseFloat((Math.random() * (10 - 0.1) + 0.1).toFixed(2));
}

function startGame() {
  isGameRunning = true;
  crashPoint = generateCrashPoint();
  let multiplier = 1.0;
  const startTime = Date.now();

  const interval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    multiplier = +(1 * Math.exp(0.12 * elapsed)).toFixed(2);

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      isGameRunning = false;
      io.emit('crash', { crashAt: crashPoint });
      for (const id in players) {
        if (!players[id].cashedOut) {
          players[id].result = 'BUST';
        }
      }
      io.emit('results', players);
      players = {};
      setTimeout(startGame, 5000);
    } else {
      io.emit('tick', { multiplier });
    }
  }, 100);
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join', ({ username, bet }) => {
    players[socket.id] = {
      username,
      bet,
      cashedOut: false,
      cashOutAt: null,
    };
    io.emit('players', players);
  });

  socket.on('cashout', () => {
    const player = players[socket.id];
    if (player && !player.cashedOut && isGameRunning) {
      const cashOutAt = parseFloat(player.currentMultiplier || 1.0);
      player.cashedOut = true;
      player.cashOutAt = cashOutAt;
      player.result = (player.bet * cashOutAt).toFixed(2);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('players', players);
  });
});

server.listen(3000, () => {
  console.log('Pi Rocket Server running on http://localhost:3000');
  startGame();
});
