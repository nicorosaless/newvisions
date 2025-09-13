export function renderRoutineSelectionScreen() {
  return `
    <div class="routine-selection-container">
      <div class="routine-header">
        <button class="back-button" id="back-to-home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1>Select Routine</h1>
      </div>
      <div class="routine-grid">
        <button class="routine-button" id="cards-btn">
          <span class="routine-title">Cards</span>
        </button>
        <button class="routine-button" id="nums-btn">
          <span class="routine-title">Numbers</span>
        </button>
        <button class="routine-button" id="phobias-btn">
          <span class="routine-title">Phobias</span>
        </button>
        <button class="routine-button" id="years-btn">
          <span class="routine-title">Years</span>
        </button>
        <button class="routine-button" id="names-btn">
          <span class="routine-title">Names</span>
        </button>
        <button class="routine-button" id="star-btn">
          <span class="routine-title">Star Signs</span>
        </button>
        <button class="routine-button" id="movies-btn">
          <span class="routine-title">Movies</span>
        </button>
        <button class="routine-button" id="custom-btn">
          <span class="routine-title">Custom</span>
        </button>
      </div>
    </div>`;
}

export function setupRoutineSelectionEventListeners() {
  const routineButtons = [
    'cards-btn', 'nums-btn', 'phobias-btn', 'years-btn', 
    'names-btn', 'star-btn', 'movies-btn', 'custom-btn'
  ];
  
  routineButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', () => {
        const routineName = buttonId.replace('-btn', '');
        handleRoutineSelection(routineName);
      });
    }
  });
}

function handleRoutineSelection(routineName) {
  // Import navigateToScreen dynamically to avoid circular dependency
  import('../navigation.js').then(({ navigateToScreen }) => {
    // Navigate to the appropriate routine screen
    switch(routineName) {
      case 'cards':
        navigateToScreen('cards-routine');
        break;
      case 'nums':
        navigateToScreen('numbers-routine');
        break;
      case 'star':
        navigateToScreen('star-signs-routine');
        break;
      case 'phobias':
      case 'years':
      case 'names':
      case 'movies':
      case 'custom':
        navigateToScreen('text-input-routine', routineName);
        break;
      default:
        alert(`${routineName.toUpperCase()} routine coming soon...`);
    }
  });
}
