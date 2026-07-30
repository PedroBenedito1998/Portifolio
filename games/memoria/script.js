const grid = document.querySelector("[data-memory-grid]");
const movesNode = document.querySelector("[data-moves]");
const errorsNode = document.querySelector("[data-errors]");
const statusNode = document.querySelector("[data-memory-status]");
const resetButton = document.querySelector("[data-memory-reset]");

const maxConsecutiveMistakes = 4;
const pairsPerGame = 6;
const symbols = ["JS", "SQL", "CSS", "PY", "DB", "UX", "API", "HTML", "GIT", "JAVA", "DOM", "UI"];
let cards = [];
let opened = [];
let locked = false;
let moves = 0;
let found = 0;
let consecutiveMistakes = 0;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickSymbols() {
  return shuffle(symbols).slice(0, pairsPerGame);
}

function render() {
  grid.innerHTML = "";
  cards.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-card";
    button.textContent = card.open || card.found ? card.value : "?";
    button.classList.toggle("is-open", card.open);
    button.classList.toggle("is-found", card.found);
    button.disabled = locked || card.open || card.found;
    button.addEventListener("click", () => openCard(index));
    grid.appendChild(button);
  });
}

function resetGame() {
  const selectedSymbols = pickSymbols();
  cards = shuffle([...selectedSymbols, ...selectedSymbols]).map((value) => ({
    value,
    open: false,
    found: false
  }));
  opened = [];
  locked = false;
  moves = 0;
  found = 0;
  consecutiveMistakes = 0;
  movesNode.textContent = moves;
  errorsNode.textContent = consecutiveMistakes;
  statusNode.textContent = "Encontre os pares";
  render();
}

function openCard(index) {
  if (locked) return;
  const card = cards[index];
  if (!card || card.open || card.found) return;

  card.open = true;
  opened.push(index);
  render();

  if (opened.length < 2) return;
  moves += 1;
  movesNode.textContent = moves;

  const [first, second] = opened;
  if (cards[first].value === cards[second].value) {
    cards[first].found = true;
    cards[second].found = true;
    opened = [];
    found += 2;
    consecutiveMistakes = 0;
    errorsNode.textContent = consecutiveMistakes;
    statusNode.textContent = found === cards.length ? "Você encontrou todos os pares" : "Par encontrado";
    render();
    return;
  }

  locked = true;
  consecutiveMistakes += 1;
  errorsNode.textContent = Math.min(consecutiveMistakes, maxConsecutiveMistakes);

  if (consecutiveMistakes > maxConsecutiveMistakes) {
    statusNode.textContent = "Limite de erros atingido. Reiniciando...";
    setTimeout(resetGame, 900);
    return;
  }

  statusNode.textContent = `Tente memorizar as cartas. Restam ${maxConsecutiveMistakes - consecutiveMistakes} erro(s).`;
  setTimeout(() => {
    cards[first].open = false;
    cards[second].open = false;
    opened = [];
    locked = false;
    statusNode.textContent = "Continue tentando";
    render();
  }, 750);
}

resetButton.addEventListener("click", resetGame);
resetGame();
