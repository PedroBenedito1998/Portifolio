const header = document.querySelector("[data-header]");
const themeButton = document.querySelector("[data-theme-button]");
const themes = ["", "violet", "red", "green"];
let themeIndex = 0;

function syncHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

function applyTheme(index) {
  const theme = themes[index] || "";
  document.body.dataset.theme = theme;
  localStorage.setItem("portfolio-theme-index", String(index));
}

function nextTheme() {
  themeIndex = (themeIndex + 1) % themes.length;
  applyTheme(themeIndex);
}

const savedTheme = Number(localStorage.getItem("portfolio-theme-index"));
if (!Number.isNaN(savedTheme) && savedTheme >= 0 && savedTheme < themes.length) {
  themeIndex = savedTheme;
}

applyTheme(themeIndex);
window.addEventListener("scroll", syncHeader, { passive: true });
themeButton?.addEventListener("click", nextTheme);
syncHeader();
