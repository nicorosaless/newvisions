import { navigateToScreen } from '../navigation.js';

export function renderResetPasswordScreen() {
  return `
    <div class="auth-container">
      <div class="auth-card" id="auth-card">
        <div class="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your email, activation code, and new password</p>
        </div>

        <form class="auth-form" id="reset-password-form">
          <div class="input-group">
            <input type="email" id="email" name="email" placeholder="Email Address" required>
            <label for="email">Email Address</label>
          </div>

          <div class="input-group">
            <input type="text" id="activation-code" name="activation_code" placeholder="Activation Code" required>
            <label for="activation-code">Activation Code</label>
          </div>

          <div class="input-group">
            <input type="password" id="new-password" name="new_password" placeholder="New Password" required>
            <label for="new-password">New Password</label>
          </div>

          <div class="input-group">
            <input type="password" id="confirm-password" name="confirm_password" placeholder="Confirm New Password" required>
            <label for="confirm-password">Confirm New Password</label>
          </div>

          <button type="submit" class="auth-button primary">Reset Password</button>
        </form>

        <div class="auth-footer">
          <p>Remember your password?
            <button type="button" class="link-button" id="back-to-login">Sign In</button>
          </p>
          <p>Don't have an account?
            <button type="button" class="link-button" id="show-signup">Sign Up</button>
          </p>
        </div>
      </div>
    </div>`;
}

export function handleResetPassword(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const resetData = {
    email: formData.get('email'),
    activation_code: formData.get('activation_code'),
    new_password: formData.get('new_password'),
    confirm_password: formData.get('confirm_password')
  };
  
  // Validate passwords match
  if (resetData.new_password !== resetData.confirm_password) {
    alert('Passwords do not match. Please try again.');
    return;
  }
  
  // Validate password strength (basic validation)
  if (resetData.new_password.length < 6) {
    alert('Password must be at least 6 characters long.');
    return;
  }
  
  performPasswordReset(resetData);
}

async function performPasswordReset(resetData) {
  const submitBtn = document.querySelector('#reset-password-form button[type="submit"]');
  if (!submitBtn) return;
  
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Resetting Password...';
  submitBtn.disabled = true;
  
  try {
    // TODO: Replace with actual API call when backend is ready
    // await resetPassword(resetData);
    
    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    alert('Password reset successfully! You can now sign in with your new password.');
    navigateToScreen('login');
  } catch (err) {
    console.error(err);
    const msg = err?.details?.detail || err.message || 'Password reset failed. Please check your activation code and try again.';
    alert(msg);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

export function setupResetPasswordEventListeners() {
  // Handle form submission
  const resetForm = document.getElementById('reset-password-form');
  if (resetForm) {
    resetForm.addEventListener('submit', handleResetPassword);
  }
  
  // Handle back to login
  const backToLoginBtn = document.getElementById('back-to-login');
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', () => {
      navigateToScreen('login');
    });
  }
  
  // Handle show signup
  const showSignupBtn = document.getElementById('show-signup');
  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', () => {
      navigateToScreen('signup');
    });
  }
  
  // Real-time password confirmation validation
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  if (newPasswordInput && confirmPasswordInput) {
    const validatePasswords = () => {
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      if (confirmPassword && newPassword !== confirmPassword) {
        confirmPasswordInput.setCustomValidity('Passwords do not match');
      } else {
        confirmPasswordInput.setCustomValidity('');
      }
    };
    
    newPasswordInput.addEventListener('input', validatePasswords);
    confirmPasswordInput.addEventListener('input', validatePasswords);
  }
}
