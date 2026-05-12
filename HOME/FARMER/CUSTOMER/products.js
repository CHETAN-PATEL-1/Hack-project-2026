(function(){
  const API_BASE = 'http://localhost:5000/api/products';
  const grid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const categoryFilter = document.getElementById('categoryFilter');
  const locationFilter = document.getElementById('locationFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const pageSizeSel = document.getElementById('pageSize');

  let state = { page: 1, limit: parseInt(pageSizeSel.value, 10), totalPages: 1, total: 0 };

  function makeCard(p){
    const card = document.createElement('article');
    card.className = 'card';

    const img = document.createElement('img');
    let src = p.image || '';
    if(src.startsWith('/uploads')) src = window.location.origin + src;
    img.src = src || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="20">No image</text></svg>';
    img.alt = p.name || 'product image';

    const body = document.createElement('div');
    body.className = 'body';

    const title = document.createElement('h3');
    title.textContent = p.name || 'Untitled';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const farmerName = (p.ownerId && p.ownerId.name) || p.ownerName || 'Farmer';
    const tags = [];
    if (p.quantity != null) tags.push(`Qty: ${p.quantity}`);
    tags.push(`By: ${farmerName}`);
    if (p.category) tags.push(`Category: ${p.category}`);
    if (p.location) tags.push(`Location: ${p.location}`);
    if (p.notes) tags.push(p.notes);
    meta.textContent = tags.join(' • ');

    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = (p.price != null ? `₹ ${p.price}` : 'Price N/A');

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(price);

    card.appendChild(img);
    card.appendChild(body);

    return card;
  }

  async function fetchPage(){
    const q = (searchInput.value || '').trim();
    const minPrice = (minPriceInput.value || '').trim();
    const maxPrice = (maxPriceInput.value || '').trim();
    const category = (categoryFilter.value || '').trim();
    const location = (locationFilter.value || '').trim();
    let url = `${API_BASE}?page=${state.page}&limit=${state.limit}&q=${encodeURIComponent(q)}`;
    if (minPrice) url += `&minPrice=${encodeURIComponent(minPrice)}`;
    if (maxPrice) url += `&maxPrice=${encodeURIComponent(maxPrice)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;
    try{
      const res = await fetch(url, {cache: 'no-store'});
      if(!res.ok) throw new Error('network');
      const data = await res.json();
      state.total = data.total || 0;
      state.totalPages = data.totalPages || 1;
      render(data.products || []);
      updatePager();
    }catch(err){
      // fallback to localProducts with client-side pagination and filtering
      const local = localStorage.getItem('localProducts');
      const arr = local ? JSON.parse(local) : [];
      let filtered = arr;
      if (q) filtered = filtered.filter(p => (p.name||'').toLowerCase().includes(q.toLowerCase()));
      if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
      if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
      if (category) filtered = filtered.filter(p => (p.category||'').toLowerCase().includes(category.toLowerCase()));
      if (location) filtered = filtered.filter(p => (p.location||'').toLowerCase().includes(location.toLowerCase()));
      state.total = filtered.length;
      state.totalPages = Math.max(1, Math.ceil(state.total / state.limit));
      const start = (state.page - 1) * state.limit;
      const pageItems = filtered.slice(start, start + state.limit);
      render(pageItems);
      updatePager();
    }
  }

  function render(list){
    grid.innerHTML = '';
    if(!list || list.length === 0){
      grid.innerHTML = '<div class="empty">No products found.</div>';
      return;
    }
    list.forEach(p => grid.appendChild(makeCard(p)));
  }

  function updatePager(){
    pageInfo.textContent = `${state.page} / ${state.totalPages}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= state.totalPages;
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    await fetchPage();
  });

  searchInput.addEventListener('input', ()=>{ state.page = 1; fetchPage(); });
  minPriceInput.addEventListener('input', ()=>{ state.page = 1; fetchPage(); });
  maxPriceInput.addEventListener('input', ()=>{ state.page = 1; fetchPage(); });
  categoryFilter.addEventListener('input', ()=>{ state.page = 1; fetchPage(); });
  locationFilter.addEventListener('input', ()=>{ state.page = 1; fetchPage(); });
  clearFiltersBtn.addEventListener('click', ()=>{
    searchInput.value = '';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    categoryFilter.value = '';
    locationFilter.value = '';
    state.page = 1;
    fetchPage();
  });
  prevBtn.addEventListener('click', ()=>{ if(state.page>1){ state.page--; fetchPage(); }});
  nextBtn.addEventListener('click', ()=>{ if(state.page < state.totalPages){ state.page++; fetchPage(); }});
  pageSizeSel.addEventListener('change', ()=>{ state.limit = parseInt(pageSizeSel.value,10); state.page = 1; fetchPage(); });
})();