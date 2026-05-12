const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || '1h';
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '30d';

function generateAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ name, email, phone, password: hashed, role: role || 'customer' });
    await user.save();

    // create tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // save refresh token to user record
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save();

    // set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // also set short-lived httpOnly access token cookie so frontend doesn't store tokens
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    // return basic user info (no password) and access token for backward compat (optional)
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    // create tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // persist refresh token
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); } catch (e) { return res.status(401).json({ message: 'Invalid refresh token' }); }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
    if (!user.refreshTokens || !user.refreshTokens.includes(token)) return res.status(401).json({ message: 'Refresh token revoked' });

    const accessToken = generateAccessToken(user);
    // set access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });
    res.json({ token: accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (token && req.cookies) {
      // remove from DB
      const payload = jwt.decode(token);
      if (payload && payload.id) {
        const user = await User.findById(payload.id);
        if (user && user.refreshTokens) {
          user.refreshTokens = user.refreshTokens.filter(t => t !== token);
          await user.save();
        }
      }
    }

    // clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
