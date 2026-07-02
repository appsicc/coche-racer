const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#bestScore");
const restartButton = document.querySelector("#restartButton");
const pauseButton = document.querySelector("#pauseButton");
const leftButton = document.querySelector("#leftButton");
const rightButton = document.querySelector("#rightButton");

const laneCount = 3;
const laneWidth = canvas.width / laneCount;
const carWidth = 56;
const carHeight = 92;
const playerY = canvas.height - carHeight - 30;

let playerLane = 1;
let targetX = laneCenter(playerLane) - carWidth / 2;
let obstacles = [];
let roadOffset = 0;
let spawnTimer = 0;
let score = 0;
let speed = 4.2;
let gameOver = false;
let paused = false;
let lastFrame = 0;
let bestScore = Number(localStorage.getItem("coche-racer-best") || 0);

bestScoreEl.textContent = bestScore;

function laneCenter(lane) {
  return lane * laneWidth + laneWidth / 2;
}

function resetGame() {
  playerLane = 1;
  targetX = laneCenter(playerLane) - carWidth / 2;
  obstacles = [];
  roadOffset = 0;
  spawnTimer = 0;
  score = 0;
  speed = 4.2;
  gameOver = false;
  paused = false;
  pauseButton.textContent = "Pausa";
  scoreEl.textContent = "0";
  lastFrame = performance.now();
}

function movePlayer(direction) {
  if (gameOver) {
    resetGame();
    return;
  }

  playerLane = Math.max(0, Math.min(laneCount - 1, playerLane + direction));
  targetX = laneCenter(playerLane) - carWidth / 2;
}

function spawnObstacle() {
  const colors = ["#ff5c7a", "#ffd166", "#5cc8ff"];
  const lane = Math.floor(Math.random() * laneCount);
  obstacles.push({
    lane,
    x: laneCenter(lane) - carWidth / 2,
    y: -carHeight,
    width: carWidth,
    height: carHeight,
    color: colors[Math.floor(Math.random() * colors.length)]
  });
}

function rectanglesTouch(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update(delta) {
  if (paused || gameOver) {
    return;
  }

  const frameScale = delta / 16.67;
  roadOffset = (roadOffset + speed * frameScale) % 80;
  spawnTimer -= delta;
  score += Math.round(frameScale);
  speed = Math.min(9.8, 4.2 + score / 900);
  scoreEl.textContent = score;

  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(430, 980 - score * 0.55);
  }

  for (const obstacle of obstacles) {
    obstacle.y += speed * frameScale;
  }

  obstacles = obstacles.filter((obstacle) => obstacle.y < canvas.height + 120);

  const player = {
    x: targetX,
    y: playerY,
    width: carWidth,
    height: carHeight
  };

  if (obstacles.some((obstacle) => rectanglesTouch(player, obstacle))) {
    gameOver = true;
    bestScore = Math.max(bestScore, score);
    localStorage.setItem("coche-racer-best", String(bestScore));
    bestScoreEl.textContent = bestScore;
  }
}

function drawRoad() {
  ctx.fillStyle = "#2a2f3b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(10, 0, 8, canvas.height);
  ctx.fillRect(canvas.width - 18, 0, 8, canvas.height);

  ctx.strokeStyle = "rgba(238, 242, 255, 0.76)";
  ctx.lineWidth = 6;
  ctx.setLineDash([34, 46]);
  ctx.lineDashOffset = -roadOffset;

  for (let lane = 1; lane < laneCount; lane += 1) {
    const x = lane * laneWidth;
    ctx.beginPath();
    ctx.moveTo(x, -90);
    ctx.lineTo(x, canvas.height + 90);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawCar(x, y, color, isPlayer = false) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, carWidth, carHeight, 12);
  ctx.fill();

  ctx.fillStyle = isPlayer ? "#dfffea" : "#202633";
  ctx.beginPath();
  ctx.roundRect(x + 12, y + 14, carWidth - 24, 24, 7);
  ctx.fill();

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(x + 7, y + 16, 8, 18);
  ctx.fillRect(x + carWidth - 15, y + 16, 8, 18);
  ctx.fillRect(x + 7, y + carHeight - 34, 8, 18);
  ctx.fillRect(x + carWidth - 15, y + carHeight - 34, 8, 18);

  ctx.fillStyle = isPlayer ? "#ffffff" : "#ffe9ef";
  ctx.fillRect(x + 11, y + 4, 10, 7);
  ctx.fillRect(x + carWidth - 21, y + 4, 10, 7);
}

function drawMessage(title, subtitle) {
  ctx.fillStyle = "rgba(17, 19, 24, 0.74)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f7f8fb";
  ctx.font = "700 38px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 16);
  ctx.fillStyle = "#aab2c3";
  ctx.font = "18px Arial";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 22);
  ctx.textAlign = "left";
}

function draw() {
  drawRoad();

  for (const obstacle of obstacles) {
    drawCar(obstacle.x, obstacle.y, obstacle.color);
  }

  drawCar(targetX, playerY, "#39d98a", true);

  if (paused) {
    drawMessage("Pausa", "Pulsa Pausa para seguir");
  }

  if (gameOver) {
    drawMessage("Fin de carrera", "Pulsa Reiniciar o mueve el coche");
  }
}

function loop(now) {
  const delta = Math.min(42, now - lastFrame);
  lastFrame = now;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    movePlayer(-1);
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    movePlayer(1);
  }

  if (event.key === " " || event.key.toLowerCase() === "p") {
    paused = !paused;
    pauseButton.textContent = paused ? "Seguir" : "Pausa";
  }
});

leftButton.addEventListener("click", () => movePlayer(-1));
rightButton.addEventListener("click", () => movePlayer(1));
restartButton.addEventListener("click", resetGame);
pauseButton.addEventListener("click", () => {
  if (gameOver) {
    resetGame();
    return;
  }

  paused = !paused;
  pauseButton.textContent = paused ? "Seguir" : "Pausa";
});

resetGame();
requestAnimationFrame(loop);
