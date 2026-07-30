const canvas = document.querySelector("[data-snake]");
const ctx = canvas.getContext("2d");
const scoreNode = document.querySelector("[data-score]");
const statusNode = document.querySelector("[data-status]");
const startButton = document.querySelector("[data-start]");
const resetButton = document.querySelector("[data-reset]");
const dirButtons = document.querySelectorAll("[data-dir]");

const size = 20;
const cells = canvas.width / size;
let snake;
let food;
let direction;
let nextDirection;
let score;
let timer;

function placeFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * cells),
      y: Math.floor(Math.random() * cells)
    };
  } while (snake.some((part) => part.x === pos.x && part.y === pos.y));
  return pos;
}

function resetGame() {
  clearInterval(timer);
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  direction = { x: 1, y: 0 };
  nextDirection = direction;
  score = 0;
  food = placeFood();
  scoreNode.textContent = score;
  statusNode.textContent = "Pronto";
  draw();
}

function setDirection(dir) {
  const moves = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  const move = moves[dir];
  if (!move) return;
  if (move.x + direction.x === 0 && move.y + direction.y === 0) return;
  nextDirection = move;
}

function drawCell(pos, color) {
  ctx.fillStyle = color;
  ctx.fillRect(pos.x * size + 1, pos.y * size + 1, size - 2, size - 2);
}

function draw() {
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i <= cells; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size, 0);
    ctx.lineTo(i * size, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * size);
    ctx.lineTo(canvas.width, i * size);
    ctx.stroke();
  }

  drawCell(food, "#f59e0b");
  snake.forEach((part, index) => drawCell(part, index === 0 ? "#38bdf8" : "#22c55e"));
}

function endGame() {
  clearInterval(timer);
  timer = null;
  statusNode.textContent = "Fim de jogo";
}

function tick() {
  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const hitWall = head.x < 0 || head.y < 0 || head.x >= cells || head.y >= cells;
  const hitSelf = snake.some((part) => part.x === head.x && part.y === head.y);
  if (hitWall || hitSelf) {
    endGame();
    draw();
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreNode.textContent = score;
    food = placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function startGame() {
  if (timer) return;
  statusNode.textContent = "Jogando";
  timer = setInterval(tick, 115);
}

document.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right"
  };
  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key]);
    startGame();
  }
});

dirButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setDirection(button.dataset.dir);
    startGame();
  });
});

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);
resetGame();
