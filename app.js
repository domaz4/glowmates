const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IMG = { creamy: 'images/creamy.jpg', sea: 'images/sea.jpg', sakura: 'images/sakura.jpg' };
let PRODUCTS = { creamy: { name: 'Creamy Dunes', price: 295 }, sea: { name: 'Sea Yeah', price: 290 }, sakura: { name: 'Sakura Whisper', price: 300 } };
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

/* ---------- language (EN / AR) ---------- */
const I18N = {
  en: {
    title: 'Glow Mates — Massage Candles',
    desc: 'Soy wax massage candles. Melt, massage, relax. Creamy Dunes, Sea Yeah, Sakura Whisper.',
    sound: 'Ambient sound', tapSound: 'Tap anywhere to turn on the sound 🔊', shopH: 'Our candles', view: 'Quick view', cart: 'Cart', openCart: 'Open cart', close: 'Close', less: 'Less', more: 'More', jar: 'Light the candle',
    tag: 'Soy wax candles that melt into warm massage oil.', pick: 'Pick your scent',
    melt: 'Melt.', massage: 'Massage.', relax: 'Relax.',
    'creamy.name': 'Creamy Dunes', 'creamy.scent': 'Coconut, vanilla bean',
    'creamy.blurb': 'Warm sand, toasted coconut and soft vanilla. Light it, wait for the pool to melt, then pour it on skin.',
    'sea.name': 'Sea Yeah', 'sea.scent': 'Mango, passion fruit, pineapple, coconut',
    'sea.blurb': 'Sunset on a beach you wish you were on. Bright fruit up top, coconut underneath.',
    'sakura.name': 'Sakura Whisper', 'sakura.scent': 'Cherry blossom, rose',
    'sakura.blurb': 'Soft florals for two. The one people buy for date night.',
    made1: 'Soy wax', made2: 'Shea butter', made3: 'Sweet almond oil', made4: 'Skin-safe fragrance',
    noteL: 'Note for this candle', notePh: 'Gift message, wick preference, anything we should know', add: 'Add to cart',
    lightH: 'Light it', lightP: 'Tap the wick. Watch the wax turn to warm oil.', unlit: 'Unlit',
    states: ['Lit. Warming up…', 'Pool forming…', 'Almost ready…', 'Melted. Pour and massage.'],
    howH: 'How it works',
    how1b: 'Light it.', how1: 'Let the wax pool melt for 15 minutes.',
    how2b: 'Blow it out.', how2: 'Wait a minute so it is warm, not hot.',
    how3b: 'Pour and massage.', how3: 'The melted wax turns into a silky oil.',
    pay: 'Order here, pay by Instapay, upload your screenshot. We confirm and deliver.',
    foot: 'Glow Mates. Melt. Massage. Relax.',
    cartTitle: 'Your cart', total: 'Total', checkout: 'Checkout', empty: 'Your cart is empty. Pick a candle.',
    notePhShort: 'Note', remove: 'Remove', egp: 'EGP', added: n => `${n} added`,
    step1: 'Delivery', step2: 'Payment', deliverH: 'Where should we deliver?',
    fullName: 'Full name', phone: 'Phone number', address: 'Address', addrPh: 'Street, building, floor, city',
    cont: 'Continue to payment', payH: 'Pay with Instapay', send: 'Send', to: 'to', copy: 'Copy', copied: 'Copied',
    upload: 'Upload your payment screenshot', back: 'Back', sendOrder: 'Send order', sending: 'Sending…',
    doneH: 'Order sent', doneA: 'Order', doneB: 'We will check your payment and message you on your phone.', backBtn: 'Back to the candles',
    errShot: 'Upload your payment screenshot first.', errNoSb: 'Store is not connected yet (config.js).',
    errUp: 'Could not upload the screenshot. Try a smaller image.', errOrder: 'Could not place the order. Check your cart and try again.'
  },
  ar: {
    title: 'Glow Mates — شموع التدليك',
    desc: 'شموع تدليك من شمع الصويا. ذوّب، دلّك، استرخِ. كريمي ديونز، سي ياه، ساكورا ويسبر.',
    sound: 'الصوت', tapSound: 'المس الشاشة لتشغيل الصوت 🔊', shopH: 'شموعنا', view: 'نظرة سريعة', cart: 'السلة', openCart: 'افتح السلة', close: 'إغلاق', less: 'أقل', more: 'أكثر', jar: 'أشعل الشمعة',
    tag: 'شموع صويا تتحول إلى زيت تدليك دافئ.', pick: 'اختر رائحتك',
    melt: 'ذوّب.', massage: 'دلّك.', relax: 'استرخِ.',
    'creamy.name': 'كريمي ديونز', 'creamy.scent': 'جوز الهند، حبوب الفانيليا',
    'creamy.blurb': 'رمال دافئة وجوز هند محمّص وفانيليا ناعمة. أشعلها، انتظر حتى تذوب الشمعة، ثم اسكبها على بشرتك.',
    'sea.name': 'سي ياه', 'sea.scent': 'مانجو، فاكهة العاطفة، أناناس، جوز الهند',
    'sea.blurb': 'غروب الشمس على شاطئ تتمنى أن تكون فيه. فاكهة منعشة في الأعلى وجوز هند في العمق.',
    'sakura.name': 'ساكورا ويسبر', 'sakura.scent': 'زهر الكرز، ورد',
    'sakura.blurb': 'زهور ناعمة لشخصين. الاختيار الأول للّيالي الرومانسية.',
    made1: 'شمع الصويا', made2: 'زبدة الشيا', made3: 'زيت اللوز الحلو', made4: 'عطر آمن للبشرة',
    noteL: 'ملاحظة لهذه الشمعة', notePh: 'رسالة إهداء، تفضيل الفتيل، أي شيء تود إخبارنا به', add: 'أضف إلى السلة',
    lightH: 'أشعلها', lightP: 'المس الفتيل. شاهد الشمع يتحول إلى زيت دافئ.', unlit: 'مطفأة',
    states: ['مشتعلة. جارٍ التسخين…', 'تتكوّن البركة…', 'على وشك الجاهزية…', 'ذابت. اسكبها ودلّك.'],
    howH: 'طريقة الاستخدام',
    how1b: 'أشعلها.', how1: 'اترك بركة الشمع تذوب لمدة 15 دقيقة.',
    how2b: 'أطفئها.', how2: 'انتظر دقيقة حتى تصبح دافئة وليست ساخنة.',
    how3b: 'اسكب ودلّك.', how3: 'يتحول الشمع الذائب إلى زيت ناعم كالحرير.',
    pay: 'اطلب من هنا، وادفع عبر إنستاباي، وارفع لقطة الشاشة. نؤكد الطلب ونوصّله لك.',
    foot: 'Glow Mates. ذوّب. دلّك. استرخِ.',
    cartTitle: 'سلتك', total: 'الإجمالي', checkout: 'إتمام الطلب', empty: 'سلتك فارغة. اختر شمعة.',
    notePhShort: 'ملاحظة', remove: 'إزالة', egp: 'جنيه', added: n => `تمت إضافة ${n}`,
    step1: 'التوصيل', step2: 'الدفع', deliverH: 'أين نوصّل طلبك؟',
    fullName: 'الاسم بالكامل', phone: 'رقم الهاتف', address: 'العنوان', addrPh: 'الشارع، المبنى، الدور، المدينة',
    cont: 'المتابعة إلى الدفع', payH: 'الدفع عبر إنستاباي', send: 'أرسل', to: 'إلى', copy: 'نسخ', copied: 'تم النسخ',
    upload: 'ارفع لقطة شاشة الدفع', back: 'رجوع', sendOrder: 'إرسال الطلب', sending: 'جارٍ الإرسال…',
    doneH: 'تم إرسال الطلب', doneA: 'طلب رقم', doneB: 'سنراجع الدفع ونراسلك على هاتفك.', backBtn: 'العودة إلى الشموع',
    errShot: 'ارفع لقطة شاشة الدفع أولًا.', errNoSb: 'المتجر غير متصل بعد (config.js).',
    errUp: 'تعذّر رفع لقطة الشاشة. جرّب صورة أصغر.', errOrder: 'تعذّر إرسال الطلب. راجع السلة وحاول مرة أخرى.'
  }
};
let LANG = 'en';
const t = k => I18N[LANG][k];
const pname = id => t(id + '.name');

/* headlines: letters animate one by one in English, word by word in Arabic (Arabic letters must stay joined) */
function splitText(h, txt) {
  h.setAttribute('aria-label', txt); h.textContent = '';
  const ar = LANG === 'ar';
  (ar ? txt.split(' ') : [...txt]).forEach((c, i) => {
    const s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', ar ? i * 4 : i); s.innerHTML = c === ' ' ? '&nbsp;' : esc(c); h.appendChild(s);
    if (ar) h.appendChild(document.createTextNode(' '));
  });
}
function setLang(l, persist = true) {
  LANG = l; const D = I18N[l], de = document.documentElement;
  de.lang = l; de.dir = l === 'ar' ? 'rtl' : 'ltr';
  if (persist) { try { localStorage.setItem('gm_lang', l); } catch { } }
  $$('[data-i18n]').forEach(el => { const v = D[el.dataset.i18n]; if (v === undefined) return; el.classList.contains('split') ? splitText(el, v) : (el.textContent = v); });
  $$('[data-i18n-ph]').forEach(el => el.placeholder = D[el.dataset.i18nPh]);
  $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', D[el.dataset.i18nAria]));
  $('.track').innerHTML = Array(4).fill([D.melt, D.massage, D.relax]).flat().map(w => `<span>${esc(w)}</span>`).join('');
  $$('[data-price]').forEach(el => { el.textContent = PRODUCTS[el.dataset.price].price + ' ' + D.egp; });
  fillQuick();
  $('#langBtn').textContent = l === 'ar' ? 'English' : 'العربية';
  renderSoundBtn();
  document.title = D.title; $('meta[name=description]').content = D.desc;
  if (!$('#jar').classList.contains('lit')) $('#lstate').textContent = D.unlit;
  $('#cartTotal').textContent = total() + ' ' + D.egp;
  renderCart();
}
$$('[data-lang]').forEach(b => b.onclick = () => { setLang(b.dataset.lang); openModal($('#langPick'), false); });
$('#langBtn').onclick = () => setLang(LANG === 'ar' ? 'en' : 'ar');

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

/* ---------- shop grid + quick view ---------- */
const TONE = { creamy: ['#E9CFA0', '#3a2410'], sea: ['#F49A6B', '#3b1608'], sakura: ['#F4B9BE', '#3a1420'] };
let qvId = null;
function fillQuick() {
  if (!qvId) return;
  const card = $('#quick .card'); card.style.background = TONE[qvId][0]; card.style.color = TONE[qvId][1];
  $('#qvImg').src = IMG[qvId]; $('#qvImg').alt = pname(qvId);
  $('#qvScent').textContent = t(qvId + '.scent'); $('#qvName').textContent = pname(qvId); $('#qvBlurb').textContent = t(qvId + '.blurb');
  $('#qvPrice').textContent = PRODUCTS[qvId].price + ' ' + t('egp');
}
function openQuick(id) {
  qvId = id; $('#qvQty').textContent = 1; $('#qvNote').value = '';
  fillQuick(); openModal($('#quick')); curSnd = id; updateSound();   // the candle's sound plays while its quick view is open
}
$('#shop').addEventListener('click', e => {
  const card = e.target.closest('.pcard'); if (!card) return;
  const id = card.dataset.id, qa = e.target.closest('.qa');
  if (qa) { addLine(id, 1, ''); fly(qa); toast(t('added')(pname(id))); } else openQuick(id);
});
$$('#quick .qty button').forEach(b => b.onclick = () => { const o = $('#qvQty'); o.textContent = Math.max(1, Math.min(50, +o.textContent + +b.dataset.q)); });
$('#qvAdd').onclick = e => {
  addLine(qvId, +$('#qvQty').textContent, $('#qvNote').value.trim());
  fly(e.currentTarget); toast(t('added')(pname(qvId))); openModal($('#quick'), false);
};
new MutationObserver(() => { if (!$('#quick').classList.contains('on')) { qvId = null; curSnd = null; updateSound(); } }).observe($('#quick'), { attributes: true, attributeFilter: ['class'] });
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
  $('#cartTotal').textContent = total() + ' ' + t('egp');
  $('#checkoutBtn').disabled = !cart.length;
  const box = $('#lines');
  if (!cart.length) { box.innerHTML = `<p class="empty">${esc(t('empty'))}</p>`; return; }
  box.innerHTML = cart.map((l, i) => `
    <div class="line-item">
      <img src="${IMG[l.id]}" alt="">
      <div>
        <h4>${esc(pname(l.id))}</h4>
        <div class="qty"><button data-i="${i}" data-d="-1" aria-label="${esc(t('less'))}">−</button><output>${l.qty}</output><button data-i="${i}" data-d="1" aria-label="${esc(t('more'))}">+</button></div>
        <textarea rows="1" data-n="${i}" placeholder="${esc(t('notePhShort'))}" maxlength="300">${esc(l.note)}</textarea>
      </div>
      <div><b>${PRODUCTS[l.id].price * l.qty}</b><br><button class="rm" data-rm="${i}">${esc(t('remove'))}</button></div>
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
  $('#paySummary').innerHTML = cart.map(l => `<div><span>${l.qty} × ${esc(pname(l.id))}${l.note ? `<small>${esc(l.note)}</small>` : ''}</span><b>${PRODUCTS[l.id].price * l.qty}</b></div>`).join('');
  $('#payTotal').textContent = total() + ' ' + t('egp');
  $('#instaAddr').textContent = INSTAPAY;
  $('#step1').hidden = true; $('#step2').hidden = false; $('#err').textContent = '';
  $('#s1').className = ''; $('#s2').className = 'on';
};
$('#back').onclick = () => { $('#step2').hidden = true; $('#step1').hidden = false; $('#s1').className = 'on'; $('#s2').className = ''; };
$('#copyInsta').onclick = () => { navigator.clipboard?.writeText(INSTAPAY).then(() => toast(t('copied'))).catch(() => {}); };
$('#shot').onchange = e => {
  const f = e.target.files[0], p = $('#shotPrev');
  if (!f) { p.hidden = true; return; }
  p.src = URL.createObjectURL(f); p.hidden = false;
};
$('#step2').onsubmit = async e => {
  e.preventDefault();
  const f = $('#shot').files[0];
  if (!f) { $('#err').textContent = t('errShot'); return; }
  if (!SB) { $('#err').textContent = t('errNoSb'); return; }
  const btn = $('#send'); btn.disabled = true; btn.textContent = t('sending'); $('#err').textContent = '';
  try {
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    const file = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('') + '.' + ext;
    const up = await fetch(SB + '/storage/v1/object/proofs/' + file, { method: 'POST', headers: sbHead({ 'Content-Type': f.type || 'image/jpeg' }), body: f });
    if (!up.ok) throw new Error(t('errUp'));
    const r = await rpc('place_order', { p_name: details.name, p_phone: details.phone, p_address: details.address, p_items: cart, p_shot: file });
    const j = await r.json();
    if (!r.ok) throw new Error(t('errOrder'));
    cart = []; save(); e.target.reset(); $('#step1').reset(); $('#shotPrev').hidden = true;
    $('#step2').hidden = true; $('.steps').hidden = true; $('#done').hidden = false; $('#doneId').textContent = j.id; setTimeout(burst, 150);
  } catch (er) { $('#err').textContent = er.message; }
  btn.disabled = false; btn.textContent = t('sendOrder');
};

/* ---------- ambient sound per candle ---------- */
const SND = { creamy: 'dunes.mp3', sea: 'sea.mp3', sakura: 'sakura.mp3' };
const SND_VOL = .8;
const aud = {}, vol = {}, gains = {};
let soundOn = false, curSnd = null, fading = false, ctx = null, acted = false, ctxTried = false;
Object.entries(SND).forEach(([id, src]) => {
  const a = new Audio(src); a.loop = true; a.preload = 'none'; vol[id] = 0; aud[id] = a;
  a.addEventListener('ended', () => { a.currentTime = 0; if (soundOn && curSnd === id) a.play().catch(() => { }); });
});
/* Web Audio gives real volume control on phones (audio.volume is ignored on iPhone, which made the sounds mix) */
function initAudio() {
  if (ctxTried || !acted) return; ctxTried = true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    for (const id in aud) {
      const g = ctx.createGain(); g.gain.value = 0;
      ctx.createMediaElementSource(aud[id]).connect(g); g.connect(ctx.destination);
      aud[id].volume = 1; gains[id] = g;
    }
  } catch { }
}
function applyVol(id, v) { vol[id] = v; if (gains[id]) gains[id].gain.value = v; else aud[id].volume = v; }
function renderSoundBtn() {
  const b = $('#soundBtn'); if (!b) return;
  b.textContent = soundOn ? '🔊' : '🔇'; b.setAttribute('aria-pressed', soundOn); b.setAttribute('aria-label', t('sound')); b.title = t('sound');
}
function fadeStep() {
  let busy = false;
  for (const id in aud) {
    const a = aud[id], target = soundOn && curSnd === id ? SND_VOL : 0, cur = vol[id], d = target - cur;
    if (Math.abs(d) > .015) { applyVol(id, Math.max(0, Math.min(1, cur + Math.sign(d) * .015))); busy = true; }
    else applyVol(id, target);
    if (target === 0 && vol[id] === 0 && !a.paused) a.pause();
  }
  if (busy) requestAnimationFrame(fadeStep); else fading = false;
}
function updateSound() {
  initAudio();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => { });
  for (const id in aud) { if (soundOn && curSnd === id && aud[id].paused) { applyVol(id, vol[id]); aud[id].play().catch(() => { }); } }
  if (!fading) { fading = true; requestAnimationFrame(fadeStep); }
}
function setSound(on, persist = true) {
  acted = true; soundOn = on; renderSoundBtn(); $('#soundBtn').classList.remove('pulse');
  if (persist) { try { localStorage.setItem('gm_sound', on ? 'on' : 'off'); } catch { } }
  updateSound();
}
$('#soundBtn').onclick = () => setSound(!soundOn);
const quietIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { curSnd = null; updateSound(); } }), { rootMargin: '-50% 0px -50% 0px' });
$$('#hero,#light,.how,.foot').forEach(el => quietIO.observe(el));
document.addEventListener('visibilitychange', () => { if (document.hidden) Object.values(aud).forEach(a => a.pause()); else updateSound(); });
{
  let pref = null; try { pref = localStorage.getItem('gm_sound'); } catch { }
  if (pref !== 'off') {
    // sound is ON by default; browsers only allow audio after a real tap/click/key, so every one retries
    soundOn = true; renderSoundBtn();
    ['pointerup', 'keydown', 'touchend', 'click'].forEach(e => addEventListener(e, () => { acted = true; updateSound(); }, { passive: true }));
    updateSound();
    // if a candle is on screen but nothing is playing yet, remind the visitor to tap
    const hint = setInterval(() => {
      if (!soundOn) return clearInterval(hint);
      if (Object.values(aud).some(a => !a.paused)) return clearInterval(hint);
      if (curSnd) toast(t('tapSound'));
    }, 5000);
  }
}

{
  let saved = null; try { saved = localStorage.getItem('gm_lang'); } catch { }
  setLang(saved === 'ar' ? 'ar' : 'en', false);
  if (saved !== 'ar' && saved !== 'en') openModal($('#langPick'));
}

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
  const states = () => t('states');
  jar.onclick = () => {
    const lit = !jar.classList.contains('lit');
    jar.classList.toggle('lit', lit); jar.setAttribute('aria-pressed', lit);
    clearInterval(timer);
    if (lit) {
      pct = 0;
      timer = setInterval(() => { pct = Math.min(100, pct + 1); $('#meltfill').style.width = pct + '%'; $('#lstate').textContent = states()[Math.min(3, Math.floor(pct / 34))]; if (pct >= 100) clearInterval(timer); }, 100);
      $('#lstate').textContent = states()[0];
    } else { $('#meltfill').style.width = '0'; $('#lstate').textContent = t('unlit'); }
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
