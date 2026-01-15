// workshop-management.js
/**
 * HOOFDMODULE: Workshop Management
 * Deze module biedt een complete interface voor het beheren van workshops.
 * Gebruikers kunnen workshops aanmaken, bewerken, afbeeldingen uploaden,
 * labels toewijzen en bestanden koppelen aan verschillende categorieën.
 * Alle data wordt via de API naar de server gestuurd met JWT authenticatie.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =======================
  // ELEMENTEN OPHALEN VOOR MANAGEMENT
  // =======================
  const addBtn = document.getElementById('addWorkshopBtn');
  const popup = document.getElementById('workshopPopup');
  const closeBtn = document.getElementById('closePopupBtn');
  const saveBtn = document.getElementById('saveWorkshopBtn');
  const closeDetailsBtnCancel = document.getElementById('closePopupBtnCancel');
  const root = document.getElementById("global-modal-root");

  const mainImageInput = document.getElementById('workshopMainImage');
  const workshopImagesInput = document.getElementById('workshopImages');

  const addLabelBtn = document.getElementById('addLabelBtn');
  const labelInput = document.getElementById('workshopLabelInput');
  const labelColor = document.getElementById('workshopLabelColor');
  const labelPreview = document.getElementById('labelPreview');

  const workshopPreview = document.getElementById('workshopPreview');
  const workshopFilePreview = document.getElementById('workshopFilePreview');

  // Category inputs
  const instructionsInput = document.getElementById('instructionsInput');
  const manualsInput = document.getElementById('manualsInput');
  const demoInput = document.getElementById('demoInput');
  const worksheetsInput = document.getElementById('worksheetsInput');

  let currentWorkshopId = null;
  let labels = [];
  let mainImage = null;
  let selectedMedia = [];
  let selectedFiles = [];

  let selectedInstructions = [];
  let selectedManuals = [];
  let selectedDemo = [];
  let selectedWorksheets = [];

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
   * Toont een foutmelding in de juiste container (popup of hoofdscherm)
   * @param {string} message - De foutmelding die getoond moet worden
   */
  function showError(message) {
    const popup = document.getElementById('workshopPopup');
    const popupVisible = popup && popup.style.display === 'flex';

    const container = popupVisible
      ? document.getElementById('popupErrorContainer')
      : document.getElementById('errorContainer');

    const messageBox = popupVisible
      ? document.getElementById('popupErrorMessage')
      : document.getElementById('errorMessage');

    const closeBtn = popupVisible
      ? document.getElementById('closePopupErrorBtn')
      : document.getElementById('closeErrorBtn');

    if (!container || !messageBox) return;

    // Forceer container naar de top van het DOM (global root)
    const root = document.getElementById('global-modal-root');
    if (root && container.parentNode !== root) {
      root.appendChild(container);
    }

    messageBox.textContent = message;
    container.style.display = 'flex';

    closeBtn.onclick = () => container.style.display = 'none';

    clearTimeout(window.errorTimeout);
    window.errorTimeout = setTimeout(() => {
      container.style.display = 'none';
    }, 2000);
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

      if (!confirmModal || !confirmMsg || !yesBtn || !noBtn) {
        console.error('Confirm modal elementen niet gevonden');
        resolve(false);
        return;
      }

      // Forceer naar top
      const root = document.getElementById('global-modal-root');
      if (root && confirmModal.parentNode !== root) {
        root.appendChild(confirmModal);
      }

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
   * Toont een succesbericht in een alert modal
   * @param {string} message - Het succesbericht
   * @returns {Promise} Promise die resolved wanneer de alert gesloten wordt
   */
  function showAlert(message) {
    return new Promise(resolve => {
      const alertModal = document.getElementById('customAlert');
      const alertMsg = document.getElementById('customAlertMessage');
      const okBtn = document.getElementById('customAlertOk');

      if (!alertModal || !alertMsg || !okBtn) {
        console.error('Alert modal elementen niet gevonden');
        resolve();
        return;
      }

      // Forceer naar top
      const root = document.getElementById('global-modal-root');
      if (root && alertModal.parentNode !== root) {
        root.appendChild(alertModal);
      }

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
   * Maakt een veilige bestandsnaam door speciale tekens te verwijderen
   * @param {string} fileName - De originele bestandsnaam
   * @returns {string} Veilige bestandsnaam
   */
  function makeSafeFileName(fileName) {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // verwijder accenten
      .replace(/\s+/g, '_') // vervang spaties
      .replace(/[^a-zA-Z0-9._-]/g, ''); // verwijder vreemde tekens
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

  // =======================
  // POPUP BEHEER
  // =======================

  /**
   * Opent de workshop popup voor het toevoegen van een nieuwe workshop
   */
  if (addBtn) addBtn.addEventListener('click', () => popup.style.display = 'flex');

  /**
   * Sluit de workshop popup en reset alle velden
   */
  if (closeBtn) closeBtn.addEventListener('click', () => { popup.style.display = 'none'; clearPopup(); });
  if (closeDetailsBtnCancel) closeDetailsBtnCancel.addEventListener('click', () => { popup.style.display = 'none'; clearPopup(); });
  window.addEventListener('click', (e) => {
    if (e.target === popup) { popup.style.display = 'none'; clearPopup(); }
  });

  // =======================
  // AFBEELDINGEN & MEDIA BEHEER
  // =======================

  /**
   * Handelt het selecteren van de hoofdafbeelding voor de workshop
   */
  if (mainImageInput) {
    mainImageInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) mainImage = file;
      mainImageInput.value = '';
    });
  }

  /**
   * Handelt het selecteren van media bestanden (afbeeldingen en video)
   * Met validatie voor maximum aantal en bestandstypes
   */
  if (workshopImagesInput) {
    workshopImagesInput.addEventListener('change', e => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const imageCount = selectedMedia.filter(f => f.type.startsWith('image/')).length;
      const videoCount = selectedMedia.filter(f => f.type.startsWith('video/')).length;

      let addedImages = 0;
      let addedVideo = 0;
      let errorOccurred = false;

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          if (imageCount + addedImages >= 5) {
            showError('Maximaal 5 afbeeldingen toegestaan.');
            errorOccurred = true;
            break;
          }
          selectedMedia.push(file);
          addedImages++;
        } else if (file.type.startsWith('video/')) {
          if (videoCount + addedVideo >= 1) {
            showError('Slechts 1 video toegestaan.');
            errorOccurred = true;
            break;
          }
          selectedMedia.push(file);
          addedVideo++;
        } else {
          showError(`Ongeldig bestandstype: ${file.name}`);
          errorOccurred = true;
          break;
        }
      }

      // Reset input bij fout
      if (errorOccurred) {
        workshopImagesInput.value = '';
        return;
      }

      workshopImagesInput.value = '';
      updateMediaPreview();
    });
  }

  // =======================
  // CATEGORIE BESTANDEN BEHEER
  // =======================

  /**
   * Handelt het uploaden van bestanden voor een specifieke categorie
   * @param {HTMLElement} input - Het file input element
   * @param {Array} array - De array waarin bestanden worden opgeslagen
   */
  function handleCategoryFiles(input, array) {
    if (!input) return;
    input.addEventListener('change', e => {
      const files = Array.from(e.target.files);
      const forbiddenExtensions = ['doc', 'docx'];

      for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();

        if (forbiddenExtensions.includes(ext)) {
          showError(`Bestandstype .${ext} is niet toegestaan. Gebruik PDF of TXT.`);
          input.value = ''; // reset input
          return;
        }

        if (!array.some(f => f.name === file.name)) {
          array.push(file);
        }
      }

      updateCategoryPreview(array, input.dataset.previewId);
      input.value = ''; // reset input
    });
  }

  /**
   * Update de preview van bestanden in een categorie
   * @param {Array} array - Array met bestanden
   * @param {string} previewId - ID van het preview element
   */
  function updateCategoryPreview(array, previewId) {
    const container = document.getElementById(previewId);
    if (!container) return;
    container.innerHTML = '';

    array.forEach((file, idx) => {
      const li = document.createElement('li');
      li.textContent = file.name;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✖';
      removeBtn.addEventListener('click', () => {
        array.splice(idx, 1);
        updateCategoryPreview(array, previewId);
      });

      li.appendChild(removeBtn);
      container.appendChild(li);
    });
  }

  // Initialiseer categorie bestand handlers
  handleCategoryFiles(instructionsInput, selectedInstructions);
  handleCategoryFiles(manualsInput, selectedManuals);
  handleCategoryFiles(demoInput, selectedDemo);
  handleCategoryFiles(worksheetsInput, selectedWorksheets);

  // =======================
  // LABELS BEHEER
  // =======================

  /**
   * Voegt een nieuwe label toe aan de workshop
   * Labels hebben een naam en kleur en worden visueel weergegeven
   */
  addLabelBtn.addEventListener('click', () => {
    const name = labelInput.value.trim();
    const color = labelColor.value;
    if (!name) return;

    labels.push({ name, color });

    const span = document.createElement('span');
    span.textContent = name;
    span.style.backgroundColor = color;
    span.style.border = '1px solid ' + color;
    span.addEventListener('click', () => {
      labelPreview.removeChild(span);
      labels = labels.filter(l => l.name !== name || l.color !== color);
    });

    labelPreview.appendChild(span);
    labelInput.value = '';
  });

  // =======================
  // PREVIEW FUNCTIES
  // =======================

  /**
   * Update de preview van geselecteerde media (afbeeldingen en video)
   * Toont thumbnails met verwijderknoppen
   */
  function updateMediaPreview() {
    if (!workshopPreview) return;
    workshopPreview.innerHTML = '';
    selectedMedia.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const el = document.createElement('div');
        el.classList.add('preview-thumb');

        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.width = '100px';
          img.style.height = '100px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '8px';
          el.appendChild(img);
        } else if (file.type.startsWith('video/')) {
          const video = document.createElement('video');
          video.src = e.target.result;
          video.controls = true;
          video.style.width = '100px';
          video.style.height = '100px';
          video.style.objectFit = 'cover';
          video.style.borderRadius = '8px';
          el.appendChild(video);
        }

        const removeBtn = document.createElement('span');
        removeBtn.textContent = '✖';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '2px';
        removeBtn.style.right = '5px';
        removeBtn.style.color = 'white';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '16px';
        removeBtn.style.background = 'rgba(0,0,0,0.5)';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.padding = '2px 5px';
        removeBtn.addEventListener('click', () => {
          const index = selectedMedia.indexOf(file);
          if (index > -1) selectedMedia.splice(index, 1);
          updateMediaPreview();
        });

        el.appendChild(removeBtn);
        workshopPreview.appendChild(el);
      }
      reader.readAsDataURL(file);
    });
  }

  /**
   * Update de preview van geselecteerde bestanden
   * Toont bestandsnamen met iconen en verwijderknoppen
   */
  function updateFilesPreview() {
    if (!workshopFilePreview) return;
    workshopFilePreview.innerHTML = '';

    selectedFiles.forEach(file => {
      const li = document.createElement('li');
      li.classList.add('file-item');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '5px';

      const icon = document.createElement('i');
      icon.classList.add('fa', getFileIconClass(file.name));
      li.appendChild(icon);

      const fileName = document.createElement('span');
      fileName.textContent = file.name;
      li.appendChild(fileName);

      const removeBtn = document.createElement('button');
      removeBtn.innerHTML = '&times;';
      removeBtn.classList.add('remove-file-btn');
      removeBtn.addEventListener('click', () => {
        selectedFiles = selectedFiles.filter(f => f.name !== file.name);
        updateFilesPreview();
      });
      li.appendChild(removeBtn);

      workshopFilePreview.appendChild(li);
    });
  }

  // =======================
  // WORKSHOP OPSLAAN
  // =======================

  /**
   * Handelt het opslaan van een workshop (nieuw of bewerken)
   * Voert validatie uit, toont laadscherm en verstuurt data naar API
   */
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const name = document.getElementById('workshopName').value.trim();
      const desc = document.getElementById('workshopDesc').value.trim();
      const durationStr = document.getElementById('workshopDuration').value.trim();
      const parentalConsent = document.getElementById('parentalConsent').checked;

      if (!name || !desc || !durationStr) {
        showError("Naam, beschrijving en duur zijn verplicht.");
        return;
      }

      // ✅ Controleer dat duur tussen 1 en 2 uur ligt
      let totalMinutes = 0;
      const timeParts = durationStr.split(':');
      if (timeParts.length === 2) {
        const [h, m] = timeParts.map(Number);
        totalMinutes = h * 60 + m;
      } else {
        totalMinutes = Number(durationStr);
      }

      if (isNaN(totalMinutes) || totalMinutes < 60 || totalMinutes > 120) {
        showError("De duur moet tussen 1 en 2 uur liggen (bijv. 01:15).");
        return;
      }

      // Toon laadpopup met progress bar
      const loadingPopup = document.getElementById('loadingPopup');
      const loadingMessage = document.getElementById('loadingMessage');
      const uploadProgress = document.getElementById('uploadProgress');

      if (loadingPopup) {
        loadingMessage.textContent = currentWorkshopId ?
          'Workshop bijwerken...' : 'Workshop uploaden...';
        loadingPopup.style.display = 'flex';
        uploadProgress.style.width = '0%';

        // Forceer popup naar boven
        const root = document.getElementById('global-modal-root');
        if (root && loadingPopup.parentNode !== root) {
          root.appendChild(loadingPopup);
        }
      }

      try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', desc);
        formData.append('duration', durationStr);
        formData.append("parentalConsent", parentalConsent);
        formData.append('labels', JSON.stringify(labels));

        if (mainImage) {
          const safeName = makeSafeFileName(mainImage.name);
          const safeFile = new File([mainImage], safeName, { type: mainImage.type });
          formData.append('image', safeFile);
        }

        // 🔹 Helper functie om veilig bestanden toe te voegen aan FormData
        const appendFilesSafely = (files, key) => {
          files.forEach(f => {
            const safeName = makeSafeFileName(f.name);
            const safeFile = new File([f], safeName, { type: f.type });
            formData.append(key, safeFile);
          });
        };

        // Voeg alle categorie bestanden toe
        appendFilesSafely(selectedMedia, 'media');
        appendFilesSafely(selectedInstructions, 'instructionsFiles');
        appendFilesSafely(selectedManuals, 'manualsFiles');
        appendFilesSafely(selectedDemo, 'demoFiles');
        appendFilesSafely(selectedWorksheets, 'worksheetsFiles');

        // 🔹 Ook de meta-data opslaan met veilige namen
        formData.append('documentMeta', JSON.stringify([
          ...selectedInstructions.map(f => ({ name: makeSafeFileName(f.name), category: 'instructions' })),
          ...selectedManuals.map(f => ({ name: makeSafeFileName(f.name), category: 'manuals' })),
          ...selectedDemo.map(f => ({ name: makeSafeFileName(f.name), category: 'demo' })),
          ...selectedWorksheets.map(f => ({ name: makeSafeFileName(f.name), category: 'worksheets' })),
        ]));

        // Voeg quiz toe als deze bestaat
        if (window.currentWorkshopData?.quiz) {
          formData.append('quiz', JSON.stringify(window.currentWorkshopData.quiz));
        }

        const token = localStorage.getItem("jwt");
        if (!token) {
          throw new Error("Geen JWT token beschikbaar");
        }

        const url = currentWorkshopId
          ? `${API_URL}/workshops/${currentWorkshopId}`
          : `${API_URL}/workshops`;
        const method = currentWorkshopId ? 'PUT' : 'POST';

        // 🔹 Gebruik XMLHttpRequest voor upload progress tracking
        const xhr = new XMLHttpRequest();

        // Stel progress event in
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && uploadProgress) {
            const percentComplete = (event.loaded / event.total) * 100;
            uploadProgress.style.width = `${percentComplete}%`;

            // Update loading message gebaseerd op progress
            if (percentComplete < 100) {
              loadingMessage.textContent = `Uploaden... ${Math.round(percentComplete)}%`;
            } else {
              loadingMessage.textContent = 'Verwerken...';
            }
          }
        });

        // Stel de completion handler in
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);

              // Zet progress op 100%
              if (uploadProgress) {
                uploadProgress.style.width = '100%';
                loadingMessage.textContent = 'Opslaan voltooid!';
              }

              // Korte pauze om het "voltooid" bericht te laten zien
              setTimeout(() => {
                clearPopup();
                popup.style.display = 'none';

                // Verberg laadpopup
                if (loadingPopup) {
                  loadingPopup.style.display = 'none';
                }

                // Toon succesbericht
                showAlert(currentWorkshopId ?
                  'Workshop succesvol bijgewerkt!' :
                  'Workshop succesvol aangemaakt!').then(() => {
                  // **BELANGRIJK: Herlaad workshops DIRECT**
                  if (typeof loadWorkshops === 'function') {
                    loadWorkshops();
                  }
                  // Ook event dispatchen voor andere listeners
                  window.dispatchEvent(new CustomEvent('workshopsUpdated'));
                });
              }, 500);

            } catch (e) {
              // Verberg laadpopup bij fout
              if (loadingPopup) {
                loadingPopup.style.display = 'none';
              }
              showError('Fout bij verwerken van server response');
            }
          } else {
            // Verberg laadpopup bij fout
            if (loadingPopup) {
              loadingPopup.style.display = 'none';
            }
            try {
              const errorData = JSON.parse(xhr.responseText);
              showError(errorData.message || 'Fout bij opslaan van de workshop');
            } catch (e) {
              showError(`Server error: ${xhr.status}`);
            }
          }
        };

        xhr.onerror = function () {
          // Verberg laadpopup bij netwerkfout
          if (loadingPopup) {
            loadingPopup.style.display = 'none';
          }
          showError('Netwerkfout. Controleer je verbinding.');
        };

        // Open en stuur de request
        xhr.open(method, url);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);

      } catch (e) {
        // Verberg laadpopup bij fout
        if (loadingPopup) {
          loadingPopup.style.display = 'none';
        }
        showError(e.message);
      }
    });
  }

  // =======================
  // EVENT LISTENERS
  // =======================

  /**
   * Luistert naar het workshopsUpdated event om de viewer te vernieuwen
   */
  window.addEventListener('workshopsUpdated', () => {
    // De viewer zal zichzelf vernieuwen
  });

  // =======================
  // CLEAR FUNCTIES
  // =======================

  /**
   * Reset alle velden in de workshop popup naar hun initiële staat
   */
  function clearPopup() {
    currentWorkshopId = null;
    mainImage = null;
    selectedMedia = [];
    selectedFiles = [];
    labels = [];
    document.getElementById('workshopName').value = '';
    document.getElementById('workshopDesc').value = '';
    document.getElementById('workshopDuration').value = '';
    labelPreview.innerHTML = '';
    if (workshopPreview) workshopPreview.innerHTML = '';
    if (workshopFilePreview) workshopFilePreview.innerHTML = '';
    if (mainImageInput) mainImageInput.value = '';
    if (workshopImagesInput) workshopImagesInput.value = '';

    // Reset category arrays
    selectedInstructions = [];
    selectedManuals = [];
    selectedDemo = [];
    selectedWorksheets = [];

    // Reset category previews
    updateCategoryPreview(selectedInstructions, 'instructionsPreview');
    updateCategoryPreview(selectedManuals, 'manualsPreview');
    updateCategoryPreview(selectedDemo, 'demoPreview');
    updateCategoryPreview(selectedWorksheets, 'worksheetsPreview');
  }

  // =======================
  // PUBLIC FUNCTIES VOOR ANDERE SCRIPTS
  // =======================

  /**
   * Globale namespace voor workshop management functies
   */
  window.workshopManagement = {
    /**
     * Opent de workshop popup in bewerkmodus
     * @param {string} id - ID van de workshop die bewerkt moet worden
     */
    editWorkshop: (id) => {
      currentWorkshopId = id;
      // Hier zou je de popup vullen met bestaande data
      popup.style.display = 'flex';
    },
    /**
     * Reset de workshop popup
     */
    clearPopup: clearPopup
  };
});