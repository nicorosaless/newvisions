export function renderVoiceRecordingScreen(routineType, routineValue) {
    return `
        <div class="voice-recorder-app">
            <!-- App Header -->
            <header class="voice-header ios-header">
                <div class="header-center">
                    <h1 class="voice-title large">All Recordings</h1>
                </div>
                <div class="header-right">
                    <button class="edit-button" id="edit-recordings">Edit</button>
                </div>
            </header>

            <!-- Content Area -->
            <main class="voice-content">
                <!-- Listen Panel -->
                <section class="voice-panel listen-panel active" id="listen-panel">
                    <!-- Search Bar -->
                    <div class="search-container">
                        <div class="search-bar">
                            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <input type="text" placeholder="Search your recordings" class="search-input">
                            <button class="search-menu-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="1"/>
                                    <circle cx="12" cy="5" r="1"/>
                                    <circle cx="12" cy="19" r="1"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="recordings-container">
                        <!-- Recent Section -->
                        <div class="recordings-section">
                            
                            <!-- Static first recording removed; dynamically injected cards will appear here -->

                            <div class="recording-card" data-recording-id="2">
                                <div class="recording-main">
                                    <div class="recording-header">
                                        <div class="recording-info">
                                                <h4 class="recording-title">Recording on 14 Apr 2024</h4>
                                                <div class="recording-subtitle">14 Apr 2024</div>
                                        </div>
                                        <div class="recording-duration">5:42</div>
                                    </div>
                                    
                                    <div class="playback-controls hidden">
                                        <button class="control-button skip-backward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="19,20 9,12 19,4"></polygon>
                                                <line x1="5" y1="19" x2="5" y2="5"></line>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button play-pause-btn">
                                            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21"></polygon>
                                            </svg>
                                            <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button skip-forward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,4 15,12 5,20"></polygon>
                                                <line x1="19" y1="5" x2="19" y2="19"></line>
                                            </svg>
                                        </button>
                                        
                                        <div class="progress-container">
                                            <div class="progress-bar">
                                                <div class="progress-fill"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="playback-time">
                                            <span class="current-time">0:00</span>
                                            <span class="total-time">15:42</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="recording-card" data-recording-id="3">
                                <div class="recording-main">
                                    <div class="recording-header">
                                        <div class="recording-info">
                                                <h4 class="recording-title">Recording on 4 Oct 2023</h4>
                                                <div class="recording-subtitle">4 Oct 2023</div>
                                        </div>
                                        <div class="recording-duration">1:28</div>
                                    </div>
                                    
                                    <div class="playback-controls hidden">
                                        <button class="control-button skip-backward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="19,20 9,12 19,4"></polygon>
                                                <line x1="5" y1="19" x2="5" y2="5"></line>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button play-pause-btn">
                                            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21"></polygon>
                                            </svg>
                                            <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button skip-forward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,4 15,12 5,20"></polygon>
                                                <line x1="19" y1="5" x2="19" y2="19"></line>
                                            </svg>
                                        </button>
                                        
                                        <div class="progress-container">
                                            <div class="progress-bar">
                                                <div class="progress-fill"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="playback-time">
                                            <span class="current-time">0:00</span>
                                            <span class="total-time">1:28</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="recording-card" data-recording-id="4">
                                <div class="recording-main">
                                    <div class="recording-header">
                                        <div class="recording-info">
                                                <h4 class="recording-title">Recording on 15 Mar 2023</h4>
                                                <div class="recording-subtitle">15 Mar 2023</div>
                                        </div>
                                        <div class="recording-duration">3:12</div>
                                    </div>
                                    
                                    <div class="playback-controls hidden">
                                        <button class="control-button skip-backward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="19,20 9,12 19,4"></polygon>
                                                <line x1="5" y1="19" x2="5" y2="5"></line>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button play-pause-btn">
                                            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21"></polygon>
                                            </svg>
                                            <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button skip-forward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,4 15,12 5,20"></polygon>
                                                <line x1="19" y1="5" x2="19" y2="19"></line>
                                            </svg>
                                        </button>
                                        
                                        <div class="progress-container">
                                            <div class="progress-bar">
                                                <div class="progress-fill"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="playback-time">
                                            <span class="current-time">0:00</span>
                                            <span class="total-time">3:12</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="recording-card" data-recording-id="5">
                                <div class="recording-main">
                                    <div class="recording-header">
                                        <div class="recording-info">
                                                <h4 class="recording-title">Recording on 22 Jan 2023</h4>
                                                <div class="recording-subtitle">22 Jan 2023</div>
                                        </div>
                                        <div class="recording-duration">0:45</div>
                                    </div>
                                    
                                    <div class="playback-controls hidden">
                                        <button class="control-button skip-backward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="19,20 9,12 19,4"></polygon>
                                                <line x1="5" y1="19" x2="5" y2="5"></line>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button play-pause-btn">
                                            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21"></polygon>
                                            </svg>
                                            <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button skip-forward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,4 15,12 5,20"></polygon>
                                                <line x1="19" y1="5" x2="19" y2="19"></line>
                                            </svg>
                                        </button>
                                        
                                        <div class="progress-container">
                                            <div class="progress-bar">
                                                <div class="progress-fill"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="playback-time">
                                            <span class="current-time">0:00</span>
                                            <span class="total-time">0:45</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="recording-card" data-recording-id="6">
                                <div class="recording-main">
                                    <div class="recording-header">
                                        <div class="recording-info">
                                                <h4 class="recording-title">Recording on 8 Dec 2022</h4>
                                                <div class="recording-subtitle">8 Dec 2022</div>
                                        </div>
                                        <div class="recording-duration">5:33</div>
                                    </div>
                                    
                                    <div class="playback-controls hidden">
                                        <button class="control-button skip-backward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="19,20 9,12 19,4"></polygon>
                                                <line x1="5" y1="19" x2="5" y2="5"></line>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button play-pause-btn">
                                            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21"></polygon>
                                            </svg>
                                            <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button skip-forward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,4 15,12 5,20"></polygon>
                                                <line x1="19" y1="5" x2="19" y2="19"></line>
                                            </svg>
                                        </button>
                                        
                                        <div class="progress-container">
                                            <div class="progress-bar">
                                                <div class="progress-fill"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="playback-time">
                                            <span class="current-time">0:00</span>
                                            <span class="total-time">5:33</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="recording-card" data-recording-id="7">
                                <div class="recording-main">
                                    <div class="recording-header">
                                        <div class="recording-info">
                                                <h4 class="recording-title">Recording on 19 Sep 2022</h4>
                                                <div class="recording-subtitle">19 Sep 2022</div>
                                        </div>
                                        <div class="recording-duration">2:18</div>
                                    </div>
                                    
                                    <div class="playback-controls hidden">
                                        <button class="control-button skip-backward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="19,20 9,12 19,4"></polygon>
                                                <line x1="5" y1="19" x2="5" y2="5"></line>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button play-pause-btn">
                                            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21"></polygon>
                                            </svg>
                                            <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button skip-forward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,4 15,12 5,20"></polygon>
                                                <line x1="19" y1="5" x2="19" y2="19"></line>
                                            </svg>
                                        </button>
                                        
                                        <div class="progress-container">
                                            <div class="progress-bar">
                                                <div class="progress-fill"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="playback-time">
                                            <span class="current-time">0:00</span>
                                            <span class="total-time">2:18</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="recording-card" data-recording-id="8">
                                <div class="recording-main">
                                    <div class="recording-header">
                                        <div class="recording-info">
                                                <h4 class="recording-title">Recording on 3 Jul 2022</h4>
                                                <div class="recording-subtitle">3 Jul 2022</div>
                                        </div>
                                        <div class="recording-duration">4:07</div>
                                    </div>
                                    
                                    <div class="playback-controls hidden">
                                        <button class="control-button skip-backward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="19,20 9,12 19,4"></polygon>
                                                <line x1="5" y1="19" x2="5" y2="5"></line>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button play-pause-btn">
                                            <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21"></polygon>
                                            </svg>
                                            <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                        </button>
                                        
                                        <button class="control-button skip-forward">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,4 15,12 5,20"></polygon>
                                                <line x1="19" y1="5" x2="19" y2="19"></line>
                                            </svg>
                                        </button>
                                        
                                        <div class="progress-container">
                                            <div class="progress-bar">
                                                <div class="progress-fill"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="playback-time">
                                            <span class="current-time">0:00</span>
                                            <span class="total-time">4:07</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


              </div>
            </div>
          </div>

        </section>
      </main>

      <!-- Bottom Recording Footer (iOS-style) -->
      <footer class="recording-footer" aria-label="Record Controls">
        <div class="recording-footer-inner">
          <button id="footer-record-btn" class="footer-record-btn" aria-pressed="false" style="border-radius: 50%;">
            <span class="footer-record-ring"></span>
            <span class="footer-record-dot"></span>
          </button>
        </div>
      </footer>

      <!-- Hidden routine info -->
      <div id="current-routine-info" style="display:none" data-type="${routineType}" data-value="${routineValue}"></div>
    </div>`;
}

export function setupVoiceRecordingEventListeners() {
    // Auto-perform pipeline: extract routine info and request generation
    try {
        const routineInfo = document.getElementById('current-routine-info');
        const userId = (document.cookie.match(/user_id=([^;]+)/) || [])[1] || localStorage.getItem('user_id');
        if (routineInfo && userId) {
            const routine_type = routineInfo.getAttribute('data-type');
            const routine_value = routineInfo.getAttribute('data-value');
            if (routine_type && routine_value) {
                triggerPerformPipeline(userId, routine_type, routine_value);
            }
        }
    } catch (e) {
        console.warn('Perform auto pipeline init failed', e);
    }

    async function triggerPerformPipeline(userId, routineType, routineValue) {
        const container = document.querySelector('.recordings-container');
        if (!container) return;
        // Crear tarjeta inmediatamente (titulo/fecha del usuario)
        let customName = getCookieValue('voice-note-name');
        let customDateISO = getCookieValue('voice-note-date');
        let defaultToggle = getCookieValue('voice-note-name-default') === 'true';
        const now = new Date();
        let subtitleDate = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        if (customDateISO) {
            try { const d = new Date(customDateISO); if (!isNaN(d.getTime())) subtitleDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); } catch(_){ }
        }
        // Fallbacks cuando no hay cookies aún (por primer login sin settings guardados)
        if (!customDateISO) {
            // intentar usar fecha actual formateada para consistencia
            // (subtitleDate ya es fecha actual formateada)
        }
        const titleText = (defaultToggle ? null : customName) || `Recording on ${subtitleDate}`;
        const card = document.createElement('div');
        card.className = 'recording-card generated pending';
        card.innerHTML = `
            <div class="recording-main">
                <div class="recording-header">
                    <div class="recording-info">
                        <h4 class="recording-title">${escapeHtml(titleText)}</h4>
                        <div class="recording-subtitle">${subtitleDate}</div>
                    </div>
                    <div class="recording-duration">--:--</div>
                </div>
                <div class="playback-controls hidden">
                    <button class="control-button play-pause-btn">
                        <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"></polygon></svg>
                        <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    </button>
                    <div class="progress-container"><div class="progress-bar"><div class="progress-fill"></div></div></div>
                    <div class="playback-time"><span class="current-time">0:00</span><span class="total-time">--:--</span></div>
                </div>
                <audio class="generated-audio" preload="auto" style="display:none"></audio>
            </div>`;
        container.prepend(card);
        wireCardInteractions(card);
        // Llamar perform y actualizar solo duración cuando llegue
        try {
            const { performRoutine } = await import('../api.ts');
            const resp = await performRoutine({ user_id: userId, routine_type: routineType, value: routineValue });
            // Créditos
            try {
                const { setUserCredits } = await import('../state.js');
                if (typeof resp.charCount === 'number' && typeof resp.monthlyLimit === 'number') {
                    setUserCredits(resp.charCount, resp.monthlyLimit);
                    const creditEl = document.querySelector('.credits-text');
                    if (creditEl) creditEl.textContent = `${resp.charCount}/${resp.monthlyLimit}`;
                }
            } catch(e){ console.warn('Credit update failed', e); }
            const audioEl = card.querySelector('audio.generated-audio');
            if (audioEl) {
                try {
                    const blob = base64ToBlob(resp.audio_base64, 'audio/mpeg');
                    const url = URL.createObjectURL(blob);
                    audioEl.src = url;
                    audioEl.addEventListener('loadedmetadata', () => {
                        const dur = formatSeconds(audioEl.duration);
                        const durEl = card.querySelector('.recording-duration');
                        const totalTimeEl = card.querySelector('.total-time');
                        if (durEl) durEl.textContent = dur;
                        if (totalTimeEl) totalTimeEl.textContent = dur;
                        card.classList.remove('pending');
                    });
                } catch(e){ console.warn('Attach audio failed', e); }
            }
        } catch(err) {
            console.error('Perform error', err);
            const durEl = card.querySelector('.recording-duration');
            if (durEl) durEl.textContent = 'ERR';
            card.classList.add('error');
        }
    }

    function base64ToBlob(b64, mime) {
        const byteChars = atob(b64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mime });
    }

    function formatSeconds(sec) {
        if (!isFinite(sec)) return '--:--';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"] /g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',' ':' ' }[c] || c));
    }

    function wireCardInteractions(card) {
        const controls = card.querySelector('.playback-controls');
        const header = card.querySelector('.recording-header');
        const playBtn = card.querySelector('.play-pause-btn');
        const playIcon = card.querySelector('.play-icon');
        const pauseIcon = card.querySelector('.pause-icon');
        const audio = card.querySelector('audio.generated-audio');
        const progressFill = card.querySelector('.progress-fill');
        const currentTimeEl = card.querySelector('.current-time');
        const totalTimeEl = card.querySelector('.total-time');
        header.addEventListener('click', () => {
            const expanded = card.classList.toggle('expanded');
            controls.classList.toggle('hidden', !expanded);
        });
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio.paused) {
                audio.play();
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
            } else {
                audio.pause();
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            }
        });
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const pct = (audio.currentTime / audio.duration) * 100;
                progressFill.style.width = pct + '%';
                currentTimeEl.textContent = formatSeconds(audio.currentTime);
            }
        });
        audio.addEventListener('ended', () => {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            progressFill.style.width = '0%';
            currentTimeEl.textContent = '0:00';
        });
    }
    // (Removed call to loadCustomRecordingDetails)

  // Recording card expansion and playback  // Recording functionality
  const recordBtn = document.getElementById('record-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const stopBtn = document.getElementById('stop-btn');
  const timeDisplay = document.getElementById('recording-time');
  const statusDisplay = document.getElementById('recording-status');
  const waveformContainer = document.getElementById('waveform');

  // Generate waveform bars
  if (waveformContainer && waveformContainer.children.length === 0) {
    for (let i = 0; i < 50; i++) {
      const bar = document.createElement('div');
      bar.className = 'wave-bar';
      bar.style.setProperty('--delay', `${i * 0.1}s`);
      waveformContainer.appendChild(bar);
    }
  }

  let recordingTimer = null;
  let seconds = 0;
  let isRecording = false;
  let isPaused = false;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function startRecording() {
    if (isRecording) return;
    
    isRecording = true;
    isPaused = false;
    seconds = 0;
    
    // Update UI
    recordBtn.classList.add('recording');
    pauseBtn.classList.remove('hidden');
    stopBtn.classList.remove('hidden');
    statusDisplay.textContent = 'Recording...';
    
    // Start timer
    recordingTimer = setInterval(() => {
      if (!isPaused) {
        seconds++;
        timeDisplay.textContent = formatTime(seconds);
      }
    }, 1000);
    
    // Animate waveform
    document.querySelectorAll('.wave-bar').forEach(bar => {
      bar.classList.add('active');
    });
  }

  function pauseRecording() {
    if (!isRecording) return;
    
    isPaused = !isPaused;
    pauseBtn.classList.toggle('paused', isPaused);
    statusDisplay.textContent = isPaused ? 'Paused' : 'Recording...';
    
    // Toggle waveform animation
    document.querySelectorAll('.wave-bar').forEach(bar => {
      bar.style.animationPlayState = isPaused ? 'paused' : 'running';
    });
  }

  function stopRecording() {
    if (!isRecording) return;
    
    isRecording = false;
    isPaused = false;
    
    // Clear timer
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
    
    // Reset UI
    recordBtn.classList.remove('recording');
    pauseBtn.classList.add('hidden');
    stopBtn.classList.add('hidden');
    pauseBtn.classList.remove('paused');
    statusDisplay.textContent = 'is ready to start';
    
    // Stop waveform animation
    document.querySelectorAll('.wave-bar').forEach(bar => {
      bar.classList.remove('active');
      bar.style.animationPlayState = 'paused';
    });
    
    // Reset timer display
    timeDisplay.textContent = '00:00';
    seconds = 0;
  }

  recordBtn?.addEventListener('click', startRecording);
  pauseBtn?.addEventListener('click', pauseRecording);
  stopBtn?.addEventListener('click', stopRecording);

  // Recording card expansion and playback
  document.querySelectorAll('.recording-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't expand if clicking on control buttons
      if (e.target.closest('.playback-controls')) {
        return;
      }
      
      // Close all other expanded cards
      document.querySelectorAll('.recording-card.expanded').forEach(otherCard => {
        if (otherCard !== card) {
          otherCard.classList.remove('expanded');
          const controls = otherCard.querySelector('.playback-controls');
          controls.classList.add('hidden');
        }
      });
      
      // Toggle current card
      const isExpanded = card.classList.contains('expanded');
      const controls = card.querySelector('.playback-controls');
      
      if (isExpanded) {
        card.classList.remove('expanded');
        controls.classList.add('hidden');
      } else {
        card.classList.add('expanded');
        controls.classList.remove('hidden');
      }
    });
  });

  // Playback control functionality
  document.querySelectorAll('.play-pause-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const playIcon = btn.querySelector('.play-icon');
      const pauseIcon = btn.querySelector('.pause-icon');
      const isPlaying = !playIcon.classList.contains('hidden');
      
      if (isPlaying) {
        // Pause
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        // TODO: Implement actual pause functionality
        console.log('Pausing playback');
      } else {
        // Play
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        // TODO: Implement actual play functionality
        console.log('Starting playback');
      }
    });
  });

  // Skip controls
  document.querySelectorAll('.skip-backward').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // TODO: Implement skip backward functionality
      console.log('Skipping backward');
    });
  });

  document.querySelectorAll('.skip-forward').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // TODO: Implement skip forward functionality
      console.log('Skipping forward');
    });
  });

  // Search functionality
  const searchInput = document.querySelector('.search-input');
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const recordingCards = document.querySelectorAll('.recording-card');
    
    recordingCards.forEach(card => {
      const title = card.querySelector('.recording-title')?.textContent.toLowerCase();
      const subtitle = card.querySelector('.recording-subtitle')?.textContent.toLowerCase();
      
      if (title?.includes(query) || subtitle?.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });

  // Footer record button interaction (visual only for now)
  const footerRecordBtn = document.getElementById('footer-record-btn');
  footerRecordBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = footerRecordBtn.classList.toggle('active');
    footerRecordBtn.setAttribute('aria-pressed', String(isActive));
    // TODO: hook into actual recording flow when available
    console.log(isActive ? 'Start recording (UI only)' : 'Stop recording (UI only)');
  });
}

// Cookie utility functions for voice recording
function getCookieValue(key) {
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

// Removed legacy loadCustomRecordingDetails.

// (Real microphone capture can be wired later using MediaRecorder)
