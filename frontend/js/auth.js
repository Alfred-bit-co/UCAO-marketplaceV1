function showMessage(text, isError = false) {
  const target = document.querySelector("#authMessage");
  if (!target) return;
  target.className = `notice ${isError ? "error" : ""}`;
  target.textContent = text;
}

async function postJson(path, payload) {
  const response = await fetch(`${window.UCAO_CONFIG.apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#loginForm");
  const registerForm = document.querySelector("#registerForm");
  if (window.lucide) window.lucide.createIcons();

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    try {
      const data = await postJson("/auth/login", Object.fromEntries(form));
      localStorage.setItem("ucao_token", data.token);
      showMessage("Connexion réussie. Redirection vers le tableau de bord...");
      window.setTimeout(() => window.location.href = "dashboard.html", 700);
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(registerForm);
    try {
      await postJson("/auth/register", Object.fromEntries(form));
      showMessage("Compte créé. Vous pouvez maintenant vous connecter.");
      window.setTimeout(() => window.location.href = "login.html", 900);
    } catch (error) {
      showMessage(error.message, true);
    }
  });
});
