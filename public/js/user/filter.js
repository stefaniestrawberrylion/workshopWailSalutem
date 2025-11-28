// Filter Functionaliteit
document.addEventListener('DOMContentLoaded', () => {

  // Elementen ophalen
  const filterBtn = document.getElementById('filterBtn');
  const filterModal = document.getElementById('filterModal');
  const closeFilterModalBtn = document.getElementById('closeFilterModalBtn');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  // Rating filter
  const ratingStars = document.querySelectorAll('.stars-filter i');
  const selectedRatingText = document.getElementById('selectedRatingText');

  // Duur filter
  const durationFilter = document.getElementById('durationFilter');

  // Label filters
  const labelCheckboxes = document.querySelectorAll('.labels-filter input[type="checkbox"]');

  // Bewaarde filters
  let currentFilters = {
    exactRating: null,          // ⭐ Exact aantal sterren
    durationRange: null,        // ⏱ Range in minuten "60-75"
    selectedLabels: []          // 🏷️ Labels
  };

  // Open modal
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      filterModal.style.display = 'flex';
      updateFilterUI();
    });
  }

  // Sluit modal
  if (closeFilterModalBtn) {
    closeFilterModalBtn.addEventListener('click', () => {
      filterModal.style.display = 'none';
    });
  }

  // Sluiten buiten modal
  window.addEventListener('click', (e) => {
    if (e.target === filterModal) filterModal.style.display = 'none';
  });

  // ⭐ Exact rating selectie
  ratingStars.forEach(star => {
    star.addEventListener('click', () => {

      const ratingValue = parseInt(star.getAttribute('data-value'));

      // visueel updaten
      ratingStars.forEach((s, idx) => {
        idx < ratingValue ? s.classList.add('active') : s.classList.remove('active');
      });

      // tekst en filter opslaan
      selectedRatingText.textContent = `${ratingValue} ster${ratingValue > 1 ? 'ren' : ''}`;
      currentFilters.exactRating = ratingValue;
    });
  });

  // ⏱ Duur range wijziging
  if (durationFilter) {
    durationFilter.addEventListener('change', (e) => {
      currentFilters.durationRange = e.target.value || null;
    });
  }

  // 🏷️ Label wijziging
  labelCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      currentFilters.selectedLabels = Array.from(labelCheckboxes)
        .filter(x => x.checked)
        .map(x => x.value);
    });
  });

  // ✔ Filters toepassen
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      applyFilters();
      filterModal.style.display = 'none';
      updateFilterButtonState();
    });
  }

  // ❌ Filters wissen
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      clearFilters();
      updateFilterUI();
      applyFilters();
      updateFilterButtonState();
    });
  }

  // UI bijwerken op basis van huidige filters
  function updateFilterUI() {
    // rating
    ratingStars.forEach((star, index) => {
      star.classList.toggle("active", currentFilters.exactRating && index < currentFilters.exactRating);
    });

    selectedRatingText.textContent = currentFilters.exactRating
      ? `${currentFilters.exactRating} ster${currentFilters.exactRating > 1 ? 'ren' : ''}`
      : "Geen selectie";

    // duration
    if (durationFilter) durationFilter.value = currentFilters.durationRange || "";

    // labels
    labelCheckboxes.forEach(cb => {
      cb.checked = currentFilters.selectedLabels.includes(cb.value);
    });
  }

  // ⭐ ⏱ 🏷️ FILTER LOGICA
  function applyFilters() {
    const workshopCards = document.querySelectorAll('.workshop-card');
    let visibleCount = 0;

    workshopCards.forEach(card => {
      const duration = parseInt(card.getAttribute('data-duration')) || 0;
      const rating = Math.round(parseFloat(card.getAttribute('data-rating'))) || 0;

      const labelsJson = card.getAttribute('data-labels');
      const workshopLabels = labelsJson ? JSON.parse(labelsJson) : [];

      let show = true;

      // ⭐ Exact stars
      if (currentFilters.exactRating !== null && rating !== currentFilters.exactRating) {
        show = false;
      }

      // ⏱ Duration
      if (currentFilters.durationRange) {
        const [min, max] = currentFilters.durationRange.split('-').map(Number);
        if (duration < min || duration > max) show = false;
      }

      // 🏷 Labels
      if (currentFilters.selectedLabels.length > 0) {
        const hasLabel = currentFilters.selectedLabels.some(l => workshopLabels.includes(l));
        if (!hasLabel) show = false;
      }

      card.style.display = show ? 'block' : 'none';
      if (show) visibleCount++;
    });

    const noResults = document.getElementById('no-results');
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      noResults.textContent = visibleCount === 0 ? 'Geen workshops gevonden.' : '';
    }

    localStorage.setItem('workshopFilters', JSON.stringify(currentFilters));
  }

  function clearFilters() {
    currentFilters = {
      exactRating: null,
      durationRange: null,
      selectedLabels: []
    };
  }

  function updateFilterButtonState() {
    const hasActive =
      currentFilters.exactRating !== null ||
      currentFilters.durationRange !== null ||
      currentFilters.selectedLabels.length > 0;

    if (filterBtn) {
      if (hasActive) {
        filterBtn.classList.add("active");
        filterBtn.innerHTML = '<i class="fa-solid fa-filter" style="color:#ff6b6b"></i> Filter (actief)';
      } else {
        filterBtn.classList.remove("active");
        filterBtn.innerHTML = '<i class="fa-solid fa-filter"></i> Filter';
      }
    }
  }

  function loadSavedFilters() {
    const saved = localStorage.getItem('workshopFilters');
    if (saved) {
      currentFilters = JSON.parse(saved);
      updateFilterUI();
      setTimeout(() => {
        applyFilters();
        updateFilterButtonState();
      }, 300);
    }
  }

  loadSavedFilters();

  window.applyWorkshopFilters = applyFilters;
  window.clearWorkshopFilters = clearFilters;
});


// Functie om labels, rating en duration op card te zetten
function addLabelsToWorkshopCard(card, workshop) {

  // labels
  if (workshop.labels && Array.isArray(workshop.labels)) {
    const labelNames = workshop.labels.map(l => typeof l === "string" ? l : l.name);
    card.setAttribute("data-labels", JSON.stringify(labelNames));
  }

  // rating
  if (workshop.reviews && Array.isArray(workshop.reviews)) {
    const reviewCount = workshop.reviews.length;
    const avg = reviewCount > 0
      ? workshop.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / reviewCount
      : 0;
    card.setAttribute("data-rating", avg.toFixed(1));
  }

  // duration (zet altijd om naar minuten)
  // Zorg dat workshop.duration als nummer wordt geïnterpreteerd (uren bijvoorbeeld 1.25)
  const hours = Number(workshop.duration) || 0;
  const durationMinutes = Math.round(hours * 60);
  card.setAttribute("data-duration", durationMinutes);
}

