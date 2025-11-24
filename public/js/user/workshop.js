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
      alert('Preview niet beschikbaar, download het bestand om te bekijken.');
      window.open(fileUrl, '_blank');
    }
  };

  // =======================
  // Sidebar en navigatie
  // =======================
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('jwt');
      alert("Je bent uitgelogd!");
      window.location.href = "/";
    });
  }

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
});