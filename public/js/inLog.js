document.addEventListener('DOMContentLoaded', () => {
  console.log("🟢 Login script geladen");

  // ================== API BASE URL ==================
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://workshoptest.wailsalutem-foundation.com";
  console.log("Backend URL:", API_URL);

  // ================== PANEL SWITCHING ==================
  const cardContainer = document.getElementById('cardContainer');
  const showEmailForm = document.getElementById('showEmailForm');
  const backToLogin = document.getElementById('backToLogin');

  if (showEmailForm) {
    showEmailForm.addEventListener('click', () => {
      cardContainer.classList.add('show-email');
      cardContainer.classList.remove('reset');
    });
  }

  if (backToLogin) {
    backToLogin.addEventListener('click', () => {
      cardContainer.classList.remove('show-email');
      cardContainer.classList.add('reset');
    });
  }

  // ================== LOGIN ==================
  const loginBtn = document.querySelector(".login button");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.querySelector(".login input[type='email']").value.trim();
      const password = document.querySelector(".login input[type='password']").value;

      if (!email || !password) {
        alert("Vul e-mail en wachtwoord in!");
        return;
      }

      const isAdminLogin = email.toLowerCase().includes("admin");
      const endpoint = isAdminLogin
        ? `${API_URL}/auth/login`
        : `${API_URL}/register/login`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        // ⛔ ALTIJD eerst JSON lezen — ook bij error!
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message =
            data.message ||
            data.error ||
            "Er ging iets mis bij het inloggen.";
          alert(message);
          console.error("❌ Login failed:", data);
          return;
        }

        const token = data.access_token;

        if (!token) {
          alert("⚠️ Geen token ontvangen van server!");
          console.error("⚠️ Response bevat geen access_token", data);
          return;
        }

        // 🔑 Token opslaan
        localStorage.setItem("jwt", token);
        console.log("✅ Token opgeslagen in localStorage");

        // 🔍 Rol uitlezen
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.roles
          ? (Array.isArray(payload.roles) ? payload.roles : [payload.roles])
          : (payload.role ? [payload.role] : []);
        const rolesNormalized = roles.map(r => r.toUpperCase());

        console.log("👤 Ingelogde rollen:", rolesNormalized);

        // 🔀 Redirect
        if (rolesNormalized.includes('ADMIN')) {
          alert('Welkom admin!');
          window.location.href = '/dashboard';
        } else if (rolesNormalized.includes('USER')) {
          alert('Welkom gebruiker!');
          window.location.href = '/dashboarduser';
        } else {
          alert('Onbekende rol!');
        }

      } catch (err) {
        console.error("💥 Fout bij inloggen:", err);
        alert("Fout bij inloggen. Controleer netwerk of backend.");
      }
    });
    }

  // ================== REGISTRATIE ==================
  const sendEmailBtn = document.getElementById('sendEmail');
  if (sendEmailBtn) {
    sendEmailBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const school = document.getElementById('school').value.trim();
      const phone = document.getElementById('phone').value.trim();

      if (!email || !password || !firstName || !lastName || !school || !phone) {
        alert("Vul alle velden in!");
        return;
      }

      if (email.toLowerCase().includes('admin')) {
        alert("Gebruik geen e-mailadres met 'admin' erin. Dit is alleen voor beheerders.");
        return;
      }

      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*]).{12,}$/;
      if (!pwdRegex.test(password)) {
        alert("Wachtwoord voldoet niet aan de eisen! Minimaal 12 tekens, hoofdletter, kleine letter en speciaal teken.");
        return;
      }

      const lowerPwd = password.toLowerCase();
      if (lowerPwd.includes(firstName.toLowerCase()) || lowerPwd.includes(lastName.toLowerCase())) {
        alert("Wachtwoord mag geen naam bevatten!");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/register/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName, school, phone }),
        });

        const data = await response.json();
        if (data.success) {
          alert("Je aanvraag is verstuurd! De admin zal deze goedkeuren.");
        } else {
          alert("Er is iets misgegaan: " + data.message);
        }
      } catch (err) {
        console.error("💥 Fout bij versturen van registratieaanvraag:", err);
        alert("Fout bij versturen van aanvraag.");
      }
    });
  }

  // ================== TOGGLE PASSWORD ==================
  const togglePasswordBtn = document.querySelector(".toggle-password");
  const passwordInput = document.getElementById("password");
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePasswordBtn.textContent = "🔒";
      } else {
        passwordInput.type = "password";
        togglePasswordBtn.textContent = "🔓";
      }
    });
  }

  // ================== PHONE INPUT VALIDATION ==================
  const phoneInput = document.getElementById('phone');
  const phoneError = document.getElementById('phoneError');
  if (phoneInput && phoneError) {
    phoneInput.addEventListener('input', function() {
      const value = this.value.trim();
      const mobileRegex = /^(?:\+316|06)\d{8}$/;
      phoneError.style.display = mobileRegex.test(value) ? 'none' : 'inline';
    });
  }
});
