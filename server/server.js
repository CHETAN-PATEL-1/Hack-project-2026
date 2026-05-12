const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/products');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Multer needs this directory to exist before uploads
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// connect DB
connectDB();

const homeDir = path.join(__dirname, '..', 'HOME');

app.get('/', (req, res) => res.redirect(302, '/Home%20Page/index.html'));

app.get('/api', (req, res) => res.json({ ok: true, message: 'Farm2Consumer API' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);

app.use('/uploads', express.static(uploadsDir));

// Marketplace UI (same origin as API — cookies and uploads work)
if (fs.existsSync(homeDir)) {
  app.use(express.static(homeDir));
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (fs.existsSync(homeDir)) {
    console.log(`Open the app: http://localhost:${PORT}/`);
  }
});
