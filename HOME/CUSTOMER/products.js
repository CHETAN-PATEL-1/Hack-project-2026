(function(){
  const API_BASE = 'http://localhost:5000/api/products';
  const grid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
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
    meta.textContent = (p.quantity != null ? `Qty: ${p.quantity} • ` : '') + `By: ${farmerName}` + (p.notes ? ` • ${p.notes}` : '');

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
    const url = `${API_BASE}?page=${state.page}&limit=${state.limit}&q=${encodeURIComponent(q)}`;
    try{
      const res = await fetch(url, {cache: 'no-store'});
      if(!res.ok) throw new Error('network');
      const data = await res.json();
      state.total = data.total || 0;
      state.totalPages = data.totalPages || 1;
      render(data.products || []);
      updatePager();
    }catch(err){
      // fallback to localProducts with client-side pagination
      const local = localStorage.getItem('localProducts');
      const arr = local ? JSON.parse(local) : [];
      const q = (searchInput.value || '').trim().toLowerCase();
      const filtered = q ? arr.filter(p => (p.name||'').toLowerCase().includes(q)) : arr;
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
  prevBtn.addEventListener('click', ()=>{ if(state.page>1){ state.page--; fetchPage(); }});
  nextBtn.addEventListener('click', ()=>{ if(state.page < state.totalPages){ state.page++; fetchPage(); }});
  pageSizeSel.addEventListener('change', ()=>{ state.limit = parseInt(pageSizeSel.value,10); state.page = 1; fetchPage(); });
})();