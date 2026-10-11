const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IMG = { creamy: 'images/creamy.jpg', sea: 'images/sea.jpg', sakura: 'images/sakura.jpg' };
let PRODUCTS = { creamy: { name: 'Creamy Dunes', price: 300 }, sea: { name: 'Sea Yeah', price: 300 }, sakura: { name: 'Sakura Whisper', price: 300 } };
let INSTAPAY = '';
let cart = [];
try { cart = JSON.parse(localStorage.getItem('gm_cart') || '[]').filter(l => PRODUCTS[l.id]); } catch { cart = []; }

const GM = window.GM || {};
INSTAPAY = GM.INSTAPAY || '';
const SB = (GM.SUPABASE_URL || '').replace(/\/$/, '');
const sbHead = (extra = {}) => ({ apikey: GM.SUPABASE_ANON_KEY, ...(String(GM.SUPABASE_ANON_KEY).startsWith('eyJ') ? { Authorization: 'Bearer ' + GM.SUPABASE_ANON_KEY } : {}), ...extra });
const rpc = (fn, body) => fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: sbHead({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
const proofUrl = f => SB + '/storage/v1/object/public/proofs/' + encodeURIComponent(f);

/* ---------- toast ---------- */
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200); }

/* ---------- split headlines ---------- */
$$('.split').forEach(h => {
  const txt = h.textContent; h.setAttribute('aria-label', txt); h.textContent = '';
  [...txt].forEach((c, i) => { const s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i); s.innerHTML = c === ' ' ? '&nbsp;' : esc(c); h.appendChild(s); });
});

/* ---------- scroll theme + reveals ---------- */
const root = document.documentElement;
const themeIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { root.style.setProperty('--bg', e.target.dataset.bg); root.style.setProperty('--ink', e.target.dataset.ink); }
}), { rootMargin: '-50% 0px -50% 0px' });
$$('[data-bg]').forEach(el => themeIO.observe(el));

const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } }), { threshold: .25 });
$$('.split,.p-img').forEach(el => rev.observe(el));

/* ---------- parallax + tilt ---------- */
const par = $('[data-par]');
if (par && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  addEventListener('scroll', () => { const y = scrollY; if (y < innerHeight * 1.2) par.style.transform = `translateY(${-y * .08}px)`; }, { passive: true });
}
$$('.p-img').forEach(el => {
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg'); el.style.setProperty('--rx', -((e.clientY - r.top) / r.height - .5) * 8 + 'deg'); });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
});

/* ---------- product controls ---------- */
$$('.product').forEach(sec => {
  const out = $('output', sec);
  $$('.qty button', sec).forEach(b => b.onclick = () => { out.textContent = Math.max(1, Math.min(50, +out.textContent + +b.dataset.q)); });
  $('.add', sec).onclick = e => {
    const id = sec.dataset.id, qty = +out.textContent, note = $('textarea', sec).value.trim();
    addLine(id, qty, note);
    fly(e.currentTarget);
    toast(`${PRODUCTS[id].name} added`);
    out.textContent = 1; $('textarea', sec).value = '';
  };
});
function fly(from) {
  const a = from.getBoundingClientRect(), b = $('#cartBtn').getBoundingClientRect();
  const d = document.createElement('div'); d.className = 'fly';
  d.style.left = a.left + a.width / 2 + 'px'; d.style.top = a.top + 'px'; document.body.appendChild(d);
  d.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${b.left + b.width / 2 - a.left - a.width / 2}px,${b.top - a.top}px) scale(.3)`, opacity: .3 }], { duration: 750, easing: 'cubic-bezier(.5,0,.2,1)' }).onfinish = () => {
    d.remove(); const c = $('#cartBtn'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  };
}

/* ---------- cart ---------- */
function save() { localStorage.setItem('gm_cart', JSON.stringify(cart)); renderCart(); }
function addLine(id, qty, note) {
  const ex = cart.find(l => l.id === id && l.note === note);
  if (ex) ex.qty = Math.min(50, ex.qty + qty); else cart.push({ id, qty, note });
  save();
}
const total = () => cart.reduce((s, l) => s + PRODUCTS[l.id].price * l.qty, 0);
function renderCart() {
  $('#cartCount').textContent = cart.reduce((s, l) => s + l.qty, 0);
  $('#cartTotal').textContent = total() + ' EGP';
  $('#checkoutBtn').disabled = !cart.length;
  const box = $('#lines');
  if (!cart.length) { box.innerHTML = '<p class="empty">Your cart is empty. Pick a candle.</p>'; return; }
  box.innerHTML = cart.map((l, i) => `
    <div class="line-item">
      <img src="${IMG[l.id]}" alt="">
      <div>
        <h4>${esc(PRODUCTS[l.id].name)}</h4>
        <div class="qty"><button data-i="${i}" data-d="-1" aria-label="Less">−</button><output>${l.qty}</output><button data-i="${i}" data-d="1" aria-label="More">+</button></div>
        <textarea rows="1" data-n="${i}" placeholder="Note" maxlength="300">${esc(l.note)}</textarea>
      </div>
      <div><b>${PRODUCTS[l.id].price * l.qty}</b><br><button class="rm" data-rm="${i}">Remove</button></div>
    </div>`).join('');
}
$('#lines').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.rm !== undefined) cart.splice(+b.dataset.rm, 1);
  else if (b.dataset.d) { const l = cart[+b.dataset.i]; l.qty = Math.max(1, Math.min(50, l.qty + +b.dataset.d)); }
  save();
});
$('#lines').addEventListener('change', e => { if (e.target.dataset.n !== undefined) { cart[+e.target.dataset.n].note = e.target.value.trim(); localStorage.setItem('gm_cart', JSON.stringify(cart)); } });

const openDrawer = o => { $('#drawer').classList.toggle('on', o); $('#scrim').classList.toggle('on', o); $('#drawer').setAttribute('aria-hidden', !o); };
$('#cartBtn').onclick = () => openDrawer(true);
$('#scrim').onclick = () => openDrawer(false);
$('#drawer [data-close]').onclick = () => openDrawer(false);

/* ---------- modals ---------- */
const openModal = (m, o = true) => { m.classList.toggle('on', o); m.setAttribute('aria-hidden', !o); };
$$('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) openModal(m, false); });
  $$('[data-close]', m).forEach(b => b.addEventListener('click', () => openModal(m, false)));
});
addEventListener('keydown', e => { if (e.key === 'Escape') { $$('.modal.on').forEach(m => openModal(m, false)); openDrawer(false); } });

/* ---------- checkout ---------- */
let details = {};
$('#checkoutBtn').onclick = () => {
  if (!cart.length) return;
  openDrawer(false);
  $('#step1').hidden = false; $('#step2').hidden = true; $('#done').hidden = true; $('.steps').hidden = false;
  $('#s1').className = 'on'; $('#s2').className = '';
  openModal($('#checkout'));
};
$('#step1').onsubmit = e => {
  e.preventDefault();
  details = Object.fromEntries(new FormData(e.target));
  $('#paySummary').innerHTML = cart.map(l => `<div><span>${l.qty} × ${esc(PRODUCTS[l.id].name)}${l.note ? `<small>${esc(l.note)}</small>` : ''}</span><b>${PRODUCTS[l.id].price * l.qty}</b></div>`).join('');
  $('#payTotal').textContent = total() + ' EGP';
  $('#instaAddr').textContent = INSTAPAY;
  $('#step1').hidden = true; $('#step2').hidden = false; $('#err').textContent = '';
  $('#s1').className = ''; $('#s2').className = 'on';
};
$('#back').onclick = () => { $('#step2').hidden = true; $('#step1').hidden = false; $('#s1').className = 'on'; $('#s2').className = ''; };
$('#copyInsta').onclick = () => { navigator.clipboard?.writeText(INSTAPAY).then(() => toast('Copied')).catch(() => {}); };
$('#shot').onchange = e => {
  const f = e.target.files[0], p = $('#shotPrev');
  if (!f) { p.hidden = true; return; }
  p.src = URL.createObjectURL(f); p.hidden = false;
};
$('#step2').onsubmit = async e => {
  e.preventDefault();
  const f = $('#shot').files[0];
  if (!f) { $('#err').textContent = 'Upload your payment screenshot first.'; return; }
  if (!SB) { $('#err').textContent = 'Store is not connected yet (config.js).'; return; }
  const btn = $('#send'); btn.disabled = true; btn.textContent = 'Sending…'; $('#err').textContent = '';
  try {
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    const file = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('') + '.' + ext;
    const up = await fetch(SB + '/storage/v1/object/proofs/' + file, { method: 'POST', headers: sbHead({ 'Content-Type': f.type || 'image/jpeg' }), body: f });
    if (!up.ok) throw new Error('Could not upload the screenshot. Try a smaller image.');
    const r = await rpc('place_order', { p_name: details.name, p_phone: details.phone, p_address: details.address, p_items: cart, p_shot: file });
    const j = await r.json();
    if (!r.ok) throw new Error('Could not place the order (' + r.status + '): ' + (j.message || j.hint || j.details || 'unknown error'));
    cart = []; save(); e.target.reset(); $('#step1').reset(); $('#shotPrev').hidden = true;
    $('#step2').hidden = true; $('.steps').hidden = true; $('#done').hidden = false; $('#doneId').textContent = j.id; setTimeout(burst, 150);
  } catch (er) { $('#err').textContent = er.message; }
  btn.disabled = false; btn.textContent = 'Send order';
};

/* ---------- admin ---------- */
let adminPw = sessionStorage.getItem('gm_admin') || '';
const showLogin = () => { adminPw = ''; sessionStorage.removeItem('gm_admin'); $('#panel').hidden = true; $('#login').hidden = false; };
$('#adminBtn').onclick = () => { openModal($('#admin')); if (adminPw) loadOrders(); };
$('#login').onsubmit = async e => {
  e.preventDefault(); $('#loginErr').textContent = '';
  adminPw = $('#pw').value;
  const ok = await loadOrders();
  if (ok) { sessionStorage.setItem('gm_admin', adminPw); $('#pw').value = ''; } else { adminPw = ''; $('#loginErr').textContent = 'Wrong password'; }
};
$('#logout').onclick = showLogin;
$('#refresh').onclick = () => loadOrders();
async function loadOrders() {
  if (!SB) return false;
  const r = await rpc('admin_list', { p_pw: adminPw });
  if (!r.ok) { showLogin(); return false; }
  const list = await r.json();
  $('#login').hidden = true; $('#panel').hidden = false;
  $('#orders').innerHTML = list.length ? list.map(o => `
    <div class="order">
      <div>
        <h4>${esc(o.id)} <span class="badge ${esc(o.status)}">${esc(o.status)}</span></h4>
        <p class="meta">${new Date(o.created_at).toLocaleString()}</p>
        <p><b>${esc(o.name)}</b> · <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></p>
        <p>${esc(o.address)}</p>
        <ul>${o.items.map(i => `<li>${esc(i.qty)} × ${esc(i.name)}${i.note ? ` <span class="note">"${esc(i.note)}"</span>` : ''}</li>`).join('')}</ul>
        <p><b>Total ${esc(o.total)} EGP</b></p>
      </div>
      <a href="${esc(proofUrl(o.screenshot))}" target="_blank" rel="noopener"><img src="${esc(proofUrl(o.screenshot))}" alt="Payment proof"></a>
      <div class="acts">
        <button class="mini" data-s="confirmed" data-id="${esc(o.id)}">Confirm</button>
        <button class="mini" data-s="rejected" data-id="${esc(o.id)}">Reject</button>
        <button class="mini" data-s="delivered" data-id="${esc(o.id)}">Delivered</button>
        <button class="mini" data-s="pending" data-id="${esc(o.id)}">Pending</button>
        <button class="mini" data-del="${esc(o.id)}">Delete</button>
      </div>
    </div>`).join('') : '<p class="empty">No orders yet.</p>';
  return true;
}
$('#orders').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.s) await rpc('admin_set_status', { p_pw: adminPw, p_id: b.dataset.id, p_status: b.dataset.s });
  else if (b.dataset.del) { if (!confirm('Delete this order?')) return; await rpc('admin_delete', { p_pw: adminPw, p_id: b.dataset.del }); }
  loadOrders();
});

renderCart();

/* ---------- extras: progress, cursor, magnetic, embers, light-it, burst ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const prog = $('#progress');
addEventListener('scroll', () => { prog.style.transform = `scaleX(${scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`; }, { passive: true });

const cur = $('#cursor');
if (!reduce && matchMedia('(pointer:fine)').matches) {
  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
  document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  (function loop() { cx += (tx - cx) * .12; cy += (ty - cy) * .12; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  $$('.btn,.cart-btn').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

const cv = $('#embers');
if (cv && !reduce) {
  const g = cv.getContext('2d'); let W, H, ps = [];
  const size = () => { W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight; };
  size(); addEventListener('resize', size);
  const mk = () => ({ x: Math.random() * W, y: H + 10, r: 1 + Math.random() * 3, v: .3 + Math.random() * .9, s: Math.random() * 6, a: .3 + Math.random() * .6 });
  for (let i = 0; i < 40; i++) { const p = mk(); p.y = Math.random() * H; ps.push(p); }
  (function draw() {
    g.clearRect(0, 0, W, H);
    ps.forEach((p, i) => {
      p.y -= p.v; p.s += .02; p.x += Math.sin(p.s) * .5; p.a -= .0008;
      if (p.y < -10 || p.a <= 0) ps[i] = mk();
      g.beginPath(); g.fillStyle = `rgba(255,${130 + p.r * 20},50,${p.a})`; g.shadowColor = '#ff9a3c'; g.shadowBlur = 10; g.arc(p.x, p.y, p.r, 0, 7); g.fill();
    });
    requestAnimationFrame(draw);
  })();
}

const jar = $('#jar');
if (jar) {
  let timer, pct = 0;
  const states = ['Lit. Warming up…', 'Pool forming…', 'Almost ready…', 'Melted. Pour and massage.'];
  jar.onclick = () => {
    const lit = !jar.classList.contains('lit');
    jar.classList.toggle('lit', lit); jar.setAttribute('aria-pressed', lit);
    clearInterval(timer);
    if (lit) {
      pct = 0;
      timer = setInterval(() => { pct = Math.min(100, pct + 1); $('#meltfill').style.width = pct + '%'; $('#lstate').textContent = states[Math.min(3, Math.floor(pct / 34))]; if (pct >= 100) clearInterval(timer); }, 100);
      $('#lstate').textContent = states[0];
    } else { $('#meltfill').style.width = '0'; $('#lstate').textContent = 'Unlit'; }
  };
}

function burst() {
  if (reduce) return;
  const box = $('#done .check').getBoundingClientRect();
  for (let i = 0; i < 36; i++) {
    const d = document.createElement('div'); d.className = 'fly';
    d.style.left = box.left + box.width / 2 + 'px'; d.style.top = box.top + box.height / 2 + 'px'; document.body.appendChild(d);
    const a = Math.random() * 6.283, r = 80 + Math.random() * 180;
    d.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r - 60}px) scale(0)`, opacity: 0 }], { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => d.remove();
  }
}
