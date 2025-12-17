// workshop-management.js
document.addEventListener('DOMContentLoaded', () => {
  // =======================
  // Elementen ophalen voor management
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



  // =======================
  // Open/Close popup
  // =======================
  if (addBtn) addBtn.addEventListener('click', () => popup.style.display = 'flex');
  if (closeBtn) closeBtn.addEventListener('click', () => { popup.style.display = 'none'; clearPopup(); });
  if (closeDetailsBtnCancel) closeDetailsBtnCancel.addEventListener('click', () => { popup.style.display = 'none'; clearPopup(); });
  window.addEventListener('click', (e) => {
    if (e.target === popup) { popup.style.display = 'none'; clearPopup(); }
  });

  // =======================
  // Hoofdafbeelding selecteren
  // =======================
  if(mainImageInput){
    mainImageInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if(file) mainImage = file;
      mainImageInput.value = '';
    });
  }

  // =======================
  // Media selecteren (afbeeldingen + video) met betere validatie
  // =======================
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
  // Category file handling
  // =======================
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

  function updateCategoryPreview(array, previewId) {
    const container = document.getElementById(previewId);
    if(!container) return;
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

  handleCategoryFiles(instructionsInput, selectedInstructions);
  handleCategoryFiles(manualsInput, selectedManuals);
  handleCategoryFiles(demoInput, selectedDemo);
  handleCategoryFiles(worksheetsInput, selectedWorksheets);

  // =======================
  // Labels toevoegen
  // =======================
  addLabelBtn.addEventListener('click', () => {
    const name = labelInput.value.trim();
    const color = labelColor.value;
    if(!name) return;

    labels.push({name, color});

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
  // Preview functies
  // =======================
  function updateMediaPreview(){
    if(!workshopPreview) return;
    workshopPreview.innerHTML = '';
    selectedMedia.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const el = document.createElement('div');
        el.classList.add('preview-thumb');

        if(file.type.startsWith('image/')){
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.width = '100px';
          img.style.height = '100px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '8px';
          el.appendChild(img);
        } else if(file.type.startsWith('video/')){
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

  function updateFilesPreview(){
    if(!workshopFilePreview) return;
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

  // Helperfunctie om veilige bestandsnamen te maken
  function makeSafeFileName(fileName) {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // verwijder accenten
      .replace(/\s+/g, '_') // vervang spaties
      .replace(/[^a-zA-Z0-9._-]/g, ''); // verwijder vreemde tekens
  }

  // =======================
  // Workshop opslaan
  // =======================
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

      // 🔹 Voor al je bestanden in verschillende categorieën:
      const appendFilesSafely = (files, key) => {
        files.forEach(f => {
          const safeName = makeSafeFileName(f.name);
          const safeFile = new File([f], safeName, { type: f.type });
          formData.append(key, safeFile);
        });
      };

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
      if (window.currentWorkshopData?.quiz) {
        formData.append('quiz', JSON.stringify(window.currentWorkshopData.quiz));
      }

      try {
        const token = localStorage.getItem("jwt");
        if (!token) {
          throw new Error("Geen JWT token beschikbaar");
        }

        const headers = { "Authorization": `Bearer ${token}` };
        const url = currentWorkshopId
          ? `${API_URL}/workshops/${currentWorkshopId}`
          : `${API_URL}/workshops`;
        const method = currentWorkshopId ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          body: formData,
          headers
        });

        const responseBody = await response.text();

        if (!response.ok) {
          throw new Error('Fout bij opslaan van de workshop');
        }

        clearPopup();
        popup.style.display = 'none';
        // Herlaad workshops in het andere bestand via event
        window.dispatchEvent(new CustomEvent('workshopsUpdated'));

      } catch (e) {
        showError(e.message);
      }
    });
  }

  // =======================
  // Clear functies
  // =======================
  function clearPopup(){
    currentWorkshopId=null;
    mainImage=null;
    selectedMedia=[];
    selectedFiles=[];
    labels=[];
    document.getElementById('workshopName').value='';
    document.getElementById('workshopDesc').value='';
    document.getElementById('workshopDuration').value='';
    labelPreview.innerHTML='';
    if(workshopPreview) workshopPreview.innerHTML='';
    if(workshopFilePreview) workshopFilePreview.innerHTML='';
    if(mainImageInput) mainImageInput.value='';
    if(workshopImagesInput) workshopImagesInput.value='';

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
  // Public functions voor andere scripts
  // =======================
  window.workshopManagement = {
    editWorkshop: (id) => {
      currentWorkshopId = id;
      // Hier zou je de popup vullen met bestaande data
      popup.style.display = 'flex';
    },
    clearPopup: clearPopup
  };
});