export function renderSignupScreen() {
  return `
    <div class="auth-container">
      <div class="auth-card" id="auth-card">
        <div class="auth-header">
          <h1>Create Account</h1>
          <p>Join us today</p>
        </div>

        <form class="auth-form" id="signup-form">
          <div class="input-group">
            <input type="text" id="signup-username" name="username" placeholder="Username" required>
            <label for="signup-username">Username</label>
          </div>

          <div class="input-group">
            <input type="email" id="email" name="email" placeholder="Email" required>
            <label for="email">Email</label>
          </div>

          <div class="input-group">
            <input type="password" id="signup-password" name="password" placeholder="Password" required>
            <label for="signup-password">Password</label>
          </div>

          <div class="input-group">
            <input type="text" id="activation-code" name="activationCode" placeholder="Activation Code" required>
            <label for="activation-code">Activation Code</label>
          </div>

          <button type="submit" class="auth-button primary">Create Account</button>
        </form>

        <div class="auth-footer">
          <p>Already have an account?
            <button type="button" class="link-button" id="show-login">Sign In</button>
          </p>
        </div>
      </div>
    </div>`;
}

export function handleSignup(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const userData = {
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
    activationCode: formData.get('activationCode')
  };
  performSignup(userData);
}

function performSignup(userData) {
  const submitBtn = document.querySelector('#signup-form button[type="submit"]');
  if (!submitBtn) return;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Creating Account...';
  submitBtn.disabled = true;
  setTimeout(() => {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    alert('Signup functionality will be connected to backend later!');
  }, 1500);
}
