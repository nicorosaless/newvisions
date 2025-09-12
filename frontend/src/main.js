import './style.css'

// State management
let currentScreen = 'login'; // 'login', 'signup', or 'home'

// Render the current screen
function renderScreen() {
  const app = document.querySelector('#app');
  
  if (currentScreen === 'login') {
    app.innerHTML = renderLoginScreen();
  } else if (currentScreen === 'signup') {
    app.innerHTML = renderSignupScreen();
  } else if (currentScreen === 'home') {
    app.innerHTML = renderHomeScreen();
  }
  
  // Add event listeners after rendering
  addEventListeners();
}

// Login screen HTML
function renderLoginScreen() {
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
    </div>
  `;
}

// Signup screen HTML
function renderSignupScreen() {
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
    </div>
  `;
}

// Home screen HTML
function renderHomeScreen() {
  return `
    <div class="home-container">
      <div class="home-header">
        <h1>Visions</h1>
        <p>Welcome back</p>
      </div>
      
      <div class="home-content">
        <button class="home-button primary large" id="perform-btn">
          <div class="button-content">
            <span class="button-title">Perform</span>
            <span class="button-subtitle">Start your session</span>
          </div>
          <div class="button-arrow">→</div>
        </button>
        
        <div class="home-secondary-buttons">
          <button class="home-button secondary" id="tutorial-btn">
            <div class="button-content">
              <span class="button-title">Tutorial</span>
            </div>
            <div class="button-arrow">→</div>
          </button>
          
          <button class="home-button secondary" id="settings-btn">
            <div class="button-content">
              <span class="button-title">Settings</span>
            </div>
            <div class="button-arrow">→</div>
          </button>
        </div>
      </div>
      
      <div class="home-footer">
        <button type="button" class="signout-button" id="logout-btn">Sign Out</button>
      </div>
    </div>
  `;
}

// Add event listeners
function addEventListeners() {
  // Screen switching
  const showSignupBtn = document.getElementById('show-signup');
  const showLoginBtn = document.getElementById('show-login');
  const logoutBtn = document.getElementById('logout-btn');
  const testBtn = document.getElementById('test-btn');
  
  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', () => switchScreen('signup'));
  }
  
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => switchScreen('login'));
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => switchScreen('login'));
  }
  
  if (testBtn) {
    testBtn.addEventListener('click', () => switchScreen('home'));
  }
  
  // Form submissions
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  // Home screen buttons
  const performBtn = document.getElementById('perform-btn');
  const tutorialBtn = document.getElementById('tutorial-btn');
  const settingsBtn = document.getElementById('settings-btn');
  
  if (performBtn) {
    performBtn.addEventListener('click', () => {
      alert('Perform functionality coming soon!');
    });
  }
  
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', () => {
      alert('Tutorial functionality coming soon!');
    });
  }
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      alert('Settings functionality coming soon!');
    });
  }
  
  // Input animations (only for auth screens)
  const inputs = document.querySelectorAll('.input-group input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
      if (!input.value) {
        input.parentElement.classList.remove('focused');
      }
    });
    
    // Check if input has value on load
    if (input.value) {
      input.parentElement.classList.add('focused');
    }
  });
}

// Switch between screens with animation
function switchScreen(screen) {
  const card = document.getElementById('auth-card');
  
  // Add exit animation
  card.style.opacity = '0';
  card.style.transform = 'translateY(-20px)';
  
  setTimeout(() => {
    currentScreen = screen;
    renderScreen();
    
    // Add enter animation
    const newCard = document.getElementById('auth-card');
    newCard.style.opacity = '0';
    newCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      newCard.style.opacity = '1';
      newCard.style.transform = 'translateY(0)';
    }, 50);
  }, 200);
}

// Handle login form submission
function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const username = formData.get('username');
  const password = formData.get('password');
  
  console.log('Login attempt:', { username, password });
  
  // Add loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Signing In...';
  submitBtn.disabled = true;
  
  // Simulate API call and successful login
  setTimeout(() => {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    
    // Simulate successful login - go to home screen
    switchScreen('home');
  }, 1500);
}

// Handle signup form submission
function handleSignup(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
    activationCode: formData.get('activationCode')
  };
  
  console.log('Signup attempt:', data);
  
  // Add loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Creating Account...';
  submitBtn.disabled = true;
  
  // Simulate API call
  setTimeout(() => {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    alert('Signup functionality will be connected to backend later!');
  }, 1500);
}

// Initialize the app
renderScreen();
