document.addEventListener('DOMContentLoaded', () => {

  // ================== CUSTOM POPUP FUNCTIE ==================
  const popupContainer = document.getElementById('customPopupContainer');

  function showCustomPopup(message, type = 'error', duration = 5000) {
    if (!popupContainer) {
      return;
    }

    // Bestaande pop-ups verbergen/verwijderen
    while (popupContainer.firstChild) {
      popupContainer.removeChild(popupContainer.firstChild);
    }

    const popup = document.createElement('div');
    popup.className = `custom-popup ${type}`;
    popup.innerHTML = `
      <p>${message}</p>
      <span class="close-btn">&times;</span>
    `;

    // Voeg toe aan DOM
    popupContainer.appendChild(popup);

    // Zorgt voor de 'fade in'
    requestAnimationFrame(() => {
      popup.classList.add('visible');
    });

    // Event listener voor handmatig sluiten
    popup.querySelector('.close-btn').addEventListener('click', () => {
      popup.classList.remove('visible');
      popup.classList.add('fading-out');
      setTimeout(() => popup.remove(), 300);
      clearTimeout(timeoutId);
    });

    // Automatisch laten verdwijnen na 'duration'
    const timeoutId = setTimeout(() => {
      popup.classList.remove('visible');
      popup.classList.add('fading-out');
      setTimeout(() => popup.remove(), 300);
    }, duration);
  }
  // =========================================================

  // ================== API BASE URL ==================
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://workshoptest.wailsalutem-foundation.com";

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
        showCustomPopup("Vul e-mail en wachtwoord in!", 'error');
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

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message =
            data.message ||
            data.error ||
            "Er ging iets mis bij het inloggen.";
          showCustomPopup(message, 'error');
          return;
        }

        const token = data.access_token;

        if (!token) {
          showCustomPopup("⚠️ Geen token ontvangen van server!", 'error');
          return;
        }

        localStorage.setItem("jwt", token);

        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.roles
          ? (Array.isArray(payload.roles) ? payload.roles : [payload.roles])
          : (payload.role ? [payload.role] : []);
        const rolesNormalized = roles.map(r => r.toUpperCase());

        if (rolesNormalized.includes('ADMIN')) {
          showCustomPopup('Welkom admin!', 'success', 1000);
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else if (rolesNormalized.includes('USER')) {
          showCustomPopup('Welkom gebruiker!', 'success', 1000);
          setTimeout(() => {
            window.location.href = '/dashboarduser';
          }, 1000);
        } else {
          showCustomPopup('Onbekende rol!', 'error');
        }

      } catch (err) {
        showCustomPopup("Fout bij inloggen. Controleer netwerk of backend.", 'error');
      }
    });
  }

  // ================== ENTER TO LOGIN ==================
  const loginInputs = document.querySelectorAll(
    ".login input[type='email'], .login input[type='password']"
  );

  loginInputs.forEach(input => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        loginBtn.click();
      }
    });
  });

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
        showCustomPopup("Vul alle velden in!", 'error');
        return;
      }

      if (email.toLowerCase().includes('admin')) {
        showCustomPopup("Dit e-mailadres is niet toegestaan voor registratie. Gebruik een ander adres.", 'error');
        return;
      }

      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*]).{12,}$/;
      if (!pwdRegex.test(password)) {
        showCustomPopup("Wachtwoord voldoet niet aan de eisen! Minimaal 12 tekens, hoofdletter, kleine letter en speciaal teken.", 'error');
        return;
      }

      const lowerPwd = password.toLowerCase();
      if (lowerPwd.includes(firstName.toLowerCase()) || lowerPwd.includes(lastName.toLowerCase())) {
        showCustomPopup("Wachtwoord mag geen naam bevatten!", 'error');
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
          showCustomPopup("Je aanvraag is verstuurd! De admin zal deze goedkeuren.", 'success');
          document.getElementById('registrationForm').reset();
          cardContainer.classList.remove('show-email');
          cardContainer.classList.add('reset');
        } else {
          showCustomPopup("Er is iets misgegaan: " + data.message, 'error');
        }
      } catch (err) {
        showCustomPopup("Fout bij versturen van aanvraag. Controleer netwerk of backend.", 'error');
      }
    });
  }

  // ================== ENTER TO REGISTER ==================
  const registrationForm = document.getElementById("registrationForm");

  if (registrationForm && sendEmailBtn) {
    registrationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      sendEmailBtn.click();
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

  // ================== FORGOT PASSWORD FUNCTIONALITY ==================
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const forgotPasswordSection = document.getElementById('forgotPasswordSection');
  const loginSection = document.querySelector('.login');
  const emailInputSection = document.querySelector('.email-input');
  const sendResetLinkBtn = document.getElementById('sendResetLink');
  const backToLoginFromForgot = document.getElementById('backToLoginFromForgot');

// Scherm wisselen naar wachtwoord vergeten
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Zorg ervoor dat we in de normale login modus zijn (niet in registratie)
      cardContainer.classList.remove('show-email');
      cardContainer.classList.add('reset');

      // Verberg de login en toon de wachtwoord-vergeten sectie
      if (loginSection) loginSection.style.display = 'none';
      if (emailInputSection) emailInputSection.style.display = 'none';
      if (forgotPasswordSection) {
        forgotPasswordSection.style.display = 'flex';
        // Zorg ervoor dat de CSS animatie werkt
        forgotPasswordSection.style.opacity = '1';
        forgotPasswordSection.style.pointerEvents = 'auto';
      }
    });
  }

// Terug naar login vanuit wachtwoord vergeten
  if (backToLoginFromForgot) {
    backToLoginFromForgot.addEventListener('click', () => {
      // Terug naar de normale login weergave
      cardContainer.classList.remove('show-email');
      cardContainer.classList.add('reset');

      // Toon login, verberg email input en forgot password
      if (loginSection) {
        loginSection.style.display = 'flex';
        loginSection.style.opacity = '1';
        loginSection.style.pointerEvents = 'auto';
      }
      if (emailInputSection) emailInputSection.style.display = 'none';
      if (forgotPasswordSection) {
        forgotPasswordSection.style.display = 'none';
        forgotPasswordSection.style.opacity = '0';
        forgotPasswordSection.style.pointerEvents = 'none';
      }
    });
  }

// API Request voor wachtwoord herstel
  if (sendResetLinkBtn) {
    sendResetLinkBtn.addEventListener('click', async () => {
      const email = document.getElementById('forgotEmail').value.trim();
      if (!email) {
        showCustomPopup("Vul aub je e-mailadres in.", 'error');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/register/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        showCustomPopup("Als dit account bestaat, is er een instructie gestuurd.", 'success');

        // Terug naar login
        if (loginSection) {
          loginSection.style.display = 'flex';
          loginSection.style.opacity = '1';
          loginSection.style.pointerEvents = 'auto';
        }
        if (emailInputSection) emailInputSection.style.display = 'none';
        if (forgotPasswordSection) {
          forgotPasswordSection.style.display = 'none';
          forgotPasswordSection.style.opacity = '0';
          forgotPasswordSection.style.pointerEvents = 'none';
        }

        // Reset het email veld
        document.getElementById('forgotEmail').value = '';

      } catch (err) {
        showCustomPopup("Fout bij het aanvragen van wachtwoord herstel.", 'error');
      }
    });
  }

  // ENTER to send reset link
  const forgotEmailInput = document.getElementById('forgotEmail');
  if (forgotEmailInput && sendResetLinkBtn) {
    forgotEmailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendResetLinkBtn.click();
      }
    });
  }
});