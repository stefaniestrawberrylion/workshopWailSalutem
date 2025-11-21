document.addEventListener('DOMContentLoaded', () => {

  // =======================
  // Elementen ophalen
  // =======================
  // ... (Alle elementen ophalen hier) ...
  const popup = document.getElementById('workshopPopup');
  const closeBtn = document.getElementById('closePopupBtn');
  const grid = document.getElementById('workshopGrid');
  const detailsPopup = document.getElementById('workshopDetailsPopup');
  const closeDetailsBtn = document.getElementById('closeDetailsPopupBtn');
  const closeDetailsBtnCancel = document.getElementById('closePopupBtnCancel');

  const mainImageInput = document.getElementById('workshopMainImage');
  const workshopImagesInput = document.getElementById('workshopImages');
  const workshopVideoInput = document.getElementById('workshopVideo');
  const workshopFilesInput = document.getElementById('workshopFiles');

  const labelPreview = document.getElementById('labelPreview');
  const detailLabelPreview = document.getElementById('detailLabelPreview');

  const searchInput = document.getElementById('searchInput');
  const prevBtn = document.getElementById('prevDetailMedia');
  const nextBtn = document.getElementById('nextDetailMedia');

  const workshopPreview = document.getElementById('workshopPreview');
  const workshopFilePreview = document.getElementById('workshopFilePreview');

  const detailInstructionsList = document.getElementById('detail_instructionsList');
  const detailManualsList = document.getElementById('detail_manualsList');
  const detailDemoList = document.getElementById('detail_demoList');
  const detailWorksheetsList = document.getElementById('detail_worksheetsList');

  const lightbox = document.getElementById('mediaLightbox');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const closeLightbox = document.querySelector('.close-lightbox');

  // =======================
  // Gedeelde Variabelen
  // =======================
  let currentWorkshopId = null; // ✅ Deze variabele is nu centraal
  let selectedStars = 0; // ✅ Gedeeld met de review module

  let labels = [];
  let mainImage = null;
  let selectedMedia = [];
  let selectedFiles = [];

  // =======================
  // Helper functies
  // =======================
  function getAuthHeaders() {
    const token = localStorage.getItem("jwt");
    return { "Authorization": token?.startsWith("Bearer ") ? token : "Bearer " + token };
  }

  // =======================
  // API Base URL
  // =======================
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000" // lokale backend
      : "https://workshoptest.wailsalutem-foundation.com"; // productie backend

  console.log("Backend URL:", API_URL);

  function showError(message) {
    const popupVisible = popup?.style.display === 'block';
    const container = document.getElementById(popupVisible ? 'popupErrorContainer' : 'errorContainer');
    const messageBox = document.getElementById(popupVisible ? 'popupErrorMessage' : 'errorMessage');
    const closeBtn = document.getElementById(popupVisible ? 'closePopupErrorBtn' : 'closeErrorBtn');

    if (!container || !messageBox) return;

    messageBox.textContent = message;
    container.style.display = 'flex';

    closeBtn.onclick = () => container.style.display = 'none';

    clearTimeout(window.errorTimeout);
    window.errorTimeout = setTimeout(() => { container.style.display = 'none'; }, 5000);
  }

  function getFileIconClass(fileName) {
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
  }

  function formatDuration(duration) {
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
  }

  function getContrastYIQ(hexcolor){
    hexcolor = hexcolor.replace('#','');
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return yiq >= 128 ? 'black' : 'white';
  }


  function clearDetailsPopup(){
    currentWorkshopId = null;
    ['detailName','detailDesc','detailDuration'].forEach(id => document.getElementById(id).value='');
    detailLabelPreview.innerHTML = '';
    [detailInstructionsList, detailManualsList, detailDemoList, detailWorksheetsList].forEach(list => { if(list) list.innerHTML=''; });
    const mediaContainer = document.getElementById('detailMediaContainer');
    if(mediaContainer) mediaContainer.innerHTML='';
  }


  function openFilePreview(f) {
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
  }

  // =======================
  // Load workshops
  // =======================
  async function loadWorkshops() {
    try {
      const res = await fetch(`${API_URL}/api/workshops`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Fout bij ophalen workshops');
      const workshops = await res.json();
      renderWorkshops(workshops);
    } catch (e) {
      alert(e.message);
    }
  }

  // ---------------------------------
  // RENDER WORKSHOPS (AANGEPAST VOOR STERREN)
  // ---------------------------------
  function renderWorkshops(workshops) {
    grid.innerHTML = '';

    workshops.forEach(w => {
      const card = document.createElement('div');
      card.classList.add('workshop-card');

      // Pak de eerste afbeelding, fallback naar main image of default
      let firstImage = w.files?.find(f => f.type?.startsWith('image'));
      let imageUrl = '/image/default-workshop.png';

      if (firstImage) {
        const rawUrl = firstImage.url || firstImage.name;
        if (rawUrl) {
          const fileName = rawUrl.split(/[/\\]/).pop();
          imageUrl = `${API_URL}/uploads/${encodeURIComponent(fileName)}`;
        }
      } else if (w.imagePath) {
        const fileName = w.imagePath.split(/[/\\]/).pop();
        imageUrl = `${API_URL}/uploads/${encodeURIComponent(fileName)}`;
      }

      // Zet de achtergrond op de card zelf
      card.style.backgroundImage = `url('${imageUrl}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';

      const durationStr = formatDuration(w.duration) + " uur";

      // --- REVIEW GEMIDDELDE VAN DE WORKSHOP ---
      let reviewCount = (w.reviews && Array.isArray(w.reviews)) ? w.reviews.length : 0;
      let averageStars = 0;
      let reviewContent = 'Nog geen review';

      if (reviewCount > 0) {
        averageStars = w.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / reviewCount;
        const rounded = Math.round(averageStars);
        const filledStars = Array(rounded).fill('<i class="fa-solid fa-star filled-star"></i>').join('');
        const emptyStars = Array(5 - rounded).fill('<i class="fa-regular fa-star"></i>').join('');
        reviewContent = `<div class="stars-summary">${filledStars}${emptyStars} (${reviewCount})</div>`;
      }


      // --- EINDE: REVIEW CONTENT AANPASSING ---


      card.innerHTML = `
      <div class="workshop-top">
        <div class="workshop-badge time">${durationStr}</div>
        <div class="like">♡</div>
      </div>
      <div class="workshop-info">
        <h3>${w.name}</h3>
        <p>${reviewContent}</p> </div>
      <button class="workshop-btn">Bekijk workshop</button>
    `;

      // Like knop
      const likeBadge = card.querySelector('.like');
      likeBadge.addEventListener('click', () => {
        likeBadge.textContent = likeBadge.textContent === '♡' ? '❤️' : '♡';
      });

      // Open details popup
      const btn = card.querySelector('.workshop-btn');
      btn.addEventListener('click', () => viewWorkshopDetails(w.id));

      grid.appendChild(card);
    });
  }


  // =======================
  // View workshop details
  // =======================
  async function viewWorkshopDetails(id) {
    try {
      currentWorkshopId = id;

      // Haal workshop op
      const resWorkshop = await fetch(`${API_URL}/api/workshops/${id}`, { headers: getAuthHeaders() });
      if (!resWorkshop.ok) throw new Error('Workshop niet gevonden');
      const workshop = await resWorkshop.json();

      const detailMyReviewStars = document.getElementById('detailMyReviewStars');
      detailMyReviewStars.style.cursor = 'pointer'; // Optioneel: visuele hint
      detailMyReviewStars.onclick = () => openReviewPopup(currentWorkshopId);

      // Vul workshopgegevens
      document.getElementById('detailName').value = workshop.name;
      document.getElementById('detailDesc').value = workshop.description;
      document.getElementById('detailDuration').value = formatDuration(workshop.duration);

      // Labels
      const labelsArray = workshop.labels ? (typeof workshop.labels === 'string' ? JSON.parse(workshop.labels) : workshop.labels) : [];
      detailLabelPreview.innerHTML = '';
      labelsArray.forEach(label => {
        const span = document.createElement('span');
        span.textContent = label.name;
        span.style.backgroundColor = label.color;
        span.style.borderColor = label.color;
        span.style.color = getContrastYIQ(label.color);
        detailLabelPreview.appendChild(span);
      });

      document.getElementById('detailParentalConsent').checked = workshop.parentalConsent || false;

      // Media & documenten
      renderMediaSlideshow(workshop.files || []);
      if (workshop.documents && Array.isArray(workshop.documents)) {
        workshop.documents.forEach(f => addDocumentToDetail(f));
      }

      // Haal review op (om de review-popup te vullen)
      await loadReviews(id);

      detailsPopup.style.display = 'flex';
    } catch (e) {
      alert(e.message);
    }
  }


  function addDocumentToDetail(f){
    const li = document.createElement('li');
    Object.assign(li.style, {
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'6px 8px', border:'1px solid #e1e1e1', borderRadius:'6px',
      marginBottom:'6px', background:'#fff'
    });

    const left = document.createElement('div');
    Object.assign(left.style, { display:'flex', alignItems:'center', gap:'8px' });
    const icon = document.createElement('i');
    icon.classList.add('fa', getFileIconClass(f.name));
    icon.style.color = '#5481B7';
    left.appendChild(icon);
    const nameSpan = document.createElement('span');
    nameSpan.textContent = f.name || '?';
    Object.assign(nameSpan.style, { overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'160px' });
    left.appendChild(nameSpan);
    li.appendChild(left);

    const right = document.createElement('div');
    Object.assign(right.style, { display:'flex', alignItems:'center', gap:'8px' });
    if(f.size){
      const size = document.createElement('span');
      size.textContent = `${(f.size/1024).toFixed(1)} KB`;
      size.style.fontSize='12px';
      size.style.color='#777';
      right.appendChild(size);
    }
    const downloadLink = document.createElement('a');
    downloadLink.textContent = 'Download';
    downloadLink.href = f.url || '#';
    downloadLink.setAttribute('download', f.name || 'bestand');
    Object.assign(downloadLink.style, { background:'#007bff', color:'white', border:'none', padding:'4px 10px', borderRadius:'4px', cursor:'pointer', textDecoration:'none' });
    downloadLink.addEventListener('click', e => e.stopPropagation());
    right.appendChild(downloadLink);

    li.appendChild(right);

    const viewLink = document.createElement('button');
    viewLink.textContent = 'Bekijk';
    Object.assign(viewLink.style, { background:'#28a745', color:'white', border:'none', padding:'4px 10px', borderRadius:'4px', cursor:'pointer' });
    viewLink.addEventListener('click', e => {
      e.stopPropagation();
      openFilePreview(f);
    });
    right.appendChild(viewLink);



    const cat = (f.category || f.type || 'worksheets').toLowerCase();
    if(cat==='instructions') detailInstructionsList.appendChild(li);
    else if(cat==='manuals' || cat==='handleiding') detailManualsList.appendChild(li);
    else if(cat==='demo') detailDemoList.appendChild(li);
    else detailWorksheetsList.appendChild(li);
  }

  function renderMediaSlideshow(mediaFiles){
    const container = document.getElementById('detailMediaContainer');
    container.innerHTML = '';

    mediaFiles.forEach((file,i)=>{
      let el;
      const isImage = file.type?.startsWith('image') || /\.(png|jpe?g|gif|webp)$/i.test(file.url);
      const isVideo = file.type?.startsWith('video') || /\.(mp4|webm|ogg)$/i.test(file.url);

      if(isImage){
        el = document.createElement('img');
      } else if(isVideo){
        el = document.createElement('video');
        el.controls = true;
      } else return;

      // URL correct opbouwen
      let fileUrl = file.url || file.name;
      if(!fileUrl) return;
      if(!fileUrl.startsWith('http')) {
        const fileName = fileUrl.split(/[/\\]/).pop();
        fileUrl = `${API_URL}/uploads/${encodeURIComponent(fileName)}`;
      }
      el.src = fileUrl;

      // Kleiner maken
      el.style.display = i===0 ? 'block' : 'none';
      el.style.width = '300px';          // vaste breedte
      el.style.height = '200px';         // vaste hoogte
      el.style.objectFit = 'cover';      // zodat het mooi past
      el.style.borderRadius = '8px';
      el.style.margin = '10px auto';     // centeren

      container.appendChild(el);
    });

    let currentIndex=0;
    prevBtn.onclick = () => {
      if(!container.children.length) return;
      container.children[currentIndex].style.display='none';
      currentIndex=(currentIndex-1+container.children.length)%container.children.length;
      container.children[currentIndex].style.display='block';
    };
    nextBtn.onclick = () => {
      if(!container.children.length) return;
      container.children[currentIndex].style.display='none';
      currentIndex=(currentIndex+1)%container.children.length;
      container.children[currentIndex].style.display='block';
    };
  }
  // LOGOUT
  const logoutBtn = document.getElementById('logoutBtn'); // Zorg dat deze bestaat in je HTML
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
      // Gebruik 'sidebar-open' om de sidebar van links naar binnen te schuiven
      sidebar.classList.toggle('sidebar-open');
    });
  }
  // =======================
  // File category toggle
  // =======================
  document.querySelectorAll('.file-category-header').forEach(header => {
    header.addEventListener('click', () => {
      const allContents = document.querySelectorAll('.file-category-content');
      const currentContent = header.nextElementSibling;
      allContents.forEach(content => { if(content!==currentContent) content.style.display='none'; });
      currentContent.style.display = currentContent.style.display==='flex' ? 'none' : 'flex';
    });
  });

  // =======================
  // Lightbox functionaliteit
  // =======================
  document.addEventListener('click', e => {
    if(e.target.closest('#detailMediaContainer img')){
      lightboxImg.src = e.target.src;
      lightboxImg.style.display='block';
      lightboxVideo.style.display='none';
      lightbox.style.display='flex';
    } else if(e.target.closest('#detailMediaContainer video')){
      lightboxVideo.src = e.target.src;
      lightboxVideo.style.display='block';
      lightboxImg.style.display='none';
      lightbox.style.display='flex';
    }
  });

  [closeLightbox, lightbox].forEach(el=>{
    el.addEventListener('click', e => {
      if(e.target===el || el===closeLightbox){
        lightbox.style.display='none';
        lightboxImg.src='';
        lightboxVideo.src='';
      }
    });
  });

  // Sluit de details popup bij klikken buiten de popup-content
  detailsPopup.addEventListener('click', (e) => {
    if (e.target === detailsPopup) {
      detailsPopup.style.display = 'none';
      clearDetailsPopup();
    }
  });

  // Bestaande close-knop blijft ook werken
  closeDetailsBtn.addEventListener('click', () => {
    detailsPopup.style.display = 'none';
    clearDetailsPopup();
  });
  //search
  if (searchInput) {
    const noResultsMsg = document.getElementById('no-results');

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      const cards = document.querySelectorAll('.workshop-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const nameElem = card.querySelector('.workshop-info h3');
        const descElem = card.querySelector('.workshop-info p');

        const name = nameElem ? nameElem.textContent.toLowerCase() : '';
        const desc = descElem ? descElem.textContent.toLowerCase() : '';

        const isMatch = name.includes(query) || desc.includes(query);
        card.style.display = isMatch ? 'flex' : 'none';
        if (isMatch) visibleCount++;
      });

      noResultsMsg.style.display = (visibleCount === 0 && query !== '') ? 'block' : 'none';
    });
  }

  // ===================================
  //   REVIEW MODULE
  // ===================================

  // -------------------------------
  //   STERREN AANKLIKKEN
  // -------------------------------
  document.querySelectorAll(".stars i").forEach((star) => {
    star.addEventListener("click", () => {
      selectedStars = parseInt(star.dataset.value);

      document.querySelectorAll(".stars i").forEach((s) => {
        s.classList.toggle("selected", s.dataset.value <= selectedStars);
      });
    });
  });

  // -------------------------------
  //   POPUP OPENEN
  // -------------------------------
  function openReviewPopup(workshopId) {
    currentWorkshopId = workshopId;
    const popupOverlay = document.getElementById("reviewPopup");
    popupOverlay.style.display = "flex"; // flex = overlay + gecentreerde popup
    loadReviews(currentWorkshopId);
  }

  function closeReviewPopup() {
    const popupOverlay = document.getElementById("reviewPopup");
    popupOverlay.style.display = "none";
    clearReview();
  }


  function clearReview() {
    selectedStars = 0;
    document.querySelectorAll(".stars i").forEach((s) =>
      s.classList.remove("selected")
    );
    document.getElementById("reviewText").value = "";
  }

  // -------------------------------
  //   REVIEW OPSLAAN
  // -------------------------------
  async function submitReview() {
    if (!currentWorkshopId) return alert("Geen workshop geselecteerd.");

    const text = document.getElementById("reviewText").value.trim();
    if (selectedStars === 0) return alert("Selecteer een aantal sterren.");
    // Woordenlimiet is 800 karakters in de HTML, dus deze check is optioneel
    // if (text.length > 800) return alert("Maximaal 800 karakters.");

    const token = localStorage.getItem("jwt");
    if (!token) return alert("Je moet ingelogd zijn.");

    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST", // Gebruikt POST voor maken/updaten
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ workshopId: currentWorkshopId, stars: selectedStars, text })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(`Kon review niet opslaan: ${errorData.message || res.statusText}`);
      }

      // Na opslaan meteen herladen om updates zichtbaar te maken
      await loadWorkshops(); // Herlaad alle workshops om de review in de kaart te updaten
      await loadReviews(currentWorkshopId); // Herlaad de review (niet strikt nodig, maar veilig)
      alert("Review opgeslagen!");
      closeReviewPopup();
    } catch (err) {
      console.error(err);
      alert("Er ging iets mis bij opslaan. Details: " + err.message);
    }
  }

  // -------------------------------
  //   BESTAANDE REVIEW LADEN (VOOR DE HUIDIGE GEBRUIKER)
  // -------------------------------
  async function loadReviews(workshopId) {
    const token = localStorage.getItem("jwt");
    if (!token) {
      clearReview();
      displayUserReviewInDetailPopup(null); // Toon 'Nog geen review' in detail popup
      return;
    }

    try {
      // Dit endpoint moet de review van de huidige *ingelogde* gebruiker voor deze workshop ID teruggeven
      const res = await fetch(`${API_URL}/reviews/${workshopId}/user`, {
        headers: { Authorization: "Bearer " + token },
      });

      if (res.status === 404 || !res.ok) {
        clearReview();
        displayUserReviewInDetailPopup(null); // Geen review gevonden voor deze gebruiker/workshop
        return;
      }

      const review = await res.json(); // Verwacht één review object

      // 1. Vul de Review Popup (om aan te passen)
      selectedStars = review.stars;
      document.getElementById("reviewText").value = review.text || '';
      document.querySelectorAll(".stars i").forEach((star) => {
        star.classList.toggle("selected", star.dataset.value <= review.stars);
      });

      // 2. Toon de Review in de Detail Popup (om te bekijken)
      displayUserReviewInDetailPopup(review);

    } catch (err) {
      console.error("Fout bij review laden:", err);
      clearReview();
      displayUserReviewInDetailPopup(null);
    }
  }
// Nieuwe functie om de geladen review in de detail popup te tonen
  function displayUserReviewInDetailPopup(review) {
    const starsContainer = document.getElementById('detailMyReviewStars');
    starsContainer.innerHTML = '';

    if (!review || review.stars === undefined) {
      const emptyStars = Array(5).fill('<i class="fa-regular fa-star"></i>').join('');
      starsContainer.innerHTML = `<div class="stars-summary">${emptyStars}</div>`;
    } else {
      const filledStars = Array(review.stars).fill('<i class="fa-solid fa-star filled-star"></i>').join('');
      const emptyStars = Array(5 - review.stars).fill('<i class="fa-regular fa-star"></i>').join('');
      starsContainer.innerHTML = `<div class="stars-summary">${filledStars}${emptyStars}</div>`;
    }

    // **Event listener opnieuw toevoegen**
    starsContainer.style.cursor = 'pointer';
    starsContainer.onclick = () => openReviewPopup(currentWorkshopId);
  }
  // -------------------------------
  //   KOPPEL KNOPPEN (Statische elementen)
  // -------------------------------

  document.getElementById("closeReviewPopup")?.addEventListener("click", () => {
    closeReviewPopup();
  });

  document.getElementById("submitReviewBtn")?.addEventListener("click", () => {
    submitReview();
  });

  document.getElementById("clearReviewBtn")?.addEventListener("click", () => {
    clearReview();
  });
  document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", function () {

      // Verwijder active van alle links
      document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));

      // Voeg active toe aan de geklikte link
      this.classList.add("active");
    });
  });

  // =======================
  // Init
  // =======================
  loadWorkshops();
});