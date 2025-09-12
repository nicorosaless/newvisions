import { navigateToScreen } from '../navigation.js';

export function renderLoginScreen() {
  return `
    <div class="auth-container">
      <div class="auth-card" id="auth-card">
        <div class="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        <form class="auth-form" id="login-form">
          <div class="input-group">
            <input type="text" id="username" name="username" placeholder="Username" required>
            <label for="username">Username</label>
          </div>

            <div class="input-group">
            <input type="password" id="password" name="password" placeholder="Password" required>
            <label for="password">Password</label>
          </div>

          <button type="submit" class="auth-button primary">Sign In</button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account?
            <button type="button" class="link-button" id="show-signup">Sign Up</button>
          </p>
          <div class="test-section">
            <button type="button" class="test-button" id="test-btn">Test</button>
          </div>
        </div>
      </div>
    </div>`;
}

export function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const credentials = {
    username: formData.get('username'),
    password: formData.get('password')
  };
  performLogin(credentials);
}

function performLogin(credentials) {
  const submitBtn = document.querySelector('#login-form button[type="submit"]');
  if (!submitBtn) return;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Signing In...';
  submitBtn.disabled = true;
  setTimeout(() => {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    navigateToScreen('home');
  }, 1500);
}
