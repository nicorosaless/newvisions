export function renderVoiceCloneScreen() {
  return `
    <div class="settings-container">
      <div class="settings-header">
        <button class="back-button" id="back-to-settings">
          <span class="back-arrow">←</span>
        </button>
        <h1>Voice Clone</h1>
        <div class="spacer"></div>
      </div>

      <div class="settings-content">
        <!-- Instructions Section -->
        <div class="settings-section">
          <h2 class="section-title">Getting Started</h2>
          <div class="settings-group">
            <div class="settings-item">
              <div class="instruction-card">
                <div class="instruction-content">
                  <h3 class="instruction-title">Create Your Voice Clone</h3>
                  <p class="instruction-description">Record 30-60 seconds of clear speech to create your personal AI voice. Speak naturally and vary your tone for best results.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recording Section -->
        <div class="settings-section">
          <h2 class="section-title">Record Your Voice</h2>
          <div class="settings-group">
            <div class="recording-card">
              <div class="recording-main">
                <div class="microphone-container" id="microphone-container">
                  <div class="mic-ring">
                    <button class="microphone-button" id="record-button">
                      <svg class="microphone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="recording-status" id="recording-status">
                  <span class="status-text">Tap the microphone to start recording</span>
                </div>

                <div class="recording-timer" id="recording-timer" style="display: none;">
                  <div class="timer-container">
                    <div class="recording-indicator"></div>
                    <span class="timer-text"><span id="timer-display">00:00</span></span>
                  </div>
                </div>

                <div class="recording-controls" id="recording-controls" style="display: none;">
                  <button class="voice-clone-button stop-button" id="stop-recording">
                    <div class="button-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                      </svg>
                    </div>
                    <span>Stop Recording</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload MP3 Section -->
        <div class="settings-section">
          <h2 class="section-title">Upload MP3 Sample</h2>
          <div class="settings-group">
            <div class="recording-card">
              <div class="recording-main" style="display:flex; align-items:center; gap:12px;">
                <input type="file" id="mp3-file-input" accept="audio/mpeg,audio/mp3,audio/*" style="display:none;" />
                <button class="voice-clone-button secondary-action" id="upload-mp3-button">
                  <div class="button-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 5v14"></path>
                      <path d="M5 12l7-7 7 7"></path>
                    </svg>
                  </div>
                  <span>Upload MP3</span>
                </button>
                <span class="upload-hint" style="opacity:0.8; font-size:0.9em;">MP3, 30–60 seconds, ≤3MB</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Playback Section -->
        <div class="settings-section" id="playback-section" style="display: none;">
          <h2 class="section-title">Review Your Recording</h2>
          <div class="settings-group">
            <div class="playback-card">
              <div class="audio-player-container">
                <div class="audio-visualization">
                  <div class="waveform">
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                  </div>
                </div>
                <audio controls id="recorded-audio" class="audio-player">
                  Your browser does not support the audio element.
                </audio>
              </div>

              <div class="playback-actions">
                <button class="voice-clone-button secondary-action" id="re-record">
                  <div class="button-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                      <path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                      <path d="M3 21v-5h5"></path>
                    </svg>
                  </div>
                  <span>Re-record</span>
                </button>

                <button class="voice-clone-button primary-action" id="generate-voice-clone">
                  <div class="button-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 12l2 2 4-4"></path>
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </div>
                  <span>Generate Voice Clone</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing Section -->
        <div class="settings-section" id="processing-section" style="display: none;">
          <h2 class="section-title">Creating Your Voice Clone</h2>
          <div class="settings-group">
            <div class="processing-card">
              <div class="processing-animation">
                <div class="processing-spinner">
                  <div class="spinner-ring"></div>
                  <div class="spinner-ring"></div>
                  <div class="spinner-ring"></div>
                </div>
              </div>
              <div class="processing-content">
                <h3 class="processing-title">Analyzing Your Voice</h3>
                <p class="processing-description">This may take a few minutes while we analyze your voice patterns and create your custom AI voice.</p>
                <div class="processing-progress">
                  <div class="progress-bar">
                    <div class="progress-fill"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// Screen-specific event wiring for Voice Clone UI
export function setupVoiceCloneEventListeners() {
  // Elements
  const recordBtn = document.getElementById('record-button');
  const stopBtn = document.getElementById('stop-recording');
  const statusEl = document.getElementById('recording-status')?.querySelector('.status-text');
  const timerWrap = document.getElementById('recording-timer');
  const timerDisplay = document.getElementById('timer-display');
  const controlsWrap = document.getElementById('recording-controls');
  const playbackSection = document.getElementById('playback-section');
  const processingSection = document.getElementById('processing-section');
  const audioEl = document.getElementById('recorded-audio');
  const uploadBtn = document.getElementById('upload-mp3-button');
  const fileInput = document.getElementById('mp3-file-input');
  const reRecordBtn = document.getElementById('re-record');
  const generateBtn = document.getElementById('generate-voice-clone');
  let hasUploadedSample = false;

  // Build/augment waveform bars with staggered delays
  const waveform = document.querySelector('.waveform');
  if (waveform) {
    const desiredBars = 40;
    // Clear preset bars to avoid uneven spacing
    while (waveform.firstChild) waveform.removeChild(waveform.firstChild);
    for (let i = 0; i < desiredBars; i++) {
      const bar = document.createElement('div');
      bar.className = 'wave-bar';
      bar.style.setProperty('--delay', `${(i % 20) * 0.08}s`);
      waveform.appendChild(bar);
    }
  }

  function setWaveActive(active) {
    document.querySelectorAll('.wave-bar').forEach(bar => {
      if (active) {
        bar.classList.add('active');
        bar.style.animationPlayState = 'running';
      } else {
        bar.classList.remove('active');
        bar.style.animationPlayState = 'paused';
      }
    });
  }

  // Timer helpers
  let timer = null;
  let seconds = 0;
  function startTimer() {
    seconds = 0;
    if (timerDisplay) timerDisplay.textContent = '00:00';
    timer = setInterval(() => {
      seconds += 1;
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  // Simple recording stub with microphone; falls back to animation-only if not available
  let mediaRecorder = null;
  let recordedChunks = [];
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (audioEl) {
          audioEl.src = url;
          audioEl.load();
        }
        if (playbackSection) playbackSection.style.display = '';
      };
      mediaRecorder.start();
      if (statusEl) statusEl.textContent = 'Recording...';
      if (timerWrap) timerWrap.style.display = '';
      if (controlsWrap) controlsWrap.style.display = '';
      setWaveActive(true);
      startTimer();
    } catch (err) {
      console.warn('Microphone not available, fallback to visual only', err);
      // Fallback: just animate and show timer
      if (statusEl) statusEl.textContent = 'Recording (visual only)...';
      if (timerWrap) timerWrap.style.display = '';
      if (controlsWrap) controlsWrap.style.display = '';
      setWaveActive(true);
      startTimer();
    }
  }

  function stopRecordingFlow() {
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
      }
    } catch {}
    stopTimer();
    if (statusEl) statusEl.textContent = 'Tap the microphone to start recording';
    setWaveActive(false);
    if (timerWrap) timerWrap.style.display = 'none';
    if (controlsWrap) controlsWrap.style.display = 'none';
  }

  // Upload MP3 handling
  uploadBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { alert('Please select an audio file.'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('File must be ≤ 3MB.'); return; }
    const url = URL.createObjectURL(file);
    if (audioEl) {
      audioEl.src = url;
      audioEl.load();
    }
    if (playbackSection) playbackSection.style.display = '';

    // If a sample was already uploaded, auto-upload re-uploads
    if (hasUploadedSample) {
      (async () => {
        try {
          if (processingSection) processingSection.style.display = '';
          const userId = getUserId();
          if (!userId) { alert('Please log in again.'); return; }
          const base64 = await blobToBase64(file);
          const { apiClient } = await import('../api.ts');
          await apiClient.uploadUserVoice(userId, base64, file.type || 'audio/mpeg', undefined, undefined);
          alert('Voice sample updated.');
        } catch (err) {
          console.warn('Re-upload failed', err);
          alert('Failed to update your voice sample. Try again.');
        } finally {
          if (processingSection) processingSection.style.display = 'none';
        }
      })();
    }
  });

  // Audio-driven waveform animation
  if (audioEl) {
    audioEl.addEventListener('play', () => setWaveActive(true));
    audioEl.addEventListener('pause', () => {
      document.querySelectorAll('.wave-bar').forEach(bar => bar.style.animationPlayState = 'paused');
    });
    audioEl.addEventListener('ended', () => setWaveActive(false));
  }

  // Actions
  recordBtn?.addEventListener('click', startRecording);
  stopBtn?.addEventListener('click', stopRecordingFlow);
  reRecordBtn?.addEventListener('click', () => {
    // Reset playback and allow new recording/upload
    if (audioEl) { audioEl.pause(); audioEl.removeAttribute('src'); audioEl.load(); }
    if (playbackSection) playbackSection.style.display = 'none';
    if (processingSection) processingSection.style.display = 'none';
    setWaveActive(false);
  });

  generateBtn?.addEventListener('click', async () => {
    try {
      // Prevent double clicks
      if (generateBtn) generateBtn.disabled = true;
      if (!audioEl || !audioEl.src) { alert('Please record or upload an audio sample first.'); return; }
      if (processingSection) processingSection.style.display = '';
      // Convert current audio source to base64 by fetching the blob
      const res = await fetch(audioEl.src);
      const blob = await res.blob();
      const base64 = await blobToBase64(blob);
      const userId = getUserId();
      if (!userId) { alert('Please log in again.'); return; }
      const { apiClient } = await import('../api.ts');
      await apiClient.uploadUserVoice(userId, base64, blob.type || 'audio/mpeg', undefined, undefined);
      alert('Voice sample saved. You can now perform routines.');
      // Hide the Generate button after first successful upload
      hasUploadedSample = true;
      if (generateBtn) generateBtn.style.display = 'none';
    } catch (err) {
      console.warn('Voice upload failed', err);
      alert('Failed to save your voice sample. Try again.');
    } finally {
      if (generateBtn) generateBtn.disabled = false;
      if (processingSection) processingSection.style.display = 'none';
    }
  });

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result;
        if (typeof res === 'string') resolve(res.split(',')[1] || res);
        else reject(new Error('Invalid reader result'));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function getUserId() {
    const match = document.cookie.match(/(?:^|; )user_id=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
    try { return localStorage.getItem('user_id'); } catch { return null; }
  }
}
