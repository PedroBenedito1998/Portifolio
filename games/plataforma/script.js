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
    width: 96,
    height: 58,
    yOffset: 140,
    hitbox: { x: 20, y: 20, width: 58, height: 24 }
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
const sceneTransition = 1000;

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
    name: "forest-bridge",
    sky: ["#08101f", "#13213a", "#06110c"],
    grass: "#25442a",
    grassDark: "#102518",
    path: "#654526",
    pathLight: "#aa7842",
    treeNear: "rgba(7, 25, 16, 0.84)",
    treeFar: "rgba(5, 16, 20, 0.70)",
    accent: "rgba(203, 166, 255, 0.20)"
  },
  {
    name: "bridge",
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
    name: "bridge-village",
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
    name: "village",
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
    name: "village-forest",
    sky: ["#0b1020", "#18213a", "#061009"],
    grass: "#243e23",
    grassDark: "#102317",
    path: "#604329",
    pathLight: "#ad8052",
    treeNear: "rgba(8, 24, 16, 0.84)",
    treeFar: "rgba(5, 14, 18, 0.76)",
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
  for (let i = 0; i < 42; i += 1) {
    const pulse = 0.045 + Math.sin(distance * 0.004 + i * 1.7) * 0.025;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse * alpha})`;
    const x = (i * 83 + Math.floor(distance * 0.012)) % canvas.width;
    const y = 22 + (i * 41) % 135;
    ctx.fillRect(x, y, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
  }
}

function drawMoon(scene, alpha) {
  const x = scene.name === "village" || scene.name === "bridge-village" ? 760 : 820;
  const y = scene.name === "forest-bridge" ? 66 : 72;
  ctx.fillStyle = `rgba(190, 166, 255, ${0.11 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(232, 213, 255, ${0.45 * alpha})`;
  ctx.beginPath();
  ctx.arc(x + 18, y - 10, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(43, 32, 76, ${0.22 * alpha})`;
  ctx.beginPath();
  ctx.arc(x + 31, y - 12, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255, 241, 209, ${0.32 * alpha})`;
  ctx.fillRect(x + 4, y + 19, 12, 3);
  ctx.fillRect(x + 22, y + 6, 8, 2);
}

function drawMountainRange(alpha, direction = 1) {
  const layers = [
    { base: 286, step: 132, peak: 112, color: `rgba(18, 22, 34, ${0.34 * alpha})`, speed: 0.018 },
    { base: 276, step: 96, peak: 94, color: `rgba(7, 10, 18, ${0.58 * alpha})`, speed: 0.032 }
  ];

  layers.forEach((layer, layerIndex) => {
    const offset = -((distance * layer.speed) % layer.step);
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, layer.base);
    for (let x = offset - layer.step; x <= canvas.width + layer.step * 2; x += layer.step) {
      const peak = layer.peak + ((x / layer.step + layerIndex) % 3) * 22;
      ctx.lineTo(x + layer.step * 0.48, peak + direction * 10);
      ctx.lineTo(x + layer.step, layer.base);
    }
    ctx.lineTo(canvas.width, 330);
    ctx.lineTo(0, 330);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(224, 233, 248, ${0.13 * alpha})`;
    for (let x = offset - 70; x < canvas.width + 170; x += layer.step * 1.35) {
      ctx.beginPath();
      ctx.moveTo(x + layer.step * 0.56, layer.peak + direction * 8);
      ctx.lineTo(x + layer.step * 0.72, layer.peak + 43);
      ctx.lineTo(x + layer.step * 0.42, layer.peak + 43);
      ctx.closePath();
      ctx.fill();
    }
  });

  ctx.fillStyle = `rgba(216, 230, 255, ${0.08 * alpha})`;
  for (let y = 180; y < 260; y += 26) {
    ctx.fillRect(-60 + ((distance * 0.025 + y * 2) % 180), y, 120, 4);
    ctx.fillRect(390 - ((distance * 0.018 + y) % 210), y + 9, 156, 3);
  }
}

function isBridgeScene(scene) {
  return scene.name === "bridge" || scene.name === "bridge-village";
}

function drawVillage(alpha) {
  const offset = -((distance * 0.07) % 220);
  const groundLine = 282;

  ctx.fillStyle = `rgba(13, 8, 15, ${0.40 * alpha})`;
  for (let x = -80 - ((distance * 0.025) % 120); x < canvas.width + 120; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, groundLine + 8);
    ctx.lineTo(x + 58, groundLine - 88);
    ctx.lineTo(x + 120, groundLine + 8);
    ctx.closePath();
    ctx.fill();
  }

  for (let x = offset - 220; x < canvas.width + 260; x += 220) {
    const baseY = groundLine + ((x / 220) % 2) * 8;
    const bodyX = x + 38;
    const bodyW = 132;
    const bodyH = 68;

    ctx.fillStyle = `rgba(22, 13, 17, ${0.86 * alpha})`;
    ctx.fillRect(bodyX, baseY - bodyH, bodyW, bodyH);

    ctx.fillStyle = `rgba(49, 29, 30, ${0.84 * alpha})`;
    ctx.beginPath();
    ctx.moveTo(bodyX - 20, baseY - bodyH + 4);
    ctx.lineTo(bodyX + bodyW * 0.5, baseY - bodyH - 48);
    ctx.lineTo(bodyX + bodyW + 20, baseY - bodyH + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(97, 48, 40, ${0.55 * alpha})`;
    for (let tileX = bodyX - 8; tileX < bodyX + bodyW + 12; tileX += 18) {
      ctx.fillRect(tileX, baseY - bodyH + 2, 13, 5);
      ctx.fillRect(tileX + 7, baseY - bodyH - 8, 13, 4);
    }

    ctx.fillStyle = `rgba(246, 176, 82, ${0.45 * alpha})`;
    ctx.fillRect(bodyX + 28, baseY - 48, 12, 17);
    ctx.fillRect(bodyX + 92, baseY - 48, 12, 17);
    ctx.fillRect(bodyX + 57, baseY - 28, 18, 28);

    ctx.fillStyle = `rgba(51, 31, 24, ${0.82 * alpha})`;
    ctx.fillRect(bodyX + 54, baseY - 28, 3, 28);
    ctx.fillRect(bodyX + 75, baseY - 28, 3, 28);

    ctx.fillStyle = `rgba(37, 20, 18, ${0.80 * alpha})`;
    ctx.fillRect(bodyX - 32, baseY - 62, 7, 62);
    ctx.fillRect(bodyX + bodyW + 25, baseY - 62, 7, 62);

    ctx.fillStyle = `rgba(255, 177, 85, ${0.65 * alpha})`;
    ctx.fillRect(bodyX - 39, baseY - 66, 21, 18);
    ctx.fillRect(bodyX + bodyW + 18, baseY - 66, 21, 18);
    ctx.fillStyle = `rgba(87, 42, 36, ${0.72 * alpha})`;
    ctx.fillRect(bodyX - 43, baseY - 70, 29, 5);
    ctx.fillRect(bodyX + bodyW + 14, baseY - 70, 29, 5);
  }

  ctx.strokeStyle = `rgba(255, 205, 120, ${0.16 * alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundLine - 8);
  ctx.lineTo(canvas.width, groundLine - 20);
  ctx.stroke();
}

function drawRiver(alpha) {
  const wave = Math.sin(distance * 0.012) * 5;
  ctx.fillStyle = `rgba(9, 54, 76, ${0.88 * alpha})`;
  ctx.beginPath();
  ctx.moveTo(0, 250 + wave);
  ctx.bezierCurveTo(190, 232, 338, 276, 514, 252);
  ctx.bezierCurveTo(682, 229, 804, 269, 960, 244);
  ctx.lineTo(960, 356);
  ctx.lineTo(0, 356);
  ctx.closePath();
  ctx.fill();

  const reflectionOffset = -((distance * 0.16) % 140);
  ctx.fillStyle = `rgba(185, 235, 255, ${0.28 * alpha})`;
  for (let x = reflectionOffset - 120; x < canvas.width + 160; x += 140) {
    ctx.fillRect(x, 272 + Math.sin(x) * 6, 62, 3);
    ctx.fillRect(x + 70, 302 + Math.cos(x) * 5, 44, 3);
    ctx.fillRect(x + 24, 330, 34, 2);
  }

  ctx.fillStyle = `rgba(14, 30, 18, ${0.86 * alpha})`;
  ctx.beginPath();
  ctx.moveTo(0, 248);
  ctx.bezierCurveTo(180, 236, 320, 262, 492, 244);
  ctx.bezierCurveTo(680, 226, 810, 246, 960, 232);
  ctx.lineTo(960, 254);
  ctx.bezierCurveTo(746, 275, 546, 255, 340, 270);
  ctx.bezierCurveTo(182, 282, 90, 260, 0, 274);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(92, 132, 78, ${0.26 * alpha})`;
  for (let x = -20 + ((distance * 0.05) % 58); x < canvas.width + 80; x += 58) {
    ctx.fillRect(x, 236 + (x % 4) * 4, 16, 5);
    ctx.fillRect(x + 27, 246, 9, 4);
  }
}

function drawWoodenBridge(alpha) {
  const deckY = groundY - 8;
  const plankOffset = -((distance * 0.28) % 78);

  ctx.fillStyle = `rgba(40, 22, 13, ${0.55 * alpha})`;
  ctx.fillRect(0, deckY - 14, canvas.width, 22);

  ctx.fillStyle = `rgba(94, 54, 28, ${0.96 * alpha})`;
  ctx.fillRect(0, deckY + 4, canvas.width, canvas.height - deckY);

  ctx.fillStyle = `rgba(152, 98, 49, ${0.86 * alpha})`;
  for (let x = plankOffset - 78; x < canvas.width + 90; x += 78) {
    ctx.fillRect(x, deckY + 5, 68, 52);
    ctx.fillStyle = `rgba(61, 35, 22, ${0.68 * alpha})`;
    ctx.fillRect(x + 62, deckY + 5, 4, 52);
    ctx.fillRect(x + 8, deckY + 22, 28, 3);
    ctx.fillRect(x + 36, deckY + 42, 20, 3);
    ctx.fillStyle = `rgba(152, 98, 49, ${0.86 * alpha})`;
  }

  ctx.fillStyle = `rgba(43, 24, 16, ${0.92 * alpha})`;
  ctx.fillRect(0, deckY - 10, canvas.width, 6);
  ctx.fillRect(0, deckY + 54, canvas.width, 7);

  ctx.fillStyle = `rgba(32, 18, 12, ${0.88 * alpha})`;
  for (let x = plankOffset - 40; x < canvas.width + 90; x += 78) {
    ctx.fillRect(x, deckY - 38, 8, 50);
    ctx.fillRect(x + 4, deckY - 42, 18, 8);
  }

  ctx.strokeStyle = `rgba(104, 65, 35, ${0.80 * alpha})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, deckY - 30);
  ctx.lineTo(canvas.width, deckY - 22);
  ctx.stroke();
}

function drawBridgeEntrance(alpha) {
  const deckY = groundY - 7;
  const plankOffset = -((distance * 0.26) % 74);

  ctx.fillStyle = `rgba(24, 50, 34, ${0.36 * alpha})`;
  ctx.fillRect(0, groundY - 18, canvas.width, 18);

  ctx.fillStyle = `rgba(33, 19, 13, ${0.76 * alpha})`;
  ctx.fillRect(0, deckY - 8, canvas.width, 9);

  ctx.fillStyle = `rgba(113, 68, 34, ${0.82 * alpha})`;
  for (let x = plankOffset - 74; x < canvas.width + 90; x += 74) {
    const lifted = (x / 74) % 2 === 0 ? 0 : 3;
    ctx.fillRect(x, deckY + 8 + lifted, 58, 36);
    ctx.fillStyle = `rgba(56, 32, 20, ${0.60 * alpha})`;
    ctx.fillRect(x + 52, deckY + 8 + lifted, 4, 36);
    ctx.fillRect(x + 8, deckY + 22 + lifted, 24, 3);
    ctx.fillStyle = `rgba(113, 68, 34, ${0.82 * alpha})`;
  }

  ctx.fillStyle = `rgba(16, 31, 20, ${0.82 * alpha})`;
  for (let x = -20 + ((distance * 0.12) % 70); x < canvas.width + 80; x += 70) {
    ctx.fillRect(x, deckY - 20, 7, 32);
    ctx.beginPath();
    ctx.moveTo(x - 12, deckY - 10);
    ctx.lineTo(x + 4, deckY - 52);
    ctx.lineTo(x + 20, deckY - 10);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBridgeVillageDetails(alpha) {
  const deckY = groundY - 8;
  const offset = -((distance * 0.25) % 142);

  ctx.fillStyle = `rgba(38, 22, 15, ${0.88 * alpha})`;
  for (let x = offset - 142; x < canvas.width + 170; x += 142) {
    ctx.fillRect(x + 20, deckY - 46, 8, 54);
    ctx.fillRect(x + 100, deckY - 42, 8, 50);

    ctx.fillStyle = `rgba(212, 111, 66, ${0.70 * alpha})`;
    ctx.fillRect(x + 12, deckY - 54, 24, 18);
    ctx.fillRect(x + 92, deckY - 50, 24, 16);
    ctx.fillStyle = `rgba(82, 39, 34, ${0.78 * alpha})`;
    ctx.fillRect(x + 9, deckY - 58, 30, 5);
    ctx.fillRect(x + 89, deckY - 54, 30, 5);

    ctx.fillStyle = `rgba(255, 192, 98, ${0.22 * alpha})`;
    ctx.fillRect(x + 10, deckY - 36, 28, 22);
    ctx.fillRect(x + 90, deckY - 32, 28, 18);
    ctx.fillStyle = `rgba(38, 22, 15, ${0.88 * alpha})`;
  }

  ctx.strokeStyle = `rgba(114, 72, 39, ${0.78 * alpha})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, deckY - 31);
  ctx.lineTo(canvas.width, deckY - 24);
  ctx.stroke();
}

function drawVillageForestDetails(alpha) {
  const offset = -((distance * 0.11) % 112);
  const groundLine = groundY + 4;

  ctx.fillStyle = `rgba(54, 31, 24, ${0.62 * alpha})`;
  for (let x = offset - 112; x < canvas.width + 130; x += 112) {
    ctx.fillRect(x + 14, groundLine - 42, 8, 46);
    ctx.fillRect(x + 62, groundLine - 38, 8, 42);
    ctx.fillRect(x + 16, groundLine - 28, 54, 6);
  }

  ctx.fillStyle = `rgba(9, 27, 16, ${0.84 * alpha})`;
  for (let x = offset - 70; x < canvas.width + 100; x += 88) {
    ctx.fillRect(x + 38, groundLine - 70, 10, 70);
    ctx.beginPath();
    ctx.moveTo(x, groundLine - 4);
    ctx.lineTo(x + 42, groundLine - 118);
    ctx.lineTo(x + 88, groundLine - 4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = `rgba(177, 220, 125, ${0.12 * alpha})`;
  for (let x = offset - 35; x < canvas.width + 90; x += 62) {
    ctx.fillRect(x + 18, groundLine - 52, 24, 3);
    ctx.fillRect(x + 10, groundLine - 25, 28, 3);
  }
}

function drawRiverBackline(scene, alpha) {
  const offset = -((distance * 0.045) % 86);
  ctx.fillStyle = scene.treeFar.replace(/[\d.]+\)$/u, `${0.72 * alpha})`);
  for (let x = offset - 86; x < canvas.width + 100; x += 86) {
    const base = 252 + ((x / 86) % 2) * 7;
    ctx.fillRect(x + 38, base - 62, 9, 62);
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x + 43, base - 116);
    ctx.lineTo(x + 86, base);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = `rgba(110, 154, 97, ${0.10 * alpha})`;
  for (let x = offset - 50; x < canvas.width + 90; x += 74) {
    ctx.fillRect(x + 28, 190, 24, 4);
    ctx.fillRect(x + 18, 222, 30, 3);
  }
}

function drawTrees(scene, alpha) {
  const layers = [
    { y: 244, height: 132, gap: 100, speed: 0.07, color: scene.treeFar, trunk: "rgba(30, 19, 13, 0.55)" },
    { y: 290, height: 112, gap: 76, speed: 0.14, color: scene.treeNear, trunk: "rgba(39, 24, 15, 0.74)" }
  ];

  layers.forEach((layer) => {
    const offset = -((distance * layer.speed) % layer.gap);
    ctx.fillStyle = layer.color.replace(/[\d.]+\)$/u, `${alpha})`);
    for (let x = offset - layer.gap; x < canvas.width + layer.gap; x += layer.gap) {
      const trunkX = x + layer.gap * 0.42;
      const trunkW = layer.gap > 90 ? 9 : 12;
      ctx.fillStyle = layer.trunk.replace(/[\d.]+\)$/u, `${alpha})`);
      ctx.fillRect(trunkX, layer.y - layer.height * 0.42, trunkW, layer.height * 0.6);
      ctx.fillRect(trunkX + trunkW - 2, layer.y - layer.height * 0.54, 4, layer.height * 0.32);

      ctx.fillStyle = layer.color.replace(/[\d.]+\)$/u, `${alpha})`);

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

      ctx.fillStyle = `rgba(110, 156, 96, ${0.13 * alpha})`;
      ctx.fillRect(x + layer.gap * 0.38, layer.y - layer.height * 0.72, 18, 4);
      ctx.fillRect(x + layer.gap * 0.30, layer.y - layer.height * 0.46, 24, 3);
      ctx.fillRect(x + layer.gap * 0.54, layer.y - layer.height * 0.55, 20, 3);
      ctx.fillStyle = layer.color.replace(/[\d.]+\)$/u, `${alpha})`);
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

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glowCount = scene.name === "village" || scene.name === "bridge-village" ? 4 : scene.name === "bridge" ? 7 : 12;
  for (let i = 0; i < glowCount; i += 1) {
    const x = canvas.width - ((distance * 0.025 + i * 91) % (canvas.width + 160));
    const y = 92 + ((i * 47 + Math.sin(distance * 0.006 + i) * 20) % 180);
    const light = 0.09 + Math.sin(distance * 0.01 + i) * 0.035;
    ctx.fillStyle = `rgba(255, 208, 103, ${light * alpha})`;
    ctx.fillRect(x, y, 4, 4);
    ctx.fillStyle = `rgba(255, 208, 103, ${light * 0.22 * alpha})`;
    ctx.fillRect(x - 6, y - 6, 16, 16);
  }
  ctx.restore();
}

function drawGround(scene, alpha, sceneIndex) {
  const incline = scene.name === "forest-bridge" ? -8 : scene.name === "village-forest" ? 8 : 0;
  ctx.fillStyle = scene.grass;
  ctx.fillRect(0, groundY - 12, canvas.width, canvas.height - groundY + 12);

  ctx.fillStyle = scene.grassDark;
  ctx.fillRect(0, groundY + 54, canvas.width, 40);

  if (isBridgeScene(scene)) {
    drawRiver(alpha);
    drawWoodenBridge(alpha);
    if (scene.name === "bridge-village") {
      drawBridgeVillageDetails(alpha);
    }
    return;
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

  ctx.fillStyle = `rgba(28, 19, 14, ${0.34 * alpha})`;
  for (let x = pathOffset - 120; x < canvas.width + 120; x += 34) {
    ctx.fillRect(x, groundY + 26 + ((x + sceneIndex) % 4) * 8, 8, 4);
    ctx.fillRect(x + 16, groundY + 48 + ((x + sceneIndex) % 3) * 7, 5, 3);
  }

  ctx.fillStyle = `rgba(15, 28, 17, ${0.42 * alpha})`;
  for (let x = pathOffset - 80; x < canvas.width + 100; x += 42) {
    ctx.fillRect(x, groundY - 8, 5, 18);
    ctx.fillRect(x + 12, groundY - 2, 4, 14);
    ctx.fillRect(x + 27, groundY - 7, 4, 17);
  }

  ctx.fillStyle = `rgba(176, 228, 116, ${0.12 * alpha})`;
  for (let x = -20 + ((distance * 0.34) % 58); x < canvas.width + 60; x += 58) {
    ctx.fillRect(x, groundY + 6, 14, 3);
    ctx.fillRect(x + 25, groundY + 2, 8, 4);
  }

  if (scene.name === "forest-bridge") {
    drawBridgeEntrance(alpha);
  } else if (scene.name === "village-forest") {
    drawVillageForestDetails(alpha);
  }
}

function drawCrowObstacle(obstacle) {
  const bob = obstacle.floatY || 0;
  const wing = Math.sin(distance * 0.09 + obstacle.phase);
  const tilt = Math.sin(distance * 0.026 + obstacle.phase) * 0.08;
  const x = obstacle.x + obstacle.width * 0.5;
  const y = obstacle.y + bob + obstacle.height * 0.5;
  const scale = obstacle.width / 150;
  const wingLift = wing * 18;
  const wingCurl = Math.cos(distance * 0.09 + obstacle.phase) * 7;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0, 0, 0, 0.26)";
  ctx.beginPath();
  ctx.ellipse(6, 30, 58, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const wingGradient = ctx.createLinearGradient(-36, -52, 48, 42);
  wingGradient.addColorStop(0, "#526990");
  wingGradient.addColorStop(0.34, "#1b2538");
  wingGradient.addColorStop(1, "#03050a");
  ctx.fillStyle = wingGradient;
  ctx.strokeStyle = "#050711";
  ctx.lineWidth = 3;

  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.lineTo(18, -50 - wingLift * 0.55);
  ctx.lineTo(46, -34 - wingLift * 0.35);
  ctx.lineTo(35, 6);
  ctx.lineTo(5, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(-10, -3);
  ctx.lineTo(-30, -44 - wingLift);
  ctx.lineTo(-9, -37 - wingLift * 0.72);
  ctx.lineTo(14, -18 - wingLift * 0.35);
  ctx.lineTo(29, 4 + wingCurl);
  ctx.lineTo(4, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(2, 8);
  ctx.lineTo(30, 20 + wingLift * 0.35);
  ctx.lineTo(58, 22 + wingLift * 0.48);
  ctx.lineTo(42, 35 + wingLift * 0.22);
  ctx.lineTo(15, 27);
  ctx.lineTo(-4, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(117, 147, 196, 0.58)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-8 + i * 4, -2 + i * 2);
    ctx.lineTo(-27 + i * 13, -36 - wingLift * 0.82 + i * 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(9 + i * 5, 13 + i * 3);
    ctx.lineTo(48 - i * 7, 23 + wingLift * 0.32 + i * 5);
    ctx.stroke();
  }

  ctx.fillStyle = "#090d15";
  ctx.strokeStyle = "#2c3a55";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(6, 6, 34, 17, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#151d2c";
  ctx.beginPath();
  ctx.ellipse(-1, 2, 25, 9, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0b101a";
  ctx.beginPath();
  ctx.arc(-31, 0, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1b1f28";
  ctx.beginPath();
  ctx.moveTo(-42, -4);
  ctx.lineTo(-66, 0);
  ctx.lineTo(-42, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#657086";
  ctx.fillRect(-55, 0, 12, 2);

  ctx.fillStyle = "#bff1ff";
  ctx.fillRect(-33, -6, 4, 4);
  ctx.fillStyle = "#031018";
  ctx.fillRect(-31, -5, 2, 2);

  ctx.fillStyle = "#070b12";
  ctx.beginPath();
  ctx.moveTo(33, 9);
  ctx.lineTo(64, -5);
  ctx.lineTo(52, 12);
  ctx.lineTo(69, 21);
  ctx.lineTo(34, 21);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(98, 116, 156, 0.62)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(38, 9);
  ctx.lineTo(58, 2);
  ctx.moveTo(40, 15);
  ctx.lineTo(61, 20);
  ctx.stroke();

  ctx.restore();
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

  if (scene.name === "forest-bridge") {
    drawMountainRange(alpha * 0.18, -1);
    drawRiverBackline(scene, alpha * 0.35);
    drawTrees(scene, alpha * 0.88);
  } else if (scene.name === "bridge") {
    drawMountainRange(alpha * 0.22, -1);
    drawRiverBackline(scene, alpha);
  } else if (scene.name === "village") {
    drawMountainRange(alpha * 0.22, -1);
    drawVillage(alpha);
  } else if (scene.name === "bridge-village") {
    drawMountainRange(alpha * 0.18, -1);
    drawRiverBackline(scene, alpha * 0.40);
    drawVillage(alpha * 0.82);
  } else if (scene.name === "village-forest") {
    drawMountainRange(alpha * 0.18, -1);
    drawVillage(alpha * 0.50);
    drawTrees(scene, alpha * 0.72);
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
    if (obstacle.typeIndex === 2) {
      drawCrowObstacle(obstacle);
      return;
    }

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
