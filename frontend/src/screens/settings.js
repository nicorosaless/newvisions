export function renderSettingsScreen() {
  return `
    <div class="settings-container">
      <div class="settings-header">
        <button class="back-button" id="back-to-home">
          <span class="back-arrow">←</span>
        </button>
        <h1>Settings</h1>
        <div class="spacer"></div>
      </div>
      
      <div class="settings-content">
        <!-- Voice Cloning Section -->
        <div class="settings-section">
          <h2 class="section-title">Voice Cloning</h2>
          <div class="settings-group">
            <button class="settings-button voice-clone-btn" id="manage-voice-clone">
              <div class="button-content">
                <span class="button-title">Manage Voice Clone</span>
                <span class="button-subtitle">Record, test, or replace your AI voice</span>
              </div>
              <div class="button-arrow">→</div>
            </button>
          </div>
        </div>

        <!-- Voice Generation Parameters Section -->
        <div class="settings-section">
          <h2 class="section-title">Voice Generation Parameters</h2>
          
          <div class="settings-group">
            <div class="settings-item">
              <div class="setting-row">
                <span class="setting-label">Voice Generation Language</span>
                <select id="voice-language" class="setting-select">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="zh">Chinese (Mandarin)</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>
            </div>

            <div class="settings-item">
              <div class="setting-row">
                <span class="setting-label">Sex of the Speaker</span>
                <select id="speaker-sex" class="setting-select">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-group">
            <div class="settings-item">
              <div class="setting-row">
                <div class="setting-label-group">
                  <span class="setting-label">Voice Stability</span>
                  <span class="setting-description">Controls consistency and predictability</span>
                </div>
                <div class="slider-container">
                  <input type="range" id="voice-stability" class="setting-slider" min="0" max="100" value="50">
                  <div class="slider-value">
                    <span id="voice-stability-value">50</span>%
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-item">
              <div class="setting-row">
                <div class="setting-label-group">
                  <span class="setting-label">Voice Similarity</span>
                  <span class="setting-description">How closely the clone matches your voice</span>
                </div>
                <div class="slider-container">
                  <input type="range" id="voice-similarity" class="setting-slider" min="0" max="100" value="75">
                  <div class="slider-value">
                    <span id="voice-similarity-value">75</span>%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Audio Enhancement Section -->
        <div class="settings-section">
          <h2 class="section-title">Audio Enhancement</h2>
          
          <div class="settings-group">
            <div class="settings-item">
              <div class="setting-row">
                <div class="setting-label-group">
                  <span class="setting-label">Background Sound</span>
                  <span class="setting-description">Add ambient audio to your recordings</span>
                </div>
                <div class="toggle-container">
                  <input type="checkbox" id="background-sound" class="setting-toggle">
                  <label for="background-sound" class="toggle-label"></label>
                </div>
              </div>
            </div>

            <div class="settings-item">
              <div class="setting-row">
                <div class="setting-label-group">
                  <span class="setting-label">Background Volume</span>
                  <span class="setting-description">Adjust ambient audio level</span>
                </div>
                <div class="slider-container">
                  <input type="range" id="background-volume" class="setting-slider" min="0" max="100" value="30">
                  <div class="slider-value">
                    <span id="background-volume-value">30</span>%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Section -->
        <div class="settings-section">
          <h2 class="section-title">Performance</h2>
          
          <div class="settings-group">
            <div class="settings-item">
              <div class="setting-row">
                <div class="setting-label-group">
                  <span class="setting-label">Voice Note Name</span>
                  <span class="setting-description">Custom title for your first recording</span>
                </div>
                <input type="text" id="voice-note-name" class="setting-text-input" placeholder="Enter voice note name" maxlength="50">
              </div>
            </div>

            <div class="settings-item">
              <div class="setting-row">
                <div class="setting-label-group">
                  <span class="setting-label">Voice Note Date</span>
                  <span class="setting-description">Custom date for your first recording</span>
                </div>
                <input type="date" id="voice-note-date" class="setting-date-input">
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Save Settings Button -->
      <div class="settings-footer">
        <button class="save-settings-btn" id="save-settings">
          Save Settings
        </button>
      </div>
    </div>`;
}

export function setupSettingsEventListeners() {
  // Load saved settings from cookies
  loadSettingsFromCookies();

  // Handle slider value updates
  const sliders = ['voice-stability', 'voice-similarity', 'background-volume'];
  sliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    const valueSpan = document.getElementById(`${sliderId}-value`);
    if (slider && valueSpan) {
      slider.addEventListener('input', () => {
        valueSpan.textContent = slider.value;
      });
    }
  });

  // Handle manage voice clone button
  const manageVoiceCloneBtn = document.getElementById('manage-voice-clone');
  if (manageVoiceCloneBtn) {
    manageVoiceCloneBtn.addEventListener('click', () => {
      // Import navigation here to avoid circular dependencies
      import('../navigation.js').then(({ navigateToScreen }) => {
        navigateToScreen('voice-clone');
      });
    });
  }

  // Handle settings changes (for future backend integration)
  const settingsInputs = document.querySelectorAll('.setting-select, .setting-slider, .setting-toggle, .setting-text-input, .setting-date-input');
  settingsInputs.forEach(input => {
    input.addEventListener('change', () => {
      // Save to cookies
      saveSettingToCookie(input.id, input.value || input.checked);
      // TODO: Save settings to backend/localStorage
      console.log(`Setting changed: ${input.id} = ${input.value || input.checked}`);
    });
    
    // Also save on input for text fields
    if (input.classList.contains('setting-text-input')) {
      input.addEventListener('input', () => {
        saveSettingToCookie(input.id, input.value);
      });
    }
  });

  // Handle background sound toggle to enable/disable volume slider
  const backgroundSoundToggle = document.getElementById('background-sound');
  const backgroundVolumeSlider = document.getElementById('background-volume');
  if (backgroundSoundToggle && backgroundVolumeSlider) {
    const updateVolumeSlider = () => {
      backgroundVolumeSlider.disabled = !backgroundSoundToggle.checked;
      backgroundVolumeSlider.style.opacity = backgroundSoundToggle.checked ? '1' : '0.5';
    };
    backgroundSoundToggle.addEventListener('change', updateVolumeSlider);
    // Initial state
    updateVolumeSlider();
  }

  // Handle save settings button
  const saveSettingsBtn = document.getElementById('save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      // Save all current settings to cookies
      saveAllSettingsToCookies();
      // TODO: Implement actual save functionality
      console.log('Saving settings...');
      // For now, just show a simple alert
      alert('Settings saved successfully!');
    });
  }
}

// Cookie utility functions
function saveSettingToCookie(key, value) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1); // Cookie expires in 1 year
  document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function getSettingFromCookie(key) {
  const name = key + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

function loadSettingsFromCookies() {
  // Load voice note name
  const voiceNoteNameInput = document.getElementById('voice-note-name');
  if (voiceNoteNameInput) {
    const savedName = getSettingFromCookie('voice-note-name');
    if (savedName) {
      voiceNoteNameInput.value = savedName;
    }
  }
  
  // Load voice note date
  const voiceNoteDateInput = document.getElementById('voice-note-date');
  if (voiceNoteDateInput) {
    const savedDate = getSettingFromCookie('voice-note-date');
    if (savedDate) {
      voiceNoteDateInput.value = savedDate;
    }
  }
  
  // Load other settings
  const settingsToLoad = [
    'voice-language', 'speaker-sex', 'voice-stability', 'voice-similarity', 
    'background-sound', 'background-volume'
  ];
  
  settingsToLoad.forEach(settingId => {
    const element = document.getElementById(settingId);
    if (element) {
      const savedValue = getSettingFromCookie(settingId);
      if (savedValue !== null) {
        if (element.type === 'checkbox') {
          element.checked = savedValue === 'true';
        } else {
          element.value = savedValue;
          // Update slider value display
          if (element.classList.contains('setting-slider')) {
            const valueSpan = document.getElementById(`${settingId}-value`);
            if (valueSpan) {
              valueSpan.textContent = savedValue;
            }
          }
        }
      }
    }
  });
}

function saveAllSettingsToCookies() {
  const settingsToSave = [
    'voice-language', 'speaker-sex', 'voice-stability', 'voice-similarity',
    'background-sound', 'background-volume', 'voice-note-name', 'voice-note-date'
  ];
  
  settingsToSave.forEach(settingId => {
    const element = document.getElementById(settingId);
    if (element) {
      const value = element.type === 'checkbox' ? element.checked : element.value;
      saveSettingToCookie(settingId, value);
    }
  });
}
