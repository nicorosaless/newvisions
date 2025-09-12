export function renderVoiceCloneScreen() {
  return `
    <div class="voice-clone-container">
      <div class="voice-clone-header">
        <button class="back-button" id="back-to-settings">
          <span class="back-arrow">←</span>
        </button>
        <h1>Generate Voice Clone</h1>
        <div class="spacer"></div>
      </div>
      
      <div class="voice-clone-content">
        <div class="voice-clone-main">
          <div class="instruction-section">
            <h2 class="voice-clone-title">Record Your Voice</h2>
            <p class="voice-clone-subtitle">Speak clearly for 30-60 seconds to create your personal voice clone</p>
          </div>
          
          <div class="recording-section">
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
              <span class="status-text">Tap the microphone to start</span>
            </div>
            
            <div class="recording-timer" id="recording-timer" style="display: none;">
              <div class="timer-container">
                <div class="recording-indicator"></div>
                <span class="timer-text"><span id="timer-display">00:00</span></span>
              </div>
            </div>
            
            <div class="recording-controls" id="recording-controls" style="display: none;">
              <button class="control-button stop-button" id="stop-recording">
                <div class="button-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                  </svg>
                </div>
                <span>Stop Recording</span>
              </button>
            </div>
          </div>
          
          <div class="playback-section" id="playback-section" style="display: none;">
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
                <button class="action-button secondary-action" id="re-record">
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
                
                <button class="action-button primary-action" id="generate-voice-clone">
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
          
          <div class="processing-section" id="processing-section" style="display: none;">
            <div class="processing-card">
              <div class="processing-animation">
                <div class="processing-spinner">
                  <div class="spinner-ring"></div>
                  <div class="spinner-ring"></div>
                  <div class="spinner-ring"></div>
                </div>
              </div>
              <div class="processing-content">
                <h3 class="processing-title">Creating Your Voice Clone</h3>
                <p class="processing-description">This may take a few minutes while we analyze your voice patterns</p>
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

export function setupVoiceCloneEventListeners() {
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordingStartTime = null;
  let timerInterval = null;
  
  const recordButton = document.getElementById('record-button');
  const stopButton = document.getElementById('stop-recording');
  const reRecordButton = document.getElementById('re-record');
  const generateButton = document.getElementById('generate-voice-clone');
  const microphoneContainer = document.getElementById('microphone-container');
  const recordingTimer = document.getElementById('recording-timer');
  const recordingControls = document.getElementById('recording-controls');
  const recordingStatus = document.getElementById('recording-status');
  const playbackSection = document.getElementById('playback-section');
  const processingSection = document.getElementById('processing-section');
  const timerDisplay = document.getElementById('timer-display');
  const recordedAudio = document.getElementById('recorded-audio');

  // Record button click handler
  if (recordButton) {
    recordButton.addEventListener('click', startRecording);
  }

  // Stop recording button click handler
  if (stopButton) {
    stopButton.addEventListener('click', stopRecording);
  }

  // Re-record button click handler
  if (reRecordButton) {
    reRecordButton.addEventListener('click', resetRecording);
  }

  // Generate voice clone button click handler
  if (generateButton) {
    generateButton.addEventListener('click', generateVoiceClone);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        recordedAudio.src = audioUrl;
        
        // Show playback section
        playbackSection.style.display = 'block';
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      recordingStartTime = Date.now();
      
      // Update UI for recording state
      microphoneContainer.classList.add('recording');
      recordingStatus.style.display = 'none';
      recordingTimer.style.display = 'block';
      recordingControls.style.display = 'block';
      recordButton.style.display = 'none';
      
      // Start timer
      startTimer();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      
      // Update UI for stopped state
      microphoneContainer.classList.remove('recording');
      recordingTimer.style.display = 'none';
      recordingControls.style.display = 'none';
      recordButton.style.display = 'block';
      recordingStatus.style.display = 'block';
      recordingStatus.querySelector('.status-text').textContent = 'Recording completed';
      
      // Stop timer
      stopTimer();
    }
  }

  function resetRecording() {
    // Reset all UI elements
    playbackSection.style.display = 'none';
    processingSection.style.display = 'none';
    microphoneContainer.classList.remove('recording');
    recordingTimer.style.display = 'none';
    recordingControls.style.display = 'none';
    recordingStatus.style.display = 'block';
    recordingStatus.querySelector('.status-text').textContent = 'Tap the microphone to start';
    recordButton.style.display = 'block';
    
    // Clear recorded data
    recordedChunks = [];
    recordedAudio.src = '';
    
    // Reset timer
    stopTimer();
    timerDisplay.textContent = '00:00';
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      const elapsed = Date.now() - recordingStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      timerDisplay.textContent = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function generateVoiceClone() {
    // Hide playback section and show processing
    playbackSection.style.display = 'none';
    processingSection.style.display = 'block';
    
    // Add progress animation
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.animation = 'progressAnimation 3s ease-in-out';
    }
    
    // Simulate processing time
    setTimeout(() => {
      processingSection.style.display = 'none';
      alert('Voice clone generated successfully! You can now use your custom voice in the app.');
      // Reset the screen
      resetRecording();
    }, 3000);
  }
}
