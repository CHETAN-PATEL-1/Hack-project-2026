# Farm2Consumer - Server

Minimal Express + MongoDB scaffold for authentication.

Getting started:

1. Create `.env` at `server/.env` with:

```
MONGO_URI=mongodb://localhost:27017/farm2consumer
PORT=5000

# Optional: JWT secret for signing tokens
# If not set, a development secret will be used (not secure)
JWT_SECRET=your_long_random_secret_here
```

2. Install dependencies (from `server/`):

```bash
npm install
```

3. Run in development:

```bash
npm run dev
```

API endpoints:
- `POST /api/auth/register` { name, email, password, phone, role }
- `POST /api/auth/login` { email, password }

Products API:
- `POST /api/products` (protected) { name, price, quantity, image, notes } - create a product (farmer only)
- `GET /api/products/mine` (protected) - list current farmer's products
- `GET /api/products` - list public products

Uploads and limits:
- Uploaded files are stored under `server/uploads` and served at `/uploads/<filename>`.
- Allowed image types: `jpg`, `jpeg`, `png`, `gif`, `webp`.
- Maximum file size: 2 MB.

Notes:
- Passwords are hashed with `bcryptjs`.
- JWT and advanced features will be added in Phase 3.
