/* ============================================================
   admin.js — Logic Admin Panel Scentia Ultimacos
   Dipakai oleh admin.html
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
let session = null;

// History undo/redo
const HISTORY_LIMIT = 20;
let historyStack = [];
let historyIndex = -1;
let isRestoring = false;
let historyDebounceTimer = null;
let dirtyTimer = null;

// Cache render tab
const tabCache = {};

// Shortcut
const el = id => document.getElementById(id);
const waLink = text => makeWaLink(DATA.identity.whatsapp || '', text);

// ---------- TOAST ----------
function toast(msg) {
  const t = el('adminToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- LOAD DATA ----------
async function loadConfig() {
  const { data, error } = await supabaseClient.from('site_config').select('*');
  if (error) { console.error('Load config error:', error); return; }
  data.forEach(row => { DATA[row.key] = row.value; });
  if (DATA.theme && typeof DATA.theme === 'string') applyTheme(DATA.theme);
}

async function loadBrands() {
  const { data, error } = await supabaseClient
    .from('brands').select('*').order('sort_order', { ascending: true });
  if (error) { console.error('Load brands error:', error); return; }
  BRANDS = data || [];
}

async function loadPosts() {
  const { data, error } = await supabaseClient
    .from('posts').select('*')
    .order('published_at', { ascending: false, nullsFirst: false });
  if (error) { console.error('Load posts error:', error); return; }
  allPosts = data || [];
  POSTS = allPosts.filter(p => p.published);
}

// ---------- HISTORY UNDO/REDO ----------
function snapshotState() {
  return {
    DATA: deepClone(DATA),
    BRANDS: deepClone(BRANDS),
    timestamp: Date.now()
  };
}

function pushHistory() {
  if (isRestoring) return;
  clearTimeout(historyDebounceTimer);
  historyDebounceTimer = setTimeout(() => {
    const snapshot = snapshotState();
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(snapshot);
    if (historyStack.length > HISTORY_LIMIT) {
      historyStack.shift();
    } else {
      historyIndex++;
    }
    updateUndoRedoButtons();
  }, 1500);
}

// Tandai perubahan — debounce lebih lama
function markDirty() {
  clearTimeout(dirtyTimer);
  dirtyTimer = setTimeout(() => pushHistory(), 1800);
}

function updateUndoRedoButtons() {
  const undoBtn = el('adminUndoBtn');
  const redoBtn = el('adminRedoBtn');
  if (undoBtn) {
    undoBtn.disabled = historyIndex <= 0;
    undoBtn.style.opacity = historyIndex <= 0 ? '0.4' : '1';
    undoBtn.style.cursor = historyIndex <= 0 ? 'not-allowed' : 'pointer';
  }
  if (redoBtn) {
    redoBtn.disabled = historyIndex >= historyStack.length - 1;
    redoBtn.style.opacity = historyIndex >= historyStack.length - 1 ? '0.4' : '1';
    redoBtn.style.cursor = historyIndex >= historyStack.length - 1 ? 'not-allowed' : 'pointer';
  }
}

async function undo() {
  if (historyIndex <= 0) return toast('Tidak ada yang bisa di-undo');
  historyIndex--;
  await restoreFromHistory();
  toast('Undo ✓');
}

async function redo() {
  if (historyIndex >= historyStack.length - 1) return toast('Tidak ada yang bisa di-redo');
  historyIndex++;
  await restoreFromHistory();
  toast('Redo ✓');
}

async function restoreFromHistory() {
  if (historyIndex < 0 || historyIndex >= historyStack.length) return;
  isRestoring = true;
  const snapshot = historyStack[historyIndex];
  DATA = deepClone(snapshot.DATA);
  BRANDS = deepClone(snapshot.BRANDS);
  if (DATA.theme) applyTheme(DATA.theme);
  renderAdmin();
  updateUndoRedoButtons();
  isRestoring = false;
}

// ---------- AUTH ----------
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  session = data.session;
}

async function adminLoginSubmit() {
  const email = el('adminEmail').value.trim();
  const pass = el('adminPass').value;
  if (!email || !pass) return toast('Isi email & password');
  el('adminLoginBtn').disabled = true;
  el('adminLoginBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  el('adminLoginBtn').disabled = false;
  el('adminLoginBtn').innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
  if (error) return toast('Login gagal: ' + error.message);
  session = data.session;
  el('adminUser').textContent = session.user.email;
  el('adminLogin').style.display = 'none';
  el('adminPanel').style.display = 'flex';
  renderAdmin();
  toast('Login berhasil ✨');
}

async function adminLogout() {
  await supabaseClient.auth.signOut();
  session = null;
  el('adminOverlay').classList.remove('open');
  toast('Logout');
}

// ---------- TABS ----------
const TABS = [
  { id:'theme', icon:'fas fa-palette', label:'Tema' },
  { id:'hero', icon:'fas fa-star', label:'Hero & Foto' },
  { id:'logo', icon:'fas fa-image', label:'Logo' },
  { id:'identity', icon:'fas fa-building', label:'Identitas' },
  { id:'stats', icon:'fas fa-chart-line', label:'Statistik' },
  { id:'brands', icon:'fas fa-tags', label:'Brand' },
  { id:'facilities', icon:'fas fa-flask', label:'Fasilitas' },
  { id:'processes', icon:'fas fa-list-ol', label:'Proses' },
  { id:'catalog', icon:'fas fa-images', label:'Katalog' },
  { id:'blog', icon:'fas fa-book-open', label:'Blog' },
  { id:'media', icon:'fas fa-photo-video', label:'Media' },
  { id:'bonuses', icon:'fas fa-gift', label:'Bonus' },
  { id:'testimonials', icon:'fas fa-comments', label:'Testimoni' },
  { id:'faqs', icon:'fas fa-question-circle', label:'FAQ' },
  { id:'paket', icon:'fas fa-box', label:'Paket' },
  { id:'marquee', icon:'fas fa-scroll', label:'Marquee' },
  { id:'backup', icon:'fas fa-database', label:'Backup' }
];
let activeTab = 'theme';

// ---------- OPEN/CLOSE ADMIN ----------
async function openAdmin() {
  el('adminOverlay').classList.add('open');
  if (!session) await checkSession();
  if (session) {
    el('adminLogin').style.display = 'none';
    el('adminPanel').style.display = 'flex';
    el('adminUser').textContent = session.user.email;
    renderAdmin();
  } else {
    el('adminLogin').style.display = 'block';
    el('adminPanel').style.display = 'none';
    setTimeout(() => el('adminEmail').focus(), 100);
  }
}

function closeAdmin() {
  el('adminOverlay').classList.remove('open');
}

// ---------- RENDER ADMIN (OPTIMIZED) ----------
function renderAdmin() {
  // Render tabs hanya sekali
  if (!el('adminTabs')._rendered) {
    el('adminTabs').innerHTML = TABS.map(t => `
      <div class="admin-tab ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">
        <i class="${t.icon}"></i> <span>${t.label}</span>
      </div>
    `).join('');
    el('adminTabs').querySelectorAll('.admin-tab').forEach(t => {
      t.onclick = () => {
        if (activeTab === t.dataset.tab) return;
        activeTab = t.dataset.tab;
        el('adminTabs').querySelectorAll('.admin-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        renderTabNow();
      };
    });
    el('adminTabs')._rendered = true;
  }
  renderTabNow();
}

function renderTabNow() {
  el('adminContent').innerHTML = renderTabContent(activeTab);
  renderDynamicLists();
  if (activeTab === 'media') renderMediaManager();
  if (activeTab === 'theme') bindThemePicker();
  if (activeTab === 'hero') bindHeroStyleControls();
  bindFields();
  bindAllUploadHandlers();
  updateUndoRedoButtons();
}

// ---------- RENDER TAB CONTENT ----------
function renderTabContent(tab) {
  const D = DATA;
  const I = D.identity || {};
  const H = D.hero || {};
  const L = D.logo || {};
  const HS = D.heroStyle || { overlayOpacity:25, brightness:100, blur:0, textShadow:true };

  switch (tab) {
    case 'theme': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Tema Warna</h3>
      <p class="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5">Pilih skema warna. Berlaku di seluruh halaman.</p>
      <div class="theme-grid" id="themePicker">
        ${THEMES.map(t => {
          const c = t.colors;
          return `
            <div class="theme-card ${D.theme === t.id ? 'active' : ''}" data-theme-id="${t.id}">
              <div class="theme-swatches">
                <div class="theme-swatch" style="background:${c.primary}"></div>
                <div class="theme-swatch" style="background:${c.gold}"></div>
                <div class="theme-swatch" style="background:${c.dark}"></div>
              </div>
              <div class="theme-name">${t.name}</div>
              ${D.theme === t.id ? '<div class="text-[10px] font-bold mt-1" style="color:var(--primary)">✓ AKTIF</div>' : ''}
            </div>
          `;
        }).join('')}
      </div>
      <div class="admin-card" style="background:#fff;border:2px solid var(--primary);margin-top:1rem">
        <p class="text-xs sm:text-sm text-gray-600">Klik tema untuk apply live. Klik <strong>Simpan</strong> untuk simpan ke database.</p>
      </div>
    `;
    case 'hero': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Hero & Foto</h3>
      <p class="text-xs sm:text-sm text-gray-500 mb-4">Foto hero transparan — teks tetap terbaca di atas foto.</p>
      <div class="admin-field">
        <label class="admin-label">Foto Hero (Background)</label>
        <div class="img-upload" id="heroImgUpload">
          ${H.heroImage ? `<img src="${esc(H.heroImage)}" class="img-upload-preview" id="heroImgPreview">` : `<div class="img-upload-preview" id="heroImgPreview" style="display:flex;align-items:center;justify-content:center;color:#999;height:150px"><i class="fas fa-image text-4xl"></i></div>`}
          <input type="file" accept="image/*" id="heroImgFile">
          <div class="text-xs sm:text-sm text-gray-600"><i class="fas fa-cloud-upload-alt"></i> <strong>Klik</strong> atau drag & drop</div>
          <div class="text-[10px] sm:text-xs text-gray-400 mt-1">Auto compress WebP · 1920×1080 · hemat 60-85%</div>
          <div class="img-upload-actions">
            <button type="button" class="admin-btn admin-btn-primary" onclick="document.getElementById('heroImgFile').click()"><i class="fas fa-upload"></i> Upload</button>
            <button type="button" class="admin-btn admin-btn-ghost" onclick="openHeroMediaPicker()"><i class="fas fa-photo-video"></i> Pilih dari Media</button>
            ${H.heroImage ? `<button type="button" class="admin-btn admin-btn-danger" onclick="removeHeroImage()"><i class="fas fa-trash"></i> Hapus</button>` : ''}
          </div>
        </div>
        <div class="img-info" id="heroImgInfo" style="display:none"></div>
      </div>
      <div class="admin-card" style="background:#fff;border:2px solid var(--gold)">
        <div class="admin-card-head"><span class="admin-card-title">🎨 Pengaturan Foto Hero</span></div>
        <div class="admin-field">
          <label class="admin-label">Overlay Kegelapan: <span id="heroOpacityVal">${HS.overlayOpacity || 25}</span>%</label>
          <input type="range" min="0" max="90" value="${HS.overlayOpacity || 25}" id="heroOpacity" class="w-full">
          <div class="text-[10px] sm:text-xs text-gray-500 mt-1">0% = foto paling jelas · 90% = teks paling jelas</div>
        </div>
        <div class="admin-field">
          <label class="admin-label">Kecerahan Foto: <span id="heroBrightVal">${HS.brightness || 100}</span>%</label>
          <input type="range" min="40" max="150" value="${HS.brightness || 100}" id="heroBright" class="w-full">
        </div>
        <div class="admin-field">
          <label class="admin-label">Blur Background: <span id="heroBlurVal">${HS.blur || 0}</span>px</label>
          <input type="range" min="0" max="15" value="${HS.blur || 0}" id="heroBlur" class="w-full">
        </div>
        <div class="admin-field">
          <label class="admin-label">Text Shadow</label>
          <select class="admin-input" id="heroTextShadow">
            <option value="1" ${HS.textShadow !== false ? 'selected' : ''}>Ya — teks dengan bayangan</option>
            <option value="0" ${HS.textShadow === false ? 'selected' : ''}>Tidak — teks polos</option>
          </select>
        </div>
      </div>
      <div class="admin-card" style="background:#fff">
        <div class="admin-card-head"><span class="admin-card-title">Teks Hero</span></div>
        <div class="admin-field"><label class="admin-label">Badge</label><input class="admin-input" data-path="hero.badge" value="${esc(H.badge)}"></div>
        <div class="admin-field"><label class="admin-label">Headline 1</label><input class="admin-input" data-path="hero.line1" value="${esc(H.line1)}"></div>
        <div class="admin-field"><label class="admin-label">Headline 2 (emas)</label><input class="admin-input" data-path="hero.line2" value="${esc(H.line2)}"></div>
        <div class="admin-field"><label class="admin-label">Headline 3</label><input class="admin-input" data-path="hero.line3" value="${esc(H.line3)}"></div>
        <div class="admin-field"><label class="admin-label">Teks Typing</label><textarea class="admin-input" rows="2" data-path="hero.typing">${esc(H.typing)}</textarea></div>
        <div class="admin-field"><label class="admin-label">Teks Bonus Tombol</label><input class="admin-input" data-path="hero.bonusText" value="${esc(H.bonusText)}"></div>
      </div>
    `;
    case 'logo': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Logo Brand</h3>
      <p class="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5">Upload logo transparan (PNG/SVG).</p>
      <div class="admin-field">
        <label class="admin-label">Logo Saat Ini</label>
        <div class="img-upload" id="logoUpload">
          <div style="display:flex;justify-content:center;margin-bottom:.75rem">
            ${L.url ? `<img src="${esc(L.url)}" style="width:100px;height:100px;object-fit:contain">` : `<div style="width:100px;height:100px;display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:2.5rem;font-weight:700">S</div>`}
          </div>
          <input type="file" accept="image/*" id="logoFile">
          <div class="text-xs sm:text-sm text-gray-500"><i class="fas fa-cloud-upload-alt"></i> Klik atau drag & drop</div>
          <div class="text-[10px] sm:text-xs text-gray-400 mt-1">PNG/SVG transparan disarankan · max 400×400</div>
          <div class="img-upload-actions">
            <button type="button" class="admin-btn admin-btn-primary" onclick="document.getElementById('logoFile').click()"><i class="fas fa-upload"></i> Upload</button>
            ${L.url ? `<button type="button" class="admin-btn admin-btn-danger" onclick="removeLogo()"><i class="fas fa-trash"></i> Hapus</button>` : ''}
          </div>
        </div>
        <div class="img-info" id="logoInfo" style="display:none"></div>
      </div>
      <div class="admin-card" style="background:#fff">
        <div class="admin-card-head"><span class="admin-card-title">Pengaturan Logo</span></div>
        <div class="admin-field">
          <label class="admin-label">Tampilkan Teks Brand</label>
          <select class="admin-input" id="logoShowText">
            <option value="1" ${L.showText !== false ? 'selected' : ''}>Ya — Tampilkan nama brand</option>
            <option value="0" ${L.showText === false ? 'selected' : ''}>Tidak — Hanya logo</option>
          </select>
        </div>
        <div class="admin-field">
          <label class="admin-label">Ukuran Logo (px)</label>
          <input type="number" class="admin-input" id="logoSize" value="${L.size || 48}" min="24" max="96">
        </div>
        <button type="button" class="admin-btn admin-btn-primary" onclick="applyLogoFromInputs()"><i class="fas fa-check"></i> Terapkan</button>
      </div>
    `;
    case 'identity': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Identitas Bisnis</h3>
      <div class="admin-grid-2">
        <div class="admin-field"><label class="admin-label">Nama Brand</label><input class="admin-input" data-path="identity.brandName" value="${esc(I.brandName)}"></div>
        <div class="admin-field"><label class="admin-label">Sub Brand</label><input class="admin-input" data-path="identity.brandSub" value="${esc(I.brandSub)}"></div>
        <div class="admin-field"><label class="admin-label">Tagline</label><input class="admin-input" data-path="identity.tagline" value="${esc(I.tagline)}"></div>
        <div class="admin-field"><label class="admin-label">Nama Pabrik</label><input class="admin-input" data-path="identity.factoryName" value="${esc(I.factoryName)}"></div>
        <div class="admin-field"><label class="admin-label">Nama Marketing</label><input class="admin-input" data-path="identity.marketingName" value="${esc(I.marketingName)}"></div>
        <div class="admin-field"><label class="admin-label">Tahun Berdiri</label><input class="admin-input" data-path="identity.foundedYear" value="${esc(I.foundedYear)}"></div>
        <div class="admin-field"><label class="admin-label">Email</label><input class="admin-input" data-path="identity.email" value="${esc(I.email)}"></div>
        <div class="admin-field"><label class="admin-label">WhatsApp (62...)</label><input class="admin-input" data-path="identity.whatsapp" value="${esc(I.whatsapp)}"></div>
        <div class="admin-field"><label class="admin-label">WhatsApp Tampil</label><input class="admin-input" data-path="identity.whatsappDisplay" value="${esc(I.whatsappDisplay)}"></div>
        <div class="admin-field"><label class="admin-label">Jam Operasional</label><input class="admin-input" data-path="identity.hours" value="${esc(I.hours)}"></div>
      </div>
      <div class="admin-field"><label class="admin-label">Alamat</label><textarea class="admin-input" rows="2" data-path="identity.location">${esc(I.location)}</textarea></div>
      <div class="admin-field"><label class="admin-label">Copyright</label><input class="admin-input" data-path="identity.copyright" value="${esc(I.copyright)}"></div>
    `;
    case 'stats': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Statistik</h3>
      <div>${(D.stats || []).map((s, i) => `
        <div class="admin-card">
          <div class="admin-card-head"><span class="admin-card-title">Stat ${i + 1}</span><button class="admin-remove" onclick="removeStat(${i})"><i class="fas fa-times"></i></button></div>
          <div class="admin-grid-3">
            <div><label class="admin-label">Nilai</label><input class="admin-input" type="number" step="0.1" data-path="stats.${i}.value" value="${s.value}"></div>
            <div><label class="admin-label">Suffix</label><input class="admin-input" data-path="stats.${i}.suffix" value="${esc(s.suffix)}"></div>
            <div><label class="admin-label">Desimal?</label><select class="admin-input" data-path="stats.${i}.decimal"><option value="">Tidak</option><option value="1" ${s.decimal ? 'selected' : ''}>Ya</option></select></div>
          </div>
          <div><label class="admin-label">Label</label><input class="admin-input" data-path="stats.${i}.label" value="${esc(s.label)}"></div>
        </div>
      `).join('')}</div>
      <button class="admin-btn-add" onclick="addStat()"><i class="fas fa-plus"></i> Tambah Statistik</button>
    `;
    case 'brands': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Brand Partner</h3>
      <div id="brandsList"></div>
      <button class="admin-btn-add" onclick="addBrand()"><i class="fas fa-plus"></i> Tambah Brand</button>
    `;
    case 'facilities': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Fasilitas</h3>
      <div id="facilitiesList"></div>
      <button class="admin-btn-add" onclick="addFacility()"><i class="fas fa-plus"></i> Tambah Fasilitas</button>
    `;
    case 'processes': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Alur Kerja</h3>
      <div id="processesList"></div>
      <button class="admin-btn-add" onclick="addProcess()"><i class="fas fa-plus"></i> Tambah Langkah</button>
    `;
    case 'catalog': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Katalog</h3>
      <div id="catalogList"></div>
      <button class="admin-btn-add" onclick="addCatalog()"><i class="fas fa-plus"></i> Tambah Item</button>
    `;
    case 'blog': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Blog / Wawasan</h3>
      <div id="postsList"></div>
      <button class="admin-btn-add" onclick="editPost(null)"><i class="fas fa-plus"></i> Tulis Artikel Baru</button>
      <div id="postEditorWrap" style="display:none;margin-top:1.25rem">
        <div class="admin-card" style="background:#fff;border:2px solid var(--primary)">
          <div class="admin-card-head"><span class="admin-card-title" id="postEditorTitle">Artikel Baru</span></div>
          <div class="admin-field"><label class="admin-label">Judul</label><input class="admin-input" id="postTitle"></div>
          <div class="admin-field"><label class="admin-label">Slug</label><input class="admin-input" id="postSlug"></div>
          <div class="admin-field"><label class="admin-label">Ringkasan</label><textarea class="admin-input" id="postExcerpt" rows="2"></textarea></div>
          <div class="admin-field"><label class="admin-label">Konten (HTML)</label><textarea class="admin-input" id="postContentEditor" rows="10"></textarea></div>
          <div class="admin-grid-2">
            <div class="admin-field"><label class="admin-label">Penulis</label><input class="admin-input" id="postAuthor" value="Scentia Team"></div>
            <div class="admin-field"><label class="admin-label">Status</label><select class="admin-input" id="postPublished"><option value="">Draft</option><option value="1">Published</option></select></div>
          </div>
          <div class="admin-field">
            <label class="admin-label">Cover</label>
            <div class="img-upload" id="postImgUpload">
              <img src="" class="img-upload-preview" id="postImgPreview" style="display:none">
              <input type="file" accept="image/*" id="postImgFile">
              <div class="text-xs sm:text-sm text-gray-500"><i class="fas fa-cloud-upload-alt"></i> Upload cover</div>
            </div>
            <div class="img-info" id="postImgInfo" style="display:none"></div>
          </div>
          <input type="hidden" id="postEditingId">
          <input type="hidden" id="postCoverUrl">
          <div class="flex gap-2 mt-3 flex-wrap">
            <button class="admin-btn admin-btn-primary" onclick="savePost()"><i class="fas fa-save"></i> Simpan</button>
            <button class="admin-btn admin-btn-ghost" onclick="cancelPostEdit()">Batal</button>
          </div>
        </div>
      </div>
    `;
    case 'media': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Media Manager</h3>
      <p class="text-xs sm:text-sm text-gray-500 mb-4">Semua gambar. <span class="compress-badge">AUTO COMPRESS</span></p>
      <div class="admin-card" style="background:#fff;border:2px solid var(--primary)">
        <div class="admin-card-head"><span class="admin-card-title">Upload Baru</span></div>
        <div class="img-upload" id="mediaUpload">
          <input type="file" accept="image/*" id="mediaFileInput" multiple>
          <div class="text-xs sm:text-sm text-gray-500">
            <i class="fas fa-cloud-upload-alt text-2xl mb-2 block" style="color:var(--primary)"></i>
            <strong>Klik</strong> atau drag & drop (bisa multiple)
          </div>
          <div class="text-[10px] sm:text-xs text-gray-400 mt-2">Auto compress WebP</div>
        </div>
        <div class="img-info" id="mediaUploadInfo" style="display:none"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;flex-wrap:wrap;gap:.5rem">
        <span class="admin-card-title">Semua Gambar</span>
        <button class="admin-btn admin-btn-ghost" onclick="renderMediaManager()"><i class="fas fa-sync"></i> Refresh</button>
      </div>
      <div class="media-grid" id="mediaManagerGrid"></div>
    `;
    case 'bonuses': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Bonus</h3>
      <div class="admin-grid-3">
        <div class="admin-field"><label class="admin-label">Total Bonus</label><input class="admin-input" data-path="bonusTotal" value="${esc(D.bonusTotal)}"></div>
        <div class="admin-field"><label class="admin-label">Slot Terisi</label><input class="admin-input" type="number" data-path="slots.taken" value="${D.slots.taken}"></div>
        <div class="admin-field"><label class="admin-label">Slot Total</label><input class="admin-input" type="number" data-path="slots.total" value="${D.slots.total}"></div>
      </div>
      <div id="bonusesList"></div>
      <button class="admin-btn-add" onclick="addBonus()"><i class="fas fa-plus"></i> Tambah Bonus</button>
    `;
    case 'testimonials': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Testimoni</h3>
      <div id="testimonialsList"></div>
      <button class="admin-btn-add" onclick="addTestimonial()"><i class="fas fa-plus"></i> Tambah Testimoni</button>
    `;
    case 'faqs': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">FAQ</h3>
      <div id="faqsList"></div>
      <button class="admin-btn-add" onclick="addFaq()"><i class="fas fa-plus"></i> Tambah FAQ</button>
    `;
    case 'paket': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Paket Maklon</h3>
      <div id="paketList"></div>
      <button class="admin-btn-add" onclick="addPaket()"><i class="fas fa-plus"></i> Tambah Paket</button>
    `;
    case 'marquee': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Marquee</h3>
      <div class="admin-field"><label class="admin-label">Teks (satu per baris)</label><textarea class="admin-input" rows="10" data-path="marquee" data-type="array-lines">${(D.marquee || []).join('\n')}</textarea></div>
    `;
    case 'backup': return `
      <h3 class="font-display font-bold text-lg sm:text-xl mb-1" style="color:var(--dark)">Backup / Reset</h3>
      <div class="admin-card">
        <div class="admin-card-head"><span class="admin-card-title">Export Data</span></div>
        <button class="admin-btn admin-btn-primary" onclick="exportData()"><i class="fas fa-download"></i> Export JSON</button>
      </div>
      <div class="admin-card">
        <div class="admin-card-head"><span class="admin-card-title">Import Data</span></div>
        <button class="admin-btn admin-btn-gold" onclick="document.getElementById('adminFileInput').click()"><i class="fas fa-upload"></i> Pilih File JSON</button>
      </div>
      <div class="admin-card" style="border:2px solid #fdd;background:#fff">
        <div class="admin-card-head"><span class="admin-card-title" style="color:#c00">⚠️ Reset All (Hapus Database)</span></div>
        <p class="text-xs sm:text-sm text-gray-600 mb-3">Menghapus SEMUA data di database dan mengganti dengan data default. Tidak bisa di-undo!</p>
        <button class="admin-btn admin-btn-danger" onclick="resetAll()"><i class="fas fa-trash-restore"></i> Reset All Sekarang</button>
      </div>
    `;
  }
  return '';
}

// ---------- BIND FIELDS (OPTIMIZED) ----------
function bindFields() {
  document.querySelectorAll('#adminContent [data-path]').forEach(inp => {
    if (inp._bound) return;
    inp._bound = true;
    inp.oninput = () => {
      const path = inp.dataset.path;
      const type = inp.dataset.type;
      let val = inp.value;
      if (inp.type === 'number') val = parseFloat(val) || 0;
      if (type === 'array-lines') val = val.split('\n').filter(x => x.trim() !== '');
      if (inp.tagName === 'SELECT' && (path.endsWith('.popular') || path.endsWith('.decimal'))) {
        val = inp.value === '1';
      }
      setPath(DATA, path, val);
      markDirty();
    };
  });
  document.querySelectorAll('#adminContent [data-brand-id]').forEach(inp => {
    if (inp._bound) return;
    inp._bound = true;
    inp.oninput = () => {
      const id = inp.dataset.brandId;
      const field = inp.dataset.brandField;
      const b = BRANDS.find(x => x.id == id);
      if (b) b[field] = inp.value;
      markDirty();
    };
  });
}

// ---------- DYNAMIC LISTS ----------
function renderDynamicLists() {
  const bl = el('brandsList');
  if (bl) bl.innerHTML = BRANDS.map((b, i) => `
    <div class="admin-card">
      <div class="admin-card-head"><span class="admin-card-title">Brand ${i + 1}</span><button class="admin-remove" onclick="removeBrand('${b.id}')"><i class="fas fa-times"></i></button></div>
      <div class="admin-grid-3">
        <div><label class="admin-label">Nama</label><input class="admin-input" data-brand-id="${b.id}" data-brand-field="name" value="${esc(b.name)}"></div>
        <div><label class="admin-label">Jumlah</label><input class="admin-input" data-brand-id="${b.id}" data-brand-field="pcs" value="${esc(b.pcs)}"></div>
        <div><label class="admin-label">Tipe</label><input class="admin-input" data-brand-id="${b.id}" data-brand-field="type" value="${esc(b.type)}"></div>
      </div>
    </div>
  `).join('');

  const fl = el('facilitiesList');
  if (fl) fl.innerHTML = (DATA.facilities || []).map((f, i) => `
    <div class="admin-card">
      <div class="admin-card-head"><span class="admin-card-title">Fasilitas ${i + 1}</span><button class="admin-remove" onclick="removeFacility(${i})"><i class="fas fa-times"></i></button></div>
      <div class="admin-grid-2">
        <div><label class="admin-label">Icon</label><input class="admin-input" data-path="facilities.${i}.icon" value="${esc(f.icon)}"></div>
        <div><label class="admin-label">Judul</label><input class="admin-input" data-path="facilities.${i}.title" value="${esc(f.title)}"></div>
      </div>
      <div><label class="admin-label">Deskripsi</label><textarea class="admin-input" rows="2" data-path="facilities.${i}.desc">${esc(f.desc)}</textarea></div>
    </div>
  `).join('');

  const pl = el('processesList');
  if (pl) pl.innerHTML = (DATA.processes || []).map((p, i) => `
    <div class="admin-card">
      <div class="admin-card-head"><span class="admin-card-title">Langkah ${i + 1}</span><button class="admin-remove" onclick="removeProcess(${i})"><i class="fas fa-times"></i></button></div>
      <div><label class="admin-label">Judul</label><input class="admin-input" data-path="processes.${i}.title" value="${esc(p.title)}"></div>
      <div><label class="admin-label">Deskripsi</label><textarea class="admin-input" rows="2" data-path="processes.${i}.desc">${esc(p.desc)}</textarea></div>
    </div>
  `).join('');

  const cl = el('catalogList');
  if (cl) cl.innerHTML = (DATA.catalog || []).map((c, i) => `
    <div class="admin-card">
      <div class="admin-card-head"><span class="admin-card-title">Item ${i + 1}</span><button class="admin-remove" onclick="removeCatalog(${i})"><i class="fas fa-times"></i></button></div>
      <div class="admin-field">
        <label class="admin-label">Gambar</label>
        <div class="img-upload" data-catalog-upload="${i}" style="padding:.5rem">
          ${c.img ? `<img src="${esc(c.img)}" class="img-upload-preview" style="max-height:120px" id="catImgPreview${i}">` : `<div class="img-upload-preview" style="display:flex;align-items:center;justify-content:center;color:#999;height:120px" id="catImgPreview${i}"><i class="fas fa-image text-3xl"></i></div>`}
          <input type="file" accept="image/*" data-catalog-file="${i}">
          <div class="text-xs text-gray-500 mt-1">Klik untuk upload</div>
        </div>
        <input class="admin-input mt-2" data-path="catalog.${i}.img" value="${esc(c.img)}" placeholder="atau paste URL">
      </div>
      <div class="admin-grid-3">
        <div><label class="admin-label">Badge</label><input class="admin-input" data-path="catalog.${i}.badge" value="${esc(c.badge)}"></div>
        <div><label class="admin-label">Warna</label><select class="admin-input" data-path="catalog.${i}.badgeColor"><option value="gold" ${c.badgeColor === 'gold' ? 'selected' : ''}>Gold</option><option value="emerald" ${c.badgeColor === 'emerald' ? 'selected' : ''}>Emerald</option></select></div>
        <div><label class="admin-label">Icon</label><input class="admin-input" data-path="catalog.${i}.icon" value="${esc(c.icon)}"></div>
      </div>
      <div><label class="admin-label">Judul</label><input class="admin-input" data-path="catalog.${i}.title" value="${esc(c.title)}"></div>
      <div><label class="admin-label">Deskripsi</label><textarea class="admin-input" rows="2" data-path="catalog.${i}.desc">${esc(c.desc)}</textarea></div>
    </div>
  `).join('');

  const bol = el('bonusesList');
  if (bol) bol.innerHTML = (DATA.bonuses || []).map((b, i) => `
    <div class="admin-card">
      <div class="admin-card-head"><span class="admin-card-title">Bonus ${i + 1}</span><button class="admin-remove" onclick="removeBonus(${i})"><i class="fas fa-times"></i></button></div>
      <div class="admin-grid-2">
        <div><label class="admin-label">Icon</label><input class="admin-input" data-path="bonuses.${i}.icon" value="${esc(b.icon)}"></div>
        <div><label class="admin-label">Harga</label><input class="admin-input" data-path="bonuses.${i}.price" value="${esc(b.price)}"></div>
      </div>
      <div><label class="admin-label">Judul</label><input class="admin-input" data-path="bonuses.${i}.title" value="${esc(b.title)}"></div>
      <div><label class="admin-label">Deskripsi</label><textarea class="admin-input" rows="2" data-path="bonuses.${i}.desc">${esc(b.desc)}</textarea></div>
    </div>
  `).join('');

  const tl = el('testimonialsList');
  if (tl) tl.innerHTML = (DATA.testimonials || []).map((t, i) => `
    <div class="admin-card">
      <div class="admin-card-head"><span class="admin-card-title">Testimoni ${i + 1}</span><button class="admin-remove" onclick="removeTestimonial(${i})"><i class="fas fa-times"></i></button></div>
      <div class="admin-grid-3">
        <div><label class="admin-label">Inisial</label><input class="admin-input" data-path="testimonials.${i}.initial" value="${esc(t.initial)}"></div>
        <div><label class="admin-label">Brand</label><input class="admin-input" data-path="testimonials.${i}.brand" value="${esc(t.brand)}"></div>
        <div><label class="admin-label">Peran</label><input class="admin-input" data-path="testimonials.${i}.role" value="${esc(t.role)}"></div>
      </div>
      <div><label class="admin-label">Teks</label><textarea class="admin-input" rows="2" data-path="testimonials.${i}.text">${esc(t.text)}</textarea></div>
    </div>
  `).join('');

  const fq = el('faqsList');
  if (fq) fq.innerHTML = (DATA.faqs || []).map((f, i) => `
    <div class="admin-card">
      <div class="admin-card-head"><span class="admin-card-title">FAQ ${i + 1}</span><button class="admin-remove" onclick="removeFaq(${i})"><i class="fas fa-times"></i></button></div>
      <div><label class="admin-label">Pertanyaan</label><input class="admin-input" data-path="faqs.${i}.q" value="${esc(f.q)}"></div>
      <div><label class="admin-label">Jawaban</label><textarea class="admin-input" rows="3" data-path="faqs.${i}.a">${esc(f.a)}</textarea></div>
    </div>
  `).join('');

  const pk = el('paketList');
  if (pk) pk.innerHTML = (DATA.paket || []).map((p, i) => `
    <div class="admin-card">
      <div class="admin-card-head"><span class="admin-card-title">Paket ${i + 1}</span><button class="admin-remove" onclick="removePaket(${i})"><i class="fas fa-times"></i></button></div>
      <div class="admin-grid-3">
        <div><label class="admin-label">Nama</label><input class="admin-input" data-path="paket.${i}.name" value="${esc(p.name)}"></div>
        <div><label class="admin-label">Jumlah</label><input class="admin-input" data-path="paket.${i}.pcs" value="${esc(p.pcs)}"></div>
        <div><label class="admin-label">Unit</label><input class="admin-input" data-path="paket.${i}.unit" value="${esc(p.unit)}"></div>
      </div>
      <div class="admin-grid-2">
        <div><label class="admin-label">Harga</label><input class="admin-input" data-path="paket.${i}.price" value="${esc(p.price)}"></div>
        <div><label class="admin-label">Populer?</label><select class="admin-input" data-path="paket.${i}.popular"><option value="">Tidak</option><option value="1" ${p.popular ? 'selected' : ''}>Ya</option></select></div>
      </div>
      <div><label class="admin-label">Fitur (satu per baris)</label><textarea class="admin-input" rows="4" data-path="paket.${i}.features" data-type="array-lines">${(p.features || []).join('\n')}</textarea></div>
    </div>
  `).join('');

  const postsList = el('postsList');
  if (postsList) postsList.innerHTML = (allPosts || []).length === 0
    ? `<p class="text-center text-gray-400 py-6 text-sm">Belum ada artikel.</p>`
    : allPosts.map(p => `
      <div class="admin-card">
        <div class="admin-card-head">
          <span class="admin-card-title" style="text-transform:none;letter-spacing:0;font-size:.85rem">${esc(p.title)} ${p.published ? '<span style="color:var(--emerald)">● Publish</span>' : '<span style="color:#999">● Draft</span>'}</span>
          <div class="flex gap-1">
            <button class="admin-btn admin-btn-ghost" style="padding:.4rem .6rem" onclick="editPost(${p.id})"><i class="fas fa-edit"></i></button>
            <button class="admin-remove" onclick="removePost(${p.id})"><i class="fas fa-times"></i></button>
          </div>
        </div>
        <div class="text-xs text-gray-500 line-clamp-2">${esc(p.excerpt || '')}</div>
      </div>
    `).join('');
}

// ---------- THEME & HERO CONTROLS ----------
function bindThemePicker() {
  document.querySelectorAll('#themePicker .theme-card').forEach(card => {
    card.onclick = () => {
      const id = card.dataset.themeId;
      DATA.theme = id;
      applyTheme(id);
      toast(`Tema "${THEMES.find(t => t.id === id).name}" diterapkan`);
      renderTabNow();
      pushHistory();
    };
  });
}

function bindHeroStyleControls() {
  const opacity = el('heroOpacity');
  const bright = el('heroBright');
  const blur = el('heroBlur');
  const shadow = el('heroTextShadow');
  if (!opacity) return;
  DATA.heroStyle = DATA.heroStyle || { overlayOpacity:25, brightness:100, blur:0, textShadow:true };
  const update = () => {
    DATA.heroStyle.overlayOpacity = parseInt(opacity.value) || 0;
    DATA.heroStyle.brightness = parseInt(bright.value) || 100;
    DATA.heroStyle.blur = parseInt(blur.value) || 0;
    DATA.heroStyle.textShadow = shadow.value === '1';
    el('heroOpacityVal').textContent = opacity.value;
    el('heroBrightVal').textContent = bright.value;
    el('heroBlurVal').textContent = blur.value;
    markDirty();
  };
  opacity.oninput = update;
  bright.oninput = update;
  blur.oninput = update;
  shadow.onchange = update;
}

function applyLogoFromInputs() {
  DATA.logo = DATA.logo || {};
  DATA.logo.showText = el('logoShowText').value === '1';
  DATA.logo.size = parseInt(el('logoSize').value) || 48;
  toast('Pengaturan logo diterapkan ✓ Klik Simpan');
  pushHistory();
}

function removeLogo() {
  if (!confirm('Hapus logo?')) return;
  DATA.logo.url = '';
  renderTabNow();
  toast('Logo dihapus (klik Simpan)');
  pushHistory();
}

function removeHeroImage() {
  if (!confirm('Hapus gambar hero?')) return;
  DATA.hero.heroImage = '';
  renderTabNow();
  toast('Hero dihapus (klik Simpan)');
  pushHistory();
}

// ---------- UPLOAD HANDLERS ----------
function bindAllUploadHandlers() {
  // Logo
  const logoUpload = el('logoUpload');
  const logoFile = el('logoFile');
  if (logoUpload && logoFile && !logoUpload._bound) {
    logoUpload._bound = true;
    logoUpload.onclick = (e) => { if (e.target.tagName !== 'BUTTON') logoFile.click(); };
    logoFile.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const result = await uploadImageWithInfo(supabaseClient, file, 'logo');
      if (result.error) return toast(result.error);
      DATA.logo = DATA.logo || {};
      DATA.logo.url = result.url;
      const info = el('logoInfo');
      if (info) {
        info.style.display = 'flex';
        info.innerHTML = `<span>${formatBytes(result.originalSize)} → <strong>${formatBytes(result.newSize)}</strong></span><span class="compress-badge">Hemat ${result.savedPercent}%</span>`;
      }
      toast('Logo terupload ✓ Klik Simpan');
      pushHistory();
      logoFile.value = '';
    };
  }

  // Hero
  const heroUpload = el('heroImgUpload');
  const heroFile = el('heroImgFile');
  if (heroUpload && heroFile && !heroUpload._bound) {
    heroUpload._bound = true;
    heroUpload.onclick = (e) => { if (e.target.tagName !== 'BUTTON') heroFile.click(); };
    heroFile.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const result = await uploadImageWithInfo(supabaseClient, file, 'hero');
      if (result.error) return toast(result.error);
      DATA.hero.heroImage = result.url;
      const prev = el('heroImgPreview');
      if (prev) { prev.src = result.url; prev.style.display = 'block'; prev.classList.add('img-upload-preview'); }
      const info = el('heroImgInfo');
      if (info) {
        info.style.display = 'flex';
        info.innerHTML = `<span>${formatBytes(result.originalSize)} → <strong>${formatBytes(result.newSize)}</strong></span><span class="compress-badge">Hemat ${result.savedPercent}%</span>`;
      }
      toast('Hero terupload ✓ Klik Simpan');
      pushHistory();
      heroFile.value = '';
    };
  }

  // Catalog items
  document.querySelectorAll('#adminContent [data-catalog-upload]').forEach(upload => {
    if (upload._bound) return;
    upload._bound = true;
    const idx = upload.dataset.catalogUpload;
    const input = document.querySelector(`#adminContent [data-catalog-file="${idx}"]`);
    if (!input) return;
    upload.onclick = () => input.click();
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const result = await uploadImageWithInfo(supabaseClient, file, 'catalog');
      if (result.error) return toast(result.error);
      DATA.catalog[idx].img = result.url;
      const preview = el('catImgPreview' + idx);
      if (preview) { preview.src = result.url; preview.style.display = 'block'; preview.classList.add('img-upload-preview'); }
      const urlInp = document.querySelector(`#adminContent [data-path="catalog.${idx}.img"]`);
      if (urlInp) urlInp.value = result.url;
      toast('Katalog terupload ✓');
      pushHistory();
      input.value = '';
    };
  });

  // Post cover
  const postUpload = el('postImgUpload');
  const postFile = el('postImgFile');
  if (postUpload && postFile && !postUpload._bound) {
    postUpload._bound = true;
    postUpload.onclick = () => postFile.click();
    postFile.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const result = await uploadImageWithInfo(supabaseClient, file, 'cover');
      if (result.error) return toast(result.error);
      el('postImgPreview').src = result.url;
      el('postImgPreview').style.display = 'block';
      el('postCoverUrl').value = result.url;
      const info = el('postImgInfo');
      if (info) {
        info.style.display = 'flex';
        info.innerHTML = `<span>${formatBytes(result.originalSize)} → <strong>${formatBytes(result.newSize)}</strong></span><span class="compress-badge">Hemat ${result.savedPercent}%</span>`;
      }
      toast('Cover terupload ✓');
      postFile.value = '';
    };
  }

  // Media manager
  const mediaUpload = el('mediaUpload');
  const mediaFile = el('mediaFileInput');
  if (mediaUpload && mediaFile && !mediaUpload._bound) {
    mediaUpload._bound = true;
    mediaUpload.onclick = () => mediaFile.click();
    mediaFile.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      const info = el('mediaUploadInfo');
      info.style.display = 'flex';
      info.innerHTML = `Memproses ${files.length} gambar...`;
      let success = 0, totalSaved = 0, totalOriginal = 0;
      for (const file of files) {
        const result = await uploadImageWithInfo(supabaseClient, file);
        if (!result.error) {
          success++;
          totalSaved += result.saved;
          totalOriginal += result.originalSize;
        }
      }
      info.innerHTML = `<span><strong>${success}/${files.length}</strong> berhasil</span><span>Hemat: <strong>${formatBytes(totalSaved)}</strong></span>`;
      mediaFile.value = '';
      renderMediaManager();
    };
  }
}

// ---------- MEDIA MANAGER ----------
async function listMediaFiles() {
  const { data, error } = await supabaseClient.storage
    .from('scentia-media')
    .list('', { limit: 200, sortBy: { column: 'name', order: 'desc' } });
  if (error) { toast('Gagal load media: ' + error.message); return []; }
  const allFiles = [];
  for (const item of (data || [])) {
    if (item.id === null) {
      const { data: sub } = await supabaseClient.storage
        .from('scentia-media')
        .list(item.name, { limit: 200, sortBy: { column: 'name', order: 'desc' } });
      (sub || []).forEach(f => allFiles.push({ ...f, path: `${item.name}/${f.name}` }));
    } else {
      allFiles.push({ ...item, path: item.name });
    }
  }
  return allFiles;
}

async function renderMediaManager() {
  const container = el('mediaManagerGrid');
  if (!container) return;
  container.innerHTML = '<p class="text-center text-gray-400 py-8 col-span-full text-sm">Memuat media...</p>';
  const files = await listMediaFiles();
  if (files.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-400 py-8 col-span-full text-sm">Belum ada gambar.</p>';
    return;
  }
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/scentia-media/`;
  container.innerHTML = files.map(f => {
    const url = baseUrl + f.path;
    const sizeKB = f.metadata?.size ? formatBytes(f.metadata.size) : '—';
    return `
      <div class="media-item">
        <img src="${esc(url)}" alt="${esc(f.name)}" loading="lazy" onerror="this.style.opacity=.3">
        <div class="media-actions">
          <button class="media-btn" onclick="copyMediaUrl('${esc(url)}')"><i class="fas fa-link"></i></button>
          <button class="media-btn danger" onclick="deleteMedia('${esc(f.path)}')"><i class="fas fa-trash"></i></button>
        </div>
        <div class="media-label">${esc(f.name)}<br>${sizeKB}</div>
      </div>
    `;
  }).join('');
}

function copyMediaUrl(url) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => toast('URL dicopy ✓')).catch(() => prompt('Copy URL:', url));
  } else {
    prompt('Copy URL:', url);
  }
}

async function deleteMedia(path) {
  if (!confirm(`Hapus file "${path}"?`)) return;
  const { error } = await supabaseClient.storage.from('scentia-media').remove([path]);
  if (error) return toast('Gagal hapus: ' + error.message);
  toast('File dihapus ✓');
  renderMediaManager();
}

async function openHeroMediaPicker() {
  const files = await listMediaFiles();
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/scentia-media/`;
  const html = `
    <div class="media-grid" style="max-height:400px;overflow-y:auto">
      ${files.length === 0 ? '<p class="text-gray-400 text-center col-span-full py-6 text-sm">Belum ada gambar.</p>' : files.map(f => `
        <div class="media-item" onclick="pickHeroImage('${baseUrl}${f.path}')">
          <img src="${baseUrl}${f.path}" loading="lazy">
          <div class="media-label">${esc(f.name)}</div>
        </div>
      `).join('')}
    </div>
  `;
  const picker = document.createElement('div');
  picker.className = 'admin-overlay open';
  picker.style.zIndex = '25000';
  picker.id = 'heroPickerModal';
  picker.innerHTML = `<div class="admin-panel" style="max-width:800px"><div class="admin-header"><span class="font-bold text-sm sm:text-base">Pilih Gambar Hero</span><button class="admin-btn admin-btn-ghost" style="background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.2)" onclick="document.getElementById('heroPickerModal').remove()"><i class="fas fa-times"></i></button></div><div class="admin-content">${html}</div></div>`;
  document.body.appendChild(picker);
}

function pickHeroImage(url) {
  DATA.hero.heroImage = url;
  const preview = el('heroImgPreview');
  if (preview) { preview.src = url; preview.style.display = 'block'; preview.classList.add('img-upload-preview'); }
  const modal = el('heroPickerModal');
  if (modal) modal.remove();
  toast('Gambar hero dipilih ✓');
  pushHistory();
}

// ---------- ADD/REMOVE FUNCTIONS ----------
function addStat() { DATA.stats.push({ value: 0, suffix: '', label: 'Stat Baru' }); renderTabNow(); pushHistory(); }
function removeStat(i) { DATA.stats.splice(i, 1); renderTabNow(); pushHistory(); }
function addBrand() { BRANDS.push({ name: 'BRAND BARU', pcs: '1.000 pcs', type: 'EDP', sort_order: BRANDS.length + 1, id: 'new-' + Date.now() }); renderTabNow(); pushHistory(); }
async function removeBrand(id) {
  if (!confirm('Hapus brand ini?')) return;
  if (String(id).startsWith('new-')) {
    BRANDS = BRANDS.filter(b => b.id !== id);
  } else {
    const { error } = await supabaseClient.from('brands').delete().eq('id', id);
    if (error) return toast('Gagal: ' + error.message);
    BRANDS = BRANDS.filter(b => b.id !== id);
  }
  renderTabNow();
  pushHistory();
}
function addFacility() { DATA.facilities.push({ icon: 'fas fa-star', title: 'Fasilitas Baru', desc: 'Deskripsi.' }); renderTabNow(); pushHistory(); }
function removeFacility(i) { DATA.facilities.splice(i, 1); renderTabNow(); pushHistory(); }
function addProcess() { DATA.processes.push({ title: 'Langkah Baru', desc: 'Deskripsi.' }); renderTabNow(); pushHistory(); }
function removeProcess(i) { DATA.processes.splice(i, 1); renderTabNow(); pushHistory(); }
function addCatalog() { DATA.catalog.push({ badge: 'BARU', badgeColor: 'gold', title: 'Item Baru', desc: 'Deskripsi.', icon: 'fas fa-box', img: '' }); renderTabNow(); pushHistory(); }
function removeCatalog(i) { DATA.catalog.splice(i, 1); renderTabNow(); pushHistory(); }
function addBonus() { DATA.bonuses.push({ icon: 'fas fa-gift', title: 'Bonus Baru', desc: 'Deskripsi.', price: 'Rp 100.000' }); renderTabNow(); pushHistory(); }
function removeBonus(i) { DATA.bonuses.splice(i, 1); renderTabNow(); pushHistory(); }
function addTestimonial() { DATA.testimonials.push({ initial: 'X', brand: 'BRAND BARU', role: 'Owner', text: 'Testimoni baru.' }); renderTabNow(); pushHistory(); }
function removeTestimonial(i) { DATA.testimonials.splice(i, 1); renderTabNow(); pushHistory(); }
function addFaq() { DATA.faqs.push({ q: 'Pertanyaan baru?', a: 'Jawaban baru.' }); renderTabNow(); pushHistory(); }
function removeFaq(i) { DATA.faqs.splice(i, 1); renderTabNow(); pushHistory(); }
function addPaket() { DATA.paket.push({ name: 'Paket Baru', pcs: '100', unit: 'pcs', price: 'Rp 20rb/pcs', features: ['Fitur 1', 'Fitur 2'], popular: false, wa: 'Paket Baru' }); renderTabNow(); pushHistory(); }
function removePaket(i) { DATA.paket.splice(i, 1); renderTabNow(); pushHistory(); }

// ---------- POSTS CRUD ----------
function editPost(id) {
  const wrap = el('postEditorWrap');
  wrap.style.display = 'block';
  if (id === null) {
    el('postEditorTitle').textContent = 'Artikel Baru';
    el('postTitle').value = '';
    el('postSlug').value = '';
    el('postExcerpt').value = '';
    el('postContentEditor').value = '';
    el('postAuthor').value = 'Scentia Team';
    el('postPublished').value = '';
    el('postEditingId').value = '';
    el('postCoverUrl').value = '';
    el('postImgPreview').style.display = 'none';
    el('postImgInfo').style.display = 'none';
  } else {
    const p = allPosts.find(x => x.id === id);
    if (!p) return;
    el('postEditorTitle').textContent = 'Edit Artikel';
    el('postTitle').value = p.title || '';
    el('postSlug').value = p.slug || '';
    el('postExcerpt').value = p.excerpt || '';
    el('postContentEditor').value = p.content || '';
    el('postAuthor').value = p.author || 'Scentia Team';
    el('postPublished').value = p.published ? '1' : '';
    el('postEditingId').value = p.id;
    el('postCoverUrl').value = p.cover_image || '';
    if (p.cover_image) {
      el('postImgPreview').src = p.cover_image;
      el('postImgPreview').style.display = 'block';
    }
  }
  bindAllUploadHandlers();
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelPostEdit() { el('postEditorWrap').style.display = 'none'; }

async function savePost() {
  const id = el('postEditingId').value;
  const title = el('postTitle').value.trim();
  if (!title) return toast('Judul wajib diisi');
  const slug = el('postSlug').value.trim() || slugify(title);
  const payload = {
    title, slug,
    excerpt: el('postExcerpt').value.trim(),
    content: el('postContentEditor').value.trim(),
    author: el('postAuthor').value.trim() || 'Scentia Team',
    published: el('postPublished').value === '1',
    cover_image: el('postCoverUrl').value || null
  };
  if (payload.published && !id) payload.published_at = new Date().toISOString();
  let res;
  if (id) res = await supabaseClient.from('posts').update(payload).eq('id', id);
  else res = await supabaseClient.from('posts').insert(payload);
  if (res.error) return toast('Gagal: ' + res.error.message);
  toast('Artikel tersimpan ✓');
  await loadPosts();
  renderTabNow();
  el('postEditorWrap').style.display = 'none';
}

async function removePost(id) {
  if (!confirm('Hapus artikel ini?')) return;
  const { error } = await supabaseClient.from('posts').delete().eq('id', id);
  if (error) return toast('Gagal hapus: ' + error.message);
  await loadPosts();
  renderTabNow();
  toast('Artikel dihapus');
}

// ---------- SAVE ALL (OPTIMIZED BATCH) ----------
async function saveAll() {
  const btn = el('adminSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

  const keys = ['identity', 'hero', 'stats', 'facilities', 'processes', 'catalog', 'bonuses', 'bonusTotal', 'slots', 'testimonials', 'faqs', 'paket', 'marquee', 'collaboration', 'theme', 'logo', 'heroStyle'];
  const configRows = keys
    .filter(k => DATA[k] !== undefined)
    .map(k => ({ key: k, value: DATA[k], updated_at: new Date().toISOString() }));

  try {
    if (configRows.length) {
      const { error } = await supabaseClient.from('site_config').upsert(configRows);
      if (error) throw error;
    }

    for (const b of BRANDS) {
      const payload = { name: b.name, pcs: b.pcs, type: b.type, sort_order: b.sort_order || 0 };
      if (String(b.id).startsWith('new-')) {
        await supabaseClient.from('brands').insert(payload);
      } else {
        await supabaseClient.from('brands').update(payload).eq('id', b.id);
      }
    }

    toast('Tersimpan ✓');
    await loadBrands();
    historyStack.push(snapshotState());
    if (historyStack.length > HISTORY_LIMIT) historyStack.shift();
    historyIndex = historyStack.length - 1;
    updateUndoRedoButtons();
    renderTabNow();
  } catch (err) {
    toast('Gagal simpan: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Simpan';
  }
}

// ---------- EXPORT/IMPORT/RESET ----------
async function exportData() {
  const exportObj = { ...DATA, brands: BRANDS, posts: allPosts };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scentia-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Data diexport');
}

async function resetAll() {
  if (!session) return toast('Harus login dulu');
  const konfirmasi = prompt('⚠️ RESET ALL akan MENGHAPUS SEMUA DATA di database dan menggantinya dengan data default.\n\nKetik "RESET" (huruf besar) untuk konfirmasi:');
  if (konfirmasi !== 'RESET') return toast('Dibatalkan');
  toast('Menghapus data lama...');
  try {
    await supabaseClient.from('brands').delete().neq('id', 0);
    await supabaseClient.from('site_config').delete().neq('key', '');
    for (const b of DEFAULT_BRANDS) {
      await supabaseClient.from('brands').insert(b);
    }
    const keys = ['identity', 'hero', 'stats', 'facilities', 'processes', 'catalog', 'bonuses', 'bonusTotal', 'slots', 'testimonials', 'faqs', 'paket', 'marquee', 'collaboration', 'theme', 'logo', 'heroStyle'];
    for (const k of keys) {
      if (DEFAULT_DATA[k] === undefined) continue;
      await supabaseClient.from('site_config').insert({
        key: k, value: DEFAULT_DATA[k], updated_at: new Date().toISOString()
      });
    }
    historyStack = [];
    historyIndex = -1;
    await Promise.all([loadConfig(), loadBrands()]);
    renderTabNow();
    historyStack.push(snapshotState());
    historyIndex = 0;
    updateUndoRedoButtons();
    toast('Reset berhasil ✓ Memuat ulang...');
    setTimeout(() => location.reload(), 1500);
  } catch (err) {
    toast('Gagal reset: ' + err.message);
  }
}

// ---------- EVENT BINDINGS ----------
function bindGlobalEvents() {
  el('adminLoginBtn').onclick = adminLoginSubmit;
  el('adminEmail').onkeydown = e => { if (e.key === 'Enter') el('adminPass').focus(); };
  el('adminPass').onkeydown = e => { if (e.key === 'Enter') adminLoginSubmit(); };
  el('adminCloseLogin').onclick = closeAdmin;
  el('adminCloseBtn').onclick = closeAdmin;
  el('adminLogoutBtn').onclick = adminLogout;
  el('adminSaveBtn').onclick = saveAll;
  el('adminExportBtn').onclick = exportData;
  el('adminImportBtn').onclick = () => el('adminFileInput').click();
  el('adminUndoBtn').onclick = undo;
  el('adminRedoBtn').onclick = redo;
  el('adminResetAllBtn').onclick = resetAll;

  el('adminFileInput').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.brands) { BRANDS = imported.brands; delete imported.brands; }
        if (imported.posts) delete imported.posts;
        Object.assign(DATA, imported);
        if (DATA.theme) applyTheme(DATA.theme);
        await saveAll();
        toast('Import berhasil');
      } catch (err) { toast('File tidak valid'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    }
    if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
      e.preventDefault();
      redo();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveAll();
    }
  });
}

// ---------- INIT ----------
async function initAdmin() {
  bindGlobalEvents();
  await checkSession();
  await Promise.all([loadConfig(), loadBrands(), loadPosts()]);
  postsShown = Math.min(POSTS_PER_PAGE, POSTS.length);
  historyStack = [snapshotState()];
  historyIndex = 0;
  updateUndoRedoButtons();
  if (session) {
    el('adminLogin').style.display = 'none';
    el('adminPanel').style.display = 'flex';
    el('adminUser').textContent = session.user.email;
    renderAdmin();
  } else {
    el('adminLogin').style.display = 'block';
    el('adminPanel').style.display = 'none';
  }
}

// Expose ke window untuk tombol HTML
window.openAdmin = openAdmin;
window.closeAdmin = closeAdmin;
window.undo = undo;
window.redo = redo;
window.saveAll = saveAll;
window.exportData = exportData;
window.resetAll = resetAll;
window.removeLogo = removeLogo;
window.removeHeroImage = removeHeroImage;
window.applyLogoFromInputs = applyLogoFromInputs;
window.openHeroMediaPicker = openHeroMediaPicker;
window.pickHeroImage = pickHeroImage;
window.copyMediaUrl = copyMediaUrl;
window.deleteMedia = deleteMedia;
window.renderMediaManager = renderMediaManager;
window.editPost = editPost;
window.cancelPostEdit = cancelPostEdit;
window.savePost = savePost;
window.removePost = removePost;
window.addStat = addStat;
window.removeStat = removeStat;
window.addBrand = addBrand;
window.removeBrand = removeBrand;
window.addFacility = addFacility;
window.removeFacility = removeFacility;
window.addProcess = addProcess;
window.removeProcess = removeProcess;
window.addCatalog = addCatalog;
window.removeCatalog = removeCatalog;
window.addBonus = addBonus;
window.removeBonus = removeBonus;
window.addTestimonial = addTestimonial;
window.removeTestimonial = removeTestimonial;
window.addFaq = addFaq;
window.removeFaq = removeFaq;
window.addPaket = addPaket;
window.removePaket = removePaket;

// Auto-init saat halaman siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}