// Farmer dashboard product add + inventory (client-side)

const API_BASE = 'http://localhost:5000/api';

function getProductsLocal() {
  try { return JSON.parse(localStorage.getItem('localProducts') || '[]'); } catch (e) { return []; }
}
function saveProductsLocal(products) { localStorage.setItem('localProducts', JSON.stringify(products)); }

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

// UI helpers
function el(tag, cls) { const d = document.createElement(tag); if (cls) d.className = cls; return d; }

function renderProducts() {
  const user = getCurrentUser();
  const list = document.getElementById('productList');
  list.innerHTML = '';
  if (!user) return;
  const all = getProductsLocal();
  const mine = all.filter(p => p.ownerId === user.id);
  if (mine.length === 0) {
    const p = el('p'); p.innerText = 'No products yet.'; list.appendChild(p); return;
  }
  mine.forEach(p => {
    const card = el('div', 'product-card');
    const img = el('img'); img.src = p.image || 'https://via.placeholder.com/160x100?text=No+Image';
    img.alt = p.name;
    card.appendChild(img);
    const name = el('h4'); name.innerText = p.name; card.appendChild(name);
    const meta = el('p'); meta.innerText = `₹${p.price} / kg • ${p.quantity} kg`; card.appendChild(meta);
    const notes = el('p'); notes.innerText = p.notes || ''; notes.className = 'notes'; card.appendChild(notes);
    list.appendChild(card);
  });
}

async function saveProduct(product, file) {
  // Try backend first using cookie-based auth. Prefer `fetchWithAuth` when available.
  const useFetchWithAuth = !!window.fetchWithAuth;
  try {
    if (useFetchWithAuth) {
      if (file) {
        const form = new FormData();
        form.append('name', product.name);
        form.append('price', product.price);
        form.append('quantity', product.quantity);
        if (product.notes) form.append('notes', product.notes);
        form.append('ownerId', product.ownerId);
        form.append('image', file, file.name);

        const res = await fetchWithAuth(API_BASE + '/products', { method: 'POST', body: form });
        if (res && res.ok) {
          const data = await res.json();
          const all = getProductsLocal();
          all.push({ ...data.product, ownerId: product.ownerId });
          saveProductsLocal(all);
          return { ok: true, source: 'server' };
        }
      } else {
        const res = await fetchWithAuth(API_BASE + '/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
        if (res && res.ok) {
          const data = await res.json();
          const all = getProductsLocal();
          all.push({ ...data.product, ownerId: product.ownerId });
          saveProductsLocal(all);
          return { ok: true, source: 'server' };
        }
      }
    } else {
      // Older fallback: try credentials include (cookies) even without helper
      try {
        if (file) {
          const form = new FormData();
          form.append('name', product.name);
          form.append('price', product.price);
          form.append('quantity', product.quantity);
          if (product.notes) form.append('notes', product.notes);
          form.append('ownerId', product.ownerId);
          form.append('image', file, file.name);
          const res = await fetch(API_BASE + '/products', { method: 'POST', body: form, credentials: 'include' });
          if (res && res.ok) {
            const data = await res.json();
            const all = getProductsLocal();
            all.push({ ...data.product, ownerId: product.ownerId });
            saveProductsLocal(all);
            return { ok: true, source: 'server' };
          }
        } else {
          const res = await fetch(API_BASE + '/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(product) });
          if (res && res.ok) {
            const data = await res.json();
            const all = getProductsLocal();
            all.push({ ...data.product, ownerId: product.ownerId });
            saveProductsLocal(all);
            return { ok: true, source: 'server' };
          }
        }
      } catch (e) { /* fall through to local */ }
    }
  } catch (e) { console.warn('Server product save failed, falling back to local', e); }

  // Fallback: if file present, read as data URL and save locally
  if (file) {
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      product.image = dataUrl;
    } catch (e) {
      console.warn('Failed to read file locally', e);
    }
  }

  const all = getProductsLocal();
  all.push(product);
  saveProductsLocal(all);
  return { ok: true, source: 'local' };
}

// wire UI
document.addEventListener('DOMContentLoaded', () => {
  const showBtn = document.getElementById('showAddProduct');
  const viewBtn = document.getElementById('viewInventory');
  const addSection = document.getElementById('addProductSection');
  const inventorySection = document.getElementById('inventorySection');
  const addBtn = document.getElementById('addProductBtn');
  const cancelBtn = document.getElementById('cancelAdd');

  showBtn.addEventListener('click', () => { addSection.classList.remove('hidden'); inventorySection.classList.remove('hidden'); });
  viewBtn.addEventListener('click', () => { addSection.classList.add('hidden'); inventorySection.classList.toggle('hidden'); });
  cancelBtn.addEventListener('click', (e) => { e.preventDefault(); addSection.classList.add('hidden'); clearPreview(); });

  addBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = document.getElementById('prodName').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    const qty = parseFloat(document.getElementById('prodQty').value);
    const image = document.getElementById('prodImage').value.trim();
    const fileInput = document.getElementById('prodImageFile');
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    const notes = document.getElementById('prodNotes').value.trim();

    if (!name || !price || isNaN(price) || !qty || isNaN(qty)) return alert('Please enter name, price and quantity');

    const user = getCurrentUser();
    if (!user) return alert('Not logged in');

    const product = {
      id: 'p' + Date.now(),
      name,
      price,
      quantity: qty,
      image,
      notes,
      ownerId: user.id,
      createdAt: new Date().toISOString()
    };

    const res = await saveProduct(product, file);
    alert('Product saved (' + res.source + ')');
    // clear form
    document.getElementById('prodName').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodQty').value = '';
    document.getElementById('prodImage').value = '';
    document.getElementById('prodNotes').value = '';
    addSection.classList.add('hidden');
    clearPreview();
    renderProducts();
  });

  // Image preview handling
  const fileInput = document.getElementById('prodImageFile');
  const previewImg = document.getElementById('prodPreview');
  let currentPreviewUrl = null;

  function clearPreview() {
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = null;
    }
    previewImg.src = '';
    previewImg.classList.add('hidden');
    if (fileInput) fileInput.value = '';
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return clearPreview();
      // show preview
      if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = URL.createObjectURL(f);
      previewImg.src = currentPreviewUrl;
      previewImg.classList.remove('hidden');
    });
  }

  // initial render
  renderProducts();
});
