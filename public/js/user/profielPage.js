window.addEventListener('DOMContentLoaded', async () => {
  const API_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://workshoptest.wailsalutem-foundation.com';

  console.log('Backend URL:', API_URL);

  // Haal token op uit localStorage
  const token = localStorage.getItem('jwt');
  if (!token) {
    alert('Je bent niet ingelogd. Log eerst in.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // ⚠️ Token meegeven
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend fout:', data);
      throw new Error(data.message || 'Kon profiel niet ophalen');
    }

    document.getElementById('fullname').value = `${data.firstName} ${data.lastName}`;
    document.getElementById('email').value = data.email;
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('school').value = data.school || '';
  } catch (err) {
    console.error(err);
    alert(`Er is een fout opgetreden bij het ophalen van uw gegevens: ${err.message}`);
  }
});
