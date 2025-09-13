export function renderVoiceCloneScreen() {
  return `
    <div class="voice-clone-container">
      <div class="voice-clone-header">
        <button class="back-button" id="back-to-settings">
          <span class="back-arrow">←</span>
        </button>
        <h1>Voice Clone</h1>
        <div class="spacer"></div>
      </div>
      
      <div class="voice-clone-content">
        <!-- Instructions Section -->
        <div class="voice-clone-section">
          <div class="voice-clone-group">
            <div class="instruction-card">
              <div class="instruction-content">
                <h3 class="instruction-title">Create Your Voice Clone</h3>
                <p class="instruction-description">Record 30-60 seconds of clear speech to create your personal AI voice.</p>
              </div>
              <div class="instruction-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Recording Section -->
        <div class="voice-clone-section">
          <div class="voice-clone-group">
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
                  <span class="status-text">Tap to start recording</span>
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

        <!-- Playback Section -->
        <div class="voice-clone-section" id="playback-section" style="display: none;">
          <div class="voice-clone-group">
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
        <div class="voice-clone-section" id="processing-section" style="display: none;">
          <div class="voice-clone-group">
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

  // Check microphone permission status on load
  checkMicrophonePermission();

  // Record button click handler
  if (recordButton) {
    recordButton.addEventListener('click', async () => {
      // Check if we're on a secure context (HTTPS or localhost or local network)
      const isLocalNetwork = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname);
      
      if (!isSecureContext && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1') && !isLocalNetwork) {
        showPermissionError('This feature requires a secure connection (HTTPS). Please access this site over HTTPS or use localhost.');
        return;
      }
      
      // Check if getUserMedia is supported (try both modern and legacy APIs)
      const hasModernAPI = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
      const hasLegacyAPI = navigator.getUserMedia || navigator.webkitGetUserMedia;
      
      if (!hasModernAPI && !hasLegacyAPI) {
        showPermissionError('Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, Safari, or Edge.');
        return;
      }
      
      // Show permission request dialog
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) {
        return;
      }
      
      await startRecording();
    });
  } else {
    console.error('Record button not found');
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
      let stream;
      
      // Try modern API first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } 
      // Fallback to legacy APIs for Safari
      else if (navigator.getUserMedia) {
        stream = await new Promise((resolve, reject) => {
          navigator.getUserMedia({ audio: true }, resolve, reject);
        });
      }
      else if (navigator.webkitGetUserMedia) {
        stream = await new Promise((resolve, reject) => {
          navigator.webkitGetUserMedia({ audio: true }, resolve, reject);
        });
      }
      else {
        throw new Error('No microphone API available');
      }
      
      recordedChunks = [];
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }
      
      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }
      
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        try {
          if (recordedChunks.length === 0) {
            throw new Error('No audio data was recorded');
          }
          
          const blob = new Blob(recordedChunks, { type: mimeType });
          
          if (blob.size === 0) {
            throw new Error('Recorded audio blob is empty');
          }
          
          const audioUrl = URL.createObjectURL(blob);
          
          if (!recordedAudio) {
            throw new Error('Audio element not found');
          }
          
          recordedAudio.src = audioUrl;
          
          // Add error handling for audio element
          recordedAudio.onerror = () => {
            console.error('Error loading audio');
            showPermissionError('Failed to load recorded audio. Please try recording again.');
          };
          
          recordedAudio.onloadeddata = () => {
            console.log('Audio loaded successfully');
          };
          
          // Show playback section
          if (playbackSection) {
            playbackSection.style.display = 'block';
          } else {
            console.warn('Playback section element not found');
          }
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          
        } catch (error) {
          console.error('Error processing recorded audio:', error);
          showPermissionError('Failed to process recorded audio: ' + error.message);
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        showPermissionError('Recording failed: ' + event.error.message);
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
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Unable to access microphone. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access when prompted by your browser, or check your browser settings to enable microphone permissions for this site.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Microphone is already in use by another application. Please close other apps using the microphone and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Microphone does not meet the required constraints. Please try a different microphone.';
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Microphone access blocked for security reasons. Please make sure you\'re using HTTPS or localhost.';
      } else if (error.message.includes('MediaRecorder')) {
        errorMessage = 'Audio recording is not supported in this browser. Please try using Chrome, Firefox, or a newer version of Safari.';
      } else if (error.message.includes('audio data') || error.message.includes('empty')) {
        errorMessage = 'Recording failed - no audio data was captured. Please check your microphone and try again.';
      } else {
        errorMessage += 'Please check your microphone permissions and try again. Error: ' + error.message;
      }
      
      showPermissionError(errorMessage);
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
    } else {
      // Handle case where recording wasn't properly started
      console.warn('Stop recording called but no active recording found');
      showPermissionError('Recording was not properly started. Please try again.');
      
      // Reset UI anyway
      microphoneContainer.classList.remove('recording');
      recordingTimer.style.display = 'none';
      recordingControls.style.display = 'none';
      recordButton.style.display = 'block';
      recordingStatus.style.display = 'block';
      recordingStatus.querySelector('.status-text').textContent = 'Ready to record';
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
      // Show success message
      if (recordingStatus) {
        recordingStatus.querySelector('.status-text').textContent = 'Voice clone generated successfully! You can now use your custom voice.';
        recordingStatus.style.color = '#2ed573';
        recordingStatus.style.display = 'block';
      }
      // Reset the screen after a delay
      setTimeout(() => {
        resetRecording();
      }, 2000);
    }, 3000);
  }

  async function checkMicrophonePermission() {
    try {
      // Check if permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        
        if (permissionStatus.state === 'denied') {
          showPermissionError('Microphone permission has been denied. Please reset permissions in your browser settings.');
        }
        
        // Listen for permission changes
        permissionStatus.addEventListener('change', () => {
          if (permissionStatus.state === 'denied') {
            showPermissionError('Microphone permission was denied. Please allow access in your browser settings.');
          }
        });
      }
    } catch (error) {
      // Permission API not fully supported, will handle during recording attempt
    }
  }

  async function requestMicrophonePermission() {
    // Show a custom permission dialog
    return new Promise((resolve) => {
      const permissionDialog = document.createElement('div');
      permissionDialog.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        ">
          <div style="
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 300px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          ">
            <h3 style="margin-top: 0; color: #333;">Microphone Access Required</h3>
            <p style="color: #666; margin-bottom: 20px;">
              To record your voice for cloning, we need access to your microphone. 
              Click "Allow" below, then grant permission in your browser's popup.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
              <button id="allow-mic" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
              ">Allow</button>
              <button id="deny-mic" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
              ">Cancel</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(permissionDialog);
      
      document.getElementById('allow-mic').addEventListener('click', () => {
        document.body.removeChild(permissionDialog);
        resolve(true);
      });
      
      document.getElementById('deny-mic').addEventListener('click', () => {
        document.body.removeChild(permissionDialog);
        resolve(false);
      });
    });
  }

  function showPermissionError(message) {
    // Update the status text to show the error
    if (recordingStatus) {
      recordingStatus.querySelector('.status-text').textContent = message;
      recordingStatus.style.color = '#ff4757';
    }
    
    // Also show alert for immediate feedback
    alert(message);
  }
}
