const APIsignUp = 'https://to-do-list-production-5d26.up.railway.app/api/v1/users/signup';
const signUp = async (data) => {
  try {
    const response = await fetch(APIsignUp, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Signup failed: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

const loginToast = document.getElementById('loginToast');
const showToast = (message, type = 'success') => {
  if (!loginToast) return;

  loginToast.textContent = message;
  loginToast.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
  loginToast.classList.add('show');

  setTimeout(() => {
    loginToast.classList.remove('show');
  }, 3000);
};

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password-confirm');
const signupButton = document.getElementById('signup');

const modal = document.getElementById('verificationModal');
const verificationMessage = document.getElementById('verificationMessage');
const closeModalBtn = document.getElementById('closeModal');

function showVerificationModal(email) {
  verificationMessage.innerHTML = `
    Your account has been created successfully!<br>
    Please check your email <strong>${email}</strong> to verify your account before logging in.
  `;
  modal.style.display = 'flex';
}

closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
  window.location.href = '/frontEnd/Login_v1/index.html';
});

// ===== Signup Event =====
signupButton.addEventListener('click', async (e) => {
  e.preventDefault();

  const data = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value,
    confirmPassword: passwordConfirmInput.value,
  };

  // Basic Validation
  if (!data.name || !data.email || !data.password || !data.confirmPassword) {
    showToast('❌ Please fill in all fields', 'error');
    return;
  }

  if (data.password !== data.confirmPassword) {
    showToast('❌ Passwords do not match', 'error');
    return;
  }

  try {
    const result = await signUp(data);
    showToast('✅ Account created successfully!', 'success');

    // Show verification modal after short delay
    setTimeout(() => {
      showVerificationModal(data.email);
    }, 500);
  } catch (error) {
    console.error('Signup error:', error);
    showToast('❌ ' + (error.message || 'Signup failed. Please try again.'), 'error');
  }
});

const signinButton = document.getElementById('sign-in');
signinButton.addEventListener('click', (e) => {
  window.location.href = '/frontEnd/Login_v1/index.html';
});
