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

async function handleStarSignsRoutinePerform(sign) {
  try {
    const userId = (document.cookie.match(/user_id=([^;]+)/) || [])[1] || localStorage.getItem('user_id');
    if (userId) {
      const { getUserSettings } = await import('../api.ts');
      const s = await getUserSettings(userId).catch(() => null);
      if (s) {
        const expires = new Date(); expires.setFullYear(expires.getFullYear() + 1);
        if (typeof s.voice_note_name_default === 'boolean') document.cookie = `voice-note-name-default=${s.voice_note_name_default}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        if (s.voice_note_name) document.cookie = `voice-note-name=${encodeURIComponent(s.voice_note_name)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        if (s.voice_note_date) document.cookie = `voice-note-date=${encodeURIComponent(s.voice_note_date)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      }
    }
  } catch {}
  const { navigateToScreen } = await import('../navigation.js');
  navigateToScreen('voice-recording', 'star-signs', sign);
}
