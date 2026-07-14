document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  navToggle?.addEventListener("click", () => navLinks.classList.toggle("is-open"));

  const grid = document.querySelector("#standsGrid");
  const prev = document.querySelector("#prevStand");
  const next = document.querySelector("#nextStand");
  const pageInfo = document.querySelector("#standPageInfo");
  const state = { page: 1, pages: 1 };

  const render = async () => {
    let stands = [];
    try {
      const data = await apiFetch(`/stands?page=${state.page}`);
      stands = data.items;
      state.pages = data.pages || 1;
    } catch {
      stands = window.UCAO_CONFIG.demoStands.slice(state.page - 1, state.page);
      state.pages = window.UCAO_CONFIG.demoStands.length;
    }

    grid.innerHTML = stands.map((stand) => `
      <article class="stand-card stand-band">
        <img src="${safeText(stand.banniere_url)}" alt="${safeText(stand.nom)}">
        <div class="card-body">
          ${roleBadge(stand.role_vendeur)}
          <h3>${safeText(stand.nom)}</h3>
          <p>${safeText(stand.description)}</p>
          <div class="meta-row"><span>Responsable : ${safeText(stand.vendeur?.nom || "Vendeur UCAO")}</span><span>${stand.produits?.length || 0} produit(s)</span></div>
          <a class="btn btn--primary" href="stand-detail.html?id=${stand.id}"><i data-lucide="arrow-right"></i> Voir le stand</a>
        </div>
      </article>
    `).join("");
    pageInfo.textContent = `Page ${state.page} / ${state.pages}`;
    prev.disabled = state.page <= 1;
    next.disabled = state.page >= state.pages;
    if (window.lucide) window.lucide.createIcons();
  };

  prev?.addEventListener("click", () => { if (state.page > 1) { state.page -= 1; render(); } });
  next?.addEventListener("click", () => { if (state.page < state.pages) { state.page += 1; render(); } });
  render();
});
