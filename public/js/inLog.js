document.addEventListener('DOMContentLoaded', () => {
  console.log("🟢 inlog.js geladen");

  // ================== API Base URL ==================
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://workshoptest.wailsalutem-foundation.com";

  console.log("Backend URL:", API_URL);

  // ================== Panel Switching ==================
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

      console.log("🔐 Login attempt:", email);

      // ✨ Slim bepalen of het om een admin gaat
      const isAdminLogin = email.toLowerCase().includes("admin");
      const endpoint = isAdminLogin
        ? `${API_URL}/auth/login`
        : `${API_URL}/register/login`;

      console.log("🌐 Login endpoint:", endpoint);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        console.log("📡 Response status:", response.status);

        if (!response.ok) {
          let message = "Login mislukt.";
          try {
            const data = await response.json();
            console.error("❌ Login failed:", data);

            // Backend geeft nu specifieke fouten bij DENIED of PENDING
            if (data.message) {
              message = data.message;
            } else if (response.status === 403) {
              message = "Uw account is nog niet goedgekeurd of is geweigerd.";
            } else if (response.status === 401) {
              message = "Ongeldige e-mail of wachtwoord.";
            }
          } catch (parseError) {
            console.error("⚠️ Kon foutmelding niet parsen:", parseError);
          }

          alert(message);
          return; // stop direct bij fout
        }

        // ✅ Lees token uit body
        const data = await response.json();
        console.log("📦 Response body:", data);

        const token = data.access_token;
        if (!token) {
          alert("⚠️ Geen token ontvangen van server!");
          console.error("⚠️ Response bevat geen access_token veld");
          return;
        }

        // ✅ Sla token op in localStorage
        localStorage.setItem("jwt", token);
        console.log("✅ Token opgeslagen in localStorage");

        // ✅ Decodeer token en controleer rol
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.roles
          ? (Array.isArray(payload.roles) ? payload.roles : [payload.roles])
          : (payload.role ? [payload.role] : []);

        console.log("👤 Ingelogde rollen:", roles);

        if (roles.includes('ADMIN')) {
          alert('Welkom admin!');
          window.location.href = '/dashboard';
        } else if (roles.includes('USER')) {
          alert('Welkom gebruiker!');
          window.location.href = '/dashboarduser';
        } else {
          alert('Onbekende rol!');
        }

      } catch (err) {
        console.error("💥 Fout bij inloggen:", err);
        alert("Fout bij inloggen. Controleer netwerkverbinding of backend.");
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

      // ❌ Verbied e-mails met 'admin'
      if (email.toLowerCase().includes('admin')) {
        alert("Gebruik geen e-mailadres met 'admin' erin. Dit is alleen voor beheerders.");
        return;
      }

      // ✅ Controleer wachtwoordvereisten
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
        console.error(err);
        alert("Fout bij versturen van aanvraag.");
      }
    });
  }

  // ================== TOGGLE PASSWORD ==================
  const togglePasswordBtn = document.querySelector(".toggle-password");
  const passwordInput = document.getElementById("password");

  if (togglePasswordBtn) {
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
  const phoneInput = document.getElementById('phone');
  const phoneError = document.getElementById('phoneError');

  phoneInput.addEventListener('input', function() {
    const value = this.value.trim();

    // Regex: alleen mobiel nummer toegestaan (06 of +316)
    const mobileRegex = /^(?:\+316|06)\d{8}$/;

    if (!mobileRegex.test(value)) {
      phoneError.style.display = 'inline';
    } else {
      phoneError.style.display = 'none';
    }
  });
});
