const iframe = document.querySelector("[data-frame]");
const links = [...document.querySelectorAll("[data-link]")];
const toggle = document.querySelector("[data-menu-toggle]");
const closeNav = () => document.body.classList.remove("nav-open");

if (toggle) {
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });
}

const setActive = (href) => {
  links.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === href);
  });
};

const loadPage = (href, pushHash = true) => {
  if (!iframe || !href) return;
  iframe.src = href;
  setActive(href);
  if (pushHash) {
    history.replaceState(null, "", "#" + href);
  }
  closeNav();
};

links.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    loadPage(link.getAttribute("href"));
  });
});

iframe?.addEventListener("load", () => {
  const current = iframe.getAttribute("src");
  setActive(current);
});

const initial = location.hash ? location.hash.slice(1) : iframe?.getAttribute("src");
if (initial) {
  loadPage(initial, false);
}
