const state = { heroIndex: 0 };

function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function initNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function setHeroImage(nextIndex) {
  const images = [...document.querySelectorAll(".hero__image")];
  if (!images.length) return;
  images[state.heroIndex].classList.remove("is-visible");
  state.heroIndex = (nextIndex + images.length) % images.length;
  images[state.heroIndex].classList.add("is-visible");
}

function initHeroSlider() {
  const previous = document.querySelector(".hero-arrow--left");
  const next = document.querySelector(".hero-arrow--right");
  previous?.addEventListener("click", () => setHeroImage(state.heroIndex - 1));
  next?.addEventListener("click", () => setHeroImage(state.heroIndex + 1));
  if (document.querySelectorAll(".hero__image").length > 1) {
    window.setInterval(() => setHeroImage(state.heroIndex + 1), 6500);
  }
}

function productCard(product) {
  return `
    <article class="product-card">
      <img src="${safeText(product.image_url)}" alt="${safeText(product.nom)}">
      <div class="card-body">
        ${roleBadge(product.role_vendeur)}
        <h3>${safeText(product.nom)}</h3>
        <p class="price">${formatPrice(product.prix)}</p>
        <div class="meta-row"><span>${safeText(product.vendeur?.nom || "Vendeur UCAO")}</span><span>${safeText(product.categorie)}</span></div>
        <a class="btn btn--ghost" href="produit-detail.html?id=${product.id}"><i data-lucide="eye"></i> Voir le détail</a>
      </div>
    </article>
  `;
}

function renderFeaturedProducts() {
  const target = document.querySelector("#featuredProducts");
  if (!target) return;
  target.innerHTML = window.UCAO_CONFIG.demoProducts.slice(0, 3).map(productCard).join("");
  initIcons();
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initHeroSlider();
  renderFeaturedProducts();
  initIcons();
});
