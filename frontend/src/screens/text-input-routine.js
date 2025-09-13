export function renderTextInputRoutineScreen(routineType) {
  const routineName = routineType.charAt(0).toUpperCase() + routineType.slice(1);
  
  return `
    <div class="text-input-routine-container">
      <div class="routine-header">
        <button class="back-button" id="back-to-routine-selection">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1>${routineName}</h1>
      </div>
      
      <div class="text-input-content">
        <div class="input-group">
          <input type="text" id="routine-text-input" placeholder="Enter ${routineName.toLowerCase()}..." required inputmode="text" autocomplete="off">
          <label for="routine-text-input">Enter ${routineName}</label>
        </div>
        
        <button class="perform-button" id="perform-routine-btn">
          Perform
        </button>
      </div>
    </div>`;
}

export function setupTextInputRoutineEventListeners(routineType) {
  const backBtn = document.getElementById('back-to-routine-selection');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Navigation will be handled by the global navigation listener
    });
  }

  const performBtn = document.getElementById('perform-routine-btn');
  if (performBtn) {
    performBtn.addEventListener('click', () => {
      const input = document.getElementById('routine-text-input');
      const value = input.value.trim();
      
      if (value) {
        handleRoutinePerform(routineType, value);
      } else {
        alert('Please enter a value before performing the routine.');
      }
    });
  }

  // Handle enter key in input
  const input = document.getElementById('routine-text-input');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performBtn.click();
      }
    });
    
    // Auto-focus the input field and trigger keyboard on mobile
    // Note: Mobile browsers require user interaction to show keyboard
    // This will focus the input but keyboard may need manual tap
    setTimeout(() => {
      input.focus();
      // Try multiple approaches to trigger mobile keyboard
      input.setSelectionRange(input.value.length, input.value.length);
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Additional attempt after a brief delay
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }, 100);
    }, 150);
  }
}

function handleRoutinePerform(routineType, value) {
  // Navigate to voice recording screen with the routine data
  import('../navigation.js').then(({ navigateToScreen }) => {
    navigateToScreen('voice-recording', routineType, value);
  });
}
