// Basic error handler middleware
module.exports = (err, req, res, next) => {
  console.error(err.stack || err.message || err);
  // Multer file upload errors
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Max size is 2MB.' });
  }
  if (err && err.message === 'Unsupported file type') {
    return res.status(400).json({ message: 'Unsupported file type. Only jpg/png/gif/webp allowed.' });
  }

  // default
  res.status(500).json({ message: 'Server error' });
};
