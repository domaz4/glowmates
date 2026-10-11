/* Glow Mates: spin the wheel (one spin per phone number every 24 hours).
   The prize is chosen on the server (spin_wheel in Supabase), this file only draws and animates it. */
(() => {
  const DEFAULT_PRIZES = [
    { idx: 0, label_en: 'Better luck', label_ar: 'حظ أوفر', kind: 'none' },
    { idx: 1, label_en: '10% OFF', label_ar: 'خصم 10%', kind: 'percent' },
    { idx: 2, label_en: 'Better luck', label_ar: 'حظ أوفر', kind: 'none' },
    { idx: 3, label_en: '50 EGP OFF', label_ar: 'خصم 50 ج.م', kind: 'amount' },
    { idx: 4, label_en: 'Better luck', label_ar: 'حظ أوفر', kind: 'none' },
    { idx: 5, label_en: '20% OFF', label_ar: 'خصم 20%', kind: 'percent' },
    { idx: 6, label_en: 'FREE CANDLE', label_ar: 'شمعة مجانية', kind: 'free_candle' },
    { idx: 7, label_en: '5% OFF', label_ar: 'خصم 5%', kind: 'percent' }
  ];
  const COLORS = ['#F49A6B', '#F4B9BE', '#E9CFA0', '#F6C177'];
  const NEUTRAL = '#F3E5D6';
  let prizes = DEFAULT_PRIZES, rot = 0, spinning = false;

  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { } }
  };
  const nextAt = () => +store.get('gm_next') || 0;
  const label = p => (LANG === 'ar' ? p.label_ar : p.label_en);
  const hms = ms => {
    const s = Math.ceil(ms / 1000);
    return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
  };
  const rad = d => d * Math.PI / 180;

  function drawWheel() {
    const n = prizes.length, a = 360 / n, R = 100, out = [];
    prizes.forEach((p, i) => {
      const a1 = i * a, a2 = (i + 1) * a;
      const x1 = R * Math.sin(rad(a1)), y1 = -R * Math.cos(rad(a1)), x2 = R * Math.sin(rad(a2)), y2 = -R * Math.cos(rad(a2));
      const txt = label(p), size = txt.length <= 8 ? 10 : txt.length <= 11 ? 8.5 : 7.5;
      out.push(`<path d="M0 0 L${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${a > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${p.kind === 'none' ? NEUTRAL : COLORS[i % COLORS.length]}" stroke="#fff7ef" stroke-width="1.5"/>`);
      out.push(`<text transform="rotate(${(a1 + a / 2).toFixed(2)}) translate(0 -62) rotate(-90)" text-anchor="middle" dominant-baseline="central" font-size="${size}" font-weight="700" fill="${p.kind === 'none' ? '#8a6a55' : '#2a1710'}">${esc(txt)}</text>`);
    });
    $('#wheelG').innerHTML = out.join('');
  }

  async function loadPrizes() {
    if (!SB) return;
    try {
      const r = await rpc('wheel_config', {}); const j = await r.json();
      if (r.ok && Array.isArray(j) && j.length >= 2) { prizes = j; drawWheel(); }
    } catch { }
  }

  /* countdown on the button + inside the popup */
  function tickUI() {
    const left = Math.max(0, nextAt() - Date.now());
    const fab = $('#wheelFab'), txt = $('#wheelFabTxt');
    fab.classList.toggle('ready', left === 0);
    txt.textContent = left > 0 ? '⏳ ' + hms(left) : t('spinFab');
    $('#wheelWait').textContent = left > 0 ? t('wheelWait') + ' ' + hms(left) : '';
    if (!spinning) $('#spinBtn').disabled = left > 0;
  }
  setInterval(tickUI, 1000);

  function sparks(el) {
    const b = el.getBoundingClientRect();
    for (let i = 0; i < 40; i++) {
      const d = document.createElement('div'); d.className = 'fly';
      d.style.left = b.left + b.width / 2 + 'px'; d.style.top = b.top + b.height / 2 + 'px'; document.body.appendChild(d);
      const ang = Math.random() * 6.283, r = 80 + Math.random() * 200;
      d.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * r}px,${Math.sin(ang) * r}px) scale(0)`, opacity: 0 }], { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => d.remove();
    }
  }

  function showResult(j) {
    spinning = false;
    const box = $('#wheelWin'); box.hidden = false;
    if (j.kind === 'none') {
      $('#wwTitle').textContent = t('wheelNone');
      $('#wwCodeRow').hidden = true; $('#wwNote').textContent = '';
    } else {
      const lbl = LANG === 'ar' ? j.label_ar : j.label_en;
      $('#wwTitle').textContent = t('wheelWon') + ': ' + lbl;
      $('#wwCode').textContent = j.code; $('#wwCodeRow').hidden = false;
      const exp = j.expires ? new Date(j.expires).toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-GB') : '';
      $('#wwNote').textContent = t('wheelApplied') + (exp ? ' ' + t('wheelExp') + ' ' + exp + '.' : '');
      coupon = { code: j.code, kind: j.kind, value: j.value, label_en: j.label_en, label_ar: j.label_ar };
      saveCoupon(); renderCart();
      sparks($('#spinBtn'));
    }
    tickUI();
  }

  async function spin() {
    if (spinning) return;
    const msg = $('#wheelMsg'); msg.textContent = '';
    const phone = $('#wheelPhone').value.trim();
    if (phone.replace(/\D/g, '').length < 8) { msg.textContent = t('wheelPhoneErr'); return; }
    if (nextAt() > Date.now()) { tickUI(); return; }
    if (!SB) { msg.textContent = t('wheelErr'); return; }
    store.set('gm_wphone', phone);
    spinning = true; $('#spinBtn').disabled = true; $('#wheelWin').hidden = true;
    let j;
    try {
      const r = await rpc('spin_wheel', { p_phone: phone }); j = await r.json();
      if (!r.ok) throw new Error('rpc');
    } catch { spinning = false; msg.textContent = t('wheelErr'); tickUI(); return; }
    if (!j.ok) {
      spinning = false;
      if (j.error === 'cooldown') store.set('gm_next', Date.now() + j.wait * 1000);
      else msg.textContent = t(j.error === 'phone' ? 'wheelPhoneErr' : 'wheelErr');
      tickUI(); return;
    }
    store.set('gm_next', Date.now() + 24 * 3600 * 1000);
    const n = prizes.length, a = 360 / n;
    let pos = prizes.findIndex(p => p.idx === j.idx); if (pos < 0) pos = 0;
    const target = -(pos + 0.5) * a + (Math.random() - 0.5) * a * 0.7;     // land inside the winning slice
    rot += 360 * 5 + ((((target - rot) % 360) + 360) % 360);
    $('#wheelSvg').style.transform = `rotate(${rot}deg)`;
    setTimeout(() => showResult(j), matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 5300);
  }
  $('#spinBtn').onclick = spin;

  $('#wheelFab').onclick = () => { $('#wheelMsg').textContent = ''; openModal($('#wheelModal')); tickUI(); };
  $('#wwCopy').onclick = () => { navigator.clipboard?.writeText($('#wwCode').textContent).then(() => toast(t('copied'))).catch(() => { }); };
  $('#wheelPhone').value = store.get('gm_wphone') || '';

  /* keep wheel text in the chosen language */
  const baseSetLang = setLang;
  setLang = function (l, persist) { baseSetLang(l, persist); drawWheel(); tickUI(); };

  /* drop a saved coupon if the server says it was used or expired */
  if (coupon && SB) {
    rpc('check_coupon', { p_code: coupon.code }).then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.ok === false) { coupon = null; saveCoupon(); renderCart(); }
    }).catch(() => { });
  }

  drawWheel(); tickUI(); loadPrizes();
})();
