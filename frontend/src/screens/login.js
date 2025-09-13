import { navigateToScreen } from '../navigation.js';
import { loginUser } from '../api.ts';
import { setUserCredits } from '../state.js';

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
          <p>
            <button type="button" class="link-button forgot-password" id="forgot-password">Forgot Password?</button>
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

async function performLogin(credentials) {
  const submitBtn = document.querySelector('#login-form button[type="submit"]');
  if (!submitBtn) return;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Signing In...';
  submitBtn.disabled = true;
  try {
    const resp = await loginUser(credentials);
    if (resp?.user_id) {
      try { localStorage.setItem('user_id', resp.user_id); } catch(_) {}
      // minimal cookie (1 year)
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = `user_id=${encodeURIComponent(resp.user_id)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      // Prefetch meta (credits)
      try {
        const { getUserMeta } = await import('../api.ts');
        const meta = await getUserMeta(resp.user_id);
        if (meta) setUserCredits(meta.charCount, meta.monthlyLimit);
      } catch (e) {
        console.warn('Failed to prefetch user meta', e);
      }
    }
    navigateToScreen('home');
  } catch (err) {
    console.error(err);
    const msg = err?.details?.detail || err.message || 'Login failed';
    alert(msg);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
