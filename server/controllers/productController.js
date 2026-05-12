const Product = require('../models/Product');

// POST /api/products  (protected)
exports.createProduct = async (req, res) => {
  try {
    const { name, price, quantity, image, notes } = req.body;
    if (!name || !price || !quantity) return res.status(400).json({ message: 'name, price and quantity required' });

    // role-based authorization: only farmers may create products
    if (!req.user || req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can create products' });
    }

    // If a file was uploaded via multer, use its path as image
    let imagePath = image;
    if (req.file) {
      // expose via /uploads
      imagePath = '/uploads/' + req.file.filename;
    }

    const product = new Product({ name, price, quantity, image: imagePath, notes, ownerId: req.user.id });
    await product.save();
    // populate owner name for client convenience
    await product.populate('ownerId', 'name');
    res.status(201).json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/mine (protected)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ ownerId: req.user.id }).sort({ createdAt: -1 }).populate('ownerId', 'name');
    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products (public) - list all products
exports.getAllProducts = async (req, res) => {
  try {
    // pagination and basic search support
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 100);
    const q = (req.query.q || '').trim();

    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const products = await Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('ownerId', 'name');
    res.json({ products, page, limit, totalPages, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
