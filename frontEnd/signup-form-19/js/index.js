const APIsignUp = 'http://127.0.0.1:3000/api/v1/users/signup';

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
    console.error('Login error:', error);
    throw error;
  }
};
const alertBox = document.getElementById('alertBox');
const name = document.getElementById('name');
const email = document.getElementById('email');
const password = document.getElementById('password');
const passwordConfirm = document.getElementById('password-confirm');
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

signupButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const data = {
    name: name.value,
    email: email.value,
    password: password.value,
    confirmPassword: passwordConfirm.value,
  };

  if (data.password !== data.confirmPassword) {
    alert('Passwords do not match!');
    return;
  }
  try {
    const result = await signUp(data);

    showVerificationModal(data.email);
  } catch (error) {
    alert(error.message);
  }
});

const signinButton = document.getElementById('sign-in');

signinButton.addEventListener('click', (e) => {
  window.location.href = '/frontEnd/Login_v1/index.html';
});
