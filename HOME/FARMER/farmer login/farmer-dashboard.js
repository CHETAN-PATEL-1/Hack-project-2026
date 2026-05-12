// Farmer dashboard product add + inventory (client-side)

const API_BASE = (typeof window !== 'undefined' && window.F2C_API_ORIGIN ? window.F2C_API_ORIGIN : 'http://localhost:5000') + '/api';

function getProductsLocal() {
  try { return JSON.parse(localStorage.getItem('localProducts') || '[]'); } catch (e) { return []; }
}
function saveProductsLocal(products) { localStorage.setItem('localProducts', JSON.stringify(products)); }

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

// UI helpers
function el(tag, cls) { const d = document.createElement(tag); if (cls) d.className = cls; return d; }

let currentInventory = [];
let editingId = null;
let statusEl = null;

function setStatus(message, isError = false) {
  if (!statusEl) statusEl = document.getElementById('dashboardStatus');
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function ownsProduct(product, userId) {
  return product.ownerId === userId || (product.ownerId && product.ownerId._id === userId);
}

function renderProducts(products) {
  const user = getCurrentUser();
  const list = document.getElementById('productList');
  list.innerHTML = '';
  if (!user) return;
  const all = products || getProductsLocal().filter(p => ownsProduct(p, user.id));
  if (all.length === 0) {
    const p = el('p'); p.innerText = 'No products yet.'; list.appendChild(p); return;
  }
  all.forEach(p => {
    const card = el('div', 'product-card');
    const img = el('img'); img.src = (typeof F2C_resolveUploadUrl === 'function' ? F2C_resolveUploadUrl(p.image, 'https://via.placeholder.com/160x100?text=No+Image') : (p.image || 'https://via.placeholder.com/160x100?text=No+Image'));
    img.alt = p.name;
    card.appendChild(img);
    const name = el('h4'); name.innerText = p.name; card.appendChild(name);
    const meta = el('p');
    const details = [`₹${p.price} / kg`, `${p.quantity} kg`];
    if (p.category) details.push(p.category);
    if (p.location) details.push(p.location);
    meta.innerText = details.join(' • ');
    card.appendChild(meta);
    const notes = el('p'); notes.innerText = p.notes || ''; notes.className = 'notes'; card.appendChild(notes);

    const actions = el('div', 'card-actions');
    const editBtn = el('button', 'edit-btn');
    editBtn.type = 'button';
    editBtn.innerText = 'Edit';
    editBtn.addEventListener('click', () => startEditProduct(p));
    const deleteBtn = el('button', 'delete-btn');
    deleteBtn.type = 'button';
    deleteBtn.innerText = 'Delete';
    deleteBtn.addEventListener('click', () => confirmDeleteProduct(p._id || p.id));
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    list.appendChild(card);
  });
}

async function fetchMyProducts() {
  const user = getCurrentUser();
  if (!user) return getProductsLocal().filter(p => p.ownerId === user.id);

  try {
    const requestOptions = { method: 'GET', credentials: 'include' };
    const res = window.fetchWithAuth
      ? await fetchWithAuth(API_BASE + '/products/mine', requestOptions)
      : await fetch(API_BASE + '/products/mine', requestOptions);

    if (!res || !res.ok) {
      throw new Error(`Server returned ${res ? res.status : 'no response'}`);
    }

    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    const localProducts = getProductsLocal().filter(p => !ownsProduct(p, user.id));
    const normalized = products.map(p => ({
      ...p,
      ownerId: p.ownerId && p.ownerId._id ? p.ownerId : { _id: user.id, name: user.name }
    }));
    saveProductsLocal([...localProducts, ...normalized]);
    return normalized;
  } catch (err) {
    console.warn('Failed to fetch farmer inventory from server:', err);
    setStatus('Showing offline inventory. Server fetch failed.', true);
  }

  return getProductsLocal().filter(p => ownsProduct(p, user.id));
}

function populateForm(product) {
  document.getElementById('prodName').value = product.name || '';
  document.getElementById('prodPrice').value = product.price || '';
  document.getElementById('prodQty').value = product.quantity || '';
  document.getElementById('prodImage').value = product.image || '';
  document.getElementById('prodNotes').value = product.notes || '';
  document.getElementById('prodCategory').value = product.category || '';
  document.getElementById('prodLocation').value = product.location || '';
}

function resetForm() {
  editingId = null;
  document.getElementById('prodName').value = '';
  document.getElementById('prodPrice').value = '';
  document.getElementById('prodQty').value = '';
  document.getElementById('prodImage').value = '';
  document.getElementById('prodNotes').value = '';
  document.getElementById('prodCategory').value = '';
  document.getElementById('prodLocation').value = '';
  document.getElementById('addProductBtn').innerText = 'Save Product';
  setStatus('Ready.', false);
}

function startEditProduct(product) {
  editingId = product._id || product.id;
  populateForm(product);
  document.getElementById('addProductSection').classList.remove('hidden');
  document.getElementById('inventorySection').classList.add('hidden');
  document.getElementById('addProductBtn').innerText = 'Save Changes';
  setStatus('Editing product. Save changes or cancel.', false);
}

async function confirmDeleteProduct(productId) {
  if (!productId) return;
  if (!confirm('Delete this product from your inventory?')) return;
  await deleteProduct(productId);
}

async function deleteProduct(id) {
  try {
    const requestOptions = { method: 'DELETE', credentials: 'include' };
    const res = window.fetchWithAuth
      ? await fetchWithAuth(`${API_BASE}/products/${id}`, requestOptions)
      : await fetch(`${API_BASE}/products/${id}`, requestOptions);

    if (res && res.ok) {
      const all = getProductsLocal().filter(p => (p._id || p.id) !== id);
      saveProductsLocal(all);
      await loadInventory();
      setStatus('Product deleted successfully.', false);
      return;
    }
  } catch (err) {
    console.warn('Delete failed, removing locally if possible:', err);
  }

  const all = getProductsLocal().filter(p => (p._id || p.id) !== id);
  saveProductsLocal(all);
  await loadInventory();
  setStatus('Product removed locally.', true);
}

async function updateProduct(product, file) {
  const productId = editingId;
  if (!productId) return { ok: false };

  const useFetchWithAuth = !!window.fetchWithAuth;
  try {
    if (file) {
      const form = new FormData();
      form.append('name', product.name);
      form.append('price', product.price);
      form.append('quantity', product.quantity);
      if (product.notes) form.append('notes', product.notes);
      if (product.category) form.append('category', product.category);
      if (product.location) form.append('location', product.location);
      if (product.image) form.append('image', product.image);
      form.append('image', file, file.name);

      const res = useFetchWithAuth
        ? await fetchWithAuth(`${API_BASE}/products/${productId}`, { method: 'PUT', body: form })
        : await fetch(`${API_BASE}/products/${productId}`, { method: 'PUT', body: form, credentials: 'include' });
      if (res && res.ok) {
        const data = await res.json();
        const all = getProductsLocal().map(p => ((p._id || p.id) === productId ? { ...data.product, ownerId: product.ownerId } : p));
        saveProductsLocal(all);
        return { ok: true, source: 'server', product: data.product };
      }
    } else {
      const payload = { ...product };
      const res = useFetchWithAuth
        ? await fetchWithAuth(`${API_BASE}/products/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch(`${API_BASE}/products/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      if (res && res.ok) {
        const data = await res.json();
        const all = getProductsLocal().map(p => ((p._id || p.id) === productId ? { ...data.product, ownerId: product.ownerId } : p));
        saveProductsLocal(all);
        return { ok: true, source: 'server', product: data.product };
      }
    }
  } catch (err) {
    console.warn('Update failed, saving locally:', err);
  }

  const all = getProductsLocal().map(p => {
    if ((p._id || p.id) !== productId) return p;
    return { ...p, ...product, ownerId: product.ownerId };
  });
  saveProductsLocal(all);
  return { ok: true, source: 'local' };
}

async function loadInventory() {
  setStatus('Loading inventory...', false);
  currentInventory = await fetchMyProducts();
  renderProducts(currentInventory);
  if (currentInventory.length === 0) {
    setStatus('No products found. Add a product to get started.', false);
  } else {
    setStatus(`Loaded ${currentInventory.length} products.`, false);
  }
}

async function saveProduct(product, file) {
  const user = getCurrentUser();
  if (!user) {
    const all = getProductsLocal();
    all.push(product);
    saveProductsLocal(all);
    return { ok: true, source: 'local' };
  }

  product.ownerId = user.id;
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
        if (product.category) form.append('category', product.category);
        if (product.location) form.append('location', product.location);
        form.append('ownerId', product.ownerId);
        form.append('image', file, file.name);

        const res = await fetchWithAuth(API_BASE + '/products', { method: 'POST', body: form });
        if (res && res.ok) {
          const data = await res.json();
          const all = getProductsLocal();
          all.push({ ...data.product, ownerId: user.id });
          saveProductsLocal(all);
          return { ok: true, source: 'server' };
        }
      } else {
        const res = await fetchWithAuth(API_BASE + '/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
        if (res && res.ok) {
          const data = await res.json();
          const all = getProductsLocal();
          all.push({ ...data.product, ownerId: user.id });
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
          if (product.category) form.append('category', product.category);
          if (product.location) form.append('location', product.location);
          form.append('ownerId', product.ownerId);
          form.append('image', file, file.name);
          const res = await fetch(API_BASE + '/products', { method: 'POST', body: form, credentials: 'include' });
          if (res && res.ok) {
            const data = await res.json();
            const all = getProductsLocal();
            all.push({ ...data.product, ownerId: user.id });
            saveProductsLocal(all);
            return { ok: true, source: 'server' };
          }
        } else {
          const res = await fetch(API_BASE + '/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(product) });
          if (res && res.ok) {
            const data = await res.json();
            const all = getProductsLocal();
            all.push({ ...data.product, ownerId: user.id });
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

  showBtn.addEventListener('click', () => { addSection.classList.remove('hidden'); inventorySection.classList.add('hidden'); });
  viewBtn.addEventListener('click', async () => { addSection.classList.add('hidden'); inventorySection.classList.remove('hidden'); await loadInventory(); });
  cancelBtn.addEventListener('click', (e) => { e.preventDefault(); addSection.classList.add('hidden'); resetForm(); clearPreview(); });

  addBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = document.getElementById('prodName').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    const qty = parseFloat(document.getElementById('prodQty').value);
    const image = document.getElementById('prodImage').value.trim();
    const fileInput = document.getElementById('prodImageFile');
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    const notes = document.getElementById('prodNotes').value.trim();
    const category = document.getElementById('prodCategory').value.trim();
    const location = document.getElementById('prodLocation').value.trim();

    if (!name || !price || isNaN(price) || !qty || isNaN(qty)) return alert('Please enter name, price and quantity');

    const user = getCurrentUser();
    if (!user) return alert('Not logged in');

    const product = {
      id: editingId || 'p' + Date.now(),
      name,
      price,
      quantity: qty,
      image,
      notes,
      category,
      location,
      ownerId: user.id,
      createdAt: new Date().toISOString()
    };

    const res = editingId ? await updateProduct(product, file) : await saveProduct(product, file);
    alert('Product saved (' + (res && res.source ? res.source : 'local') + ')');
    resetForm();
    addSection.classList.add('hidden');
    clearPreview();
    await loadInventory();
    setStatus(`Product saved (${res.source || 'local'}).`, false);
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

  const imageUrlInput = document.getElementById('prodImage');
  if (imageUrlInput) {
    imageUrlInput.addEventListener('input', () => {
      const url = imageUrlInput.value.trim();
      if (fileInput && fileInput.files && fileInput.files.length) return;
      if (!url) return clearPreview();
      previewImg.src = url;
      previewImg.classList.remove('hidden');
    });
  }

  // initial inventory load
  loadInventory();
});
