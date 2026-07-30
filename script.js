const header = document.querySelector("[data-header]");

function syncHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", syncHeader, { passive: true });
syncHeader();
