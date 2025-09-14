export function renderPWAInstallScreen() {
  return `
    <div class="pwa-install-container">
      <div class="pwa-install-card">
        <div class="pwa-install-header">
          <img src="/icons/app-icon-512.png" alt="Visions App Icon" class="app-icon">
          <h1>Visions</h1>
          <p>Install this app on your device for the best experience</p>
        </div>

        <div class="pwa-install-content">
          <div class="install-instructions">
            <h2>How to Install</h2>

            <div class="platform-instructions" id="ios-instructions">
              <h3>iOS Safari</h3>
              <ol>
                <li>Tap the Share button <span class="share-icon">⬆️</span></li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>

            <div class="platform-instructions" id="android-instructions">
              <h3>Android Chrome</h3>
              <ol>
                <li>Tap the menu button <span class="menu-icon">⋮</span></li>
                <li>Tap "Add to Home screen" or "Install app"</li>
                <li>Tap "Add" or "Install" to confirm</li>
              </ol>
            </div>

            <div class="platform-instructions" id="desktop-instructions">
              <h3>Desktop Chrome/Edge</h3>
              <ol>
                <li>Click the install icon in the address bar <span class="install-icon">📱</span></li>
                <li>Or click the menu button and select "Install Visions"</li>
              </ol>
            </div>
          </div>

          <div class="install-benefits">
            <h2>Why Install?</h2>
            <ul>
              <li>✓ Full-screen experience</li>
              <li>✓ Offline functionality</li>
              <li>✓ Push notifications</li>
              <li>✓ Quick access from home screen</li>
              <li>✓ Better performance</li>
            </ul>
          </div>
        </div>

        <div class="pwa-install-footer">
          <button class="continue-browser-btn" id="continue-browser">Continue in Browser</button>
          <p class="install-note">You can install later from the menu</p>
        </div>
      </div>
    </div>`;
}
