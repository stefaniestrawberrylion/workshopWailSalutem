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
  // Helper: Authorization header
  // =======================
  function getAuthHeaders() {
    const token = localStorage.getItem("jwt");
    return {
      "Authorization": token && token.startsWith("Bearer ") ? token : "Bearer " + token
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

  // =======================
  // Workshop opslaan
  // =======================
  // =======================

  if(saveBtn){
    saveBtn.addEventListener('click', async () => {
      // Waarden uit de form ophalen
      const name = document.getElementById('workshopName').value;
      const desc = document.getElementById('workshopDesc').value;
      const duration = document.getElementById('workshopDuration').value;
      const parentalConsent = document.getElementById('parentalConsent').checked;

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', desc);
      formData.append('duration', duration);
      formData.append("parentalConsent", parentalConsent);
      formData.append('labels', JSON.stringify(labels));

      // Hoofdafbeelding
      if (mainImage) formData.append('image', mainImage);

      // Media
      selectedMedia.forEach(file => formData.append('media', file));

      // Documenten per categorie
      selectedInstructions.forEach(f => formData.append('instructionsFiles', f));
      selectedManuals.forEach(f => formData.append('manualsFiles', f));
      selectedDemo.forEach(f => formData.append('demoFiles', f));
      selectedWorksheets.forEach(f => formData.append('worksheetsFiles', f));


      const documentMeta = [
        ...selectedInstructions.map(f => ({ name: f.name, category: 'instructions' })),
        ...selectedManuals.map(f => ({ name: f.name, category: 'manuals' })),
        ...selectedDemo.map(f => ({ name: f.name, category: 'demo' })),
        ...selectedWorksheets.map(f => ({ name: f.name, category: 'worksheets' })),
      ];
      formData.append('documentMeta', JSON.stringify(documentMeta));



      try {
        const headers = getAuthHeaders();
        let response;
        if (currentWorkshopId) {
          response = await fetch(`http://localhost:3000/api/workshops/${currentWorkshopId}`, {
            method: 'PUT',
            body: formData,
            headers
          });
        } else {
          response = await fetch('http://localhost:3000/api/workshops', {
            method: 'POST',
            body: formData,
            headers
          });
        }



        if (!response.ok) throw new Error('Fout bij opslaan workshop');

        clearPopup();
        popup.style.display = 'none';
        await loadWorkshops();
      } catch (e) {
        alert(e.message);
      }
    });
  }
// =======================
// Helper: duration formatter
// =======================
  function formatDuration(duration) {
    if (!duration) return "00:00";

    // Als het al in "HH:MM" formaat is, direct teruggeven
    if (typeof duration === 'string' && duration.includes(':')) {
      const parts = duration.split(':');
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1].padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // Als het een getal is, zoals 1.5 → 01:30
    const num = parseFloat(duration);
    if (isNaN(num)) return "00:00";
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // =======================
  // Workshops ophalen
  // =======================
  async function loadWorkshops(){
    try{
      const res = await fetch('http://localhost:3000/api/workshops', { headers: getAuthHeaders() });
      if(!res.ok) throw new Error('Fout bij ophalen workshops');
      const workshops = await res.json();
      renderWorkshops(workshops);
    }catch(e){ alert(e.message); }
  }

  function renderWorkshops(workshops){
    grid.innerHTML = '';
    workshops.forEach(w=>{
      const card = document.createElement('div');
      card.classList.add('workshop-card');

      let firstImage = w.files?.find(m=>m.type==='image');
      let imageUrl = firstImage ? firstImage.url : (w.imageUrl || '/image/default-workshop.png');
      card.style.backgroundImage = `url('${imageUrl}')`;

      let durationStr = formatDuration(w.duration) + " uur";


      card.innerHTML = `
                <div class="workshop-top">
                    <div class="workshop-badge time">${durationStr}</div>
                    <div class="like">♡</div>
                </div>
                <div class="workshop-info">
                    <h3>${w.name}</h3>
                    <p>${w.review || 'Nog geen review'}</p>
                </div>
                <button class="workshop-btn">View workshop</button>
            `;

      const likeBadge = card.querySelector('.like');
      likeBadge.addEventListener('click', () => {
        likeBadge.textContent = likeBadge.textContent === '♡' ? '❤️' : '♡';
      });

      const btn = card.querySelector('.workshop-btn');
      btn.addEventListener('click', ()=>viewWorkshopDetails(w.id));

      grid.appendChild(card);
    });
  }

  // =======================
  // View details
  // =======================
  async function viewWorkshopDetails(id){
    try{
      currentWorkshopId = id;
      const res = await fetch(`http://localhost:3000/api/workshops/${id}`, { headers: getAuthHeaders() });
      if(!res.ok) throw new Error('Workshop niet gevonden');
      const w = await res.json();
      console.log('🔍 Workshop details geladen:', w);

      // Basis info
      document.getElementById('detailName').value = w.name;
      document.getElementById('detailDesc').value = w.description;
      const detailDuration = document.getElementById('detailDuration');
      detailDuration.value = formatDuration(w.duration);


      // Labels
      detailLabelPreview.innerHTML = '';
      const labelsArray = w.labels ? (typeof w.labels === 'string' ? JSON.parse(w.labels) : w.labels) : [];
      labelsArray.forEach(label => {
        const span = document.createElement('span');
        span.textContent = label.name;

        // Laat CSS het meeste doen
        span.style.backgroundColor = label.color;
        span.style.borderColor = label.color;
        span.style.color = getContrastYIQ(label.color);

        detailLabelPreview.appendChild(span);
      });

      // Oudertoestemming
      const detailParentalConsent = document.getElementById('detailParentalConsent');
      detailParentalConsent.checked = w.parentalConsent || false;

// Maak het niet disabled, maar voorkom interactie
      detailParentalConsent.addEventListener('click', e => e.preventDefault());




      // Clear bestaande lijsten
      detailInstructionsList.innerHTML = '';
      detailManualsList.innerHTML = '';
      detailDemoList.innerHTML = '';
      detailWorksheetsList.innerHTML = '';


      detailInstructionsList.innerHTML = '';
      detailManualsList.innerHTML = '';
      detailDemoList.innerHTML = '';
      detailWorksheetsList.innerHTML = '';

      if (w.documents && Array.isArray(w.documents)) {
        w.documents.forEach(f => {
          // f is nu direct een DocumentInfo object
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
          downloadLink.href = f.url || '#';
          downloadLink.setAttribute('download', f.name || 'bestand');
          downloadLink.style.background = '#007bff';
          downloadLink.style.color = 'white';
          downloadLink.style.border = 'none';
          downloadLink.style.padding = '4px 10px';
          downloadLink.style.borderRadius = '4px';
          downloadLink.style.cursor = 'pointer';
          downloadLink.style.textDecoration = 'none';
          downloadLink.addEventListener('click', (e) => e.stopPropagation());
          right.appendChild(downloadLink);

          li.appendChild(right);

          // Push in juiste categorie lijst
          const cat = (f.category || f.type || 'worksheets').toLowerCase();
          if (cat === 'instructions') detailInstructionsList.appendChild(li);
          else if (cat === 'manuals' || cat === 'handleiding') detailManualsList.appendChild(li);
          else if (cat === 'demo') detailDemoList.appendChild(li);
          else detailWorksheetsList.appendChild(li); // fallback
        });
      }



      // Slideshow media
      const container = document.getElementById('detailMediaContainer');
      container.innerHTML = '';
      const mediaFiles = w.files || [];
      mediaFiles.forEach((file,i)=>{
        let el;
        if(file.type==='image' || file.type.startsWith('image')){
          el = document.createElement('img');
          el.src = file.url;
        } else if(file.type==='video' || file.type.startsWith('video')){
          el = document.createElement('video');
          el.src = file.url;
          el.controls = true;
        } else {
          if(file.url && /\.(png|jpg|jpeg|gif|webp)$/i.test(file.url)){
            el = document.createElement('img');
            el.src = file.url;
          } else return;
        }
        el.style.display = i===0?'block':'none';
        container.appendChild(el);
      });

      // Slideshow knoppen
      let currentIndex = 0;
      prevBtn.onclick = ()=>{
        if(!container.children.length) return;
        container.children[currentIndex].style.display='none';
        currentIndex = (currentIndex-1+container.children.length)%container.children.length;
        container.children[currentIndex].style.display='block';
      };
      nextBtn.onclick = ()=>{
        if(!container.children.length) return;
        container.children[currentIndex].style.display='none';
        currentIndex = (currentIndex+1)%container.children.length;
        container.children[currentIndex].style.display='block';
      };

      // Zorg dat alle categorieën zichtbaar zijn
      document.querySelectorAll('#detailFilesContainer .file-category-content').forEach(content => {
        content.style.display = 'none';
        content.style.flexDirection = 'column';
      });

      detailsPopup.style.display = 'flex';
    }catch(e){ alert(e.message); }
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
  if(deleteBtn){
    deleteBtn.addEventListener('click', async () => {
      if(!currentWorkshopId) return;
      const confirmDelete = confirm('Weet je zeker dat je deze workshop wilt verwijderen?');
      if(!confirmDelete) return;

      try{
        const res = await fetch(`http://localhost:3000/api/workshops/${currentWorkshopId}`, {method:'DELETE', headers: getAuthHeaders()});
        if(!res.ok) throw new Error('Fout bij verwijderen workshop');

        detailsPopup.style.display='none';
        clearDetailsPopup();
        await loadWorkshops();
        alert('Workshop succesvol verwijderd!');
      }catch(e){ alert(e.message); }
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

  // =======================
  // Init
  // =======================
  loadWorkshops();
});


