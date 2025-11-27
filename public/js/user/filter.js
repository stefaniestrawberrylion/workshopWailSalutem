// Filter Functionaliteit
document.addEventListener('DOMContentLoaded', () => {
  // Elementen ophalen
  const filterBtn = document.getElementById('filterBtn');
  const filterModal = document.getElementById('filterModal');
  const closeFilterModalBtn = document.getElementById('closeFilterModalBtn');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  // Rating filter elementen
  const ratingStars = document.querySelectorAll('.stars-filter i');
  const selectedRatingText = document.getElementById('selectedRatingText');

  // Duur filter element
  const durationFilter = document.getElementById('durationFilter');

  // Label filter elementen
  const labelCheckboxes = document.querySelectorAll('.labels-filter input[type="checkbox"]');

  // Huidige filters
  let currentFilters = {
    minRating: 0,
    maxDuration: null,
    selectedLabels: []
  };

  // Open filter modal
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      filterModal.style.display = 'flex';
      updateFilterUI();
    });
  }

  // Sluit filter modal
  if (closeFilterModalBtn) {
    closeFilterModalBtn.addEventListener('click', () => {
      filterModal.style.display = 'none';
    });
  }

  // Sluit modal bij klik buiten
  window.addEventListener('click', (e) => {
    if (e.target === filterModal) {
      filterModal.style.display = 'none';
    }
  });

  // Rating sterren interactie
  ratingStars.forEach(star => {
    star.addEventListener('click', () => {
      const ratingValue = parseInt(star.getAttribute('data-value'));
      ratingStars.forEach((s, index) => {
        index < ratingValue ? s.classList.add('active') : s.classList.remove('active');
      });
      if (ratingValue > 0) {
        selectedRatingText.textContent = `${ratingValue} ster${ratingValue > 1 ? 'ren' : ''} of meer`;
        currentFilters.minRating = ratingValue;
      } else {
        selectedRatingText.textContent = 'Geen minimum';
        currentFilters.minRating = 0;
      }
    });
  });

  // Duur filter wijziging
  if (durationFilter) {
    durationFilter.addEventListener('change', (e) => {
      currentFilters.maxDuration = e.target.value ? parseInt(e.target.value) : null;
    });
  }

  // Label checkboxes wijziging
  labelCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      currentFilters.selectedLabels = Array.from(labelCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    });
  });

  // Filters toepassen
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      applyFilters();
      filterModal.style.display = 'none';
      updateFilterButtonState();
    });
  }

  // Filters wissen
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      clearFilters();
      updateFilterUI();
      applyFilters();
      updateFilterButtonState();
    });
  }

  // Update filter UI op basis van huidige filters
  function updateFilterUI() {
    ratingStars.forEach((star, index) => {
      index < currentFilters.minRating ? star.classList.add('active') : star.classList.remove('active');
    });
    selectedRatingText.textContent = currentFilters.minRating > 0
      ? `${currentFilters.minRating} ster${currentFilters.minRating > 1 ? 'ren' : ''} of meer`
      : 'Geen minimum';
    if (durationFilter) durationFilter.value = currentFilters.maxDuration || '';
    labelCheckboxes.forEach(checkbox => {
      checkbox.checked = currentFilters.selectedLabels.includes(checkbox.value);
    });
  }

  // Filters toepassen op workshops
  function applyFilters() {
    const workshopCards = document.querySelectorAll('.workshop-card');
    let visibleCount = 0;

    workshopCards.forEach(card => {
      const duration = parseInt(card.getAttribute('data-duration')) || 0;
      const rating = parseFloat(card.getAttribute('data-rating')) || 0;
      const labelsJson = card.getAttribute('data-labels');
      const workshopLabels = labelsJson ? JSON.parse(labelsJson) : [];
      let shouldShow = true;

      if (currentFilters.minRating > 0 && rating < currentFilters.minRating) shouldShow = false;
      if (currentFilters.maxDuration && duration > currentFilters.maxDuration) shouldShow = false;
      if (currentFilters.selectedLabels.length > 0) {
        const hasMatchingLabel = currentFilters.selectedLabels.some(selectedLabel =>
          workshopLabels.includes(selectedLabel)
        );
        if (!hasMatchingLabel) shouldShow = false;
      }

      card.style.display = shouldShow ? 'block' : 'none';
      if (shouldShow) visibleCount++;
    });

    const noResults = document.getElementById('no-results');
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      noResults.textContent = visibleCount === 0 ? 'Geen workshops gevonden met de geselecteerde filters.' : '';
    }

    localStorage.setItem('workshopFilters', JSON.stringify(currentFilters));
  }

  function clearFilters() {
    currentFilters = {
      minRating: 0,
      maxDuration: null,
      selectedLabels: []
    };
  }

  function updateFilterButtonState() {
    const hasActiveFilters = currentFilters.minRating > 0 ||
      currentFilters.maxDuration !== null ||
      currentFilters.selectedLabels.length > 0;

    if (filterBtn) {
      if (hasActiveFilters) {
        filterBtn.classList.add('active');
        filterBtn.innerHTML = '<i class="fa-solid fa-filter" style="color: #ff6b6b;"></i> Filter (actief)';
      } else {
        filterBtn.classList.remove('active');
        filterBtn.innerHTML = '<i class="fa-solid fa-filter"></i> Filter';
      }
    }
  }

  function loadSavedFilters() {
    const savedFilters = localStorage.getItem('workshopFilters');
    if (savedFilters) {
      currentFilters = JSON.parse(savedFilters);
      updateFilterUI();
      setTimeout(() => {
        applyFilters();
        updateFilterButtonState();
      }, 500);
    }
  }

  // Initialiseer filters
  loadSavedFilters();

  // Maak functies globaal beschikbaar voor andere scripts
  window.applyWorkshopFilters = applyFilters;
  window.clearWorkshopFilters = clearFilters;
});

// Functie om labels, rating en duration aan workshop cards toe te voegen
function addLabelsToWorkshopCard(card, workshop) {
  if (workshop.labels && Array.isArray(workshop.labels)) {
    const labelNames = workshop.labels.map(label => typeof label === 'string' ? label : label.name);
    card.setAttribute('data-labels', JSON.stringify(labelNames));
  }
  if (workshop.reviews && Array.isArray(workshop.reviews)) {
    const reviewCount = workshop.reviews.length;
    const averageRating = reviewCount > 0
      ? workshop.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / reviewCount
      : 0;
    card.setAttribute('data-rating', averageRating.toFixed(1));
  }
  card.setAttribute('data-duration', workshop.duration || 0);
}
