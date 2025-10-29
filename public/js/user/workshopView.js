document.addEventListener('DOMContentLoaded', () => {

  // =======================
  // Elementen ophalen
  // =======================
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

  let currentWorkshopId = null;
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
      ? "http://localhost:8080" // lokale backend
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

  function clearPopup(){
    currentWorkshopId = null;
    mainImage = null;
    selectedMedia = [];
    selectedFiles = [];
    labels = [];
    ['workshopName','workshopDesc','workshopDuration'].forEach(id => document.getElementById(id).value='');
    labelPreview.innerHTML = '';
    if(workshopPreview) workshopPreview.innerHTML = '';
    if(workshopFilePreview) workshopFilePreview.innerHTML = '';
    [mainImageInput, workshopImagesInput, workshopVideoInput, workshopFilesInput].forEach(input => { if(input) input.value=''; });
  }

  function clearDetailsPopup(){
    currentWorkshopId = null;
    ['detailName','detailDesc','detailDuration'].forEach(id => document.getElementById(id).value='');
    detailLabelPreview.innerHTML = '';
    [detailInstructionsList, detailManualsList, detailDemoList, detailWorksheetsList].forEach(list => { if(list) list.innerHTML=''; });
    const mediaContainer = document.getElementById('detailMediaContainer');
    if(mediaContainer) mediaContainer.innerHTML='';
  }

  // =======================
  // Media preview update
  // =======================
  function updateMediaPreview() {
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
          Object.assign(img.style, { width:'100px', height:'100px', objectFit:'cover', borderRadius:'8px' });
          el.appendChild(img);
        } else if(file.type.startsWith('video/')){
          const video = document.createElement('video');
          video.src = e.target.result;
          video.controls = true;
          Object.assign(video.style, { width:'100px', height:'100px', objectFit:'cover', borderRadius:'8px' });
          el.appendChild(video);
        }
        workshopPreview.appendChild(el);
      };
      reader.readAsDataURL(file);
    });
  }

  function updateFilesPreview(){
    if(!workshopFilePreview) return;
    workshopFilePreview.innerHTML = '';
    selectedFiles.forEach(file => {
      const li = document.createElement('li');
      li.classList.add('file-item');
      Object.assign(li.style, { display:'flex', alignItems:'center', gap:'5px' });

      const icon = document.createElement('i');
      icon.classList.add('fa', getFileIconClass(file.name));
      li.appendChild(icon);

      const fileName = document.createElement('span');
      fileName.textContent = file.name;
      li.appendChild(fileName);

      workshopFilePreview.appendChild(li);
    });
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

  function renderWorkshops(workshops){
    grid.innerHTML = '';
    workshops.forEach(w=>{
      const card = document.createElement('div');
      card.classList.add('workshop-card');

      const firstImage = w.files?.find(m=>m.type==='image');
      const imageUrl = firstImage ? firstImage.url : (w.imageUrl || '/image/default-workshop.png');
      card.style.backgroundImage = `url('${imageUrl}')`;

      const durationStr = formatDuration(w.duration) + " uur";

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
      const res = await fetch(`${API_URL}/api/workshops/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Workshop niet gevonden');
      const w = await res.json();

      // Basis info
      document.getElementById('detailName').value = w.name;
      document.getElementById('detailDesc').value = w.description;
      document.getElementById('detailDuration').value = formatDuration(w.duration);

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

      // Oudertoestemming
      const detailParentalConsent = document.getElementById('detailParentalConsent');
      detailParentalConsent.checked = w.parentalConsent || false;
      detailParentalConsent.addEventListener('click', e => e.preventDefault());

      // Clear en render documenten
      [detailInstructionsList, detailManualsList, detailDemoList, detailWorksheetsList].forEach(list => list.innerHTML = '');
      if (w.documents && Array.isArray(w.documents)) {
        w.documents.forEach(f => addDocumentToDetail(f));
      }

      // Slideshow media
      renderMediaSlideshow(w.files || []);

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
      if(file.type.startsWith('image')) el = document.createElement('img');
      else if(file.type.startsWith('video')){
        el = document.createElement('video');
        el.controls = true;
      }
      else if(file.url && /\.(png|jpg|jpeg|gif|webp)$/i.test(file.url)) el = document.createElement('img');
      else return;

      el.src = file.url;
      el.style.display = i===0 ? 'block' : 'none';
      container.appendChild(el);
    });

    let currentIndex=0;
    prevBtn.onclick = () => { if(!container.children.length) return; container.children[currentIndex].style.display='none'; currentIndex=(currentIndex-1+container.children.length)%container.children.length; container.children[currentIndex].style.display='block'; };
    nextBtn.onclick = () => { if(!container.children.length) return; container.children[currentIndex].style.display='none'; currentIndex=(currentIndex+1)%container.children.length; container.children[currentIndex].style.display='block'; };
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
      clearDetailsPopup(); // Optioneel: reset de velden
    }
  });

// Bestaande close-knop blijft ook werken
  closeDetailsBtn.addEventListener('click', () => {
    detailsPopup.style.display = 'none';
    clearDetailsPopup();
  });

  // =======================
  // Init
  // =======================
  loadWorkshops();
});
