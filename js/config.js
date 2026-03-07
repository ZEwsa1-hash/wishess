// ── Currency constants ──
// Fallback rates (updated March 2026), overridden by live fetch
const RATES   = { BYN: 1, RUB: 26.7, USD: 0.34 };
const CUR_SYM = { BYN: 'Br', RUB: '₽', USD: '$' };

// ── Tag colors ──
const TAG_COLORS = {
  'одежда':      { bg:'#3a1f1f', color:'#f87171', border:'#5a2f2f' },
  'техника':     { bg:'#1f2a3a', color:'#60a5fa', border:'#2f3f5a' },
  'книги':       { bg:'#1f3a25', color:'#4ade80', border:'#2f5a35' },
  'дизайн':      { bg:'#2a1f3a', color:'#c084fc', border:'#3f2f5a' },
  'путешествия': { bg:'#1f3a3a', color:'#22d3ee', border:'#2f5a5a' },
  'хобби':       { bg:'#3a2a1f', color:'#fb923c', border:'#5a3f2f' },
  'frontend':    { bg:'#1f2a3a', color:'#60a5fa', border:'#2f3f5a' },
};

// ── Priority ──
const PRIO_BADGE = {
  urgent:    '<span class="wish-badge badge-red">🔴 Срочно</span>',
  important: '<span class="wish-badge badge-yellow">🟡 Важно</span>',
  later:     '<span class="wish-badge badge-blue">🔵 Позже</span>',
};
const PRIO_ORDER = { urgent: 0, important: 1, later: 2, '': 3 };
