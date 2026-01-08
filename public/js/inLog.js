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
      cardContainer.classList.remove('show-forgot');
    });
  }

  if (backToLogin) {
    backToLogin.addEventListener('click', () => {
      cardContainer.classList.remove('show-email');
      cardContainer.classList.add('reset');
      cardContainer.classList.remove('show-forgot');
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
          cardContainer.classList.remove('show-forgot');
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
  const sendResetLinkBtn = document.getElementById('sendResetLink');
  const backToLoginFromForgot = document.getElementById('backToLoginFromForgot');

  // Scherm wisselen naar wachtwoord vergeten
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Eerst resetten naar login modus, dan naar forgot modus
      cardContainer.classList.remove('show-email');
      cardContainer.classList.remove('reset');
      cardContainer.classList.add('show-forgot');
    });
  }

  // Terug naar login vanuit wachtwoord vergeten
  if (backToLoginFromForgot) {
    backToLoginFromForgot.addEventListener('click', () => {
      // ALTIJD terug naar normale login modus (reset)
      cardContainer.classList.remove('show-email');
      cardContainer.classList.remove('show-forgot');
      cardContainer.classList.add('reset');

      // Reset het email veld
      document.getElementById('forgotEmail').value = '';
    });
  }

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

        await response.json();

        // Laat popup zien om resetcode + nieuw wachtwoord in te vullen
        showResetPasswordPopup(email);

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
  function showResetPasswordPopup(email) {
    if (!popupContainer) return;

    // 1. Overlay maken (beslaat het hele scherm)
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.6)'; // Iets donkerder voor betere focus
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';     // Verticaal centreren
    overlay.style.justifyContent = 'center';  // Horizontaal centreren
    overlay.style.zIndex = '10000';           // Zorg dat dit boven alles staat
    overlay.style.opacity = '0';              // Voor de fade-in animatie
    overlay.style.transition = 'opacity 0.3s ease';
    overlay.classList.add('reset-password-overlay');

    // 2. Popup maken
    const popup = document.createElement('div');
    popup.style.background = '#fff';
    popup.style.borderRadius = '12px';
    popup.style.padding = '30px 25px';
    popup.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    popup.style.maxWidth = '400px';
    popup.style.width = '90%';
    popup.style.textAlign = 'center';
    popup.style.position = 'relative';
    popup.style.fontFamily = 'Arial, sans-serif';
    popup.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    popup.style.transform = 'scale(0.8)'; // Start iets kleiner voor 'pop' effect
    popup.style.opacity = '0';

    popup.innerHTML = `
    <h3 style="color:#0056b3; margin-bottom:10px; margin-top:0;">Wachtwoord herstellen</h3>
    <p style="font-size: 0.9rem; margin-bottom:15px; color:#333;">Vul de resetcode uit je e-mail in en kies een nieuw wachtwoord.</p>
    <input type="email" id="resetEmail" value="${email}" readonly 
      style="margin-bottom:10px; width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; background:#f9f9f9;">
    <input type="text" id="resetCode" placeholder="Resetcode" 
      style="margin-bottom:10px; width:100%; padding:10px; border-radius:6px; border:1px solid #ccc;">
    <input type="password" id="newPassword" placeholder="Nieuw wachtwoord" 
      style="margin-bottom:10px; width:100%; padding:10px; border-radius:6px; border:1px solid #ccc;">
    <input type="password" id="confirmPassword" placeholder="Herhaal wachtwoord" 
      style="margin-bottom:20px; width:100%; padding:10px; border-radius:6px; border:1px solid #ccc;">
    <button id="submitResetPassword" 
      style="width:100%; padding:12px; border:none; border-radius:8px; background:#0056b3; color:#fff; font-weight:bold; cursor:pointer; transition: background 0.2s;">Reset wachtwoord</button>
    <span class="close-btn" 
      style="position:absolute; top:10px; right:15px; font-size:24px; cursor:pointer; color:#888;">&times;</span>
  `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay); // Direct aan de body toevoegen werkt vaak beter voor centering

    // 3. Animatie starten
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      popup.style.transform = 'scale(1)';
      popup.style.opacity = '1';
    });

    // 4. Sluit functionaliteit (met fade-out)
    const closePopup = () => {
      overlay.style.opacity = '0';
      popup.style.transform = 'scale(0.8)';
      setTimeout(() => overlay.remove(), 300);
    };

    popup.querySelector('.close-btn').addEventListener('click', closePopup);

    // Sluit ook als je buiten de popup klikt
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });

    // 5. Submit logica
    const submitBtn = popup.querySelector('#submitResetPassword');
    submitBtn.addEventListener('click', async () => {
      const code = popup.querySelector('#resetCode').value.trim();
      const newPassword = popup.querySelector('#newPassword').value;
      const confirmPassword = popup.querySelector('#confirmPassword').value;

      if (!code || !newPassword || !confirmPassword) {
        showCustomPopup('Vul alle velden in!', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showCustomPopup('Wachtwoorden komen niet overeen!', 'error');
        return;
      }

      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*]).{12,}$/;
      if (!pwdRegex.test(newPassword)) {
        showCustomPopup("Wachtwoord voldoet niet aan de eisen! Minimaal 12 tekens, hoofdletter, kleine letter en speciaal teken.", 'error');
        return;
      }

      const lowerPwd = newPassword.toLowerCase();
      const nameParts = email.split('@')[0].split(/[._-]/);
      if (nameParts.some(part => part && lowerPwd.includes(part))) {
        showCustomPopup("Wachtwoord mag geen deel van je e-mail bevatten!", 'error');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/register/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, password: newPassword }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const msg = data.message || "Fout bij resetten wachtwoord";
          showCustomPopup(msg, 'error');
          return;
        }

        showCustomPopup("Wachtwoord succesvol gereset! Je wordt teruggestuurd naar inloggen.", 'success');
        closePopup();

        setTimeout(() => {
          if (typeof cardContainer !== 'undefined') {
            cardContainer.classList.remove('show-forgot');
            cardContainer.classList.add('reset');
          }
        }, 1500);

      } catch (err) {
        showCustomPopup("Fout bij resetten wachtwoord. Controleer netwerk of backend.", 'error');
      }
    });
  }function showResetPasswordPopup(email) {
    if (!popupContainer) return;

    // 1. Overlay maken (volledig scherm & gecentreerd)
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    overlay.classList.add('reset-password-overlay');

    // 2. Popup maken
    const popup = document.createElement('div');
    popup.style.background = '#fff';
    popup.style.borderRadius = '12px';
    popup.style.padding = '30px 25px';
    popup.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    popup.style.maxWidth = '400px';
    popup.style.width = '90%';
    popup.style.textAlign = 'center';
    popup.style.position = 'relative';
    popup.style.fontFamily = 'Arial, sans-serif';
    popup.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    popup.style.transform = 'scale(0.8)';
    popup.style.opacity = '0';

    // Helper voor input styling om herhaling te voorkomen
    const inputStyle = `width:100%; padding:10px; padding-right:40px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;`;
    const groupStyle = `position:relative; margin-bottom:10px; width:100%;`;
    const toggleStyle = `position:absolute; right:10px; top:50%; transform:translateY(-50%); cursor:pointer; color:#888; font-size:18px; user-select:none;`;

    popup.innerHTML = `
    <h3 style="color:#0056b3; margin-bottom:10px; margin-top:0;">Wachtwoord herstellen</h3>
    <p style="font-size: 0.9rem; margin-bottom:15px; color:#333;">Vul de gegevens in om je wachtwoord te wijzigen.</p>
    
    <div style="${groupStyle}">
      <input type="email" id="resetEmail" value="${email}" readonly style="${inputStyle} background:#f9f9f9;">
    </div>

    <div style="${groupStyle}">
      <input type="text" id="resetCode" placeholder="Resetcode" style="${inputStyle}">
    </div>

    <div style="${groupStyle}">
      <input type="password" id="newPassword" placeholder="Nieuw wachtwoord" style="${inputStyle}">
      <span class="pw-toggle" data-target="newPassword" style="${toggleStyle}">👁️</span>
    </div>

    <div style="${groupStyle}">
      <input type="password" id="confirmPassword" placeholder="Herhaal wachtwoord" style="${inputStyle}">
      <span class="pw-toggle" data-target="confirmPassword" style="${toggleStyle}">👁️</span>
    </div>

    <button id="submitResetPassword" 
      style="width:100%; padding:12px; border:none; border-radius:8px; background:#0056b3; color:#fff; font-weight:bold; cursor:pointer; margin-top:10px;">
      Reset wachtwoord
    </button>
    
    <span class="close-btn" style="position:absolute; top:10px; right:15px; font-size:24px; cursor:pointer; color:#888;">&times;</span>
  `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // 3. Animatie in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      popup.style.transform = 'scale(1)';
      popup.style.opacity = '1';
    });

    // 4. Toggle Logica
    popup.querySelectorAll('.pw-toggle').forEach(toggle => {
      toggle.addEventListener('click', function() {
        const inputId = this.getAttribute('data-target');
        const input = popup.querySelector(`#${inputId}`);
        if (input.type === 'password') {
          input.type = 'text';
          this.textContent = '🔒'; // Of een ander icoontje
        } else {
          input.type = 'password';
          this.textContent = '👁️';
        }
      });
    });

    // 5. Sluiten & Submit
    const closePopup = () => {
      overlay.style.opacity = '0';
      popup.style.transform = 'scale(0.8)';
      setTimeout(() => overlay.remove(), 300);
    };

    popup.querySelector('.close-btn').addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });

    const submitBtn = popup.querySelector('#submitResetPassword');
    submitBtn.addEventListener('click', async () => {
      const code = popup.querySelector('#resetCode').value.trim();
      const newPassword = popup.querySelector('#newPassword').value;
      const confirmPassword = popup.querySelector('#confirmPassword').value;

      if (!code || !newPassword || !confirmPassword) {
        showCustomPopup('Vul alle velden in!', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showCustomPopup('Wachtwoorden komen niet overeen!', 'error');
        return;
      }

      // Wachtwoord validatie regex
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*]).{12,}$/;
      if (!pwdRegex.test(newPassword)) {
        showCustomPopup("Wachtwoord voldoet niet aan de eisen!", 'error');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/register/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, password: newPassword }),
        });

        if (!response.ok) {
          const data = await response.json();
          showCustomPopup(data.message || "Fout bij resetten", 'error');
          return;
        }

        showCustomPopup("Wachtwoord succesvol gereset!", 'success');
        closePopup();
        setTimeout(() => {
          cardContainer.classList.remove('show-forgot');
          cardContainer.classList.add('reset');
        }, 1500);

      } catch (err) {
        showCustomPopup("Netwerkfout.", 'error');
      }
    });
  }
});