window.addEventListener('DOMContentLoaded', () => {

  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const logoutBtn = document.getElementById('logoutBtn');

  window.API_URL = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://workshoptest.wailsalutem-foundation.com";

  /**
   * Genereert een vereenvoudigde workshop kaart voor het dashboard.
   * Past de link aan om naar de workshop overzichtspagina te gaan met een anker naar de specifieke workshop.
   * @param {object} item - De workshop entiteit (kan genest zijn).
   * @returns {HTMLElement} De gemaakte div element van de kaart.
   */
  /**
   * Maakt een workshop kaart met particle hover-effect
   */
  function createDashboardWorkshopCard(item) {
    const workshop = item.workshop || item;
    const card = document.createElement('div');
    card.classList.add('card-item');

    const name = workshop.name || 'Onbekende Workshop';
    const description = workshop.description || "Geen beschrijving beschikbaar.";
    const displayDescription = description.length > 120 ? description.substring(0, 117) + '...' : description;
    const id = workshop.id || Math.floor(Math.random() * 1000000);
    const workshopLink = `/workshopuser#workshop-${id}`;

    // content container
    const content = document.createElement('div');
    content.className = 'card-content';
    content.innerHTML = `
    <h3>${escapeHtml(name)}</h3>
    <p>${escapeHtml(displayDescription)}</p>
    <div style="margin-top:10px;">
      <a class="btn" href="${workshopLink}">Bekijk Workshop</a>
    </div>
  `;

    // particles container
    const particles = document.createElement('div');
    particles.className = 'particles';

    for (let i = 1; i <= 8; i++) {
      const span = document.createElement('span');
      span.classList.add('p' + i);

      // random dx/dy
      const dx = Math.floor((Math.random() - 0.5) * 120); // -60..60 px
      const dy = -(Math.floor(40 + Math.random() * 70));   // -40 .. -110 px
      span.style.setProperty('--dx', dx + 'px');
      span.style.setProperty('--dy', dy + 'px');

      // randomize initial position
      const left = 6 + Math.floor(Math.random() * 88);
      const top = 6 + Math.floor(Math.random() * 88);
      span.style.left = left + '%';
      span.style.top = top + '%';

      particles.appendChild(span);
    }

    // append particles and content
    card.appendChild(particles);
    card.appendChild(content);

    // hover logic to trigger animation
    card.addEventListener('mouseenter', () => {
      particles.querySelectorAll('span').forEach(span => {
        span.style.animation = 'particleFloat 1.2s ease-out forwards';
      });
    });

    card.addEventListener('mouseleave', () => {
      particles.querySelectorAll('span').forEach(span => {
        span.style.animation = 'none'; // reset animation
      });
    });

    return card;
  }

  /**
   * Escape HTML om injection te voorkomen
   */
  function escapeHtml(unsafe) {
    return unsafe
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  /**
   * Vult een dashboard sectie dynamisch met workshops.
   * @param {string} containerId - De ID van de HTML-container (b.v. 'favoriteWorkshopsContainer').
   * @param {string} title - De titel van de sectie voor fout- en laadberichten.
   * @param {Promise<Array>} fetchPromise - De Promise die de data van de workshops ophaalt.
   */
  function fillWorkshopSection(containerId, title, fetchPromise) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div class="loading-message">Laden van ${title}...</div>`;

    fetchPromise
      .then(data => {
        container.innerHTML = '';

        if (data.length === 0) {
          let message;
          if(containerId === 'favoriteWorkshopsContainer') {
            message = 'Je hebt nog geen favoriete workshops.';
          } else if (containerId === 'newWorkshopsContainer') {
            message = 'Er zijn momenteel geen nieuwe workshops.';
          } else {
            message = `Geen ${title} gevonden.`;
          }
          container.innerHTML = `<div class="no-results">${message}</div>`;
          return;
        }

        data.forEach(item => {
          container.appendChild(createDashboardWorkshopCard(item));
        });
      })
      .catch(error => {
        console.error(`Fout bij laden van ${title}:`, error);
        container.innerHTML = `<div class="error-message">Fout bij het laden van ${title}.</div>`;
      });
  }

  // --- API FETCH FUNCTIES (LET OP: ENDPOINTS MOETEN BESTAAN OP DE BACKEND) ---

  /** Haalt favoriete workshops van de gebruiker op. */
  function fetchFavoriteWorkshops() {
    const token = localStorage.getItem('jwt');
    if (!token) return Promise.resolve([]);

    return fetch(`${window.API_URL}/favorites`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      });
  }

  function fetchTopRatedWorkshops() {
    return fetch(`${window.API_URL}/workshops/top-rated?limit=4`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      });
  }


  /** Haalt de nieuwste workshops op (gesorteerd op aanmaakdatum). */
  function fetchNewestWorkshops() {
    // Haal de 2 nieuwste op
    return fetch(`${window.API_URL}/workshops/newest?limit=4`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      });
  }


  // --- DOM CONTENT LOADED LOGICA ---

  // MOBILE SIDEBAR
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
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

  // Sidebar 'active' class
  document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", function () {
      document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Vul de workshop secties
  fillWorkshopSection('favoriteWorkshopsContainer', 'favoriete workshops', fetchFavoriteWorkshops());
  fillWorkshopSection('popularWorkshopsContainer', 'top gewaardeerde workshops', fetchTopRatedWorkshops());
  fillWorkshopSection('newWorkshopsContainer', 'nieuwe workshops', fetchNewestWorkshops());


});