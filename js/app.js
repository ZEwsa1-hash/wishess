// ── Telegram WebApp init ──
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready(); tg.expand();
  tg.MainButton.setText('Сохранить'); tg.MainButton.hide();
  const u = tg.initDataUnsafe?.user;
  if (u) document.getElementById('profileName').textContent = [u.first_name, u.last_name].filter(Boolean).join(' ');
}

// ── Currency dropdown ──
const gDrop = document.getElementById('globalCurDrop');
let _dropOpenBtn = null;

function updateCurUI() {
  document.querySelectorAll('.cur-label').forEach(el => el.textContent = activeCur);
  document.querySelectorAll('#globalCurDrop .cur-opt').forEach(el =>
    el.classList.toggle('sel', el.dataset.cur === activeCur));
  localStorage.setItem('currency', activeCur);
}

function toggleCurDrop(e) {
  e.stopPropagation();
  occDrop.classList.remove('open'); _occOpenBtn = null;
  const btn = e.currentTarget;
  if (_dropOpenBtn === btn && gDrop.classList.contains('open')) {
    gDrop.classList.remove('open'); _dropOpenBtn = null; return;
  }
  const rect = btn.getBoundingClientRect();
  const dropH = 160, dropW = 130;
  const left = Math.min(rect.right - dropW, window.innerWidth - dropW - 8);
  if (window.innerHeight - rect.bottom < dropH + 8) {
    gDrop.style.top = (rect.top - dropH - 8) + 'px';
  } else {
    gDrop.style.top = (rect.bottom + 8) + 'px';
  }
  gDrop.style.left = Math.max(8, left) + 'px';
  gDrop.classList.add('open');
  _dropOpenBtn = btn;
}

function setCur(cur, e) {
  e.stopPropagation();
  activeCur = cur; updateCurUI();
  gDrop.classList.remove('open'); _dropOpenBtn = null;
  refresh();
}

// ── Occasion dropdown ──
const occDrop = document.getElementById('occDrop');
let _occOpenBtn = null;

function toggleOccDrop(e) {
  e.stopPropagation();
  gDrop.classList.remove('open'); _dropOpenBtn = null;
  const btn = e.currentTarget;
  if (_occOpenBtn === btn && occDrop.classList.contains('open')) {
    occDrop.classList.remove('open'); _occOpenBtn = null; return;
  }
  const rect = btn.getBoundingClientRect();
  const dropH = 7 * 46 + 8, dropW = 150;
  const left = Math.min(rect.right - dropW, window.innerWidth - dropW - 8);
  occDrop.style.top  = (window.innerHeight - rect.top < dropH + 8 ? rect.top - dropH - 8 : rect.bottom + 8) + 'px';
  occDrop.style.left = Math.max(8, left) + 'px';
  occDrop.classList.add('open');
  _occOpenBtn = btn;
}

function setOccasion(occ, e) {
  e.stopPropagation();
  activeOccasion = occ;
  occDrop.classList.remove('open'); _occOpenBtn = null;
  const btn = document.getElementById('occBtn');
  if (btn) btn.textContent = (occ || 'Повод') + ' ▾';
  document.querySelectorAll('#occDrop .cur-opt').forEach(el =>
    el.classList.toggle('sel', el.dataset.occ === occ));
  refresh();
}

// ── Global click handler ──
document.addEventListener('click', e => {
  gDrop.classList.remove('open'); _dropOpenBtn = null;
  occDrop.classList.remove('open'); _occOpenBtn = null;
  if (!e.target.closest('#cardMenu')) cardMenu.classList.remove('open');
  const sc = e.target.closest('.sel-check');
  if (sc) { const wrap=sc.closest('.swipe-wrap'); if(wrap) { e.stopPropagation(); toggleSel(wrap.dataset.id); return; } }
  if (_selMode) { const wrap=e.target.closest('.swipe-wrap[data-id]'); if(wrap && !e.target.closest('.menu-btn')) { e.stopPropagation(); toggleSel(wrap.dataset.id); return; } }
  const info = e.target.closest('.wish-info[data-href]');
  if (info && !e.target.closest('.wish-tags, .menu-btn')) openUrl(info.dataset.href);
});

// ── Priority pills ──
let activePrio = '';
document.getElementById('prioPills').addEventListener('click', e => {
  const pill = e.target.closest('.prio-pill'); if (!pill) return;
  document.querySelectorAll('.prio-pill').forEach(p => p.classList.remove('sel'));
  pill.classList.add('sel'); activePrio = pill.dataset.p;
});

// ── Gifts view state ──
let giftsView = 'list';
let activeOccasion = '';

function setGiftsMainTab(tab, btn) {
  document.getElementById('gtab-add').style.display  = tab === 'add' ? '' : 'none';
  document.getElementById('gtab-list').style.display = tab === 'list' ? '' : 'none';
  document.getElementById('gtab-add-btn').classList.toggle('active', tab === 'add');
  document.getElementById('gtab-list-btn').classList.toggle('active', tab === 'list');
}

function setGiftsView(v, btn) {
  giftsView = v;
  document.querySelectorAll('#gtab-list .view-btn-sm').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  refresh();
}

// ── Archive toggles ──
let archiveOpen = false, archiveBigOpen = false;

function toggleArchive() {
  archiveOpen = !archiveOpen;
  document.getElementById('archiveBody').classList.toggle('open', archiveOpen);
  document.getElementById('archiveArrow').classList.toggle('open', archiveOpen);
}

function toggleArchiveBig() {
  archiveBigOpen = !archiveBigOpen;
  document.getElementById('archiveBodyBig').classList.toggle('open', archiveBigOpen);
  document.getElementById('archiveArrowBig').classList.toggle('open', archiveBigOpen);
}

// ── Card context menu ──
const cardMenu = document.getElementById('cardMenu');
let _cardMenuId = null, _cardMenuType = null;

function openCardMenu(e, id, type) {
  e.stopPropagation();
  _cardMenuId = id; _cardMenuType = type;
  const rect = e.currentTarget.getBoundingClientRect();
  const menuW = 170, menuH = 148;
  let top = rect.bottom + 8;
  if (top + menuH > window.innerHeight) top = rect.top - menuH - 8;
  let left = rect.right - menuW;
  if (left < 8) left = 8;
  cardMenu.style.top  = top  + 'px';
  cardMenu.style.left = left + 'px';
  const list = type === 'gift' ? loadGifts() : load();
  const item = list.find(i => String(i.id) === String(id));
  document.getElementById('cardMenuPin').textContent = (item?.pinned ? '📌 Открепить' : '📌 Закрепить');
  cardMenu.classList.add('open');
}

function cardMenuEdit() {
  cardMenu.classList.remove('open');
  const fakeE = { stopPropagation: () => {} };
  if (_cardMenuType === 'gift') openEditGift(fakeE, _cardMenuId);
  else openEditWish(fakeE, _cardMenuId);
}

function cardMenuPin() {
  cardMenu.classList.remove('open');
  const isGift = _cardMenuType === 'gift';
  const list = isGift ? loadGifts() : load();
  const item = list.find(i => String(i.id) === String(_cardMenuId));
  if (!item) return;
  item.pinned = !item.pinned;
  isGift ? saveGifts(list) : save(list);
  refresh();
  showToast(item.pinned ? '📌 Закреплено' : '📌 Откреплено');
}

function cardMenuDelete() {
  cardMenu.classList.remove('open');
  deleteItem(_cardMenuId, _cardMenuType);
}

// ── Delete & undo ──
let _undoItem = null, _undoType = null, _undoTimer = null;

function deleteItem(id, type) {
  const list = type === 'gift' ? loadGifts() : load();
  _undoItem = list.find(i => String(i.id) === String(id)) || null;
  _undoType = type;
  if(type === 'gift') saveGifts(list.filter(g => String(g.id) !== String(id)));
  else save(list.filter(w => String(w.id) !== String(id)));
  refresh();
  clearTimeout(_undoTimer);
  const t = document.getElementById('toast');
  t.innerHTML = '🗑 Удалено &nbsp;<b style="text-decoration:underline;cursor:pointer" onclick="undoDelete()">Отменить</b>';
  t.classList.add('show');
  _undoTimer = setTimeout(() => { t.classList.remove('show'); _undoItem = null; }, 4000);
}

function undoDelete() {
  if (!_undoItem) return;
  clearTimeout(_undoTimer);
  const items = Array.isArray(_undoItem) ? _undoItem : [_undoItem];
  if (_undoType === 'gift' || _undoType === 'gift_multi') {
    const l = loadGifts(); items.forEach(i => l.unshift(i)); saveGifts(l);
  } else {
    const l = load(); items.forEach(i => l.unshift(i)); save(l);
  }
  document.getElementById('toast').classList.remove('show');
  _undoItem = null; _undoType = null;
  refresh(); showToast('↩️ Восстановлено');
}

function toggleBought(e, id) {
  e.stopPropagation();
  const list = load(), w = list.find(w => String(w.id) === String(id)); if (!w) return;
  w.bought = !w.bought;
  if(w.bought) w.boughtDate = today();
  save(list); refresh();
  showToast(w.bought ? '✅ В архив!' : '↩️ Возвращено');
}

// ── Price tracking ──
function trackPrice(e, id) {
  e.stopPropagation();
  if (!tg) { showToast('❌ Только в Telegram'); return; }
  const list = load(), w = list.find(w => String(w.id) === String(id)); if (!w) return;
  tg.showConfirm(
    `Отслеживать снижение цены?\n\n🛍 ${w.title}\n💰 ${formatPrice(w.price, w.priceCur)}\n\n(Приложение закроется)`,
    ok => {
      if (!ok) return;
      w.tracking = true;
      if (!w.priceHistory) w.priceHistory = [];
      w.priceHistory.push({ price: parsePrice(w.price), date: today() });
      save(list);
      tg.sendData(JSON.stringify({ type:'trackPrice', id:w.id, title:w.title, url:w.url, price:parsePrice(w.price) }));
    }
  );
}

// ── Reminder ──
function registerReminder(e, id) {
  e.stopPropagation();
  if (!tg) return;
  const gift = loadGifts().find(g => String(g.id) === String(id)); if (!gift) return;
  tg.showConfirm(
    `Зарегистрировать напоминание?\n\n🎁 ${gift.title}\n📅 ${formatDate(gift.eventDate)}\n🔔 За ${gift.remindDays} дней\n\n(Приложение закроется)`,
    ok => { if(ok) tg.sendData(JSON.stringify({type:'reminder', id:gift.id, title:gift.title, who:gift.who||'', eventDate:gift.eventDate, remindDays:gift.remindDays})); }
  );
}

// ── Swipe to delete ──
function initSwipe() {
  document.querySelectorAll('.wish-item').forEach(el => {
    if (el.classList.contains('bought')) return;
    let sx=0, sy=0, drag=false;
    el.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;drag=false;},{passive:true});
    el.addEventListener('touchmove',e=>{
      const dx=e.touches[0].clientX-sx, dy=e.touches[0].clientY-sy;
      if(!drag&&Math.abs(dy)>Math.abs(dx))return; if(dx>0)return; drag=true;
      el.style.transform=`translateX(${Math.max(dx,-80)}px)`; e.preventDefault();
    },{passive:false});
    el.addEventListener('touchend',e=>{
      const dx=e.changedTouches[0].clientX-sx;
      if(dx<-55){ clearTimeout(el._swipeTimer); el.style.cssText='transform:translateX(-100%);opacity:0;transition:transform .25s,opacity .25s'; el._swipeTimer=setTimeout(()=>deleteItem(el.dataset.id,el.dataset.type),250); }
      else el.style.transform='';
    },{passive:true});
  });
}

// ── Keyboard scroll & FAB ──
document.addEventListener('focusin', e => {
  const el = e.target;
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
});
if (tg) {
  tg.onEvent('viewportChanged', () => {
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  });
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const fab = document.getElementById('fabAdd');
    if (!fab.classList.contains('show')) return;
    const kbHeight = window.innerHeight - window.visualViewport.height;
    if (kbHeight > 80) {
      fab.style.bottom = (kbHeight + 12) + 'px';
    } else {
      fab.style.bottom = 'calc(122px + env(safe-area-inset-bottom,0px))';
    }
  });
}

// ── Tabs ──
let currentTab = 'home';

function _switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-tab="${tab}"]`)?.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.getElementById('fabAdd').classList.toggle('show', tab === 'all' || tab === 'big');
  if(tg) syncBtn();
}

function goToHomeAdd(big) {
  _switchTab('home');
  if (big) { isBigEl.checked = true; }
  setTimeout(() => titleEl.focus(), 100);
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => _switchTab(item.dataset.tab));
});

['all','big'].forEach(id => {
  document.getElementById('search-'+id).addEventListener('input', refresh);
  document.getElementById('sort-'+id).addEventListener('change', refresh);
});

// ── Home form ──
const titleEl  = document.getElementById('title');
const urlEl    = document.getElementById('url');
const priceEl  = document.getElementById('price');
const tagsEl   = document.getElementById('tags');
const notesEl  = document.getElementById('notes');
const isBigEl  = document.getElementById('isBig');
const isGiftEl = document.getElementById('isGift');
const statusEl = document.getElementById('urlStatus');
const clearBtn = document.getElementById('urlClear');

function toggleGiftMode(on) {
  document.getElementById('giftWhoRow').style.display = on ? '' : 'none';
  document.getElementById('prioSection').style.display = on ? 'none' : '';
}

const isUrl = s => { try{const u=new URL(s);return u.protocol==='http:'||u.protocol==='https:';}catch{return false;} };

function syncBtn() {
  if(!tg) return;
  if(currentTab === 'home') { titleEl.value.trim()?tg.MainButton.show():tg.MainButton.hide(); tg.MainButton.setText('Сохранить хотелку'); }
  else if(currentTab === 'gifts') { document.getElementById('g-title').value.trim()?tg.MainButton.show():tg.MainButton.hide(); tg.MainButton.setText('Сохранить подарок'); }
  else tg.MainButton.hide();
}

titleEl.addEventListener('input', syncBtn);

// URL preview + duplicate check
let previewTimer = null;
urlEl.addEventListener('input', () => {
  const v = urlEl.value.trim();
  clearBtn.style.display = v ? 'flex' : 'none';
  if(!v) { statusEl.textContent=''; statusEl.className='status'; document.getElementById('urlPreview').classList.remove('show'); return; }
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    if(!isUrl(v)) return;
    const existing = load().find(w => w.url && w.url.trim() === v);
    if(existing) { statusEl.className='status warn'; statusEl.textContent=`⚠️ Уже сохранено: «${existing.title}»`; }
    else { statusEl.className='status'; statusEl.textContent=''; }
    const domain = getDomain(v);
    document.getElementById('previewFavicon').src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    document.getElementById('previewTitle').textContent = domain;
    document.getElementById('urlPreview').classList.add('show');
  }, 400);
});

clearBtn.addEventListener('click', () => {
  urlEl.value=''; clearBtn.style.display='none'; statusEl.textContent=''; statusEl.className='status';
  document.getElementById('urlPreview').classList.remove('show'); urlEl.focus();
});

document.getElementById('quickTags').addEventListener('click', e => {
  const chip = e.target.closest('.tag-chip'); if(!chip) return;
  chip.classList.toggle('selected');
  const tag = chip.dataset.tag, cur = tagsEl.value.split(',').map(t=>t.trim()).filter(Boolean);
  const idx = cur.indexOf(tag); if(idx===-1) cur.push(tag); else cur.splice(idx,1);
  tagsEl.value = cur.join(', '); applyChipColors();
});

tagsEl.addEventListener('input', () => {
  const cur = tagsEl.value.split(',').map(t => t.trim());
  document.querySelectorAll('.tag-chip[data-tag]').forEach(c => c.classList.toggle('selected', cur.includes(c.dataset.tag)));
  applyChipColors();
});

document.getElementById('occQuickTags').addEventListener('click', e => {
  const chip = e.target.closest('.tag-chip'); if(!chip) return;
  const isSelected = chip.classList.contains('selected');
  document.querySelectorAll('#occQuickTags .tag-chip').forEach(c => c.classList.remove('selected'));
  if(!isSelected) { chip.classList.add('selected'); document.getElementById('g-occ').value = chip.dataset.occ; }
  else document.getElementById('g-occ').value = '';
  applyChipColors();
});

if(navigator.clipboard?.readText) {
  navigator.clipboard.readText().then(text => {
    const t = text?.trim();
    if(t && isUrl(t) && !urlEl.value) { urlEl.value=t; clearBtn.style.display='flex'; statusEl.className='status ok'; statusEl.textContent='📋 Вставлено из буфера'; urlEl.dispatchEvent(new Event('input')); }
  }).catch(() => {});
}

document.getElementById('g-title').addEventListener('input', syncBtn);

// ── Save wish ──
function saveWish() {
  const title = titleEl.value.trim(); if(!title) return;
  const url = urlEl.value.trim(), price = priceEl.value.trim(), notes = notesEl.value.trim();

  if (isGiftEl.checked) {
    const list = loadGifts();
    list.unshift({ id:Date.now(), title, who:document.getElementById('giftWho').value.trim(),
      price, priceCur:activeCur, url, notes, occasion:'', eventDate:'', remindDays:'',
      big: isBigEl.checked, date:today() });
    saveGifts(list); refresh();
    showToast('🎁 Подарок сохранён!');
  } else {
    const tags = tagsEl.value.split(',').map(t => t.trim()).filter(Boolean);
    const list = load();
    list.unshift({ id:Date.now(), title, url, price, priceCur:activeCur, tags, notes, big:isBigEl.checked, bought:false, priority:activePrio, date:today() });
    save(list); refresh();
    const emoji = activePrio==='urgent'?'🔴':activePrio==='important'?'🟡':isBigEl.checked?'💎':'✨';
    showToast(`${emoji} Хотелка сохранена!`);
  }

  titleEl.value=''; urlEl.value=''; priceEl.value=''; tagsEl.value=''; notesEl.value='';
  isBigEl.checked=false; isGiftEl.checked=false;
  document.getElementById('giftWho').value='';
  toggleGiftMode(false);
  clearBtn.style.display='none'; statusEl.textContent=''; statusEl.className='status';
  document.getElementById('urlPreview').classList.remove('show');
  document.querySelectorAll('.tag-chip[data-tag]').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.prio-pill').forEach(p => p.classList.remove('sel'));
  document.querySelector('.prio-pill[data-p=""]').classList.add('sel');
  activePrio=''; applyChipColors(); if(tg) tg.MainButton.hide();
}

// ── Save gift ──
function saveGift() {
  const title = document.getElementById('g-title').value.trim(); if(!title) return;
  const list = loadGifts();
  list.unshift({
    id: Date.now(), title,
    who:      document.getElementById('g-who').value.trim(),
    price:    document.getElementById('g-price').value.trim(),
    priceCur: activeCur,
    url:      document.getElementById('g-url').value.trim(),
    notes:    document.getElementById('g-notes').value.trim(),
    occasion: document.getElementById('g-occ').value,
    eventDate:document.getElementById('g-date').value,
    remindDays:document.getElementById('g-remind').value || '',
    big: false,
    date: today()
  });
  saveGifts(list); refresh();
  showToast('🎁 Подарок сохранён!');
  ['g-title','g-who','g-price','g-url','g-notes'].forEach(id => document.getElementById(id).value='');
  document.getElementById('g-date').value=''; document.getElementById('g-remind').value=''; document.getElementById('g-occ').value='';
  document.querySelectorAll('#occQuickTags .tag-chip').forEach(c => c.classList.remove('selected'));
  applyChipColors(); if(tg) tg.MainButton.hide();
}

if(tg) tg.MainButton.onClick(() => { if(currentTab==='home') saveWish(); if(currentTab==='gifts') saveGift(); });

// ── Edit sheet ──
let _editId = null, _editType = null, _editPrio = '';

function openEditWish(e, id) {
  e.stopPropagation();
  const w = load().find(w => String(w.id) === String(id)); if (!w) return;
  _editId = id; _editType = 'wish'; _editPrio = w.priority || '';
  document.getElementById('editSheetTitle').textContent = 'Редактировать хотелку';
  document.getElementById('editWishFields').style.display = '';
  document.getElementById('editGiftFields').style.display = 'none';
  document.getElementById('edit-title').value = w.title || '';
  const _wp = parseFloat(w.price) || 0;
  const _wc = _wp > 0 ? _wp / (RATES[w.priceCur || 'BYN'] || 1) * RATES[activeCur] : 0;
  document.getElementById('edit-price').value = _wc > 0 ? (activeCur === 'USD' ? _wc.toFixed(2) : Math.round(_wc)) : '';
  document.getElementById('edit-tags').value  = (w.tags || []).join(', ');
  document.getElementById('edit-url').value   = w.url || '';
  document.getElementById('edit-notes').value = w.notes || '';
  document.getElementById('edit-big').checked = !!w.big;
  document.getElementById('edit-isGift').checked = false;
  document.querySelectorAll('#editPrioPills .prio-pill').forEach(p =>
    p.classList.toggle('sel', p.dataset.p === _editPrio));
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('editSheet').classList.add('open');
  if (tg?.BackButton) { tg.BackButton.show(); tg.BackButton.onClick(closeEdit); }
  updateCurUI();
}

function openEditGift(e, id) {
  e.stopPropagation();
  const g = loadGifts().find(g => String(g.id) === String(id)); if (!g) return;
  _editId = id; _editType = 'gift';
  document.getElementById('editSheetTitle').textContent = 'Редактировать подарок';
  document.getElementById('editWishFields').style.display = 'none';
  document.getElementById('editGiftFields').style.display = '';
  document.getElementById('edit-g-title').value = g.title || '';
  document.getElementById('edit-g-who').value   = g.who || '';
  const _gp = parseFloat(g.price) || 0;
  const _gc = _gp > 0 ? _gp / (RATES[g.priceCur || 'BYN'] || 1) * RATES[activeCur] : 0;
  document.getElementById('edit-g-price').value = _gc > 0 ? (activeCur === 'USD' ? _gc.toFixed(2) : Math.round(_gc)) : '';
  document.getElementById('edit-g-url').value   = g.url || '';
  document.getElementById('edit-g-notes').value = g.notes || '';
  document.getElementById('edit-g-occ').value   = g.occasion || '';
  document.getElementById('edit-g-big').checked = !!g.big;
  document.querySelectorAll('#editOccTags .tag-chip').forEach(c =>
    c.classList.toggle('selected', c.dataset.occ === (g.occasion || '')));
  applyChipColors();
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('editSheet').classList.add('open');
  if (tg?.BackButton) { tg.BackButton.show(); tg.BackButton.onClick(closeEdit); }
  updateCurUI();
}

function closeEdit() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('editSheet').classList.remove('open');
  _editId = null; _editType = null;
  if (tg?.BackButton) { tg.BackButton.offClick(closeEdit); tg.BackButton.hide(); }
}

function setEditPrio(pill) {
  _editPrio = pill.dataset.p;
  document.querySelectorAll('#editPrioPills .prio-pill').forEach(p => p.classList.remove('sel'));
  pill.classList.add('sel');
}

function setEditOcc(chip) {
  const isSelected = chip.classList.contains('selected');
  document.querySelectorAll('#editOccTags .tag-chip').forEach(c => c.classList.remove('selected'));
  if (!isSelected) { chip.classList.add('selected'); document.getElementById('edit-g-occ').value = chip.dataset.occ; }
  else document.getElementById('edit-g-occ').value = '';
  applyChipColors();
}

function saveEdit() {
  if (!_editId) return;
  if (_editType === 'wish') {
    const title = document.getElementById('edit-title').value.trim(); if (!title) return;
    const list = load(), w = list.find(w => String(w.id) === String(_editId)); if (!w) return;
    const isGiftNow = document.getElementById('edit-isGift').checked;
    if (isGiftNow) {
      const gifts = loadGifts();
      gifts.unshift({ id: w.id, title, who: '', price: document.getElementById('edit-price').value.trim(),
        priceCur: activeCur, url: document.getElementById('edit-url').value.trim(),
        notes: document.getElementById('edit-notes').value.trim(), occasion: '', eventDate: '', remindDays: '',
        big: document.getElementById('edit-big').checked, date: w.date || today() });
      saveGifts(gifts);
      save(list.filter(x => String(x.id) !== String(_editId)));
      showToast('🎁 Перемещено в подарки');
    } else {
      w.title    = title;
      w.price    = document.getElementById('edit-price').value.trim();
      w.priceCur = activeCur;
      w.tags     = document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(Boolean);
      w.url      = document.getElementById('edit-url').value.trim();
      w.notes    = document.getElementById('edit-notes').value.trim();
      w.priority = _editPrio;
      w.big      = document.getElementById('edit-big').checked;
      save(list);
      showToast('✅ Изменения сохранены');
    }
  } else {
    const title = document.getElementById('edit-g-title').value.trim(); if (!title) return;
    const list = loadGifts(), g = list.find(g => String(g.id) === String(_editId)); if (!g) return;
    g.title    = title;
    g.who      = document.getElementById('edit-g-who').value.trim();
    g.price    = document.getElementById('edit-g-price').value.trim();
    g.priceCur = activeCur;
    g.url      = document.getElementById('edit-g-url').value.trim();
    g.notes    = document.getElementById('edit-g-notes').value.trim();
    g.occasion = document.getElementById('edit-g-occ').value;
    g.big      = document.getElementById('edit-g-big').checked;
    saveGifts(list);
    showToast('✅ Подарок обновлён');
  }
  closeEdit(); refresh();
}

// ── Multi-select ──
let _selMode = false, _selType = null, _selContainer = null;
const _selIds = new Set();

function enterSelMode(type, container) {
  if (_selMode) return;
  _selMode = true; _selType = type;
  _selContainer = container || document.getElementById(type === 'gift' ? 'list-gifts' : 'list-all');
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
  _selContainer?.classList.add('sel-mode');
  document.getElementById('selBar').classList.add('show');
  _updateSelCount();
}

function exitSelMode() {
  _selMode = false; _selType = null; _selContainer = null; _selIds.clear();
  document.querySelectorAll('.sel-mode').forEach(el => el.classList.remove('sel-mode'));
  document.querySelectorAll('.swipe-wrap.selected').forEach(el => el.classList.remove('selected'));
  document.getElementById('selBar').classList.remove('show');
}

function toggleSel(id) {
  if (!_selMode) return;
  const wrap = document.querySelector(`.swipe-wrap[data-id="${id}"]`);
  if (_selIds.has(id)) { _selIds.delete(id); wrap?.classList.remove('selected'); }
  else { _selIds.add(id); wrap?.classList.add('selected'); }
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  _updateSelCount();
}

function _updateSelCount() {
  document.getElementById('selCount').textContent = _selIds.size + ' выбрано';
  document.querySelector('.sel-del').style.opacity = _selIds.size ? '1' : '0.4';
}

function deleteSelected() {
  if (!_selIds.size) return;
  const ids = [..._selIds];
  if (_selType === 'gift') {
    const list = loadGifts();
    _undoItem = list.filter(g => ids.includes(String(g.id)));
    _undoType = 'gift_multi';
    saveGifts(list.filter(g => !ids.includes(String(g.id))));
  } else {
    const list = load();
    _undoItem = list.filter(w => ids.includes(String(w.id)));
    _undoType = 'wish_multi';
    save(list.filter(w => !ids.includes(String(w.id))));
  }
  const n = ids.length;
  exitSelMode();
  refresh();
  clearTimeout(_undoTimer);
  const t = document.getElementById('toast');
  t.innerHTML = `🗑 Удалено ${n} &nbsp;<b style="text-decoration:underline;cursor:pointer" onclick="undoDelete()">Отменить</b>`;
  t.classList.add('show');
  _undoTimer = setTimeout(() => { t.classList.remove('show'); _undoItem = null; }, 4000);
}

// Long press → multi-select
(function initLongPress() {
  let _lpTimer = null;
  document.addEventListener('touchstart', e => {
    const item = e.target.closest('.wish-item');
    if (!item || e.target.closest('.menu-btn,.wish-check,.drag-handle,.sel-check')) return;
    if (_selMode) return;
    _lpTimer = setTimeout(() => {
      const type = item.dataset.type;
      const container = item.closest('#list-all, #list-big, #list-gifts');
      enterSelMode(type, container);
      const wrap = item.closest('.swipe-wrap');
      if (wrap) { _selIds.add(wrap.dataset.id); wrap.classList.add('selected'); _updateSelCount(); }
    }, 500);
  }, {passive:true});
  document.addEventListener('touchend',  () => clearTimeout(_lpTimer), {passive:true});
  document.addEventListener('touchmove', () => clearTimeout(_lpTimer), {passive:true});
})();

// ── Contacts ──
function _updateAddContactBtn() {
  const ok = document.getElementById('c-name').value.trim() && document.getElementById('c-bday').value.trim();
  const btn = document.getElementById('c-add-btn');
  btn.disabled = !ok;
  btn.style.opacity = ok ? '1' : '0.3';
  btn.style.cursor = ok ? 'pointer' : 'not-allowed';
}

function addContact() {
  const name = document.getElementById('c-name').value.trim();
  const bdayRaw = document.getElementById('c-bday').value.trim();
  if (!name || !bdayRaw) return;
  const m = bdayRaw.match(/^(\d{1,2})[.\-\/](\d{1,2})(?:[.\-\/](\d{4}))?$/);
  if (!m) { showToast('❌ Формат: ДД.ММ.ГГГГ'); return; }
  const birthday = m[3]
    ? `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
    : `${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  const contacts = loadContacts();
  if (contacts.some(c => c.name.toLowerCase() === name.toLowerCase())) { showToast('⚠️ Контакт уже есть'); return; }
  contacts.push({ id: Date.now(), name, birthday });
  saveContacts(contacts);
  document.getElementById('c-name').value = '';
  document.getElementById('c-bday').value = '';
  _updateAddContactBtn();
  showToast('✅ Контакт добавлен');
  renderContacts();
  _refreshContactsDatalist();
}

function deleteContact(id) {
  saveContacts(loadContacts().filter(c => String(c.id) !== String(id)));
  renderContacts(); _refreshContactsDatalist();
}

document.getElementById('g-who').addEventListener('input', function() {
  const name = this.value.trim().toLowerCase();
  if (!name) return;
  const contact = loadContacts().find(c => c.name.toLowerCase() === name);
  if (!contact || !contact.birthday) return;
  const nextBd = getNextBirthday(contact.birthday);
  const days = daysUntil(nextBd);
  const dateEl = document.getElementById('g-date');
  const remindEl = document.getElementById('g-remind');
  const occEl = document.getElementById('g-occ');
  if (!dateEl.value) dateEl.value = nextBd.toISOString().slice(0,10);
  if (!remindEl.value) remindEl.value = '7';
  if (!occEl.value) {
    occEl.value = 'ДР';
    document.querySelectorAll('#occQuickTags .tag-chip').forEach(c => {
      c.classList.toggle('selected', c.dataset.occ === 'ДР');
    });
    applyChipColors();
  }
  showToast(`🎂 ДР через ${days} дн. — дата подставлена`);
});

// ── Drag & Drop ──
let _dragEl = null, _dragGhost = null, _dragStartY = 0, _dragGhostTop = 0, _dragContainer = null;

function initDrag() {
  const sA = document.getElementById('sort-all')?.value;
  const sB = document.getElementById('sort-big')?.value;
  const allEl = document.getElementById('list-all');
  const bigEl = document.getElementById('list-big');
  allEl?.classList.toggle('drag-mode', sA === 'manual');
  bigEl?.classList.toggle('drag-mode', sB === 'manual');
  document.querySelectorAll('.drag-handle').forEach(handle => {
    handle.addEventListener('touchstart', _onDragStart, {passive:true});
  });
}

function _onDragStart(e) {
  const wrap = this.closest('.swipe-wrap'); if (!wrap) return;
  _dragEl = wrap;
  _dragContainer = wrap.parentElement;
  const rect = wrap.getBoundingClientRect();
  _dragStartY = e.touches[0].clientY;
  _dragGhostTop = rect.top;
  _dragGhost = wrap.cloneNode(true);
  _dragGhost.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;z-index:500;opacity:0.88;pointer-events:none;box-shadow:0 8px 32px rgba(0,0,0,.6);border-radius:16px;transition:none;`;
  document.body.appendChild(_dragGhost);
  wrap.classList.add('dragging');
  document.addEventListener('touchmove', _onDragMove, {passive:false});
  document.addEventListener('touchend', _onDragEnd, {passive:true});
}

function _onDragMove(e) {
  if (!_dragGhost) return;
  e.preventDefault();
  const dy = e.touches[0].clientY - _dragStartY;
  _dragGhost.style.top = (_dragGhostTop + dy) + 'px';
  const y = e.touches[0].clientY;
  document.querySelectorAll('.drag-insert-above').forEach(el => el.classList.remove('drag-insert-above'));
  const siblings = [..._dragContainer.querySelectorAll('.swipe-wrap:not(.dragging)')];
  let inserted = false;
  for (const sib of siblings) {
    const r = sib.getBoundingClientRect();
    if (y < r.top + r.height / 2) {
      _dragContainer.insertBefore(_dragEl, sib);
      sib.classList.add('drag-insert-above');
      inserted = true; break;
    }
  }
  if (!inserted) _dragContainer.appendChild(_dragEl);
}

function _onDragEnd() {
  if (!_dragGhost) return;
  document.body.removeChild(_dragGhost); _dragGhost = null;
  _dragEl.classList.remove('dragging');
  document.querySelectorAll('.drag-insert-above').forEach(el => el.classList.remove('drag-insert-above'));
  const type = _dragEl.querySelector('.wish-item')?.dataset.type;
  const ids = [..._dragContainer.querySelectorAll('.swipe-wrap')].map(el => el.dataset.id);
  const isGift = type === 'gift';
  const list = isGift ? loadGifts() : load();
  const reordered = ids.map(id => list.find(i => String(i.id) === id)).filter(Boolean);
  const rest = list.filter(i => !ids.includes(String(i.id)));
  isGift ? saveGifts([...reordered, ...rest]) : save([...reordered, ...rest]);
  _dragEl = null; _dragContainer = null;
  document.removeEventListener('touchmove', _onDragMove);
  document.removeEventListener('touchend', _onDragEnd);
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ── Init ──
fetchLiveRates();
updateCurUI();
applyChipColors();
refresh();
_refreshContactsDatalist();
