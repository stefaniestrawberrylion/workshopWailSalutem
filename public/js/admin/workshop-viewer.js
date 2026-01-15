// workshop-viewer.js
/**
 * HOOFDMODULE: Workshop Viewer & Editor
 * Deze module biedt een interface voor het bekijken en bewerken van workshops.
 * Gebruikers kunnen workshops in een grid bekijken, details openen, reviews zien,
 * en workshopgegevens bijwerken inclusief media, documenten en labels.
 */

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById("global-modal-root");

  // =======================
  // ELEMENTEN OPHALEN VOOR VIEWER
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
  // API CONFIGURATIE
  // =======================
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://workshoptest.wailsalutem-foundation.com";

  // =======================
  // HELPERFUNCTIES
  // =======================

  /**
   * Geeft de Authorization header met JWT token terug
   * @returns {Object} Headers object met Authorization token
   * @throws {Error} Als er geen JWT token gevonden is
   */
  function getAuthHeaders() {
    const token = localStorage.getItem("jwt");
    if (!token) throw new Error("Geen JWT token gevonden!");
    return {
      Authorization: `Bearer ${token}`
    };
  }

  /**
   * Forceert een element naar de top van het DOM voor modals
   * @param {HTMLElement} el - Het element dat naar de top verplaatst moet worden
   */
  function forceToTop(el) {
    document.body.appendChild(el);
  }

  /**
   * Toont een succesbericht in een alert modal
   * @param {string} message - Het bericht dat getoond moet worden
   * @returns {Promise} - Resolved wanneer de gebruiker op OK klikt
   */
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

  /**
   * Toont een bevestigingsdialoog met ja/nee opties
   * @param {string} message - Het bericht dat getoond moet worden
   * @returns {Promise<boolean>} Promise die resolved met true (ja) of false (nee)
   */
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

  /**
   * Bepaalt het FontAwesome icoon voor een bestand op basis van extensie
   * @param {string} fileName - De bestandsnaam
   * @returns {string} FontAwesome CSS klasse
   */
  function getFileIconClass(fileName) {
    if (!fileName) return 'fa-file';
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return 'fa-file-pdf';
      case 'doc': case 'docx': return 'fa-file-word';
      case 'xls': case 'xlsx': return 'fa-file-excel';
      case 'ppt': case 'pptx': return 'fa-file-powerpoint';
      case 'zip': return 'fa-file-archive';
      case 'txt': return 'fa-file-lines';
      default: return 'fa-file';
    }
  }

  /**
   * Bepaalt de tekstkleur voor een label op basis van achtergrondkleur
   * @param {string} hexcolor - HEX kleurcode
   * @returns {string} 'black' of 'white' afhankelijk van contrast
   */
  function getContrastYIQ(hexcolor) {
    hexcolor = hexcolor.replace('#', '');
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  }

  /**
   * Formateert duur in minuten naar leesbaar formaat
   * @param {number|string} minutes - Duur in minuten of tijdstring
   * @returns {string} Geformatteerde duur (bijv. "1u 30m")
   */
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

  /**
   * Formateert duur voor time input veld (HH:MM)
   * @param {number|string} duration - Duur in minuten of tijdstring
   * @returns {string} Geformatteerde tijd (bijv. "01:30")
   */
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

  /**
   * Maakt een veilige bestandsnaam door speciale tekens te verwijderen
   * @param {string} fileName - De originele bestandsnaam
   * @returns {string} Veilige bestandsnaam
   */
  function makeSafeFileName(fileName) {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
  }

  /**
   * Controleert en retourneert huidige aantallen media per type
   * @returns {Object} Object met imageCount en videoCount
   */
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

  /**
   * Creëert een media element (img of video) voor weergave
   * @param {Object} file - Media file object met url/path
   * @returns {HTMLElement|null} Media element of null bij ongeldig type
   */
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

  /**
   * Creëert een verwijderknop voor media items
   * @param {HTMLElement} mediaItem - Het media container element
   * @returns {HTMLButtonElement} Verwijderknop
   */
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

  /**
   * Creëert een visueel label element met verwijderfunctionaliteit
   * @param {Object} label - Label object met name en color
   * @returns {HTMLSpanElement} Label span element
   */
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

  /**
   * Creëert een document list item met verwijder- en downloadknoppen
   * @param {Object} f - Document object
   * @param {string} category - Document categorie
   * @param {boolean} isExisting - Of het een bestaand document is
   * @returns {HTMLLIElement} List item voor document
   */
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

  // =======================
  // POPUP BEHEER
  // =======================

  /**
   * Sluit de details popup en reset alle velden
   */
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
  // WORKSHOPS BEHEER
  // =======================

  /**
   * Haalt alle workshops op van de API en rendert ze in de grid
   */
  async function loadWorkshops() {
    try {
      const response = await fetch(`${API_URL}/workshops`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      renderWorkshops(data);
    } catch (err) {
      showAlert("Fout bij laden van workshops: " + err.message);
    }
  }

  /**
   * Rendert workshops in een grid met kaarten
   * @param {Array} workshops - Array van workshop objecten
   */
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

  /**
   * Toont details van een specifieke workshop in de popup
   * @param {string} id - Workshop ID
   */
  async function viewWorkshopDetails(id) {
    try {
      currentWorkshopId = id;

      const res = await fetch(`${API_URL}/workshops/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Workshop niet gevonden');
      const w = await res.json();

      window.currentWorkshopData = {
        ...w,
        quiz: (() => {
          if (Array.isArray(w.quiz)) return w.quiz;
          if (typeof w.quizJson === 'string') {
            try {
              return JSON.parse(w.quizJson);
            } catch {
              return [];
            }
          }
          return [];
        })()
      };

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

      const labelAddContainer = document.createElement('div');
      labelAddContainer.className = 'label-add-container';
      labelAddContainer.innerHTML = `
  <input
    type="text"
    id="detailLabelInput"
    placeholder="Label naam"
    list="labelSuggestions"
  >
  <input
    type="color"
    id="detailLabelColor"
    value="#5481B7"
  >
  <button type="button" id="addDetailLabelBtn">➕</button>
`;
      detailLabelPreview.appendChild(labelAddContainer);

      document.getElementById('addDetailLabelBtn').addEventListener('click', () => {
        const name = document.getElementById('detailLabelInput').value.trim();
        const color = document.getElementById('detailLabelColor').value;
        if (!name) return showAlert('Voer een naam in');
        if (window.currentWorkshopLabels.some(l => l.name === name)) {
          return showAlert('Dit label bestaat al');
        }

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

  /**
   * Voegt een nieuw media bestand toe aan de workshop
   * @param {File} file - Het media bestand
   */
  function addNewMediaFile(file) {
    const container = document.getElementById('detailMediaContainer');

    const reader = new FileReader();
    reader.onload = (e) => {
      const mediaItem = document.createElement('div');
      mediaItem.className = 'workshop-media-item';
      mediaItem.style.display = 'none';
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

      const removeBtn = createRemoveBtn(mediaItem);

      mediaItem.appendChild(mediaElement);
      mediaItem.appendChild(removeBtn);

      const uploadWrapper = container.querySelector('.media-upload-wrapper');
      container.insertBefore(mediaItem, uploadWrapper);

      window.currentWorkshopMedia.push({
        element: mediaItem,
        file: file,
        existing: false,
        url: e.target.result
      });

      window.detailMediaCurrentIndex = window.currentWorkshopMedia.length - 1;
      updateMediaNavigation();
    };

    reader.readAsDataURL(file);
  }

  /**
   * Update de media navigatie (vorige/volgende knoppen)
   */
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

  /**
   * Voegt bestandsupload toe aan een categorie lijst
   * @param {string} category - Categorie naam
   * @param {HTMLElement} listElement - Het lijst element
   */
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

  /**
   * Update de workshop via de API
   */
  document.getElementById('updateWorkshopBtn').addEventListener('click', async () => {
    if (!currentWorkshopId) return;

    const confirmUpdate = await showConfirm('Weet je zeker dat je deze workshop wilt bijwerken?');
    if (!confirmUpdate) return;

    try {
      // --- STEP 1: Haal form values op ---
      const name = document.getElementById('detailName').value.trim();
      const desc = document.getElementById('detailDesc').value.trim();
      const duration = document.getElementById('detailDuration').value;
      const parentalConsent = document.getElementById('detailParentalConsent').checked;

      if (!name || !desc || !duration) {
        throw new Error("Naam, beschrijving en duur zijn verplicht.");
      }

      // --- STEP 2: Controleer duur ---
      let totalMinutes = 0;
      const timeParts = duration.split(':');
      if (timeParts.length === 2) {
        const [h, m] = timeParts.map(Number);
        if (isNaN(h) || isNaN(m)) throw new Error(`Ongeldige tijdsnotatie: ${duration}`);
        totalMinutes = h * 60 + m;
      } else {
        totalMinutes = Number(duration);
        if (isNaN(totalMinutes)) throw new Error(`Ongeldige tijdsduur: ${duration}`);
      }

      if (totalMinutes < 60 || totalMinutes > 120) {
        throw new Error("De duur moet tussen 1 en 2 uur liggen (bijv. 01:15).");
      }

      // --- STEP 3: Bereid FormData voor ---
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', desc);
      formData.append('duration', duration);
      formData.append('parentalConsent', parentalConsent);
      formData.append('labels', JSON.stringify(window.currentWorkshopLabels || []));

      // --- STEP 4: Upload media ---
      try {
        if (window.currentWorkshopMedia && window.currentWorkshopMedia.length > 0) {
          formData.append('isUpdate', 'true');
          const newMediaFiles = window.currentWorkshopMedia.filter(m => !m.existing && m.file);
          newMediaFiles.forEach((media, index) => {
            if (!media.file) throw new Error(`Media bestand ontbreekt bij index ${index}`);
            const safeName = makeSafeFileName(media.file.name);
            const safeFile = new File([media.file], safeName, { type: media.file.type });
            formData.append('media', safeFile);
          });
        }
      } catch (mediaError) {
        throw new Error("Fout bij toevoegen van media: " + mediaError.message);
      }

      // --- STEP 5: Upload documenten ---
      const appendNewFiles = (category, formKey) => {
        const docs = window.currentWorkshopDocuments[category] || [];
        docs.forEach((doc, idx) => {
          if (!doc.existing && doc.file) {
            try {
              const safeName = makeSafeFileName(doc.file.name);
              const safeFile = new File([doc.file], safeName, { type: doc.file.type });
              formData.append(formKey, safeFile);
            } catch (docError) {
              throw new Error(`Fout bij document "${doc.file.name}" in categorie "${category}": ${docError.message}`);
            }
          }
        });
      };

      ['instructions', 'manuals', 'demo', 'worksheets'].forEach(cat => {
        appendNewFiles(cat, `${cat}Files`);
      });

      // --- STEP 6: Voeg document metadata toe ---
      try {
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
      } catch (metaError) {
        throw new Error("Fout bij samenstellen document metadata: " + metaError.message);
      }

      // --- STEP 7: Voeg quiz toe als die bestaat ---
      try {
        if (window.currentWorkshopData?.quiz) {
          formData.append('quiz', JSON.stringify(window.currentWorkshopData.quiz));
        }
      } catch (quizError) {
        throw new Error("Fout bij toevoegen van quiz: " + quizError.message);
      }

      // --- STEP 8: Verstuur update request ---
      const token = localStorage.getItem("jwt");
      if (!token) throw new Error("Geen JWT token beschikbaar");

      const response = await fetch(`${API_URL}/workshops/${currentWorkshopId}`, {
        method: 'PUT',
        body: formData,
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fout bij updaten workshop: ${response.status} - ${errorText}`);
      }

      // --- STEP 9: Succes ---
      detailsPopup.style.display = 'none';
      clearDetailsPopup();
      await showAlert("Workshop succesvol bijgewerkt!");
      window.dispatchEvent(new CustomEvent('workshopsUpdated'));
    } catch (e) {
      console.error("Update Workshop Error:", e);
      showAlert("Fout bij updaten workshop: " + e.message);
    }
  });

  /**
   * Verwijdert een workshop via de API
   */
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
  // REVIEWS BEHEER
  // =======================

  /**
   * Configureert de reviews sectie voor een workshop
   * @param {Object} w - Workshop object
   */
  function setupReviews(w) {
    const reviewBox = document.getElementById('detailReviewBox');
    const reviewsPopup = document.getElementById('reviewsPopup');
    const reviewsList = document.getElementById('reviewsList');

    const respondPopup = document.getElementById('respondPopup');
    const respondForm = document.getElementById('respondForm');

    reviewBox.innerHTML = '';
    reviewsList.innerHTML = '';

    // Klik om de algemene reviews popup te openen
    reviewBox.onclick = () => { reviewsPopup.style.display = 'flex'; };

    /**
     * Opent de reageer-popup voor een specifieke review
     * @param {string} reviewId - Review ID
     * @param {string} userEmail - E-mail van de gebruiker
     * @param {string} workshopTitle - Titel van de workshop
     */
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

    // Maak de functie globaal bereikbaar
    window.openRespondPopup = openRespondPopup;

    // Event Listener voor het versturen van het reactieformulier
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

        const token = localStorage.getItem('jwt');
        try {
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
        const reviewId = r.id;
        const user = r.userId ? await getUserMail(r.userId) : { email: 'unknown@example.com' };
        const displayName = user.email || 'Onbekend';
        const userEmail = user.email || 'unknown@example.com';

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

  /**
   * Haalt e-mail van een gebruiker op via de API
   * @param {string} userId - Gebruiker ID
   * @returns {Promise<Object>} Object met e-mail
   */
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
  // ZOEKFUNCTIE
  // =======================

  /**
   * Filtert workshops op basis van zoekterm
   */
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
  // CATEGORIE TOGGLE
  // =======================

  /**
   * Toggle functionaliteit voor categorie secties
   */
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
  // LIGHTBOX FUNCTIONALITEIT
  // =======================

  /**
   * Lightbox voor het vergroten van media
   */
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
  // CLEAR FUNCTIES
  // =======================

  /**
   * Reset alle velden in de details popup
   */
  function clearDetailsPopup() {
    currentWorkshopId = null;

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
  // NAVIGATIE
  // =======================

  /**
   * Terug naar dashboard knop
   */
  const backBtn = document.getElementById("backToDashboardBtn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/dashboard";
    });
  }

  /**
   * Sluit de reviews popup
   */
  var reviewsPopup = document.getElementById("reviewsPopup");
  var closeButton = document.getElementById("closeReviewsPopup");

  closeButton.onclick = function () {
    reviewsPopup.style.display = "none";
  }
  window.onclick = function (event) {
    if (event.target == reviewsPopup) {
      reviewsPopup.style.display = "none";
    }
  }

  // =======================
  // EVENT LISTENERS
  // =======================

  /**
   * Luistert naar workshop updates
   */
  window.addEventListener('workshopsUpdated', () => {
    loadWorkshops();
  });

  /**
   * Luistert naar workshop updates van management.js
   */
  window.addEventListener('workshopsUpdated', () => {
    loadWorkshops();
  });

  // =======================
  // INITIALISATIE
  // =======================

  /**
   * Initialiseert de viewer
   */
  loadWorkshops();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadWorkshops();
    }
  });
});