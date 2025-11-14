// Simple store in localStorage for demo purposes
const store = {
  get(key, fallback){
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)); },
};

// Seed demo data if empty
(function seed(){
  if(!store.get('products')){
    store.set('products', [
      {id: 1, name: 'Wireless Headphones', price: 49.99, img: 'https://images.unsplash.com/photo-1518444028784-5ce93ae3a6d0?q=80&w=800&auto=format&fit=crop'},
      {id: 2, name: 'Smart Watch', price: 89.00, img: 'https://images.unsplash.com/photo-1516559828984-fb3b99548b21?q=80&w=800&auto=format&fit=crop'},
      {id: 3, name: 'Gaming Mouse', price: 29.50, img: 'https://images.unsplash.com/photo-1541534401786-2077eed87a72?q=80&w=800&auto=format&fit=crop'},
      {id: 4, name: 'Bluetooth Speaker', price: 39.25, img: 'https://images.unsplash.com/photo-1495305379050-64540d6ee95d?q=80&w=800&auto=format&fit=crop'},
      {id: 5, name: 'USB-C Charger', price: 19.99, img: 'https://images.unsplash.com/photo-1591019479261-1b1b1b1a1a1a?q=80&w=800&auto=format&fit=crop'}
    ]);
  }
  store.set('orders', store.get('orders', []));
  store.set('wishlist', store.get('wishlist', []));
  store.set('reviews', store.get('reviews', []));
})();

function formatCurrency(n){ return new Intl.NumberFormat(undefined, {style:'currency', currency:'USD'}).format(n); }

function navSetup(){
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  if(toggle && menu){
    toggle.addEventListener('click', () => {
      const open = menu.style.display === 'flex';
      menu.style.display = open ? 'none' : 'flex';
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }
}

function footerYear(){
  const year = document.getElementById('year');
  if(year) year.textContent = new Date().getFullYear();
}

function renderProducts(){
  const grid = document.getElementById('products-grid');
  const products = store.get('products', []);
  if(!grid) return;
  grid.innerHTML = products.map(p => `
    <div class="card product-card">
      <img alt="${p.name}" src="${p.img}" />
      <div>
        <h3>${p.name}</h3>
        <div class="price">${formatCurrency(p.price)}</div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" data-action="buy" data-id="${p.id}">Buy</button>
        <button class="btn btn-link" data-action="wish" data-id="${p.id}">+ Wishlist</button>
      </div>
    </div>
  `).join('');

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    const id = Number(btn.dataset.id);
    const product = products.find(p => p.id === id);
    if(btn.dataset.action === 'buy'){
      const orders = store.get('orders', []);
      orders.push({ id: Date.now(), productId: id, name: product.name, price: product.price, date: new Date().toISOString() });
      store.set('orders', orders);
      alert('Added to orders.');
      refreshReports();
    } else if(btn.dataset.action === 'wish'){
      const wishlist = store.get('wishlist', []);
      if(!wishlist.some(w => w.id === id)){
        wishlist.push({ id, name: product.name, price: product.price });
        store.set('wishlist', wishlist);
        alert('Added to wishlist.');
        refreshReports();
      }
    }
  });
}

function renderOrders(){
  const tbody = document.getElementById('orders-body');
  if(!tbody) return;
  const orders = store.get('orders', []);
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.name}</td>
      <td>${formatCurrency(o.price)}</td>
      <td>${new Date(o.date).toLocaleString()}</td>
    </tr>`).join('') || `<tr><td colspan="4">No orders yet.</td></tr>`;
}

function renderWishlist(){
  const tbody = document.getElementById('wishlist-body');
  if(!tbody) return;
  const wishlist = store.get('wishlist', []);
  tbody.innerHTML = wishlist.map(w => `
    <tr>
      <td>${w.id}</td>
      <td>${w.name}</td>
      <td>${formatCurrency(w.price)}</td>
      <td><button class="btn btn-link" data-remove="${w.id}">Remove</button></td>
    </tr>`).join('') || `<tr><td colspan="4">Your wishlist is empty.</td></tr>`;
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-remove]');
    if(!btn) return;
    const id = Number(btn.dataset.remove);
    const updated = store.get('wishlist', []).filter(w => w.id !== id);
    store.set('wishlist', updated);
    renderWishlist();
    refreshReports();
  });
}

function renderReviews(){
  const list = document.getElementById('reviews-list');
  if(!list) return;
  const reviews = store.get('reviews', []);
  if(reviews.length === 0){ list.innerHTML = '<p class="muted">No reviews yet.</p>'; return; }
  list.innerHTML = reviews.map(r => `
    <div class="review-item">
      <div class="review-meta">⭐ ${r.rating} • ${r.name}</div>
      <div>${r.comment}</div>
    </div>
  `).join('');
}

function reviewForm(){
  const form = document.getElementById('review-form');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#rev-name');
    const rating = form.querySelector('#rev-rating');
    const comment = form.querySelector('#rev-comment');

    // simple validation
    let valid = true;
    const setErr = (el, msg) => {
      const span = form.querySelector(`.error[data-for="${el.id}"]`);
      if(span){ span.textContent = msg || ''; }
      if(msg) valid = false;
    };

    setErr(name, name.value.trim().length < 2 ? 'Enter at least 2 characters.' : '');
    const r = Number(rating.value);
    setErr(rating, !(r>=1 && r<=5) ? 'Rating must be 1-5.' : '');
    setErr(comment, comment.value.trim().length < 5 ? 'Enter at least 5 characters.' : '');

    if(!valid) return;

    const reviews = store.get('reviews', []);
    reviews.unshift({ name: name.value.trim(), rating: r, comment: comment.value.trim() });
    store.set('reviews', reviews);
    form.reset();
    renderReviews();
    refreshReports();
  });
}

function authValidation(){
  const login = document.getElementById('login-form');
  const register = document.getElementById('register-form');

  const showErr = (form, id, msg) => {
    const span = form.querySelector(`.error[data-for="${id}"]`);
    if(span) span.textContent = msg || '';
  };

  if(register){
    register.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = register.querySelector('#reg-name').value.trim();
      const email = register.querySelector('#reg-email').value.trim();
      const pass = register.querySelector('#reg-pass').value;
      const confirm = register.querySelector('#reg-confirm').value;

      let valid = true;
      if(name.length < 2){ showErr(register, 'reg-name', 'Enter at least 2 characters.'); valid = false; } else showErr(register, 'reg-name');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ showErr(register, 'reg-email', 'Enter a valid email.'); valid = false; } else showErr(register, 'reg-email');
      if(pass.length < 6 || !/[A-Z]/.test(pass) || !/\d/.test(pass)){
        showErr(register, 'reg-pass', 'Min 6 chars, include 1 uppercase & 1 number.'); valid = false;
      } else showErr(register, 'reg-pass');
      if(confirm !== pass){ showErr(register, 'reg-confirm', 'Passwords do not match.'); valid = false; } else showErr(register, 'reg-confirm');

      if(!valid) return;
      alert('Registration successful (demo). You can now login.');
      window.location.href = 'login.html';
    });
  }

  if(login){
    login.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = login.querySelector('#log-email').value.trim();
      const pass = login.querySelector('#log-pass').value;

      let valid = true;
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ showErr(login, 'log-email', 'Enter a valid email.'); valid = false; } else showErr(login, 'log-email');
      if(pass.length < 6){ showErr(login, 'log-pass', 'Password must be at least 6 characters.'); valid = false; } else showErr(login, 'log-pass');

      if(!valid) return;
      alert('Login successful (demo).');
      window.location.href = 'index.html';
    });
  }
}

function refreshReports(){
  const orders = store.get('orders', []);
  const wishlist = store.get('wishlist', []);
  const reviews = store.get('reviews', []);
  const el = (id) => document.getElementById(id);
  if(el('report-orders')) el('report-orders').textContent = orders.length;
  if(el('report-wishlist')) el('report-wishlist').textContent = wishlist.length;
  if(el('report-reviews')) el('report-reviews').textContent = reviews.length;
}

function init(){
  navSetup();
  footerYear();
  renderProducts();
  renderOrders();
  renderWishlist();
  renderReviews();
  reviewForm();
  authValidation();
  refreshReports();
}

document.addEventListener('DOMContentLoaded', init);
