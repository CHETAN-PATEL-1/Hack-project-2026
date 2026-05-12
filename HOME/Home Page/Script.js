(function () {
  var PRODUCTS_URL = '../FARMER/CUSTOMER/products.html';
  var FARMER_LOGIN_URL = '../FARMER/farmer%20login/farmer-login.html';
  var CUSTOMER_LOGIN_URL = '../FARMER/CUSTOMER/customer%20login/customer-login.html';

  function parsePriceFromCard(pEl) {
    var t = (pEl && pEl.textContent) || '';
    var m = t.match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  }

  /** Home page demo cards → same localStorage cart as customer dashboard */
  function addToCartFromCard(evt) {
    var btn = evt.currentTarget;
    var card = btn.closest('.card');
    if (!card) return;
    var nameEl = card.querySelector('.product-name');
    var name = nameEl ? nameEl.textContent.trim() : 'Product';
    var img = card.querySelector('img');
    var imgSrc = img ? img.src : '';
    var price = parsePriceFromCard(card.querySelector('.card-price'));
    var pid = 'home-' + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      var cart = JSON.parse(localStorage.getItem('cart') || '[]');
      var existing = cart.find(function (i) { return i.productId === pid; });
      if (existing) existing.quantity += 1;
      else {
        cart.push({
          productId: pid,
          name: name,
          price: price,
          image: imgSrc,
          farmer: 'Local farmers',
          quantity: 1
        });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(name + ' — added to cart! (Open customer dashboard → View Cart)');
    } catch (e) {
      alert('Could not update cart.');
    }
  }

  function applyProductCardsLang(lang) {
    document.querySelectorAll('.product-name').forEach(function (el) {
      var en = el.getAttribute('data-en');
      var hi = el.getAttribute('data-hi');
      if (lang === 'hi' && hi) el.textContent = hi;
      else if (en) el.textContent = en;
    });
    document.querySelectorAll('.cart-btn').forEach(function (el) {
      var en = el.getAttribute('data-en');
      var hi = el.getAttribute('data-hi');
      if (lang === 'hi' && hi) el.textContent = hi;
      else if (en) el.textContent = en;
    });
  }

  window.setEnglish = function () {
    document.getElementById('title').innerHTML = '🌾 Fasal Junction';
    document.getElementById('farmerBtn').innerHTML = 'Farmer Login';
    document.getElementById('customerBtn').innerHTML = 'Customer Login';
    document.getElementById('browseBtn').innerHTML = 'Browse Products';
    document.getElementById('heroTitle').innerHTML = 'Fresh From Farm To Home';
    document.getElementById('heroText').innerHTML = 'Buy fresh products directly from farmers.';
    document.getElementById('searchBox').placeholder = 'Search Products';
    document.getElementById('searchBtn').innerHTML = 'Search';
    applyProductCardsLang('en');
  };

  window.setHindi = function () {
    document.getElementById('title').innerHTML = '🌾 फसल जंक्शन';
    document.getElementById('farmerBtn').innerHTML = 'किसान लॉगिन';
    document.getElementById('customerBtn').innerHTML = 'ग्राहक लॉगिन';
    document.getElementById('browseBtn').innerHTML = 'उत्पाद देखें';
    document.getElementById('heroTitle').innerHTML = 'खेत से सीधे आपके घर तक';
    document.getElementById('heroText').innerHTML = 'किसानों से सीधे ताज़े उत्पाद खरीदें।';
    document.getElementById('searchBox').placeholder = 'उत्पाद खोजें';
    document.getElementById('searchBtn').innerHTML = 'खोजें';
    applyProductCardsLang('hi');
  };

  function runSearch() {
    var q = (document.getElementById('searchBox') && document.getElementById('searchBox').value || '').trim();
    if (q) {
      window.location.href = PRODUCTS_URL + '?q=' + encodeURIComponent(q);
    } else {
      window.location.href = PRODUCTS_URL;
    }
  }

  function subscribeNewsletter() {
    var input = document.getElementById('subscribeEmail');
    var email = input && input.value.trim();
    if (!email) {
      alert('Please enter your email.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    alert('Thanks! We will notify you at: ' + email);
    input.value = '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('farmerBtn').addEventListener('click', function () {
      window.location.href = FARMER_LOGIN_URL;
    });
    document.getElementById('customerBtn').addEventListener('click', function () {
      window.location.href = CUSTOMER_LOGIN_URL;
    });
    document.getElementById('browseBtn').addEventListener('click', function () {
      window.location.href = PRODUCTS_URL;
    });
    document.getElementById('searchBtn').addEventListener('click', runSearch);
    document.getElementById('searchBox').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        runSearch();
      }
    });

    document.querySelectorAll('.cart-btn').forEach(function (btn) {
      btn.addEventListener('click', addToCartFromCard);
    });

    var sub = document.getElementById('subscribeBtn');
    if (sub) sub.addEventListener('click', subscribeNewsletter);
  });
})();
