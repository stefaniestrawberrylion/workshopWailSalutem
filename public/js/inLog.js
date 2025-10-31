document.addEventListener('DOMContentLoaded', () => {

  // ================== JWT & ROLCHECK (ADMIN TOEGANG) ==================
  const token = localStorage.getItem('jwt');
  if (!token) {
    alert('Niet ingelogd!');
    window.location.href = '/inlog';
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const roles = Array.isArray(payload.roles) ? payload.roles : [payload.roles];

    if (!roles.includes('ADMIN')) {
      alert('Geen toegang!');
      window.location.href = '/dashboarduser';
      return;
    }
  } catch (err) {
    console.error('Fout bij het decoderen van JWT:', err);
    localStorage.removeItem('jwt');
    window.location.href = '/inlog';
    return;
  }

  // ================== API Base URL ==================
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://workshoptest.wailsalutem-foundation.com";


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

  // ================== Login ==================
  const loginBtn = document.querySelector(".login button");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.querySelector(".login input[type='email']").value.trim();
      const password = document.querySelector(".login input[type='password']").value;

      if (!email || !password) {
        alert("Vul e-mail en wachtwoord in!");
        return;
      }

      console.log("Backend URL:", API_URL);

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          alert("Login mislukt: " + (data.message || response.status));
          return;
        }

        // ✅ Lees token uit body (veiliger & zekerder)
        const data = await response.json();
        const token = data.access_token;
        if (!token) {
          alert("Geen token ontvangen!");
          return;
        }

        localStorage.setItem("jwt", token);

        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.roles
          ? (Array.isArray(payload.roles) ? payload.roles : [payload.roles])
          : (payload.role ? [payload.role] : []);

        if (!roles.includes('ADMIN')) {
          alert('Geen toegang!');
          window.location.href = '/dashboarduser';
          return;
        }


      } catch (err) {
        console.error("Fout bij inloggen:", err);
        alert("Fout bij inloggen. Controleer netwerkverbinding.");
      }
    });
  }

  // ================== Fetch Workshops (ADMIN alleen) ==================
  async function fetchWorkshops() {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/workshops`, {
        headers: { "Authorization": "Bearer " + token },
      });

      if (response.ok) {
        const workshops = await response.json();
        console.log(workshops);
      } else {
        console.error("Failed fetching workshops", response.status);
      }
    } catch (err) {
      console.error("Error fetching workshops:", err);
    }
  }

  // ================== Registratie ==================
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

  // ================== Toggle Password ==================
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

}); // einde DOMContentLoaded
