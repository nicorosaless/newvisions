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

export function setupVoiceCloneEventListeners() {
  console.log('Setting up voice clone event listeners');
  
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordingStartTime = null;
  let timerInterval = null;
  let stream = null;
  
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

  console.log('DOM elements found:', {
    recordButton: !!recordButton,
    stopButton: !!stopButton,
    reRecordButton: !!reRecordButton,
    generateButton: !!generateButton,
    microphoneContainer: !!microphoneContainer,
    recordingTimer: !!recordingTimer,
    recordingControls: !!recordingControls,
    recordingStatus: !!recordingStatus,
    playbackSection: !!playbackSection,
    processingSection: !!processingSection,
    timerDisplay: !!timerDisplay,
    recordedAudio: !!recordedAudio
  });

  // Check microphone permission status on load
  checkMicrophonePermission();

  // Record button click handler
  if (recordButton) {
    recordButton.addEventListener('click', async () => {
      console.log('Record button clicked');
      
      // Check if we're on a secure context (HTTPS or localhost or local network)
      const isLocalNetwork = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname);
      console.log('Secure context:', isSecureContext);
      console.log('Hostname:', window.location.hostname);
      console.log('Is local network:', isLocalNetwork);
      
      if (!isSecureContext && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1') && !isLocalNetwork) {
        showPermissionError('This feature requires a secure connection (HTTPS). Please access this site over HTTPS or use localhost.');
        return;
      }
      
      // Check if getUserMedia is supported (try both modern and legacy APIs)
      const hasModernAPI = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
      const hasLegacyAPI = navigator.getUserMedia || navigator.webkitGetUserMedia;
      console.log('Modern API available:', hasModernAPI);
      console.log('Legacy API available:', hasLegacyAPI);
      
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
      console.log('Starting recording...');
      
      // Clean up any existing recording state
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        console.log('Cleaning up existing MediaRecorder');
        mediaRecorder.stop();
      }
      if (stream) {
        console.log('Cleaning up existing stream');
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      
      // Try modern API first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('Using modern getUserMedia API');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } 
      // Fallback to legacy APIs for Safari
      else if (navigator.getUserMedia) {
        console.log('Using legacy getUserMedia API');
        stream = await new Promise((resolve, reject) => {
          navigator.getUserMedia({ audio: true }, resolve, reject);
        });
      }
      else if (navigator.webkitGetUserMedia) {
        console.log('Using webkit getUserMedia API');
        stream = await new Promise((resolve, reject) => {
          navigator.webkitGetUserMedia({ audio: true }, resolve, reject);
        });
      }
      else {
        throw new Error('No microphone API available');
      }
      
      console.log('Microphone stream obtained successfully');
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
      console.log('Using MIME type:', mimeType);
      
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      console.log('MediaRecorder created successfully');
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          console.log('Added chunk, total chunks:', recordedChunks.length, 'total size:', recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0));
        } else {
          console.warn('Received empty data chunk');
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('Recording stopped, processing', recordedChunks.length, 'chunks');
        
        // Give a small delay to ensure all data is collected
        setTimeout(() => {
          try {
            console.log('Final chunk count after delay:', recordedChunks.length);
            
            if (recordedChunks.length === 0) {
              console.error('No recorded chunks available after delay!');
              throw new Error('No audio data was recorded');
            }
            
            console.log('Processing', recordedChunks.length, 'chunks');
            
            const blob = new Blob(recordedChunks, { type: mimeType });
            console.log('Created blob:', blob.size, 'bytes, type:', blob.type);
            
            if (blob.size === 0) {
              console.error('Blob is empty! Recorded chunks:', recordedChunks.length);
              for (let i = 0; i < recordedChunks.length; i++) {
                console.error(`Chunk ${i}:`, recordedChunks[i].size, 'bytes');
              }
              throw new Error('Recorded audio blob is empty');
            }
          
          // Clear any existing blob URL before creating a new one
          if (recordedAudio && recordedAudio.src) {
            URL.revokeObjectURL(recordedAudio.src);
          }
          
          const audioUrl = URL.createObjectURL(blob);
          console.log('Created audio URL:', audioUrl);
          
          if (!recordedAudio) {
            throw new Error('Audio element not found');
          }
          
          // Clear any existing event handlers
          recordedAudio.onerror = null;
          recordedAudio.onloadeddata = null;
          recordedAudio.oncanplay = null;
          recordedAudio.oncanplaythrough = null;
          
          // Reset audio element properties
          recordedAudio.currentTime = 0;
          recordedAudio.volume = 1;
          
          // Set up event handlers
          recordedAudio.onloadeddata = () => {
            console.log('Audio loaded successfully, duration:', recordedAudio.duration, 'seconds');
            
            // Validate that we have a reasonable duration
            if (recordedAudio.duration < 0.1) {
              console.warn('Audio duration is very short:', recordedAudio.duration);
              showPermissionError('Recording appears to be too short. Please record for at least a few seconds.');
              return;
            }
            
            // Show playback section
            if (playbackSection) {
              playbackSection.style.display = 'block';
              console.log('Playback section shown');
            } else {
              console.warn('Playback section element not found');
            }
          };
          
          recordedAudio.onerror = (error) => {
            console.error('Error loading audio:', error);
            console.error('Audio error details:', recordedAudio.error);
            console.error('Audio src when error occurred:', recordedAudio.src);
            showPermissionError('Failed to load recorded audio. Please try recording again.');
            
            // Clean up the failed blob URL
            if (recordedAudio.src) {
              URL.revokeObjectURL(recordedAudio.src);
              recordedAudio.src = '';
            }
          };
          
          recordedAudio.oncanplay = () => {
            console.log('Audio can play');
          };
          
          // Set the audio source
          recordedAudio.src = audioUrl;
          console.log('Audio src set to:', audioUrl);
          
          // Stop all tracks
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
          }
          
          } catch (error) {
            console.error('Error processing recorded audio:', error);
            showPermissionError('Failed to process recorded audio: ' + error.message);
            
            // Clean up on error
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
              stream = null;
            }
          }
        }, 100); // Small delay to ensure all data is collected
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        showPermissionError('Recording failed: ' + (event.error?.message || 'Unknown error'));
        
        // Clean up on error
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
        mediaRecorder = null;
      };
      
      console.log('Starting MediaRecorder...');
      mediaRecorder.start(100); // Collect data every 100ms for better chunking
      recordingStartTime = Date.now();
      
      console.log('MediaRecorder started, state:', mediaRecorder.state);
      
      // Set a timeout to automatically stop recording after 2 minutes (120 seconds)
      // This prevents the recording from hanging indefinitely
      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          console.log('Auto-stopping recording after 2 minutes');
          stopRecording();
        }
      }, 120000);
      
      // Update UI for recording state
      if (microphoneContainer) microphoneContainer.classList.add('recording');
      if (recordingStatus) recordingStatus.style.display = 'none';
      if (recordingTimer) recordingTimer.style.display = 'block';
      if (recordingControls) recordingControls.style.display = 'block';
      if (recordButton) recordButton.style.display = 'none';
      
      // Start timer
      startTimer();
      console.log('Recording started successfully');
      
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
      } else if (error.message && error.message.includes('MediaRecorder')) {
        errorMessage = 'Audio recording is not supported in this browser. Please try using Chrome, Firefox, or a newer version of Safari.';
      } else if (error.message && (error.message.includes('audio data') || error.message.includes('empty'))) {
        errorMessage = 'Recording failed - no audio data was captured. Please check your microphone and try again.';
      } else if (error.message && error.message.includes('uninitialized')) {
        errorMessage = 'Recording system not properly initialized. Please refresh the page and try again.';
      } else {
        errorMessage += 'Please check your microphone permissions and try again. Error: ' + (error.message || 'Unknown error');
      }
      
      showPermissionError(errorMessage);
      
      // Clean up on error
      if (stream) {
        try {
          stream.getTracks().forEach(track => track.stop());
        } catch (cleanupError) {
          console.warn('Error cleaning up stream:', cleanupError);
        }
        stream = null;
      }
      mediaRecorder = null;
    }
  }

  function stopRecording() {
    console.log('Stop recording called, MediaRecorder state:', mediaRecorder?.state);
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('Stopping MediaRecorder');
      mediaRecorder.stop();
      
      // Update UI for stopped state
      microphoneContainer.classList.remove('recording');
      recordingTimer.style.display = 'none';
      recordingControls.style.display = 'none';
      recordButton.style.display = 'block';
      recordingStatus.style.display = 'block';
      recordingStatus.querySelector('.status-text').textContent = 'Processing recording...';
      
      // Stop timer
      stopTimer();
    } else {
      // Handle case where recording wasn't properly started
      console.warn('Stop recording called but no active recording found, state:', mediaRecorder?.state);
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
    console.log('Resetting recording state');
    
    // Stop any active recording
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch (error) {
        console.warn('Error stopping mediaRecorder:', error);
      }
    }
    
    // Stop any active stream
    if (stream) {
      console.log('Stopping active stream');
      stream.getTracks().forEach(track => {
        track.stop();
      });
      stream = null;
    }
    
    // Clear any existing blob URL to free memory
    if (recordedAudio) {
      console.log('Clearing audio element, current src:', recordedAudio.src);
      if (recordedAudio.src) {
        URL.revokeObjectURL(recordedAudio.src);
        recordedAudio.src = '';
      }
      
      // Clear any existing event handlers
      recordedAudio.onerror = null;
      recordedAudio.onloadeddata = null;
      recordedAudio.oncanplay = null;
      recordedAudio.oncanplaythrough = null;
    }
    
    // Reset all UI elements
    if (playbackSection) playbackSection.style.display = 'none';
    if (processingSection) processingSection.style.display = 'none';
    if (microphoneContainer) microphoneContainer.classList.remove('recording');
    if (recordingTimer) recordingTimer.style.display = 'none';
    if (recordingControls) recordingControls.style.display = 'none';
    if (recordingStatus) {
      recordingStatus.style.display = 'block';
      const statusText = recordingStatus.querySelector('.status-text');
      if (statusText) {
        statusText.textContent = 'Tap the microphone to start';
        statusText.style.color = ''; // Reset color
      }
    }
    if (recordButton) recordButton.style.display = 'block';
    
    // Clear recorded data
    recordedChunks = [];
    mediaRecorder = null;
    
    // Reset timer
    stopTimer();
    if (timerDisplay) timerDisplay.textContent = '00:00';
    
    console.log('Recording state reset complete');
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
    try {
      // First, try to get microphone access to trigger the browser's permission dialog
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Immediately stop the test stream
      testStream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied or failed:', error);
      
      // Show a simple error message
      showPermissionError('Microphone access is required for voice recording. Please allow microphone access when prompted by your browser.');
      return false;
    }
  }

  function showPermissionError(message) {
    console.error('Permission error:', message);
    
    // Update the status text to show the error
    if (recordingStatus) {
      const statusText = recordingStatus.querySelector('.status-text');
      if (statusText) {
        statusText.textContent = message;
        recordingStatus.style.color = '#ff4757';
      }
    }
    
    // Also show alert for immediate feedback
    alert(message);
  }
  
  console.log('Voice clone event listeners setup completed');
}
