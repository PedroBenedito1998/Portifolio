let secret = [];
let attemptsLeft = 10;
let attempts = [];

const playArea = document.getElementById("gerarNumeros");
const playButton = document.getElementById("playGame");
const checkArea = document.querySelector(".verificacao");
const checkButton = document.getElementById("verificarBtn");
const guessInput = document.getElementById("senhaDeChute");
const results = document.getElementById("resultados");
const feedback = document.getElementById("feedback");

function setFeedback(message, type = "info") {
  feedback.textContent = message;
  feedback.dataset.type = type;
}

function makeSecret() {
  const numbers = [];
  while (numbers.length < 4) {
    const value = Math.floor(Math.random() * 10).toString();
    if (!numbers.includes(value)) {
      numbers.push(value);
    }
  }
  return numbers;
}

function isValidGuess(value) {
  if (!/^\d{4}$/.test(value)) return false;
  return new Set(value.split("")).size === 4;
}

function renderAttempts() {
  results.innerHTML = "";
  attempts.forEach((attempt, index) => {
    const row = document.createElement("div");
    row.className = "result-row";

    const text = document.createElement("span");
    text.textContent = `${index + 1}. ${attempt.guess}`;
    row.appendChild(text);

    const bull = document.createElement("img");
    bull.src = "midia/touro.jfif";
    bull.alt = "Touros";
    row.appendChild(bull);

    const bullCount = document.createElement("strong");
    bullCount.textContent = attempt.bulls;
    row.appendChild(bullCount);

    const cow = document.createElement("img");
    cow.src = "midia/vaca.jfif";
    cow.alt = "Vacas";
    row.appendChild(cow);

    const cowCount = document.createElement("strong");
    cowCount.textContent = attempt.cows;
    row.appendChild(cowCount);

    results.appendChild(row);
  });
}

function resetGame(message) {
  attemptsLeft = 10;
  attempts = [];
  secret = [];
  guessInput.value = "";
  results.innerHTML = "";
  checkArea.style.display = "none";
  playArea.style.display = "block";
  playButton.style.display = "inline-flex";
  setFeedback(message, "info");
}

function startGame() {
  secret = makeSecret();
  attemptsLeft = 10;
  attempts = [];
  results.innerHTML = "";
  playArea.style.display = "none";
  checkArea.style.display = "block";
  guessInput.value = "";
  guessInput.focus();
  setFeedback("O jogo começou. Você tem 10 tentativas.", "ok");
}

function checkGuess() {
  const guess = guessInput.value.trim();
  if (!isValidGuess(guess)) {
    setFeedback("Digite exatamente 4 números diferentes.", "error");
    guessInput.focus();
    return;
  }

  let bulls = 0;
  let cows = 0;
  const digits = guess.split("");

  digits.forEach((digit, index) => {
    if (secret[index] === digit) {
      bulls += 1;
    } else if (secret.includes(digit)) {
      cows += 1;
    }
  });

  attemptsLeft -= 1;
  attempts.push({ guess, bulls, cows });
  renderAttempts();
  guessInput.value = "";

  if (bulls === 4) {
    resetGame("Parabéns, você acertou a senha.");
    return;
  }

  if (attemptsLeft <= 0) {
    resetGame(`Fim de jogo. A senha era ${secret.join("")}.`);
    return;
  }

  setFeedback(`Touros: ${bulls}. Vacas: ${cows}. Tentativas restantes: ${attemptsLeft}.`);
  guessInput.focus();
}

playButton.addEventListener("click", startGame);
checkButton.addEventListener("click", checkGuess);
guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkGuess();
  }
});
