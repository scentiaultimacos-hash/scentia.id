/* ============================================================
   app.js — Logic Landing Page Scentia Ultimacos
   Dipakai oleh index.html
   ============================================================ */

// ---------- INIT SUPABASE CLIENT ----------
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- STATE ----------
let DATA = deepClone(DEFAULT_DATA);
let BRANDS = [];
let POSTS = [];
let allPosts = [];
let postsShown = 0;
const POSTS_PER_PAGE = 3;

const el = id => document.getElementById(id);
const waLink = text => makeWaLink(DATA.identity.whatsapp || '', text);

// ---------- RENDER ALL ----------
function renderAll() {
  const I = DATA.identity || {};

  // Navbar & Footer brand
  el('brandNameNav').textContent = I.brandName || 'Scentia';
  el('brandSubNav').textContent = I.brandSub || 'ULTIMACOS';
  el('footerBrand').textContent = I.brandName || 'Scentia';
  el('footerSub').textContent = I.brandSub || 'ULTIMACOS';
  el('footerDesc').textContent = `By King Parfum. ${(I.location || '').split(',').slice(-2).join(',').trim()}`;
  el('footerYear').textContent = `Berdiri sejak ${I.foundedYear || ''}`;
  el('footerWa').textContent = I.whatsappDisplay || '';
  el('footerEmail').textContent = I.email || '';
  el('footerAddress').textContent = I.location || '';
  el('footerHours').innerHTML = (I.hours || '').replace(' · ', '<br>');
  el('footerCopyright').textContent = I.copyright || '';

  applyLogo();
  applyHeroStyle();

  // Hero
  const H = DATA.hero || {};
  el('heroBadge').textContent = H.badge || '';
  el('heroBonus').textContent = H.bonusText || '';
  renderLettersFor(el('heroLine1'), H.line1 || '', 0);
  renderLettersFor(el('heroLine2'), H.line2 || '', 300);
  renderLettersFor(el('heroLine3'), H.line3 || '', 600);
  setupTyping(H.typing || 'Scentia Ultimacos by King Parfum');

  // Marquee
  const marqueeArr = DATA.marquee || [];
  const mHTML = marqueeArr.map(m => `<span>◆ ${esc(m)}</span>`).join('');
  el('marqueeTrack').innerHTML = `
    <div style="display:flex;gap:2rem;padding-right:2rem">${mHTML}</div>
    <div style="display:flex;gap:2rem;padding-right:2rem" aria-hidden="true">${mHTML}</div>
  `;

  // Stats
  el('statsGrid').innerHTML = (DATA.stats || []).map((s, i) => `
    <div class="reveal" style="transition-delay:${i * 0.1}s">
      <div class="counter" data-target="${s.value}" ${s.decimal ? 'data-decimal="1"' : ''} ${s.suffix ? `data-suffix="${esc(s.suffix)}"` : ''} style="font-size:clamp(1.5rem,5vw,2.5rem);font-weight:800;color:var(--primary)">0</div>
      <div style="font-size:.8rem;color:#666;margin-top:.25rem">${esc(s.label)}</div>
    </div>
  `).join('');

  // Collaboration
  el('factoryName').textContent = I.factoryName || '';
  el('factoryDesc').textContent = (DATA.collaboration && DATA.collaboration.factoryDesc) || '';
  el('marketingName').textContent = I.marketingName || '';
  el('marketingDesc').textContent = (DATA.collaboration && DATA.collaboration.marketingDesc) || '';

  // Brands
  el('brandGrid').innerHTML = BRANDS.map((b, i) => `
    <div class="reveal" style="transition-delay:${(i % 4) * 0.08}s;border-radius:16px;padding:1rem;text-align:center;background:var(--pale);border:1px solid var(--line)">
      <div style="font-weight:700;font-size:1rem;color:var(--dark)">${esc(b.name)}</div>
      <div style="font-size:.75rem;color:#666;margin-top:.25rem">${esc(b.pcs)}</div>
      <div style="font-size:.7rem;font-weight:600;margin-top:.25rem;letter-spacing:.05em;color:var(--primary)">${esc(b.type)}</div>
    </div>
  `).join('');

  // Facilities
  el('facilityGrid').innerHTML = (DATA.facilities || []).map((f, i) => `
    <div class="reveal" style="transition-delay:${(i % 3) * 0.1}s;padding:1.25rem;border-radius:16px;background:#fff;border:1px solid var(--line)">
      <div style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.25rem;margin-bottom:1rem;background:var(--pale);color:var(--primary)">
        <i class="${esc(f.icon)}"></i>
      </div>
      <h3 style="font-weight:700;font-size:1.05rem;color:var(--dark)">${esc(f.title)}</h3>
      <p style="font-size:.85rem;color:#666;margin-top:.5rem">${esc(f.desc)}</p>
    </div>
  `).join('');

  // Processes
  el('processGrid').innerHTML = (DATA.processes || []).map((p, i) => `
    <div class="reveal" style="transition-delay:${i * 0.1}s;text-align:center">
      <div style="width:56px;height:56px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:700;margin:0 auto 1rem;background:linear-gradient(135deg,var(--primary),var(--dark))">${i + 1}</div>
      <h3 style="font-weight:700;font-size:1rem;color:var(--dark)">${esc(p.title)}</h3>
      <p style="font-size:.85rem;color:#666;margin-top:.5rem">${esc(p.desc)}</p>
    </div>
  `).join('');

  // Catalog
  el('catalogGrid').innerHTML = (DATA.catalog || []).map((c, i) => {
    const badgeBg = c.badgeColor === 'gold' ? 'var(--gold-pale)' : 'rgba(47,107,79,.12)';
    const badgeColor = c.badgeColor === 'gold' ? 'var(--gold)' : 'var(--emerald)';
    return `
      <div class="reveal lightbox-trigger" style="transition-delay:${i * 0.1}s;border-radius:16px;overflow:hidden;background:#fff;border:1px solid var(--line);cursor:pointer" data-img="${esc(c.img)}">
        <div style="height:200px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--light),var(--pale));overflow:hidden">
          ${c.img ? `<img src="${esc(c.img)}" alt="${esc(c.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">` : `<i class="${esc(c.icon)}" style="font-size:3rem;color:var(--primary);opacity:.35"></i>`}
        </div>
        <div style="padding:1.25rem">
          <span style="font-size:.65rem;font-weight:700;padding:.25rem .6rem;border-radius:99px;background:${badgeBg};color:${badgeColor}">${esc(c.badge)}</span>
          <h3 style="font-weight:700;font-size:1.15rem;margin-top:.75rem;color:var(--dark)">${esc(c.title)}</h3>
          <p style="font-size:.85rem;color:#666;margin-top:.5rem">${esc(c.desc)}</p>
        </div>
      </div>
    `;
  }).join('');

  // Bonus
  const bonusTitleEl = el('bonusTitle');
  if (bonusTitleEl) bonusTitleEl.dataset.split = `Total Bonus ${DATA.bonusTotal || ''}`;
  el('bonusGrid').innerHTML = (DATA.bonuses || []).map((b, i) => `
    <div class="reveal" style="transition-delay:${i * 0.1}s;border-radius:16px;padding:1.25rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15)">
      <i class="${esc(b.icon)}" style="font-size:1.75rem;margin-bottom:.75rem;color:var(--gold-soft)"></i>
      <h3 style="font-weight:700;font-size:1.1rem;color:#fff">${esc(b.title)}</h3>
      <p style="font-size:.85rem;color:rgba(255,255,255,.7);margin-top:.5rem">${esc(b.desc)}</p>
      <div style="font-weight:700;font-size:1.1rem;margin-top:.75rem;color:var(--gold-soft)">${esc(b.price)}</div>
    </div>
  `).join('');
  el('bonusTotal').textContent = `Total Bonus: ${DATA.bonusTotal || ''}`;
  el('compBonus').textContent = DATA.bonusTotal || '';

  // Slot
  const slotPct = DATA.slots.total > 0 ? (DATA.slots.taken / DATA.slots.total) * 100 : 0;
  el('slotText').textContent = `${DATA.slots.taken} / ${DATA.slots.total}`;
  el('slotBar').style.width = slotPct + '%';
  el('stickySlot').textContent = `${DATA.slots.taken}/${DATA.slots.total}`;
  el('stickySlotBar').style.width = slotPct + '%';

  // Testimonials
  const tHTML = (DATA.testimonials || []).map(t => `
    <div style="min-width:260px;max-width:85vw;border-radius:16px;padding:1.25rem;background:var(--pale);border:1px solid var(--line)">
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
        <div style="width:40px;height:40px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;background:var(--primary)">${esc(t.initial)}</div>
        <div>
          <div style="font-weight:700;color:var(--dark)">${esc(t.brand)}</div>
          <div style="font-size:.7rem;color:#666">${esc(t.role)}</div>
        </div>
      </div>
      <p style="font-size:.85rem;color:#666">"${esc(t.text)}"</p>
      <div style="margin-top:.5rem;color:var(--gold)">★★★★★</div>
    </div>
  `).join('');
  el('testimoniTrack').innerHTML = `
    <div style="display:flex;gap:1rem;padding-right:1rem">${tHTML}</div>
    <div style="display:flex;gap:1rem;padding-right:1rem" aria-hidden="true">${tHTML}</div>
  `;

  // FAQ
  el('faqList').innerHTML = (DATA.faqs || []).map((f, i) => `
    <div class="faq-item" style="background:#fff;border-radius:12px;padding:0 1.25rem">
      <button class="faq-question">
        ${i + 1}. ${esc(f.q)} <i class="fas fa-chevron-down"></i>
      </button>
      <div class="faq-answer">${esc(f.a)}</div>
    </div>
  `).join('');

  // Paket
  el('paketGrid').innerHTML = (DATA.paket || []).map((p, i) => `
    <div class="paket-card ${p.popular ? 'popular' : ''}" style="border:1.5px solid ${p.popular ? 'var(--primary)' : 'var(--line)'};border-radius:16px;padding:1.5rem;background:#fff;position:relative">
      ${p.popular ? `<span style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);font-size:.65rem;font-weight:700;padding:.25rem .75rem;border-radius:99px;background:var(--primary);color:#fff">POPULER</span>` : ''}
      <h3 style="font-weight:700;font-size:1.25rem;color:var(--dark)">${esc(p.name)}</h3>
      <div style="font-size:2rem;font-weight:800;margin-top:.5rem;color:var(--primary)">${esc(p.pcs)} <span style="font-size:.85rem;font-weight:400;color:#999">${esc(p.unit)}</span></div>
      <div style="font-size:.85rem;color:#666;margin-top:.25rem">${esc(p.price)}</div>
      <ul style="margin-top:1rem;list-style:none">
        ${(p.features || []).map(f => `<li style="font-size:.85rem;color:#666;margin-bottom:.5rem"><i class="fas fa-check" style="color:var(--emerald);margin-right:.5rem"></i>${esc(f)}</li>`).join('')}
      </ul>
      <a href="${waLink('Halo, saya tertarik paket ' + p.wa)}" target="_blank" class="btn-primary" style="display:flex;width:100%;justify-content:center;margin-top:1.25rem;text-decoration:none">Pilih ${esc(p.name)}</a>
    </div>
  `).join('');

  // Links
  const waGeneral = `https://wa.me/${I.whatsapp || ''}`;
  el('ctaWaLink').href = waGeneral;
  el('stickyWaLink').href = waGeneral;
  el('multiWa').href = waGeneral;
  el('multiWaNum').textContent = I.whatsappDisplay || '';
  el('multiTel').href = 'tel:' + (I.whatsapp || '');
  el('multiTelNum').textContent = I.whatsappDisplay || '';
  el('multiEmail').href = 'mailto:' + (I.email || '');
  el('multiEmailAdd').textContent = I.email || '';
  el('exitWaLink').href = waLink('Halo, saya ingin konsultasi gratis 30 menit');
  el('quizWaLink').href = waLink('Halo, saya ingin konsultasi aroma rekomendasi');

  // Quick menu WA
  const qmMap = {
    bonus: 'Halo, saya ingin klaim bonus',
    moq: 'Halo, saya ingin tanya MOQ',
    design: 'Halo, saya ingin konsultasi design',
    booking: 'Halo, saya ingin booking kunjungan',
    legalitas: 'Halo, saya ingin tanya legalitas'
  };
  document.querySelectorAll('#quickMenu a[data-wa]').forEach(a => {
    a.href = waLink(qmMap[a.dataset.wa] || 'Halo Scentia');
  });

  renderSplitTitles();
  reinitAnimations();
}

// ---------- LOGO & HERO STYLE ----------
function applyLogo() {
  const L = DATA.logo || {};
  const logoHTML = L.url
    ? `<img src="${esc(L.url)}" alt="Logo" style="width:100%;height:100%;object-fit:contain">`
    : `<span style="color:var(--gold-soft);font-weight:800;font-size:1.75rem;display:flex;align-items:center;justify-content:center">S</span>`;
  const navWrap = el('logoImgWrap');
  const footWrap = el('logoImgWrapFooter');
  if (navWrap) navWrap.innerHTML = logoHTML;
  if (footWrap) footWrap.innerHTML = logoHTML;
  const textWrap = el('logoTextWrap');
  if (textWrap) textWrap.style.display = (L.showText !== false) ? 'block' : 'none';
  const size = L.size || 48;
  [navWrap, footWrap].forEach(w => {
    if (w) { w.style.width = size + 'px'; w.style.height = size + 'px'; }
  });
  const fav = el('favicon');
  if (fav && L.url) fav.href = L.url;
}

function applyHeroStyle() {
  const S = DATA.heroStyle || { overlayOpacity:25, brightness:100, blur:0, textShadow:true };
  const H = DATA.hero || {};
  const layer = el('heroImageLayer');
  if (layer && H.heroImage) {
    layer.style.backgroundImage = `url('${H.heroImage}')`;
    layer.style.opacity = '1';
    layer.style.filter = `brightness(${S.brightness || 100}%) blur(${S.blur || 0}px)`;
  } else if (layer) {
    layer.style.backgroundImage = '';
    layer.style.opacity = '0';
  }
  const overlay = el('heroOverlay');
  if (overlay) {
    const op = (S.overlayOpacity || 0) / 100;
    overlay.style.setProperty('--hero-overlay-top', (op * 0.5).toFixed(2));
    overlay.style.setProperty('--hero-overlay-mid', (op * 0.85).toFixed(2));
    overlay.style.setProperty('--hero-overlay-bot', (op * 1.4).toFixed(2));
  }
  const textWrap = el('heroTextWrap');
  if (textWrap) {
    textWrap.classList.toggle('hero-text-shadow', S.textShadow !== false);
    textWrap.classList.toggle('hero-no-shadow', S.textShadow === false);
  }
}

// ---------- ANIMASI ----------
function renderLettersFor(elm, text, delay = 0) {
  if (!elm) return;
  const isMobile = window.innerWidth < 640;
  const words = String(text).split(' ');
  let html = '';
  words.forEach((word, i) => {
    const d = (delay + i * (isMobile ? 80 : 120)) / 1000;
    html += `<span style="animation-delay:${d}s">${esc(word)}</span>`;
    if (i < words.length - 1) html += ' ';
  });
  elm.innerHTML = html;
}

function setupTyping(text) {
  const elm = el('heroTyping');
  if (!elm) return;
  const isMobile = window.innerWidth < 640;
  // Di HP: langsung tampilkan tanpa animasi
  if (isMobile) {
    elm.textContent = text;
    elm.style.borderRight = 'none';
    elm.style.whiteSpace = 'normal';
    return;
  }
  elm.textContent = text;
  elm.style.borderRight = '2px solid var(--gold-soft)';
  elm.style.whiteSpace = 'nowrap';
  elm.style.overflow = 'hidden';
  elm.style.display = 'inline-block';
  elm.style.maxWidth = '100%';
  const totalChars = [...String(text)].length || 1;
  const duration = totalChars * 38;
  elm.style.animation = `typing ${duration}ms steps(${totalChars}, end) 400ms forwards, caretBlink 800ms step-end infinite`;
  setTimeout(() => {
    elm.style.borderRight = 'none';
    elm.style.whiteSpace = 'normal';
    elm.style.overflow = 'visible';
    elm.style.animation = 'none';
    elm.style.width = 'auto';
  }, 400 + duration + 100);
}

function renderSplitTitles() {
  document.querySelectorAll('[data-split]').forEach(elm => {
    const words = (elm.dataset.split || '').split(' ');
    let html = '';
    words.forEach((w, i) => {
      html += `<span class="word" style="transition-delay:${i * 0.08}s">${esc(w)}</span> `;
    });
    elm.innerHTML = html;
  });
}

let observers = [];
function reinitAnimations() {
  // Disconnect lama
  observers.forEach(o => { try { o.disconnect(); } catch (e) {} });
  observers = [];

  // Counter
  const counters = document.querySelectorAll('.counter:not([data-animated])');
  if (counters.length) {
    const co = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.dataset.animated = '1';
        const target = parseFloat(e.target.dataset.target);
        const isDec = e.target.dataset.decimal === '1';
        const suffix = e.target.dataset.suffix || '';
        const start = performance.now();
        const dur = 1500;
        const ease = t => 1 - Math.pow(1 - t, 3);
        const tick = now => {
          const t = Math.min((now - start) / dur, 1);
          const v = target * ease(t);
          e.target.textContent = (isDec ? v.toFixed(1) : Math.floor(v)) + suffix;
          if (t < 1) requestAnimationFrame(tick);
          else e.target.textContent = (isDec ? target.toFixed(1) : target) + suffix;
        };
        requestAnimationFrame(tick);
        co.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
    observers.push(co);
  }

  // Reveal
  const reveals = document.querySelectorAll('.reveal:not(.visible)');
  if (reveals.length) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        e.target.querySelectorAll('.split-title').forEach(s => s.classList.add('visible'));
        ro.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach(elm => ro.observe(elm));
    observers.push(ro);
  }

  // Split title
  const splits = document.querySelectorAll('.split-title:not(.visible)');
  if (splits.length) {
    const so = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        so.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    splits.forEach(elm => so.observe(elm));
    observers.push(so);
  }

  // FAQ
  document.querySelectorAll('.faq-question').forEach(b => {
    if (b._bound) return;
    b._bound = true;
    b.onclick = () => {
      const item = b.parentElement;
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    };
  });

  // Lightbox
  document.querySelectorAll('.lightbox-trigger').forEach(elm => {
    if (elm._bound) return;
    elm._bound = true;
    elm.onclick = () => {
      const img = elm.dataset.img;
      if (!img) return;
      el('lightboxImg').src = img;
      el('lightbox').classList.add('open');
    };
  });
}

// ---------- BLOG ----------
function renderBlog() {
  const grid = el('blogGrid');
  if (!POSTS || POSTS.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem"><i class="fas fa-book-open" style="font-size:3rem;color:#ddd;margin-bottom:1rem"></i><p style="color:#666">Belum ada artikel.</p></div>`;
    el('loadMoreBtn').style.display = 'none';
    return;
  }
  const shown = POSTS.slice(0, postsShown);
  grid.innerHTML = shown.map(p => `
    <div class="post-card reveal" onclick="openPost(${p.id})" style="background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;cursor:pointer">
      ${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="${esc(p.title)}" loading="lazy" style="width:100%;height:200px;object-fit:cover" onerror="this.style.display='none'">` : `<div style="height:200px;background:linear-gradient(135deg,var(--light),var(--pale));display:flex;align-items:center;justify-content:center"><i class="fas fa-book-open" style="font-size:3rem;color:var(--primary);opacity:.3"></i></div>`}
      <div style="padding:1.25rem">
        <div style="font-size:.75rem;color:#666;margin-bottom:.5rem">
          <i class="far fa-calendar"></i> ${p.published_at ? new Date(p.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          <span style="margin:0 .35rem">•</span>
          <i class="far fa-user"></i> ${esc(p.author || 'Scentia Team')}
        </div>
        <h3 style="font-weight:700;font-size:1.1rem;margin-bottom:.5rem;color:var(--dark);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(p.title)}</h3>
        <p style="font-size:.85rem;color:#666;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(p.excerpt || (p.content || '').substring(0, 120))}</p>
        <div style="margin-top:.75rem;font-size:.85rem;font-weight:600;color:var(--primary)">Baca <i class="fas fa-arrow-right" style="font-size:.75rem"></i></div>
      </div>
    </div>
  `).join('');
  el('loadMoreBtn').style.display = (postsShown < POSTS.length) ? 'inline-flex' : 'none';
  reinitAnimations();
}

function loadMorePosts() {
  postsShown = Math.min(postsShown + POSTS_PER_PAGE, POSTS.length);
  renderBlog();
}

function openPost(id) {
  const p = POSTS.find(x => x.id === id);
  if (!p) return;
  el('postContent').innerHTML = `
    ${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="${esc(p.title)}" style="width:100%;max-height:400px;object-fit:cover;border-radius:16px;margin-bottom:1.5rem">` : ''}
    <div style="font-size:.75rem;color:#666;margin-bottom:.75rem;display:flex;gap:1rem;flex-wrap:wrap">
      <span><i class="far fa-calendar"></i> ${p.published_at ? new Date(p.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
      <span><i class="far fa-user"></i> ${esc(p.author || 'Scentia Team')}</span>
    </div>
    <h1 style="font-size:clamp(1.35rem,4vw,2.25rem);font-weight:800;margin-bottom:1rem;color:var(--dark);line-height:1.2">${esc(p.title)}</h1>
    <div class="post-content">${p.content || ''}</div>
    <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--line)">
      <a href="${waLink('Halo, saya baca artikel ' + p.title + ' dan ingin konsultasi')}" target="_blank" class="btn-primary" style="text-decoration:none"><i class="fab fa-whatsapp"></i> Konsultasi</a>
    </div>
  `;
  el('postModal').classList.add('open');
  el('postContent').scrollTop = 0;
}

// ---------- LOAD DATA ----------
async function loadConfig() {
  const { data, error } = await supabaseClient.from('site_config').select('*');
  if (error) { console.error('Load config error:', error); return; }
  data.forEach(row => { DATA[row.key] = row.value; });
  if (DATA.theme && typeof DATA.theme === 'string') applyTheme(DATA.theme);
}

async function loadBrands() {
  const { data, error } = await supabaseClient.from('brands').select('*').order('sort_order', { ascending: true });
  if (error) { console.error('Load brands error:', error); return; }
  BRANDS = data || [];
}

async function loadPosts() {
  const { data, error } = await supabaseClient.from('posts').select('*').order('published_at', { ascending: false, nullsFirst: false });
  if (error) { console.error('Load posts error:', error); return; }
  allPosts = data || [];
  POSTS = allPosts.filter(p => p.published);
}

// ---------- UI INTERACTIONS ----------
function bindUI() {
  // Navbar scroll
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const st = window.scrollY;
      const dh = document.documentElement.scrollHeight - window.innerHeight;
      const p = (st / dh) * 100;
      const sp = el('scroll-progress');
      if (sp) sp.style.width = p + '%';
      const nb = el('navbar');
      if (nb) nb.classList.toggle('scrolled', st > 50);
      const bt = el('backTop');
      if (bt) bt.classList.toggle('show', st > 600);
      const sc = el('stickyCta');
      if (sc) sc.classList.toggle('visible', p > 30);
      ticking = false;
    });
    ticking = true;
  }, { passive: true });

  // Mobile drawer
  el('menu-toggle').onclick = () => { el('mobileDrawer').classList.add('open'); el('overlay').classList.add('active'); };
  el('closeDrawer').onclick = () => { el('mobileDrawer').classList.remove('open'); el('overlay').classList.remove('active'); };
  el('overlay').onclick = () => { el('mobileDrawer').classList.remove('open'); el('overlay').classList.remove('active'); };
  document.querySelectorAll('.mobile-link').forEach(l => l.onclick = () => {
    el('mobileDrawer').classList.remove('open');
    el('overlay').classList.remove('active');
  });

  // FAB WA
  el('fabWa').addEventListener('click', e => {
    if (e.target.closest('.quick-menu')) return;
    el('quickMenu').classList.toggle('show');
    e.stopPropagation();
  });
  document.addEventListener('click', e => {
    if (!el('fabWa').contains(e.target)) el('quickMenu').classList.remove('show');
  });

  // Back top
  el('backTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Lightbox
  el('lightboxClose').onclick = () => el('lightbox').classList.remove('open');
  el('lightbox').onclick = e => { if (e.target === el('lightbox')) el('lightbox').classList.remove('open'); };

  // Post modal
  el('postBack').onclick = () => el('postModal').classList.remove('open');
  el('postClose').onclick = () => el('postModal').classList.remove('open');
  el('postModal').onclick = e => { if (e.target === el('postModal')) el('postModal').classList.remove('open'); };

  // ESC close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (el('postModal').classList.contains('open')) el('postModal').classList.remove('open');
      if (el('lightbox').classList.contains('open')) el('lightbox').classList.remove('open');
    }
  });

  // Countdown
  let cdT = 24 * 60 * 60;
  setInterval(() => {
    cdT--;
    const h = Math.floor(cdT / 3600);
    const m = Math.floor((cdT % 3600) / 60);
    const s = cdT % 60;
    const c = el('countdown');
    if (c) c.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, 1000);

  // Social proof
  const proofs = [
    "TWIST baru saja order 5.000 pcs",
    "HIRE SCENT baru saja order 10.000 pcs",
    "ACIL PARFUM baru saja order 20.000 pcs",
    "GHAZAL baru saja order 5.000 pcs",
    "SUPERJOSS baru saja order 10.000 pcs",
    "HYERIM baru saja order 10.000 pcs"
  ];
  let pi = 0;
  function showProof() {
    el('proofText').textContent = proofs[pi];
    el('socialProof').classList.add('show');
    setTimeout(() => el('socialProof').classList.remove('show'), 5000);
    pi = (pi + 1) % proofs.length;
  }
  setInterval(showProof, 9000);
  setTimeout(showProof, 3000);

  // Calendar
  const cal = el('calendar');
  if (cal) {
    const today = new Date();
    let selD = null, selT = null;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const day = d.getDate();
      const dn = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()];
      const isSun = d.getDay() === 0;
      const div = document.createElement('div');
      div.className = 'calendar-day' + (isSun ? ' disabled' : '');
      div.innerHTML = `${dn}<br><strong>${day}</strong>`;
      div.dataset.date = d.toISOString().split('T')[0];
      if (!isSun) div.addEventListener('click', () => {
        document.querySelectorAll('.calendar-day').forEach(x => x.classList.remove('selected'));
        div.classList.add('selected');
        selD = div.dataset.date;
      });
      cal.appendChild(div);
    }
    document.querySelectorAll('.time-slot').forEach(s => {
      s.addEventListener('click', () => {
        document.querySelectorAll('.time-slot').forEach(x => x.classList.remove('selected'));
        s.classList.add('selected');
        selT = s.dataset.time;
      });
    });
    el('bookingBtn').onclick = () => {
      if (!selD || !selT) return alert('Pilih tanggal dan waktu terlebih dahulu.');
      const msg = `Halo, saya ingin booking kunjungan pada ${selD} pukul ${selT} WIB.`;
      window.open(waLink(msg), '_blank');
    };
  }

  // Exit modal
  let shown = false;
  setTimeout(() => {
    if (!shown) {
      el('exitModal').classList.add('open');
      shown = true;
    }
  }, 15000);
  document.addEventListener('mouseleave', e => {
    if (e.clientY < 0 && !shown) {
      el('exitModal').classList.add('open');
      shown = true;
    }
  });
  el('closeExit').onclick = () => el('exitModal').classList.remove('open');
  el('closeExit2').onclick = () => el('exitModal').classList.remove('open');
  el('exitModal').onclick = e => { if (e.target === el('exitModal')) el('exitModal').classList.remove('open'); };

  // Lead form
  el('leadForm').onsubmit = e => {
    e.preventDefault();
    const inp = e.target.querySelectorAll('input, select');
    const msg = `Halo Scentia Ultimacos!%0A%0ASaya ingin klaim:%0A- 3 Sampel Aroma GRATIS%0A- E-book 7 Rahasia Brand Parfum Laris%0A%0AData:%0ANama: ${inp[0].value}%0AWhatsApp: ${inp[1].value}%0ANama Brand: ${inp[2].value}%0AKategori: ${inp[3].value}`;
    window.open(waLink(msg), '_blank');
  };

  // Quiz
  let qa = {};
  document.querySelectorAll('.quiz-option').forEach(opt => {
    opt.onclick = () => {
      const step = opt.closest('.quiz-step');
      qa[step.dataset.step] = opt.dataset.value;
      step.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      setTimeout(() => {
        step.classList.add('hidden');
        const next = document.querySelector(`.quiz-step[data-step="${parseInt(step.dataset.step) + 1}"]`);
        if (next) {
          next.classList.remove('hidden');
        } else {
          el('quizContainer').classList.add('hidden');
          el('quizResult').classList.remove('hidden');
          const rekom = {
            floral: 'Aroma Floral yang elegan dan feminin',
            fresh: 'Aroma Fresh & Aquatic yang menyegarkan',
            woody: 'Aroma Woody & Oriental yang maskulin',
            sweet: 'Aroma Sweet & Gourmand yang manis'
          };
          el('quizResultText').textContent = `Berdasarkan jawaban Anda, kami merekomendasikan ${rekom[qa['1']] || 'aroma spesial'} dengan estimasi harga mulai Rp 15.000/pcs.`;
        }
      }, 260);
    };
  });

  // Quick nav
  document.querySelectorAll('.quick-nav a').forEach(a => {
    a.onclick = function () {
      document.querySelectorAll('.quick-nav a').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
    };
  });

  // Load more
  const lm = el('loadMoreBtn');
  if (lm) lm.onclick = loadMorePosts;
}

// ---------- INIT ----------
async function init() {
  bindUI();
  await Promise.all([loadConfig(), loadBrands(), loadPosts()]);
  postsShown = Math.min(POSTS_PER_PAGE, POSTS.length);
  renderAll();
  renderBlog();
  renderSplitTitles();
  reinitAnimations();
}

// Expose
window.openPost = openPost;
window.loadMorePosts = loadMorePosts;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}