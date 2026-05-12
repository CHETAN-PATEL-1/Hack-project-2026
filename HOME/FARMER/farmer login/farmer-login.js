/* ****************************farmer-login.js*********************** */

/*
  Client-side login/signup for Phase 1 (no backend).
  - Uses localStorage to store users (for demo only)
  - Keeps functions modular so backend integration is easy later
  - Redirects to a simple farmer dashboard on successful login
*/

// -------------------- Helpers --------------------
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('users') || '[]');
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function findUserByEmail(email, role) {
  const users = getUsers();
  return users.find(u => u.email === email && u.role === role);
}

function validateEmail(email) {
  // simple email regex
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
}

function validateIndianMobile(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(digits);
}

function digitsOnlyPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

// -------------------- OTP --------------------
function generateOTP() {
  const phoneEl = document.getElementById('phone');
  const emailEl = document.getElementById('signupEmail');
  const phone = phoneEl ? phoneEl.value.trim() : '';
  const email = emailEl ? emailEl.value.trim() : '';

  if (!validateIndianMobile(phone)) {
    return alert('पहले 10 अंकों का वैध मोबाइल नंबर दर्ज करें (6–9 से शुरू)।');
  }
  if (!email || !validateEmail(email)) {
    return alert('पहले ईमेल भरें और Verify करें।');
  }
  if (findUserByEmail(email, 'farmer')) return alert('Email already registered');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
  localStorage.setItem('generatedOTP', otp);
  localStorage.setItem('generatedOTPExpiry', String(expiry));
  alert('Your OTP is: ' + otp + '\n(Valid for 5 minutes)');
}

function isOTPValid(inputOtp) {
  const stored = localStorage.getItem('generatedOTP');
  const expiry = parseInt(localStorage.getItem('generatedOTPExpiry') || '0', 10);
  if (!stored || Date.now() > expiry) return false;
  return stored === inputOtp;
}

// -------------------- Email verify (UI helper) --------------------
function verifyEmail() {
  const email = document.getElementById('signupEmail').value.trim();
  if (!email) return alert('Please enter email first');
  if (!validateEmail(email)) return alert('Please enter a valid email');
  if (findUserByEmail(email, 'farmer')) return alert('Email already registered');
  alert('Email looks good — you can request OTP now');
}

// -------------------- Signup --------------------
async function signupFarmer() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const otp = document.getElementById('otp').value.trim();
  const password = document.getElementById('signupPassword').value;
  const rePass = document.getElementById('reEnterPassword').value;

  if (!name || !email || !phone || !otp || !password || !rePass) {
    return alert('Please fill all fields');
  }

  if (!validateEmail(email)) return alert('Invalid email');
  if (!validateIndianMobile(phone)) return alert('मोबाइल 10 अंक का होना चाहिए (6–9 से शुरू)।');
  if (!isOTPValid(otp)) return alert('Invalid or expired OTP — Get OTP again after correct phone & email.');
  if (password !== rePass) return alert('Passwords do not match');
  if (findUserByEmail(email, 'farmer')) return alert('Email already registered (local)');

  const payload = { name, email, phone: digitsOnlyPhone(phone), password, role: 'farmer' };
  const API_BASE = (window.F2C_API_ORIGIN || 'http://localhost:5000') + '/api';

  try {
    const res = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (res.ok) {
    // Server sets auth cookies (httpOnly). Do not store tokens in localStorage.
    const data = await res.json().catch(() => ({}));
      // Clear OTP after use
      localStorage.removeItem('generatedOTP');
      localStorage.removeItem('generatedOTPExpiry');
      alert('Signup successful. Please login.');
      hideSignup();
      return;
    }

    const err = await res.json().catch(() => ({}));
    // If server responded but with error, show it
    alert('Server error: ' + (err.message || res.statusText || 'Registration failed'));
  } catch (e) {
    // Network error - fallback to localStorage-based signup (offline/demo mode)
    const users = getUsers();
    const user = {
      id: 'u' + Date.now(),
      name,
      email,
      phone: digitsOnlyPhone(phone),
      password, // plain text for demo; replace with hashing on backend
      role: 'farmer',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    localStorage.removeItem('generatedOTP');
    localStorage.removeItem('generatedOTPExpiry');
    alert('Offline: Signup saved locally. Please login.');
    hideSignup();
  }
}

// -------------------- Login --------------------
async function loginFarmer() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) return alert('Please enter email and password');

  const API_BASE = (window.F2C_API_ORIGIN || 'http://localhost:5000') + '/api';
  try {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const data = await res.json();
      const user = data.user;
      var uid = user && (user.id != null ? user.id : user._id);
      if (uid == null) {
        alert('Login error: server did not return user id.');
        return;
      }
      localStorage.setItem('currentUser', JSON.stringify({
        id: String(uid),
        name: user.name,
        email: user.email,
        role: user.role
      }));
      // auth cookies are set by server (httpOnly); avoid storing tokens in localStorage
      // role-based redirect
      var r = (user.role && String(user.role).toLowerCase()) || '';
      if (r === 'farmer') {
        window.location.href = 'farmer-dashboard.html';
      } else {
        window.location.href = '../CUSTOMER/customer-dashboard.html';
      }
      return;
    }

    const err = await res.json().catch(() => ({}));
    alert('Login failed: ' + (err.message || res.statusText));
  } catch (e) {
    // Network error - fallback to localStorage-based login
    const user = findUserByEmail(email, 'farmer');
    if (!user) return alert('No farmer account found (offline)');
    if (user.password !== password) return alert('Incorrect password (offline)');
    localStorage.setItem('currentUser', JSON.stringify({ id: user.id, role: user.role, name: user.name, email: user.email }));
    window.location.href = 'farmer-dashboard.html';
  }
}

// -------------------- Animated Switch --------------------
function showSignup() {
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('signupBox').classList.remove('hidden');
}

function hideSignup() {
  document.getElementById('signupBox').classList.add('hidden');
  document.getElementById('loginBox').classList.remove('hidden');
}

/* Language Toggle */
function setLanguage(lang) {
  if (lang === 'hi') {
    document.getElementById('loginTitle').innerText = 'किसान लॉगिन';
    document.getElementById('signupTitle').innerText = 'किसान साइनअप';
    document.getElementById('email').placeholder = 'ईमेल';
    document.getElementById('password').placeholder = 'पासवर्ड';
    document.getElementById('name').placeholder = 'पूरा नाम';
    document.getElementById('signupEmail').placeholder = 'ईमेल';
    document.getElementById('phone').placeholder = 'मोबाइल नंबर';
    document.getElementById('otp').placeholder = 'OTP डालें';
    document.getElementById('signupPassword').placeholder = 'पासवर्ड बनाएं';
    document.getElementById('reEnterPassword').placeholder = 'पासवर्ड की पुष्टि करें';
    document.getElementById('loginBtn').innerText = 'लॉगिन';
    document.getElementById('signupBtn').innerText = 'साइनअप';
    document.getElementById('newFarmerText').innerHTML = 'नए किसान? <a href="#" onclick="showSignup()">अकाउंट बनाएं</a>';
    document.getElementById('alreadyAccountText').innerHTML = 'पहले से अकाउंट है? <a href="#" onclick="hideSignup()">लॉगिन</a>';
  } else {
    location.reload();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  var ph = document.getElementById('phone');
  if (ph) {
    ph.addEventListener('input', function () {
      localStorage.removeItem('generatedOTP');
      localStorage.removeItem('generatedOTPExpiry');
    });
  }
});