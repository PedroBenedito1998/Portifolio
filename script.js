const header = document.querySelector("[data-header]");
const themeButtons = document.querySelectorAll("[data-theme-button]");
const modeSwitch = document.querySelector("[data-mode-switch]");
const modeIcon = document.querySelector("[data-mode-icon]");
const modeLabel = document.querySelector("[data-mode-label]");
const modeToast = document.querySelector("[data-mode-toast]");
const loader = document.querySelector("[data-loader]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-project-card]");
const revealCards = document.querySelectorAll(".reveal-card");
const sectionLinks = document.querySelectorAll('.nav a[href^="#"]');
const trackedSections = Array.from(sectionLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const themeStorageKey = "portfolio-theme-index-v2";
const modeStorageKey = "portfolio-color-mode-v1";
const themes = ["", "violet", "red", "green", "blue"];
const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
let themeIndex = 0;
let colorMode = "dark";
let toastTimeout = 0;
let pointerFrame = 0;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;

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

function showModeToast(message) {
  if (!modeToast) return;
  modeToast.textContent = message;
  modeToast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    modeToast.classList.remove("is-visible");
  }, 2200);
}

function applyColorMode(mode, shouldNotify = false) {
  colorMode = mode === "light" ? "light" : "dark";
  document.body.dataset.mode = colorMode;
  localStorage.setItem(modeStorageKey, colorMode);

  const isDark = colorMode === "dark";
  if (modeSwitch) {
    modeSwitch.setAttribute("aria-checked", String(isDark));
  }
  if (modeIcon) {
    modeIcon.textContent = isDark ? "☾" : "☀";
  }
  if (modeLabel) {
    modeLabel.textContent = "Modo escuro";
  }
  if (shouldNotify) {
    showModeToast(isDark ? "Modo escuro ativado." : "Modo escuro desativado.");
  }
}

function nextColorMode() {
  applyColorMode(colorMode === "dark" ? "light" : "dark", true);
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

function setActiveSection(id) {
  sectionLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function syncActiveSection() {
  if (!trackedSections.length) return;

  const pageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
  if (pageBottom) {
    setActiveSection(trackedSections[trackedSections.length - 1].id);
    return;
  }

  const marker = window.scrollY + window.innerHeight * 0.66;
  let current = trackedSections[0];

  trackedSections.forEach((section) => {
    if (section.offsetTop <= marker) {
      current = section;
    }
  });

  setActiveSection(current.id);
}

function setupAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ block: "start", behavior: "smooth" });
      window.history.pushState(null, "", targetId);
      setActiveSection(target.id);
    });
  });
}

function setupPointerGlow() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    document.body.classList.add("is-pointer-active");

    if (pointerFrame) return;
    pointerFrame = window.requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--pointer-x", `${pointerX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${pointerY}px`);
      pointerFrame = 0;
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

const savedMode = localStorage.getItem(modeStorageKey);
if (savedMode === "dark" || savedMode === "light") {
  colorMode = savedMode;
} else {
  colorMode = prefersDarkMode.matches ? "dark" : "light";
}

applyTheme(themeIndex);
applyColorMode(colorMode);
window.addEventListener("scroll", syncHeader, { passive: true });
window.addEventListener("scroll", syncActiveSection, { passive: true });
if (modeSwitch) {
  modeSwitch.addEventListener("click", nextColorMode);
}
themeButtons.forEach((button) => {
  button.addEventListener("click", nextTheme);
});
filterButtons.forEach((button) => {
  button.addEventListener("click", () => filterProjects(button.dataset.filter));
});
setupAnchorScroll();
setupReveal();
setupPointerGlow();
syncHeader();
syncActiveSection();
window.addEventListener("load", () => window.setTimeout(finishLoading, 720), { once: true });
window.setTimeout(finishLoading, 2200);
