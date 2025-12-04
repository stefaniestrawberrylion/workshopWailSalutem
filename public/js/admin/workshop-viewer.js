// workshop-viewer.js
document.addEventListener('DOMContentLoaded', () => {
  // =======================
  // Elementen ophalen voor viewer
  // =======================
  const grid = document.getElementById('workshopGrid');
  const detailsPopup = document.getElementById('workshopDetailsPopup');
  const closeDetailsBtn = document.getElementById('closeDetailsPopupBtn');
  const deleteBtn = document.getElementById('deleteWorkshopBtn');

  const detailLabelPreview = document.getElementById('detailLabelPreview');

  const searchInput = document.getElementById('searchInput');
  const prevBtn = document.getElementById('prevDetailMedia');
  const nextBtn = document.getElementById('nextDetailMedia');

  // detail category lists
  const detailInstructionsList = document.getElementById('detail_instructionsList');
  const detailManualsList = document.getElementById('detail_manualsList');
  const detailDemoList = document.getElementById('detail_demoList');
  const detailWorksheetsList = document.getElementById('detail_worksheetsList');

  let currentWorkshopId = null;

  // =======================
  // API Base URL
  // =======================
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://workshoptest.wailsalutem-foundation.com";

  // =======================
  // Helper: Authorization header
  // =======================
  function getAuthHeaders() {
    const token = localStorage.getItem("jwt");
    if (!token) throw new Error("Geen JWT token gevonden!");
    return {
      Authorization: `Bearer ${token}`
    };
  }

  // =======================
  // Close details popup
  // =======================
  if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', () => {
    detailsPopup.style.display = 'none';
    clearDetailsPopup();
  });

  window.addEventListener('click', (e) => {
    if (e.target === detailsPopup) {
      detailsPopup.style.display = 'none';
      clearDetailsPopup();
    }
  });

  // =======================
  // Workshops ophalen en renderen
  // =======================
  async function loadWorkshops() {
    try {
      const res = await fetch(`${API_URL}/workshops`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Fout bij ophalen workshops');

      const workshops = await res.json();
      renderWorkshops(workshops);
    } catch (e) {
      console.error(e.message);
    }
  }

  // =======================
  // Render workshops (grid)
  // =======================
  function renderWorkshops(workshops) {
    grid.innerHTML = '';

    workshops.forEach(w => {
      const card = document.createElement('div');
      card.classList.add('workshop-card');

      // Pak de eerste afbeelding, fallback naar default
      let firstImage = w.files?.find(f => f.type?.includes('image'));
      let imageUrl = '/image/default-workshop.png';
      if (firstImage) {
        const rawUrl = firstImage.url || firstImage.name || firstImage.path;
        if (rawUrl) {
          imageUrl = rawUrl.startsWith('http')
            ? rawUrl
            : `${API_URL}/uploads/${encodeURIComponent(rawUrl.split(/[/\\]/).pop())}`;
        }
      }

      let durationStr = formatDuration(w.duration) + " uur";

      // Review gemiddelde van de workshop
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

      card.innerHTML = `
                <div class="workshop-image" style="background-image: url('${imageUrl}')">
                    <div class="workshop-top">
                        <div class="workshop-badge time">${durationStr}</div>
                        <div class="like">♡</div>
                    </div>
                    <div class="workshop-bottom">
                        <div class="workshop-info">
                            <h3>${w.name}</h3>
                            <div class="workshop-rating">
                                ${reviewContent}
                            </div>
                        </div>
                        <button class="workshop-btn">Bekijk workshop</button>
                    </div>
                </div>
            `;

      // Like knop
      const likeBadge = card.querySelector('.like');
      if (likeBadge) {
        likeBadge.addEventListener('click', () => {
          likeBadge.textContent = likeBadge.textContent === '♡' ? '❤️' : '♡';
        });
      }

      // Open details popup
      const btn = card.querySelector('.workshop-btn');
      if (btn) {
        btn.addEventListener('click', () => viewWorkshopDetails(w.id));
      }

      grid.appendChild(card);
    });
  }

  // =======================
  // View workshop details
  // =======================
  async function viewWorkshopDetails(id) {
    try {
      currentWorkshopId = id;

      const res = await fetch(`${API_URL}/workshops/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Workshop niet gevonden');
      const w = await res.json();
      window.currentWorkshopData = w;

      // Basis info
      document.getElementById('detailName').value = w.name;
      document.getElementById('detailDesc').value = w.description;
      document.getElementById('detailDuration').value = formatDuration(w.duration);
      const parentalConsentEl = document.getElementById('detailParentalConsent');
      parentalConsentEl.checked = w.parentalConsent || false;
      parentalConsentEl.disabled = true;

      // Labels
      detailLabelPreview.innerHTML = '';
      const labelsArray = w.labels ? (typeof w.labels === 'string' ? JSON.parse(w.labels) : w.labels) : [];
      labelsArray.forEach(label => {
        const span = document.createElement('span');
        span.textContent = label.name;
        span.style.backgroundColor = label.color;
        span.style.borderColor = label.color;
        span.style.color = getContrastYIQ(label.color);
        detailLabelPreview.appendChild(span);
      });

      // Clear categorie-lijsten
      detailInstructionsList.innerHTML = '';
      detailManualsList.innerHTML = '';
      detailDemoList.innerHTML = '';
      detailWorksheetsList.innerHTML = '';

      // Documenten
      if (w.documents && Array.isArray(w.documents)) {
        w.documents.forEach(f => {
          const li = createDocumentListItem(f);
          const cat = (f.category || f.type || 'worksheets').toLowerCase();
          if (cat === 'instructions') detailInstructionsList.appendChild(li);
          else if (cat === 'manuals' || cat === 'handleiding') detailManualsList.appendChild(li);
          else if (cat === 'demo') detailDemoList.appendChild(li);
          else detailWorksheetsList.appendChild(li);
        });
      }

      // Slideshow media
      const container = document.getElementById('detailMediaContainer');
      container.innerHTML = '';
      const mediaFiles = w.files || [];
      mediaFiles.forEach((file, i) => {
        const el = getMediaElement(file);
        if (!el) return;
        el.style.display = i === 0 ? 'block' : 'none';
        container.appendChild(el);
      });

      // Reviews verwerken
      setupReviews(w);

      // Slideshow knoppen
      let currentIndex = 0;
      prevBtn.onclick = () => {
        if (!container.children.length) return;
        container.children[currentIndex].style.display = 'none';
        currentIndex = (currentIndex - 1 + container.children.length) % container.children.length;
        container.children[currentIndex].style.display = 'block';
      };
      nextBtn.onclick = () => {
        if (!container.children.length) return;
        container.children[currentIndex].style.display = 'none';
        currentIndex = (currentIndex + 1) % container.children.length;
        container.children[currentIndex].style.display = 'block';
      };

      detailsPopup.style.display = 'flex';
    } catch (e) {
      console.error(e.message);
    }
  }

  // =======================
  // Helper functions
  // =======================
  function createDocumentListItem(f) {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.justifyContent = 'space-between';
    li.style.padding = '6px 8px';
    li.style.border = '1px solid #e1e1e1';
    li.style.borderRadius = '6px';
    li.style.marginBottom = '6px';
    li.style.background = '#fff';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '8px';

    const icon = document.createElement('i');
    icon.classList.add('fa', getFileIconClass(f.name));
    icon.style.fontSize = '18px';
    icon.style.color = '#5481B7';
    left.appendChild(icon);

    const nameSpan = document.createElement('span');
    nameSpan.textContent = f.name || '?';
    nameSpan.style.overflow = 'hidden';
    nameSpan.style.textOverflow = 'ellipsis';
    nameSpan.style.whiteSpace = 'nowrap';
    nameSpan.style.maxWidth = '160px';
    left.appendChild(nameSpan);

    li.appendChild(left);

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.style.gap = '8px';

    if (f.size) {
      const size = document.createElement('span');
      size.textContent = `${(f.size / 1024).toFixed(1)} KB`;
      size.style.fontSize = '12px';
      size.style.color = '#777';
      right.appendChild(size);
    }

    const downloadLink = document.createElement('a');
    downloadLink.textContent = 'Download';
    downloadLink.href = f.url.startsWith('http') ? f.url : `${API_URL}${f.url}`;
    downloadLink.setAttribute('download', f.name || 'bestand');
    downloadLink.style.background = '#486c8a';
    downloadLink.style.color = 'white';
    downloadLink.style.border = 'none';
    downloadLink.style.padding = '4px 10px';
    downloadLink.style.borderRadius = '4px';
    downloadLink.style.cursor = 'pointer';
    downloadLink.style.textDecoration = 'none';
    downloadLink.addEventListener('click', e => e.stopPropagation());
    right.appendChild(downloadLink);

    const viewLink = document.createElement('a');
    const fileUrl = (f.url || f.name || f.path).startsWith('http')
      ? (f.url || f.name || f.path)
      : `${API_URL}/uploads/${encodeURIComponent((f.url || f.name || f.path).split(/[/\\]/).pop())}`;

    viewLink.href = fileUrl;
    viewLink.textContent = 'Bekijk';
    viewLink.target = '_blank';
    viewLink.rel = 'noopener noreferrer';
    viewLink.style.background = '#6C757D';
    viewLink.style.color = 'white';
    viewLink.style.border = 'none';
    viewLink.style.padding = '4px 10px';
    viewLink.style.borderRadius = '4px';
    viewLink.style.cursor = 'pointer';
    viewLink.style.textDecoration = 'none';
    viewLink.addEventListener('click', e => e.stopPropagation());
    right.appendChild(viewLink);

    li.appendChild(right);
    return li;
  }

  function getMediaElement(file) {
    let rawUrl = file.url || file.name;
    if (!rawUrl) return null;

    const ext = rawUrl.split('.').pop()?.toLowerCase();
    let fileUrl = rawUrl.startsWith('http')
      ? rawUrl
      : `${API_URL}/uploads/${encodeURIComponent(rawUrl.split(/[/\\]/).pop())}`;

    if (!ext) return null;

    if (['png','jpg','jpeg','gif','webp'].includes(ext)) {
      const img = document.createElement('img');
      img.src = fileUrl;
      return img;
    } else if (['mp4','webm','ogg'].includes(ext)) {
      const video = document.createElement('video');
      video.src = fileUrl;
      video.controls = true;
      return video;
    }

    return null;
  }

  function getFileIconClass(fileName){
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

  function getContrastYIQ(hexcolor){
    hexcolor = hexcolor.replace('#','');
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
  }

  function formatDuration(minutes) {
    // als input al een string is, gewoon teruggeven
    if (typeof minutes === 'string') return minutes;

    const m = Number(minutes);
    if (isNaN(m)) return '0';

    const hours = Math.floor(m / 60);
    const mins = m % 60;
    if (hours > 0) return `${hours}u ${mins}m`;
    return `${mins}m`;
  }

  function setupReviews(w) {
    const reviewBox = document.getElementById('detailReviewBox');
    const reviewsPopup = document.getElementById('reviewsPopup');
    const reviewsList = document.getElementById('reviewsList');

    // Haal de nieuwe elementen op
    const respondPopup = document.getElementById('respondPopup');
    const respondForm = document.getElementById('respondForm');

    reviewBox.innerHTML = '';
    reviewsList.innerHTML = '';

    // Klik om de algemene reviews popup te openen
    reviewBox.onclick = () => { reviewsPopup.style.display = 'flex'; };

    // --- Functie om de reageer-popup te openen ---
    function openRespondPopup(reviewId, userEmail, workshopTitle) {
      if (!respondPopup || !respondForm) {
        console.error("Respond popup of formulier niet gevonden in DOM.");
        return;
      }

      // Vul de verborgen velden en de workshop titel
      document.getElementById('reviewId').value = reviewId;
      document.getElementById('reviewUserEmail').value = userEmail;
      document.getElementById('reviewWorkshopTitle').value = workshopTitle;

      // Vul het standaard template in de textarea
      document.getElementById('adminResponse').value = `Beste gebruiker,

Bedankt voor uw review! We waarderen uw feedback enorm.
Zou u ons misschien wat meer details kunnen geven over uw ervaring, zodat we onze service verder kunnen verbeteren? Alle toelichting is welkom.

Met vriendelijke groet,
Het team
`;

      respondPopup.style.display = 'flex';
    }
    // Maak de functie globaal bereikbaar, zodat deze in de inline onclick gebruikt kan worden
    window.openRespondPopup = openRespondPopup;
    // ---------------------------------------------


    // --- Event Listener voor het versturen van het reactieformulier ---
    if (respondForm) {
      respondForm.onsubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData(respondForm);
        const data = Object.fromEntries(formData.entries());

        const reviewId = data.reviewId;
        const userEmail = data.userEmail;
        const workshopTitle = data.workshopTitle;
        const adminResponse = data.adminResponse;

        // Controleer of de benodigde data aanwezig is
        if (!reviewId || !userEmail || !workshopTitle || !adminResponse) {
          alert('Fout: Niet alle vereiste gegevens zijn aanwezig om te versturen.');
          return;
        }

        try {
          const response = await fetch(`/reviews/${reviewId}/respond`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Voeg hier eventuele authenticatie headers toe (zoals een Bearer token)
            },
            body: JSON.stringify({ userEmail, workshopTitle, adminResponse })
          });

          if (response.ok) {
            alert('Reactie succesvol verstuurd naar de gebruiker!');
            respondPopup.style.display = 'none';
            respondForm.reset(); // Reset het formulier na succes
          } else {
            const error = await response.json();
            alert(`Fout bij versturen: ${error.message || response.statusText}`);
          }
        } catch (error) {
          console.error('Verzendfout:', error);
          alert('Er is een netwerkfout opgetreden.');
        }
      };
    }
    // ----------------------------------------------------


    if (w.reviews && w.reviews.length > 0) {
      // Gemiddelde sterren
      const avg = w.reviews.reduce((s, r) => s + r.stars, 0) / w.reviews.length;
      const rounded = Math.round(avg);
      const stars =
        Array(rounded).fill('<i class="fa-solid fa-star filled-star"></i>').join('') +
        Array(5 - rounded).fill('<i class="fa-regular fa-star"></i>').join('');

      // Review summary
      reviewBox.innerHTML = `
              <div class="review-summary">
                  ${stars} <span>(${w.reviews.length}) reviews</span>
              </div>
          `;

      // Reviews in popup
      w.reviews.forEach(async r => {
        // ⚠️ BELANGRIJKE AANNAMES:
        // 1. De review heeft een unieke ID: r.id
        // 2. De workshop heeft een titel: w.title
        const reviewId = r.id;

        const user = r.userId ? await getUserMail(r.userId) : { email: 'unknown@example.com' };
        const displayName = user.email || 'Onbekend';
        const userEmail = user.email || 'unknown@example.com'; // Gebruik 'unknown' als fallback

        const li = document.createElement('li');
        li.className = "review-item";
        li.style.border = '1px solid #ccc';
        li.style.borderRadius = '8px';
        li.style.padding = '10px';
        li.style.marginBottom = '8px';
        li.style.background = '#f9f9f9';

        li.innerHTML = `
                  <div class="review-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                      <strong>${displayName}</strong>
                      <span class="review-stars">
                          ${Array(r.stars).fill('<i class="fa-solid fa-star filled-star"></i>').join('')}
                          ${Array(5 - r.stars).fill('<i class="fa-regular fa-star"></i>').join('')}
                      </span>
                  </div>
                  <p class="review-text" style="margin:0;">${r.text}</p>
                  
                  ${userEmail !== 'unknown@example.com' && reviewId ? `
                      <a href="#" 
                         onclick="event.preventDefault(); window.openRespondPopup(${reviewId}, '${userEmail}', '${w.name}');"
                         class="respond-link">
                         Vraag om toelichting
                      </a>
                  ` : `<span style="display:block; margin-top:10px; font-size:smaller; color:#6c757d;">Reageren niet mogelijk (e-mail onbekend)</span>`}
              `;

        reviewsList.appendChild(li);
      });
    } else {
      reviewBox.innerHTML = '<p>Nog geen reviews</p>';
    }
  }
  // Fetch user info (email)
  async function getUserMail(userId) {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Gebruiker niet gevonden');
      const user = await res.json();
      return { email: user.email || 'Onbekend' };
    } catch (e) {
      return { email: 'Onbekend' };
    }
  }

  // =======================
  // Delete workshop
  // =======================
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!currentWorkshopId) return;
      const confirmDelete = confirm('Weet je zeker dat je deze workshop wilt verwijderen?');
      if (!confirmDelete) return;

      try {
        const res = await fetch(`${API_URL}/workshops/${currentWorkshopId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Fout bij verwijderen workshop');

        detailsPopup.style.display = 'none';
        clearDetailsPopup();
        await loadWorkshops();
        alert('Workshop succesvol verwijderd!');
      } catch (e) {
        alert(e.message);
      }
    });
  }

  // =======================
  // Search functionaliteit
  // =======================
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

  // =======================
  // Clear details popup
  // =======================
  function clearDetailsPopup(){
    currentWorkshopId=null;
    document.getElementById('detailName').value='';
    document.getElementById('detailDesc').value='';
    document.getElementById('detailDuration').value='';
    detailLabelPreview.innerHTML='';
    if(detailInstructionsList) detailInstructionsList.innerHTML='';
    if(detailManualsList) detailManualsList.innerHTML='';
    if(detailDemoList) detailDemoList.innerHTML='';
    if(detailWorksheetsList) detailWorksheetsList.innerHTML='';
    const mediaContainer = document.getElementById('detailMediaContainer');
    if(mediaContainer) mediaContainer.innerHTML='';
  }

  // =======================
  // Categorie toggle
  // =======================
  document.querySelectorAll('.file-category-header').forEach(header => {
    header.addEventListener('click', () => {
      const allContents = document.querySelectorAll('.file-category-content');
      const currentContent = header.nextElementSibling;

      // Sluit alle andere categorieën
      allContents.forEach(content => {
        if (content !== currentContent) {
          content.style.display = 'none';
        }
      });

      // Toggle de aangeklikte categorie
      currentContent.style.display = currentContent.style.display === 'flex' ? 'none' : 'flex';
    });
  });

  // =======================
  // Lightbox functionaliteit
  // =======================
  const lightbox = document.getElementById('mediaLightbox');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const closeLightbox = document.querySelector('.close-lightbox');

  // Klik op media in detailweergave → toon groter
  document.addEventListener('click', (e) => {
    if (e.target.closest('#detailMediaContainer img')) {
      const src = e.target.src;
      lightboxImg.src = src;
      lightboxImg.style.display = 'block';
      lightboxVideo.style.display = 'none';
      lightbox.style.display = 'flex';
    } else if (e.target.closest('#detailMediaContainer video')) {
      const src = e.target.querySelector('source')?.src || e.target.src;
      lightboxVideo.src = src;
      lightboxVideo.style.display = 'block';
      lightboxImg.style.display = 'none';
      lightbox.style.display = 'flex';
    }
  });

  // Klik op sluitknop of buiten beeld → sluit
  closeLightbox.addEventListener('click', () => {
    lightbox.style.display = 'none';
    lightboxImg.src = '';
    lightboxVideo.src = '';
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
      lightboxVideo.src = '';
    }
  });

  // =======================
  // Terug naar dashboard
  // =======================
  const backBtn = document.getElementById("backToDashboardBtn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/dashboard";
    });
  }

  var reviewsPopup = document.getElementById("reviewsPopup");
  var closeButton = document.getElementById("closeReviewsPopup");

  closeButton.onclick = function() {
    reviewsPopup.style.display = "none";
  }
  window.onclick = function(event) {
    if (event.target == reviewsPopup) {
      reviewsPopup.style.display = "none";
    }
  }


  // =======================
  // Luister naar workshop updates
  // =======================
  window.addEventListener('workshopsUpdated', () => {
    loadWorkshops();
  });

  // =======================
  // Init
  // =======================
  loadWorkshops();
});