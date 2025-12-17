    // workshop-display.js
    document.addEventListener('DOMContentLoaded', () => {
      // =======================
      // Elementen ophalen
      // =======================
      const grid = document.getElementById('workshopGrid');
      const detailsPopup = document.getElementById('workshopDetailsPopup');
      const closeDetailsBtn = document.getElementById('closeDetailsPopupBtn');
      const searchInput = document.getElementById('searchInput');

      const detailLabelPreview = document.getElementById('detailLabelPreview');
      const prevBtn = document.getElementById('prevDetailMedia');
      const nextBtn = document.getElementById('nextDetailMedia');

      const detailInstructionsList = document.getElementById('detail_instructionsList');
      const detailManualsList = document.getElementById('detail_manualsList');
      const detailDemoList = document.getElementById('detail_demoList');
      const detailWorksheetsList = document.getElementById('detail_worksheetsList');

      const lightbox = document.getElementById('mediaLightbox');
      const lightboxImg = document.getElementById('lightboxImage');
      const lightboxVideo = document.getElementById('lightboxVideo');
      const closeLightbox = document.querySelector('.close-lightbox');

      const favoritesBtn = document.getElementById('favoritesBtn');
      const noResultsMsg = document.getElementById('no-results');


      // =======================
// Popup modal voor alerts en confirms
// =======================
      window.popupAlert = function(message) {
        return new Promise(resolve => {
          const modal = document.getElementById('popupModal');
          const msg = document.getElementById('popupModalMessage');
          const okBtn = document.getElementById('popupModalOk');
          const cancelBtn = document.getElementById('popupModalCancel');

          msg.textContent = message;
          cancelBtn.style.display = 'none';
          okBtn.style.display = 'none';
          modal.classList.remove('fade-out');
          modal.style.display = 'flex';
          modal.style.zIndex = '999999';

          // Na 1.5 seconde begin fade-out
          setTimeout(() => {
            modal.classList.add('fade-out');
          }, 1500);

          // Sluit volledig na 2 seconde
          setTimeout(() => {
            modal.style.display = 'none';
            resolve();
          }, 2000);
        });
      };


      window.popupConfirm = function(message) {
        return new Promise(resolve => {
          const modal = document.getElementById('popupModal');
          const msg = document.getElementById('popupModalMessage');
          const okBtn = document.getElementById('popupModalOk');
          const cancelBtn = document.getElementById('popupModalCancel');

          msg.textContent = message;
          cancelBtn.style.display = 'inline-block';
          modal.style.display = 'flex';

          okBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(true);
          };

          cancelBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(false);
          };
        });
      };


      // =======================
      // Globale variabelen
      // =======================
      let isShowingFavorites = false; // Status voor weergave (Alle vs. Favorieten)
      let userFavorites = []; // Opslag voor gelikede workshop ID's

      // =======================
      // Load workshops
      // =======================
      async function loadWorkshops() {
        try {
          // Haal eerst de favorieten van de gebruiker op
          await loadUserFavorites();

          const res = await fetch(`${window.API_URL}/workshops`, {
            headers: window.getAuthHeaders()
          });
          if (!res.ok) throw new Error('Fout bij ophalen workshops');
          const workshops = await res.json();

          // Roep de filter/render functie aan om alle workshops te tonen
          filterAndRenderWorkshops(workshops);

        } catch (e) {
          await window.popupAlert(e.message);
        }

      }

      // NIEUW: Favoriete workshops laden
      async function loadUserFavorites() {
        const token = localStorage.getItem('jwt');
        if (!token) {
          userFavorites = [];
          console.warn('Gebruiker niet ingelogd. Kan geen favorieten laden.');
          return;
        }

        try {
          const res = await fetch(`${window.API_URL}/favorites`, {
            headers: window.getAuthHeaders()
          });

          // VERBETERDE FOUTAFHANDELING
          if (!res.ok) {
            const errorBody = await res.text().catch(() => 'Geen body beschikbaar');
            console.error('API Fout bij ophalen favorieten:', res.status, res.statusText, errorBody);
            throw new Error(`Fout bij ophalen favorieten (Status: ${res.status})`);
          }

          const favorites = await res.json();

          // Sla alleen de workshop ID's op voor snelle controle
          userFavorites = favorites.map(fav => fav.workshop.id);

        } catch (e) {
          await window.popupAlert('Kon favorieten niet laden: ' + e.message);
        }

      }


      // NIEUW: Favoriete workshops ophalen en tonen
      async function loadFavoriteWorkshops() {
        try {
          await loadUserFavorites(); // Zorgt ervoor dat userFavorites up-to-date is

          const res = await fetch(`${window.API_URL}/workshops`, {
            headers: window.getAuthHeaders()
          });
          if (!res.ok) throw new Error('Fout bij ophalen workshops');
          const allWorkshops = await res.json();

          // Filter de workshops op basis van de gelikede ID's
          const favoriteWorkshops = allWorkshops.filter(w => userFavorites.includes(w.id));

          filterAndRenderWorkshops(favoriteWorkshops);

        } catch (e) {
          await window.popupAlert('Kon favorieten niet laden: ' + e.message);
        }
      }

      // NIEUW: Functie om de weergave te bepalen (Alle of Favorieten)
      function filterAndRenderWorkshops(workshops) {
        // Pas de zoekfunctionaliteit toe op de huidige set workshops
        const query = searchInput.value.trim().toLowerCase();
        const filteredWorkshops = workshops.filter(w => {
          const name = w.name ? w.name.toLowerCase() : '';
          const desc = w.description ? w.description.toLowerCase() : '';

          return name.includes(query) || (w.description && w.description.toLowerCase().includes(query));
        });

        renderWorkshops(filteredWorkshops);

        // Toon de "geen resultaten" melding
        noResultsMsg.style.display = (filteredWorkshops.length === 0 && query !== '') ? 'block' : 'none';
      }



  // Render workshops grid
  // =======================
      function renderWorkshops(workshops) {
        grid.innerHTML = '';

        // Beheer "geen resultaten" boodschap
        if(workshops.length > 0 || searchInput.value.trim() !== '') {
          noResultsMsg.style.display = 'none';
        } else if (isShowingFavorites) {
          noResultsMsg.textContent = 'Je hebt nog geen favoriete workshops.';
          noResultsMsg.style.display = 'block';
        } else {
          noResultsMsg.textContent = 'Kan uw zoekopdracht niet vinden';
          noResultsMsg.style.display = 'none'; // Standaard verbergen als we nog niet zoeken
        }

        workshops.forEach(w => {
          const card = document.createElement('div');
          card.classList.add('workshop-card');
          card.setAttribute('data-workshop-id', w.id);

          let durationMinutes = 0;

          if (typeof w.duration === "string" && w.duration.includes(":")) {
            const [h, m] = w.duration.split(":").map(Number);
            durationMinutes = h * 60 + m;
          } else {
            const hours = Number(w.duration) || 0;
            durationMinutes = Math.round(hours * 60);
          }

          card.setAttribute("data-duration", durationMinutes);



          // VOEG DIT TOE: Sla labels op voor filtering
          if (w.labels) {
            const labelsArray = w.labels ? (typeof w.labels === 'string' ? JSON.parse(w.labels) : w.labels) : [];
            const labelNames = labelsArray.map(label => label.name);
            card.setAttribute('data-labels', JSON.stringify(labelNames));
          }

          // VOEG DIT TOE: Sla rating op voor filtering - gebruik andere variabele naam
          const totalReviews = (w.reviews && Array.isArray(w.reviews)) ? w.reviews.length : 0;
          let averageRating = 0;
          if (totalReviews > 0) {
            averageRating = w.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / totalReviews;
          }
          card.setAttribute('data-rating', averageRating.toFixed(1));

          // Pak de eerste afbeelding, fallback naar main image of default
          let firstImage = w.files?.find(f => f.type?.startsWith('image'));
          let imageUrl = '/image/default-workshop.png';

          if (firstImage) {
            const rawUrl = firstImage.url || firstImage.name;
            if (rawUrl) {
              const fileName = rawUrl.split(/[/\\]/).pop();
              imageUrl = `${window.API_URL}/uploads/${encodeURIComponent(fileName)}`;
            }
          } else if (w.imagePath) {
            const fileName = w.imagePath.split(/[/\\]/).pop();
            imageUrl = `${window.API_URL}/uploads/${encodeURIComponent(fileName)}`;
          }

          // Zet de achtergrond op de card zelf
          card.style.backgroundImage = `url('${imageUrl}')`;
          card.style.backgroundSize = 'cover';
          card.style.backgroundPosition = 'center';

          const durationStr = window.formatDuration(w.duration) + " uur";

          // Review gemiddelde - gebruik de oorspronkelijke reviewCount variabele
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

          // Bepaal de 'like' status op basis van userFavorites
          const isLiked = userFavorites.includes(w.id);

          card.innerHTML = `
    <div class="workshop-top">
      <div class="workshop-badge time">${durationStr}</div>
      <div class="like">${isLiked ? '❤️' : '♡'}</div>
    </div>
    <div class="workshop-image">
      <img src="${imageUrl}" alt="${w.name}" onerror="this.src='/image/default-workshop.png'">
    </div>
    <div class="workshop-info">
      <h3>${w.name}</h3>
      <p>${reviewContent}</p>
    </div>
    <button class="workshop-btn">Bekijk workshop</button>
  `;

          const likeBadge = card.querySelector('.like');
          likeBadge.addEventListener('click', async () => {
            const liked = likeBadge.textContent === '♡';

            const token = localStorage.getItem('jwt');
            if (!token) return;

            try {
              const res = await fetch(`${window.API_URL}/favorites`, {
                method: liked ? 'POST' : 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ workshopId: w.id })
              });

              // VERBETERDE FOUTAFHANDELING
              if(!res.ok) {
                const errorBody = await res.text().catch(() => 'Geen body beschikbaar');
                console.error('API Fout bij opslaan favoriet:', res.status, res.statusText, errorBody);
                throw new Error(`Kon favoriete status niet wijzigen (Status: ${res.status})`);
              }

              // Update de badge en de globale lijst van favorieten na succes
              likeBadge.textContent = liked ? '❤️' : '♡';
              if (liked) {
                userFavorites.push(w.id);
              } else {
                userFavorites = userFavorites.filter(id => id !== w.id);
              }
              if (window.applyWorkshopFilters) {
                setTimeout(() => window.applyWorkshopFilters(), 100);
              }
              // Als we in de "Favorieten" weergave zitten, herlaad dan om de verwijderde kaart te laten verdwijnen
              if (isShowingFavorites && !liked) {
                loadFavoriteWorkshops();
              }

            } catch (err) {
              await window.popupAlert('Fout bij het opslaan van de favoriete status.');
              // Terugdraaien van de UI als de API faalt
              likeBadge.textContent = liked ? '♡' : '❤️';
            }
          });


          // Open details popup
          const btn = card.querySelector('.workshop-btn');
          btn.addEventListener('click', () => viewWorkshopDetails(w.id));

          grid.appendChild(card);
        });

        // Pas filters toe na renderen
        if (window.applyWorkshopFilters) {
          setTimeout(() => window.applyWorkshopFilters(), 100);
        }
      }

      // =======================
// Quiz Popup functionaliteit
// =======================
      const quizPopup = document.getElementById('quizPopup');
      const quizContainer = document.getElementById('quizContainer');
      const submitQuizBtn = document.getElementById('submitQuizBtn');
      const quizResult = document.getElementById('quizResult');
      const closeQuizBtn = document.querySelector('.close-quiz-popup');

// Sluit quiz popup
      closeQuizBtn.addEventListener('click', () => {
        quizPopup.classList.remove('active');
        setTimeout(() => {
          quizPopup.style.display = 'none';
          quizContainer.innerHTML = '';
          if (quizResult) {
            quizResult.textContent = '';
            quizResult.classList.remove('show');
          }
        }, 300);
      });

// Sluit bij klikken buiten de popup
      quizPopup.addEventListener('click', (e) => {
        if (e.target === quizPopup) {
          quizPopup.classList.remove('active');
          setTimeout(() => {
            quizPopup.style.display = 'none';
            quizContainer.innerHTML = '';
            if (quizResult) {
              quizResult.textContent = '';
              quizResult.classList.remove('show');
            }
          }, 300);
        }
      });

// Functie om quiz te starten
      async function startQuiz(workshopId) {
        try {
          window.currentWorkshopId = workshopId;

          const res = await fetch(`${window.API_URL}/workshops/${workshopId}`, {
            headers: window.getAuthHeaders()
          });
          if (!res.ok) throw new Error('Workshop niet gevonden');

          const workshop = await res.json();
          const quiz = workshop.quiz || [];

          if (quiz.length === 0) {
            await popupAlert('Deze workshop heeft geen quiz.');
            return;
          }

          displayQuiz(quiz);

        } catch (error) {
          await popupAlert('Kon quiz niet laden: ' + error.message);
        }
      }

// Functie om quiz te tonen
      function displayQuiz(quiz) {
        if (!quizContainer || !quizPopup) return;

        quizPopup.style.display = 'flex'; // Zorg dat popup zichtbaar is
        quizPopup.classList.add('active');

        quizContainer.innerHTML = '';
        if (quizResult) {
          quizResult.textContent = '';
          quizResult.classList.remove('show');
        }

        // Progress indicator
        const progressHTML = `
    <div class="quiz-progress">
        <span id="currentQuestion">1</span>
        <div class="quiz-progress-bar">
            <div class="quiz-progress-fill" id="progressFill"></div>
        </div>
        <span id="totalQuestions">${quiz.length}</span>
    </div>
  `;
        quizContainer.innerHTML = progressHTML;

        // Vragen toevoegen
        quiz.forEach((question, index) => {
          const questionBlock = document.createElement('div');
          questionBlock.className = 'quiz-question-block';
          questionBlock.dataset.questionIndex = index;

          let html = `<h3>${index + 1}. ${question.question}</h3>`;
          question.options.forEach((option, optionIndex) => {
            html += `
        <label>
          <input type="radio" name="quiz-q${index}" value="${optionIndex}">
          <span>${option.text}</span>
        </label>
      `;
          });

          questionBlock.innerHTML = html;
          quizContainer.appendChild(questionBlock);

          questionBlock.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
              updateProgress(quiz.length);
            });
          });
        });

        updateProgress(quiz.length);
      }

// Progress bar update
      function updateProgress(totalQuestions) {
        const answered = document.querySelectorAll('.quiz-question-block input[type="radio"]:checked').length;
        const progressFill = document.getElementById('progressFill');
        const currentQuestion = document.getElementById('currentQuestion');

        if (progressFill) {
          const percentage = (answered / totalQuestions) * 100;
          progressFill.style.width = `${percentage}%`;
        }

        if (currentQuestion) {
          currentQuestion.textContent = answered + 1;
        }
      }

// Submit quiz
      submitQuizBtn.addEventListener('click', async () => {
        try {
          const res = await fetch(`${window.API_URL}/workshops/${window.currentWorkshopId}`, {
            headers: window.getAuthHeaders()
          });
          if (!res.ok) throw new Error('Kon quiz antwoorden niet controleren');

          const workshop = await res.json();
          const quiz = workshop.quiz || [];

          if (quiz.length === 0) {
            quizResult.textContent = 'Geen quiz beschikbaar';
            quizResult.classList.add('show');
            return;
          }

          let correctCount = 0;
          quiz.forEach((question, index) => {
            const selected = document.querySelector(`input[name="quiz-q${index}"]:checked`);
            const questionBlock = quizContainer.querySelector(`[data-question-index="${index}"]`);

            if (!questionBlock) return;

            if (!selected) {
              questionBlock.style.borderLeftColor = '#ffc107'; // Geel voor niet beantwoord
              return;
            }

            const chosenIndex = parseInt(selected.value);
            const isCorrect = question.options[chosenIndex]?.correct === true;
            if (isCorrect) {
              correctCount++;
              questionBlock.style.borderLeftColor = '#28a745'; // Groen voor correct
            } else {
              questionBlock.style.borderLeftColor = '#dc3545'; // Rood voor fout
            }
          });

          const totalQuestions = quiz.length;
          const percentage = Math.round((correctCount / totalQuestions) * 100);

          if (quizResult) {
            let feedbackClass = '';
            let feedbackText = '';
            if (percentage === 100) { feedbackClass='perfect'; feedbackText='Perfect! Alle antwoorden zijn correct! 🎉'; }
            else if (percentage >= 70) { feedbackClass='good'; feedbackText='Goed gedaan! 💪'; }
            else if (percentage >= 50) { feedbackClass='average'; feedbackText='Niet slecht! 👍'; }
            else { feedbackClass='poor'; feedbackText='Misschien nog een keer proberen? 😊'; }

            quizResult.innerHTML = `
        <div class="quiz-score-display">${correctCount} / ${totalQuestions}</div>
        <div class="quiz-score-percentage">${percentage}%</div>
        <div class="quiz-feedback ${feedbackClass}">${feedbackText}</div>
      `;
            quizResult.classList.add('show');
            setTimeout(() => { quizResult.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
          }

          // Eventueel opslaan
          await saveQuizResult(correctCount, totalQuestions);

        } catch (error) {
          if (quizResult) {
            quizResult.textContent = 'Fout bij controleren: ' + error.message;
            quizResult.classList.add('show');
          }
        }
      });

// Opslaan resultaat
      async function saveQuizResult(correct, total) {
        const token = localStorage.getItem('jwt');
        if (!token) return;

        try {
          await fetch(`${window.API_URL}/quiz/results`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              workshopId: window.currentWorkshopId,
              score: correct,
              totalQuestions: total,
              percentage: Math.round((correct / total) * 100)
            })
          });
        } catch (error) { console.warn('Kon quizresultaat niet opslaan:', error); }
      }

// =======================
// View workshop details
// =======================
      async function viewWorkshopDetails(id) {
        try {
          window.currentWorkshopId = id;

          // Haal workshop op
          const resWorkshop = await fetch(`${window.API_URL}/workshops/${id}`, {
            headers: window.getAuthHeaders()
          });
          if (!resWorkshop.ok) throw new Error('Workshop niet gevonden');
          const workshop = await resWorkshop.json();

          // Vul workshopgegevens
          document.getElementById('detailName').value = workshop.name;
          document.getElementById('detailDesc').value = workshop.description;
          document.getElementById('detailDuration').value = window.formatDuration(workshop.duration);

          // Labels
          const labelsArray = workshop.labels ? (typeof workshop.labels === 'string' ? JSON.parse(workshop.labels) : workshop.labels) : [];
          detailLabelPreview.innerHTML = '';
          labelsArray.forEach(label => {
            const span = document.createElement('span');
            span.textContent = label.name;
            span.style.backgroundColor = label.color;
            span.style.borderColor = label.color;
            span.style.color = window.getContrastYIQ(label.color);
            detailLabelPreview.appendChild(span);
          });

          // Haal de elementen op
          const parentalConsentCheckbox = document.getElementById('detailParentalConsent');
          const consentContactLinkSpan = document.getElementById('consentContactLink');

          parentalConsentCheckbox.checked = workshop.parentalConsent || false;

          if (workshop.parentalConsent) {
            // Toon de tekst en de link
            consentContactLinkSpan.innerHTML = `
                <span style="color: #698ac1; font-weight: bold;">
                    <a href="/documenten/2.1. Toestemmingsformulier.pdf" target="_blank" style="color: #698ac1;">
                        Toestemmingsformulier
                    </a>
                </span>`;
            // Maak de checkbox duidelijk dat het vereist is
            parentalConsentCheckbox.nextElementSibling.textContent = 'Oudertoestemming vereist:';
          } else {
            // Verberg/wis de link als er geen toestemming nodig is
            consentContactLinkSpan.innerHTML = '';
            parentalConsentCheckbox.nextElementSibling.textContent = 'Oudertoestemming niet vereist';
          }

          // Media & documenten
          renderMediaSlideshow(workshop.files || []);
          // Maak de documentenlijsten leeg voordat je ze vult
          [detailInstructionsList, detailManualsList, detailDemoList, detailWorksheetsList].forEach(list => list.innerHTML = '');
          if (workshop.documents && Array.isArray(workshop.documents)) {
            workshop.documents.forEach(f => addDocumentToDetail(f));
          }

          // Haal review op
          await loadReviews(id);

          // QUIZ KNOB TOEVOEGEN - NIEUW
          const detailReviewBox = document.getElementById('detailReviewBox');
          if (detailReviewBox) {
            // Verwijder bestaande quiz knop als die er al is
            const existingQuizSection = document.querySelector('.quiz-section');
            if (existingQuizSection) {
              existingQuizSection.remove();
            }

            // Controleer of er een quiz is
            const quiz = workshop.quiz || [];

            // Voeg quiz sectie toe na de review box
            const quizSection = document.createElement('div');
            quizSection.className = 'quiz-section';
            quizSection.style.cssText = `
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #eee;
            `;

            if (quiz.length > 0) {
              quizSection.innerHTML = `
                    <h4 style="margin-bottom: 10px;">Test je kennis</h4>
                    <button class="quiz-start-btn" style="
                        padding: 10px 16px;
                        background: #5481B7;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        width: 100%;
                    ">
                        Maak de quiz (${quiz.length} vragen)
                    </button>
                `;

              // Voeg event listener toe voor de quiz knop
              const quizButton = quizSection.querySelector('.quiz-start-btn');
              quizButton.addEventListener('click', () => startQuiz(id));
            } else {
              quizSection.innerHTML = `
                    <p style="color: #666; font-size: 14px; margin: 0;">
                        Deze workshop heeft nog geen quiz
                    </p>
                `;
            }

            // Voeg toe na de review box
            detailReviewBox.parentNode.insertBefore(quizSection, detailReviewBox.nextSibling);
          }

          // Update my review stars (bestaande functionaliteit)
          const detailMyReviewStars = document.getElementById('detailMyReviewStars');
          if (detailMyReviewStars) {
            detailMyReviewStars.style.cursor = 'pointer';
            detailMyReviewStars.onclick = () => openReviewPopup(window.currentWorkshopId);
          }

          detailsPopup.style.display = 'flex';

        } catch (e) {
          await popupAlert(e.message);
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
        icon.classList.add('fa', window.getFileIconClass(f.name));
        icon.style.color = '#5481B7';
        left.appendChild(icon);
        const nameSpan = document.createElement('span');
        nameSpan.textContent = f.name || '?';
        Object.assign(nameSpan.style, {
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'160px'
        });
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
        Object.assign(downloadLink.style, {
          background:'#007bff', color:'white', border:'none', padding:'4px 10px',
          borderRadius:'4px', cursor:'pointer', textDecoration:'none'
        });
        downloadLink.addEventListener('click', e => e.stopPropagation());
        right.appendChild(downloadLink);

        const viewLink = document.createElement('button');
        viewLink.textContent = 'Bekijk';
        Object.assign(viewLink.style, {
          background:'#28a745', color:'white', border:'none', padding:'4px 10px',
          borderRadius:'4px', cursor:'pointer'
        });
        viewLink.addEventListener('click', e => {
          e.stopPropagation();
          window.openFilePreview(f);
        });
        right.appendChild(viewLink);

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
            fileUrl = `${window.API_URL}/uploads/${encodeURIComponent(fileName)}`;
          }
          el.src = fileUrl;

          // Kleiner maken
          el.style.display = i===0 ? 'block' : 'none';
          el.style.width = '300px';
          el.style.height = '200px';
          el.style.objectFit = 'cover';
          el.style.borderRadius = '8px';
          el.style.margin = '10px auto';

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

      // =======================
      // Clear details popup
      // =======================
      function clearDetailsPopup(){
        window.currentWorkshopId = null;
        ['detailName','detailDesc','detailDuration'].forEach(id => {
          const el = document.getElementById(id);
          if(el) el.value='';
        });
        if(detailLabelPreview) detailLabelPreview.innerHTML = '';
        [detailInstructionsList, detailManualsList, detailDemoList, detailWorksheetsList].forEach(list => {
          if(list) list.innerHTML='';
        });
        const mediaContainer = document.getElementById('detailMediaContainer');
        if(mediaContainer) mediaContainer.innerHTML='';
      }

      // =======================
      // Search functionaliteit
      // =======================
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          // Huidige weergave bepalen (alle workshops of alleen favorieten)
          if (isShowingFavorites) {
            loadFavoriteWorkshops();
          } else {
            loadWorkshops(); // loadWorkshops roept filterAndRenderWorkshops aan met alle workshops
          }
        });
      }

      // =======================
      // Favorieten knop functionaliteit
      // =======================
      if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => {
          isShowingFavorites = !isShowingFavorites; // Toggle de status

          // Pas de knoptekst en icoon aan
          if (isShowingFavorites) {
            favoritesBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Alle workshops';
            favoritesBtn.classList.add('active');
            loadFavoriteWorkshops(); // Laad alleen de favorieten
          } else {
            favoritesBtn.innerHTML = '<i class="fa-regular fa-heart"></i> Favorieten';
            favoritesBtn.classList.remove('active');
            loadWorkshops(); // Laad alle workshops
          }

          // Reset de zoekbalk bij het wisselen van weergave
          searchInput.value = '';
        });
      }


      // =======================
      // File category toggle
      // =======================
      document.querySelectorAll('.file-category-header').forEach(header => {
        header.addEventListener('click', () => {
          const allContents = document.querySelectorAll('.file-category-content');
          const currentContent = header.nextElementSibling;
          allContents.forEach(content => {
            if(content!==currentContent) content.style.display='none';
          });
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

      // =======================
      // Popup management
      // =======================
      detailsPopup.addEventListener('click', (e) => {
        if (e.target === detailsPopup) {
          detailsPopup.style.display = 'none';
          clearDetailsPopup();
        }
      });

      closeDetailsBtn.addEventListener('click', () => {
        detailsPopup.style.display = 'none';
        clearDetailsPopup();
      });

      // =======================
      // REVIEW MODULE
      // =======================

      // Sterren aanklikken
      document.querySelectorAll(".stars i").forEach((star) => {
        star.addEventListener("click", () => {
          window.selectedStars = parseInt(star.dataset.value);
          document.querySelectorAll(".stars i").forEach((s) => {
            s.classList.toggle("selected", s.dataset.value <= window.selectedStars);
          });
        });
      });

      // Review popup openen
      window.openReviewPopup = function(workshopId) {
        window.currentWorkshopId = workshopId;
        const popupOverlay = document.getElementById("reviewPopup");
        popupOverlay.style.display = "flex";
        loadReviews(window.currentWorkshopId);
      };

      function closeReviewPopup() {
        const popupOverlay = document.getElementById("reviewPopup");
        popupOverlay.style.display = "none";
        clearReview();
      }

      function clearReview() {
        window.selectedStars = 0;
        document.querySelectorAll(".stars i").forEach((s) =>
          s.classList.remove("selected")
        );
        document.getElementById("reviewText").value = "";
      }

      // Review opslaan
      async function submitReview() {
        if (!window.currentWorkshopId) return await window.popupAlert("Geen workshop geselecteerd.");

        const text = document.getElementById("reviewText").value.trim();
        if (window.selectedStars === 0) return await window.popupAlert("Selecteer een aantal sterren.");

        const token = localStorage.getItem("jwt");
        if (!token) return await window.popupAlert("Je moet ingelogd zijn.");

        try {
          const res = await fetch(`${window.API_URL}/reviews`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
              workshopId: window.currentWorkshopId,
              stars: window.selectedStars,
              text
            })
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(`Kon review niet opslaan: ${errorData.message || res.statusText}`);
          }

          // Herlaad de workshops om de bijgewerkte review score te tonen op de card
          if (isShowingFavorites) {
            await loadFavoriteWorkshops();
          } else {
            await loadWorkshops();
          }

          await loadReviews(window.currentWorkshopId);
          await window.popupAlert("Review opgeslagen!");
          closeReviewPopup();
        } catch (err) {
          await window.popupAlert("Er ging iets mis bij opslaan. Details: " + err.message);
        }
      }

      // Reviews laden
      async function loadReviews(workshopId) {
        const token = localStorage.getItem("jwt");
        if (!token) {
          clearReview();
          displayUserReviewInDetailPopup(null);
          return;
        }

        try {
          const res = await fetch(`${window.API_URL}/reviews/${workshopId}/user`, {
            headers: { Authorization: "Bearer " + token },
          });

          if (res.status === 404 || !res.ok) {
            clearReview();
            displayUserReviewInDetailPopup(null);
            return;
          }

          const review = await res.json();
          window.selectedStars = review.stars;
          document.getElementById("reviewText").value = review.text || '';
          document.querySelectorAll(".stars i").forEach((star) => {
            star.classList.toggle("selected", star.dataset.value <= review.stars);
          });

          displayUserReviewInDetailPopup(review);

        } catch (err) {
          clearReview();
          displayUserReviewInDetailPopup(null);
        }
      }

      // Review in detail popup tonen
      function displayUserReviewInDetailPopup(review) {
        const starsContainer = document.getElementById('detailMyReviewStars');
        if (!starsContainer) return;

        starsContainer.innerHTML = '';

        if (!review || review.stars === undefined) {
          const emptyStars = Array(5).fill('<i class="fa-regular fa-star"></i>').join('');
          starsContainer.innerHTML = `<div class="stars-summary">${emptyStars}</div>`;
        } else {
          const filledStars = Array(review.stars).fill('<i class="fa-solid fa-star filled-star"></i>').join('');
          const emptyStars = Array(5 - review.stars).fill('<i class="fa-regular fa-star"></i>').join('');
          starsContainer.innerHTML = `<div class="stars-summary">${filledStars}${emptyStars}</div>`;
        }

        starsContainer.style.cursor = 'pointer';
        starsContainer.onclick = () => window.openReviewPopup(window.currentWorkshopId);
      }

      // Event listeners voor review knoppen
      document.getElementById("closeReviewPopup")?.addEventListener("click", () => {
        closeReviewPopup();
      });

      document.getElementById("submitReviewBtn")?.addEventListener("click", () => {
        submitReview();
      });

      document.getElementById("clearReviewBtn")?.addEventListener("click", () => {
        clearReview();
      });

      function checkURLForWorkshopHash() {
        const hash = window.location.hash;

        // Controleer of de hash begint met '#workshop-'
        if (hash && hash.startsWith('#workshop-')) {

          // Haal de ID eruit (bijv. van '#workshop-123' wordt '123')
          const workshopId = hash.replace('#workshop-', '');

          // Roep de bestaande functie aan die de pop-up opent.
          // Dit moet gebeuren nadat alle workshops geladen zijn.

          // Gebruik een kleine vertraging om er zeker van te zijn dat de DOM volledig is gerenderd
          // en 'loadWorkshops()' is afgerond.
          setTimeout(() => {
            viewWorkshopDetails(workshopId);

            // Optioneel: Verwijder de hash uit de URL na opening
            // Dit voorkomt dat de modal onbedoeld opnieuw opent bij een refresh.
            history.replaceState(null, null, window.location.pathname + window.location.search);
          }, 500);
          // 500ms is conservatief, zodat 'loadWorkshops()' de tijd krijgt om alle data op te halen.
        }
      }

      // Event listener voor quiz knop
      document.addEventListener('click', function(e) {
        if (e.target.id === 'startQuizBtn' || e.target.classList.contains('quiz-start-btn')) {
          if (window.currentWorkshopId) {
            startQuiz(window.currentWorkshopId);
          }
        }
      });

      // [INITIËLE CHECK TOEGEVOEGD]
      checkURLForWorkshopHash();


      // =======================
      // Init
      // =======================
      loadWorkshops();
    });