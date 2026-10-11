const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const GM = window.GM || {};
const SB = (GM.SUPABASE_URL || '').replace(/\/$/, '');
const sbHead = (extra = {}) => ({ apikey: GM.SUPABASE_ANON_KEY, ...(String(GM.SUPABASE_ANON_KEY).startsWith('eyJ') ? { Authorization: 'Bearer ' + GM.SUPABASE_ANON_KEY } : {}), ...extra });
const rpc = (fn, body) => fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: sbHead({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
const proofUrl = f => SB + '/storage/v1/object/public/proofs/' + encodeURIComponent(f);

const CANDLES = [
  { id: 'creamy', name: 'Creamy Dunes', img: 'images/creamy.jpg', tone: '#E9CFA0' },
  { id: 'sea', name: 'Sea Yeah', img: 'images/sea.jpg', tone: '#F49A6B' },
  { id: 'sakura', name: 'Sakura Whisper', img: 'images/sakura.jpg', tone: '#F4B9BE' }
];
const NAME2ID = { 'creamy dunes': 'creamy', 'sea yeah': 'sea', 'sakura whisper': 'sakura' };
const LOW = 3;                       // "Running low" at this many or fewer
let ORDERS = [], STOCK = {}, FILTER = 'all';

let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); }

let adminPw = sessionStorage.getItem('gm_admin') || '';
const showLogin = () => { adminPw = ''; sessionStorage.removeItem('gm_admin'); $('#panel').hidden = true; $('#loginCard').hidden = false; };

$('#login').onsubmit = async e => {
  e.preventDefault(); $('#loginErr').textContent = '';
  adminPw = $('#pw').value;
  const ok = await loadAll();
  if (ok) { sessionStorage.setItem('gm_admin', adminPw); $('#pw').value = ''; } else { adminPw = ''; $('#loginErr').textContent = 'Wrong password'; }
};
$('#logout').onclick = showLogin;
$('#refresh').onclick = () => loadAll();

/* ---------- stock ---------- */
function renderStock() {
  $('#stock').innerHTML = CANDLES.map(c => {
    const q = STOCK[c.id], known = q !== undefined;
    const st = !known ? 'na' : q <= 0 ? 'out' : q <= LOW ? 'low' : 'ok';
    const label = { ok: 'In stock', low: 'Running low', out: 'No stock', na: 'Not set up' }[st];
    return `<div class="sc ${st}" style="--tone:${c.tone}">
      <div class="sc-img"><img src="${c.img}" alt=""><span class="dot"></span></div>
      <div class="sc-body">
        <h4>${esc(c.name)}</h4>
        <span class="pill ${st}">${label}</span>
        <div class="sc-qty"><button data-sd="-1" data-id="${c.id}" aria-label="Remove one">−</button><output>${known ? q : '–'}</output><button data-sd="1" data-id="${c.id}" aria-label="Add one">+</button></div>
        <div class="sc-set"><input type="number" min="0" inputmode="numeric" placeholder="Set to…" data-si="${c.id}"><button class="mini" data-ss="${c.id}">Set</button></div>
      </div>
    </div>`;
  }).join('');
}
async function loadStock() {
  try {
    const r = await rpc('admin_get_stock', { p_pw: adminPw });
    if (r.ok) { STOCK = await r.json(); $('#stockHint').hidden = true; } else { STOCK = {}; $('#stockHint').hidden = false; }
  } catch { STOCK = {}; $('#stockHint').hidden = false; }
  renderStock();
}
async function changeStock(id, fn, body) {
  try {
    const r = await rpc(fn, { p_pw: adminPw, p_id: id, ...body });
    if (!r.ok) { toast('Could not update stock'); return; }
    STOCK[id] = await r.json(); renderStock();
  } catch { toast('Could not update stock'); }
}
$('#stock').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.sd) changeStock(b.dataset.id, 'admin_add_stock', { p_delta: +b.dataset.sd });
  else if (b.dataset.ss) {
    const inp = $(`[data-si="${b.dataset.ss}"]`), v = parseInt(inp.value, 10);
    if (isNaN(v) || v < 0) { toast('Type a number first'); return; }
    changeStock(b.dataset.ss, 'admin_set_stock', { p_qty: v });
  }
});
$('#stock').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.si) $(`[data-ss="${e.target.dataset.si}"]`).click(); });

/* ---------- orders ---------- */
const STATUSES = ['pending', 'confirmed', 'delivered', 'rejected'];
function renderOrders() {
  const count = s => ORDERS.filter(o => o.status === s).length;
  $('#stats').innerHTML = `<div class="stat p"><b>${count('pending')}</b><small>Pending</small></div><div class="stat c"><b>${count('confirmed')}</b><small>Confirmed</small></div><div class="stat d"><b>${count('delivered')}</b><small>Delivered</small></div>`;
  $('#filters').innerHTML = ['all', ...STATUSES].map(s => `<button class="chip ${FILTER === s ? 'on' : ''}" data-f="${s}">${s[0].toUpperCase() + s.slice(1)} (${s === 'all' ? ORDERS.length : count(s)})</button>`).join('');
  const list = FILTER === 'all' ? ORDERS : ORDERS.filter(o => o.status === FILTER);
  $('#orders').innerHTML = list.length ? list.map(o => `
    <div class="order">
      <div>
        <h4>${esc(o.id)} <span class="badge ${esc(o.status)}">${esc(o.status)}</span></h4>
        <p class="meta">${new Date(o.created_at).toLocaleString()}</p>
        <p><b>${esc(o.name)}</b> · <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></p>
        <p>${esc(o.address)}</p>
        ${o.coupon ? `<p class="note">Coupon ${esc(o.coupon)} · −${esc(o.discount)} EGP</p>` : ''}
        <ul>${o.items.map(i => `<li>${esc(i.qty)} × ${esc(i.name)}${i.note ? ` <span class="note">"${esc(i.note)}"</span>` : ''}</li>`).join('')}</ul>
        <p><b>Total ${esc(o.total)} EGP</b></p>
      </div>
      ${o.screenshot === 'free-order' ? '<p class="note"><b>Free order, no payment needed</b></p>' : `<a href="${esc(proofUrl(o.screenshot))}" target="_blank" rel="noopener"><img src="${esc(proofUrl(o.screenshot))}" alt="Payment proof"></a>`}
      <div class="acts">
        <button class="mini" data-s="confirmed" data-id="${esc(o.id)}">Confirm</button>
        <button class="mini" data-s="rejected" data-id="${esc(o.id)}">Reject</button>
        <button class="mini" data-s="delivered" data-id="${esc(o.id)}">Delivered</button>
        <button class="mini" data-s="pending" data-id="${esc(o.id)}">Pending</button>
        <button class="mini" data-del="${esc(o.id)}">Delete</button>
      </div>
    </div>`).join('') : '<p class="empty">No orders here.</p>';
}
async function loadOrders() {
  if (!SB) return false;
  const r = await rpc('admin_list', { p_pw: adminPw });
  if (!r.ok) { showLogin(); return false; }
  ORDERS = await r.json();
  $('#loginCard').hidden = true; $('#panel').hidden = false;
  renderOrders();
  return true;
}
async function loadAll() { const ok = await loadOrders(); if (ok) await loadStock(); return ok; }

/* confirming (or delivering) an order takes 1+ off the stock; rejecting / pending puts it back */
async function syncStock(o, status) {
  const items = (o.items || []).map(i => ({ id: i.id || NAME2ID[String(i.name || '').trim().toLowerCase()], qty: Math.max(1, +i.qty || 1) })).filter(i => i.id);
  if (!items.length) return;
  const deduct = status === 'confirmed' || status === 'delivered';
  try {
    const r = await rpc('admin_apply_order_stock', { p_pw: adminPw, p_order_id: String(o.id), p_items: items, p_deduct: deduct });
    if (!r.ok) { toast('Status saved, but stock was not updated (run stock.sql)'); return; }
    const j = await r.json();
    if (j.changed) toast(deduct ? 'Stock updated' : 'Stock put back');
  } catch { toast('Status saved, but stock was not updated'); }
}

$('#filters').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; FILTER = b.dataset.f; renderOrders(); });
$('#orders').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.s) {
    const o = ORDERS.find(x => String(x.id) === b.dataset.id);
    await rpc('admin_set_status', { p_pw: adminPw, p_id: b.dataset.id, p_status: b.dataset.s });
    if (o) await syncStock(o, b.dataset.s);
  } else if (b.dataset.del) { if (!confirm('Delete this order?')) return; await rpc('admin_delete', { p_pw: adminPw, p_id: b.dataset.del }); }
  loadAll();
});

if (adminPw) loadAll();
setInterval(() => { if (adminPw && !$('#panel').hidden) loadOrders(); }, 60000);   // pick up new orders
