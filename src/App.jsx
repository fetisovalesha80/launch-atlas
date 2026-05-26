import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, X, Edit2, Trash2, TrendingUp, Calendar,
  Sparkles, BarChart3, AlertCircle, Database
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceArea,
  ReferenceLine, CartesianGrid
} from 'recharts';

// ============================================================
//  STYLES
// ============================================================

const FONTS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

.la-app * { box-sizing: border-box; }
.la-app {
  font-family: 'Geist', 'Helvetica Neue', sans-serif;
  background: #FAF7F2;
  color: #1A1614;
  font-feature-settings: "ss01", "cv11";
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
.la-display {
  font-family: 'Fraunces', 'Times New Roman', serif;
  font-optical-sizing: auto;
  letter-spacing: -0.025em;
}
.la-mono { font-family: 'Geist Mono', monospace; font-feature-settings: "tnum"; }

.la-btn {
  font-family: 'Geist', sans-serif;
  font-size: 13px; font-weight: 500;
  padding: 8px 14px; border-radius: 8px;
  border: 1px solid #E8E2D8; background: white; color: #1A1614;
  cursor: pointer; transition: all 0.15s ease;
  display: inline-flex; align-items: center; gap: 6px;
  white-space: nowrap;
}
.la-btn:hover { background: #F5F1EA; border-color: #D9D2C5; }
.la-btn-primary { background: #1A1614; color: #FAF7F2; border-color: #1A1614; }
.la-btn-primary:hover { background: #2C2823; border-color: #2C2823; }
.la-btn-ghost { background: transparent; border-color: transparent; }
.la-btn-ghost:hover { background: #F0EBE2; }
.la-btn-sm { font-size: 12px; padding: 6px 10px; }
.la-btn-danger:hover { background: #FBEEE7; border-color: #C65D3A; color: #C65D3A; }

.la-input, .la-select {
  font-family: 'Geist', sans-serif; font-size: 13px;
  padding: 8px 12px; border-radius: 8px;
  border: 1px solid #E8E2D8; background: white; color: #1A1614;
  outline: none; transition: border-color 0.15s ease; width: 100%;
}
.la-input:focus, .la-select:focus { border-color: #1A1614; }

.la-card { background: white; border: 1px solid #E8E2D8; border-radius: 14px; }

.la-launch-bar {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.15s ease, filter 0.15s ease;
  user-select: none;
}
.la-launch-bar:hover { transform: translateY(-1px); }
.la-launch-bar.dimmed { opacity: 0.28; filter: saturate(0.5); }

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.5; } }

.la-overlay { animation: overlayIn 0.15s ease; }
.la-modal { animation: modalIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
.la-fade { animation: fadeIn 0.3s ease; }
.la-pulse-dot { animation: pulse 2s ease infinite; }

.la-scroll::-webkit-scrollbar { height: 10px; width: 10px; }
.la-scroll::-webkit-scrollbar-track { background: transparent; }
.la-scroll::-webkit-scrollbar-thumb { background: #D9D2C5; border-radius: 5px; border: 2px solid white; }
.la-scroll::-webkit-scrollbar-thumb:hover { background: #B8B0A2; }

.la-grain {
  background-image:
    radial-gradient(circle at 25% 25%, rgba(26, 22, 20, 0.02) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(26, 22, 20, 0.02) 1px, transparent 1px);
  background-size: 6px 6px;
}
`;

// ============================================================
//  CONSTANTS
// ============================================================

const CHANNELS = {
  email:   { label: 'Email',    color: '#C65D3A' },
  paid:    { label: 'Paid',     color: '#4A5B8C' },
  social:  { label: 'Social',   color: '#D4A04A' },
  content: { label: 'Content',  color: '#7A8B6F' },
  product: { label: 'Product',  color: '#7A4A6B' },
  pr:      { label: 'PR',       color: '#5C6873' },
  event:   { label: 'Event',    color: '#8C3A4A' },
};

const METRICS_CFG = {
  revenue:     { label: 'Revenue',     symbol: '€', prefix: true },
  conversions: { label: 'Conversions', symbol: '',  prefix: false },
  cac:         { label: 'CAC',         symbol: '€', prefix: true },
  traffic:     { label: 'Traffic',     symbol: '',  prefix: false },
  roi:         { label: 'ROI',         symbol: '%', prefix: false },
};

const ZOOM_PX = { quarter: 12, month: 32, week: 90 };

// ============================================================
//  HELPERS
// ============================================================

const todayISO = () => new Date().toISOString().slice(0, 10);
const toISO = (d) => new Date(d).toISOString().slice(0, 10);
const parseISO = (s) => new Date(s + 'T12:00:00');
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return toISO(d); };
const formatDateShort = (s) => parseISO(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatDateFull = (s) => parseISO(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const compactNum = (n) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return Math.round(n).toString();
};
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const fmtMetric = (val, metric) => {
  const cfg = METRICS_CFG[metric] || { symbol: '' };
  const num = compactNum(val);
  if (!cfg.symbol) return num;
  return cfg.prefix ? `${cfg.symbol}${num}` : `${num}${cfg.symbol}`;
};

// ============================================================
//  STORAGE
// ============================================================

const KEY_L = 'launchatlas.launches.v1';
const KEY_M = 'launchatlas.metrics.v1';
const KEY_P = 'launchatlas.prefs.v1';

async function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

// ============================================================
//  SEED
// ============================================================

const T = todayISO();
const SEED_LAUNCHES = [
  { id: 'l1', name: 'Spring Newsletter Series', type: 'minor', channel: 'email',   startDate: addDays(T, -22), endDate: addDays(T, -8),  notes: 'Weekly drops to engaged segment.' },
  { id: 'l2', name: 'Brand Refresh',            type: 'major', channel: 'paid',    startDate: addDays(T, -12), endDate: addDays(T, 14),  notes: 'Multi-channel paid push across Meta + Google.' },
  { id: 'l3', name: 'Creator Collab #4',        type: 'minor', channel: 'social',  startDate: addDays(T, -2),  endDate: addDays(T, 10),  notes: '' },
  { id: 'l4', name: 'Product v2 Launch',        type: 'major', channel: 'product', startDate: addDays(T, 8),   endDate: addDays(T, 30),  notes: 'Coordinated PR + email + paid.' },
  { id: 'l5', name: 'Annual Conference',        type: 'minor', channel: 'event',   startDate: addDays(T, 22),  endDate: addDays(T, 25),  notes: '' },
  { id: 'l6', name: 'Holiday Gift Guide',       type: 'minor', channel: 'content', startDate: addDays(T, -5),  endDate: addDays(T, 5),   notes: '' },
];

const SEED_METRICS = (() => {
  const out = [];
  let r = 7;
  for (let i = -28; i <= 32; i++) {
    const date = addDays(T, i);
    const base = 8200 + Math.sin(i / 5.5) * 1400;
    r = (r * 9301 + 49297) % 233280;
    const noise = ((r / 233280) - 0.5) * 1100;
    const bump = (i > -10 && i < 14) ? 1800 + Math.sin((i + 10) / 4) * 600 : 0;
    out.push({ id: uid(), date, metric: 'revenue', value: Math.round(base + noise + bump) });
  }
  return out;
})();

// ============================================================
//  MAIN APP
// ============================================================

export default function App() {
  const [launches, setLaunches] = useState(null);
  const [metrics, setMetrics]   = useState(null);
  const [prefs, setPrefs] = useState({ zoom: 'month', activeMetric: 'revenue', channelFilter: 'all', typeFilter: 'all', granularity: 'week' });
  const [loaded, setLoaded] = useState(false);
  const [editingLaunch, setEditingLaunch] = useState(null);
  const [editingMetric, setEditingMetric] = useState(null);
  const [hoveredId, setHoveredId]   = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const scrollerRef = useRef(null);

  // Load
  useEffect(() => {
    (async () => {
      const [l, m, p] = await Promise.all([
        load(KEY_L, null), load(KEY_M, null), load(KEY_P, null),
      ]);
      setLaunches(l ?? SEED_LAUNCHES);
      setMetrics(m ?? SEED_METRICS);
      if (p) setPrefs(prev => ({ ...prev, ...p }));
      setLoaded(true);
    })();
  }, []);

  // Save
  useEffect(() => { if (loaded && launches) save(KEY_L, launches); }, [launches, loaded]);
  useEffect(() => { if (loaded && metrics)  save(KEY_M, metrics);  }, [metrics, loaded]);
  useEffect(() => { if (loaded) save(KEY_P, prefs); }, [prefs, loaded]);

  // Filtered + sorted
  const visibleLaunches = useMemo(() => {
    if (!launches) return [];
    return launches
      .filter(l => prefs.channelFilter === 'all' || l.channel === prefs.channelFilter)
      .filter(l => prefs.typeFilter === 'all' || l.type === prefs.typeFilter)
      .slice()
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [launches, prefs.channelFilter, prefs.typeFilter]);

  // Timeline dimensions
  const dim = useMemo(() => {
    const pxPerDay = ZOOM_PX[prefs.zoom];
    let min = T, max = T;
    (launches ?? []).forEach(l => { if (l.startDate < min) min = l.startDate; if (l.endDate > max) max = l.endDate; });
    (metrics  ?? []).forEach(m => { if (m.date < min) min = m.date; if (m.date > max) max = m.date; });
    min = addDays(min, -7);
    max = addDays(max, 14);
    const totalDays = daysBetween(min, max);
    const totalWidth = Math.max(totalDays * pxPerDay, 800);
    return { minDate: min, maxDate: max, totalDays, pxPerDay, totalWidth };
  }, [launches, metrics, prefs.zoom]);

  // Chart data
  const chartData = useMemo(() => {
    if (!metrics) return [];
    const filt = metrics.filter(m => m.metric === prefs.activeMetric);
    const byDate = {};
    filt.forEach(m => {
      if (!byDate[m.date]) byDate[m.date] = { date: m.date, value: 0, x: daysBetween(dim.minDate, m.date) };
      byDate[m.date].value += m.value;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [metrics, prefs.activeMetric, dim.minDate]);

  // Tick positions for the timeline (independent from zoom)
  const ticks = useMemo(() => {
    const result = [];
    if (prefs.granularity === 'day') {
      for (let i = 0; i <= dim.totalDays; i++) {
        const date = addDays(dim.minDate, i);
        const dow = parseISO(date).getDay();
        result.push({
          date,
          x: i,
          left: i * dim.pxPerDay,
          major: dow === 1, // Mondays as major
          monthStart: parseISO(date).getDate() === 1,
        });
      }
    } else if (prefs.granularity === 'week') {
      const startDow = parseISO(dim.minDate).getDay();
      // Walk to first Monday at or after minDate
      const toMonday = startDow === 1 ? 0 : (startDow === 0 ? 1 : 8 - startDow);
      for (let i = toMonday; i <= dim.totalDays; i += 7) {
        result.push({
          date: addDays(dim.minDate, i),
          x: i,
          left: i * dim.pxPerDay,
          major: false,
          monthStart: false,
        });
      }
    } else {
      let d = parseISO(dim.minDate);
      d.setDate(1);
      if (toISO(d) < dim.minDate) d.setMonth(d.getMonth() + 1);
      while (toISO(d) <= dim.maxDate) {
        const offset = daysBetween(dim.minDate, toISO(d));
        result.push({
          date: toISO(d),
          x: offset,
          left: offset * dim.pxPerDay,
          major: true,
          monthStart: true,
        });
        d.setMonth(d.getMonth() + 1);
      }
    }
    return result;
  }, [dim, prefs.granularity]);

  // Weekend stripes (only when day-granularity AND zoom wide enough to be useful)
  const weekends = useMemo(() => {
    if (prefs.granularity !== 'day' || dim.pxPerDay < 20) return [];
    const result = [];
    for (let i = 0; i <= dim.totalDays; i++) {
      const dow = parseISO(addDays(dim.minDate, i)).getDay();
      if (dow === 0 || dow === 6) {
        result.push({ left: i * dim.pxPerDay, width: dim.pxPerDay });
      }
    }
    return result;
  }, [dim, prefs.granularity]);

  const activeLaunchId = selectedId || hoveredId;
  const activeLaunch = useMemo(() => visibleLaunches.find(l => l.id === activeLaunchId), [visibleLaunches, activeLaunchId]);

  // Correlation stats
  const stats = useMemo(() => {
    if (!activeLaunch || chartData.length === 0) return null;
    const inLaunch = chartData.filter(d => d.date >= activeLaunch.startDate && d.date <= activeLaunch.endDate);
    const launchLen = daysBetween(activeLaunch.startDate, activeLaunch.endDate) + 1;
    const beforeStart = addDays(activeLaunch.startDate, -launchLen);
    const beforeEnd   = addDays(activeLaunch.startDate, -1);
    const before = chartData.filter(d => d.date >= beforeStart && d.date <= beforeEnd);
    if (inLaunch.length === 0) return null;
    const avgIn = inLaunch.reduce((s, d) => s + d.value, 0) / inLaunch.length;
    const avgBefore = before.length ? before.reduce((s, d) => s + d.value, 0) / before.length : null;
    const delta = avgBefore != null && avgBefore !== 0 ? ((avgIn - avgBefore) / avgBefore) * 100 : null;
    return { avgIn, avgBefore, delta, count: inLaunch.length };
  }, [activeLaunch, chartData]);

  // Handlers
  const onSaveLaunch = (data) => {
    if (data.id) setLaunches(prev => prev.map(l => l.id === data.id ? data : l));
    else setLaunches(prev => [...(prev || []), { ...data, id: uid() }]);
    setEditingLaunch(null);
  };
  const onDeleteLaunch = (id) => {
    setLaunches(prev => prev.filter(l => l.id !== id));
    setEditingLaunch(null);
    if (selectedId === id) setSelectedId(null);
  };
  const onSaveMetric = (data) => {
    if (data.id) setMetrics(prev => prev.map(m => m.id === data.id ? data : m));
    else setMetrics(prev => [...(prev || []), { ...data, id: uid() }]);
    setEditingMetric(null);
  };

  // Scroll to today on first load
  useEffect(() => {
    if (loaded && scrollerRef.current) {
      const todayOffset = daysBetween(dim.minDate, T) * dim.pxPerDay;
      scrollerRef.current.scrollLeft = Math.max(0, todayOffset - 180);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, prefs.zoom]);

  if (!loaded) {
    return (
      <div className="la-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <style>{FONTS_CSS}</style>
        <div style={{ color: '#6B6359', fontSize: '14px' }}>Loading your atlas…</div>
      </div>
    );
  }

  return (
    <div className="la-app la-grain la-fade">
      <style>{FONTS_CSS}</style>

      {/* HEADER */}
      <header style={{ borderBottom: '1px solid #E8E2D8', padding: '20px 28px', background: '#FAF7F2', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="la-pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#C65D3A' }} />
              <span className="la-mono" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B6359' }}>
                Marketing Calendar
              </span>
            </div>
            <h1 className="la-display" style={{ fontSize: '34px', fontWeight: 400, margin: '6px 0 0 0', lineHeight: 1 }}>
              Launch Atlas
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right', marginRight: '6px' }}>
              <div className="la-mono" style={{ fontSize: '10px', color: '#A89F92', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today</div>
              <div className="la-mono" style={{ fontSize: '13px', color: '#1A1614', fontWeight: 500 }}>{formatDateFull(T)}</div>
            </div>
            <button className="la-btn" onClick={() => setEditingMetric({ metric: prefs.activeMetric })}>
              <TrendingUp size={14} /> Metric point
            </button>
            <button className="la-btn la-btn-primary" onClick={() => setEditingLaunch({})}>
              <Plus size={14} /> New launch
            </button>
          </div>
        </div>
      </header>

      {/* TOOLBAR */}
      <div style={{ borderBottom: '1px solid #E8E2D8', padding: '12px 28px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.4)' }}>
        <FilterChips
          label="Channel"
          value={prefs.channelFilter}
          onChange={(v) => setPrefs({ ...prefs, channelFilter: v })}
          options={[{ value: 'all', label: 'All' }, ...Object.entries(CHANNELS).map(([k, v]) => ({ value: k, label: v.label, color: v.color }))]}
        />
        <div style={{ width: '1px', height: '20px', background: '#E8E2D8' }} />
        <FilterChips
          label="Type"
          value={prefs.typeFilter}
          onChange={(v) => setPrefs({ ...prefs, typeFilter: v })}
          options={[{ value: 'all', label: 'All' }, { value: 'major', label: 'Major' }, { value: 'minor', label: 'Minor' }]}
        />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#A89F92', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="la-mono">Ticks</span>
          {['day', 'week', 'month'].map(g => (
            <button key={g}
              onClick={() => setPrefs({ ...prefs, granularity: g })}
              className="la-btn la-btn-sm"
              style={prefs.granularity === g ? { background: '#1A1614', color: '#FAF7F2', borderColor: '#1A1614' } : {}}>
              {g[0].toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ width: '1px', height: '20px', background: '#E8E2D8' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#A89F92', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="la-mono">Zoom</span>
          {['quarter', 'month', 'week'].map(z => (
            <button key={z}
              onClick={() => setPrefs({ ...prefs, zoom: z })}
              className="la-btn la-btn-sm"
              style={prefs.zoom === z ? { background: '#1A1614', color: '#FAF7F2', borderColor: '#1A1614' } : {}}>
              {z[0].toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: '24px 28px 40px 28px' }}>
        <div className="la-card" style={{ overflow: 'hidden' }}>
          <div ref={scrollerRef} className="la-scroll" style={{ overflowX: 'auto', overflowY: 'visible' }}>
            <div style={{ position: 'relative', width: dim.totalWidth, minWidth: '100%' }}>
              <TimeAxis dim={dim} ticks={ticks} granularity={prefs.granularity} />
              <LaunchRows
                launches={visibleLaunches}
                dim={dim}
                ticks={ticks}
                weekends={weekends}
                hoveredId={hoveredId}
                selectedId={selectedId}
                onHover={setHoveredId}
                onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                onEdit={(launch) => setEditingLaunch(launch)}
              />
              <MetricsChart
                data={chartData}
                dim={dim}
                ticks={ticks}
                metric={prefs.activeMetric}
                onMetricChange={(m) => setPrefs({ ...prefs, activeMetric: m })}
                activeLaunch={activeLaunch}
                onAddMetric={() => setEditingMetric({ metric: prefs.activeMetric })}
              />
              <TodayLine dim={dim} />
            </div>
          </div>
        </div>

        {activeLaunch && (
          <CorrelationPanel
            launch={activeLaunch}
            stats={stats}
            metric={prefs.activeMetric}
            isSelected={!!selectedId}
            onClose={() => setSelectedId(null)}
            onEdit={() => setEditingLaunch(activeLaunch)}
            onDelete={() => onDeleteLaunch(activeLaunch.id)}
          />
        )}

        <Legend />
      </div>

      {editingLaunch && (
        <LaunchModal
          launch={editingLaunch}
          onSave={onSaveLaunch}
          onCancel={() => setEditingLaunch(null)}
          onDelete={editingLaunch.id ? () => onDeleteLaunch(editingLaunch.id) : null}
        />
      )}
      {editingMetric && (
        <MetricModal
          metric={editingMetric}
          onSave={onSaveMetric}
          onCancel={() => setEditingMetric(null)}
        />
      )}
    </div>
  );
}

// ============================================================
//  TIME AXIS
// ============================================================

function TimeAxis({ dim, ticks, granularity }) {
  const months = useMemo(() => {
    const result = [];
    let d = parseISO(dim.minDate);
    d.setDate(1);
    while (toISO(d) <= dim.maxDate) {
      const monthStart = toISO(d);
      const startOffset = Math.max(0, daysBetween(dim.minDate, monthStart));
      const nextMonth = new Date(d);
      nextMonth.setMonth(d.getMonth() + 1);
      const monthEnd = addDays(toISO(nextMonth), -1);
      const endOffset = Math.min(dim.totalDays, daysBetween(dim.minDate, monthEnd));
      const width = (endOffset - startOffset + 1) * dim.pxPerDay;
      if (width > 0) {
        result.push({
          label: d.toLocaleDateString('en-US', { month: 'long' }),
          year: d.getFullYear(),
          left: startOffset * dim.pxPerDay,
          width,
        });
      }
      d = nextMonth;
    }
    return result;
  }, [dim]);

  // Avoid label overlap on day granularity at narrow zoom
  const labelStep = useMemo(() => {
    if (granularity !== 'day') return 1;
    const minPx = 18;
    return Math.max(1, Math.ceil(minPx / dim.pxPerDay));
  }, [granularity, dim.pxPerDay]);

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'white', borderBottom: '1px solid #E8E2D8' }}>
      <div style={{ position: 'relative', height: '38px', borderBottom: '1px solid #F5F1EA' }}>
        {months.map((m, i) => (
          <div key={i} style={{
            position: 'absolute', left: m.left, width: m.width,
            height: '100%', display: 'flex', alignItems: 'center', padding: '0 12px',
            borderLeft: i > 0 ? '1px solid #F0EBE2' : 'none',
            overflow: 'hidden',
          }}>
            <span className="la-display" style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>{m.label}</span>
            <span className="la-mono" style={{ fontSize: '10px', color: '#A89F92', marginLeft: '6px', whiteSpace: 'nowrap' }}>'{String(m.year).slice(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', height: '22px', background: '#FDFBF8' }}>
        {ticks.map((t, i) => {
          let label = null;
          if (granularity === 'day') {
            if (i % labelStep === 0 || t.monthStart) {
              label = parseISO(t.date).getDate();
            }
          } else if (granularity === 'week') {
            label = parseISO(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
          const tickColor = t.major ? '#A89F92' : '#D9D2C5';
          const tickHeight = t.major ? 7 : 5;
          return (
            <div key={i} style={{ position: 'absolute', left: t.left, top: 0 }}>
              <div style={{ width: '1px', height: tickHeight + 'px', background: tickColor }} />
              {label != null && (
                <span className="la-mono" style={{
                  fontSize: '10px',
                  color: t.major ? '#1A1614' : '#6B6359',
                  fontWeight: t.major ? 500 : 400,
                  paddingLeft: '4px',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  marginTop: '1px',
                }}>
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
//  LAUNCH ROWS
// ============================================================

function LaunchRows({ launches, dim, ticks, weekends, hoveredId, selectedId, onHover, onSelect, onEdit }) {
  const ROW_H = 46;

  if (launches.length === 0) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <AlertCircle size={20} style={{ color: '#A89F92', margin: '0 auto 8px auto' }} />
        <div style={{ color: '#6B6359', fontSize: '13px' }}>No launches match the current filters</div>
      </div>
    );
  }

  const totalHeight = launches.length * ROW_H + 28;

  return (
    <div style={{ position: 'relative', padding: '14px 0' }}>
      {/* Weekend stripes */}
      {weekends.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          {weekends.map((w, i) => (
            <div key={i} style={{
              position: 'absolute', left: w.left, width: w.width,
              top: 0, bottom: 0, background: '#F8F4ED',
            }} />
          ))}
        </div>
      )}
      {/* Vertical grid lines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {ticks.map((t, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: t.left,
            top: 0, bottom: 0,
            width: '1px',
            background: t.major ? '#E8E2D8' : '#F0EBE2',
          }} />
        ))}
      </div>

      {launches.map((l, idx) => {
        const ch = CHANNELS[l.channel];
        const left = daysBetween(dim.minDate, l.startDate) * dim.pxPerDay;
        const width = Math.max((daysBetween(l.startDate, l.endDate) + 1) * dim.pxPerDay, 18);
        const isActive = (hoveredId === l.id) || (selectedId === l.id);
        const isDimmed = (hoveredId || selectedId) && !isActive;
        const isMajor = l.type === 'major';
        const isSelected = selectedId === l.id;
        const showLabelOutside = width < 110;
        const tooltip = `${l.name}\n${formatDateShort(l.startDate)} — ${formatDateShort(l.endDate)} (${daysBetween(l.startDate, l.endDate) + 1}d)`;
        return (
          <div key={l.id} style={{
            position: 'relative',
            height: ROW_H,
            borderBottom: idx < launches.length - 1 ? '1px solid #F5F1EA' : 'none',
            background: isActive ? 'rgba(253, 251, 248, 0.6)' : 'transparent',
            transition: 'background 0.15s ease',
            zIndex: 1,
          }}>
            <div className={`la-launch-bar ${isDimmed ? 'dimmed' : ''}`}
              onMouseEnter={() => onHover(l.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(l.id)}
              onDoubleClick={() => onEdit(l)}
              title={tooltip}
              style={{
                position: 'absolute',
                left, width,
                top: '8px', height: ROW_H - 16,
                background: ch.color,
                borderRadius: isMajor ? '8px' : '6px',
                display: 'flex', alignItems: 'center', padding: '0 10px',
                color: 'white',
                fontSize: isMajor ? '13px' : '12px',
                fontWeight: isMajor ? 600 : 500,
                overflow: 'hidden',
                boxShadow: isActive
                  ? `0 8px 24px ${ch.color}55, inset 0 0 0 1px rgba(255,255,255,0.2)`
                  : `0 1px 2px ${ch.color}33, inset 0 0 0 1px rgba(255,255,255,0.08)`,
                outline: isSelected ? '2px solid #1A1614' : 'none',
                outlineOffset: '2px',
                zIndex: 2,
              }}>
              {isMajor && <Sparkles size={11} strokeWidth={2.5} style={{ marginRight: '5px', flexShrink: 0 }} />}
              {!showLabelOutside && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.005em' }}>{l.name}</span>
              )}
            </div>
            {showLabelOutside && (
              <div style={{
                position: 'absolute',
                left: left + width + 8,
                top: '13px',
                fontSize: '12px',
                fontWeight: isMajor ? 600 : 500,
                color: '#1A1614',
                whiteSpace: 'nowrap',
                opacity: isDimmed ? 0.3 : 1,
                pointerEvents: 'none',
                transition: 'opacity 0.15s ease',
                zIndex: 2,
              }}>
                {l.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
//  TODAY LINE
// ============================================================

function TodayLine({ dim }) {
  const left = daysBetween(dim.minDate, T) * dim.pxPerDay;
  if (left < 0 || left > dim.totalWidth) return null;
  return (
    <div style={{
      position: 'absolute',
      left, top: 60,
      bottom: 0,
      width: '1px',
      background: 'linear-gradient(to bottom, #C65D3A, rgba(198, 93, 58, 0.25))',
      pointerEvents: 'none',
      zIndex: 5,
    }}>
      <div style={{
        position: 'absolute', top: '-4px', left: '-3px',
        background: '#C65D3A',
        color: 'white',
        fontSize: '9px',
        fontFamily: 'Geist Mono, monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        padding: '2px 5px',
        borderRadius: '3px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        Today
      </div>
    </div>
  );
}

// ============================================================
//  METRICS CHART
// ============================================================

function MetricsChart({ data, dim, ticks, metric, onMetricChange, activeLaunch, onAddMetric }) {
  const todayX = daysBetween(dim.minDate, T);
  const tickXs = useMemo(() => ticks.map(t => t.x), [ticks]);

  return (
    <div style={{ borderTop: '1px solid #E8E2D8', paddingTop: '14px', marginTop: '4px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px 12px 16px',
        position: 'sticky', left: 0,
        width: 'calc(100vw - 80px)',
        maxWidth: '900px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={14} style={{ color: '#6B6359' }} />
          <span className="la-display" style={{ fontSize: '15px', fontWeight: 500 }}>Metric overlay</span>
          <select className="la-select"
            value={metric}
            onChange={(e) => onMetricChange(e.target.value)}
            style={{ width: 'auto', padding: '4px 24px 4px 10px', fontSize: '12px', fontWeight: 500 }}>
            {Object.entries(METRICS_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <button className="la-btn la-btn-sm la-btn-ghost" onClick={onAddMetric}>
          <Plus size={12} /> Data point
        </button>
      </div>
      <div style={{ position: 'relative', width: dim.totalWidth, height: 160 }}>
        {data.length === 0 ? (
          <div style={{
            position: 'sticky', left: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#A89F92', fontSize: '13px', flexDirection: 'column', gap: '6px',
            width: 'calc(100vw - 100px)', maxWidth: '700px',
            height: '100%',
          }}>
            <Database size={18} />
            <span>No <em>{METRICS_CFG[metric].label.toLowerCase()}</em> data yet — add a data point to start tracking</span>
          </div>
        ) : (
          <AreaChart width={dim.totalWidth} height={160} data={data} margin={{ top: 8, right: 0, bottom: 18, left: 0 }}>
            <defs>
              <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A1614" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#1A1614" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F0EBE2" vertical={true} horizontal={true} />
            <XAxis
              dataKey="x" type="number" domain={[0, dim.totalDays]}
              ticks={tickXs}
              tick={false} axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#A89F92', fontFamily: 'Geist Mono, monospace' }}
              tickFormatter={(v) => compactNum(v)}
              axisLine={false} tickLine={false}
              width={52}
            />
            {activeLaunch && (
              <ReferenceArea
                x1={daysBetween(dim.minDate, activeLaunch.startDate)}
                x2={daysBetween(dim.minDate, activeLaunch.endDate)}
                fill={CHANNELS[activeLaunch.channel].color}
                fillOpacity={0.14}
                stroke={CHANNELS[activeLaunch.channel].color}
                strokeOpacity={0.5}
                strokeDasharray="3 3"
              />
            )}
            <ReferenceLine x={todayX} stroke="#C65D3A" strokeWidth={1.5} strokeOpacity={0.6} />
            <Tooltip
              cursor={{ stroke: '#1A1614', strokeWidth: 1, strokeOpacity: 0.3 }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{
                    background: 'white', border: '1px solid #E8E2D8',
                    borderRadius: '8px', padding: '8px 10px',
                    boxShadow: '0 10px 24px rgba(26, 22, 20, 0.12)',
                  }}>
                    <div className="la-mono" style={{ fontSize: '10px', color: '#A89F92', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{formatDateShort(d.date)}</div>
                    <div className="la-display" style={{ fontSize: '16px', fontWeight: 500, marginTop: '2px' }}>{fmtMetric(d.value, metric)}</div>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="value" stroke="#1A1614" strokeWidth={1.5} fill="url(#metricFill)" dot={false} activeDot={{ r: 4, fill: '#1A1614', stroke: 'white', strokeWidth: 2 }} />
          </AreaChart>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  CORRELATION PANEL
// ============================================================

function CorrelationPanel({ launch, stats, metric, isSelected, onClose, onEdit, onDelete }) {
  const ch = CHANNELS[launch.channel];
  const cfg = METRICS_CFG[metric];
  return (
    <div className="la-card la-fade" style={{ marginTop: '16px', padding: '20px 22px', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ch.color }} />
          <span className="la-mono" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6359' }}>
            {ch.label} · {launch.type}
            {launch.type === 'major' && <Sparkles size={10} style={{ display: 'inline', marginLeft: '4px', color: '#D4A04A' }} />}
          </span>
        </div>
        <h3 className="la-display" style={{ fontSize: '22px', margin: 0, fontWeight: 500, lineHeight: 1.15 }}>{launch.name}</h3>
        <div className="la-mono" style={{ fontSize: '11px', color: '#6B6359', marginTop: '6px' }}>
          {formatDateShort(launch.startDate)} — {formatDateShort(launch.endDate)} · {daysBetween(launch.startDate, launch.endDate) + 1}d
        </div>
        {launch.notes && (
          <p style={{ fontSize: '13px', color: '#4A453E', marginTop: '10px', lineHeight: 1.5 }}>{launch.notes}</p>
        )}
      </div>
      <div style={{ flex: '2 1 360px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <Stat label={`${cfg.label} during`} value={stats ? fmtMetric(stats.avgIn, metric) : '—'} hint="avg per day" />
        <Stat label="Same length before" value={stats?.avgBefore != null ? fmtMetric(stats.avgBefore, metric) : '—'} hint="baseline" />
        <Stat
          label="Change"
          value={stats?.delta != null ? `${stats.delta >= 0 ? '+' : ''}${stats.delta.toFixed(1)}%` : '—'}
          color={stats?.delta != null ? (stats.delta >= 0 ? '#5C7A4A' : '#C65D3A') : '#A89F92'}
          hint={stats?.delta != null ? (stats.delta >= 0 ? 'lift vs prior' : 'dip vs prior') : null}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button className="la-btn la-btn-sm" onClick={onEdit}><Edit2 size={12} /> Edit</button>
        {isSelected && (
          <button className="la-btn la-btn-sm la-btn-ghost" onClick={onClose}><X size={12} /> Close</button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, color }) {
  return (
    <div style={{ padding: '12px 14px', background: '#FAF7F2', borderRadius: '10px', border: '1px solid #F0EBE2' }}>
      <div className="la-mono" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A89F92' }}>{label}</div>
      <div className="la-display" style={{ fontSize: '22px', fontWeight: 500, color: color || '#1A1614', marginTop: '4px', lineHeight: 1 }}>{value}</div>
      {hint && <div style={{ fontSize: '11px', color: '#A89F92', marginTop: '3px' }}>{hint}</div>}
    </div>
  );
}

// ============================================================
//  FILTER CHIPS
// ============================================================

function FilterChips({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '11px', color: '#A89F92', marginRight: '2px', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="la-mono">{label}</span>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button key={opt.value}
            onClick={() => onChange(opt.value)}
            className="la-btn la-btn-sm"
            style={active ? {
              background: opt.color || '#1A1614',
              color: '#FAF7F2',
              borderColor: opt.color || '#1A1614'
            } : {}}>
            {opt.color && !active && (
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: opt.color, display: 'inline-block' }} />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
//  LEGEND
// ============================================================

function Legend() {
  return (
    <div style={{ marginTop: '20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', padding: '0 4px' }}>
      <span className="la-mono" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A89F92' }}>Channels</span>
      {Object.entries(CHANNELS).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: v.color }} />
          <span style={{ fontSize: '12px', color: '#4A453E' }}>{v.label}</span>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={11} style={{ color: '#D4A04A' }} />
          <span style={{ fontSize: '11px', color: '#6B6359' }}>Major</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '14px', height: '4px', borderRadius: '2px', background: '#A89F92' }} />
          <span style={{ fontSize: '11px', color: '#6B6359' }}>Minor</span>
        </div>
        <span className="la-mono" style={{ fontSize: '10px', color: '#A89F92' }}>· Click bar to inspect · Double-click to edit</span>
      </div>
    </div>
  );
}

// ============================================================
//  LAUNCH MODAL
// ============================================================

const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(26, 22, 20, 0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px', zIndex: 100,
  backdropFilter: 'blur(4px)',
};
const modalStyle = {
  maxWidth: '480px', width: '100%',
  padding: '26px',
  maxHeight: '90vh', overflowY: 'auto',
};

function LaunchModal({ launch, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState({
    id: launch.id || null,
    name: launch.name || '',
    type: launch.type || 'minor',
    channel: launch.channel || 'email',
    startDate: launch.startDate || todayISO(),
    endDate: launch.endDate || addDays(todayISO(), 7),
    notes: launch.notes || '',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = () => {
    if (!form.name.trim()) return;
    const fixed = { ...form };
    if (fixed.endDate < fixed.startDate) fixed.endDate = fixed.startDate;
    onSave(fixed);
  };

  return (
    <div className="la-overlay" style={overlayStyle} onClick={onCancel}>
      <div className="la-modal la-card" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span className="la-mono" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A89F92' }}>
              {form.id ? 'Editing' : 'Creating'}
            </span>
            <h2 className="la-display" style={{ fontSize: '24px', margin: '2px 0 0 0', fontWeight: 500 }}>
              {form.id ? 'Edit launch' : 'New launch'}
            </h2>
          </div>
          <button className="la-btn la-btn-ghost" onClick={onCancel}><X size={16} /></button>
        </div>

        <Field label="Name">
          <input className="la-input" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Spring email campaign" />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Channel">
            <select className="la-select" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              {Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <div style={{ display: 'flex', gap: '6px' }}>
              {['major', 'minor'].map(t => (
                <button key={t} type="button" className="la-btn"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    ...(form.type === t ? { background: '#1A1614', color: '#FAF7F2', borderColor: '#1A1614' } : {})
                  }}
                  onClick={() => setForm({ ...form, type: t })}>
                  {t === 'major' && <Sparkles size={12} />} {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Start"><input className="la-input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="End">  <input className="la-input" type="date" value={form.endDate}   onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
        </div>

        <Field label="Notes">
          <textarea className="la-input" rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Goals, context, owner, success criteria…"
            style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F0EBE2' }}>
          {onDelete ? (
            confirmDelete ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#C65D3A' }}>Really delete?</span>
                <button className="la-btn la-btn-sm" onClick={onDelete} style={{ background: '#C65D3A', color: 'white', borderColor: '#C65D3A' }}>Yes</button>
                <button className="la-btn la-btn-sm" onClick={() => setConfirmDelete(false)}>No</button>
              </div>
            ) : (
              <button className="la-btn la-btn-sm la-btn-danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={12} /> Delete
              </button>
            )
          ) : <span />}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="la-btn" onClick={onCancel}>Cancel</button>
            <button className="la-btn la-btn-primary" onClick={submit}>Save launch</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  METRIC MODAL
// ============================================================

function MetricModal({ metric, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: metric.id || null,
    date: metric.date || todayISO(),
    metric: metric.metric || 'revenue',
    value: metric.value ?? '',
  });

  const submit = () => {
    const num = parseFloat(form.value);
    if (isNaN(num)) return;
    onSave({ ...form, value: num });
  };

  return (
    <div className="la-overlay" style={overlayStyle} onClick={onCancel}>
      <div className="la-modal la-card" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span className="la-mono" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A89F92' }}>Metric</span>
            <h2 className="la-display" style={{ fontSize: '24px', margin: '2px 0 0 0', fontWeight: 500 }}>Add data point</h2>
          </div>
          <button className="la-btn la-btn-ghost" onClick={onCancel}><X size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Metric">
            <select className="la-select" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}>
              {Object.entries(METRICS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input className="la-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>

        <Field label={`Value${METRICS_CFG[form.metric].symbol ? ` (${METRICS_CFG[form.metric].symbol})` : ''}`}>
          <input className="la-input" type="number" step="any" autoFocus
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="0" />
        </Field>

        <p style={{ fontSize: '12px', color: '#A89F92', marginTop: '-6px' }}>
          Tip: log one number per day. If you add multiples, they'll sum for that date.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F0EBE2' }}>
          <button className="la-btn" onClick={onCancel}>Cancel</button>
          <button className="la-btn la-btn-primary" onClick={submit}>Save point</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  FIELD
// ============================================================

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label className="la-mono" style={{
        display: 'block', fontSize: '10px',
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: '#6B6359', marginBottom: '6px',
      }}>{label}</label>
      {children}
    </div>
  );
}
