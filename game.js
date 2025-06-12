// Grumpy Cat Tuna Chase Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const collectSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
const hitSound = new Audio('https://actions.google.com/sounds/v1/cartoon/concussive_hit_guitar_boing.ogg');
const music = new Audio('https://cdn.pixabay.com/download/audio/2022/03/29/audio_7d6c0e7fa4.mp3?filename=retro-game-music-loop-110109.mp3');
music.loop = true;
let musicOn = false;

let gameState = {
  score: 0,
  level: 1,
  lives: 3,
  gameRunning: true,
  paused: false,
};

let seconds = 0;
let timerInterval;

let player = {
  x: 50,
  y: 50,
  size: 40,
  speed: 3,
  dx: 0,
  dy: 0,
};

let imageLoaded = false;
const catImage = new Image();
catImage.src = 'https://upload.wikimedia.org/wikipedia/en/0/0b/Grumpy_Cat_by_Gage_Skidmore.jpg';
catImage.onload = () => imageLoaded = true;

let tuna = [];
let obstacles = [];

const walls = [
  { x: 0, y: 0, width: 600, height: 20 },
  { x: 0, y: 0, width: 20, height: 400 },
  { x: 580, y: 0, width: 20, height: 400 },
  { x: 0, y: 380, width: 600, height: 20 },
  { x: 100, y: 80, width: 20, height: 120 },
  { x: 200, y: 160, width: 120, height: 20 },
  { x: 400, y: 80, width: 20, height: 120 },
  { x: 480, y: 200, width: 20, height: 120 },
  { x: 160, y: 280, width: 200, height: 20 },
  { x: 300, y: 50, width: 20, height: 80 },
];

function generateTuna() {
  tuna = [];
  for (let i = 0; i < 15 + gameState.level * 3; i++) {
    let pos;
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 100) {
      pos = {
        x: Math.random() * (canvas.width - 40) + 20,
        y: Math.random() * (canvas.height - 40) + 20,
        size: 8,
      };
      valid = !isColliding(pos, walls) && Math.abs(pos.x - player.x) > 50 && Math.abs(pos.y - player.y) > 50;
      attempts++;
    }
    if (valid) tuna.push(pos);
  }
  updateUI();
}

function generateObstacles() {
  obstacles = [];
  for (let i = 0; i < gameState.level + 1; i++) {
    obstacles.push({
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 50,
      size: 15,
      dx: (Math.random() - 0.5) * 2,
      dy: (Math.random() - 0.5) * 2,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    });
  }
}

function isColliding(obj, wallArray) {
  return wallArray.some(w => obj.x < w.x + w.width && obj.x + obj.size > w.x && obj.y < w.y + w.height && obj.y + obj.size > w.y);
}

function update() {
  if (!gameState.gameRunning || gameState.paused) return;

  let newX = player.x + player.dx;
  let newY = player.y + player.dy;
  if (!isColliding({ x: newX, y: player.y, size: player.size }, walls)) player.x = newX;
  if (!isColliding({ x: player.x, y: newY, size: player.size }, walls)) player.y = newY;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  obstacles.forEach(o => {
    o.x += o.dx;
    o.y += o.dy;
    if (o.x <= 0 || o.x >= canvas.width - o.size) o.dx *= -1;
    if (o.y <= 0 || o.y >= canvas.height - o.size) o.dy *= -1;
    if (Math.abs(player.x - o.x) < (player.size + o.size) / 2 && Math.abs(player.y - o.y) < (player.size + o.size) / 2) {
      hitSound.play();
      gameState.lives--;
      if (gameState.lives <= 0) return gameOver();
      player.x = 50;
      player.y = 50;
    }
  });

  tuna = tuna.filter(fish => {
    if (Math.abs(player.x - fish.x) < (player.size + fish.size) / 2 && Math.abs(player.y - fish.y) < (player.size + fish.size) / 2) {
      gameState.score += 10;
      collectSound.play();
      updateUI();
      return false;
    }
    return true;
  });

  if (tuna.length === 0) {
    gameState.level++;
    gameState.score += 100;
    generateTuna();
    generateObstacles();
    player.x = 50;
    player.y = 50;
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0066cc';
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.width, w.height));

  tuna.forEach(f => {
    ctx.fillStyle = '#ff9500';
    ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(f.x - f.size / 4, f.y - f.size / 4, f.size / 2, f.size / 2);
  });

  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = o.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  if (imageLoaded) {
    ctx.drawImage(catImage, player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
  } else {
    ctx.fillStyle = '#ccc';
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
  }

  ctx.fillStyle = '#ff0000';
  ctx.font = '16px Arial';
  ctx.fillText(`Lives: ${'♥'.repeat(gameState.lives)}`, 10, 30);
}

function updateUI() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('tunaCount').textContent = tuna.length;
  document.getElementById('level').textContent = gameState.level;
}

function gameOver() {
  gameState.gameRunning = false;
  document.getElementById('finalScore').textContent = gameState.score;
  document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
  gameState = { score: 0, level: 1, lives: 3, gameRunning: true, paused: false };
  player = { x: 50, y: 50, size: 40, speed: 3, dx: 0, dy: 0 };
  seconds = 0;
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('pauseButton').textContent = 'Pause';
  generateTuna();
  generateObstacles();
  updateUI();
  if (!timerInterval) startTimer();
}

function togglePause() {
  gameState.paused = !gameState.paused;
  document.getElementById('pauseButton').textContent = gameState.paused ? 'Resume' : 'Pause';
}

function toggleMusic() {
  if (musicOn) {
    music.pause();
    document.getElementById('musicToggle').textContent = 'Music: Off';
  } else {
    music.play();
    document.getElementById('musicToggle').textContent = 'Music: On';
  }
  musicOn = !musicOn;
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (!gameState.paused && gameState.gameRunning) {
      seconds++;
      document.getElementById('time').textContent = seconds;
    }
  }, 1000);
}

document.addEventListener('keydown', e => {
  if (!gameState.gameRunning || gameState.paused) return;
  switch (e.key.toLowerCase()) {
    case 'w': case 'arrowup': player.dx = 0; player.dy = -player.speed; break;
    case 's': case 'arrowdown': player.dx = 0; player.dy = player.speed; break;
    case 'a': case 'arrowleft': player.dx = -player.speed; player.dy = 0; break;
    case 'd': case 'arrowright': player.dx = player.speed; player.dy = 0; break;
  }
});

document.addEventListener('keyup', e => {
  if (["w", "s", "arrowup", "arrowdown"].includes(e.key.toLowerCase())) player.dy = 0;
  if (["a", "d", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) player.dx = 0;
});

document.addEventListener('touchstart', e => {
  const touch = e.changedTouches[0];
  player.startX = touch.screenX;
  player.startY = touch.screenY;
});

document.addEventListener('touchend', e => {
  const touch = e.changedTouches[0];
  const dx = touch.screenX - player.startX;
  const dy = touch.screenY - player.startY;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
});

function move(dir) {
  if (!gameState.gameRunning || gameState.paused) return;
  switch (dir) {
    case 'up': player.dx = 0; player.dy = -player.speed; break;
    case 'down': player.dx = 0; player.dy = player.speed; break;
    case 'left': player.dx = -player.speed; player.dy = 0; break;
    case 'right': player.dx = player.speed; player.dy = 0; break;
  }
}

function initGame() {
  generateTuna();
  generateObstacles();
  updateUI();
  gameLoop();
  startTimer();
}

// Start the game
window.onload = initGame;
