window.addEventListener('DOMContentLoaded', async () => {
  const API_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://workshoptest.wailsalutem-foundation.com';

  // --- CUSTOM MODAL FUNCTIES ---
  async function showAlert(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('customModal');
      const msgEl = document.getElementById('customModalMessage');
      const okBtn = document.getElementById('customModalOk');
      const cancelBtn = document.getElementById('customModalCancel');
      const closeBtn = modal.querySelector('.custom-close');

      msgEl.textContent = message;
      okBtn.style.display = 'none';       // Verberg OK-knop voor automatische sluiting
      cancelBtn.style.display = 'none';
      modal.classList.remove('fade-out'); // Reset fade-out
      modal.style.display = 'block';

      // Start fade-out na 1.5 seconde
      setTimeout(() => {
        modal.classList.add('fade-out');
      }, 1500);

      // Sluit modal volledig na 2 seconden
      setTimeout(() => {
        modal.style.display = 'none';
        resolve();
      }, 2000);
    });
  }

  // --- Haal token op uit localStorage ---
  const token = localStorage.getItem('jwt');
  if (!token) {
    await showAlert('Je bent niet ingelogd. Log eerst in.');
    return;
  }

  // DOM-elementen
  const profilePhoto = document.getElementById('profilePhoto');
  const photoInput = document.getElementById('photoInput');
  const form = document.querySelector('.form-grid');

  // --- PROFIELGEGEVENS OPHALEN ---
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Kon profiel niet ophalen');

    // Vul profieldisplay velden
    document.querySelector('.profile-name').textContent = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    document.querySelector('.profile-email').textContent = data.email || '';
    document.querySelector('.profile-school').textContent = data.school || '';

    // Vul inputvelden
    document.getElementById('fullname').value = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    document.getElementById('email').value = data.email || '';
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('school').value = data.school || '';

    // Toon bestaande profielfoto
    if (data.avatarUrl) profilePhoto.style.backgroundImage = `url(${data.avatarUrl})`;

  } catch (err) {
    await showAlert(`Er is een fout opgetreden`);
  }

  // --- PROFIEL FOTO UPLOAD LOGICA ---
  if (photoInput) {
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        profilePhoto.style.backgroundImage = `url(${e.target.result})`;
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const res = await fetch(`${API_URL}/users/me/avatar`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Kon foto niet uploaden');

        profilePhoto.style.backgroundImage = `url(${result.avatarUrl})`;
        await showAlert('Profielfoto is geüpdatet!');
      } catch (err) {
        await showAlert(`Fout`);
      }
    });
  }

  // --- PROFIEL TEKSTGEGEVENS OPSLAAN ---
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullname = document.getElementById('fullname').value.trim();
      const nameParts = fullname.split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updatedData = {
        firstName,
        lastName,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        school: document.getElementById('school').value.trim(),
      };

      try {
        const response = await fetch(`${API_URL}/users/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Kon profielgegevens niet opslaan.');

        await showAlert('Profielgegevens succesvol opgeslagen!');
      } catch (err) {
        await showAlert(`Fout bij het opslaan`);
      }
    });
  }

  // --- SIDEBAR LINKS ACTIVE LOGICA ---
  document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", function () {
      document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // --- MOBIELE SIDEBAR TOGGLE ---
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
  }

  // --- LOGOUT MODAL LOGICA ---
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const closeBtn = logoutModal ? logoutModal.querySelector('.close-btn') : null;

  function closeModal() {
    if (logoutModal) logoutModal.style.display = 'none';
  }

  // Open modal
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (logoutModal) logoutModal.style.display = 'flex';
    });
  }

  // Sluit modal
  if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  window.addEventListener('click', (event) => {
    if (event.target === logoutModal) closeModal();
  });

  // Bevestig logout
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      localStorage.removeItem('jwt');
      closeModal();
      window.location.href = "/";
    });
  }

});
