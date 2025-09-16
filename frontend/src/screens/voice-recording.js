export function renderVoiceRecordingScreen(routineType, routineValue) {
  // Preload title/subtitle from cookies to avoid on-screen flicker
  const nameCookie = getCookieValue('voice-note-name');
  const dateISO = getCookieValue('voice-note-date');
  const defaultToggle = getCookieValue('voice-note-name-default') === 'true';
  const dateObj = parseDate(dateISO) || new Date();
  const defaultTitle = buildDefaultTitle(dateObj);
  const effectiveName = sanitizeCustomName(defaultToggle ? null : nameCookie);
  const initialTitle = defaultToggle ? defaultTitle : (effectiveName || defaultTitle);
  const initialSubtitle = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return `
  <div class="voice-recorder-app voice-recording-container">
    <header class="voice-header ios-header">
      <div class="header-center">
        <h1 class="voice-title large">All Recordings</h1>
      </div>
      <div class="header-right">
        <button class="edit-button" id="edit-recordings">Edit</button>
      </div>
    </header>

    <main class="voice-content">
      <section class="voice-panel listen-panel active" id="listen-panel">
        <div class="search-container">
          <div class="search-bar">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input type="text" placeholder="Search your recordings" class="search-input">
            <button class="search-menu-btn" type="button" aria-label="Search options">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>
          </div>
        </div>

        <div class="recordings-container">
          <div class="recordings-section">
            <!-- First (dynamic) recording card -->
            <div class="recording-card" data-recording-id="1">
              <div class="recording-main">
                <div class="recording-header">
                  <div class="recording-info">
                    <h4 class="recording-title">${initialTitle}</h4>
                    <div class="recording-subtitle">${initialSubtitle}</div>
                  </div>
                  <div class="recording-duration">--:--</div>
                </div>
                <div class="playback-controls hidden">
                  <button class="control-button skip-backward" type="button" aria-label="Skip backward 10s">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                  </button>
                  <button class="control-button play-pause-btn" type="button" aria-label="Play or pause">
                    <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"></polygon></svg>
                    <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  </button>
                  <button class="control-button skip-forward" type="button" aria-label="Skip forward 10s">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                  </button>
                  <div class="progress-container">
                    <div class="progress-bar">
                      <div class="progress-fill"></div>
                    </div>
                  </div>
                  <div class="playback-time">
                    <span class="current-time">0:00</span>
                    <span class="total-time">--:--</span>
                  </div>
                </div>
                <audio class="generated-audio" preload="metadata" style="display:none"></audio>
              </div>
            </div>

            <!-- Static demo cards (2–8) -->
            ${[ 
              { id:2, t:'Recording on 14 Apr 2024', d:'14 Apr 2024', len:'5:42' },
              { id:3, t:'Recording on 4 Oct 2023', d:'4 Oct 2023', len:'1:28' },
              { id:4, t:'Recording on 15 Mar 2023', d:'15 Mar 2023', len:'3:12' },
              { id:5, t:'Recording on 22 Jan 2023', d:'22 Jan 2023', len:'0:45' },
              { id:6, t:'Recording on 8 Dec 2022', d:'8 Dec 2022', len:'5:33' },
              { id:7, t:'Recording on 19 Sep 2022', d:'19 Sep 2022', len:'2:18' },
              { id:8, t:'Recording on 3 Jul 2022', d:'3 Jul 2022', len:'4:07' }
            ].map(x => `
              <div class="recording-card" data-recording-id="${x.id}">
                <div class="recording-main">
                  <div class="recording-header">
                    <div class="recording-info">
                      <h4 class="recording-title">${x.t}</h4>
                      <div class="recording-subtitle">${x.d}</div>
                    </div>
                    <div class="recording-duration">${x.len}</div>
                  </div>
                  <div class="playback-controls hidden">
                    <button class="control-button play-pause-btn" type="button" aria-label="Play or pause">
                      <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"></polygon></svg>
                      <svg class="pause-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    </button>
                    <div class="progress-container">
                      <div class="progress-bar">
                        <div class="progress-fill"></div>
                      </div>
                    </div>
                    <div class="playback-time">
                      <span class="current-time">0:00</span>
                      <span class="total-time">${x.len}</span>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </main>

    <footer class="recording-footer" aria-label="Record Controls">
      <div class="recording-footer-inner">
        <button id="footer-record-btn" class="footer-record-btn" aria-pressed="false" type="button" style="border-radius:50%">
          <span class="footer-record-ring"></span>
          <span class="footer-record-dot"></span>
        </button>
      </div>
    </footer>

    <div id="current-routine-info" style="display:none" data-type="${routineType}" data-value="${routineValue}"></div>
  </div>`;
}

export function setupVoiceRecordingEventListeners() {
  // 1) Personalize first card title/subtitle from settings or cookies
  initFirstCardFromSettings();

  // 2) Perform pipeline once and attach audio to first card; update only duration
  initAutoPerform();

  // 3) Wire delegated interactions once
  wireDelegatedInteractions();

  // 4) Search filter
  const searchInput = document.querySelector('.search-input');
  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.recording-card').forEach(card => {
      const title = card.querySelector('.recording-title')?.textContent.toLowerCase() || '';
      const subtitle = card.querySelector('.recording-subtitle')?.textContent.toLowerCase() || '';
      card.style.display = (title.includes(q) || subtitle.includes(q)) ? 'block' : 'none';
    });
  });

  // Footer button (visual only)
  const footerBtn = document.getElementById('footer-record-btn');
  footerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = footerBtn.classList.toggle('active');
    footerBtn.setAttribute('aria-pressed', String(isActive));
  });

  // Helper implementations
  async function initFirstCardFromSettings() {
    try {
      const firstCard = document.querySelector('.recording-card[data-recording-id="1"]');
      if (!firstCard) return;
      const titleEl = firstCard.querySelector('.recording-title');
      const subtitleEl = firstCard.querySelector('.recording-subtitle');
      const userId = (document.cookie.match(/user_id=([^;]+)/) || [])[1] || localStorage.getItem('user_id');

      let settings = null;
      try {
        if (userId) {
          const { getUserSettings } = await import('../api.ts');
          settings = await getUserSettings(userId);
        }
      } catch { /* ignore */ }

      const customName = settings?.voice_note_name ?? getCookieValue('voice-note-name');
      const customDateISO = settings?.voice_note_date ?? getCookieValue('voice-note-date');
      const defaultToggle = settings?.voice_note_name_default ?? (getCookieValue('voice-note-name-default') === 'true');

      const dateForTitle = parseDate(customDateISO) || new Date();
      const defaultTitle = buildDefaultTitle(dateForTitle);
      const effectiveName = sanitizeCustomName(defaultToggle ? null : customName);
      const finalTitle = defaultToggle ? defaultTitle : (effectiveName || defaultTitle);

      const subtitleDate = (parseDate(customDateISO) || new Date()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      if (titleEl) titleEl.textContent = finalTitle;
      if (subtitleEl) subtitleEl.textContent = subtitleDate;
    } catch {}
  }

  async function initAutoPerform() {
    const routineInfo = document.getElementById('current-routine-info');
    const container = document.querySelector('.recordings-container');
    const firstCard = document.querySelector('.recording-card[data-recording-id="1"]');
    if (!routineInfo || !container || !firstCard) return;
    if (routineInfo.dataset.performInit === '1' || container.dataset.performInflight === '1') return;

    const userId = (document.cookie.match(/user_id=([^;]+)/) || [])[1] || localStorage.getItem('user_id');
    if (!userId) return;

    const routine_type = routineInfo.getAttribute('data-type');
    const routine_value = routineInfo.getAttribute('data-value');
    if (!routine_type || !routine_value) return;

    routineInfo.dataset.performInit = '1';
    container.dataset.performInflight = '1';

    try {
      // Ensure interactions are wired for first card
      wireAudioEvents(firstCard);

      const { preperformPrepare, materializeUserVoice, performRoutine, getUserSettings } = await import('../api.ts');
      try { await preperformPrepare(userId, false); } catch {}
      try { await materializeUserVoice(userId, true); } catch {}

      // Refresh title/subtitle from settings just before perform
      try { await initFirstCardFromSettings(); } catch {}

      const resp = await performRoutine({ user_id: userId, routine_type, value: routine_value });
      const audioEl = firstCard.querySelector('audio.generated-audio');
      if (audioEl && resp?.audio_base64) {
        audioEl.src = `data:audio/mpeg;base64,${resp.audio_base64}`;
        audioEl.load();
        const onReady = () => {
          const dur = isFinite(audioEl.duration) ? formatSeconds(audioEl.duration) : '--:--';
          const durEl = firstCard.querySelector('.recording-duration');
          const totalEl = firstCard.querySelector('.total-time');
          if (durEl) durEl.textContent = dur;
          if (totalEl) totalEl.textContent = dur;
        };
        audioEl.addEventListener('loadedmetadata', onReady, { once: true });
        audioEl.addEventListener('canplaythrough', onReady, { once: true });
      }
    } catch (err) {
      console.warn('perform failed', err);
    } finally {
      container.dataset.performInflight = '0';
    }
  }

  function wireDelegatedInteractions() {
    const container = document.querySelector('.recordings-container');
    if (!container) return;
    if (container.dataset.delegatedListeners === '1') return;
    container.dataset.delegatedListeners = '1';

    // Expand/collapse on card click (ignore clicks on controls area)
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.recording-card');
      if (!card) return;
      if (e.target.closest('.playback-controls')) return;

      document.querySelectorAll('.recording-card.expanded').forEach(other => {
        if (other !== card) {
          other.classList.remove('expanded');
          other.querySelector('.playback-controls')?.classList.add('hidden');
        }
      });

      const controls = card.querySelector('.playback-controls');
      if (!controls) return;
      const expanded = card.classList.toggle('expanded');
      controls.classList.toggle('hidden', !expanded);
    });

    // Play/pause (only functional for first card which has audio element)
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.play-pause-btn');
      if (!btn) return;
      const card = btn.closest('.recording-card');
      if (!card) return;
      e.stopPropagation();

      const audio = card.querySelector('audio.generated-audio');
      const playIcon = btn.querySelector('.play-icon');
      const pauseIcon = btn.querySelector('.pause-icon');
      if (!audio) return; // static cards don't have audio, UI only

      const p = audio.paused ? audio.play() : audio.pause();
      if (p && typeof p.then === 'function') {
        p.then(() => updatePlayIcons()).catch(() => updatePlayIcons());
      } else {
        updatePlayIcons();
      }

      function updatePlayIcons() {
        if (audio.paused) {
          playIcon?.classList.remove('hidden');
          pauseIcon?.classList.add('hidden');
        } else {
          playIcon?.classList.add('hidden');
          pauseIcon?.classList.remove('hidden');
        }
      }
    });

    // Pre-wire first card audio events once
    const first = document.querySelector('.recording-card[data-recording-id="1"]');
    if (first) wireAudioEvents(first);
  }

  function wireAudioEvents(card) {
    const audio = card.querySelector('audio.generated-audio');
    if (!audio || audio.dataset.wired === '1') return;
    audio.dataset.wired = '1';
    const progress = card.querySelector('.progress-fill');
    const cur = card.querySelector('.current-time');
    const playIcon = card.querySelector('.play-icon');
    const pauseIcon = card.querySelector('.pause-icon');

    audio.addEventListener('timeupdate', () => {
      if (audio.duration && progress && cur) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progress.style.width = pct + '%';
        cur.textContent = formatSeconds(audio.currentTime);
      }
    });
    audio.addEventListener('ended', () => {
      progress && (progress.style.width = '0%');
      cur && (cur.textContent = '0:00');
      playIcon?.classList.remove('hidden');
      pauseIcon?.classList.add('hidden');
    });
  }
}

// Utilities
function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function formatSeconds(sec) {
  if (!isFinite(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function sanitizeCustomName(name) {
  if (name == null) return '';
  const s = String(name).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
}

function buildDefaultTitle(dateObj) {
  let formatted;
  try {
    formatted = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);
  } catch {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    formatted = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  }
  return `Recording on ${formatted}`;
}

function getCookieValue(key) {
  const name = key + '=';
  const decoded = decodeURIComponent(document.cookie || '');
  for (let c of decoded.split(';')) {
    c = c.trim();
    if (c.indexOf(name) === 0) return c.substring(name.length);
  }
  return null;
}
