// ── Toast ──
let _toastTimer = null;
const showToast = msg => {
  clearTimeout(_toastTimer);
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
};

// ── Utility helpers ──
const getDomain  = url => { try { return new URL(url).hostname.replace('www.',''); } catch { return ''; } };
const parsePrice = s => { if (!s && s !== 0) return Infinity; const n = parseFloat(String(s).replace(/[^\d.]/g,'')); return isNaN(n) ? Infinity : n; };
const plural     = (n,a,b,c) => { const m=n%100; if(m>=11&&m<=19)return c; const m2=n%10; if(m2===1)return a; if(m2>=2&&m2<=4)return b; return c; };
const today      = () => new Date().toISOString().slice(0,10);
const fmtDate    = d => { if(!d)return ''; if(/^\d{4}-\d{2}-\d{2}/.test(d)){try{return new Date(d+'T00:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'});}catch{}} return escHtml(d); };
const faviconUrl = url => { const d=getDomain(url); return d?`https://www.google.com/s2/favicons?domain=${d}&sz=64`:''; };
const getEmoji   = tags => { const m={одежда:'👕',техника:'💻',книги:'📚',дизайн:'🎨',путешествия:'✈️',хобби:'🎯',frontend:'💻'}; for(const t of(tags||[]))if(m[t])return m[t]; return '✨'; };
const openUrl    = url => { if (tg) tg.openLink(url); else window.open(url, '_blank'); };
const escHtml    = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

// ── Tag color helpers ──
function tagColor(tag) {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  let h = 0; for (let c of tag) h = c.charCodeAt(0) + ((h<<5)-h);
  const hue = Math.abs(h) % 360;
  return { bg:`hsl(${hue},35%,14%)`, color:`hsl(${hue},65%,65%)`, border:`hsl(${hue},35%,22%)` };
}

function applyChipColors() {
  document.querySelectorAll('.tag-chip[data-tag]').forEach(chip => {
    const tc = tagColor(chip.dataset.tag);
    chip.style.background  = chip.classList.contains('selected') ? tc.bg    : '#17132a';
    chip.style.color       = chip.classList.contains('selected') ? tc.color : '#7a6a9d';
    chip.style.borderColor = chip.classList.contains('selected') ? tc.border: '#2a2040';
  });
  document.querySelectorAll('.tag-chip[data-occ]').forEach(chip => {
    chip.style.background  = chip.classList.contains('selected') ? '#3a1f2f' : '#17132a';
    chip.style.color       = chip.classList.contains('selected') ? '#f472b6' : '#7a6a9d';
    chip.style.borderColor = chip.classList.contains('selected') ? '#5a2f4a' : '#2a2040';
  });
}

function tagBadges(tags) {
  return (tags||[]).map(t => { const tc=tagColor(t); return `<span class="wish-tag" style="background:${tc.bg};color:${tc.color}">${escHtml(t)}</span>`; }).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}); } catch { return escHtml(dateStr); }
}

// ── Price formatting ──
function formatPrice(raw, priceCur = 'BYN') {
  if (!raw && raw !== 0) return '';
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  if (isNaN(n) || n === 0) return '';
  const inBYN = n / (RATES[priceCur] || 1);
  const converted = inBYN * RATES[activeCur];
  const sym = CUR_SYM[activeCur];
  const rounded = activeCur === 'USD' ? converted.toFixed(2) : Math.round(converted);
  return activeCur === 'USD' ? `${sym}${rounded}` : `${rounded} ${sym}`;
}

// ── Sparkline ──
function sparkline(history) {
  if (!history || history.length < 2) return '';
  const prices = history.map(h => h.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const W = 60, H = 24, pad = 2, range = max - min || 1;
  const pts = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * (W - pad * 2);
    const y = H - pad - ((p - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = prices[prices.length - 1] <= prices[0] ? '#4ade80' : '#f87171';
  return `<div class="sparkline-wrap"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
}

// ── Filter & Sort ──
const priceBYN = w => { const n=parsePrice(w.price); return n===Infinity?Infinity:n/(RATES[w.priceCur||'BYN']||1); };

function applyFilter(list, query, sortVal) {
  let res = list;
  if (query) { const q=query.toLowerCase(); res=res.filter(w=>(w.title||'').toLowerCase().includes(q)||(w.tags||[]).some(t=>t.toLowerCase().includes(q))); }
  if (sortVal==='price-asc')  res=[...res].sort((a,b)=>priceBYN(a)-priceBYN(b));
  if (sortVal==='price-desc') res=[...res].sort((a,b)=>priceBYN(b)-priceBYN(a));
  if (sortVal==='prio')       res=[...res].sort((a,b)=>(PRIO_ORDER[a.priority||'']??3)-(PRIO_ORDER[b.priority||'']??3));
  if (sortVal !== 'manual') {
    const pinned = res.filter(i => i.pinned);
    const rest   = res.filter(i => !i.pinned);
    res = [...pinned, ...rest];
  }
  return res;
}

// ── Wish card HTML ──
function wishHTML(w, inArchive=false, isBigTab=false, isAllTab=false) {
  const bought = w.bought ? 'bought' : '';
  const check  = w.bought ? '✓' : '';

  let rightBadge = '';
  if (w.bought) {
    rightBadge = '<span class="wish-badge badge-green">✅</span>';
  } else if (w.big && !isBigTab && !isAllTab) {
    rightBadge = '<span class="wish-badge badge-gold">💎</span>';
  }

  const prioBadge = (!w.bought && w.priority && PRIO_BADGE[w.priority]) ? PRIO_BADGE[w.priority] : '';

  const canTrack = !w.bought && w.url && w.price && parsePrice(w.price) < Infinity;
  const trackHtml = canTrack
    ? (w.tracking
        ? `<span class="tracking-badge">💸 Слежу</span>`
        : `<div class="track-btn" onclick="trackPrice(event,'${w.id}')">💸 Следить</div>`)
    : '';

  const priceStr = formatPrice(w.price, w.priceCur);
  const faviconInner = w.url
    ? `<img src="${faviconUrl(w.url)}" onerror="this.style.display='none'" />`
    : (w.tags&&w.tags.length ? getEmoji(w.tags) : '✨');

  const bigLabel = (w.big && isAllTab && !w.bought) ? `<div class="big-label">крупная хотелка</div>` : '';

  const infoRow = (w.tags&&w.tags.length) || prioBadge || trackHtml
    ? `<div class="wish-tags">${tagBadges(w.tags)}${prioBadge}${trackHtml}</div>`
    : '';

  const pinHtml = (w.pinned && !w.bought) ? `<span class="wish-pin">📌</span>` : '';
  const menuRow = !inArchive
    ? `<div style="display:flex;align-items:center;gap:3px;justify-content:flex-end">${pinHtml}<span class="menu-btn" onclick="openCardMenu(event,'${w.id}','wish')">⋯</span></div>`
    : (pinHtml ? `<div style="text-align:right">${pinHtml}</div>` : '');

  return `
    <div class="swipe-wrap" data-id="${w.id}">
      ${!w.bought ? `<div class="delete-bg" onclick="deleteItem('${w.id}','wish')">🗑</div>` : ''}
      <div class="wish-item ${bought}" data-id="${w.id}" data-type="wish">
        <div class="drag-handle" data-drag="true">⠿</div>
        <div class="sel-check">✓</div>
        <div class="wish-check" onclick="toggleBought(event,'${w.id}')">${check}</div>
        <div class="wish-favicon">${faviconInner}</div>
        <div class="wish-info"${w.url ? ` data-href="${escHtml(w.url)}"` : ''}>
          <div class="wish-name">${escHtml(w.title)}</div>
          <div class="wish-domain">${w.url ? getDomain(w.url) : ''}</div>
          ${infoRow}
          ${bigLabel}
        </div>
        <div class="wish-right">
          ${menuRow}
          ${rightBadge}
          ${priceStr ? `<span class="wish-price" style="font-size:15px;font-weight:800">${priceStr}</span>` : ''}
          ${sparkline(w.priceHistory)}
          <span class="wish-date">${fmtDate(w.date)}</span>
        </div>
      </div>
    </div>`;
}

// ── Gift card HTML ──
function giftHTML(g) {
  const dateStr   = g.eventDate ? formatDate(g.eventDate) : '';
  const remindStr = g.remindDays && g.eventDate ? `🔔 за ${escHtml(String(g.remindDays))} дн.` : '';
  const priceStr  = formatPrice(g.price, g.priceCur);
  const occBadge  = g.occasion ? `<span class="occ-badge">${escHtml(g.occasion)}</span>` : '';
  return `
    <div class="swipe-wrap" data-id="${g.id}">
      <div class="delete-bg" onclick="deleteItem('${g.id}','gift')">🗑</div>
      <div class="wish-item" data-id="${g.id}" data-type="gift">
        <div class="drag-handle" data-drag="true">⠿</div>
        <div class="sel-check">✓</div>
        <div class="wish-favicon">${g.url ? `<img src="${faviconUrl(g.url)}" onerror="this.style.display='none'" />` : '🎁'}</div>
        <div class="wish-info"${g.url ? ` data-href="${escHtml(g.url)}"` : ''}>
          <div class="wish-name">${escHtml(g.title)}</div>
          <div class="wish-domain">${g.who ? '→ '+escHtml(g.who) : (g.url ? getDomain(g.url) : '—')}</div>
          <div class="wish-tags">
            ${dateStr ? `<span class="date-badge">📅 ${dateStr}</span>` : ''}
            ${occBadge}
          </div>
        </div>
        <div class="wish-right">
          <span class="menu-btn" onclick="openCardMenu(event,'${g.id}','gift')">⋯</span>
          ${priceStr ? `<span class="wish-price">${priceStr}</span>` : ''}
          ${remindStr ? `<div class="remind-btn" onclick="registerReminder(event,'${g.id}')">${remindStr}</div>` : ''}
        </div>
      </div>
    </div>`;
}

// ── Group gifts by person ──
function renderGiftsByPerson(gifts) {
  if (!gifts.length) return '<div class="empty"><div class="empty-icon">🎁</div><div class="empty-text">Нет подарков</div></div>';
  const groups = {};
  gifts.forEach(g => {
    const key = g.who || '—';
    if (!groups[key]) groups[key] = [];
    groups[key].push(g);
  });
  return Object.entries(groups).map(([who, list]) => `
    <div class="person-group">
      <div class="person-group-header">
        <span>${who === '—' ? 'Без получателя' : '👤 '+escHtml(who)}</span>
        <span class="person-count">${list.length} ${plural(list.length,'идея','идеи','идей')}</span>
      </div>
      ${list.map(g => giftHTML(g)).join('')}
    </div>`).join('');
}

// ── Stats ──
function renderStats(wishes) {
  const bought = wishes.filter(w => w.bought);
  const big    = wishes.filter(w => w.big);
  const sumBYN = wishes.reduce((acc,w) => {
    const n = parsePrice(w.price); if (n === Infinity) return acc;
    return acc + n / (RATES[w.priceCur || 'BYN'] || 1);
  }, 0);
  document.getElementById('statAll').textContent    = wishes.length;
  document.getElementById('statBig').textContent    = big.length;
  document.getElementById('statBought').textContent = bought.length;
  document.getElementById('statSum').textContent    = formatPrice(sumBYN) || `0 ${CUR_SYM[activeCur]}`;
  const pct = wishes.length ? Math.round(bought.length/wishes.length*100) : 0;
  document.getElementById('progText').textContent = pct+'%';
  document.getElementById('progFill').style.width  = pct+'%';
  const catMap = {};
  wishes.forEach(w => (w.tags||[]).forEach(t => { catMap[t]=(catMap[t]||0)+1; }));
  const sorted = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxCount = sorted[0]?.[1] || 1;
  const topEl = document.getElementById('topCats');
  topEl.innerHTML = sorted.length
    ? sorted.map(([name,cnt]) => { const tc=tagColor(name); const barPct=Math.round(cnt/maxCount*100); return `<div class="top-cat-row"><span style="font-size:14px;color:${tc.color}">${escHtml(name)}</span><div class="top-cat-bar"><div class="top-cat-fill" style="width:${barPct}%;background:${tc.color}"></div></div><span class="top-cat-count">${cnt}</span></div>`; }).join('')
    : '<div class="top-cat-row" style="color:#4a3a6d;font-size:14px">Нет категорий</div>';
}

// ── Contacts helpers ──
function getNextBirthday(birthday) {
  const parts = birthday.split('-');
  const month = parseInt(parts.length === 3 ? parts[1] : parts[0]);
  const day   = parseInt(parts.length === 3 ? parts[2] : parts[1]);
  const now = new Date();
  const dt = new Date(now.getFullYear(), month - 1, day);
  if (dt <= now) dt.setFullYear(now.getFullYear() + 1);
  return dt;
}

function getBirthYear(birthday) {
  const parts = birthday.split('-');
  return parts.length === 3 ? parseInt(parts[0]) : null;
}

function daysUntil(date) {
  return Math.ceil((date - new Date()) / 86400000);
}

// ── Render contacts ──
function renderContacts() {
  const card = document.getElementById('contactsCard'); if (!card) return;
  const contacts = loadContacts();
  if (!contacts.length) {
    card.innerHTML = '<div class="field" style="color:#4a3a6d;font-size:14px">Добавь контакты, чтобы автоматически заполнять даты подарков</div>';
    return;
  }
  const sorted = [...contacts].sort((a,b) => {
    if (!a.birthday) return 1; if (!b.birthday) return -1;
    return daysUntil(getNextBirthday(a.birthday)) - daysUntil(getNextBirthday(b.birthday));
  });
  card.innerHTML = sorted.map(c => {
    const nextBd = c.birthday ? getNextBirthday(c.birthday) : null;
    const days = nextBd ? daysUntil(nextBd) : null;
    let bdStr = 'без ДР';
    if (c.birthday) {
      const parts = c.birthday.split('-');
      if (parts.length === 3) {
        const birthYear = parseInt(parts[0]);
        const age = new Date().getFullYear() - birthYear + (nextBd && nextBd.getFullYear() > new Date().getFullYear() ? -1 : 0);
        bdStr = `🎂 ${parts[2]}.${parts[1]}.${parts[0]} · ${age} ${plural(age,'год','года','лет')}`;
      } else {
        bdStr = `🎂 ${parts[1]}.${parts[0]}`;
      }
    }
    const daysStr = days !== null ? (days === 0 ? '🎉 Сегодня!' : `через ${days} дн.`) : '';
    return `<div class="contact-item">
      <div class="contact-avatar">👤</div>
      <div class="contact-info">
        <div class="contact-name">${escHtml(c.name)}</div>
        <div class="contact-bday">${bdStr}</div>
      </div>
      ${daysStr ? `<span class="contact-days">${daysStr}</span>` : ''}
      <span class="contact-del" onclick="deleteContact('${c.id}')">✕</span>
    </div>`;
  }).join('');
}

function _refreshContactsDatalist() {
  const dl = document.getElementById('contactsDatalist'); if (!dl) return;
  dl.innerHTML = loadContacts().map(c => `<option value="${escHtml(c.name)}"></option>`).join('');
}

// ── Main refresh ──
function refresh() {
  const wishes  = load();
  const active  = wishes.filter(w => !w.bought);
  const bought  = wishes.filter(w => w.bought);
  const big     = active.filter(w => w.big);
  const gifts   = loadGifts();
  const qA = document.getElementById('search-all')?.value || '';
  const qB = document.getElementById('search-big')?.value || '';
  const sA = document.getElementById('sort-all')?.value || 'date';
  const sB = document.getElementById('sort-big')?.value || 'date';

  // Active lists
  const allEl = document.getElementById('list-all');
  const filtered = applyFilter(active, qA, sA);
  allEl.innerHTML = filtered.length
    ? filtered.map(w => wishHTML(w, false, false, true)).join('')
    : `<div class="empty"><div class="empty-icon">✨</div><div class="empty-text">Пока пусто — добавь первую хотелку</div></div>`;

  const bigEl = document.getElementById('list-big');
  const filteredBig = applyFilter(big, qB, sB);
  bigEl.innerHTML = filteredBig.length
    ? filteredBig.map(w => wishHTML(w, false, true, false)).join('')
    : `<div class="empty"><div class="empty-icon">💎</div><div class="empty-text">Нет крупных хотелок</div></div>`;

  // Archive section (all wishes)
  const archSec = document.getElementById('archiveSection');
  archSec.style.display = bought.length ? '' : 'none';
  document.getElementById('archiveCount').textContent = bought.length;
  document.getElementById('archiveBody').innerHTML = bought.map(w => wishHTML(w, true)).join('');

  // Archive section (big wishes)
  const boughtBig = bought.filter(w => w.big);
  const archSecBig = document.getElementById('archiveSectionBig');
  archSecBig.style.display = boughtBig.length ? '' : 'none';
  document.getElementById('archiveCountBig').textContent = boughtBig.length;
  document.getElementById('archiveBodyBig').innerHTML = boughtBig.map(w => wishHTML(w, true, true)).join('');

  // Gifts
  let filteredGifts = activeOccasion
    ? gifts.filter(g => g.occasion === activeOccasion)
    : gifts;
  filteredGifts = [...filteredGifts.filter(g => g.pinned), ...filteredGifts.filter(g => !g.pinned)];
  const giftsEl = document.getElementById('list-gifts');
  if (!filteredGifts.length) {
    giftsEl.innerHTML = `<div class="empty"><div class="empty-icon">🎁</div><div class="empty-text">Нет подарков</div></div>`;
  } else if (giftsView === 'person') {
    giftsEl.innerHTML = renderGiftsByPerson(filteredGifts);
  } else {
    giftsEl.innerHTML = filteredGifts.map(giftHTML).join('');
  }

  // Subtitles
  document.getElementById('sub-all').textContent   = active.length+' '+plural(active.length,'желание','желания','желаний');
  document.getElementById('sub-big').textContent   = big.length+' '+plural(big.length,'желание','желания','желаний');
  document.getElementById('sub-gifts').textContent = gifts.length+' '+plural(gifts.length,'идея','идеи','идей');

  // Stats
  renderStats(wishes);
  applyChipColors(); updateCurUI(); initSwipe(); initDrag();
  renderContacts();
}
