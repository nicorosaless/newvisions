export function renderCardsRoutineScreen() {
  return `
    <div class="cards-routine-container">
      <div class="routine-header">
        <button class="back-button" id="back-to-routine-selection">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1>Cards</h1>
      </div>
      
      <div class="cards-content">
        <div class="cards-section">
          <h3>Select Card Value</h3>
          <div class="card-values-grid">
            <button class="card-button value-button" data-value="A">A</button>
            <button class="card-button value-button" data-value="2">2</button>
            <button class="card-button value-button" data-value="3">3</button>
            <button class="card-button value-button" data-value="4">4</button>
            <button class="card-button value-button" data-value="5">5</button>
            <button class="card-button value-button" data-value="6">6</button>
            <button class="card-button value-button" data-value="7">7</button>
            <button class="card-button value-button" data-value="8">8</button>
            <button class="card-button value-button" data-value="9">9</button>
            <button class="card-button value-button" data-value="10">10</button>
            <button class="card-button value-button" data-value="J">J</button>
            <button class="card-button value-button" data-value="Q">Q</button>
            <button class="card-button value-button" data-value="K">K</button>
          </div>
        </div>

        <div class="cards-section">
          <h3>Select Suit</h3>
          <div class="card-suits-grid">
            <button class="card-button suit-button" data-suit="clubs">
              <span class="suit-icon">♣</span>
              <span class="suit-name">Clubs</span>
            </button>
            <button class="card-button suit-button" data-suit="hearts">
              <span class="suit-icon">♥</span>
              <span class="suit-name">Hearts</span>
            </button>
            <button class="card-button suit-button" data-suit="spades">
              <span class="suit-icon">♠</span>
              <span class="suit-name">Spades</span>
            </button>
            <button class="card-button suit-button" data-suit="diamonds">
              <span class="suit-icon">♦</span>
              <span class="suit-name">Diamonds</span>
            </button>
          </div>
        </div>

        <div class="selected-card-display">
          <div id="selected-card-info">
            <span id="selected-value">-</span>
            <span id="selected-suit">-</span>
          </div>
        </div>

        <button class="perform-button" id="perform-cards-btn" disabled>
          Perform
        </button>
      </div>
    </div>`;
}

export function setupCardsRoutineEventListeners() {
  let selectedValue = null;
  let selectedSuit = null;

  const backBtn = document.getElementById('back-to-routine-selection');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Navigation will be handled by the global navigation listener
    });
  }

  // Handle value selection
  const valueButtons = document.querySelectorAll('.value-button');
  valueButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all value buttons
      valueButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      selectedValue = button.dataset.value;
      updateSelectedCard();
      updatePerformButton();
    });
  });

  // Handle suit selection
  const suitButtons = document.querySelectorAll('.suit-button');
  suitButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all suit buttons
      suitButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      selectedSuit = button.dataset.suit;
      updateSelectedCard();
      updatePerformButton();
    });
  });

  const performBtn = document.getElementById('perform-cards-btn');
  if (performBtn) {
    performBtn.addEventListener('click', () => {
      if (selectedValue && selectedSuit) {
        handleCardsRoutinePerform(selectedValue, selectedSuit);
      }
    });
  }

  function updateSelectedCard() {
    const valueDisplay = document.getElementById('selected-value');
    const suitDisplay = document.getElementById('selected-suit');
    
    if (valueDisplay) valueDisplay.textContent = selectedValue || '-';
    if (suitDisplay) {
      if (selectedSuit) {
        const suitIcons = {
          clubs: '♣',
          hearts: '♥',
          spades: '♠',
          diamonds: '♦'
        };
        suitDisplay.textContent = suitIcons[selectedSuit];
      } else {
        suitDisplay.textContent = '-';
      }
    }
  }

  function updatePerformButton() {
    const performBtn = document.getElementById('perform-cards-btn');
    if (performBtn) {
      performBtn.disabled = !(selectedValue && selectedSuit);
    }
  }
}

function handleCardsRoutinePerform(value, suit) {
  const suitNames = {
    clubs: 'Clubs',
    hearts: 'Hearts',
    spades: 'Spades',
    diamonds: 'Diamonds'
  };
  
  alert(`CARDS routine performed with: ${value} of ${suitNames[suit]}`);
  // TODO: Implement actual routine logic here
}
