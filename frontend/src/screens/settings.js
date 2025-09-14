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

            <div class="settings-item">
              <div class="setting-row" style="align-items:center;justify-content:space-between;gap:12px;">
                <div class="setting-label-group" style="flex:1;">
                  <span class="setting-label">Preview Mix</span>
                  <span class="setting-description">Hear your voice sample with fan ambiance</span>
                </div>
                <button id="background-preview-btn" class="voice-clone-button secondary-action" style="min-width:130px;">
                  <div class="button-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                  <span class="preview-btn-text">Play</span>
                </button>
                <div id="preview-duration" style="font-size:12px;color:#888;margin-left:12px;min-width:120px;text-align:right;">--:--</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Section -->
        <div class="settings-section">
          <h2 class="section-title">Performance</h2>
          
          <div class="settings-group">
            <div class="settings-item">
              <div class="setting-row" style="align-items:flex-end;gap:12px;">
                <div class="setting-label-group" style="flex:1;">
                  <span class="setting-label">Voice Note Name</span>
                  <span class="setting-description">Custom title for your first recording</span>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                  <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer;">
                    <input type="checkbox" id="voice-note-name-default" style="transform:scale(1.1);"> Default
                  </label>
                  <input type="text" id="voice-note-name" class="setting-text-input" placeholder="Enter custom name" maxlength="50" style="min-width:220px;">
                </div>
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
    // After settings loaded, ensure background volume slider reflects toggle
    const bgToggle = document.getElementById('background-sound');
    const bgVol = document.getElementById('background-volume');
    if (bgToggle && bgVol) {
      bgVol.disabled = !bgToggle.checked;
      bgVol.style.opacity = bgToggle.checked ? '1' : '0.5';
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
  const settingsInputs = document.querySelectorAll('.setting-select, .setting-slider, .setting-toggle, .setting-text-input, .setting-date-input, #voice-note-name-default');
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
    // Initial state (may be overridden again after async load callback)
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

  // Background preview mixing logic
  initBackgroundPreview();
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
  const nameInput = document.getElementById('voice-note-name');
  const toggle = document.getElementById('voice-note-name-default');
  const dateInput = document.getElementById('voice-note-date');
  // Load persisted values
  const savedDate = getSettingFromCookie('voice-note-date');
  if (dateInput && savedDate) dateInput.value = savedDate;
  const savedDefault = getSettingFromCookie('voice-note-name-default');
  if (toggle && savedDefault !== null) toggle.checked = savedDefault === 'true';
  const savedName = getSettingFromCookie('voice-note-name');
  if (nameInput && savedName) nameInput.value = savedName;
  // Bind listeners & then apply mode
  bindNameModeListeners();
  applyNameMode();
  // Load other settings (excluding those handled above)
  ['voice-language','speaker-sex','voice-stability','voice-similarity','background-sound','background-volume'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = getSettingFromCookie(id);
    if (val !== null) {
      if (el.type === 'checkbox') el.checked = val === 'true'; else el.value = val;
      if (el.classList.contains('setting-slider')) {
        const vs = document.getElementById(id+'-value'); if (vs) vs.textContent = el.value;
      }
    }
  });
}

function buildDefaultTitle(dateStr) {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return 'Recording';
    const formatted = d.toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric'});
    return `Recording on ${formatted}`;
  } catch { return 'Recording'; }
}

function applyNameMode() {
  const nameInput = document.getElementById('voice-note-name');
  const toggle = document.getElementById('voice-note-name-default');
  const dateInput = document.getElementById('voice-note-date');
  if (!nameInput || !toggle) return;
  if (toggle.checked) {
    // Store current custom before overriding
    const current = nameInput.value;
    if (current && !current.startsWith('Recording on ')) {
      saveSettingToCookie('voice-note-name-custom', current);
    }
    // Ensure date
    if (dateInput && !dateInput.value) {
      const todayIso = new Date().toISOString().slice(0,10);
      dateInput.value = todayIso;
      saveSettingToCookie('voice-note-date', todayIso);
    }
    const pattern = buildDefaultTitle(dateInput ? dateInput.value : null);
    nameInput.value = pattern;
    saveSettingToCookie('voice-note-name', pattern);
    nameInput.disabled = true;
    nameInput.style.opacity = '0.6';
  } else {
    // Restore custom if exists
    const storedCustom = getSettingFromCookie('voice-note-name-custom');
    if (storedCustom) {
      nameInput.value = storedCustom;
      saveSettingToCookie('voice-note-name', storedCustom);
    } else if (nameInput.value.startsWith('Recording on ')) {
      nameInput.value = '';
      saveSettingToCookie('voice-note-name', '');
    }
    nameInput.disabled = false;
    nameInput.style.opacity = '1';
  }
}
// Bind event listeners for name/date/toggle (idempotent)
function bindNameModeListeners() {
  const nameInput = document.getElementById('voice-note-name');
  const toggle = document.getElementById('voice-note-name-default');
  const dateInput = document.getElementById('voice-note-date');
  // Avoid duplicate bindings
  if (toggle && toggle.dataset.bound === '1') return;
  if (toggle) {
    toggle.addEventListener('change', () => {
      saveSettingToCookie('voice-note-name-default', toggle.checked);
      applyNameMode();
    });
    toggle.dataset.bound = '1';
  }
  if (dateInput && dateInput.dataset.bound !== '1') {
    dateInput.addEventListener('change', () => {
      saveSettingToCookie('voice-note-date', dateInput.value);
      applyNameMode();
    });
    dateInput.dataset.bound = '1';
  }
  if (nameInput && nameInput.dataset.bound !== '1') {
    nameInput.addEventListener('input', () => {
      if (!nameInput.value.startsWith('Recording on ')) {
        saveSettingToCookie('voice-note-name-custom', nameInput.value);
        saveSettingToCookie('voice-note-name', nameInput.value);
      }
    });
    nameInput.dataset.bound = '1';
  }
}

function saveAllSettingsToCookies() {
  const settingsToSave = [
    'voice-language', 'speaker-sex', 'voice-stability', 'voice-similarity',
    'background-sound', 'background-volume', 'voice-note-name', 'voice-note-date', 'voice-note-name-default'
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
    // Ensure listeners then apply current mode
    bindNameModeListeners();
    applyNameMode();
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
        voice_note_date: 'voice-note-date',
        voice_note_name_default: 'voice-note-name-default'
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
    voice_note_date: 'voice-note-date',
    voice_note_name_default: 'voice-note-name-default'
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
  const defaultToggle = getVal('voice-note-name-default') === true;
  let effectiveName = getVal('voice-note-name') || null;
  return {
    voice_language: getVal('voice-language') || 'en',
    speaker_sex: getVal('speaker-sex') || 'male',
    voice_stability: parseInt(getVal('voice-stability') || '50', 10),
    voice_similarity: parseInt(getVal('voice-similarity') || '75', 10),
    background_sound: !!getVal('background-sound'),
    background_volume: parseInt(getVal('background-volume') || '30', 10),
    voice_note_name: effectiveName,
    voice_note_date: getVal('voice-note-date') || null,
    voice_note_name_default: defaultToggle,
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

// ----------------- Background Preview (Web Audio Mix) -----------------
let previewCtx = null;
let previewState = { playing:false, sources:[], gainNodes:[], stopFn:null };
let cachedVoiceBuffer = null;
let cachedFanBuffer = null;

async function initBackgroundPreview() {
  const btn = document.getElementById('background-preview-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (previewState.playing) {
      stopPreviewPlayback();
      return;
    }
    btn.disabled = true;
    const labelSpan = btn.querySelector('.preview-btn-text');
    const originalText = labelSpan ? labelSpan.textContent : 'Play';
    if (labelSpan) labelSpan.textContent = 'Loading';
    try {
      await startPreviewPlayback();
      if (labelSpan) labelSpan.textContent = 'Stop';
    } catch (e) {
      console.warn('Preview start failed', e);
      alert(e.message || 'Failed to start preview');
      if (labelSpan) labelSpan.textContent = originalText;
    } finally {
      btn.disabled = false;
    }
  });
}

function stopPreviewPlayback() {
  previewState.playing = false;
  previewState.sources.forEach(s => { try { s.stop(); } catch(_){} });
  previewState.sources = [];
  previewState.gainNodes = [];
  if (previewCtx && previewCtx.state !== 'closed') {
    // Keep context for reuse (saving user gesture unlocking)
  }
  const btn = document.getElementById('background-preview-btn');
  if (btn) {
    const labelSpan = btn.querySelector('.preview-btn-text');
    if (labelSpan) labelSpan.textContent = 'Play';
  }
}

async function startPreviewPlayback() {
  const userId = getUserId();
  if (!userId) throw new Error('Login required to preview');
  if (!previewCtx) previewCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Auto-resume context on user gesture
  if (previewCtx.state === 'suspended') await previewCtx.resume();

  // Fetch / decode voice sample if not cached
  if (!cachedVoiceBuffer) {
    cachedVoiceBuffer = await fetchAndDecodeVoice(previewCtx, userId);
  }
  if (!cachedVoiceBuffer) throw new Error('No voice sample available');

  const bgToggle = document.getElementById('background-sound');
  const bgEnabled = bgToggle ? bgToggle.checked : false;
  const bgVolumeEl = document.getElementById('background-volume');
  const bgVolumePct = bgVolumeEl ? parseInt(bgVolumeEl.value || '30',10) : 30;

  // Load fan buffer only if background enabled
  if (bgEnabled && !cachedFanBuffer) {
    cachedFanBuffer = await fetchAndDecodeFan(previewCtx);
  }

  // Create destination merger via gain nodes
  const now = previewCtx.currentTime;
  const sources = [];
  const gains = [];

  // Voice source
  const voiceSource = previewCtx.createBufferSource();
  voiceSource.buffer = cachedVoiceBuffer;
  // Update duration display (voice length) in mm:ss
  const durEl = document.getElementById('preview-duration');
  if (durEl && cachedVoiceBuffer && cachedVoiceBuffer.duration) {
    const total = cachedVoiceBuffer.duration;
    const mm = Math.floor(total/60).toString().padStart(2,'0');
    const ss = Math.floor(total%60).toString().padStart(2,'0');
    durEl.textContent = `${mm}:${ss}`;
  }
  const voiceGain = previewCtx.createGain();
  voiceGain.gain.setValueAtTime(1, now);
  voiceSource.connect(voiceGain).connect(previewCtx.destination);
  sources.push(voiceSource); gains.push(voiceGain);

  if (bgEnabled && cachedFanBuffer) {
    const fanSource = previewCtx.createBufferSource();
    fanSource.buffer = cachedFanBuffer;
    fanSource.loop = true; // fan ambience continuous
    const fanGain = previewCtx.createGain();
    // Simple linear scaling; potential future: perceptual curve
    fanGain.gain.setValueAtTime(Math.min(Math.max(bgVolumePct/100, 0), 1), now);
    fanSource.connect(fanGain).connect(previewCtx.destination);
    sources.push(fanSource); gains.push(fanGain);
  }

  // Auto-stop when voice ends (fade out fan)
  voiceSource.onended = () => {
    if (!previewState.playing) return;
    if (sources.length > 1) {
      const fanGain = gains[1];
      try {
        fanGain.gain.linearRampToValueAtTime(0, previewCtx.currentTime + 0.8);
      } catch(_){}
      setTimeout(() => stopPreviewPlayback(), 900);
    } else {
      stopPreviewPlayback();
    }
  };

  previewState.playing = true;
  previewState.sources = sources;
  previewState.gainNodes = gains;
  sources.forEach(s => s.start());
}

async function fetchAndDecodeVoice(ctx, userId) {
  try {
    const { apiClient } = await import('../api.ts');
    const src = await apiClient.getUserVoiceSource(userId).catch(() => null);
    if (!src || !src.audio_base64) return null;
    const blob = base64ToBlob(src.audio_base64, src.mime || 'audio/mpeg');
    const arrBuf = await blob.arrayBuffer();
    return await ctx.decodeAudioData(arrBuf.slice(0));
  } catch (e) { console.warn('fetch voice sample failed', e); return null; }
}

async function fetchAndDecodeFan(ctx) {
  // Serve fan.mp3 via static relative path: assuming backend mounted /backend/audio-files static or dev server serves root
  // We'll construct path relative to origin: /backend/audio-files/fan.mp3
  // Primary: local bundled asset (placed by user in screens/audiobackground/fan.mp3)
  let localAsset = null;
  try {
    localAsset = new URL('./audiobackground/fan.mp3', import.meta.url).href;
  } catch (_) {}
  const base = (import.meta && (import.meta).env && (import.meta).env.VITE_API_BASE_URL) ? (import.meta).env.VITE_API_BASE_URL.replace(/\/$/,'') : '/api';
  const urlCandidates = [
    localAsset,
    '/audio-static/fan.mp3',
    `${base}/ambient/fan`,
    `${base}/audio-static/fan.mp3`,
    '/backend/audio-files/fan.mp3',
    '/audio-files/fan.mp3'
  ].filter(Boolean);
  for (const u of urlCandidates) {
    try {
      const res = await fetch(u);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      return await ctx.decodeAudioData(buf.slice(0));
    } catch(_){}
  }
  throw new Error('fan.mp3 not reachable');
}

// helper reused (duplicated from voice-clone; could DRY later)
function base64ToBlob(b64, mime) {
  const byteChars = atob(b64);
  const len = byteChars.length;
  const bytes = new Uint8Array(len);
  for (let i=0;i<len;i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
