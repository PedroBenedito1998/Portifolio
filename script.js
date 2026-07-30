const header = document.querySelector("[data-header]");
const themeButton = document.querySelector("[data-theme-button]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-project-card]");
const revealCards = document.querySelectorAll(".reveal-card");
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

const savedTheme = Number(localStorage.getItem("portfolio-theme-index"));
if (!Number.isNaN(savedTheme) && savedTheme >= 0 && savedTheme < themes.length) {
  themeIndex = savedTheme;
}

applyTheme(themeIndex);
window.addEventListener("scroll", syncHeader, { passive: true });
themeButton?.addEventListener("click", nextTheme);
filterButtons.forEach((button) => {
  button.addEventListener("click", () => filterProjects(button.dataset.filter));
});
setupReveal();
syncHeader();
