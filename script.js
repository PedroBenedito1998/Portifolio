const header = document.querySelector("[data-header]");
const themeButtons = document.querySelectorAll("[data-theme-button]");
const loader = document.querySelector("[data-loader]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-project-card]");
const revealCards = document.querySelectorAll(".reveal-card");
const themeStorageKey = "portfolio-theme-index-v2";
const themes = ["", "violet", "red", "green", "blue"];
let themeIndex = 0;
let cursorFrame = 0;
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

function syncHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

function applyTheme(index) {
  const theme = themes[index] || "";
  document.body.dataset.theme = theme;
  localStorage.setItem(themeStorageKey, String(index));
}

function nextTheme() {
  themeIndex = (themeIndex + 1) % themes.length;
  applyTheme(themeIndex);
}

function filterProjects(kind) {
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === kind);
  });

  projectCards.forEach((card) => {
    const shouldShow = kind === "all" || card.dataset.kind === kind;
    card.classList.toggle("is-hidden", !shouldShow);
  });
}

function setupReveal() {
  if (!("IntersectionObserver" in window)) {
    revealCards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealCards.forEach((card) => observer.observe(card));
}

function setupCursorShade() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  window.addEventListener("pointermove", (event) => {
    document.body.classList.add("is-pointer-active");
    cursorX = event.clientX;
    cursorY = event.clientY;

    if (cursorFrame) return;
    cursorFrame = window.requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--cursor-x", `${cursorX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${cursorY}px`);
      cursorFrame = 0;
    });
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("is-pointer-active");
  }, { passive: true });
}

function finishLoading() {
  document.body.classList.remove("is-loading");
  if (!loader) return;
  loader.classList.add("is-hidden");
  window.setTimeout(() => loader.remove(), 420);
}

const savedTheme = Number(localStorage.getItem(themeStorageKey));
if (!Number.isNaN(savedTheme) && savedTheme >= 0 && savedTheme < themes.length) {
  themeIndex = savedTheme;
}

applyTheme(themeIndex);
window.addEventListener("scroll", syncHeader, { passive: true });
themeButtons.forEach((button) => {
  button.addEventListener("click", nextTheme);
});
filterButtons.forEach((button) => {
  button.addEventListener("click", () => filterProjects(button.dataset.filter));
});
setupReveal();
setupCursorShade();
syncHeader();
window.addEventListener("load", () => window.setTimeout(finishLoading, 720), { once: true });
window.setTimeout(finishLoading, 2200);
