const canvas = document.querySelector("[data-platform-canvas]");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const scoreNode = document.querySelector("[data-platform-score]");
const bestNode = document.querySelector("[data-platform-best]");
const attackNode = document.querySelector("[data-platform-attack]");
const statusNode = document.querySelector("[data-platform-status]");
const overlay = document.querySelector("[data-platform-overlay]");
const overlayKicker = document.querySelector("[data-platform-kicker]");
const overlayTitle = document.querySelector("[data-platform-title]");
const overlayHelp = document.querySelector("[data-platform-help]");
const strip = document.querySelector("[data-platform-strip]");
const playButton = document.querySelector("[data-platform-play]");
const selectButton = document.querySelector("[data-platform-select]");
const retryButton = document.querySelector("[data-platform-retry]");
const changeButton = document.querySelector("[data-platform-change]");

const characters = [
  {
    name: "Neko Runner",
    src: "assets/characters/character-1.gif",
    frames: 6,
    frameBase: "assets/characters/frames/character-1/frame-"
  },
  {
    name: "Forest Shinobi",
    src: "assets/characters/character-2.gif",
    frames: 6,
    frameBase: "assets/characters/frames/character-2/frame-"
  },
  {
    name: "Orange Ninja",
    src: "assets/characters/character-3.gif",
    frames: 6,
    frameBase: "assets/characters/frames/character-3/frame-"
  }
];

const obstacleTypes = [
  {
    src: "assets/obstacles/rock.svg",
    width: 62,
    height: 48,
    yOffset: 0,
    hitbox: { x: 9, y: 10, width: 44, height: 32 }
  },
  {
    src: "assets/obstacles/training-log.svg",
    width: 48,
    height: 76,
    yOffset: 0,
    hitbox: { x: 12, y: 8, width: 24, height: 64 }
  },
  {
    src: "assets/obstacles/crow.svg",
    width: 78,
    height: 48,
    yOffset: 140,
    hitbox: { x: 14, y: 18, width: 50, height: 22 }
  }
];

const attackTypes = [
  {
    src: "assets/attacks/sword-slash.svg",
    width: 146,
    height: 64,
    yOffset: 24,
    duration: 300,
    speed: 7.8,
    hitbox: { x: -10, y: 6, width: 140, height: 52 }
  },
  {
    src: "assets/attacks/water-pixel.svg",
    width: 184,
    height: 78,
    yOffset: 12,
    duration: 460,
    speed: 13.6,
    hitbox: { x: -8, y: 8, width: 166, height: 60 }
  },
  {
    src: "assets/attacks/lightning-pixel.svg",
    width: 164,
    height: 66,
    yOffset: 20,
    duration: 340,
    speed: 10.8,
    hitbox: { x: -10, y: 6, width: 156, height: 54 }
  }
];

const cloudImage = loadImage("assets/scenery/cloud.svg");
const groundImage = loadImage("assets/scenery/ground.svg");
const characterFrames = characters.map((character) => (
  Array.from({ length: character.frames }, (_, index) => (
    loadImage(`${character.frameBase}${String(index).padStart(2, "0")}.png`)
  ))
));
const obstacleImages = obstacleTypes.map((obstacle) => loadImage(obstacle.src));
const attackImages = attackTypes.map((attack) => loadImage(attack.src));

const storageKey = "platform-runner-best-v1";
const groundY = 330;
const gravity = 0.44;
const jumpVelocity = -13.2;
const maxFallSpeed = 12.4;
const runFrameMs = 82;
const attackCooldownMs = 1000;
const sceneLength = 17000;
const sceneTransition = 3600;

const scenes = [
  {
    name: "forest",
    sky: ["#080b18", "#11192f", "#061009"],
    grass: "#203d22",
    grassDark: "#102317",
    path: "#664325",
    pathLight: "#9a6a38",
    treeNear: "rgba(7, 22, 15, 0.88)",
    treeFar: "rgba(6, 13, 18, 0.72)",
    accent: "rgba(203, 166, 255, 0.22)"
  },
  {
    name: "mountain-up",
    sky: ["#0a1022", "#172446", "#0a130f"],
    grass: "#27391f",
    grassDark: "#172211",
    path: "#6a5234",
    pathLight: "#b18b58",
    treeNear: "rgba(11, 25, 18, 0.78)",
    treeFar: "rgba(9, 13, 22, 0.82)",
    accent: "rgba(188, 214, 255, 0.18)"
  },
  {
    name: "river",
    sky: ["#071526", "#102f45", "#06130f"],
    grass: "#1f4429",
    grassDark: "#0d2516",
    path: "#5b4127",
    pathLight: "#9a7444",
    treeNear: "rgba(8, 30, 24, 0.82)",
    treeFar: "rgba(5, 18, 24, 0.76)",
    accent: "rgba(92, 213, 255, 0.22)"
  },
  {
    name: "city",
    sky: ["#100c18", "#231a31", "#0b0710"],
    grass: "#2c2d21",
    grassDark: "#171811",
    path: "#5a4638",
    pathLight: "#b99068",
    treeNear: "rgba(28, 15, 20, 0.78)",
    treeFar: "rgba(12, 8, 14, 0.76)",
    accent: "rgba(255, 181, 100, 0.20)"
  },
  {
    name: "mountain-down",
    sky: ["#0b1224", "#18243e", "#07110c"],
    grass: "#223b21",
    grassDark: "#102416",
    path: "#60472e",
    pathLight: "#aa8153",
    treeNear: "rgba(8, 24, 16, 0.86)",
    treeFar: "rgba(5, 14, 18, 0.78)",
    accent: "rgba(203, 166, 255, 0.18)"
  }
];

let selectedIndex = 0;
let state = "home";
let lastTime = 0;
let spawnTimer = 0;
let distance = 0;
let speed = 5.2;
let score = 0;
let bonusScore = 0;
let best = Number(localStorage.getItem(storageKey) || 0);
let obstacles = [];
let attacks = [];
let impacts = [];
let fragments = [];
let clouds = [];
let player;
let animationFrame = 0;
let runAnimTime = 0;
let lastAttackAt = -attackCooldownMs;
const keys = {
  left: false,
  right: false
};

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function resetPlayer() {
  player = {
    x: 104,
    y: groundY - 104,
    width: 76,
    height: 104,
    velocityY: 0,
    onGround: true
  };
}

function resetRun() {
  resetPlayer();
  keys.left = false;
  keys.right = false;
  obstacles = [];
  attacks = [];
  impacts = [];
  fragments = [];
  clouds = [
    { x: 120, y: 64, size: 0.68, speed: 0.24 },
    { x: 480, y: 92, size: 0.54, speed: 0.18 },
    { x: 790, y: 50, size: 0.76, speed: 0.28 }
  ];
  spawnTimer = 1080;
  distance = 0;
  speed = 5.2;
  score = 0;
  bonusScore = 0;
  lastTime = 0;
  runAnimTime = 0;
  lastAttackAt = -attackCooldownMs;
  scoreNode.textContent = "0";
  bestNode.textContent = String(best);
  updateAttackStatus(0);
}

function currentScore() {
  return Math.floor(distance / 82) + bonusScore;
}

function updateAttackStatus(timeNow) {
  if (!attackNode) return;
  if (state !== "playing") {
    attackNode.textContent = "Ataque: pronto";
    return;
  }

  const left = Math.max(0, attackCooldownMs - (timeNow - lastAttackAt));
  attackNode.textContent = left > 0
    ? `Ataque: ${(left / 1000).toFixed(1)}s`
    : "Ataque: pronto";
}

function setButtons(mode) {
  playButton.hidden = mode !== "home";
  selectButton.hidden = mode !== "home";
  retryButton.hidden = mode !== "gameover";
  changeButton.hidden = mode !== "gameover";
}

function setOverlay(kicker, title, help, visible = true) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayHelp.textContent = help;
  overlay.hidden = !visible;
}

function setState(nextState) {
  state = nextState;
  statusNode.textContent = {
    home: "Pronto",
    select: "Selecionando",
    playing: "Jogando",
    gameover: "Fim de jogo"
  }[state];

  if (state === "home") {
    setButtons("home");
    setOverlay("Corrida infinita", "Play Game", "Clique em Play Game ou Select Character para começar.");
  } else if (state === "select") {
    setButtons("select");
    setOverlay("Select Character", characters[selectedIndex].name, "A: próximo | D: anterior | Enter: jogar");
  } else if (state === "playing") {
    setButtons("playing");
    setOverlay("", "", "", false);
  } else if (state === "gameover") {
    setButtons("gameover");
    setOverlay("Fim de jogo", `${score} pontos`, "Tente novamente ou escolha outro personagem.");
  }

  updateAttackStatus(performance.now());
  renderCharacterStrip();
}

function renderCharacterStrip() {
  strip.innerHTML = "";
  characters.forEach((character, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `platform-character${index === selectedIndex ? " is-selected" : ""}`;
    button.setAttribute("aria-label", `Selecionar ${character.name}`);
    button.innerHTML = `<img src="${character.src}" alt=""><span>${character.name}</span>`;
    button.addEventListener("click", () => {
      selectedIndex = index;
      startGame();
    });
    strip.appendChild(button);
  });
}

function selectNext() {
  selectedIndex = (selectedIndex + 1) % characters.length;
  setState("select");
}

function selectPrevious() {
  selectedIndex = (selectedIndex - 1 + characters.length) % characters.length;
  setState("select");
}

function jump() {
  if (state !== "playing" || !player.onGround) return;
  player.velocityY = jumpVelocity;
  player.onGround = false;
}

function useAttack() {
  if (state !== "playing") return;

  const timeNow = performance.now();
  if (timeNow - lastAttackAt < attackCooldownMs) return;

  const type = attackTypes[selectedIndex];
  const target = findAttackTarget(type);
  const defaultY = player.y + type.yOffset;
  const y = target ? getTargetedAttackY(type, target) : defaultY;

  attacks.push({
    typeIndex: selectedIndex,
    x: player.x + player.width - 22,
    y,
    width: type.width,
    height: type.height,
    age: 0,
    spent: false
  });
  lastAttackAt = timeNow;
  updateAttackStatus(timeNow);
}

function startGame() {
  resetRun();
  setState("playing");
}

function endGame() {
  state = "gameover";
  keys.left = false;
  keys.right = false;
  best = Math.max(best, score);
  localStorage.setItem(storageKey, String(best));
  bestNode.textContent = String(best);
  setState("gameover");
}

function spawnObstacle() {
  const typeIndex = Math.floor(Math.random() * obstacleTypes.length);
  const type = obstacleTypes[typeIndex];
  obstacles.push({
    typeIndex,
    x: canvas.width + 20,
    y: groundY - type.height - type.yOffset,
    width: type.width,
    height: type.height,
    phase: Math.random() * Math.PI * 2,
    floatY: 0
  });

  const minGap = Math.max(700 - speed * 20, 430);
  const randomGap = 300 + Math.random() * 330;
  spawnTimer = minGap + randomGap;
}

function updateClouds(delta) {
  clouds.forEach((cloud) => {
    cloud.x -= cloud.speed * delta * 0.06;
    if (cloud.x < -180) {
      cloud.x = canvas.width + Math.random() * 260;
      cloud.y = 42 + Math.random() * 86;
      cloud.size = 0.48 + Math.random() * 0.35;
    }
  });
}

function getObstacleBox(obstacle) {
  const box = obstacleTypes[obstacle.typeIndex].hitbox;
  return {
    x: obstacle.x + box.x,
    y: obstacle.y + (obstacle.floatY || 0) + box.y,
    width: box.width,
    height: box.height
  };
}

function getAttackBox(attack) {
  const box = attackTypes[attack.typeIndex].hitbox;
  return {
    x: attack.x + box.x,
    y: attack.y + box.y,
    width: box.width,
    height: box.height
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function findAttackTarget(type) {
  const attackStartX = player.x + player.width - 22;
  const maxX = attackStartX + type.width + 92;
  const playerCenterY = player.y + player.height * 0.5;
  const verticalReach = player.onGround ? 108 : 188;

  return obstacles
    .map((obstacle) => ({ obstacle, box: getObstacleBox(obstacle) }))
    .filter(({ box }) => (
      box.x + box.width >= attackStartX - 26 &&
      box.x <= maxX &&
      Math.abs((box.y + box.height * 0.5) - playerCenterY) <= verticalReach
    ))
    .sort((a, b) => a.box.x - b.box.x)[0]?.obstacle || null;
}

function getTargetedAttackY(type, target) {
  const box = getObstacleBox(target);
  const targetY = box.y + box.height * 0.5 - type.height * 0.5;
  const minY = player.y - type.height * 0.62;
  const maxY = player.y + player.height - type.height * 0.18;
  return clamp(targetY, minY, maxY);
}

function updatePlayerHorizontal(delta) {
  const input = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const targetX = input > 0 ? 170 : input < 0 ? 76 : 116;
  const responsiveness = input === 0 ? 0.010 : 0.018;
  player.x += (targetX - player.x) * Math.min(1, delta * responsiveness);
  player.x = clamp(player.x, 68, 184);
}

function spawnImpact(hit, attackTypeIndex) {
  const x = hit.x + hit.width * 0.5;
  const y = hit.y + (hit.floatY || 0) + hit.height * 0.5;
  impacts.push({
    typeIndex: attackTypeIndex,
    x,
    y,
    age: 0,
    duration: 330
  });

  const palettes = [
    ["#f7fbff", "#9ceaff", "#d9f7ff"],
    ["#7ee7ff", "#1d9df2", "#d8fbff"],
    ["#fff7b8", "#ffd000", "#ff8f00"]
  ];
  const debris = [
    ["#8f97a8", "#555d70", "#252b39"],
    ["#8b5931", "#4b2d1f", "#e0c58b"],
    ["#0b0d15", "#b8e4ff", "#ffe8a0"]
  ];
  const colors = [...(palettes[attackTypeIndex] || palettes[0]), ...(debris[hit.typeIndex] || debris[0])];

  for (let i = 0; i < 15; i += 1) {
    const angle = (Math.PI * 2 / 15) * i + Math.random() * 0.45;
    const force = 2.6 + Math.random() * 3.5;
    fragments.push({
      x,
      y,
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force - 1.4,
      size: 3 + Math.random() * 5,
      age: 0,
      duration: 360 + Math.random() * 220,
      color: colors[i % colors.length]
    });
  }
}

function updateAttacks(delta) {
  attacks.forEach((attack) => {
    const type = attackTypes[attack.typeIndex];
    attack.age += delta;
    if (!attack.spent) {
      attack.x += type.speed * delta * 0.06;
    }
  });

  for (const attack of attacks) {
    if (attack.spent) continue;

    const attackBox = getAttackBox(attack);
    const hitIndex = obstacles.findIndex((obstacle) => (
      obstacle.x + obstacle.width > player.x - 8 && intersects(attackBox, getObstacleBox(obstacle))
    ));

    if (hitIndex !== -1) {
      const hit = obstacles.splice(hitIndex, 1)[0];
      attack.spent = true;
      attack.age = Math.max(attack.age, attackTypes[attack.typeIndex].duration * 0.48);
      spawnImpact(hit, attack.typeIndex);
      bonusScore += 12;
      break;
    }
  }

  attacks = attacks.filter((attack) => attack.age <= attackTypes[attack.typeIndex].duration);
  impacts.forEach((impact) => {
    impact.age += delta;
  });
  impacts = impacts.filter((impact) => impact.age <= impact.duration);
  fragments.forEach((fragment) => {
    fragment.age += delta;
    fragment.x += fragment.vx * delta * 0.06;
    fragment.y += fragment.vy * delta * 0.06;
    fragment.vy += 0.12 * delta * 0.06;
  });
  fragments = fragments.filter((fragment) => fragment.age <= fragment.duration);
}

function updatePlaying(delta, timeNow) {
  const forwardBoost = keys.right ? 0.18 : 0;
  const backwardControl = keys.left ? 0.08 : 0;
  distance += delta * (1 + forwardBoost - backwardControl);
  runAnimTime += delta;
  speed = Math.min(12.2, 5.2 + distance / 17000 + forwardBoost * 2.4 - backwardControl * 1.5);
  score = currentScore();
  scoreNode.textContent = String(score);

  updatePlayerHorizontal(delta);

  player.velocityY = Math.min(player.velocityY + gravity, maxFallSpeed);
  player.y += player.velocityY;
  if (player.y >= groundY - player.height) {
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.onGround = true;
  }

  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    spawnObstacle();
  }

  obstacles.forEach((obstacle) => {
    obstacle.x -= speed * delta * 0.06;
    obstacle.floatY = obstacle.typeIndex === 2
      ? Math.sin(distance * 0.018 + obstacle.phase) * 5
      : 0;
  });
  obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);

  updateAttacks(delta);
  updateClouds(delta);

  const playerBox = {
    x: player.x + 22,
    y: player.y + 18,
    width: player.width - 42,
    height: player.height - 24
  };

  if (obstacles.some((obstacle) => intersects(playerBox, getObstacleBox(obstacle)))) {
    endGame();
    return;
  }

  score = currentScore();
  scoreNode.textContent = String(score);
  updateAttackStatus(timeNow);
}

function intersects(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

function smoothstep(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function getSceneState() {
  const scenePosition = distance % (sceneLength * scenes.length);
  const rawIndex = Math.floor(scenePosition / sceneLength);
  const local = scenePosition - rawIndex * sceneLength;
  const blend = smoothstep((local - (sceneLength - sceneTransition)) / sceneTransition);

  return {
    current: rawIndex,
    next: (rawIndex + 1) % scenes.length,
    blend,
    local
  };
}

function drawStars(alpha) {
  ctx.fillStyle = `rgba(255, 255, 255, ${0.06 * alpha})`;
  for (let i = 0; i < 42; i += 1) {
    const x = (i * 83 + Math.floor(distance * 0.012)) % canvas.width;
    const y = 22 + (i * 41) % 135;
    ctx.fillRect(x, y, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
  }
}

function drawMoon(scene, alpha) {
  const x = scene.name === "city" ? 760 : 820;
  const y = scene.name === "mountain-up" ? 62 : 72;
  ctx.fillStyle = `rgba(190, 166, 255, ${0.14 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(232, 213, 255, ${0.45 * alpha})`;
  ctx.beginPath();
  ctx.arc(x + 18, y - 10, 30, 0, Math.PI * 2);
  ctx.fill();
}

function drawMountainRange(alpha, direction = 1) {
  ctx.fillStyle = `rgba(7, 10, 18, ${0.52 * alpha})`;
  ctx.beginPath();
  ctx.moveTo(0, 272);
  for (let x = 0; x <= canvas.width + 160; x += 96) {
    const peak = 94 + ((x / 96) % 3) * 22;
    ctx.lineTo(x + 44, peak + direction * 10);
    ctx.lineTo(x + 96, 272);
  }
  ctx.lineTo(canvas.width, 330);
  ctx.lineTo(0, 330);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(204, 216, 234, ${0.18 * alpha})`;
  for (let x = -60; x < canvas.width + 120; x += 138) {
    ctx.beginPath();
    ctx.moveTo(x + 86, 105 + direction * 8);
    ctx.lineTo(x + 106, 144);
    ctx.lineTo(x + 66, 144);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCity(alpha) {
  const offset = -((distance * 0.06) % 180);
  ctx.fillStyle = `rgba(15, 8, 12, ${0.76 * alpha})`;
  for (let x = offset - 180; x < canvas.width + 220; x += 180) {
    ctx.fillRect(x + 20, 176, 118, 94);
    ctx.beginPath();
    ctx.moveTo(x, 176);
    ctx.lineTo(x + 80, 128);
    ctx.lineTo(x + 160, 176);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(255, 177, 80, ${0.58 * alpha})`;
    ctx.fillRect(x + 50, 204, 14, 18);
    ctx.fillRect(x + 94, 204, 14, 18);
    ctx.fillRect(x + 72, 238, 18, 28);
    ctx.fillStyle = `rgba(15, 8, 12, ${0.76 * alpha})`;
  }

  ctx.fillStyle = `rgba(255, 115, 87, ${0.72 * alpha})`;
  for (let x = 40 - ((distance * 0.08) % 160); x < canvas.width + 160; x += 160) {
    ctx.fillRect(x, 132, 18, 24);
    ctx.fillRect(x + 4, 156, 10, 22);
  }
}

function drawRiver(alpha) {
  const wave = Math.sin(distance * 0.012) * 8;
  ctx.fillStyle = `rgba(24, 142, 190, ${0.78 * alpha})`;
  ctx.beginPath();
  ctx.moveTo(0, 255 + wave);
  ctx.bezierCurveTo(240, 218, 338, 302, 544, 260);
  ctx.bezierCurveTo(725, 224, 818, 284, 960, 246);
  ctx.lineTo(960, 314);
  ctx.bezierCurveTo(710, 345, 480, 292, 235, 330);
  ctx.bezierCurveTo(102, 350, 42, 320, 0, 338);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(203, 247, 255, ${0.48 * alpha})`;
  for (let x = -80 + ((distance * 0.18) % 140); x < canvas.width + 120; x += 140) {
    ctx.fillRect(x, 276 + Math.sin(x) * 8, 58, 4);
    ctx.fillRect(x + 70, 296 + Math.cos(x) * 8, 38, 3);
  }
}

function drawTrees(scene, alpha) {
  const layers = [
    { y: 248, height: 118, gap: 92, speed: 0.08, color: scene.treeFar },
    { y: 288, height: 96, gap: 74, speed: 0.14, color: scene.treeNear }
  ];

  layers.forEach((layer) => {
    const offset = -((distance * layer.speed) % layer.gap);
    ctx.fillStyle = layer.color.replace(/[\d.]+\)$/u, `${alpha})`);
    for (let x = offset - layer.gap; x < canvas.width + layer.gap; x += layer.gap) {
      const trunkX = x + layer.gap * 0.42;
      const trunkW = 10;
      ctx.fillRect(trunkX, layer.y - layer.height * 0.42, trunkW, layer.height * 0.6);

      ctx.beginPath();
      ctx.moveTo(x, layer.y);
      ctx.lineTo(x + layer.gap * 0.48, layer.y - layer.height);
      ctx.lineTo(x + layer.gap, layer.y);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + 8, layer.y - layer.height * 0.28);
      ctx.lineTo(x + layer.gap * 0.48, layer.y - layer.height * 1.12);
      ctx.lineTo(x + layer.gap - 8, layer.y - layer.height * 0.28);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function drawPetals(scene, alpha) {
  ctx.fillStyle = scene.accent.replace(/[\d.]+\)$/u, `${alpha * 0.85})`);
  for (let i = 0; i < 24; i += 1) {
    const x = canvas.width - ((distance * 0.035 + i * 57) % (canvas.width + 120));
    const y = 42 + ((i * 29 + distance * 0.018) % 170);
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 2.5, 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(scene, alpha, sceneIndex) {
  const incline = scene.name === "mountain-up" ? -18 : scene.name === "mountain-down" ? 16 : 0;
  ctx.fillStyle = scene.grass;
  ctx.fillRect(0, groundY - 12, canvas.width, canvas.height - groundY + 12);

  ctx.fillStyle = scene.grassDark;
  ctx.fillRect(0, groundY + 54, canvas.width, 40);

  if (scene.name === "river") {
    drawRiver(alpha);
  }

  const pathOffset = -((distance * 0.22) % 120);
  ctx.fillStyle = scene.path;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 18 + incline);
  ctx.bezierCurveTo(240, groundY + 40 + incline, 420, groundY - 2 - incline * 0.4, 960, groundY + 12 - incline);
  ctx.lineTo(960, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = scene.pathLight;
  for (let x = pathOffset - 120; x < canvas.width + 120; x += 120) {
    ctx.fillRect(x, groundY + 32 + ((x / 120 + sceneIndex) % 2) * 12, 44, 5);
    ctx.fillRect(x + 72, groundY + 58, 28, 4);
  }

  ctx.fillStyle = `rgba(15, 28, 17, ${0.42 * alpha})`;
  for (let x = pathOffset - 80; x < canvas.width + 100; x += 42) {
    ctx.fillRect(x, groundY - 8, 5, 18);
    ctx.fillRect(x + 12, groundY - 2, 4, 14);
    ctx.fillRect(x + 27, groundY - 7, 4, 17);
  }
}

function drawScene(sceneIndex, alpha) {
  const scene = scenes[sceneIndex];
  ctx.save();
  ctx.globalAlpha *= alpha;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, scene.sky[0]);
  gradient.addColorStop(0.56, scene.sky[1]);
  gradient.addColorStop(1, scene.sky[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars(alpha);
  drawMoon(scene, alpha);

  if (scene.name === "mountain-up" || scene.name === "mountain-down") {
    drawMountainRange(alpha, scene.name === "mountain-up" ? 1 : -1);
    drawTrees(scene, alpha * 0.6);
  } else if (scene.name === "city") {
    drawMountainRange(alpha * 0.25, -1);
    drawCity(alpha);
  } else {
    drawTrees(scene, alpha);
  }

  drawPetals(scene, alpha);
  clouds.forEach((cloud) => {
    drawImageSafe(cloudImage, cloud.x, cloud.y, 220 * cloud.size, 90 * cloud.size);
  });
  drawGround(scene, alpha, sceneIndex);

  ctx.restore();
}

function drawBackground() {
  const state = getSceneState();
  drawScene(state.current, 1);
  if (state.blend > 0) {
    drawScene(state.next, state.blend);
  }
}

function getCharacterFrame(index, moving = true) {
  const frames = characterFrames[index] || [];
  if (!frames.length) return null;
  const frameIndex = moving ? Math.floor(runAnimTime / runFrameMs) % frames.length : 1 % frames.length;
  return frames[frameIndex];
}

function drawPlayer() {
  const image = getCharacterFrame(selectedIndex, state === "playing" && player.onGround);
  drawImageSafe(image, player.x, player.y, player.width, player.height);
}

function drawObstacles() {
  obstacles.forEach((obstacle) => {
    const image = obstacleImages[obstacle.typeIndex];
    drawImageSafe(image, obstacle.x, obstacle.y + (obstacle.floatY || 0), obstacle.width, obstacle.height);
  });
}

function drawAttacks() {
  attacks.forEach((attack) => {
    const image = attackImages[attack.typeIndex];
    const progress = attack.age / attackTypes[attack.typeIndex].duration;
    const pulse = attack.spent ? 1.08 + progress * 0.35 : 1 + Math.sin(attack.age * 0.05) * 0.04;
    const alpha = Math.max(0.18, 1 - progress * 0.86);
    const w = attack.width * pulse;
    const h = attack.height * pulse;
    ctx.globalAlpha = alpha;
    drawImageSafe(image, attack.x, attack.y - (h - attack.height) * 0.5, w, h);
    ctx.globalAlpha = 1;
  });
}

function drawImpacts() {
  impacts.forEach((impact) => {
    const progress = impact.age / impact.duration;
    const radius = 12 + progress * 42;
    const alpha = Math.max(0, 1 - progress);
    const colors = [
      `rgba(245, 251, 255, ${alpha})`,
      `rgba(118, 222, 255, ${alpha})`,
      `rgba(255, 220, 64, ${alpha})`
    ];

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colors[impact.typeIndex] || colors[0];
    ctx.lineWidth = 5 - progress * 3;
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3 - progress * 2;
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, radius * 0.52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = colors[impact.typeIndex] || colors[0];
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 / 8) * i + progress * 1.6;
      const x = impact.x + Math.cos(angle) * radius * 0.8;
      const y = impact.y + Math.sin(angle) * radius * 0.56;
      ctx.fillRect(x - 3, y - 3, 6, 6);
    }
    ctx.restore();
  });
}

function drawFragments() {
  fragments.forEach((fragment) => {
    const progress = fragment.age / fragment.duration;
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.fillStyle = fragment.color;
    ctx.fillRect(fragment.x - fragment.size / 2, fragment.y - fragment.size / 2, fragment.size, fragment.size);
    ctx.globalAlpha = 1;
  });
}

function drawSelection() {
  drawBackground();
  resetPlayer();
  drawPlayer();
  ctx.fillStyle = "rgba(5, 7, 13, 0.62)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  characters.forEach((character, index) => {
    const centerX = canvas.width / 2 + (index - selectedIndex) * 190;
    const scale = index === selectedIndex ? 1 : 0.72;
    const w = 96 * scale;
    const h = 122 * scale;
    const frames = characterFrames[index] || [];
    const frame = frames[Math.floor(Date.now() / 130) % frames.length];
    ctx.globalAlpha = index === selectedIndex ? 1 : 0.36;
    drawImageSafe(frame, centerX - w / 2, 170 - h / 2, w, h);
    ctx.globalAlpha = 1;
  });
}

function drawImageSafe(image, x, y, width, height) {
  if (image && image.complete && image.naturalWidth) {
    ctx.drawImage(image, x, y, width, height);
  }
}

function drawFrame() {
  if (state === "select") {
    drawSelection();
    return;
  }

  drawBackground();
  drawObstacles();
  drawAttacks();
  drawImpacts();
  drawFragments();
  drawPlayer();

  if (state === "home") {
    ctx.fillStyle = "rgba(5, 7, 13, 0.52)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function loop(time) {
  const delta = lastTime ? Math.min(time - lastTime, 34) : 16;
  lastTime = time;
  animationFrame = requestAnimationFrame(loop);

  if (state === "playing") {
    updatePlaying(delta, time);
  } else {
    updateAttackStatus(time);
  }
  drawFrame();
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();

  if (state === "select") {
    if (key === "a" || event.key === "ArrowRight") {
      event.preventDefault();
      selectNext();
      return;
    }
    if (key === "d" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectPrevious();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      startGame();
      return;
    }
  }

  if (state === "home" && event.key === "Enter") {
    event.preventDefault();
    setState("select");
    return;
  }

  if (state === "gameover" && event.key === "Enter") {
    event.preventDefault();
    startGame();
    return;
  }

  if (state === "playing" && event.code === "Space") {
    event.preventDefault();
    useAttack();
    return;
  }

  if (state === "playing" && (key === "a" || event.key === "ArrowLeft")) {
    event.preventDefault();
    keys.left = true;
    return;
  }

  if (state === "playing" && (key === "d" || event.key === "ArrowRight")) {
    event.preventDefault();
    keys.right = true;
    return;
  }

  if (state === "playing" && (key === "w" || event.key === "ArrowUp")) {
    event.preventDefault();
    jump();
  }
}

function handleKeyup(event) {
  const key = event.key.toLowerCase();
  if (key === "a" || event.key === "ArrowLeft") {
    keys.left = false;
  }
  if (key === "d" || event.key === "ArrowRight") {
    keys.right = false;
  }
}

playButton.addEventListener("click", () => setState("select"));
selectButton.addEventListener("click", () => setState("select"));
retryButton.addEventListener("click", startGame);
changeButton.addEventListener("click", () => setState("select"));
document.addEventListener("keydown", handleKeydown);
document.addEventListener("keyup", handleKeyup);

bestNode.textContent = String(best);
resetRun();
setState("home");
animationFrame = requestAnimationFrame(loop);
