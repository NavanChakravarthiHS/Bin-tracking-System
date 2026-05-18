(function () {
  const TOKEN_KEY = "admin_token";
  const DASHBOARD_URL = "/app.html";
  const API_BASE = "http://localhost:5000"; // backend

  const form = document.getElementById("loginForm");
  const mobileInput = document.getElementById("mobile");
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.getElementById("togglePassword");
  const loginBtn = document.getElementById("loginBtn");

  const alertEl = document.getElementById("alert");
  const mobileError = document.getElementById("mobileError");
  const passwordError = document.getElementById("passwordError");

  const nextUrl = new URLSearchParams(window.location.search).get("next") || DASHBOARD_URL;

  function showAlert(message, type) {
    alertEl.hidden = false;
    alertEl.className = "alert" + (type ? ` alert--${type}` : "");
    alertEl.textContent = message;
  }

  function clearAlert() {
    alertEl.hidden = true;
    alertEl.className = "alert";
    alertEl.textContent = "";
  }

  function setFieldError(input, errorEl, message) {
    errorEl.textContent = message || "";
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function normalizeMobile(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 10);
  }

  mobileInput.addEventListener("input", () => {
    const normalized = normalizeMobile(mobileInput.value);
    if (mobileInput.value !== normalized) mobileInput.value = normalized;
  });

  toggleBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    toggleBtn.textContent = isPassword ? "Hide" : "Show";
    toggleBtn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAlert();

    const mobile = normalizeMobile(mobileInput.value);
    const password = passwordInput.value || "";

    let ok = true;
    if (!/^\d{10}$/.test(mobile)) {
      setFieldError(mobileInput, mobileError, "Mobile number must be exactly 10 digits.");
      ok = false;
    } else {
      setFieldError(mobileInput, mobileError, "");
    }

    if (password.length < 6) {
      setFieldError(passwordInput, passwordError, "Password must be at least 6 characters.");
      ok = false;
    } else {
      setFieldError(passwordInput, passwordError, "");
    }

    if (!ok) return;

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || "Invalid credentials";
        showAlert(msg === "Invalid credentials" ? "Invalid credentials" : msg, "danger");
        return;
      }

      // localStorage is per-origin (port), so we pass token to React app via hash
      localStorage.setItem(TOKEN_KEY, data.token);
      showAlert("Login successful. Redirecting…", "success");

      setTimeout(() => {
        const u = new URL(nextUrl, window.location.origin);
        u.hash = `token=${encodeURIComponent(data.token)}`;
        window.location.href = u.toString();
      }, 450);
    } catch {
      showAlert("Backend not reachable. Start the server and try again.", "danger");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
})();

