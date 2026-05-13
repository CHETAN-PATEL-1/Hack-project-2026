const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
const adminAuth = require('../middleware/adminAuth');

const COOKIE_NAME = adminAuth.COOKIE_NAME;
const ADMIN_SECRET = adminAuth.ADMIN_SECRET;

// Defaults for hackathon demo only — override with ADMIN_ID / ADMIN_PASSWORD in .env for production
const DEFAULT_ADMIN_ID = 'fasal_admin';
const DEFAULT_ADMIN_PASS = 'FasalAdmin@2026';

// POST /api/admin/login
exports.adminLogin = async (req, res) => {
  try {
    const expectedId = process.env.ADMIN_ID || DEFAULT_ADMIN_ID;
    const expectedPass = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;
    if (!process.env.ADMIN_ID) {
      console.warn('[admin] Using default ADMIN_ID; set ADMIN_ID and ADMIN_PASSWORD in .env for production.');
    }

    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' });
    }
    if (username !== expectedId || password !== expectedPass) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ role: 'admin' }, ADMIN_SECRET, { expiresIn: '8h' });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });
    res.json({ ok: true, message: 'Admin session started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/logout
exports.adminLogout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
};

// GET /api/admin/stats
exports.adminStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const farmers = await User.countDocuments({ role: 'farmer' });
    const customers = await User.countDocuments({ role: 'customer' });
    const products = await Product.countDocuments();

    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const listingsByDay = await Product.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('ownerId', 'name phone')
      .select('name price quantity category createdAt ownerId');

    res.json({
      users,
      farmers,
      customers,
      products,
      listingsByDay,
      recentProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
