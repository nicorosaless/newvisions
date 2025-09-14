export function renderPWAInstallScreen() {
  return `
    <div class="pwa-install-container">
      <div class="pwa-install-content">
        <div class="app-logo">
          <img src="/icons/app-icon-192.png" alt="Visions App" class="logo-image" />
        </div>
        
        <h1 class="app-title">Visions</h1>
        <p class="app-subtitle">Install this app on your home screen for the best experience</p>
        
        <div class="install-instructions">
          <div class="instruction-section">
            <h2>📱 On iPhone/iPad (Safari)</h2>
            <ol class="instruction-list">
              <li>Tap the <strong>Share</strong> button <span class="share-icon">⬆️</span> at the bottom of the screen</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> in the top right corner</li>
              <li>Find the Visions app on your home screen and tap to open</li>
            </ol>
          </div>
          
          <div class="instruction-section">
            <h2>🤖 On Android (Chrome)</h2>
            <ol class="instruction-list">
              <li>Tap the <strong>Menu</strong> button <span class="menu-icon">⋮</span> (three dots)</li>
              <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
              <li>Tap <strong>"Add"</strong> or <strong>"Install"</strong></li>
              <li>Find the Visions app on your home screen and tap to open</li>
            </ol>
          </div>
          
          <div class="instruction-section">
            <h2>💻 On Desktop (Chrome/Edge)</h2>
            <ol class="instruction-list">
              <li>Look for the <strong>Install</strong> icon <span class="install-icon">⬇️</span> in the address bar</li>
              <li>Click <strong>"Install"</strong></li>
              <li>Or go to Menu → <strong>"Install Visions..."</strong></li>
            </ol>
          </div>
        </div>
        
        <div class="why-install">
          <h3>✨ Why install?</h3>
          <ul class="benefits-list">
            <li>🚀 Faster loading and better performance</li>
            <li>📱 Native app-like experience</li>
            <li>🔔 Push notifications (coming soon)</li>
            <li>⚡ Works offline for some features</li>
            <li>🎯 Easy access from your home screen</li>
          </ul>
        </div>
        
        <div class="browser-warning">
          <p><strong>Note:</strong> This app is designed to work best when installed as a Progressive Web App (PWA). Some features may be limited when accessed directly through a browser.</p>
        </div>
        
        <div class="help-section">
          <p>Need help? The app will automatically work once installed on your home screen!</p>
        </div>
      </div>
    </div>
  `;
}
