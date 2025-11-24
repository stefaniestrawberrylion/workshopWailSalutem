window.addEventListener('DOMContentLoaded', async () => {
  const API_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://workshoptest.wailsalutem-foundation.com';


  // Haal token op uit localStorage
  const token = localStorage.getItem('jwt');
  if (!token) {
    alert('Je bent niet ingelogd. Log eerst in.');
    // Optioneel: Stuur gebruiker door naar login pagina
    // window.location.href = '/login';
    return;
  }

  const profilePhoto = document.getElementById('profilePhoto');
  const photoInput = document.getElementById('photoInput');
  const form = document.querySelector('.form-grid'); // Selecteer het formulier

  try {
    // ✅ Haal profielgegevens op
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Kon profiel niet ophalen');
    }

    // Vul profieldisplay velden
    document.querySelector('.profile-name').textContent = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    document.querySelector('.profile-email').textContent = data.email || '';
    document.querySelector('.profile-school').textContent = data.school || '';

// Vul inputvelden
    document.getElementById('fullname').value = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    document.getElementById('email').value = data.email || '';
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('school').value = data.school || '';


    // ✅ Toon bestaande profielfoto
    if (data.avatarUrl) {
      profilePhoto.style.backgroundImage = `url(${data.avatarUrl})`;
    }

    // --- Profiel Foto Upload Logica (DIRECT BIJ CHANGE) ---
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files[0];
      if (!file) return;

      // Preview tonen
      const reader = new FileReader();
      reader.onload = e => {
        profilePhoto.style.backgroundImage = `url(${e.target.result})`;
      };
      reader.readAsDataURL(file);

      // Foto direct uploaden naar backend
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const res = await fetch(`${API_URL}/users/me/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || 'Kon foto niet uploaden');
        }

        // Backend returned URL updaten
        profilePhoto.style.backgroundImage = `url(${result.avatarUrl})`;
        alert('Profielfoto is geüpdatet!');
      } catch (err) {
        alert(`Fout bij uploaden: ${err.message}`);
      }
    });

    // --- Profiel Tekstgegevens Opslaan Logica (BIJ SUBMIT) ---
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Voorkom de standaard formulier submit

      const fullname = document.getElementById('fullname').value.trim();
      const nameParts = fullname.split(/\s+/); // Splits op één of meer spaties
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updatedData = {
        firstName: firstName,
        lastName: lastName,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        school: document.getElementById('school').value.trim(),
      };

      try {
        const response = await fetch(`${API_URL}/users/me`, {
          method: 'PUT', // Gebruik PUT om de volledige resource bij te werken
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Kon profielgegevens niet opslaan.');
        }

        alert('Profielgegevens succesvol opgeslagen!');

      } catch (err) {
        alert(`Fout bij het opslaan van gegevens: ${err.message}`);
      }
    });

  } catch (err) {
    alert(`Er is een fout opgetreden bij het ophalen van uw gegevens: ${err.message}`);
  }
  // LOGOUT
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('jwt');
      alert("Je bent uitgelogd!");
      window.location.href = "/";
    });
  }

  document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", function () {

      // Verwijder active van alle links
      document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));

      // Voeg active toe aan de geklikte link
      this.classList.add("active");
    });
  });

// --- Mobiele Sidebar Toggle Logica ---
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      // Gebruik 'sidebar-open' om de sidebar van links naar binnen te schuiven
      sidebar.classList.toggle('sidebar-open');
    });
  }

});