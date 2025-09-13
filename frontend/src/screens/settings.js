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
  // First attempt remote fetch; fallback to cookies
  attemptRemoteSettingsLoad().then(loaded => {
    if (!loaded) {
      loadSettingsFromCookies();
    }
  });

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
      // Collect settings
      const payload = collectCurrentSettings();
      const userId = getUserId();
      if (!userId) {
        alert('You must login before saving settings.');
        return;
      }
      // Dynamic import to avoid circular deps (api.ts is TS, but Vite handles)
      import('../api.ts').then(({ updateUserSettings }) => {
        saveSettingsBtn.disabled = true;
        const originalText = saveSettingsBtn.textContent;
        saveSettingsBtn.textContent = 'Saving...';
        updateUserSettings(userId, payload)
          .then(() => {
            console.log('Settings saved to backend', payload);
            alert('Settings saved successfully!');
          })
          .catch(err => {
            console.error(err);
            const msg = err?.details?.detail || err.message || 'Failed to save settings';
            alert(msg);
          })
          .finally(() => {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.textContent = originalText;
          });
      });
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

async function attemptRemoteSettingsLoad() {
  const userId = getUserId();
  if (!userId) return false;
  try {
    const { getUserSettings } = await import('../api.ts');
    const settings = await getUserSettings(userId);
    applySettingsToUI(settings);
    // Persist locally (cookies) for offline/fallback
    Object.entries(settings).forEach(([k,v]) => {
      // map back to UI ids where different
      const idMap = {
        voice_language: 'voice-language',
        speaker_sex: 'speaker-sex',
        voice_stability: 'voice-stability',
        voice_similarity: 'voice-similarity',
        background_sound: 'background-sound',
        background_volume: 'background-volume',
        voice_note_name: 'voice-note-name',
        voice_note_date: 'voice-note-date'
      };
      const domKey = idMap[k] || k;
  saveSettingToCookie(domKey, v);
    });
    return true;
  } catch (err) {
    console.warn('Remote settings load failed, using cookies fallback', err);
    return false;
  }
}

function applySettingsToUI(settings) {
  const map = {
    voice_language: 'voice-language',
    speaker_sex: 'speaker-sex',
    voice_stability: 'voice-stability',
    voice_similarity: 'voice-similarity',
    background_sound: 'background-sound',
    background_volume: 'background-volume',
    voice_note_name: 'voice-note-name',
    voice_note_date: 'voice-note-date'
  };
  Object.entries(map).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = settings[k];
    if (el.type === 'checkbox') {
      el.checked = !!val;
    } else if (val !== undefined && val !== null) {
      el.value = val;
    }
    if (el.classList.contains('setting-slider')) {
      const span = document.getElementById(id + '-value');
      if (span) span.textContent = el.value;
    }
  });
}

// Collect current DOM settings into backend payload shape
function collectCurrentSettings() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    if (el.type === 'checkbox') return el.checked;
    return el.value;
  };
  return {
    voice_language: getVal('voice-language') || 'en',
    speaker_sex: getVal('speaker-sex') || 'male',
    voice_stability: parseInt(getVal('voice-stability') || '50', 10),
    voice_similarity: parseInt(getVal('voice-similarity') || '75', 10),
    background_sound: !!getVal('background-sound'),
    background_volume: parseInt(getVal('background-volume') || '30', 10),
    voice_note_name: getVal('voice-note-name') || null,
    voice_note_date: getVal('voice-note-date') || null,
  };
}

// Retrieve user id (simple approach until JWT implemented)
function getUserId() {
  // Preferred: cookie 'user_id'
  const fromCookie = getSettingFromCookie('user_id');
  if (fromCookie) return fromCookie;
  try {
    const fromStorage = localStorage.getItem('user_id');
    return fromStorage || null;
  } catch (_) {
    return null;
  }
}
