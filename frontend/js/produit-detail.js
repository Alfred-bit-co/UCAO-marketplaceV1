document.addEventListener("DOMContentLoaded", async () => {
  const target = document.querySelector("#productDetail");
  const id = new URLSearchParams(window.location.search).get("id");
  let product = null;

  try {
    product = await apiFetch(`/products/${id}`);
  } catch {
    product = window.UCAO_CONFIG.demoProducts.find((item) => String(item.id) === String(id)) || window.UCAO_CONFIG.demoProducts[0];
  }

  target.innerHTML = `
    <img src="${safeText(product.image_url)}" alt="${safeText(product.nom)}">
    <section>
      ${roleBadge(product.role_vendeur)}
      <h1>${safeText(product.nom)}</h1>
      <p class="price">${formatPrice(product.prix)}</p>
      <p>${safeText(product.description)}</p>
      <div class="seller-box">
        <h2>Vendeur</h2>
        <p><strong>${safeText(product.vendeur?.nom || "Vendeur UCAO")}</strong></p>
        <p>Rôle : ${safeText(product.vendeur?.role || product.role_vendeur || "SIMPLE")}</p>
        <p>Contact : ${safeText(product.vendeur?.phone || "Non renseigné")}</p>
      </div>
      <a class="btn btn--primary" href="products.html"><i data-lucide="arrow-left"></i> Retour aux produits</a>
    </section>
  `;
  if (window.lucide) window.lucide.createIcons();
});
