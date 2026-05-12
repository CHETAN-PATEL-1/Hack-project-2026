/* ****************************customer-login.js*********************** */

/*
  Client-side customer login/signup (Phase 1 -> 3 compatible)
  - Uses localStorage for offline/demo mode
  - Integrates with backend `/api/auth` for register/login
  - Relies on httpOnly auth cookies set by the server; avoids storing tokens in localStorage
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
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
}

// -------------------- OTP --------------------
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
  localStorage.setItem('generatedOTP', otp);
  localStorage.setItem('generatedOTPExpiry', expiry);
  alert('Your OTP is: ' + otp + '\n(Valid for 5 minutes)');
}

function isOTPValid(inputOtp) {
  const stored = localStorage.getItem('generatedOTP');
  const expiry = parseInt(localStorage.getItem('generatedOTPExpiry') || '0', 10);
  if (!stored || Date.now() > expiry) return false;
  return stored === inputOtp;
}

// -------------------- Email verify --------------------
function verifyEmail() {
  const email = document.getElementById('signupEmail').value.trim();
  if (!email) return alert('Please enter email first');
  if (!validateEmail(email)) return alert('Please enter a valid email');
  if (findUserByEmail(email, 'customer')) return alert('Email already registered');
  alert('Email looks good — you can request OTP now');
}

// -------------------- Signup --------------------
async function signupCustomer() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const otp = document.getElementById('otp').value.trim();
  const password = document.getElementById('signupPassword').value;
  const rePass = document.getElementById('reEnterPassword').value;

  if (!name || !email || !phone || !otp || !password || !rePass) return alert('Please fill all required fields');
  if (!validateEmail(email)) return alert('Invalid email');
  if (phone.length < 8) return alert('Enter a valid mobile number');
  if (!isOTPValid(otp)) return alert('Invalid or expired OTP');
  if (password !== rePass) return alert('Passwords do not match');
  if (findUserByEmail(email, 'customer')) return alert('Email already registered (local)');

  const payload = { name, email, phone, password, role: 'customer' };
  if (address) payload.address = address;
  const API_BASE = (window.F2C_API_ORIGIN || 'http://localhost:5000') + '/api';

  try {
    const res = await fetch(API_BASE + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      // auth cookies are set by server (httpOnly); avoid storing tokens in localStorage
      localStorage.removeItem('generatedOTP');
      localStorage.removeItem('generatedOTPExpiry');
      alert('Signup successful. Please login.');
      hideSignup();
      return;
    }

    const err = await res.json().catch(() => ({}));
    alert('Server error: ' + (err.message || res.statusText || 'Registration failed'));
  } catch (e) {
    // fallback to local
    const users = getUsers();
    const user = { id: 'u' + Date.now(), name, email, phone, address, password, role: 'customer', createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    localStorage.removeItem('generatedOTP');
    localStorage.removeItem('generatedOTPExpiry');
    alert('Offline: Signup saved locally. Please login.');
    hideSignup();
  }
}

// -------------------- Login --------------------
async function loginCustomer() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) return alert('Please enter email and password');

  const API_BASE = (window.F2C_API_ORIGIN || 'http://localhost:5000') + '/api';
  try {
    const res = await fetch(API_BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) });
    // include credentials so refresh cookie is set
    // note: fetch above will be retried with cookie via fetchWithAuth for protected calls
    if (res.ok) {
      const data = await res.json();
      const user = data.user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      // auth cookies are set by server (httpOnly); avoid storing tokens in localStorage
      // role-based redirect
      if (user.role === 'customer') window.location.href = '../customer-dashboard.html';
      else window.location.href = '../../FARMER/farmer%20login/farmer-dashboard.html';
      return;
    }
    const err = await res.json().catch(() => ({}));
    alert('Login failed: ' + (err.message || res.statusText));
  } catch (e) {
    // fallback offline
    const user = findUserByEmail(email, 'customer');
    if (!user) return alert('No customer account found (offline)');
    if (user.password !== password) return alert('Incorrect password (offline)');
    localStorage.setItem('currentUser', JSON.stringify({ id: user.id, name: user.name, email: user.email, role: 'customer' }));
    window.location.href = '../customer-dashboard.html';
  }
}

// -------------------- Animated Switch --------------------
function showSignup() { document.getElementById('loginBox').classList.add('hidden'); document.getElementById('signupBox').classList.remove('hidden'); }
function hideSignup() { document.getElementById('signupBox').classList.add('hidden'); document.getElementById('loginBox').classList.remove('hidden'); }

/* Language Toggle */
function setLanguage(lang) {
  if (lang === 'hi') {
    document.getElementById('loginTitle').innerText = 'ग्राहक लॉगिन';
    document.getElementById('signupTitle').innerText = 'ग्राहक साइनअप';
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
    document.getElementById('newCustomerText').innerHTML = 'नए ग्राहक? <a href="#" onclick="showSignup()">अकाउंट बनाएं</a>';
    document.getElementById('alreadyAccountText').innerHTML = 'पहले से अकाउंट है? <a href="#" onclick="hideSignup()">लॉगिन</a>';
  } else { location.reload(); }
}
