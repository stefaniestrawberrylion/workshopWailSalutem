document.addEventListener("DOMContentLoaded", () => {
//
  /* ======================================================
     CUSTOM POPUP
  ====================================================== */
  const popupContainer = document.getElementById("customPopupContainer");

  function showCustomPopup(message, type = "error", duration = 5000) {
    if (!popupContainer) return;

    popupContainer.innerHTML = "";

    const popup = document.createElement("div");
    popup.className = `custom-popup ${type}`;
    popup.innerHTML = `<p>${message}</p><span class="close-btn">&times;</span>`;
    popupContainer.appendChild(popup);

    requestAnimationFrame(() => popup.classList.add("visible"));

    const timeoutId = setTimeout(close, duration);

    function close() {
      popup.classList.remove("visible");
      popup.classList.add("fading-out");
      setTimeout(() => popup.remove(), 300);
      clearTimeout(timeoutId);
    }

    popup.querySelector(".close-btn").addEventListener("click", close);
  }

  /* ======================================================
     API URL
  ====================================================== */
  const API_URL =
    location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://workshoptest.wailsalutem-foundation.com";

  /* ======================================================
     LOGIN MET FALLBACK (ADMIN → USER)
  ====================================================== */
  async function loginWithFallback(email, password) {
    let response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      response = await fetch(`${API_URL}/register/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Ongeldige e-mail of wachtwoord");
    }

    return data;
  }

  /* ======================================================
     LOGIN
  ====================================================== */
  const loginBtn = document.querySelector(".login button");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.querySelector(".login input[type='email']").value.trim();
      const password = document.querySelector(".login input[type='password']").value;

      if (!email || !password) {
        showCustomPopup("Vul e-mail en wachtwoord in!");
        return;
      }

      try {
        const data = await loginWithFallback(email, password);
        const token = data.access_token;

        localStorage.setItem("jwt", token);

        const payload = JSON.parse(atob(token.split(".")[1]));
        const roles = payload.roles
          ? Array.isArray(payload.roles) ? payload.roles : [payload.roles]
          : payload.role ? [payload.role] : [];

        const normalized = roles.map(r => r.toUpperCase());

        if (normalized.includes("ADMIN")) {
          showCustomPopup("Welkom admin!", "success", 1000);
          setTimeout(() => location.href = "/dashboard", 1000);
        } else {
          showCustomPopup("Welkom gebruiker!", "success", 1000);
          setTimeout(() => location.href = "/dashboarduser", 1000);
        }

      } catch (err) {
        showCustomPopup(err.message);
      }
    });
  }

  /* ======================================================
     REGISTRATIE
  ====================================================== */
  const sendEmailBtn = document.getElementById("sendEmail");

  if (sendEmailBtn) {
    sendEmailBtn.addEventListener("click", async () => {
      const email = emailInput("email");
      const password = value("password");
      const firstName = value("firstName");
      const lastName = value("lastName");
      const school = value("school");
      const phone = value("phone");

      if (![email, password, firstName, lastName, school, phone].every(Boolean)) {
        showCustomPopup("Vul alle velden in!");
        return;
      }

      if (email.toLowerCase().includes("admin")) {
        showCustomPopup("Admin e-mails zijn niet toegestaan.");
        return;
      }

      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*]).{12,}$/;
      if (!pwdRegex.test(password)) {
        showCustomPopup("Wachtwoord voldoet niet aan de eisen.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/register/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName, school, phone }),
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        showCustomPopup("Aanvraag verstuurd!", "success");
        document.getElementById("registrationForm").reset();

      } catch (err) {
        showCustomPopup(err.message || "Registratie mislukt");
      }
    });
  }

  /* ======================================================
     FORGOT / RESET PASSWORD
  ====================================================== */
  const sendResetLinkBtn = document.getElementById("sendResetLink");

  if (sendResetLinkBtn) {
    sendResetLinkBtn.addEventListener("click", async () => {
      const email = value("forgotEmail");
      if (!email) {
        showCustomPopup("Vul je e-mailadres in.");
        return;
      }

      try {
        await fetch(`${API_URL}/register/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        showResetPasswordPopup(email);

      } catch {
        showCustomPopup("Fout bij aanvragen reset.");
      }
    });
  }

  function showResetPasswordPopup(email) {
    const overlay = document.createElement("div");
    overlay.className = "reset-password-overlay";
    overlay.innerHTML = `
      <div class="reset-popup">
        <h3>Wachtwoord herstellen</h3>
        <input value="${email}" readonly>
        <input id="resetCode" placeholder="Resetcode">
        <input id="newPassword" type="password" placeholder="Nieuw wachtwoord">
        <input id="confirmPassword" type="password" placeholder="Herhaal wachtwoord">
        <button id="submitReset">Reset</button>
        <span class="close-btn">&times;</span>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector(".close-btn").onclick = () => overlay.remove();
    overlay.onclick = e => e.target === overlay && overlay.remove();

    overlay.querySelector("#submitReset").onclick = async () => {
      const code = value("resetCode", overlay);
      const pwd = value("newPassword", overlay);
      const confirm = value("confirmPassword", overlay);

      if (!code || !pwd || pwd !== confirm) {
        showCustomPopup("Controleer invoer.");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/register/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, password: pwd }),
        });

        if (!res.ok) throw new Error();

        showCustomPopup("Wachtwoord gewijzigd!", "success");
        overlay.remove();

      } catch {
        showCustomPopup("Reset mislukt.");
      }
    };
  }

  /* ======================================================
     HELPERS
  ====================================================== */
  function value(id, scope = document) {
    return scope.getElementById(id)?.value.trim();
  }

  function emailInput(id) {
    return value(id)?.toLowerCase();
  }

});
