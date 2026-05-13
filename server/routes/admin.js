const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { adminLogin, adminLogout, adminStats } = require('../controllers/adminController');

router.post('/login', adminLogin);
router.post('/logout', adminLogout);
router.get('/stats', adminAuth, adminStats);

module.exports = router;
