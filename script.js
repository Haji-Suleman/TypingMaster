const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DURS = [15, 30, 60, 120, 300, 600], FONTS = { Small: 20, Medium: 24, Large: 30 }, LINE = 50;
const MODES = [
    { id: 'focus', i: '🎯', t: 'Focus', d: 'The classic. Live letter-by-letter highlighting.', v: 'inline' },
    { id: 'input', i: '⌨', t: 'TypingTQ', d: 'Text up top, you type below. Type freely.', v: 'box' },
    { id: 'word', i: '🔤', t: 'Word Hint', d: 'One word at a time, with letter feedback.', v: 'word' },
    { id: 'guided', i: '🧭', t: 'Guided', d: 'Only your current word is marked.', v: 'guided' },
    { id: 'sudden', i: '💀', t: 'Sudden Death', d: 'The very first mistake ends your run.', v: 'inline', sudden: 1 },
    { id: 'zen', i: '🧘', t: 'Zen', d: '40 relaxed words, no timer.', v: 'inline', timed: 0, words: 40 },
    { id: 'numbers', i: '🔢', t: 'Numbers', d: 'Digits only. Train that top row.', v: 'inline', cs: 'numbers' },
    { id: 'caps', i: '🔠', t: 'Caps', d: 'Mixed-case words. Forces you to use Shift.', v: 'inline', cs: 'caps' },
    { id: 'noback', i: '🚫', t: 'No Backspace', d: 'Every key you press is final.', v: 'inline', nb: 1 },
    { id: 'blind', i: '🙈', t: 'Blind', d: 'Text is visible, your typing is hidden.', v: 'box', blind: 1 },
    { id: 'burst', i: '💥', t: 'Burst', d: '10 seconds flat out. Pure sprint.', v: 'inline', fixed: 10 },
    { id: 'marathon', i: '🏃', t: 'Marathon', d: '150 words. Just finish the run.', v: 'inline', timed: 0, words: 150 }];
const MODE = {}; MODES.forEach(m => MODE[m.id] = m);
const FALLBACK = "The quick brown fox jumps over the lazy dog. Practice makes progress, so keep your eyes on the screen and let your fingers find the keys. Speed comes from accuracy, and accuracy comes from slow, steady, relaxed typing every single day. Great typists build rhythm before speed, they read ahead, breathe evenly, and never look down at the keyboard while the words flow across the page. Small habits, repeated daily, turn into skill; patience, not panic, wins the race.";
let TEXTS = [];
let S = { settings: { dur: 60, punct: true, mode: 'focus', font: 24, osk: false, sound: true, dark: true, text: 0 }, hist: [] };
try { const x = JSON.parse(localStorage.getItem('tm')); if (x) { S.settings = Object.assign(S.settings, x.settings); S.hist = x.hist || [] } } catch (e) { }
const st = S.settings; if (typeof st.text !== 'string') st.text = ''; st.para = +st.para || 0;
const save = () => { try { localStorage.setItem('tm', JSON.stringify(S)) } catch (e) { } };
// ---------- sound
let AC = null;
function beep(f, d, type = 'sine', v = .08) { if (!st.sound) return; try { AC = AC || new AudioContext(); const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d) } catch (e) { } }
const snd = { click: () => beep(170 + Math.random() * 40, .04, 'triangle', .1), error: () => beep(130, .12, 'sawtooth', .06), finish: () => { beep(784, .3); setTimeout(() => beep(1046, .4), 110) }, fail: () => { beep(196, .3); setTimeout(() => beep(147, .4), 120) }, win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => beep(f, .7), i * 90)) };
// ---------- words
const pretty = f => { const x = f.replace(/\.txt$/i, '').replace(/[_-]/g, ' ').trim(); return x ? x[0].toUpperCase() + x.slice(1) : f };
const curFile = () => st.text ? TEXTS.find(t => t.name === st.text) : null;
const paras = f => f.text.split(/\r?\n\s*\r?\n/).map(p => p.trim()).filter(Boolean);
let tokenPos = 0, textUsed = '';
function tokens(punct) {
    let text = FALLBACK; const f = curFile();
    if (f) { const p = paras(f); if (st.para > 0 && st.para <= p.length) text = p[st.para - 1]; else if (p.length) text = p.join('\n\n') }
    else if (TEXTS.length) text = TEXTS[Math.floor(Math.random() * TEXTS.length)].text;
    const t = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[—–]/g, '-').replace(/--/g, ' ').split(/\s+/).filter(Boolean);
    const r = punct ? t.filter(w => /^[A-Za-z0-9.,;:!?'"()\-]+$/.test(w) && w.length <= 16) : t.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w && w.length <= 14);
    return r.length ? r : ['the', 'quick', 'brown', 'fox']
}
const rcase = w => [...w].map(c => Math.random() < .42 ? c.toUpperCase() : c.toLowerCase()).join('');
function getWords(n, cs) {
    if (cs === 'numbers') return Array.from({ length: n }, () => { const k = [1, 2, 2, 3, 3, 4][Math.floor(Math.random() * 6)], v = Math.floor(Math.random() * 10 ** k); return Math.random() < .35 ? String(v).padStart(k, '0') : String(v) });
    let t = tokens(st.punct), out;
    if (curFile()) { out = []; for (let i = 0; i < n; i++)out.push(t[(tokenPos + i) % t.length]); tokenPos = (tokenPos + n) % t.length }
    else { while (t.length < n) t = t.concat(t); const p = Math.floor(Math.random() * (t.length - n + 1)); out = t.slice(p, p + n) }
    return cs === 'caps' ? out.map(rcase) : out
}
// ---------- Data folder loading
const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k)) || [] } catch (e) { return [] } };
async function loadData() {
    let files = [];
    try {
        let names = null;
        try { const r = await fetch('Data/manifest.json'); if (r.ok) names = await r.json() } catch (e) { }
        if (!names) { try { const r = await fetch('Data/'); if (r.ok) { const h = await r.text(); names = [...h.matchAll(/href="([^"]+\.txt)"/gi)].map(m => decodeURIComponent(m[1].split('/').pop())) } } catch (e) { } }
        if (names) for (const n of names) { try { const r = await fetch('Data/' + encodeURIComponent(n)); if (r.ok) files.push({ name: n, text: await r.text() }) } catch (e) { } }
    } catch (e) { }
    if (!files.length && Array.isArray(window.DATA_TEXTS)) files = window.DATA_TEXTS.slice();
    if (!files.length) files = lsGet('tm_data');
    const by = (a, b) => a.name.localeCompare(b.name);
    TEXTS = [...files.sort(by), ...lsGet('tm_texts').sort(by)];
    fillTexts(); refreshSettings()
}
function fillTexts() {
    const f = curFile(); if (!f && st.text) { st.text = ''; st.para = 0 }
    const ps = f ? paras(f) : []; if (st.para > ps.length) st.para = 0;
    const opts = '<option value="">🎲  Random text</option>' + TEXTS.map(t => `<option value="${esc(t.name)}">📖  ${esc(pretty(t.name))}</option>`).join('');
    const po = '<option value="0">📄  Whole text</option>' + ps.map((p, i) => { let v = p.replace(/\s+/g, ' ').slice(0, 42); if (p.length > 42) v += '…'; return `<option value="${i + 1}">${i + 1}.  ${esc(v)}</option>` }).join('');
    $$('.textSel').forEach(e => { e.innerHTML = opts; e.value = st.text });
    $$('.paraSel').forEach(e => { e.innerHTML = po; e.value = st.para; e.disabled = !f })
}
// ---------- session
class Session {
    constructor(words, dur, o) { this.words = words; this.full = words.join(' '); this.dur = dur; Object.assign(this, { sudden: 0, timed: 1, nb: 0 }, o); this.typed = ''; this.start = null; this.end = null; this.keys = 0; this.err = 0; this.backs = 0; this.missed = {}; this.mist = []; this.cum = []; this.inst = []; this.ls = 0; this.lc = 0; this.failed = false }
    el() { if (!this.start) return 0; return Math.min(((this.end ?? performance.now()) - this.start) / 1000, this.dur) }
    rem() { return Math.max(0, this.dur - this.el()) }
    done() { return this.failed || this.typed.length >= this.full.length || this.rem() <= 0 }
    get idx() { return this.typed.split(' ').length - 1 }
    get cur() { const p = this.typed.split(' '); return p[p.length - 1] }
    correct() { let c = 0; for (let i = 0; i < this.typed.length && i < this.full.length; i++)if (this.typed[i] === this.full[i]) c++; return c }
    wpm() { return this.correct() / 5 / (Math.max(this.el(), 1) / 60) }
    raw() { return this.typed.length / 5 / (Math.max(this.el(), 1) / 60) }
    acc() { return this.typed.length ? this.correct() / this.typed.length * 100 : 100 }
    results() { const t = this.typed.split(' '); return t.slice(0, this.idx).map((w, i) => w === this.words[i]) }
    sample() { if (!this.start) return; const s = Math.floor(this.el()); while (this.ls < s) { this.ls++; const c = this.correct(); this.cum.push(c / 5 / (this.ls / 60)); this.inst.push((c - this.lc) / 5 * 60); this.lc = c } }
    cons() { if (this.inst.length < 3) return null; const m = this.inst.reduce((a, b) => a + b) / this.inst.length; if (m <= 0) return 0; const sd = Math.sqrt(this.inst.reduce((a, b) => a + (b - m) ** 2, 0) / this.inst.length); return Math.max(0, Math.min(100, 100 - sd / m * 100)) }
    peak() { const a = this.inst; if (a.length >= 3) { let b = 0; for (let i = 0; i <= a.length - 3; i++)b = Math.max(b, (a[i] + a[i + 1] + a[i + 2]) / 3); return b } return a.length ? Math.max(...a) : this.wpm() }
    type(k) {
        if (this.done()) return;
        if (!this.start) this.start = performance.now();
        const w = this.words[this.idx] || '', c = this.cur, PAD = '\u00b7';
        const miss = (i, e, g) => {
            this.err++;
            if (e) { const n = e === ' ' ? 'space' : e; this.missed[n] = (this.missed[n] || 0) + 1 }
            if (this.mist.length < 2000) this.mist.push({ i, e, g, t: this.el() });
            if (this.sudden) this.failed = true;
        };
        if (k === ' ') {
            if (!c.length) return;                       // space on an empty word: ignore
            this.keys++;
            if (c.length < w.length) {                   // skipped letters: pad so words stay aligned
                for (let j = c.length; j < w.length; j++) miss(this.typed.length, w[j], ' ');
                this.typed += PAD.repeat(w.length - c.length);
            }
            this.typed += ' ';
            return;
        }
        this.keys++;
        if (c.length >= w.length) { miss(this.typed.length, ' ', k); return }   // extra letter: don't shift alignment
        const i = this.typed.length, e = this.full[i] || '';
        if (k !== e) miss(i, e, k);
        this.typed += k;
    }
    back() {
        if (this.nb || !this.typed) return false;
        const r = this.typed.slice(-1);
        this.typed = this.typed.slice(0, -1);
        if (r === ' ') while (this.typed.endsWith('\u00b7')) this.typed = this.typed.slice(0, -1);  // un-pad
        this.backs++;
        return true;
    }
    lines() { if (this._l && this._n === this.words.length) return this._l; const L = []; let l = [], u = 0; this.words.forEach((w, i) => { if (l.length && u + w.length + 1 > LINE) { L.push(l); l = []; u = 0 } l.push(i); u += w.length + 1 }); L.push(l); this._n = this.words.length; return this._l = L }
}
// ---------- rendering helpers
const sp = (c, t, cls = '') => `<span class="${cls}"${c ? ` style="color:${c}"` : ''}>${esc(t)}</span>`;
function wordHTML(s, i) {
    const w = s.words[i];
    if (i < s.idx) return `<span class="${s.results()[i] ? 'c-ok' : 'c-bad'}">${esc(w)}</span>`;
    if (i > s.idx) return `<span class="c-dim">${esc(w)}</span>`;
    let o = ''; const t = s.cur;
    for (let p = 0; p < w.length; p++)o += p < t.length ? `<span class="${t[p] === w[p] ? 'l-ok' : 'l-bad'}">${esc(w[p])}</span>` : p === t.length ? `<span class="l-next">${esc(w[p])}</span>` : `<span class="l-rest">${esc(w[p])}</span>`;
    for (const c of t.slice(w.length)) o += `<span class="l-bad">${esc(c)}</span>`; return o
}
const nb = () => '&nbsp;';
// ---------- state
let s = null, spec = MODE.focus, modeKey = '', cfgText = '', best = 0, timer = null, hfilter = 'all';
const page = n => { $$('.page').forEach(p => p.classList.toggle('on', p.id === n)); $$('.nav').forEach(b => b.classList.toggle('on', b.dataset.go === n)); $('#side').style.display = ['test'].includes(n) ? 'none' : '' };
function go(n) { clearInterval(timer); ({ dashboard: refreshDash, practice: refreshPractice, stats: refreshStats, settings: refreshSettings }[n] || (() => { }))(); page(n); window.scrollTo(0, 0) }
function chips(el, opts, cur, cb) { el.innerHTML = ''; opts.forEach(([l, v]) => { const b = document.createElement('button'); b.className = 'btn' + (v === cur ? ' on' : ''); b.textContent = l; b.onclick = () => { [...el.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); cb(v) }; el.appendChild(b) }) }
function card(title, icon, val) { return `<div class="card row"><span style="font-size:24px">${icon}</span><div><small>${title}</small><b>${val}</b></div></div>` }
function graph(cv, vals, h = 170) {
    const dpr = devicePixelRatio || 1, w = cv.clientWidth || 600; cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px'; const c = cv.getContext('2d'); c.scale(dpr, dpr); const cs = getComputedStyle(document.body);
    if (!vals.length) { c.fillStyle = cs.getPropertyValue('--dim'); c.textAlign = 'center'; c.fillText('Finish a test to see your progress', w / 2, h / 2); return }
    const hi = Math.max(10, Math.max(...vals) * 1.15), L = 46, R = w - 16, T = 14, B = h - 14;
    c.strokeStyle = cs.getPropertyValue('--grid'); c.fillStyle = cs.getPropertyValue('--dim'); c.textAlign = 'right';
    for (let k = 0; k < 5; k++) { const y = T + (B - T) * k / 4; c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke(); c.fillText(Math.round(hi * (1 - k / 4)), 40, y + 4) }
    const n = vals.length, pts = vals.map((v, i) => [L + (R - L) * (n > 1 ? i / (n - 1) : .5), B - (B - T) * v / hi]);
    const acc = cs.getPropertyValue('--acc'), g = c.createLinearGradient(0, T, 0, B); g.addColorStop(0, acc + '88'); g.addColorStop(1, acc + '00');
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = acc; c.lineWidth = 2.6; c.stroke();
    c.lineTo(pts[n - 1][0], B); c.lineTo(pts[0][0], B); c.fillStyle = g; c.fill();
    c.fillStyle = cs.getPropertyValue('--gold'); c.beginPath(); c.arc(...pts[n - 1], 5, 0, 7); c.fill()
}
const accCol = a => a >= 97 ? 'var(--good)' : a >= 90 ? 'var(--gold)' : 'var(--bad)';
const stars = w => { const n = [20, 40, 60, 80, 100].filter(t => w >= t).length; return '★'.repeat(n) + '☆'.repeat(5 - n) };
const rating = w => w < 25 ? 'Warming up' : w < 40 ? 'Average' : w < 60 ? 'Above average' : w < 80 ? 'Fast' : w < 100 ? 'Very fast' : 'Elite';
const fmt = x => { x = +x; if (x < 60) return Math.round(x) + 's'; return Math.floor(x / 60) + 'm ' + String(Math.floor(x % 60)).padStart(2, '0') + 's' };
function prettyTime(t) { const d = new Date(t.replace(' ', 'T')), gap = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5); return (gap === 0 ? 'Today' : gap === 1 ? 'Yesterday' : d.toDateString().slice(4)) + ', ' + t.slice(11) }
function histCard(e, compact) {
    const m = MODE[e.mid]; return `<div class="hist"><span style="font-size:26px">${m ? m.i : '⌨'}</span><div><b style="font-size:17px">${m ? m.t : 'Run'}</b><br><small class="dim">${e.cfg}${e.text ? ' · ' + esc(pretty(e.text)) : ''} · ${prettyTime(e.t)}</small></div>
 ${e.pb ? '<span class="pill gold">★ PERSONAL BEST</span>' : ''}${e.failed ? '<span class="pill" style="color:var(--bad)">☠ ENDED ON MISTAKE</span>' : ''}
 <span class="dim sm">Acc <b style="color:${accCol(e.acc)}">${e.acc.toFixed(1)}%</b> · Raw ${e.raw} · Errors ${e.errors} · ${fmt(e.secs)}${compact ? '' : ` · Cons ${e.cons == null ? '-' : Math.round(e.cons) + '%'} · Peak ${e.peak} · Keys ${e.keys} · Back ${e.backs}`}</span>
 <div class="wpm">${e.wpm.toFixed(1)}<small class="dim sm"> WPM</small><br><small class="gold sm">${stars(e.wpm)} ${rating(e.wpm)}</small></div></div>`
}
function summary() { const h = S.hist, l = h.slice(-10), a = k => l.length ? l.reduce((x, e) => x + e[k], 0) / l.length : 0; return { tests: h.length, best: Math.max(0, ...h.map(e => e.wpm)), avgW: a('wpm'), avgA: a('acc'), min: h.reduce((x, e) => x + (e.secs || 0), 0) / 60, keys: h.reduce((x, e) => x + (e.keys || 0), 0), errs: h.reduce((x, e) => x + (e.errors || 0), 0), bestA: Math.max(0, ...h.map(e => e.acc)) } }
function weak(n, last = 100) { const t = {}; S.hist.slice(-last).forEach(e => Object.entries(e.missed || {}).forEach(([k, v]) => t[k] = (t[k] || 0) + v)); return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, n) }
const bar = (name, r, right, col = 'var(--acc)') => `<div class="brow"><span>${name}</span><span class="tr"><i style="width:${Math.max(0, Math.min(1, r)) * 100}%;background:${col}"></i></span><b class="gold">${right}</b></div>`;
// ---------- pages
function refreshDash() {
    const m = MODE[st.mode], sm = summary(); $('#quickBtn').textContent = `▶   Quick start  ·  ${m.i} ${m.t}`; $('#themeBtn').textContent = st.dark ? '🌙 Dark Theme' : '☀️ Light Theme';
    $('#dashSub').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    $('#dashCards').innerHTML = card('Best WPM', '🏆', sm.best.toFixed(1)) + card('Avg WPM (last 10)', '⚡', sm.avgW.toFixed(1)) + card('Avg accuracy', '🎯', sm.avgA.toFixed(1) + '%') + card('Tests · time', '⏱', `${sm.tests} · ${Math.round(sm.min)} min`);
    page('dashboard'); graph($('#dashGraph'), S.hist.slice(-20).map(e => e.wpm));
    const w = weak(8), mx = w.length ? w[0][1] : 1; $('#dashWeak').innerHTML = w.length ? w.map(([k, v]) => `<div>${v}<i style="height:${Math.max(4, v / mx * 110)}px"></i>${esc(k)}</div>`).join('') : '<span class="dim">No mistakes recorded yet. Type more!</span>';
    $('#dashRecent').innerHTML = S.hist.length ? S.hist.slice(-5).reverse().map(e => histCard(e, 1)).join('') : '<span class="dim">Nothing here yet - tap Quick start!</span>'
}
function refreshPractice() { chips($('#durChips'), DURS.map(d => [d >= 60 ? d / 60 + 'm' : d + 's', d]), st.dur, d => { st.dur = d; save() }); const b = $('#punctBtn'); b.classList.toggle('on', st.punct); b.textContent = 'Punctuation:  ' + (st.punct ? 'ON' : 'OFF') }
function refreshStats() {
    const sm = summary(); $('#statCards').innerHTML = card('Best WPM', '🏆', sm.best.toFixed(1)) + card('Avg WPM (last 10)', '⚡', sm.avgW.toFixed(1)) + card('Avg accuracy', '🎯', sm.avgA.toFixed(1) + '%') + card('Tests', '🧪', sm.tests) + card('Total time', '⏱', sm.min.toFixed(1) + ' min') + card('Keystrokes', '⌨', sm.keys.toLocaleString()) + card('Total errors', '💥', sm.errs.toLocaleString()) + card('Best accuracy', '✨', sm.bestA.toFixed(1) + '%');
    page('stats'); graph($('#statGraph'), S.hist.slice(-50).map(e => e.wpm), 210);
    const bm = {}; S.hist.forEach(e => { if (e.mid) bm[e.mid] = Math.max(bm[e.mid] || 0, e.wpm) }); const top = Math.max(1, ...Object.values(bm));
    $('#bestByMode').innerHTML = MODES.map(m => bm[m.id] ? bar(m.i + '  ' + m.t, bm[m.id] / top, bm[m.id].toFixed(1) + ' WPM') : bar(m.i + '  ' + m.t, 0, '-')).join('');
    const w = weak(10); $('#weakKeys').innerHTML = w.length ? w.map(([k, v]) => bar(`<b style="font-size:20px;color:var(--bad)">${esc(k)}</b>`, v / w[0][1], '×' + v, 'var(--bad)')).join('') : '<span class="dim">No data yet.</span>';
    chips($('#histChips'), [['All', 'all'], ['★ Bests', 'best'], ['Today', 'today']], hfilter, v => { hfilter = v; refreshStats() });
    const today = new Date().toISOString().slice(0, 10), r = S.hist.filter(e => hfilter === 'all' || (hfilter === 'best' && e.pb) || (hfilter === 'today' && e.t.startsWith(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'))));
    $('#histList').innerHTML = r.length ? r.slice(-50).reverse().map(e => histCard(e)).join('') : '<span class="dim">' + (S.hist.length ? 'No runs match this filter.' : 'No runs yet.') + '</span>'
}
function refreshSettings() { chips($('#fontChips'), Object.entries(FONTS), st.font, v => { st.font = v; save() }); const b = $('#oskBtn'); b.classList.toggle('on', st.osk); b.textContent = 'On-screen keyboard:  ' + (st.osk ? 'ON' : 'OFF'); $('#textsLabel').textContent = TEXTS.length + ' text file(s) loaded' + (TEXTS.length ? '' : '  (using a built-in passage)') }
// ---------- test
function applyFont() { const f = st.font + 'px'; $('#textbox').style.fontSize = f; $('#inputbox').style.fontSize = f; $('#wordView').style.fontSize = f }
function start(id) {
    fillTexts(); if (id) st.mode = id; spec = MODE[st.mode]; let n, dur, timed = spec.timed !== 0;
    if (spec.fixed) { n = 100; dur = spec.fixed } else if (spec.words) { n = spec.words; dur = timed ? st.dur : 3600 } else { n = Math.max(100, st.dur * 4); dur = st.dur }
    tokenPos = 0; s = new Session(getWords(n, spec.cs), dur, { sudden: spec.sudden || 0, timed: timed ? 1 : 0, nb: spec.nb || 0 });
    const variant = spec.cs === 'numbers' ? 'digits' : spec.cs === 'caps' ? 'mixed case' : st.punct ? 'punctuation on' : 'punctuation off';
    const tt = spec.fixed ? spec.fixed + 's' : timed ? (st.dur < 60 ? st.dur + 's' : st.dur / 60 + 'm') : spec.words + ' words';
    cfgText = tt + ' · ' + variant; modeKey = `${spec.id}|${timed ? dur : 'zen'}|${variant[0]}`; best = Math.max(0, ...S.hist.filter(e => e.key === modeKey).map(e => e.wpm));
    $('#modeTitle').textContent = `${spec.icon || spec.i}  ${spec.t}   ·   ${cfgText}`; save(); fillTexts(); const num = spec.cs === 'numbers', cf = curFile(); $$('.textSel').forEach(e => e.disabled = num); $$('.paraSel').forEach(e => e.disabled = num || !cf); textUsed = !num && cf ? st.text : ''; $('#textTitle').innerHTML = num ? '' : cf ? `📖 <b>${esc(pretty(cf.name))}</b>${st.para ? ` · Paragraph ${st.para}` : ''}` : '🎲 Random text'; applyFont();
    $('#textbox').style.display = spec.v === 'word' ? 'none' : ''; $('#inputbox').style.display = (spec.v === 'box' || spec.v === 'guided') ? '' : 'none'; $('#wordView').style.display = spec.v === 'word' ? '' : 'none';
    $('#inputbox').classList.toggle('blind', !!spec.blind); $('#osk').classList.toggle('on', st.osk); $('#keysBtn').classList.toggle('on', st.osk);
    page('test'); render(); timer = setInterval(tick, 50)
}
function render() {
    if (!s) return; const v = spec.v, cur = Math.min(s.idx, s.words.length - 1);
    if (v === 'inline' || v === 'box' || v === 'guided') {
        const L = s.lines(), cl = L.findIndex(l => l.includes(cur)), n = v === 'inline' ? 3 : 4, first = Math.max(0, cl - 1); let rows = L.slice(first, first + n); while (rows.length < n) rows.push([]);
        const res = s.results();
        $('#textbox').innerHTML = rows.map(l => '<div>' + l.map((i, k) => {
            let h;
            if (v === 'inline') h = wordHTML(s, i); else if (v === 'guided') { const w = esc(s.words[i]); h = i < s.idx ? `<span style="color:${res[i] ? 'var(--good)' : 'var(--bad)'}">${w}</span>` : i === s.idx ? `<span class="l-next">${w}</span>` : w } else h = esc(s.words[i]);
            const wait = v === 'inline' && i === s.idx && s.cur.length >= s.words[i].length; return h + (k < l.length - 1 ? (wait ? '<span class="l-next">&nbsp;</span>' : nb()) : '')
        }).join('') + '</div>').join('');
        if (v !== 'inline') $('#inputbox').textContent = s.typed
    }
    else {
        const w = s.words[s.idx]; if (w === undefined) return; const res = s.results();
        $('#wordView').innerHTML = `<div class="wv-sm">${s.words.slice(Math.max(0, s.idx - 6), s.idx).map((x, j) => { const k = Math.max(0, s.idx - 6) + j; return `<span style="color:${res[k] ? 'var(--good)' : 'var(--bad)'}">${esc(x)}</span>` }).join(' &nbsp; ')}&nbsp;</div><div class="wv-big">${wordHTML(s, s.idx)}</div><div class="wv-mid">${s.cur ? `<span style="color:${w.startsWith(s.cur) ? 'var(--text)' : 'var(--bad)'}">${esc(s.cur)}</span>` : '<span class="dim">type the word above</span>'}</div><div class="wv-mid dim">${esc(s.words.slice(s.idx + 1, s.idx + 5).join('  '))}</div>`
    }
    header(); osk()
}
function header() {
    if (s.timed) { const r = Math.ceil(s.rem()); $('#timeLabel').textContent = s.dur >= 60 ? `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}` : r; $('#barFill').style.width = 100 * s.rem() / s.dur + '%' }
    else { $('#timeLabel').textContent = Math.floor(s.el()) + 's'; $('#barFill').style.width = 100 * Math.min(s.idx, s.words.length) / s.words.length + '%' }
    const L = $('#statsLabel');
    if (!s.start) return L.innerHTML = `<span class="gold">${s.timed ? 'Start typing to begin — the timer starts on your first key' : "Start typing whenever you're ready"}</span>`;
    if (spec.v === 'box') return L.innerHTML = `<span class="dim">${spec.blind ? 'your typing is hidden — trust yourself' : 'no hints — your score appears at the end'}</span>`;
    if (spec.id === 'zen') return L.innerHTML = `Word <b>${Math.min(s.idx + 1, s.words.length)}/${s.words.length}</b> &nbsp;&nbsp; ACC <b>${s.acc().toFixed(1)}%</b>`;
    const ex = []; if (s.sudden) ex.push('<span style="color:var(--bad)">one mistake ends the run</span>'); if (s.nb) ex.push('<span style="color:var(--bad)">🚫 backspace disabled</span>'); if (!ex.length) ex.push(`<span class="dim">BEST ${best.toFixed(0)}</span>`);
    L.innerHTML = `WPM <b>${s.wpm().toFixed(1)}</b> &nbsp;&nbsp; ACC <b>${s.acc().toFixed(1)}%</b> &nbsp;&nbsp; ${ex.join(' &nbsp; ')}`
}
function extend() { if (!s || !s.timed || s.words.length - s.idx >= 50) return; const x = getWords(100, spec.cs); s.words.push(...x); s.full += ' ' + x.join(' ') }
function tick() { if (!s) return; s.sample(); extend(); render(); if (s.done()) finish() }
function press(k) {
    if (!s) return;
    if (k === 'Escape') { clearInterval(timer); return go('dashboard') } if (k === 'Tab') return start();
    if (s.done()) return;
    if (k === 'Backspace') { if (s.nb) return snd.error(); if (s.back()) snd.click(); return render() }
    if (k === 'CtrlBackspace') { s.typed = ''; return render() }
    if (k.length !== 1) return; const e = s.full[s.typed.length]; s.type(k); (k === e || !e) ? snd.click() : snd.error(); render(); if (s.done()) finish()
}
document.addEventListener('keydown', ev => {
    if (!$('#test').classList.contains('on')) return; if (ev.ctrlKey && ev.key !== 'Backspace' || ev.metaKey || ev.altKey) return;
    const k = ev.key === 'Backspace' && ev.ctrlKey ? 'CtrlBackspace' : ev.key; if (k === 'Enter' || k.length === 1 || ['Escape', 'Tab', 'Backspace', 'CtrlBackspace'].includes(k)) { ev.preventDefault(); press(k) }
});
// on-screen keyboard
const ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', ',.\'"-!?:;()']; let shift = false;
function buildOsk() {
    const o = $('#osk'); o.innerHTML = ''; ROWS.forEach((r, ri) => {
        const d = document.createElement('div'); d.className = 'r'; if (ri === 3) { const sh = document.createElement('button'); sh.id = 'shiftK'; sh.textContent = '⇧'; sh.onclick = () => { shift = !shift; sh.classList.toggle('on', shift); $$('#osk [data-k]').forEach(b => { if (/[a-z]/i.test(b.dataset.k)) b.textContent = shift ? b.dataset.k.toUpperCase() : b.dataset.k }) }; d.appendChild(sh) }
        [...r].forEach(c => { const b = document.createElement('button'); b.textContent = c; b.dataset.k = c; b.onclick = () => { let out = c; if (shift && /[a-z]/.test(c)) { out = c.toUpperCase(); $('#shiftK').click() } press(out) }; d.appendChild(b) });
        if (ri === 3) { const bk = document.createElement('button'); bk.textContent = '⌫'; bk.onclick = () => press('Backspace'); d.appendChild(bk) } o.appendChild(d)
    });
    const d = document.createElement('div'); d.className = 'r'; const sp = document.createElement('button'); sp.textContent = 'space'; sp.dataset.k = ' '; sp.style.width = '420px'; sp.onclick = () => press(' '); d.appendChild(sp); o.appendChild(d)
}
function osk() { if (!st.osk || !s) return; const n = s.done() ? '' : s.full[s.typed.length] || ''; $$('#osk button').forEach(b => b.classList.remove('next')); if (!n) return; const t = n.toLowerCase(); const b = $(`#osk [data-k="${CSS.escape(t)}"]`); if (b) b.classList.add('next'); if (/[A-Z]/.test(n)) $('#shiftK').classList.add('next') }
// ---------- finish & results
function finish() {
    if (!s || s.end != null) return; clearInterval(timer); s.end = performance.now(); snd[s.failed ? 'fail' : 'finish']();
    const wpm = s.wpm(), cons = s.cons(), pb = wpm > best;
    const e = { t: new Date().toLocaleString('sv').slice(0, 16), key: modeKey, mid: spec.id, cfg: cfgText, wpm: +wpm.toFixed(1), acc: +s.acc().toFixed(1), pb, raw: +s.raw().toFixed(1), cons: cons == null ? null : +cons.toFixed(1), peak: +s.peak().toFixed(1), errors: s.err, keys: s.keys, backs: s.backs, secs: +s.el().toFixed(1), failed: s.failed, text: textUsed, missed: s.missed };
    S.hist.push(e); S.hist = S.hist.slice(-500); save(); if (pb) setTimeout(snd.win, 300);
    $('#resTitle').textContent = `${spec.i}  ${spec.t}   ·   ${cfgText}` + (textUsed ? `   ·   📖 ${pretty(textUsed)}` : ''); $('#resRating').textContent = stars(wpm) + '   ' + rating(wpm);
    $('#resCards').innerHTML = card('Accuracy', '🎯', e.acc + '%') + card('Raw WPM', '⚡', e.raw) + card('Consistency', '🧘', cons == null ? '-' : Math.round(cons) + '%') + card('Peak WPM', '🚀', e.peak) + card('Time', '⏱', fmt(e.secs)) + card('Errors', '💥', s.err);
    $('#resBadges').innerHTML = (pb ? '<span class="pill gold">★ NEW PERSONAL BEST</span>' : '') + (s.failed ? '<span class="pill" style="color:var(--bad)">☠ ENDED ON MISTAKE</span>' : '') + (!s.err && s.typed.length > 50 ? '<span class="pill" style="color:var(--good)">✨ FLAWLESS</span>' : '');
    $('#resMist').innerHTML = s.mist.length ? s.mist.slice(0, 80).map(m => `<span>${m.t.toFixed(1)}s · expected <b class="c-ok">${esc(m.e || '∅')}</b> got <b style="color:var(--bad)">${esc(m.g === ' ' ? '␣' : m.g)}</b></span>`).join('') : '<span class="c-ok">No mistakes — clean run ✓</span>';
    page('results'); graph($('#resGraph'), s.cum.length > 1 ? s.cum : []);
    let cur = 0; const el = $('#resWpm'), a = setInterval(() => { cur += (wpm - cur) * .12; if (Math.abs(wpm - cur) < .05) { cur = wpm; clearInterval(a) } el.textContent = cur.toFixed(1) }, 16)
}
// ---------- wiring
function theme() { document.body.classList.toggle('dark', st.dark); document.body.classList.toggle('light', !st.dark) }
function sndBtn() { const b = $('#soundBtn'); b.textContent = '🔊 Sound: ' + (st.sound ? 'ON' : 'OFF'); b.classList.toggle('on', st.sound) }
$$('.nav').forEach(b => b.onclick = () => go(b.dataset.go));
$('#soundBtn').onclick = () => { st.sound = !st.sound; sndBtn(); save(); snd.click() };
$('#themeBtn').onclick = () => { st.dark = !st.dark; theme(); save(); refreshDash() };
$('#quickBtn').onclick = () => start(st.mode);
$('#punctBtn').onclick = () => { st.punct = !st.punct; save(); refreshPractice() };
$('#oskBtn').onclick = () => { st.osk = !st.osk; save(); refreshSettings() };
$('#keysBtn').onclick = () => { st.osk = !st.osk; $('#osk').classList.toggle('on', st.osk); $('#keysBtn').classList.toggle('on', st.osk); save(); osk() };
$('#exitBtn').onclick = () => press('Escape'); $('#restartBtn').onclick = () => press('Tab');
const inTest = () => $('#test').classList.contains('on');
$$('.textSel').forEach(e => e.onchange = () => { st.text = e.value; st.para = 0; save(); fillTexts(); if (inTest()) start() });
$$('.paraSel').forEach(e => e.onchange = () => { st.para = +e.value; save(); fillTexts(); if (inTest()) start() });
$('#againBtn').onclick = () => start(); $('#homeBtn').onclick = () => go('dashboard'); $('#randBtn').onclick = () => start(MODES[Math.floor(Math.random() * MODES.length)].id);
$('#resetBtn').onclick = () => { if (confirm('Delete all scores and history? This cannot be undone.')) { S.hist = []; save(); refreshStats() } };
const readTxt = async fl => { const o = []; for (const f of fl) if (/\.txt$/i.test(f.name)) o.push({ name: f.name, text: await f.text() }); return o };
$('#fileIn').onchange = async e => {
    const add = await readTxt(e.target.files), cur = lsGet('tm_texts').filter(t => !add.some(a => a.name === t.name));
    try { localStorage.setItem('tm_texts', JSON.stringify([...cur, ...add])) } catch (x) { } await loadData()
};
$('#dirIn').onchange = async e => {
    const d = await readTxt(e.target.files);
    try { localStorage.setItem('tm_data', JSON.stringify(d)) } catch (x) { alert('Data folder is too large to store in the browser.') } await loadData()
};
$('#modeGrid').innerHTML = MODES.map(m => `<button class="btn mode" data-m="${m.id}"><span class="ic">${m.i}</span><b>${m.t}</b><span class="d">${m.d}</span></button>`).join('');
$$('.mode').forEach(b => b.onclick = () => start(b.dataset.m));
theme(); sndBtn(); buildOsk(); fillTexts(); go('dashboard'); loadData();