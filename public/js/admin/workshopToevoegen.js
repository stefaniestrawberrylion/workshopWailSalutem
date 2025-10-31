document.addEventListener('DOMContentLoaded', () => {

  // =======================
  // Elementen ophalen
  // =======================
  const addBtn = document.getElementById('addWorkshopBtn');
  const popup = document.getElementById('workshopPopup');
  const closeBtn = document.getElementById('closePopupBtn');
  const saveBtn = document.getElementById('saveWorkshopBtn');
  const grid = document.getElementById('workshopGrid');
  const detailsPopup = document.getElementById('workshopDetailsPopup');
  const closeDetailsBtn = document.getElementById('closeDetailsPopupBtn');
  const closeDetailsBtnCancel = document.getElementById('closePopupBtnCancel');
  const deleteBtn = document.getElementById('deleteWorkshopBtn');

  const mainImageInput = document.getElementById('workshopMainImage');
  const workshopImagesInput = document.getElementById('workshopImages');
  const workshopVideoInput = document.getElementById('workshopVideo');
  const workshopFilesInput = document.getElementById('workshopFiles');

  const addLabelBtn = document.getElementById('addLabelBtn');
  const labelInput = document.getElementById('workshopLabelInput');
  const labelColor = document.getElementById('workshopLabelColor');
  const labelPreview = document.getElementById('labelPreview');
  const detailLabelPreview = document.getElementById('detailLabelPreview');

  const searchInput = document.getElementById('searchInput');
  const prevBtn = document.getElementById('prevDetailMedia');
  const nextBtn = document.getElementById('nextDetailMedia');

  const workshopPreview = document.getElementById('workshopPreview');
  const workshopFilePreview = document.getElementById('workshopFilePreview');

  // detail category lists
  const detailInstructionsList = document.getElementById('detail_instructionsList');
  const detailManualsList = document.getElementById('detail_manualsList');
  const detailDemoList = document.getElementById('detail_demoList');
  const detailWorksheetsList = document.getElementById('detail_worksheetsList');

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

  console.log("Backend URL:", API_URL);

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
    const popupVisible = popup && popup.style.display === 'block';

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

    messageBox.textContent = message;
    container.style.display = 'flex';

    closeBtn.onclick = () => container.style.display = 'none';

    clearTimeout(window.errorTimeout);
    window.errorTimeout = setTimeout(() => {
      container.style.display = 'none';
    }, 5000);
  }

  // =======================
  // Open/Close popup
  // =======================
  if (addBtn) addBtn.addEventListener('click', () => popup.style.display = 'flex');
  if (closeBtn) closeBtn.addEventListener('click', () => { popup.style.display = 'none'; clearPopup(); });
  if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', () => { detailsPopup.style.display = 'none'; clearDetailsPopup(); });
  if (closeDetailsBtnCancel) closeDetailsBtnCancel.addEventListener('click', () => { popup.style.display = 'none'; clearPopup(); });
  window.addEventListener('click', (e) => {
    if (e.target === popup) { popup.style.display = 'none'; clearPopup(); }
    if (e.target === detailsPopup) { detailsPopup.style.display = 'none'; clearDetailsPopup(); }
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
  // Media selecteren (afbeeldingen + video)
  // =======================
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

  const instructionsInput = document.getElementById('instructionsInput');
  const manualsInput = document.getElementById('manualsInput');
  const demoInput = document.getElementById('demoInput');
  const worksheetsInput = document.getElementById('worksheetsInput');

  function handleCategoryFiles(input, array) {
    if(!input) return;
    input.addEventListener('change', e => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        if(!array.some(f => f.name === file.name)) {
          array.push(file);
        }
      });
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


      try {
        const token = localStorage.getItem("jwt");
        if (!token) {
          console.error("❌ Geen token gevonden in localStorage!");
          throw new Error("Geen JWT token beschikbaar");
        }

        const headers = { "Authorization": `Bearer ${token}` };
        const url = currentWorkshopId
          ? `${API_URL}/api/workshops/${currentWorkshopId}`
          : `${API_URL}/api/workshops`;
        const method = currentWorkshopId ? 'PUT' : 'POST';

        console.log(`📡 Verzenden ${method} request naar ${url}...`);
        const response = await fetch(url, {
          method,
          body: formData,
          headers
        });

        console.log("Response status:", response.status);
        const responseBody = await response.text();
        console.log("Response body:", responseBody);

        if (!response.ok) {
          throw new Error('Fout bij opslaan van de workshop');
        }

        clearPopup();
        popup.style.display = 'none';
        await loadWorkshops();

      } catch (e) {
        console.error("💥 Error in saveBtn click handler:", e);
        showError(e.message);
      }
    });
  }


  // =======================
// Workshops ophalen
// =======================
  async function loadWorkshops() {
    try {
      const res = await fetch(`${API_URL}/api/workshops`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Fout bij ophalen workshops');

      const workshops = await res.json();
      renderWorkshops(workshops);
    } catch (e) {
      alert(e.message);
    }
  }


/// =======================
// Render workshops (grid)
// =======================
  function renderWorkshops(workshops) {
    grid.innerHTML = '';
    workshops.forEach(w => {
      const card = document.createElement('div');
      card.classList.add('workshop-card');

      // Pak de eerste afbeelding, fallback naar main image of default

      let firstImage = w.files?.find(f => f.type?.includes('image'));
      let imageUrl = '/image/default-workshop.png';

      if (firstImage) {
        const rawUrl = firstImage.url || firstImage.path || firstImage.filename || firstImage.name;
        if (rawUrl) imageUrl = rawUrl.startsWith('http')
          ? rawUrl
          : `${API_URL}/uploads/${encodeURIComponent(rawUrl.replace(/^\/+|uploads\/+/g, ''))}`;
      } else if (w.imageUrl) {
        imageUrl = w.imageUrl.startsWith('http')
          ? w.imageUrl
          : `${API_URL}/uploads/${encodeURIComponent(w.imageUrl.replace(/^\/+|uploads\/+/g, ''))}`;
      }


      let durationStr = formatDuration(w.duration) + " uur";

      card.innerHTML = `
  <div class="workshop-image" style="background-image: url('${imageUrl}')">
    <div class="workshop-top">
      <div class="workshop-badge time">${durationStr}</div>
      <div class="like">♡</div>
    </div>
    <div class="workshop-bottom">
      <div class="workshop-info">
        <h3>${w.name}</h3>
        <p>${w.review || 'Nog geen review'}</p>
      </div>
      <button class="workshop-btn">Bekijk workshop</button>
    </div>
  </div>
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

      // ✅ Gebruik dynamische API_URL
      const res = await fetch(`${API_URL}/api/workshops/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Workshop niet gevonden');
      const w = await res.json();

      // Basis info
      document.getElementById('detailName').value = w.name;
      document.getElementById('detailDesc').value = w.description;
      document.getElementById('detailDuration').value = formatDuration(w.duration);
      document.getElementById('detailParentalConsent').checked = w.parentalConsent || false;

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

          // ✅ Dynamische downloadlink
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

            // ✅ Bekijk knop (openen in nieuw tabblad)
            const viewLink = document.createElement('a');
            viewLink.textContent = 'Bekijk';


          const fileUrl = `${API_URL}${f.url}`;
          if (fileUrl.endsWith('.docx')) {
            viewLink.href = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
          } else {
            viewLink.href = fileUrl;
          }


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

          // ✅ Voeg toe aan juiste categorie
          const cat = (f.category || f.type || 'worksheets').toLowerCase();
          if (cat === 'instructions') detailInstructionsList.appendChild(li);
          else if (cat === 'manuals' || cat === 'handleiding') detailManualsList.appendChild(li);
          else if (cat === 'demo') detailDemoList.appendChild(li);
          else detailWorksheetsList.appendChild(li);
        });
      }

      // ✅ Slideshow media
      const container = document.getElementById('detailMediaContainer');
      container.innerHTML = '';
      const mediaFiles = w.files || [];
      mediaFiles.forEach((file, i) => {
        let el;
        const rawUrl = file.url || file.path || file.filename || file.name;
        if (!rawUrl) return; // geen geldig pad, sla over
        const fileUrl = rawUrl.startsWith('http')
          ? rawUrl
          : `${API_URL}/uploads/${encodeURIComponent(rawUrl.replace(/^\/+|uploads\/+/g, ''))}`;

        if (file.type.startsWith('image')) {
          el = document.createElement('img');
          el.src = fileUrl;
        } else if (file.type.startsWith('video')) {
          el = document.createElement('video');
          el.src = fileUrl;
          el.controls = true;
        } else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(file.url)) {
          el = document.createElement('img');
          el.src = fileUrl;
        } else return;

        el.style.display = i === 0 ? 'block' : 'none';
        container.appendChild(el);
      });

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
      alert(e.message);
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
    if(workshopVideoInput) workshopVideoInput.value='';
    if(workshopFilesInput) workshopFilesInput.value='';
  }

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
// Delete workshop
// =======================
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!currentWorkshopId) return;
      const confirmDelete = confirm('Weet je zeker dat je deze workshop wilt verwijderen?');
      if (!confirmDelete) return;

      try {
        // ✅ Gebruik dynamische API_URL
        const res = await fetch(`${API_URL}/api/workshops/${currentWorkshopId}`, {
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
  // Search
  // =======================
  if(searchInput){
    searchInput.addEventListener('input', ()=>{
      const query = searchInput.value.toLowerCase();
      const cards = document.querySelectorAll('.workshop-card');
      cards.forEach(c=>{
        const name = c.querySelector('.workshop-info h3').textContent.toLowerCase();
        const desc = c.querySelector('.workshop-info p').textContent.toLowerCase();
        c.style.display = (name.includes(query)||desc.includes(query))?'flex':'none';
      });
    });
  }

  // =======================
// Toggle categorieën (maar één tegelijk open)
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

// Lightbox functionaliteit
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
  // terug naar de dashboard (registreer direct binnen de outer DOMContentLoaded)
  const backBtn = document.getElementById("backToDashboardBtn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/dashboard";
    });
  }

  // =======================
  // Init
  // =======================
  loadWorkshops();
});


