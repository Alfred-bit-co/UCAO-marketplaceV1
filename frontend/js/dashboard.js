let currentUser = null;

function dashboardMessage(text, isError = false) {
  const target = document.querySelector("#dashboardMessage");
  if (!target) return;
  target.className = `notice ${isError ? "error" : ""}`;
  target.textContent = text;
}

function formPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function loadDashboard() {
  const token = getToken();
  if (!token) {
    dashboardMessage("Connectez-vous pour accéder au dashboard vendeur.", true);
    return;
  }

  try {
    currentUser = await apiFetch("/auth/me");
    const [products, stands] = await Promise.all([apiFetch("/products/mine"), apiFetch("/stands/mine")]);
    document.querySelector("#sellerName").textContent = currentUser.nom;
    document.querySelector("#sellerRole").innerHTML = roleBadge(currentUser.role);
    document.querySelector("#productsCount").textContent = products.length;
    document.querySelector("#standsCount").textContent = stands.length;
    document.querySelector("#standLimit").textContent = `${stands.length} / ${currentUser.stand_limit} stand(s) utilisés`;
    document.querySelector("#myProducts").innerHTML = products.length ? products.map((product) => `
      <div class="compact-item"><span>${safeText(product.nom)} - ${formatPrice(product.prix)}</span><button class="btn btn--ghost" data-delete-product="${product.id}" type="button"><i data-lucide="trash-2"></i></button></div>
    `).join("") : `<p>Aucun produit pour le moment.</p>`;
    document.querySelector("#myStands").innerHTML = stands.length ? stands.map((stand) => `
      <div class="compact-item"><span>${safeText(stand.nom)}</span><a class="btn btn--ghost" href="stand-detail.html?id=${stand.id}"><i data-lucide="eye"></i></a></div>
    `).join("") : `<p>Aucun stand pour le moment.</p>`;
  } catch (error) {
    dashboardMessage(error.message, true);
  }
  if (window.lucide) window.lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", () => {
  const productForm = document.querySelector("#productForm");
  const standForm = document.querySelector("#standForm");
  const aiButton = document.querySelector("#aiButton");

  productForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/products", { method: "POST", body: JSON.stringify(formPayload(productForm)) });
      productForm.reset();
      dashboardMessage("Produit publié avec succès.");
      loadDashboard();
    } catch (error) {
      dashboardMessage(error.message, true);
    }
  });

  standForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/stands", { method: "POST", body: JSON.stringify(formPayload(standForm)) });
      standForm.reset();
      dashboardMessage("Stand créé avec succès.");
      loadDashboard();
    } catch (error) {
      dashboardMessage(error.message, true);
    }
  });

  aiButton?.addEventListener("click", async () => {
    const payload = formPayload(productForm);
    try {
      const data = await apiFetch("/ai/generate-description", {
        method: "POST",
        body: JSON.stringify({ nom: payload.nom, categorie: payload.categorie })
      });
      productForm.elements.description.value = data.description;
      dashboardMessage("Description générée par l’IA.");
    } catch (error) {
      dashboardMessage(error.message, true);
    }
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-product]");
    if (!button) return;
    try {
      await apiFetch(`/products/${button.dataset.deleteProduct}`, { method: "DELETE" });
      dashboardMessage("Produit supprimé.");
      loadDashboard();
    } catch (error) {
      dashboardMessage(error.message, true);
    }
  });

  loadDashboard();
  if (window.lucide) window.lucide.createIcons();
});
