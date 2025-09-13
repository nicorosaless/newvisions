export function renderStarSignsRoutineScreen() {
  const starSigns = [
    'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn'
  ];

  return `
    <div class="star-signs-routine-container">
      <div class="routine-header">
        <button class="back-button" id="back-to-routine-selection">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1>Star Signs</h1>
      </div>
      
      <div class="star-signs-content">
        <div class="star-signs-section">
          <h3>Select Star Sign</h3>
          <div class="star-signs-grid">
            ${starSigns.map(sign => `
              <button class="star-sign-button" data-sign="${sign}">
                ${sign}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="selected-sign-display">
          <div id="selected-sign-info">
            Selected: <span id="selected-sign">None</span>
          </div>
        </div>

        <button class="perform-button" id="perform-star-signs-btn" disabled>
          Perform
        </button>
      </div>
    </div>`;
}

export function setupStarSignsRoutineEventListeners() {
  let selectedSign = null;

  const backBtn = document.getElementById('back-to-routine-selection');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Navigation will be handled by the global navigation listener
    });
  }

  // Handle star sign selection
  const signButtons = document.querySelectorAll('.star-sign-button');
  signButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all sign buttons
      signButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      selectedSign = button.dataset.sign;
      updateSelectedSign();
      updatePerformButton();
    });
  });

  const performBtn = document.getElementById('perform-star-signs-btn');
  if (performBtn) {
    performBtn.addEventListener('click', () => {
      if (selectedSign) {
        handleStarSignsRoutinePerform(selectedSign);
      }
    });
  }

  function updateSelectedSign() {
    const signDisplay = document.getElementById('selected-sign');
    if (signDisplay) {
      signDisplay.textContent = selectedSign || 'None';
    }
  }

  function updatePerformButton() {
    const performBtn = document.getElementById('perform-star-signs-btn');
    if (performBtn) {
      performBtn.disabled = !selectedSign;
    }
  }
}

function handleStarSignsRoutinePerform(sign) {
  alert(`STAR SIGNS routine performed with: ${sign}`);
  // TODO: Implement actual routine logic here
}
