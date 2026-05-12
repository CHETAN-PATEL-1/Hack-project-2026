const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createProduct, getMyProducts, getAllProducts } = require('../controllers/productController');
const multer = require('multer');
const path = require('path');

// multer storage
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, '..', 'uploads'));
	},
	filename: function (req, file, cb) {
		const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
		const ext = path.extname(file.originalname);
		cb(null, file.fieldname + '-' + unique + ext);
	}
});

// Accept only common image mime types and limit size to 2MB
const fileFilter = (req, file, cb) => {
	const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
	if (allowed.includes(file.mimetype)) cb(null, true);
	else cb(new Error('Unsupported file type'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

// POST with optional image file field name 'image'
router.post('/', auth, upload.single('image'), createProduct);
router.get('/mine', auth, getMyProducts);
router.get('/', getAllProducts);

module.exports = router;
