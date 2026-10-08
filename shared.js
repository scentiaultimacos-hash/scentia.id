/* ============================================================
   shared.js — Konfigurasi & Helper Scentia Ultimacos
   Dipakai oleh index.html dan admin.html
   ============================================================ */

// ---------- KONFIGURASI SUPABASE ----------
const SUPABASE_URL = 'https://tjoyzlgdkhkhiggmealh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_e8f0DIkmJBiGfMHVOINMEA_c_m6V_nn';

// Supabase client akan diinisialisasi di file masing-masing
// (agar tidak double-init kalau script di-load dua kali)

// ---------- TEMA WARNA ----------
const THEMES = [
  { id:'burgundy', name:'Burgundy Classic', colors: { primary:'#8e1c3c', primarySoft:'#a83254', dark:'#5c0f28', light:'#e8c9d3', pale:'#f7eef1', gold:'#b8860b', goldSoft:'#d4a437', goldPale:'#f5ecd4', emerald:'#2f6b4f', charcoal:'#2a2a2e', ivory:'#faf7f2', line:'#e8e3dc' } },
  { id:'midnight', name:'Midnight Blue', colors: { primary:'#1e3a8a', primarySoft:'#3b5bdb', dark:'#0f1e4a', light:'#c7d2fe', pale:'#eef2ff', gold:'#b45309', goldSoft:'#d97706', goldPale:'#fef3c7', emerald:'#047857', charcoal:'#1e293b', ivory:'#f8fafc', line:'#e2e8f0' } },
  { id:'emerald', name:'Emerald Luxe', colors: { primary:'#065f46', primarySoft:'#059669', dark:'#022c22', light:'#a7f3d0', pale:'#ecfdf5', gold:'#b45309', goldSoft:'#d97706', goldPale:'#fef3c7', emerald:'#065f46', charcoal:'#1f2937', ivory:'#f9fafb', line:'#e5e7eb' } },
  { id:'royal', name:'Royal Purple', colors: { primary:'#6d28d9', primarySoft:'#7c3aed', dark:'#3b0764', light:'#ddd6fe', pale:'#f5f3ff', gold:'#b45309', goldSoft:'#d97706', goldPale:'#fef3c7', emerald:'#047857', charcoal:'#1e1b4b', ivory:'#faf5ff', line:'#ede9fe' } },
  { id:'noir', name:'Noir Gold', colors: { primary:'#0f0f0f', primarySoft:'#333333', dark:'#000000', light:'#d4d4d4', pale:'#f5f5f5', gold:'#c9a227', goldSoft:'#d4af37', goldPale:'#f5f0d8', emerald:'#166534', charcoal:'#171717', ivory:'#fafafa', line:'#e5e5e5' } },
  { id:'ocean', name:'Ocean Breeze', colors: { primary:'#0e7490', primarySoft:'#0891b2', dark:'#083344', light:'#a5f3fc', pale:'#ecfeff', gold:'#b45309', goldSoft:'#d97706', goldPale:'#fef3c7', emerald:'#047857', charcoal:'#164e63', ivory:'#f0fdfa', line:'#cffafe' } },
  { id:'sunset', name:'Sunset Terra', colors: { primary:'#9a3412', primarySoft:'#c2410c', dark:'#7c2d12', light:'#fed7aa', pale:'#fff7ed', gold:'#a16207', goldSoft:'#ca8a04', goldPale:'#fef9c3', emerald:'#166534', charcoal:'#431407', ivory:'#fffbeb', line:'#fed7aa' } },
  { id:'sakura', name:'Sakura Rose', colors: { primary:'#be185d', primarySoft:'#db2777', dark:'#831843', light:'#fbcfe8', pale:'#fdf2f8', gold:'#b45309', goldSoft:'#d97706', goldPale:'#fef3c7', emerald:'#047857', charcoal:'#500724', ivory:'#fef2f8', line:'#fce7f3' } }
];

// ---------- DEFAULT DATA ----------
const DEFAULT_DATA = {
  identity: {
    brandName: "Scentia", brandSub: "ULTIMACOS", tagline: "By King Parfum",
    factoryName: "King Parfum Indonesia", marketingName: "CV Scentia Ultimacos",
    location: "Grand Harvest, Soho HO No.23, Kebraon, Karangpilang, Surabaya 60222",
    email: "info@scentiaultimacos.com", whatsapp: "6287855876021",
    whatsappDisplay: "0878-5587-6021", hours: "Senin - Sabtu · 09:00 - 17:00 WIB",
    foundedYear: "2023",
    copyright: "© 2025 Scentia Ultimacos by King Parfum Indonesia. All rights reserved."
  },
  logo: { url: "", showText: true, size: 48, roundBg: false },
  theme: "burgundy",
  heroStyle: { overlayOpacity: 25, brightness: 100, blur: 0, textShadow: true },
  hero: {
    badge: "CPKB Certified — BPOM",
    line1: "Bukan Sekadar Pabrik —",
    line2: "Partner Pertumbuhan",
    line3: "Brand Anda",
    typing: "Scentia Ultimacos by King Parfum — Satu Pintu: Konsultasi, Produksi, Legalitas.",
    bonusText: "Rp 2.750.000",
    heroImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1600&q=80"
  },
  stats: [
    { value: 100, suffix: "K+", label: "Total Produksi pcs" },
    { value: 3, suffix: " Thn", label: "Pengalaman" },
    { value: 4.9, suffix: "", decimal: 1, label: "Rating /5" },
    { value: 500, suffix: "+", label: "Review Pelanggan" }
  ],
  collaboration: {
    factoryDesc: "Pabrik maklon parfum bersertifikat CPKB dengan lab fragrance mandiri, smelling room eksklusif, dan kapasitas produksi 20.000+ pcs per batch.",
    marketingDesc: "Marketing dan partner pertumbuhan brand Anda. Membantu dari konsultasi ide, desain kemasan, hingga produk siap jual."
  },
  facilities: [
    { icon: "fas fa-flask", title: "Lab Fragrance Mandiri", desc: "Riset dan pengembangan aroma secara mandiri." },
    { icon: "fas fa-certificate", title: "CPKB Certified", desc: "Standar Cara Pembuatan Kosmetik yang Baik — BPOM." },
    { icon: "fas fa-wind", title: "Smelling Room", desc: "Ruang eksklusif untuk mencoba berbagai varian aroma." },
    { icon: "fas fa-paint-brush", title: "FREE Design Kemasan", desc: "Desain kemasan profesional tanpa biaya tambahan." },
    { icon: "fas fa-shield-alt", title: "Quality Control Berlapis", desc: "Setiap batch melewati kontrol kualitas ketat." },
    { icon: "fas fa-industry", title: "Kapasitas Produksi Besar", desc: "Mampu memproduksi 20.000+ pcs per batch." }
  ],
  processes: [
    { title: "Konsultasi Ide", desc: "Diskusikan konsep brand dan aroma impian Anda." },
    { title: "Sampel Aroma", desc: "Dapatkan 3 sampel aroma untuk dicoba." },
    { title: "Produksi & Legalitas", desc: "Produksi massal dan pengurusan izin BPOM/HKI." },
    { title: "Produk Siap Jual", desc: "Terima produk siap dipasarkan ke konsumen." }
  ],
  catalog: [
    { badge: "POPULER", badgeColor: "gold", title: "Botol Kaca Mewah", desc: "Botol kaca premium dengan berbagai ukuran.", icon: "fas fa-spray-can", img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80" },
    { badge: "FREE", badgeColor: "emerald", title: "Sticker & Label", desc: "Desain sticker dan label profesional gratis.", icon: "fas fa-tag", img: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=80" },
    { badge: "FREE", badgeColor: "emerald", title: "Kotak Kemasan", desc: "Kotak eksklusif untuk meningkatkan nilai produk.", icon: "fas fa-box-open", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80" }
  ],
  bonuses: [
    { icon: "fas fa-paint-brush", title: "Custom Design Kemasan", desc: "Desain profesional sesuai identitas brand.", price: "Rp 1.500.000" },
    { icon: "fas fa-vial", title: "Sampel Aroma 3 Varian", desc: "Coba 3 varian aroma sebelum produksi.", price: "Rp 500.000" },
    { icon: "fas fa-user-tie", title: "Konsultasi Perfumer 1-on-1", desc: "Sesi eksklusif dengan perfumer berpengalaman.", price: "Rp 750.000" }
  ],
  bonusTotal: "Rp 2.750.000",
  slots: { taken: 8, total: 20 },
  testimonials: [
    { initial: "T", brand: "TWIST", role: "Brand Owner", text: "Pelayanan profesional, hasil parfum berkualitas tinggi. Sangat direkomendasikan!" },
    { initial: "H", brand: "HIRE SCENT", role: "Founder", text: "Dari konsultasi sampai legalitas semua dibantu. Partner yang tepat!" },
    { initial: "A", brand: "ACIL PARFUM", role: "Owner", text: "Kapasitas produksi besar dan kualitas terjaga. Luar biasa." },
    { initial: "G", brand: "GHAZAL", role: "Brand Owner", text: "Aroma non-alkohol yang dihasilkan sangat memuaskan pasar." },
    { initial: "S", brand: "SUPERJOSS", role: "Founder", text: "Bonus dan pelayanan after-sales sangat membantu pertumbuhan brand." },
    { initial: "H", brand: "HYERIM", role: "Owner", text: "Deospray produksi Scentia laris di pasaran. Terima kasih!" }
  ],
  faqs: [
    { q: "Hubungi King Parfum atau Scentia?", a: "King Parfum adalah pabrik, sedangkan Scentia Ultimacos adalah marketing/partner Anda. Hubungi Scentia untuk konsultasi awal, nanti akan diarahkan ke pabrik." },
    { q: "Berapa minimum order?", a: "MOQ fleksibel mulai dari 100 pcs untuk paket Starter. Fokus kami adalah kualitas dan pertumbuhan brand Anda." },
    { q: "Benar ada FREE Design?", a: "Ya, FREE design kemasan untuk paket Growth dan Enterprise. Tim desainer kami siap membantu." },
    { q: "Biaya BPOM & HKI?", a: "Izin BPOM Rp 1.500.000 dan Pendaftaran Merek HKI Rp 4.000.000. Kami bantu prosesnya hingga tuntas." },
    { q: "Apa itu CPKB?", a: "CPKB (Cara Pembuatan Kosmetik yang Baik) adalah standar sertifikasi dari BPOM yang menjamin kualitas dan keamanan produksi." },
    { q: "Sistem pembayaran?", a: "DP 50% di awal, pelunasan 50% setelah produksi selesai." },
    { q: "Berapa lama proses produksi?", a: "Rata-rata 2-4 minggu tergantung jumlah dan kompleksitas pesanan." },
    { q: "Apakah bisa custom aroma?", a: "Tentu! Lab fragrance mandiri kami siap meracik aroma sesuai keinginan Anda." }
  ],
  paket: [
    { name: "Starter", pcs: "100", unit: "pcs", price: "Mulai Rp 18rb/pcs", features: ["Sampel aroma", "Botol kaca mewah", "Sticker & label"], popular: false, wa: "Starter" },
    { name: "Growth", pcs: "500", unit: "pcs", price: "Rp 15rb/pcs", features: ["FREE Design Kemasan", "3 sampel aroma", "Konsultasi perfumer"], popular: true, wa: "Growth" },
    { name: "Enterprise", pcs: "1.000", unit: "pcs", price: "Custom / Full Service", features: ["Full service legalitas", "Prioritas produksi", "Dedicated account manager"], popular: false, wa: "Enterprise" }
  ],
  marquee: [
    "CPKB Certified — BPOM", "Lab Fragrance Mandiri", "Smelling Room Eksklusif",
    "FREE Design Kemasan", "Bonus Total Rp 2.750.000",
    "Dipercaya Brand Lokal & Nasional", "Satu Pintu: Konsultasi, Produksi, Legalitas"
  ]
};

const DEFAULT_BRANDS = [
  { name: "TWIST", pcs: "5.000 pcs", type: "EDP/EXT", sort_order: 1 },
  { name: "L SCARF", pcs: "2.000 pcs", type: "EDP/EXT", sort_order: 2 },
  { name: "HIRE SCENT", pcs: "10.000 pcs", type: "EDP", sort_order: 3 },
  { name: "ACIL PARFUM", pcs: "20.000 pcs", type: "EDP", sort_order: 4 },
  { name: "GHAZAL", pcs: "5.000 pcs", type: "NON-ALKOHOL", sort_order: 5 },
  { name: "HYERIM", pcs: "10.000 pcs", type: "DEOSPRAY", sort_order: 6 },
  { name: "PERFECTMENS", pcs: "10.000 pcs", type: "MULTI", sort_order: 7 },
  { name: "SUPERJOSS", pcs: "10.000 pcs", type: "EDP", sort_order: 8 }
];

// ---------- HELPER FUNCTIONS ----------

// Escape HTML biar aman dari XSS
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Slug dari judul
function slugify(str) {
  return String(str).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Format bytes
function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// WA link
function makeWaLink(phone, text) {
  return `https://wa.me/${phone || ''}?text=${encodeURIComponent(text)}`;
}

// Terapkan tema ke CSS variables
function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const c = theme.colors;
  const root = document.documentElement;
  root.setAttribute('data-theme', themeId);
  root.style.setProperty('--primary', c.primary);
  root.style.setProperty('--primary-soft', c.primarySoft);
  root.style.setProperty('--dark', c.dark);
  root.style.setProperty('--light', c.light);
  root.style.setProperty('--pale', c.pale);
  root.style.setProperty('--gold', c.gold);
  root.style.setProperty('--gold-soft', c.goldSoft);
  root.style.setProperty('--gold-pale', c.goldPale);
  root.style.setProperty('--emerald', c.emerald);
  root.style.setProperty('--charcoal', c.charcoal);
  root.style.setProperty('--ivory', c.ivory);
  root.style.setProperty('--line', c.line);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', c.primary);
}

// Compress image sebelum upload
function compressImage(file, options = {}) {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85, outputFormat = 'image/webp' } = options;
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File bukan gambar'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        let newW = width, newH = height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          newW = Math.round(width * ratio);
          newH = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newW, newH);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Gagal compress')); return; }
          const origSize = file.size;
          if (blob.type !== 'image/webp' && outputFormat === 'image/webp') {
            canvas.toBlob(
              (jpgBlob) => resolve({
                blob: jpgBlob, ext: 'jpg',
                originalSize: origSize, newSize: jpgBlob.size,
                savedPercent: ((1 - jpgBlob.size / origSize) * 100).toFixed(0)
              }),
              'image/jpeg', quality
            );
          } else {
            resolve({
              blob, ext: 'webp',
              originalSize: origSize, newSize: blob.size,
              savedPercent: ((1 - blob.size / origSize) * 100).toFixed(0)
            });
          }
        }, outputFormat, quality);
      };
      img.onerror = () => reject(new Error('Gagal load gambar'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal baca file'));
    reader.readAsDataURL(file);
  });
}

// Upload image ke Supabase Storage
async function uploadImageWithInfo(supabaseClient, file, type = 'general') {
  if (file.size > 15 * 1024 * 1024) {
    return { error: 'Gambar max 15MB' };
  }
  const config = {
    hero:    { maxWidth: 1920, maxHeight: 1080, quality: 0.9 },
    cover:   { maxWidth: 1200, maxHeight: 800,  quality: 0.85 },
    catalog: { maxWidth: 900,  maxHeight: 900,  quality: 0.85 },
    logo:    { maxWidth: 400,  maxHeight: 400,  quality: 0.95 },
    general: { maxWidth: 1200, maxHeight: 1200, quality: 0.85 }
  }[type] || { maxWidth: 1200, maxHeight: 1200, quality: 0.85 };

  let compressed;
  try {
    compressed = await compressImage(file, config);
  } catch (err) {
    return { error: 'Gagal compress: ' + err.message };
  }

  const filename = `${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${compressed.ext}`;
  const { data, error } = await supabaseClient.storage
    .from('scentia-media')
    .upload(filename, compressed.blob, {
      contentType: compressed.blob.type,
      cacheControl: '31536000'
    });

  if (error) return { error: 'Upload gagal: ' + error.message };

  const { data: urlData } = supabaseClient.storage
    .from('scentia-media')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    originalSize: compressed.originalSize,
    newSize: compressed.newSize,
    saved: compressed.originalSize - compressed.newSize,
    savedPercent: compressed.savedPercent
  };
}

// Set nilai nested object via path string
function setPath(obj, path, val) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined) cur[p] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = val;
}

// Deep clone
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}