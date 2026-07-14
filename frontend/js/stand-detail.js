document.addEventListener("DOMContentLoaded", async () => {
  const target = document.querySelector("#standDetail");
  const id = new URLSearchParams(window.location.search).get("id");
  let stand = null;

  try {
    stand = await apiFetch(`/stands/${id}`);
  } catch {
    stand = window.UCAO_CONFIG.demoStands.find((item) => String(item.id) === String(id)) || window.UCAO_CONFIG.demoStands[0];
  }

  target.innerHTML = `
    <img src="${safeText(stand.banniere_url)}" alt="${safeText(stand.nom)}">
    <section>
      ${roleBadge(stand.role_vendeur)}
      <h1>${safeText(stand.nom)}</h1>
      <p>${safeText(stand.description)}</p>
      <div class="seller-box">
        <h2>Responsable</h2>
        <p><strong>${safeText(stand.vendeur?.nom || "Vendeur UCAO")}</strong></p>
        <p>Rôle : ${safeText(stand.vendeur?.role || stand.role_vendeur || "SIMPLE")}</p>
      </div>
      <a class="btn btn--primary" href="stands.html"><i data-lucide="arrow-left"></i> Retour aux stands</a>
    </section>
  `;
  if (window.lucide) window.lucide.createIcons();
});
