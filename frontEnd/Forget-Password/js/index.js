const APIForgetPassword =
  'https://to-do-list-production-5d26.up.railway.app/api/v1/users/forgetPassword';
const APIVerifyOTP = 'https://to-do-list-production-5d26.up.railway.app/api/v1/users/verifyOTP';
const APIResetPassword =
  'https://to-do-list-production-5d26.up.railway.app/api/v1/users/resetPassword';

// ====== Toast Function ======
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

// Forget Password Function
const forgetPassword = async (email) => {
  try {
    const response = await fetch(APIForgetPassword, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Reset Password failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Forget password error:', error);
    throw error;
  }
};

// Verify OTP Function
const verifyOtp = async (otp) => {
  try {
    const response = await fetch(APIVerifyOTP, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otp }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed Verification');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
};

// Reset Password Function
const resetPassword = async (password, confirmPassword) => {
  try {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const response = await fetch(APIResetPassword, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password,
        confirmPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Password reset failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

// Event Listeners

// Continue Button (Forget Password)
const emailInput = document.getElementById('email');
const continueButton = document.getElementById('continue');

if (continueButton && emailInput) {
  continueButton.addEventListener('click', async () => {
    try {
      continueButton.disabled = true;
      continueButton.textContent = 'Sending...';

      const email = emailInput.value.trim();
      if (!email) {
        throw new Error('Please enter your email');
      }

      await forgetPassword(email);
      showToast('✅ OTP sent to your email!', 'success');
      setTimeout(() => {
        window.location.href = '/Forget-Password/otp.html';
      }, 1500);
    } catch (error) {
      console.error('Continue error:', error);
      showToast('❌ ' + (error.message || 'Failed to send OTP. Please try again.'), 'error');

      continueButton.disabled = false;
      continueButton.textContent = 'Continue';
    }
  });
}

// Verify Button (OTP Verification)
const otpInput = document.getElementById('otp');
const verifyButton = document.getElementById('verify');

if (verifyButton && otpInput) {
  verifyButton.addEventListener('click', async () => {
    try {
      verifyButton.disabled = true;
      verifyButton.textContent = 'Verifying...';

      const otp = otpInput.value.trim();
      if (!otp) {
        throw new Error('Please enter the OTP');
      }

      await verifyOtp(otp);
      showToast('✅ OTP verified successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/Forget-Password/resetPassword.html';
      }, 1500);
    } catch (error) {
      console.error('Verification error:', error);
      showToast('❌ ' + (error.message || 'OTP verification failed. Please try again.'), 'error');

      verifyButton.disabled = false;
      verifyButton.textContent = 'Verify';
    }
  });
}

// Reset Password Button
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const resetButton = document.getElementById('reset-password');

if (resetButton && passwordInput && confirmPasswordInput) {
  resetButton.addEventListener('click', async () => {
    try {
      resetButton.disabled = true;
      resetButton.textContent = 'Resetting...';

      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (!password || !confirmPassword) {
        throw new Error('Please fill in all password fields');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      await resetPassword(password, confirmPassword);
      showToast('✅ Password reset successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/Dashboard/index.html';
      }, 1500);
    } catch (error) {
      console.error('Reset password error:', error);
      showToast('❌ ' + (error.message || 'Password reset failed. Please try again.'), 'error');

      resetButton.disabled = false;
      resetButton.textContent = 'Reset Password';
    }
  });
}

// Optional: Enter key support
if (emailInput) {
  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && continueButton) continueButton.click();
  });
}

if (otpInput) {
  otpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && verifyButton) verifyButton.click();
  });
}

if (passwordInput) {
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && resetButton) resetButton.click();
  });
}
