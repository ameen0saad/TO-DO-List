const APILogIn = 'http://127.0.0.1:3000/api/v1/users/login';
const APIBase = 'http://127.0.0.1:3000/api/v1/users';

const login = async (data) => {
  try {
    const response = await fetch(APILogIn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Signup failed: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Check if user is already logged in (useful for OAuth callback)
const checkAuthStatus = async () => {
  try {
    const response = await fetch(`${APIBase}/me`, {
      credentials: 'include',
    });

    if (response.ok) {
      const userData = await response.json();
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
};

// Handle OAuth callback (if redirected back from Google)
const handleOAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const error = urlParams.get('error');

  if (error) {
    loginToast.textContent = '❌ OAuth authentication failed';
    loginToast.style.backgroundColor = '#dc3545';
    loginToast.classList.add('show');

    setTimeout(() => {
      loginToast.classList.remove('show');
    }, 3000);
    return;
  }

  if (token) {
    // Store the token from OAuth
    localStorage.setItem('jwt', token);

    loginToast.textContent = '✅ Google login successful!';
    loginToast.classList.add('show');

    setTimeout(() => {
      loginToast.classList.remove('show');
      window.location.href = '/frontEnd/Dashboard/index.html';
    }, 1500);
  }
};

// Check for OAuth callback when page loads
document.addEventListener('DOMContentLoaded', function () {
  handleOAuthCallback();
});

const email = document.getElementById('email');
const password = document.getElementById('password');
const loginButton = document.getElementById('login');
const loginToast = document.getElementById('loginToast');

loginButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const data = {
    email: email.value,
    password: password.value,
  };
  if (!email.value.trim() || !password.value.trim()) {
    loginToast.textContent = '❌ Email and password is required';
    loginToast.style.backgroundColor = '#dc3545';
    loginToast.classList.add('show');
    setTimeout(() => loginToast.classList.remove('show'), 3000);
    return;
  }

  if (!/\S+@\S+\.\S+/.test(email.value)) {
    loginToast.textContent = '❌ Please enter a valid email';
    loginToast.style.backgroundColor = '#dc3545';
    loginToast.classList.add('show');
    setTimeout(() => loginToast.classList.remove('show'), 3000);
    return;
  }

  try {
    const result = await login(data);

    loginToast.textContent = '✅ Logged in successfully!';
    loginToast.classList.add('show');

    setTimeout(() => {
      loginToast.classList.remove('show');
    }, 5000);

    setTimeout(() => {
      window.location.href = '/frontEnd/Dashboard/index.html';
    }, 1500);
  } catch (error) {
    loginToast.textContent = '❌ ' + error.message;
    loginToast.style.backgroundColor = '#dc3545';
    loginToast.classList.add('show');

    setTimeout(() => {
      loginToast.classList.remove('show');
      loginToast.style.backgroundColor = '#28a745';
    }, 3000);
  }
});

const signWithGoogleButton = document.getElementById('SigninOauth');

signWithGoogleButton.addEventListener('click', () => {
  window.location.href = 'http://127.0.0.1:3000/api/v1/users/auth/google';
});
