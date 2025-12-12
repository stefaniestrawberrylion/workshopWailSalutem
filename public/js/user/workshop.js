// workshop-core.js
document.addEventListener('DOMContentLoaded', () => {
  // =======================
  // Gedeelde Variabelen
  // =======================
  window.currentWorkshopId = null;
  window.selectedStars = 0;

  // =======================
  // API Base URL
  // =======================
  window.API_URL = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://workshoptest.wailsalutem-foundation.com";

  // =======================
  // Helper functies
  // =======================
  window.getAuthHeaders = function() {
    const token = localStorage.getItem("jwt");
    return { "Authorization": token?.startsWith("Bearer ") ? token : "Bearer " + token };
  };

  window.showError = function(message) {
    const popup = document.getElementById('workshopPopup');
    const popupVisible = popup?.style.display === 'block';
    const container = document.getElementById(popupVisible ? 'popupErrorContainer' : 'errorContainer');
    const messageBox = document.getElementById(popupVisible ? 'popupErrorMessage' : 'errorMessage');
    const closeBtn = document.getElementById(popupVisible ? 'closePopupErrorBtn' : 'closeErrorBtn');

    if (!container || !messageBox) return;

    messageBox.textContent = message;
    container.style.display = 'flex';

    closeBtn.onclick = () => container.style.display = 'none';

    clearTimeout(window.errorTimeout);
    window.errorTimeout = setTimeout(() => {
      container.style.display = 'none';
    }, 5000);
  };

  window.getFileIconClass = function(fileName) {
    if(!fileName) return 'fa-file';
    const ext = fileName.split('.').pop().toLowerCase();
    switch(ext){
      case 'pdf': return 'fa-file-pdf';
      case 'doc': case 'docx': return 'fa-file-word';
      case 'xls': case 'xlsx': return 'fa-file-excel';
      case 'ppt': case 'pptx': return 'fa-file-powerpoint';
      case 'zip': return 'fa-file-archive';
      case 'txt': return 'fa-file-lines';
      default: return 'fa-file';
    }
  };

  window.formatDuration = function(duration) {
    if (!duration) return "00:00";
    if (typeof duration === 'string' && duration.includes(':')) {
      const [h, m] = duration.split(':');
      return `${h.padStart(2,'0')}:${m.padStart(2,'0')}`;
    }
    const num = parseFloat(duration);
    if (isNaN(num)) return "00:00";
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`;
  };

  window.getContrastYIQ = function(hexcolor){
    hexcolor = hexcolor.replace('#','');
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return yiq >= 128 ? 'black' : 'white';
  };

  window.openFilePreview = function(f) {
    const fileUrl = f.url;
    const fileName = f.name || 'bestand';

    // Voor afbeeldingen
    if(fileName.match(/\.(jpeg|jpg|gif|png)$/i)) {
      const imgWindow = window.open('');
      imgWindow.document.write(`<img src="${fileUrl}" style="max-width:100%; height:auto;">`);
    }
    // Voor PDF
    else if(fileName.match(/\.pdf$/i)) {
      const pdfWindow = window.open(fileUrl, '_blank');
    }
    // Voor andere bestanden (fallback: download)
    else {
      window.showPopup("Preview niet beschikbaar, download het bestand om te bekijken.");
      window.open(fileUrl, '_blank');
    }
  };

  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
  }

  // Active link highlighting
  document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", function () {
      document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Back to dashboard
  const backBtn = document.getElementById("backToDashboardBtn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/dashboard";
    });
  }

  window.showPopup = function(message, type = 'info') {
    // type kan 'info', 'success', 'error' zijn
    let container = document.getElementById('customPopupContainer');
    if (!container) {
      // Maak het container element aan als het nog niet bestaat
      container = document.createElement('div');
      container.id = 'customPopupContainer';
      Object.assign(container.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        zIndex: 9999,
        color: '#fff',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '200px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      });
      document.body.appendChild(container);
    }

    // Achtergrondkleur op basis van type
    switch(type) {
      case 'success': container.style.backgroundColor = '#28a745'; break;
      case 'error': container.style.backgroundColor = '#dc3545'; break;
      default: container.style.backgroundColor = '#007bff'; // info
    }

    container.textContent = message;
    container.style.display = 'flex';

    // Auto hide na 4 seconden
    clearTimeout(window.popupTimeout);
    window.popupTimeout = setTimeout(() => {
      container.style.display = 'none';
    }, 4000);

    // Klik om te sluiten
    container.onclick = () => container.style.display = 'none';
  };




  // NIEUWE LOGOUT MET CUSTOM MODAL
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const closeBtn = logoutModal ? logoutModal.querySelector('.close-btn') : null;

  // Functie om de modal te sluiten
  function closeModal() {
    if (logoutModal) {
      logoutModal.style.display = 'none';
    }
  }

  // Functie om de modal te openen
  function openModal(e) {
    if (e) e.preventDefault();
    if (logoutModal) {
      logoutModal.style.display = 'flex'; // Gebruik 'flex' voor centering
    }
  }

  // Uitlogknop in de sidebar
  if (logoutBtn) {
    logoutBtn.addEventListener('click', openModal);
  }

  // Annuleren/Sluiten knoppen
  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', closeModal);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Sluiten wanneer de gebruiker buiten de modal klikt
  if (logoutModal) {
    window.addEventListener('click', (event) => {
      if (event.target === logoutModal) {
        closeModal();
      }
    });
  }

  // Bevestigen en uitloggen
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      // 1. Verwijder de JWT
      localStorage.removeItem('jwt');

      // 2. Sluit de pop-up
      closeModal();


      // 4. Redirect naar de homepage
      window.location.href = "/";
    });
  }

});