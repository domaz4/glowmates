const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const GM = window.GM || {};
const SB = (GM.SUPABASE_URL || '').replace(/\/$/, '');
const sbHead = (extra = {}) => ({ apikey: GM.SUPABASE_ANON_KEY, ...(String(GM.SUPABASE_ANON_KEY).startsWith('eyJ') ? { Authorization: 'Bearer ' + GM.SUPABASE_ANON_KEY } : {}), ...extra });
const rpc = (fn, body) => fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: sbHead({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
const proofUrl = f => SB + '/storage/v1/object/public/proofs/' + encodeURIComponent(f);

let adminPw = sessionStorage.getItem('gm_admin') || '';
const showLogin = () => { adminPw = ''; sessionStorage.removeItem('gm_admin'); $('#panel').hidden = true; $('#loginCard').hidden = false; };

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
  $('#loginCard').hidden = true; $('#panel').hidden = false;
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

if (adminPw) loadOrders();
