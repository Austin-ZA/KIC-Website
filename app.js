/**
 * KIC — Kingdom Impactors Church
 * Persistence layer: IndexedDB (permanent) + localStorage (fast read cache)
 * Admin writes to IndexedDB → syncs to localStorage → homepage reads from localStorage/IndexedDB
 * Data survives browser restarts, storage clears, and PWA reinstalls.
 */

const DB_NAME    = 'kicDB';
const DB_VERSION = 1;
const STORE_NAME = 'siteData';
const RECORD_KEY = 'kic_site_content_v1';
const LS_KEY     = 'kic_site_content_v1';
const LS_UPDATED = 'kic_site_content_updated_at';

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function idbGet() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(RECORD_KEY);
      req.onsuccess = (e) => resolve(e.target.result || null);
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch { return null; }
}

async function idbSet(data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(data, RECORD_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch { return false; }
}

// ─── Read: IndexedDB first, fall back to localStorage ─────────────────────────
async function loadPersistedData() {
  let data = await idbGet();
  if (!data) {
    try { data = JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { data = null; }
  }
  return data || {};
}

// ─── Write: IndexedDB + localStorage cache ─────────────────────────────────────
async function savePersistedData(data) {
  await idbSet(data);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    localStorage.setItem(LS_UPDATED, String(Date.now()));
  } catch (e) {
    console.warn('localStorage write failed (quota?), IndexedDB still saved.', e);
  }
}

// ─── Default content ──────────────────────────────────────────────────────────
const defaultData = {
  announcements: [
    { title: 'Kingdom Conference Launch', body: 'Join the church family for a week of worship, teaching and fellowship. Doors open at 08:30 Sunday.', category: 'Service', date: 'This week', image: '' },
    { title: 'New Member Celebration', body: 'Welcome the newest members into our community of impact, prayer and purpose.', category: 'Membership', date: 'Tuesday', image: '' },
    { title: 'Baptism Class', body: 'Register for the baptism class for all who are ready to take the next step in faith.', category: 'Baptism', date: 'Wednesday', image: '' },
    { title: 'Newsletter Release', body: 'Our weekly newsletter is now available with service highlights and upcoming event details.', category: 'Newsletter', date: 'Thursday', image: '' }
  ],
  sermons: [
    { title: 'The Cost Of Carrying God', speaker: 'Pastor T.G NDALA', description: 'A series on the Cost Of Carrying God.', link: 'https://youtube.com/playlist?list=PLfh5vmVGxEVfc7E47Qth1FO4Cb1OFdrRy&si=RgV3JLRr34nP2l_1' },
    { title: 'Impactors Sunday', speaker: 'Apostle Bopape & Apostle Mahlaku', description: 'A powerful teaching for believers who are called to shift atmosphere and culture.', link: 'https://youtube.com/live/p8wXJE_Y558?si=S4QlyyzamnBL5wYT' },
    { title: 'The Spirit Of Revival', speaker: 'Pastor T.G NDALA', description: 'A series on the Spirit of Revival.', link: 'https://youtube.com/playlist?list=PLfh5vmVGxEVca6jdqMjgWA-1qTBGJ_vxA&si=65dMgS8k1kZD8iDS' }
  ],
  contact: {
    address: '336 Struben, Pretoria Central',
    phone: '+27 634 859 461',
    email: 'KingdomImpactorsChurch@gmail.com',
    times: 'Sun 08:30 intercession, 09:30–12:00 service; Tue 17:30 intercession, 18:00 Choose Word.',
    whatsapp: '+27634859461',
    pastor: 'T.G NDALA'
  },
  countdown: { label: 'Night of Strength', date: '2026-07-31T18:00:00' },
  songs: [],
  events: [
    { title: 'Sunday Celebration Service', date: 'Sunday', time: '09:30', location: '336 Struben, Pretoria Central', description: 'Join us for worship and the Word every Sunday morning.' },
    { title: 'Choose Word Service', date: 'Tuesday', time: '18:00', location: '336 Struben, Pretoria Central', description: 'A powerful midweek service for deeper word alignment.' }
  ],
  gallery: [],
  structures: [
    { name: 'Visionary Leaders', image: '', members: [{ name: 'Pastor T.G NDALA', role: 'Lead Pastor' }, { name: 'Elder Mary', role: 'Assistant Pastor' }] },
    { name: 'Ministers', image: '', members: [{ name: 'Sis Joy', role: 'Minister' }, { name: 'Bro Mike', role: 'Minister' }] },
    { name: 'Executive Team', image: '', members: [{ name: 'Steve', role: 'Operations' }, { name: 'June', role: 'Finance' }] },
    { name: 'Media Team', image: '', members: [{ name: 'Tebo', role: 'Production' }, { name: 'Zandi', role: 'Social Media' }] },
    { name: 'Worship Team', image: 'WorshipTeam.jpeg', members: [{ name: 'Pastor Gift', role: 'Worship Leader' }, { name: 'Choir', role: 'Vocal Team' }] },
    { name: 'Ushers', image: '', members: [{ name: 'Samuel', role: 'Head Usher' }, { name: 'Leah', role: 'Usher' }] },
    { name: 'Intercessors', image: '', members: [{ name: 'Nandi', role: 'Head Intercessor' }, { name: 'Moses', role: 'Intercessor' }] }
  ],
  calendar: { month: '', events: [] },
  giving: {
    tithe:    { bank: 'Kingdom Impact Bank', account: '1234567890' },
    offering: { bank: 'Kingdom Impact Bank', account: '0987654321' }
  },
  services: {
    chooseWord: [{ title: 'Midweek Activation', description: 'A prophetic word service designed to activate the church family.' }],
    sunday:     [{ title: 'Sunday Word', description: 'A powerful church service for worship, word and community.' }]
  }
};

// ─── Merge saved + defaults ───────────────────────────────────────────────────
function mergeData(saved) {
  saved = saved || {};
  return {
    announcements: Array.isArray(saved.announcements) && saved.announcements.length ? saved.announcements : defaultData.announcements,
    sermons:       Array.isArray(saved.sermons) && saved.sermons.length ? saved.sermons : defaultData.sermons,
    contact:       { ...defaultData.contact, ...(saved.contact || {}) },
    countdown:     { ...defaultData.countdown, ...(saved.countdown || {}) },
    songs:         Array.isArray(saved.songs) ? saved.songs : defaultData.songs,
    events:        Array.isArray(saved.events) && saved.events.length ? saved.events : defaultData.events,
    gallery:       Array.isArray(saved.gallery) ? saved.gallery : defaultData.gallery,
    structures: (function () {
      const savedList = Array.isArray(saved.structures) && saved.structures.length ? saved.structures.slice() : [];
      defaultData.structures.forEach((d) => { if (!savedList.find((s) => s.name === d.name)) savedList.push(d); });
      return savedList.length ? savedList : defaultData.structures.slice();
    })(),
    calendar: { ...defaultData.calendar, ...(saved.calendar || {}) },
    giving:   { tithe: { ...defaultData.giving.tithe, ...(saved.giving?.tithe || {}) }, offering: { ...defaultData.giving.offering, ...(saved.giving?.offering || {}) } },
    services: {
      chooseWord: Array.isArray(saved.services?.chooseWord) && saved.services.chooseWord.length ? saved.services.chooseWord : defaultData.services.chooseWord,
      sunday:     Array.isArray(saved.services?.sunday) && saved.services.sunday.length ? saved.services.sunday : defaultData.services.sunday
    }
  };
}

// ─── Global siteData (populated async) ───────────────────────────────────────
let siteData = mergeData(null);

async function initSiteData() {
  const saved = await loadPersistedData();
  Object.assign(siteData, mergeData(saved));
  renderAll();
}

// ─── Render functions ─────────────────────────────────────────────────────────

function renderFeaturedAnnouncement() {
  const featured = siteData.announcements[0] || {};
  const el = (id) => document.getElementById(id);
  if (el('featuredTitle'))    el('featuredTitle').textContent    = featured.title    || 'Latest church announcement';
  if (el('featuredSummary'))  el('featuredSummary').textContent  = featured.body     || '';
  if (el('featuredDate'))     el('featuredDate').textContent     = featured.date     || 'This week';
  if (el('featuredCategory')) el('featuredCategory').textContent = featured.category ? `${featured.category} · News` : 'News';
  const img = el('featuredImage');
  if (img) { img.src = featured.image || 'announcement-feature.jpg'; img.style.display = ''; }
}

function renderAnnouncements() {
  const grid = document.getElementById('announcementGrid');
  if (!grid) return;
  const items = siteData.announcements.slice(0, 6);
  if (!items.length) { grid.innerHTML = '<div class="announcement-card"><p>No announcements available right now.</p></div>'; return; }
  grid.innerHTML = items.map((item) => `
    <article class="announcement-card searchable-item">
      ${item.image ? `<img src="${item.image}" alt="${item.title}" style="width:100%;border-radius:14px;margin-bottom:1rem;max-height:180px;object-fit:cover;" />` : ''}
      <span class="tag">${item.category || 'General'}</span>
      <h4>${item.title}</h4>
      <p>${item.body}</p>
      <span class="date">${item.date || ''}</span>
    </article>`).join('');
}

function renderSermons() {
  const container = document.getElementById('sermonGrid');
  if (!container) return;
  const items = siteData.sermons;
  if (!items.length) { container.innerHTML = '<div class="sermon-card"><p>No sermons available yet.</p></div>'; return; }
  container.innerHTML = items.map((item) => `
    <article class="sermon-card searchable-item">
      <h4>${item.title}</h4>
      <div class="meta">${item.speaker ? `Speaker: ${item.speaker}` : ''}</div>
      <p>${item.description || ''}</p>
      ${item.link ? `<a class="button button-secondary button-link" href="${item.link}" target="_blank" rel="noreferrer">Watch / Listen</a>` : ''}
    </article>`).join('');
}

function renderSongsList() {
  const container = document.getElementById('songListFront');
  if (!container) return;
  const songs = siteData.songs || [];
  if (!songs.length) { container.innerHTML = '<div class="sermon-card"><p>No worship songs added yet.</p></div>'; return; }
  container.innerHTML = songs.map((song, i) => `
    <article class="sermon-card">
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
        <span style="background:var(--yellow);color:#111;font-weight:800;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</span>
        <div>
          <h4 style="margin:0;">${song.title || 'Untitled'}</h4>
          <p style="color:rgba(255,255,255,0.65);margin:0.15rem 0 0;font-size:0.88rem;">${song.artist || 'Worship Team'}</p>
        </div>
      </div>
      ${song.url ? `<a href="${song.url}" target="_blank" rel="noreferrer" class="button button-secondary" style="margin-top:0.5rem;">Listen / View</a>` : ''}
    </article>`).join('');
}

function updateContactCards() {
  const sel = (q) => document.querySelector(q);
  const phone    = sel('#contact-section .contact-card:nth-child(2) p a');
  const email    = sel('#contact-section .contact-card:nth-child(3) p a');
  const location = sel('#contact-section .contact-card:nth-child(1) p');
  if (phone)    { phone.textContent = siteData.contact.phone; phone.href = `tel:${siteData.contact.phone.replace(/\s+/g,'')}`; }
  if (email)    { email.textContent = siteData.contact.email; email.href = `mailto:${siteData.contact.email}`; }
  if (location) { location.textContent = siteData.contact.address; }
}

function renderWorshipSection() {
  const c = document.getElementById('worshipGrid');
  if (c) c.innerHTML = '';
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function parseDateString(value) {
  if (!value || typeof value !== 'string') return null;
  let s = value.trim().replace(/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday),?\s+/i, '');
  const parsed = new Date(s);
  if (!isNaN(parsed)) return parsed;
  const parts = s.split(/\s+/);
  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10);
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    const mi = months.indexOf(parts[1].toLowerCase());
    if (!isNaN(day) && mi >= 0) {
      let year = new Date().getFullYear();
      if (parts[2]) { const y = parseInt(parts[2]); if (!isNaN(y)) year = y; }
      const d = new Date(year, mi, day);
      if (parts.length === 2 && d < new Date()) d.setFullYear(year + 1);
      return d;
    }
  }
  return null;
}

function parseWeekdayString(value) {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim().toLowerCase();
  const map = { sunday:0,sun:0,monday:1,mon:1,tuesday:2,tue:2,tues:2,wednesday:3,wed:3,thursday:4,thu:4,friday:5,fri:5,saturday:6,sat:6 };
  return map[raw] ?? null;
}

function applyEventTime(date, time) {
  if (!date || isNaN(date)) return null;
  const r = new Date(date);
  if (!time) { r.setHours(0,0,0,0); return r; }
  const p = time.trim().split(':').map(Number);
  r.setHours(isNaN(p[0])?0:p[0], isNaN(p[1])?0:p[1], 0, 0);
  return r;
}

function getNextWeeklyOccurrence(weekday, time, from = new Date()) {
  if (weekday === null) return null;
  const c = new Date(from); c.setHours(0,0,0,0);
  c.setDate(c.getDate() + (weekday - c.getDay() + 7) % 7);
  const ev = applyEventTime(c, time);
  if (ev && ev < from) { c.setDate(c.getDate() + 7); return applyEventTime(c, time); }
  return ev;
}

function getNextCalendarEventInstance() {
  const events = siteData.calendar?.events || [];
  const now = new Date();
  const upcoming = [];
  events.forEach((ev) => {
    const d = (ev.date || '').trim();
    const exact = parseDateString(d);
    if (exact) { const dt = applyEventTime(exact, ev.time); if (dt >= now) upcoming.push({ date: dt, event: ev }); return; }
    const wd = parseWeekdayString(d);
    if (wd !== null) { const dt = getNextWeeklyOccurrence(wd, ev.time, now); if (dt) upcoming.push({ date: dt, event: ev }); }
  });
  upcoming.sort((a, b) => a.date - b.date);
  return upcoming[0] || null;
}

function renderCountdown() {
  const el = document.getElementById('countdownTimer');
  if (!el) return;
  const nextEv = getNextCalendarEventInstance();
  const target = nextEv ? nextEv.date.getTime() : new Date(siteData.countdown.date).getTime();
  if (isNaN(target)) { el.textContent = 'Coming soon'; return; }
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) { el.textContent = 'EVENT IS LIVE'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff / 3600000) % 24);
    const m = Math.floor((diff / 60000) % 60);
    const s = Math.floor((diff / 1000) % 60);
    el.textContent = `${String(d).padStart(2,'0')}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  };
  tick();
  if (window._kicCountdown) clearInterval(window._kicCountdown);
  window._kicCountdown = setInterval(tick, 1000);
}

// ─── Search ───────────────────────────────────────────────────────────────────
function filterContent() {
  const q = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  document.querySelectorAll('.searchable-item').forEach((item) => {
    item.style.display = (!q || item.textContent.toLowerCase().includes(q)) ? '' : 'none';
  });
}

// ─── Prayer / subscribe actions ───────────────────────────────────────────────
function sendPrayerRequest() {
  const name    = document.getElementById('prayerName')?.value.trim()    || '';
  const email   = document.getElementById('prayerEmail')?.value.trim()   || '';
  const message = document.getElementById('prayerMessage')?.value.trim() || '';
  if (!message) { alert('Please enter your prayer request before sending.'); return; }
  const subject = `Prayer request from ${name || 'a guest'}`;
  const body    = encodeURIComponent(`Name: ${name || 'N/A'}\nEmail: ${email || 'N/A'}\n\n${message}`);
  window.location.href = `mailto:${siteData.contact.email}?subject=${encodeURIComponent(subject)}&body=${body}`;
}

function subscribeStayUpdated() {
  const body = encodeURIComponent('Hello KIC team,\nI would like to receive updates about services, events and announcements.');
  window.location.href = `mailto:${siteData.contact.email}?subject=Stay%20Updated%20with%20KIC&body=${body}`;
}

// ─── Render calendar / giving / services / structures (for sub-pages) ─────────
function renderCalendarEvents() {
  const container = document.getElementById('calendarEvents');
  const monthEl   = document.getElementById('calendarMonth');
  if (!container && !monthEl) return;
  const calendar = siteData.calendar || defaultData.calendar;
  if (monthEl) monthEl.textContent = calendar.month || 'Upcoming';
  if (!container) return;
  container.innerHTML = (calendar.events || []).map((ev) => `
    <article class="calendar-card">
      <h4>${ev.title}</h4>
      <p><strong>${ev.date}</strong> · ${ev.time}</p>
      <p>${ev.location}</p>
      <p>${ev.description}</p>
    </article>`).join('') || '<p>No calendar items yet.</p>';
}

function renderGivingDetails() {
  const titheEl    = document.getElementById('givingTithe');
  const offeringEl = document.getElementById('givingOffering');
  if (!titheEl && !offeringEl) return;
  const g = siteData.giving || defaultData.giving;
  if (titheEl)    titheEl.innerHTML    = `Bank: ${g.tithe.bank}<br/>Account: ${g.tithe.account}`;
  if (offeringEl) offeringEl.innerHTML = `Bank: ${g.offering.bank}<br/>Account: ${g.offering.account}`;
}

function renderServicePanels() {
  const cw   = siteData.services?.chooseWord || defaultData.services.chooseWord;
  const sun  = siteData.services?.sunday     || defaultData.services.sunday;
  const cwEl = document.getElementById('chooseWordServices');
  const sEl  = document.getElementById('sundayServices');
  if (cwEl) cwEl.innerHTML = cw.map((i) => `<div class="service-card"><h4>${i.title}</h4><p>${i.description}</p></div>`).join('') || '<p>No services defined.</p>';
  if (sEl)  sEl.innerHTML  = sun.map((i) => `<div class="service-card"><h4>${i.title}</h4><p>${i.description}</p></div>`).join('') || '<p>No services defined.</p>';
}

function selectStructure(name) {
  document.querySelectorAll('#structuresNav button').forEach((b) => b.classList.toggle('active', b.dataset.structure === name));
  const structure = (siteData.structures || defaultData.structures).find((s) => s.name === name);
  const detail = document.getElementById('structureDetail');
  if (!detail || !structure) return;
  detail.innerHTML = `
    <div class="structure-detail">
      <h3>${structure.name}</h3>
      ${structure.image ? `<img src="${structure.image}" alt="${structure.name}" />` : ''}
      <div class="members-grid">
        ${(structure.members || []).map((m) => `
          <div class="member-card">
            <img src="member-placeholder.jpg" alt="${m.name}" onerror="this.style.display='none'" />
            <div><strong>${m.name}</strong><p>${m.role || 'Member'}</p></div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ─── Master render ────────────────────────────────────────────────────────────
function renderAll() {
  renderFeaturedAnnouncement();
  renderAnnouncements();
  renderSermons();
  renderSongsList();
  renderWorshipSection();
  renderCountdown();
  updateContactCards();
  renderCalendarEvents();
  renderGivingDetails();
  renderServicePanels();
}

// ─── Cross-tab live sync ──────────────────────────────────────────────────────
window.addEventListener('storage', async (e) => {
  if (e.key === LS_UPDATED || e.key === LS_KEY) {
    const saved = await loadPersistedData();
    Object.assign(siteData, mergeData(saved));
    renderAll();
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
initSiteData();

// ─── Admin-side exports (used by admin.html) ──────────────────────────────────
window.KIC = {
  loadPersistedData,
  savePersistedData,
  mergeData,
  defaultData,
  get siteData() { return siteData; },
  async getSiteData() {
    const saved = await loadPersistedData();
    return mergeData(saved);
  },
  async setSiteData(data) {
    await savePersistedData(data);
    Object.assign(siteData, mergeData(data));
    renderAll();
  }
};
