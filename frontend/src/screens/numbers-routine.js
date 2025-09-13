export function renderNumbersRoutineScreen() {
  return `
    <div class="numbers-routine-container">
      <div class="routine-header">
        <button class="back-button" id="back-to-routine-selection">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1>Numbers</h1>
      </div>
      
      <div class="numbers-content">
        <div class="numbers-section">
          <h3>Select First Digit</h3>
          <div class="numbers-grid">
            <button class="number-button first-digit-button" data-digit="0">0</button>
            <button class="number-button first-digit-button" data-digit="1">1</button>
            <button class="number-button first-digit-button" data-digit="2">2</button>
            <button class="number-button first-digit-button" data-digit="3">3</button>
            <button class="number-button first-digit-button" data-digit="4">4</button>
            <button class="number-button first-digit-button" data-digit="5">5</button>
            <button class="number-button first-digit-button" data-digit="6">6</button>
            <button class="number-button first-digit-button" data-digit="7">7</button>
            <button class="number-button first-digit-button" data-digit="8">8</button>
            <button class="number-button first-digit-button" data-digit="9">9</button>
          </div>
        </div>

        <div class="numbers-section">
          <h3>Select Second Digit</h3>
          <div class="numbers-grid">
            <button class="number-button second-digit-button" data-digit="0">0</button>
            <button class="number-button second-digit-button" data-digit="1">1</button>
            <button class="number-button second-digit-button" data-digit="2">2</button>
            <button class="number-button second-digit-button" data-digit="3">3</button>
            <button class="number-button second-digit-button" data-digit="4">4</button>
            <button class="number-button second-digit-button" data-digit="5">5</button>
            <button class="number-button second-digit-button" data-digit="6">6</button>
            <button class="number-button second-digit-button" data-digit="7">7</button>
            <button class="number-button second-digit-button" data-digit="8">8</button>
            <button class="number-button second-digit-button" data-digit="9">9</button>
          </div>
        </div>

        <div class="selected-number-display">
          <div id="selected-number-info">
            <span id="selected-first-digit">-</span>
            <span id="selected-second-digit">-</span>
          </div>
        </div>

        <button class="perform-button" id="perform-numbers-btn" disabled>
          Perform
        </button>
      </div>
    </div>`;
}

export function setupNumbersRoutineEventListeners() {
  let selectedFirstDigit = null;
  let selectedSecondDigit = null;

  const backBtn = document.getElementById('back-to-routine-selection');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Navigation will be handled by the global navigation listener
    });
  }

  // Handle first digit selection
  const firstDigitButtons = document.querySelectorAll('.first-digit-button');
  firstDigitButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all first digit buttons
      firstDigitButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      selectedFirstDigit = button.dataset.digit;
      updateSelectedNumber();
      updatePerformButton();
    });
  });

  // Handle second digit selection
  const secondDigitButtons = document.querySelectorAll('.second-digit-button');
  secondDigitButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all second digit buttons
      secondDigitButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      selectedSecondDigit = button.dataset.digit;
      updateSelectedNumber();
      updatePerformButton();
    });
  });

  const performBtn = document.getElementById('perform-numbers-btn');
  if (performBtn) {
    performBtn.addEventListener('click', () => {
      if (selectedFirstDigit !== null && selectedSecondDigit !== null) {
        handleNumbersRoutinePerform(selectedFirstDigit, selectedSecondDigit);
      }
    });
  }

  function updateSelectedNumber() {
    const firstDigitDisplay = document.getElementById('selected-first-digit');
    const secondDigitDisplay = document.getElementById('selected-second-digit');
    
    if (firstDigitDisplay) firstDigitDisplay.textContent = selectedFirstDigit !== null ? selectedFirstDigit : '-';
    if (secondDigitDisplay) secondDigitDisplay.textContent = selectedSecondDigit !== null ? selectedSecondDigit : '-';
  }

  function updatePerformButton() {
    const performBtn = document.getElementById('perform-numbers-btn');
    if (performBtn) {
      performBtn.disabled = !(selectedFirstDigit !== null && selectedSecondDigit !== null);
    }
  }
}

function handleNumbersRoutinePerform(firstDigit, secondDigit) {
  const twoDigitNumber = firstDigit + secondDigit;
  alert(`NUMBERS routine performed with: ${twoDigitNumber}`);
  // TODO: Implement actual routine logic here
}
