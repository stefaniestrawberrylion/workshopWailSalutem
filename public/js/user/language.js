// --- Globale variabelen ---
const langToggle = document.getElementById('langToggle');
const flagIcon = document.getElementById('flagIcon');
let currentLang = 'nl'; // Standaard Nederlands

// --- Vertalingsobject voor alle statische teksten ---
const translations = {
  'nl': {
    // Header & Sidebar
    'searchPlaceholder': 'Zoek workshops...',
    'filter': 'Filter',
    'favorites': 'Favorieten',
    'dashboard': 'Dashboard',
    'workshops': 'Workshops',
    'profile': 'Profiel',
    'logout': 'Uitloggen',
    'noResults': 'Kan uw zoekopdracht niet vinden',

    // Workshop Detail Pop-up
    'detail_instructions': 'Instructies',
    'detail_manuals': 'Handleiding',
    'detail_demo': 'Demo code',
    'detail_worksheets': 'Werkbladeren',
    'detail_name': 'Naam',
    'detail_desc': 'Omschrijving',
    'detail_duration': 'Duur',
    'detail_labels': 'Labels',
    'detail_consent_required': 'Oudertoestemming vereist:',
    'detail_my_review': 'Mijn Review:',
    'detail_review_workshop': 'Review Workshop',

    // Review Pop-up
    'review_placeholder': 'Schrijf hier je review...',
    'review_submit': 'Versturen',
    'review_clear': 'Wissen',

    // Filter Modal
    'filter_title': 'Filter Workshops',
    'filter_min_rating': 'Minimale Beoordeling',
    'filter_no_minimum': 'Geen minimum',
    'filter_max_duration': 'Maximale Duur',
    'filter_no_selection': 'Geen selectie',
    'filter_labels': 'Labels',
    'filter_apply': 'Filters Toepassen',
    'filter_clear': 'Filters Wissen',
    'filter_label_ai': 'AI',
    'filter_label_cv': 'Computer Vision',
    'filter_label_workshop': 'Workshop',
    'filter_label_tech': 'Techniek',
    'filter_label_robotics': 'Robotica',
    'filter_label_privacy': 'Privacy',
  },
  'en': {
    // Header & Sidebar
    'searchPlaceholder': 'Search workshops...',
    'filter': 'Filter',
    'favorites': 'Favorites',
    'dashboard': 'Dashboard',
    'workshops': 'Workshops',
    'profile': 'Profile',
    'logout': 'Logout',
    'noResults': 'Could not find your search query',

    // Workshop Detail Pop-up
    'detail_instructions': 'Instructions',
    'detail_manuals': 'Manual',
    'detail_demo': 'Demo code',
    'detail_worksheets': 'Worksheets',
    'detail_name': 'Name',
    'detail_desc': 'Description',
    'detail_duration': 'Duration',
    'detail_labels': 'Labels',
    'detail_consent_required': 'Parental consent required:',
    'detail_my_review': 'My Review:',
    'detail_review_workshop': 'Review Workshop',

    // Review Pop-up
    'review_placeholder': 'Write your review here...',
    'review_submit': 'Submit',
    'review_clear': 'Clear',

    // Filter Modal
    'filter_title': 'Filter Workshops',
    'filter_min_rating': 'Minimum Rating',
    'filter_no_minimum': 'No minimum',
    'filter_max_duration': 'Maximum Duration',
    'filter_no_selection': 'No selection',
    'filter_labels': 'Labels',
    'filter_apply': 'Apply Filters',
    'filter_clear': 'Clear Filters',
    'filter_label_ai': 'AI',
    'filter_label_cv': 'Computer Vision',
    'filter_label_workshop': 'Workshop',
    'filter_label_tech': 'Technology',
    'filter_label_robotics': 'Robotics',
    'filter_label_privacy': 'Privacy',
  }
};


// --- De Vertaalfunctie ---
function translatePage(lang) {
  const currentTranslations = translations[lang];

  // 1. Vertaal alle elementen met een data-i18n attribuut
  // Je moet de data-i18n attributen toevoegen aan de HTML elementen die vertaald moeten worden
  // Voorbeeld HTML: <span class="sidebar-text" data-i18n="dashboard">Dashboard</span>
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (currentTranslations[key]) {
      element.innerText = currentTranslations[key];
    }
  });

  // 2. Vertaal speciale elementen (placeholders, titels, etc.)

  // Zoekbalk
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.placeholder = currentTranslations['searchPlaceholder'];
  }

  // Geen Resultaten bericht
  const noResultsP = document.getElementById('no-results');
  if (noResultsP) {
    noResultsP.innerText = currentTranslations['noResults'];
  }

  // Review Pop-up
  const reviewTextarea = document.getElementById('reviewText');
  if (reviewTextarea) {
    reviewTextarea.placeholder = currentTranslations['review_placeholder'];
  }

  // Hier moeten alle andere elementen (select options, labels in pop-ups) ook worden aangepast.
  // Dit is makkelijker als je de data-i18n methode ook daar toepast.

  // Voorbeeld van hoe je een dropdown optie vertaalt (als je geen data-i18n gebruikt):
  const durationFilter = document.getElementById('durationFilter');
  if (durationFilter) {
    durationFilter.querySelector('option[value=""]').innerText = currentTranslations['filter_no_selection'];
  }

  // Filter Modal rating tekst
  const selectedRatingText = document.getElementById('selectedRatingText');
  if (selectedRatingText && selectedRatingText.innerText === 'Geen minimum' || selectedRatingText.innerText === 'No minimum') {
    selectedRatingText.innerText = currentTranslations['filter_no_minimum'];
  }

  // 3. Vertaal dynamische inhoud (workshop cards)
  // Als je workshop kaarten dynamisch vanuit data geladen worden, moet je hier de functie aanroepen
  // die de kaarten opnieuw laadt/ververst met de vertaalde teksten (indien je database de vertalingen bevat).
  // Bijv: refreshWorkshopCards(lang);
}

// --- Event Listener voor de Taalschakelaar ---
langToggle.addEventListener('click', () => {
  if (currentLang === 'nl') {
    currentLang = 'en';
    flagIcon.src = '/image/Schermafbeelding 2025-09-19 143713.png'; // Engelse vlag
  } else {
    currentLang = 'nl';
    flagIcon.src = '/image/Schermafbeelding 2025-09-19 143613.png'; // Nederlandse vlag
  }

  translatePage(currentLang);
});

// --- Initialisatie: Zorg ervoor dat de pagina bij het laden al correct vertaald is (standaard NL) ---
document.addEventListener('DOMContentLoaded', () => {
  // Stel de eerste vertaling in op basis van de starttaal
  translatePage(currentLang);
});

