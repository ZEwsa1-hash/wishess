// ── Active currency (persisted) ──
let activeCur = localStorage.getItem('currency') || 'BYN';

// ── Wishes storage ──
const load = () => {
  try { return JSON.parse(localStorage.getItem('wishes') || '[]'); } catch { return []; }
};
const save = l => {
  try { localStorage.setItem('wishes', JSON.stringify(l)); }
  catch(e) { if(e.name === 'QuotaExceededError') showToast('❌ Память заполнена, очисти старые хотелки'); }
};

// ── Gifts storage ──
const loadGifts = () => {
  try { return JSON.parse(localStorage.getItem('gifts') || '[]'); } catch { return []; }
};
const saveGifts = l => {
  try { localStorage.setItem('gifts', JSON.stringify(l)); }
  catch(e) { if(e.name === 'QuotaExceededError') showToast('❌ Память заполнена'); }
};

// ── Contacts storage ──
const loadContacts = () => {
  try { return JSON.parse(localStorage.getItem('contacts') || '[]'); } catch { return []; }
};
const saveContacts = l => localStorage.setItem('contacts', JSON.stringify(l));

// ── Live exchange rates ──
async function fetchLiveRates() {
  try {
    const cached = localStorage.getItem('rates_cache');
    if (cached) {
      const { ts, rates } = JSON.parse(cached);
      if (Date.now() - ts < 6 * 3600 * 1000) { // cache 6 hours
        Object.assign(RATES, rates); updateCurUI(); return;
      }
    }
    const res = await fetch('https://open.er-api.com/v6/latest/BYN');
    const data = await res.json();
    if (data.result === 'success') {
      RATES.RUB = Math.round(data.rates.RUB * 100) / 100;
      RATES.USD = Math.round(data.rates.USD * 1000) / 1000;
      localStorage.setItem('rates_cache', JSON.stringify({ ts: Date.now(), rates: { RUB: RATES.RUB, USD: RATES.USD } }));
      refresh();
    }
  } catch { /* используем fallback */ }
}

// ── Export / Import ──
function exportData() {
  const data = { version: 1, wishes: load(), gifts: loadGifts(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `wishlist-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('📤 Экспорт готов!');
}

function importData(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const wishes = data.wishes || data, gifts = data.gifts || [];
      if (!Array.isArray(wishes)) throw new Error('invalid');
      const msg = `Импортировать ${wishes.length} хотелок и ${gifts.length} подарков?\n\nДанные будут заменены.`;
      const doImport = () => { save(wishes); saveGifts(gifts); refresh(); showToast(`✅ Импортировано: ${wishes.length}`); };
      if (tg) tg.showConfirm(msg, ok => { if (ok) doImport(); });
      else if (confirm(msg)) doImport();
    } catch { showToast('❌ Ошибка формата'); }
  };
  reader.readAsText(file); input.value = '';
}
