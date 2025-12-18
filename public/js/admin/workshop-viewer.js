// workshop-viewer.js
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById("global-modal-root");
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

  //helper popup
  function forceToTop(el) {
    document.body.appendChild(el);
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


  // Luister naar workshop updates van management.js
  window.addEventListener('workshopsUpdated', () => {
    loadWorkshops();
  });

  // =======================
  // Workshops ophalen en renderen
  // =======================
  async function loadWorkshops() {
    try {
      const response = await fetch(`${API_URL}/workshops`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Render de workshops in de grid
      renderWorkshops(data);

    } catch (err) {
      showAlert("Fout bij laden van workshops: " + err.message);
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
      let imageUrl = '/image/default-workshop.jpeg';
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

  async function viewWorkshopDetails(id) {
    try {
      currentWorkshopId = id;

      const res = await fetch(`${API_URL}/workshops/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Workshop niet gevonden');
      const w = await res.json();

      // Sla data op
      window.currentWorkshopData = w;
      window.currentWorkshopData.quiz = w.quiz || [];

      // Basis info
      const nameInput = document.getElementById('detailName');
      const descInput = document.getElementById('detailDesc');
      const durationInput = document.getElementById('detailDuration');
      nameInput.value = w.name;
      descInput.value = w.description;
      durationInput.value = formatDurationForTimeInput(w.duration);

      const parentalConsentEl = document.getElementById('detailParentalConsent');
      parentalConsentEl.checked = w.parentalConsent || false;

      // Labels
      detailLabelPreview.innerHTML = '';
      const labelsArray = w.labels ? (typeof w.labels === 'string' ? JSON.parse(w.labels) : w.labels) : [];
      window.currentWorkshopLabels = labelsArray.slice();

      labelsArray.forEach(label => {
        const span = createLabelSpan(label);
        detailLabelPreview.appendChild(span);
      });

      // Label toevoeg velden herstellen
      const labelAddContainer = document.createElement('div');
      labelAddContainer.className = 'label-add-container';
      labelAddContainer.innerHTML = `
      <input type="text" placeholder="Nieuw label" id="detailLabelInput">
      <input type="color" id="detailLabelColor" value="#5481B7">
      <button type="button" id="addLabelBtnDetail">+</button>
    `;
      detailLabelPreview.appendChild(labelAddContainer);

      document.getElementById('addLabelBtnDetail').addEventListener('click', () => {
        const name = document.getElementById('detailLabelInput').value.trim();
        const color = document.getElementById('detailLabelColor').value;
        if (!name) return showAlert('Voer een naam in');
        const newLabel = { name, color };
        window.currentWorkshopLabels.push(newLabel);
        const span = createLabelSpan(newLabel);
        detailLabelPreview.insertBefore(span, labelAddContainer);
        document.getElementById('detailLabelInput').value = '';
      });

      // Documenten
      detailInstructionsList.innerHTML = '';
      detailManualsList.innerHTML = '';
      detailDemoList.innerHTML = '';
      detailWorksheetsList.innerHTML = '';
      window.currentWorkshopDocuments = { instructions: [], manuals: [], demo: [], worksheets: [] };

      if (w.documents && Array.isArray(w.documents)) {
        w.documents.forEach(f => {
          const cat = (f.category || 'worksheets').toLowerCase();
          let category = 'worksheets';
          if (cat.includes('instruct')) category = 'instructions';
          else if (cat.includes('manual') || cat.includes('handleiding')) category = 'manuals';
          else if (cat.includes('demo')) category = 'demo';

          window.currentWorkshopDocuments[category].push({ name: f.name, url: f.url || f.path, existing: true, category });
          const li = createDocumentListItem(f, category, true);
          if (category === 'instructions') detailInstructionsList.appendChild(li);
          else if (category === 'manuals') detailManualsList.appendChild(li);
          else if (category === 'demo') detailDemoList.appendChild(li);
          else detailWorksheetsList.appendChild(li);
        });
      }

      addFileUploadToCategory('instructions', detailInstructionsList);
      addFileUploadToCategory('manuals', detailManualsList);
      addFileUploadToCategory('demo', detailDemoList);
      addFileUploadToCategory('worksheets', detailWorksheetsList);

      // --- MEDIA SECTIE ---
      const container = document.getElementById('detailMediaContainer');
      container.innerHTML = '';

      // BELANGRIJK: Initialiseer de array alleen als deze nog niet bestaat
      // (dit voorkomt dat we de bestaande media verliezen bij het openen van de popup)
      if (!window.currentWorkshopMedia || window.currentWorkshopMedia.length === 0) {
        window.currentWorkshopMedia = [];
      } else {
        // Als er al media in de array zit, render deze opnieuw
        window.currentWorkshopMedia.forEach((media, index) => {
          media.element.style.display = index === 0 ? 'flex' : 'none';
          container.appendChild(media.element);
        });
      }

      // Voeg bestaande media toe (maar alleen als ze nog niet in de array zitten)
      const mediaFiles = w.files || [];
      mediaFiles.forEach((file, i) => {
        // Check of deze file al in de array zit
        const exists = window.currentWorkshopMedia.some(m =>
          m.existing && (m.url === file.url || m.file?.name === file.name)
        );

        if (!exists) {
          const mediaItem = document.createElement('div');
          mediaItem.style.display = i === 0 && window.currentWorkshopMedia.length === 0 ? 'flex' : 'none';
          mediaItem.style.justifyContent = 'center';
          mediaItem.style.alignItems = 'center';
          mediaItem.style.width = '100%';
          mediaItem.style.height = '250px';
          mediaItem.style.position = 'relative';

          const mediaElement = getMediaElement(file);
          if (mediaElement) {
            mediaElement.style.maxWidth = '100%';
            mediaElement.style.maxHeight = '100%';
            mediaElement.style.objectFit = 'contain';

            const removeBtn = createRemoveBtn(mediaItem);
            mediaItem.appendChild(mediaElement);
            mediaItem.appendChild(removeBtn);
            container.appendChild(mediaItem);

            // Voeg toe aan de array
            window.currentWorkshopMedia.push({
              element: mediaItem,
              file: file,
              existing: true,
              url: file.url || file.path
            });
          }
        }
      });

      // Upload knop wrapper
      const mediaUploadWrapper = document.createElement('div');
      mediaUploadWrapper.className = 'media-upload-wrapper';
      mediaUploadWrapper.style.textAlign = 'center';
      mediaUploadWrapper.style.marginTop = '15px';
      mediaUploadWrapper.innerHTML = `
      <label style="cursor:pointer; padding:10px 16px; background:#5481B7; color:white; border-radius:6px; display:inline-flex; align-items:center; gap:8px;">
        <i class="fa fa-plus"></i> Media toevoegen
        <input type="file" id="detailMediaInput" accept="image/*, video/*" multiple style="display:none;">
      </label>
    `;
      container.appendChild(mediaUploadWrapper);

      document.getElementById('detailMediaInput').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const { currentImageCount, currentVideoCount } = validateMediaLimits();
        // Simpele check
        if (currentImageCount + files.length > 6) return showAlert("Te veel afbeeldingen");

        files.forEach(file => addNewMediaFile(file));
        e.target.value = '';
      });

      window.detailMediaCurrentIndex = 0;
      updateMediaNavigation();
      setupReviews(w);

      document.getElementById('updateWorkshopBtn').style.display = 'block';
      detailsPopup.style.display = 'flex';
      loadWorkshops();
    } catch (e) {
      showAlert("Fout: " + e.message);
    }
  }

  // Helper: maakt de rode X knop
  function createRemoveBtn(mediaItem) {
    const btn = document.createElement('button');
    btn.textContent = '✖';
    btn.style.cssText = 'position:absolute; top:10px; right:10px; background:rgba(220,53,69,0.8); color:white; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer; z-index:10;';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = window.currentWorkshopMedia.findIndex(m => m.element === mediaItem);
      if (index > -1) {
        window.currentWorkshopMedia.splice(index, 1);
        mediaItem.remove();
        window.detailMediaCurrentIndex = Math.max(0, window.detailMediaCurrentIndex - 1);
        updateMediaNavigation();
      }
    });
    return btn;
  }

// Helper: maakt label span
  function createLabelSpan(label) {
    const span = document.createElement('span');
    span.textContent = label.name;
    span.style.cssText = `background:${label.color}; color:${getContrastYIQ(label.color)}; cursor:pointer; padding:6px 12px; margin:3px; border-radius:15px; display:inline-flex; align-items:center; font-size:14px; font-weight:500;`;

    span.addEventListener('click', () => {
      const idx = window.currentWorkshopLabels.findIndex(l => l.name === label.name);
      if (idx > -1) {
        window.currentWorkshopLabels.splice(idx, 1);
        span.remove();
      }
    });
    return span;
  }


// Helper functie om duration te formatteren voor time input
  function formatDurationForTimeInput(duration) {
    if (typeof duration === 'string') {
      // Als het al een tijdstring is zoals "01:15"
      if (duration.includes(':')) {
        return duration;
      }
      // Als het minuten zijn
      const minutes = parseInt(duration);
      if (!isNaN(minutes)) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }
    } else if (typeof duration === 'number') {
      const minutes = duration;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    return '01:00'; // Default
  }
// Voeg deze hulpfunctie toe bovenaan (bij de andere helper functies)
  function validateMediaLimits() {
    if (!window.currentWorkshopMedia) {
      return { currentImageCount: 0, currentVideoCount: 0 };
    }

    const currentImageCount = window.currentWorkshopMedia.filter(m => {
      if (m.existing) {
        const ext = (m.url || '').split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
      } else if (m.file) {
        return m.file.type.startsWith('image/');
      }
      return false;
    }).length;

    const currentVideoCount = window.currentWorkshopMedia.filter(m => {
      if (m.existing) {
        const ext = (m.url || '').split('.').pop()?.toLowerCase();
        return ['mp4', 'webm', 'ogg'].includes(ext);
      } else if (m.file) {
        return m.file.type.startsWith('video/');
      }
      return false;
    }).length;

    return { currentImageCount, currentVideoCount };
  }

  function addNewMediaFile(file) {
    const container = document.getElementById('detailMediaContainer');

    const reader = new FileReader();
    reader.onload = (e) => {
      const mediaItem = document.createElement('div');
      mediaItem.className = 'workshop-media-item';
      mediaItem.style.display = 'none'; // Wordt beheerd door updateMediaNavigation
      mediaItem.style.justifyContent = 'center';
      mediaItem.style.alignItems = 'center';
      mediaItem.style.width = '100%';
      mediaItem.style.height = '250px';
      mediaItem.style.position = 'relative';

      let mediaElement;
      if (file.type.startsWith('image/')) {
        mediaElement = document.createElement('img');
        mediaElement.src = e.target.result;
      } else if (file.type.startsWith('video/')) {
        mediaElement = document.createElement('video');
        mediaElement.src = e.target.result;
        mediaElement.controls = true;
      }

      mediaElement.style.maxWidth = '100%';
      mediaElement.style.maxHeight = '100%';
      mediaElement.style.objectFit = 'contain';

      // Verwijderknop hergebruiken
      const removeBtn = createRemoveBtn(mediaItem);

      mediaItem.appendChild(mediaElement);
      mediaItem.appendChild(removeBtn);

      // Zoek de upload wrapper om het nieuwe item DAARBOVEN te zetten
      const uploadWrapper = container.querySelector('.media-upload-wrapper');
      container.insertBefore(mediaItem, uploadWrapper);

      // TOEVEOGEN aan de bestaande globale array
      window.currentWorkshopMedia.push({
        element: mediaItem,
        file: file,
        existing: false,
        url: e.target.result
      });

      // Verspring direct naar de nieuwe afbeelding
      window.detailMediaCurrentIndex = window.currentWorkshopMedia.length - 1;
      updateMediaNavigation();
    };

    reader.readAsDataURL(file);
  }


  function updateMediaNavigation() {
    if (!window.currentWorkshopMedia || window.currentWorkshopMedia.length === 0) {
      document.getElementById('prevDetailMedia').style.display = 'none';
      document.getElementById('nextDetailMedia').style.display = 'none';
      return;
    }

    // Zorg dat de index altijd geldig is
    if (window.detailMediaCurrentIndex >= window.currentWorkshopMedia.length || window.detailMediaCurrentIndex < 0) {
      window.detailMediaCurrentIndex = 0;
    }

    // Toon alleen het huidige item
    window.currentWorkshopMedia.forEach((m, i) => {
      m.element.style.display = i === window.detailMediaCurrentIndex ? 'flex' : 'none';
    });

    const prevBtn = document.getElementById('prevDetailMedia');
    const nextBtn = document.getElementById('nextDetailMedia');

    if (window.currentWorkshopMedia.length > 1) {
      prevBtn.style.display = 'block';
      nextBtn.style.display = 'block';

      prevBtn.onclick = (e) => {
        e.stopPropagation();
        window.detailMediaCurrentIndex = (window.detailMediaCurrentIndex - 1 + window.currentWorkshopMedia.length) % window.currentWorkshopMedia.length;
        updateMediaNavigation();
      };

      nextBtn.onclick = (e) => {
        e.stopPropagation();
        window.detailMediaCurrentIndex = (window.detailMediaCurrentIndex + 1) % window.currentWorkshopMedia.length;
        updateMediaNavigation();
      };
    } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
  }



// Helper functie om bestand upload toe te voegen aan categorie
  function addFileUploadToCategory(category, listElement) {
    const uploadContainer = document.createElement('div');
    uploadContainer.style.marginTop = '10px';

    const uploadLabel = document.createElement('label');
    uploadLabel.style.display = 'inline-block';
    uploadLabel.style.padding = '6px 12px';
    uploadLabel.style.background = '#5481B7';
    uploadLabel.style.color = 'white';
    uploadLabel.style.borderRadius = '4px';
    uploadLabel.style.cursor = 'pointer';
    uploadLabel.style.fontSize = '14px';
    uploadLabel.textContent = `➕ Bestand toevoegen aan ${category}`;

    const uploadInput = document.createElement('input');
    uploadInput.type = 'file';
    uploadInput.multiple = true;
    uploadInput.style.display = 'none';

    uploadLabel.appendChild(uploadInput);
    uploadContainer.appendChild(uploadLabel);
    listElement.appendChild(uploadContainer);

    uploadInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        // Controleer bestandstype
        const ext = file.name.split('.').pop().toLowerCase();
        const forbiddenExtensions = ['doc', 'docx'];

        if (forbiddenExtensions.includes(ext)) {
          showAlert(`Bestandstype .${ext} is niet toegestaan. Gebruik PDF of TXT.`);
          return;
        }

        // Voeg toe aan huidige documenten
        if (!window.currentWorkshopDocuments[category]) {
          window.currentWorkshopDocuments[category] = [];
        }

        window.currentWorkshopDocuments[category].push({
          file: file,
          existing: false
        });

        // Toon in lijst
        const tempDoc = {
          name: file.name,
          url: URL.createObjectURL(file)
        };

        const li = createDocumentListItem(tempDoc, category, false);
        listElement.insertBefore(li, uploadContainer);
      });

      uploadInput.value = '';
    });
  }

// Pas createDocumentListItem aan om verwijder functionaliteit te hebben
  function createDocumentListItem(f, category, isExisting) {
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

    // Verwijder knop
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✖';
    removeBtn.style.background = '#dc3545';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '4px';
    removeBtn.style.width = '24px';
    removeBtn.style.height = '24px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.display = 'flex';
    removeBtn.style.alignItems = 'center';
    removeBtn.style.justifyContent = 'center';

    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Verwijder uit huidige documenten
      if (window.currentWorkshopDocuments[category]) {
        const index = window.currentWorkshopDocuments[category].findIndex(doc =>
          isExisting ? doc.name === f.name : doc.file.name === f.name
        );

        if (index > -1) {
          window.currentWorkshopDocuments[category].splice(index, 1);
        }
      }

      li.remove();
    });

    right.appendChild(removeBtn);

    // Download/bekijk knoppen alleen voor bestaande bestanden
    if (isExisting && f.url) {
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
    }

    li.appendChild(right);
    return li;
  }



  ///UPDATE WORKSHOP


// Update workshop functionaliteit
  document.getElementById('updateWorkshopBtn').addEventListener('click', async () => {
    if (!currentWorkshopId) return;

    const confirmUpdate = await showConfirm('Weet je zeker dat je deze workshop wilt bijwerken?');
    if (!confirmUpdate) return;

    try {
      const name = document.getElementById('detailName').value.trim();
      const desc = document.getElementById('detailDesc').value.trim();
      const duration = document.getElementById('detailDuration').value;
      const parentalConsent = document.getElementById('detailParentalConsent').checked;

      if (!name || !desc || !duration) {
        showAlert("Naam, beschrijving en duur zijn verplicht.");
        return;
      }

      // Controleer duur
      let totalMinutes = 0;
      const timeParts = duration.split(':');
      if (timeParts.length === 2) {
        const [h, m] = timeParts.map(Number);
        totalMinutes = h * 60 + m;
      } else {
        totalMinutes = Number(duration);
      }

      if (isNaN(totalMinutes) || totalMinutes < 60 || totalMinutes > 120) {
        showAlert("De duur moet tussen 1 en 2 uur liggen (bijv. 01:15).");
        return;
      }

      // Bereid FormData voor
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', desc);
      formData.append('duration', duration);
      formData.append('parentalConsent', parentalConsent);
      formData.append('labels', JSON.stringify(window.currentWorkshopLabels || []));

      // BELANGRIJK: Upload ALLE media als nieuwe bestanden
      if (window.currentWorkshopMedia && window.currentWorkshopMedia.length > 0) {
        // We moeten bestaande bestanden opnieuw uploaden als File objecten
        // Dit kan alleen als we ze eerst downloaden, wat complex is

        // Alternatief: Stuur alleen de nieuwe bestanden en laat backend oude behouden
        // Dit is de huidige aanpak, maar de backend moet dan oude bestanden niet verwijderen

        // Laten we het probleem anders aanpakken:
        // We moeten de backend vertellen om oude bestanden te behouden
        // Voeg een veld toe om aan te geven dat dit een update is, geen volledige vervanging
        formData.append('isUpdate', 'true');

        // Upload alleen nieuwe bestanden
        const newMediaFiles = window.currentWorkshopMedia.filter(m => !m.existing && m.file);
        newMediaFiles.forEach((media, index) => {
          if (media.file) {
            const safeName = makeSafeFileName(media.file.name);
            const safeFile = new File([media.file], safeName, { type: media.file.type });
            formData.append('media', safeFile);
          }
        });
      }

      // Voeg nieuwe document bestanden toe
      const appendNewFiles = (category, formKey) => {
        const docs = window.currentWorkshopDocuments[category] || [];
        docs.forEach(doc => {
          if (!doc.existing && doc.file) {
            const safeName = makeSafeFileName(doc.file.name);
            const safeFile = new File([doc.file], safeName, { type: doc.file.type });
            formData.append(formKey, safeFile);
          }
        });
      };

      appendNewFiles('instructions', 'instructionsFiles');
      appendNewFiles('manuals', 'manualsFiles');
      appendNewFiles('demo', 'demoFiles');
      appendNewFiles('worksheets', 'worksheetsFiles');

      // Voeg document metadata toe (zowel bestaande als nieuwe)
      const allDocs = [
        ...(window.currentWorkshopDocuments.instructions || []),
        ...(window.currentWorkshopDocuments.manuals || []),
        ...(window.currentWorkshopDocuments.demo || []),
        ...(window.currentWorkshopDocuments.worksheets || [])
      ];

      const docMeta = allDocs.map(doc => ({
        name: makeSafeFileName(doc.name || doc.file?.name),
        category: doc.category ||
          (doc.name ?
            (doc.name.includes('instruct') ? 'instructions' :
              doc.name.includes('manual') ? 'manuals' :
                doc.name.includes('demo') ? 'demo' : 'worksheets')
            : 'worksheets')
      }));

      formData.append('documentMeta', JSON.stringify(docMeta));

      // Voeg quiz toe als die bestaat
      if (window.currentWorkshopData?.quiz) {
        formData.append('quiz', JSON.stringify(window.currentWorkshopData.quiz));
      }

      // Verstuur update request
      const token = localStorage.getItem("jwt");
      if (!token) {
        throw new Error("Geen JWT token beschikbaar");
      }

      const response = await fetch(`${API_URL}/workshops/${currentWorkshopId}`, {
        method: 'PUT',
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fout bij updaten: ${response.status} - ${errorText}`);
      }

      // Succes
      detailsPopup.style.display = 'none';
      clearDetailsPopup();
      await showAlert("Workshop succesvol bijgewerkt!");

      // Herlaad workshops
      window.dispatchEvent(new CustomEvent('workshopsUpdated'));

    } catch (e) {
      showAlert("Fout bij updaten workshop: " + e.message);
    }
  });


  // Helper functie voor veilige bestandsnamen (dezelfde als in management.js)
  function makeSafeFileName(fileName) {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
  }


  function getMediaElement(file) {
    let rawUrl = file.url || file.name || file.path;
    if (!rawUrl) return null;

    let fileUrl;

    // Bepaal URL - zelfde logica als in renderWorkshops
    if (rawUrl.startsWith('http')) {
      fileUrl = rawUrl;
    } else if (rawUrl.startsWith('/uploads/') || rawUrl.startsWith('uploads/')) {
      const cleanPath = rawUrl.replace(/^\/+/, '').replace(/^uploads\/?/, '');
      fileUrl = `${API_URL}/uploads/${encodeURIComponent(cleanPath.split('/').pop())}`;
    } else {
      fileUrl = `${API_URL}/uploads/${encodeURIComponent(rawUrl.split(/[/\\]/).pop())}`;
    }

    const ext = rawUrl.split('.').pop()?.toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      const img = document.createElement('img');
      img.src = fileUrl;
      img.alt = 'Workshop media';
      img.onerror = () => {
        console.error('Failed to load image:', fileUrl);
        img.src = '/image/default-workshop.jpeg';
      };
      return img;
    } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
      const video = document.createElement('video');
      video.src = fileUrl;
      video.controls = true;
      video.preload = 'metadata';
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
        showAlert("Niet gevonden")
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

        if (!reviewId || !userEmail || !workshopTitle || !adminResponse) {
          await showAlert('Fout: Niet alle vereiste gegevens zijn aanwezig om te versturen.');
          return;
        }


        const token = localStorage.getItem('jwt'); // of hoe jij hem opslaat
      try{
        const response = await fetch(`${API_URL}/reviews/${reviewId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ userEmail, workshopTitle, adminResponse })
        });


        if (response.ok) {
          await showAlert('Reactie succesvol verstuurd naar de gebruiker!');
          respondPopup.style.display = 'none';
          respondForm.reset();
        } else {
          const error = await response.json();
          await showAlert(`Fout bij versturen: ${error.message || response.statusText}`);
        }

      } catch (error) {
        await showAlert('Er is een netwerkfout opgetreden.');
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
      const confirmDelete = await showConfirm('Weet je zeker dat je deze workshop wilt verwijderen?');
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
     } catch (e) {
        showAlert("fout")
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
  function clearDetailsPopup() {
    currentWorkshopId = null;
    window.currentWorkshopData = null;
    window.currentWorkshopLabels = [];
    window.currentWorkshopMedia = [];
    window.currentWorkshopDocuments = {
      instructions: [],
      manuals: [],
      demo: [],
      worksheets: []
    };
    window.detailMediaCurrentIndex = 0;

    // Reset input velden
    const nameInput = document.getElementById('detailName');
    const descInput = document.getElementById('detailDesc');
    const durationInput = document.getElementById('detailDuration');

    nameInput.value = '';
    nameInput.readOnly = false;

    descInput.value = '';
    descInput.readOnly = false;

    durationInput.value = '';
    durationInput.readOnly = false;

    // Reset parental consent
    document.getElementById('detailParentalConsent').checked = false;

    // Clear labels
    detailLabelPreview.innerHTML = '';

    // Clear document lists
    if (detailInstructionsList) detailInstructionsList.innerHTML = '';
    if (detailManualsList) detailManualsList.innerHTML = '';
    if (detailDemoList) detailDemoList.innerHTML = '';
    if (detailWorksheetsList) detailWorksheetsList.innerHTML = '';

    // Clear media container
    const mediaContainer = document.getElementById('detailMediaContainer');
    if (mediaContainer) mediaContainer.innerHTML = '';

    // Clear reviews
    const reviewBox = document.getElementById('detailReviewBox');
    if (reviewBox) reviewBox.innerHTML = '';
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



  function showAlert(message) {
    return new Promise(resolve => {
      const alertModal = document.getElementById('customAlert');
      const alertMsg = document.getElementById('customAlertMessage');
      const okBtn = document.getElementById('customAlertOk');
      forceToTop(alertModal);
      alertMsg.textContent = message;
      alertModal.style.display = 'flex';

      // Timer voor automatisch sluiten na 2 seconden
      const timer = setTimeout(() => {
        alertModal.style.display = 'none';
        resolve();
      }, 2000);

      // Sluiten via knop annuleert timer
      okBtn.onclick = () => {
        clearTimeout(timer);
        alertModal.style.display = 'none';
        resolve();
      };
    });
  }


  function showConfirm(message) {
    return new Promise(resolve => {
      const confirmModal = document.getElementById('customConfirm');
      const confirmMsg = document.getElementById('customConfirmMessage');
      const yesBtn = document.getElementById('customConfirmYes');
      const noBtn = document.getElementById('customConfirmNo');
      forceToTop(confirmModal);
      confirmMsg.textContent = message;
      confirmModal.style.display = 'flex';

      yesBtn.onclick = () => {
        confirmModal.style.display = 'none';
        resolve(true);
      };
      noBtn.onclick = () => {
        confirmModal.style.display = 'none';
        resolve(false);
      };
    });
  }


  // =======================
  // Init
  // =======================
  loadWorkshops();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadWorkshops();
    }
  });
});