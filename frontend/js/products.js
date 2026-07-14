function initProductsPage() {
  const grid = document.querySelector("#productsGrid");
  const search = document.querySelector("#searchInput");
  const category = document.querySelector("#categoryFilter");
  const prev = document.querySelector("#prevPage");
  const next = document.querySelector("#nextPage");
  const pageInfo = document.querySelector("#pageInfo");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const state = { page: 1, pages: 1 };

  navToggle?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  const card = (product) => `
    <article class="product-card">
      <img src="${safeText(product.image_url)}" alt="${safeText(product.nom)}">
      <div class="card-body">
        ${roleBadge(product.role_vendeur)}
        <h3>${safeText(product.nom)}</h3>
        <p>${safeText(product.description || "")}</p>
        <p class="price">${formatPrice(product.prix)}</p>
        <div class="meta-row"><span>${safeText(product.vendeur?.nom || "Vendeur UCAO")}</span><span>${safeText(product.categorie)}</span></div>
        <a class="btn btn--ghost" href="produit-detail.html?id=${product.id}"><i data-lucide="eye"></i> Voir le détail</a>
      </div>
    </article>
  `;

  const render = async () => {
    const query = search.value.trim();
    const selected = category.value;
    let products = [];

    try {
      const data = await apiFetch(`/products?page=${state.page}&per_page=5&q=${encodeURIComponent(query)}&category=${encodeURIComponent(selected)}`);
      products = data.items;
      state.pages = data.pages || 1;
    } catch {
      const filtered = window.UCAO_CONFIG.demoProducts.filter((product) => {
        const haystack = `${product.nom} ${product.vendeur?.nom || ""} ${product.categorie}`.toLowerCase();
        return (!query || haystack.includes(query.toLowerCase())) && (selected === "tous" || product.categorie === selected);
      }).sort((a, b) => ({ VIP: 1, PREMIUM: 2, SIMPLE: 3 }[a.role_vendeur] - { VIP: 1, PREMIUM: 2, SIMPLE: 3 }[b.role_vendeur]));
      const start = (state.page - 1) * 5;
      products = filtered.slice(start, start + 5);
      state.pages = Math.max(Math.ceil(filtered.length / 5), 1);
    }

    grid.innerHTML = products.length ? products.map(card).join("") : `<p class="notice">Aucun produit ne correspond à votre recherche.</p>`;
    pageInfo.textContent = `Page ${state.page} / ${state.pages}`;
    prev.disabled = state.page <= 1;
    next.disabled = state.page >= state.pages;
    if (window.lucide) window.lucide.createIcons();
  };

  search?.addEventListener("input", () => { state.page = 1; render(); });
  category?.addEventListener("change", () => { state.page = 1; render(); });
  prev?.addEventListener("click", () => { if (state.page > 1) { state.page -= 1; render(); } });
  next?.addEventListener("click", () => { if (state.page < state.pages) { state.page += 1; render(); } });

  render();
}

document.addEventListener("DOMContentLoaded", initProductsPage);
