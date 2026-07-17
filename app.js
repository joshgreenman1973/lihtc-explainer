'use strict';

const $ = (s, r = document) => r.querySelector(s);
const SVGNS = 'http://www.w3.org/2000/svg';
const fmt = n => n.toLocaleString('en-US');
const fmtK = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : n;

function el(name, attrs = {}, text) {
  const e = document.createElementNS(SVGNS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

async function loadJSON(p) {
  const r = await fetch(p);
  if (!r.ok) throw new Error('fetch failed ' + p);
  return r.json();
}

/* ---------- build date ---------- */
(function () {
  const d = new Date();
  const s = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  document.querySelectorAll('#build-date, .build-date-2').forEach(n => n.textContent = n.id === 'build-date' ? 'Assembled ' + s + '.' : s);
})();

/* ---------- reveal on scroll ---------- */
(function () {
  const obs = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(s => obs.observe(s));
})();

/* ---------- ai caution popover ---------- */
(function () {
  const btn = $('#ai-caution'), pop = $('#ai-popover'), close = $('.ai-close');
  const toggle = (show) => { pop.hidden = !show; };
  btn.addEventListener('click', () => toggle(pop.hidden));
  close.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
})();

/* ==================================================================
   CHART: tax expenditure (grouped column, historical context + current)
   ================================================================== */
function chartTaxExp(data) {
  const box = $('#chart-taxexp');
  const W = 900, H = 380, m = { t: 24, r: 20, b: 46, l: 52 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
  svg.appendChild(el('title', {}, 'Estimated federal revenue forgone for the LIHTC by fiscal year'));

  const rows = data.jct_current.years;
  const maxV = 20;
  const x = i => m.l + (i + 0.5) * (iw / rows.length);
  const bw = (iw / rows.length) * 0.52;
  const y = v => m.t + ih - (v / maxV) * ih;

  // gridlines
  for (let g = 0; g <= 20; g += 5) {
    svg.appendChild(el('line', { class: 'grid-line', x1: m.l, x2: m.l + iw, y1: y(g), y2: y(g) }));
    svg.appendChild(el('text', { class: 'tick-txt', x: m.l - 8, y: y(g) + 4, 'text-anchor': 'end' }, '$' + g + 'B'));
  }
  svg.appendChild(el('line', { class: 'axis-line', x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih }));

  rows.forEach((r, i) => {
    const h = m.t + ih - y(r.combined);
    const bar = el('rect', { class: 'bar', x: x(i) - bw / 2, y: y(r.combined), width: bw, height: h, fill: 'var(--red)' });
    bar.appendChild(el('title', {}, `FY${r.fy}: $${r.combined}B estimated revenue forgone (individuals $${r.individuals}B + corporations $${r.corporations}B)`));
    svg.appendChild(bar);
    svg.appendChild(el('text', { class: 'val-lab', x: x(i), y: y(r.combined) - 7, 'text-anchor': 'middle' }, '$' + r.combined.toFixed(1)));
    svg.appendChild(el('text', { class: 'bar-lab', x: x(i), y: m.t + ih + 18, 'text-anchor': 'middle' }, 'FY' + r.fy));
  });
  // OBBBA marker between 2025 and 2026
  const mx = (x(0) + x(1)) / 2;
  svg.appendChild(el('line', { x1: mx, x2: mx, y1: m.t, y2: m.t + ih, stroke: 'var(--gold)', 'stroke-width': 1.4, 'stroke-dasharray': '4 4' }));
  svg.appendChild(el('text', { class: 'bar-lab', x: mx + 5, y: m.t + 12, 'text-anchor': 'start', fill: 'var(--gold)' }, 'OBBBA takes effect'));
  box.appendChild(svg);
}

/* ==================================================================
   CHART: units placed in service per year (area/column)
   ================================================================== */
function chartUnits(rows) {
  const box = $('#chart-units');
  const W = 900, H = 360, m = { t: 20, r: 18, b: 40, l: 58 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
  svg.appendChild(el('title', {}, 'LIHTC units placed in service each year, 1987 to 2024'));

  const maxV = Math.max(...rows.map(r => r.units));
  const yTop = Math.ceil(maxV / 20000) * 20000;
  const x = i => m.l + (i + 0.5) * (iw / rows.length);
  const bw = (iw / rows.length) * 0.8;
  const y = v => m.t + ih - (v / yTop) * ih;

  for (let g = 0; g <= yTop; g += 20000) {
    svg.appendChild(el('line', { class: 'grid-line', x1: m.l, x2: m.l + iw, y1: y(g), y2: y(g) }));
    svg.appendChild(el('text', { class: 'tick-txt', x: m.l - 8, y: y(g) + 4, 'text-anchor': 'end' }, g === 0 ? '0' : (g / 1000) + 'K'));
  }
  svg.appendChild(el('line', { class: 'axis-line', x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih }));

  const lastYear = rows[rows.length - 1].year;
  rows.forEach((r, i) => {
    const recent = r.year >= lastYear - 2;
    const bar = el('rect', {
      class: 'bar', x: x(i) - bw / 2, y: y(r.units), width: bw, height: m.t + ih - y(r.units),
      fill: recent ? 'var(--rule)' : 'var(--green)'
    });
    bar.appendChild(el('title', {}, `${r.year}: ${fmt(r.units)} units (${fmt(r.li_units)} income-restricted), ${fmt(r.projects)} projects${recent ? ' - undercount, still being reported' : ''}`));
    svg.appendChild(bar);
  });
  // x labels every 5 yrs
  rows.forEach((r, i) => {
    if (r.year % 5 === 0) svg.appendChild(el('text', { class: 'bar-lab', x: x(i), y: m.t + ih + 17, 'text-anchor': 'middle' }, r.year));
  });
  // legend for recent
  const lg = el('g', {});
  lg.appendChild(el('rect', { x: m.l + iw - 168, y: m.t, width: 12, height: 12, fill: 'var(--rule)' }));
  lg.appendChild(el('text', { class: 'bar-lab', x: m.l + iw - 150, y: m.t + 10 }, 'recent years (undercount)'));
  svg.appendChild(lg);
  box.appendChild(svg);
}

/* ==================================================================
   CHART: GAO per-unit cost by agency (horizontal bars)
   ================================================================== */
function chartGAO(gao) {
  const box = $('#chart-gao');
  const rows = gao.new_construction_by_agency.slice().sort((a, b) => b.median - a.median);
  const W = 900, rowH = 30, m = { t: 10, r: 60, b: 34, l: 130 };
  const iw = W - m.l - m.r, ih = rows.length * rowH;
  const H = ih + m.t + m.b;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
  svg.appendChild(el('title', {}, 'Median per-unit development cost for new construction by allocating agency'));

  const maxV = 350000;
  const x = v => m.l + (v / maxV) * iw;
  for (let g = 0; g <= maxV; g += 100000) {
    svg.appendChild(el('line', { class: 'grid-line', x1: x(g), x2: x(g), y1: m.t, y2: m.t + ih }));
    svg.appendChild(el('text', { class: 'tick-txt', x: x(g), y: m.t + ih + 18, 'text-anchor': 'middle' }, '$' + (g / 1000) + 'K'));
  }
  // median reference line
  const medX = x(gao.median_per_unit_overall);
  svg.appendChild(el('line', { x1: medX, x2: medX, y1: m.t, y2: m.t + ih, stroke: 'var(--red)', 'stroke-width': 1.3, 'stroke-dasharray': '3 3' }));
  svg.appendChild(el('text', { class: 'bar-lab', x: medX + 6, y: m.t + ih - 6, 'text-anchor': 'start', fill: 'var(--red)' }, 'overall median $204K'));

  rows.forEach((r, i) => {
    const yy = m.t + i * rowH + 5;
    const bh = rowH - 12;
    const bar = el('rect', { class: 'bar', x: m.l, y: yy, width: x(r.median) - m.l, height: bh, fill: 'var(--green)' });
    bar.appendChild(el('title', {}, `${r.agency}: $${fmt(r.median)} median per-unit development cost (new construction, 2015 dollars)`));
    svg.appendChild(bar);
    svg.appendChild(el('text', { class: 'bar-lab', x: m.l - 8, y: yy + bh - 1, 'text-anchor': 'end', fill: 'var(--ink)' }, r.agency));
    svg.appendChild(el('text', { class: 'val-lab', x: x(r.median) + 6, y: yy + bh - 1, 'text-anchor': 'start' }, '$' + Math.round(r.median / 1000) + 'K'));
  });
  box.appendChild(svg);
}

/* ==================================================================
   CHART: ceiling per resident over time (line)
   ================================================================== */
function chartCeiling(rows) {
  const box = $('#chart-ceiling');
  const W = 460, H = 300, m = { t: 20, r: 16, b: 36, l: 42 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
  svg.appendChild(el('title', {}, 'LIHTC credit ceiling per resident by year'));
  const maxV = 3.6;
  const x = i => m.l + i * (iw / (rows.length - 1));
  const y = v => m.t + ih - (v / maxV) * ih;
  for (let g = 0; g <= 3.5; g += 0.5) {
    svg.appendChild(el('line', { class: 'grid-line', x1: m.l, x2: m.l + iw, y1: y(g), y2: y(g) }));
    svg.appendChild(el('text', { class: 'tick-txt', x: m.l - 6, y: y(g) + 4, 'text-anchor': 'end' }, '$' + g.toFixed(1)));
  }
  svg.appendChild(el('line', { class: 'axis-line', x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih }));
  let d = '';
  rows.forEach((r, i) => { d += (i ? 'L' : 'M') + x(i) + ' ' + y(r.per_capita) + ' '; });
  svg.appendChild(el('path', { d, fill: 'none', stroke: 'var(--green)', 'stroke-width': 2.4 }));
  rows.forEach((r, i) => {
    const c = el('circle', { cx: x(i), cy: y(r.per_capita), r: 3.6, fill: 'var(--green-deep)' });
    c.appendChild(el('title', {}, `${r.year}: $${r.per_capita.toFixed(3)} per resident`));
    svg.appendChild(c);
    if (r.year % 3 === 0 || i === rows.length - 1)
      svg.appendChild(el('text', { class: 'bar-lab', x: x(i), y: m.t + ih + 16, 'text-anchor': 'middle' }, "'" + String(r.year).slice(2)));
  });
  box.appendChild(svg);
}

/* ==================================================================
   CHART: credit type share by period (stacked columns 9% vs 4%)
   ================================================================== */
function chartCreditType(rows) {
  const box = $('#chart-credittype');
  const W = 460, H = 300, m = { t: 20, r: 16, b: 36, l: 34 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
  svg.appendChild(el('title', {}, 'Share of LIHTC projects by credit type over five-year periods'));
  const data = rows.map(r => {
    const c9 = r.c9 || 0, c4 = r.c4 || 0, both = r.both || 0, tcep = r.tcep || 0;
    const tot = c9 + c4 + both + tcep || 1;
    return { half: r.half, c9: c9 / tot, c4: c4 / tot, other: (both + tcep) / tot };
  });
  const x = i => m.l + (i + 0.5) * (iw / data.length);
  const bw = (iw / data.length) * 0.66;
  const y = v => m.t + ih - v * ih;
  [0, .25, .5, .75, 1].forEach(g => {
    svg.appendChild(el('line', { class: 'grid-line', x1: m.l, x2: m.l + iw, y1: y(g), y2: y(g) }));
    svg.appendChild(el('text', { class: 'tick-txt', x: m.l - 6, y: y(g) + 4, 'text-anchor': 'end' }, (g * 100) + ''));
  });
  data.forEach((r, i) => {
    let acc = 0;
    const segs = [['c9', 'var(--green)', '9% (new construction)'], ['c4', 'var(--red)', '4% (bond-financed)'], ['other', 'var(--rule)', 'both / other']];
    segs.forEach(([k, col, lab]) => {
      const v = r[k];
      if (v <= 0) return;
      const rect = el('rect', { class: 'bar', x: x(i) - bw / 2, y: y(acc + v), width: bw, height: v * ih, fill: col });
      rect.appendChild(el('title', {}, `${r.half}s: ${lab} ${(v * 100).toFixed(0)}%`));
      svg.appendChild(rect);
      acc += v;
    });
    svg.appendChild(el('text', { class: 'bar-lab', x: x(i), y: m.t + ih + 16, 'text-anchor': 'middle' }, "'" + String(r.half).slice(2)));
  });
  box.appendChild(svg);
}

/* ==================================================================
   State table
   ================================================================== */
function stateTable(rows) {
  const controls = $('#state-sort');
  const host = $('#state-table');
  let sortKey = 'units';
  const keys = [['units', 'Units'], ['projects', 'Projects'], ['li_units', 'Income-restricted units']];
  keys.forEach(([k, lab]) => {
    const b = document.createElement('button');
    b.textContent = lab; b.dataset.k = k;
    if (k === sortKey) b.classList.add('active');
    b.addEventListener('click', () => { sortKey = k; controls.querySelectorAll('button').forEach(x => x.classList.toggle('active', x.dataset.k === k)); render(); });
    controls.appendChild(b);
  });
  function render() {
    const sorted = rows.slice().sort((a, b) => b[sortKey] - a[sortKey]);
    const max = sorted[0][sortKey];
    const t = document.createElement('table');
    t.className = 'stbl';
    t.innerHTML = `<thead><tr><th class="rank"></th><th>State</th><th class="barcell">${keys.find(k => k[0] === sortKey)[1]}</th><th class="num">Projects</th><th class="num">Units</th><th class="num">Income-restricted</th></tr></thead>`;
    const tb = document.createElement('tbody');
    sorted.forEach((r, i) => {
      const tr = document.createElement('tr');
      const pct = (r[sortKey] / max) * 100;
      tr.innerHTML = `<td class="rank">${i + 1}</td><td class="stname">${r.state}</td>` +
        `<td class="barcell"><span class="barfill" style="width:${pct * 0.9}%"></span><span style="position:relative;font-family:var(--mono);font-size:12.5px">${fmt(r[sortKey])}</span></td>` +
        `<td class="num">${fmt(r.projects)}</td><td class="num">${fmt(r.units)}</td><td class="num">${fmt(r.li_units)}</td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    host.innerHTML = '';
    host.appendChild(t);
  }
  render();
}

/* ==================================================================
   Tenants section
   ================================================================== */
function tenants(t) {
  $('#tenants-intro').innerHTML = `Federal law requires states to report on who lives in these apartments. The most recent figures, as of December 31, 2023, describe roughly ${fmtK(t.units_reported)} units. Read them with one large caveat in mind &mdash; see below.`;
  const body = $('#tenants-body');
  const grid = document.createElement('div');
  grid.className = 'tstat-grid';
  const stats = [
    ['$' + fmt(t.median_household_income), 'median annual household income'],
    [t.rental_assistance_share + '%', 'receive federal or state rental assistance'],
    [t.household.headed_by_62_plus + '%', 'headed by someone 62 or older'],
    [t.rent_burden.find(b => b.band.startsWith('More than')).pct + '%', 'still pay more than half their income in rent']
  ];
  stats.forEach(([f, l]) => {
    const d = document.createElement('div');
    d.className = 'tstat';
    d.innerHTML = `<span class="tfig">${f}</span><span class="tlab">${l}</span>`;
    grid.appendChild(d);
  });
  body.appendChild(grid);

  const co = document.createElement('div');
  co.className = 'callout warn';
  co.innerHTML = `<p class="callout-h">The California-sized hole in the tenant data</p><p>${t.big_caveat} On top of that, ${t.race_note.charAt(0).toLowerCase() + t.race_note.slice(1)}</p><p class="src-line">Source: HUD LIHTC tenant tables as of December 31, 2023.</p>`;
  body.appendChild(co);
}

/* ==================================================================
   boot
   ================================================================== */
(async function () {
  try {
    const [tax, units, gao, mech, credit, state, ten] = await Promise.all([
      loadJSON('data/tax_expenditure.json'),
      loadJSON('data/units_by_year.json'),
      loadJSON('data/gao_costs.json'),
      loadJSON('data/mechanics.json'),
      loadJSON('data/credit_type_by_period.json'),
      loadJSON('data/state_totals.json'),
      loadJSON('data/tenants.json')
    ]);
    chartTaxExp(tax);
    chartUnits(units);
    chartGAO(gao);
    chartCeiling(mech.ceiling_formula.history);
    chartCreditType(credit);
    stateTable(state);
    tenants(ten);
  } catch (e) {
    console.error(e);
    document.querySelectorAll('.chart').forEach(c => { if (!c.children.length) c.innerHTML = '<p style="font-family:var(--mono);font-size:13px;color:var(--red)">Data failed to load. Run this page from a local server (not file://).</p>'; });
  }
})();
