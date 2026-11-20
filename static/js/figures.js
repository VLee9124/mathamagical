// Figures and animations for the MathaMAGICal page. Vanilla JS + inline SVG.
// Every number here is transcribed from the camera-ready tables; MM_DATA holds the
// curve and scatter points recovered from the paper's figures.
(function () {
  'use strict';

  const D = window.MM_DATA;
  const NS = 'http://www.w3.org/2000/svg';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- helpers
  function S(tag, attrs, ...kids) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    kids.flat().forEach((k) => { if (k != null) e.append(k.nodeType ? k : document.createTextNode(k)); });
    return e;
  }
  function H(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach((k) => { if (k != null) e.append(k.nodeType ? k : document.createTextNode(k)); });
    return e;
  }
  const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  let uid = 0;

  // tok = { cancelled } lets a newer animation stop an older one.
  function tween(ms, fn, tok, linear) {
    return new Promise((res) => {
      if (RM || ms <= 0) { fn(1); return res(); }
      const t0 = performance.now();
      (function frame(now) {
        if (tok && tok.cancelled) return res();
        const t = clamp((now - t0) / ms, 0, 1);
        fn(linear ? t : ease(t));
        t < 1 ? requestAnimationFrame(frame) : res();
      })(t0);
    });
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, RM ? 0 : ms));

  function onVisible(el, enter, leave) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) enter(); else if (leave) leave();
    }), { threshold: 0.15 });
    io.observe(el);
  }

  const tipEl = document.getElementById('tip');
  function tip(el, html) {
    el.addEventListener('pointermove', (e) => {
      tipEl.innerHTML = html;
      tipEl.classList.add('on');
      const w = tipEl.offsetWidth;
      tipEl.style.left = clamp(e.clientX + 14, 8, innerWidth - w - 8) + 'px';
      tipEl.style.top = e.clientY + 16 + 'px';
    });
    el.addEventListener('pointerleave', () => tipEl.classList.remove('on'));
    return el;
  }

  // Bars: rounded at the data end, square at the baseline.
  function vbar(x, w, y0, y1, r = 4) {
    const up = y1 < y0; const rr = Math.min(r, Math.abs(y1 - y0), w / 2); const q = up ? rr : -rr;
    return `M${x} ${y0}L${x} ${y1 + q}Q${x} ${y1} ${x + rr} ${y1}L${x + w - rr} ${y1}Q${x + w} ${y1} ${x + w} ${y1 + q}L${x + w} ${y0}Z`;
  }
  function hbar(x0, x1, y, h, r = 4) {
    const right = x1 > x0; const rr = Math.min(r, Math.abs(x1 - x0), h / 2); const q = right ? -rr : rr;
    return `M${x0} ${y}L${x1 + q} ${y}Q${x1} ${y} ${x1} ${y + rr}L${x1} ${y + h - rr}Q${x1} ${y + h} ${x1 + q} ${y + h}L${x0} ${y + h}Z`;
  }
  const check = (x, y, s = 7) => S('path', { d: `M${x - s} ${y}l${s * 0.7} ${s * 0.7}L${x + s} ${y - s * 0.8}`, fill: 'none', stroke: 'var(--ok)', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const cross = (x, y, s = 6) => S('path', { d: `M${x - s} ${y - s}L${x + s} ${y + s}M${x + s} ${y - s}L${x - s} ${y + s}`, fill: 'none', stroke: 'var(--bad)', 'stroke-width': 2.6, 'stroke-linecap': 'round' });

  // Deterministic pseudo-random numbers for the schematic block grids.
  function rng(seed) { let a = seed; return () => { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296; }; }

  // ------------------------------------------------------------------- data
  const FAM = [
    { key: 'worked', name: 'Worked examples' },
    { key: 'primitive', name: 'Primitive facts' },
    { key: 'verbal', name: 'Verbal procedures' },
    { key: 'code', name: 'Code traces' },
    { key: 'web', name: 'Web text' },
  ];
  const fc = (k) => `var(--fam-${k})`;

  // Tables 4 and 9 (windows on 152M web+math). Lift order follows FAM.
  const WIN = [
    { name: 'Before the skill', step: 1510, acc: 0, lds: 0.991, range: '0.980–0.995', help: [2.83, 2.13, 0.96, 1.20, 0.22], harm: [2.63, 2.15, 1.07, 1.21, 0.23] },
    { name: 'Skill appearing', step: 2114, acc: 17, lds: 0.863, range: '0.777–0.960', help: [2.64, 2.14, 1.21, 1.39, 0.16], harm: [2.43, 2.16, 1.23, 1.41, 0.19] },
    { name: 'Skill forming', step: 2718, acc: 89, lds: 0.992, range: '0.983–0.996', help: [2.10, 2.40, 1.15, 1.51, 0.21], harm: [1.92, 2.48, 1.16, 1.48, 0.24] },
    { name: 'Skill present', step: 4530, acc: 174, lds: 0.991, range: '0.985–0.994', help: [1.44, 1.63, 0.89, 0.98, 0.77], harm: [1.21, 1.61, 0.82, 1.02, 0.83] },
  ];
  const FULL_STEPS = 30518;

  // ------------------------------------------------- shared: accuracy curve
  function acqChart(W, Hh, o = {}) {
    const m = { l: 44, r: 16, t: o.top || 22, b: 36 };
    const lx = lin(Math.log10(300), Math.log10(92000), m.l, W - m.r);
    const x = (v) => lx(Math.log10(v));
    const y = lin(0, 200, Hh - m.b, m.t);
    const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Held-out problems solved out of 200 by optimizer step for the 152M web+math model. Accuracy is zero until about step 1,500, then rises to 200 by about step 30,000 and stays there.' });
    [0, 50, 100, 150, 200].forEach((v) => {
      svg.append(S('line', { class: 'gridline', x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }));
      svg.append(S('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, v));
    });
    [[1000, '1k'], [3000, '3k'], [10000, '10k'], [30000, '30k'], [90000, '90k']].forEach(([v, l]) => {
      svg.append(S('line', { class: 'axis', x1: x(v), x2: x(v), y1: Hh - m.b, y2: Hh - m.b + 4 }));
      svg.append(S('text', { x: x(v), y: Hh - m.b + 17, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, l));
    });
    svg.append(S('text', { x: W - m.r, y: Hh - 4, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, 'optimizer step (log scale)'));
    svg.append(S('text', { x: m.l - 30, y: m.t - 9, 'font-size': 11, class: 't-muted' }, 'held-out solved (of 200)'));
    const pts = D.acq.concat([[91552, 200]]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1)).join('');
    const id = 'clip' + ++uid;
    const clip = S('rect', { x: 0, y: 0, width: W, height: Hh });
    svg.append(S('clipPath', { id }, clip));
    const under = S('g'); svg.append(under);
    const path = S('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'clip-path': `url(#${id})` });
    svg.append(path);
    const over = S('g'); svg.append(over);
    // accuracy at an arbitrary step, by interpolation on the recovered points
    const at = (step) => {
      for (let i = 1; i < pts.length; i++) if (pts[i][0] >= step) {
        const [a, b] = [pts[i - 1], pts[i]];
        return a[1] + ((step - a[0]) / (b[0] - a[0] || 1)) * (b[1] - a[1]);
      }
      return 200;
    };
    return { svg, x, y, lx, m, W, H: Hh, clip, path, under, over, at };
  }

  // ====================================================== pipeline stepper
  const SCENES = [
    {
      label: 'Build the corpus',
      title: 'Build the corpus',
      body: 'Half filtered FineWeb-Edu web text, half synthetic arithmetic. The arithmetic comes in four families that write the same kind of program in different formats, matched on token budget and on how often each program repeats.',
      facts: [['Block size', '512 tokens'], ['Tokenizer', 'byte-level, 276 symbols'], ['Seen in training', 'single ops, MULTIPLY → ADD'], ['Held out', 'ADD → MULTIPLY, 200 problems']],
      build(el) {
        const parts = [['web', 'Web text 50%', 50], ['worked', '12.5%', 12.5], ['primitive', '12.5%', 12.5], ['verbal', '12.5%', 12.5], ['code', '12.5%', 12.5]];
        const bar = H('div', { class: 'corpus-bar', role: 'img', 'aria-label': 'Corpus mix: 50% web text and 12.5% each of worked examples, primitive facts, verbal procedures, and code traces.' });
        const segs = parts.map(([k, l]) => { const s = H('div', { class: k, style: `background:${fc(k)}`, text: l }); bar.append(s); return s; });
        const cards = [
          ['worked', 'Worked examples', 'START: 17 | STEP_1: MULTIPLY 2 | STEP_2: ADD 6 | FINAL: ?\n>> WORK: STEP_1: 34 | STEP_2: 40 | FINAL: 40', 'the evaluation format'],
          ['verbal', 'Verbal procedures', 'Start with 17. Multiply by 2 to get 34. Add 6 to get 40.', 'the same execution in natural language'],
          ['code', 'Code traces', 'x = 17\nx = x * 2  # x = 34\nx = x + 6  # x = 40', 'the same execution as an assignment trace'],
          ['primitive', 'Primitive facts', '88 * 2 = 176\n412 + 6 = 418', 'the operations, never their composition'],
        ];
        const grid = H('div', { class: 'fam-grid' });
        const pres = cards.map(([k, n, rec, desc]) => {
          const pre = H('pre');
          grid.append(H('div', { class: 'fam-card', style: `--c:${fc(k)}` }, H('h4', {}, n, H('span', { text: '12.5%' })), pre, H('em', { text: desc })));
          return [pre, rec];
        });
        const held = H('div', { class: 'heldout', style: 'opacity:0', html: '<b>Held out for evaluation:</b> <code>7 → add 45 → multiply by 3 → 156</code>' });
        el.append(bar, grid, held);
        return async (tok) => {
          await tween(900, (t) => segs.forEach((s, i) => { s.style.width = parts[i][2] * t + '%'; }), tok);
          for (const [pre, rec] of pres) {
            if (tok.cancelled) return;
            await tween(650, (t) => { pre.textContent = rec.slice(0, Math.round(rec.length * t)); }, tok, true);
          }
          await tween(400, (t) => { held.style.opacity = t; }, tok);
        };
      },
    },
    {
      label: 'Train from scratch',
      title: 'Train from scratch',
      body: 'A 152M-parameter GPT-2-style model trains on 3.0B tokens. Held-out accuracy sits at zero, then climbs to 200 of 200 within the first third of the run and stays there. Models trained without arithmetic solve none.',
      facts: [['Model', '152M web+math'], ['Run length', '91,553 steps'], ['Held-out at the end', '200 / 200'], ['Arithmetic-free control', '0 / 200']],
      build(el) {
        const c = acqChart(600, 360, { top: 44 });
        const dot = S('circle', { r: 5, fill: 'var(--mark)', stroke: 'var(--surface)', 'stroke-width': 2 });
        const read = S('text', { x: c.W - c.m.r, y: 26, 'text-anchor': 'end', 'font-size': 22, 'font-weight': 600, class: 't-ink' }, '0 / 200');
        c.over.append(dot); c.svg.append(read);
        el.append(c.svg);
        const l0 = Math.log10(302), l1 = Math.log10(91552);
        return (tok) => tween(3000, (t) => {
          const step = Math.pow(10, l0 + (l1 - l0) * t); const acc = c.at(step);
          c.clip.setAttribute('width', c.x(step));
          dot.setAttribute('cx', c.x(step)); dot.setAttribute('cy', c.y(acc));
          read.textContent = Math.round(acc) + ' / 200';
        }, tok, true);
      },
    },
    {
      label: 'Freeze a window',
      title: 'Freeze a window',
      body: 'Pick a checkpoint on the curve. Resume training from it for 100 steps on 25,600 blocks the model has not seen, and attribute only those steps. Four windows cover the skill before it exists, as it appears, as it forms, and once it is present.',
      facts: [['Window', '100 steps × 512 blocks'], ['Before the skill', 'step 1,510 · 0 / 200'], ['Skill appearing', 'step 2,114 · 17 / 200'], ['Skill forming', 'step 2,718 · 89 / 200'], ['Skill present', 'step 4,530 · 174 / 200']],
      build(el) {
        const c = acqChart(600, 360, { top: 44 });
        c.path.setAttribute('stroke', 'var(--ink-3)');
        const groups = WIN.map((w, i) => {
          const g = S('g', { opacity: 0 });
          const x0 = c.x(w.step), x1 = c.x(w.step + 100);
          g.append(S('rect', { x: x0, y: c.m.t, width: Math.max(3, x1 - x0), height: c.H - c.m.b - c.m.t, fill: 'var(--ok)', opacity: 0.22 }));
          g.append(S('line', { x1: x0, x2: x0, y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--ok)', 'stroke-width': 1.5 }));
          g.append(S('circle', { cx: x0, cy: c.y(w.acc), r: 5.5, fill: 'var(--ok)', stroke: 'var(--surface)', 'stroke-width': 2 }));
          g.append(S('circle', { cx: x0, cy: c.m.t - 12, r: 9, fill: 'var(--ok)' }));
          g.append(S('text', { x: x0, y: c.m.t - 8, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: 'var(--surface)', style: 'fill:var(--surface)' }, i + 1));
          c.over.append(g); return g;
        });
        const note = S('text', { x: c.W - c.m.r, y: 150, 'text-anchor': 'end', 'font-size': 12, class: 't-muted', opacity: 0 }, 'each band is 100 steps, to scale');
        c.svg.append(note);
        el.append(c.svg);
        return async (tok) => {
          for (const g of groups) { if (tok.cancelled) return; await tween(380, (t) => g.setAttribute('opacity', t), tok); await sleep(120); }
          await tween(300, (t) => note.setAttribute('opacity', t), tok);
        };
      },
    },
    {
      label: 'Score with MAGIC',
      title: 'Score every block',
      body: 'MAGIC replays the window and differentiates held-out loss back through each of its 100 updates. Every 512-token block that was trained on gets one score: the first-order effect of removing it.',
      facts: [['Target', 'loss on held-out answer tokens'], ['Negative score', 'helpful: removal raises loss'], ['Positive score', 'harmful: removal lowers loss'], ['Implementation', 'MAGIC in bergson']],
      build(el) {
        const W = 600, Hh = 360;
        const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'A forward pass runs through 100 training steps from a checkpoint to the held-out loss, then a reverse pass travels back through the same steps and assigns a score to every training block.' });
        const labels = ['1', '2', '3', '…', '98', '99', '100'];
        const x0 = 96, dx = 62, yTop = 92, bw = 44;
        svg.append(S('text', { x: 20, y: 30, 'font-size': 12, class: 't-muted' }, 'forward: train 100 steps from the checkpoint'));
        const ck = S('g');
        ck.append(S('path', { d: `M38 ${yTop + 18}l16 -18 16 18 -16 18z`, fill: 'var(--surface-2)', stroke: 'var(--ink-2)', 'stroke-width': 1.5 }));
        ck.append(S('text', { x: 54, y: yTop + 56, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, 'checkpoint'));
        svg.append(ck);
        const rand = rng(11);
        const steps = labels.map((l, i) => {
          const x = x0 + i * dx; const g = S('g');
          const box = S('rect', { x, y: yTop, width: bw, height: 36, rx: 7, fill: 'var(--surface-2)', stroke: 'var(--line)', 'stroke-width': 1.5 });
          g.append(box, S('text', { x: x + bw / 2, y: yTop + 23, 'text-anchor': 'middle', 'font-size': 13, class: 't-ink t-mono' }, l));
          const cells = [];
          if (l !== '…') for (let r = 0; r < 5; r++) for (let q = 0; q < 2; q++) {
            const v = rand() * 2 - 1;
            const cell = S('rect', { x: x + 4 + q * 19, y: yTop + 66 + r * 19, width: 17, height: 17, rx: 3, fill: 'var(--mid)' });
            g.append(cell); cells.push([cell, v]);
          } else g.append(S('text', { x: x + bw / 2, y: yTop + 118, 'text-anchor': 'middle', 'font-size': 16, class: 't-muted' }, '…'));
          svg.append(g); return { x, box, cells };
        });
        svg.append(S('text', { x: 54, y: yTop + 118, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, 'blocks'));
        svg.append(S('text', { x: 54, y: yTop + 132, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, 'per step'));
        const lossX = x0 + 7 * dx;
        const loss = S('g');
        const lossBox = S('rect', { x: lossX, y: yTop - 6, width: 62, height: 48, rx: 10, fill: 'var(--surface-2)', stroke: 'var(--mark)', 'stroke-width': 1.5 });
        loss.append(lossBox, S('text', { x: lossX + 31, y: yTop + 14, 'text-anchor': 'middle', 'font-size': 11, class: 't-ink' }, 'held-out'), S('text', { x: lossX + 31, y: yTop + 29, 'text-anchor': 'middle', 'font-size': 11, class: 't-ink' }, 'loss'));
        svg.append(loss);
        // track for the two passes
        const yF = yTop - 22, yR = yTop + 180;
        svg.append(S('line', { x1: 72, x2: lossX + 31, y1: yF, y2: yF, class: 'axis' }));
        const fwd = S('line', { x1: 72, x2: 72, y1: yF, y2: yF, stroke: 'var(--mark)', 'stroke-width': 3, 'stroke-linecap': 'round' });
        svg.append(fwd);
        svg.append(S('line', { x1: 72, x2: lossX + 31, y1: yR, y2: yR, class: 'axis' }));
        const rev = S('line', { x1: lossX + 31, x2: lossX + 31, y1: yR, y2: yR, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' });
        const head = S('path', { d: 'M0 -6l-9 6 9 6z', fill: 'var(--ink)', opacity: 0 });
        svg.append(rev, head);
        const revLabel = S('text', { x: lossX + 31, y: yR + 20, 'text-anchor': 'end', 'font-size': 12, class: 't-muted', opacity: 0 }, 'reverse: differentiate the loss back through every update');
        svg.append(revLabel);
        // legend
        const lg = S('g', { opacity: 0 });
        const lx = 96, ly = Hh - 26;
        lg.append(S('rect', { x: lx, y: ly, width: 14, height: 14, rx: 3, fill: 'var(--neg)' }), S('text', { x: lx + 20, y: ly + 11, 'font-size': 12 }, 'helpful (negative score)'));
        lg.append(S('rect', { x: lx + 190, y: ly, width: 14, height: 14, rx: 3, fill: 'var(--pos)' }), S('text', { x: lx + 210, y: ly + 11, 'font-size': 12 }, 'harmful (positive score)'));
        svg.append(lg);
        el.append(svg);
        const span = lossX + 31 - 72;
        return async (tok) => {
          await tween(1300, (t) => {
            const x = 72 + span * t; fwd.setAttribute('x2', x);
            steps.forEach((s) => s.box.setAttribute('stroke', x > s.x + bw / 2 ? 'var(--mark)' : 'var(--line)'));
          }, tok, true);
          await sleep(250);
          revLabel.setAttribute('opacity', 1); head.setAttribute('opacity', 1);
          await tween(2200, (t) => {
            const x = lossX + 31 - span * t; rev.setAttribute('x2', x);
            head.setAttribute('transform', `translate(${x} ${yR})`);
            steps.forEach((s) => s.cells.forEach(([cell, v]) => {
              if (x < s.x + bw / 2) { cell.setAttribute('fill', v < 0 ? 'var(--neg)' : 'var(--pos)'); cell.setAttribute('opacity', 0.25 + 0.75 * Math.abs(v)); }
              else { cell.setAttribute('fill', 'var(--mid)'); cell.setAttribute('opacity', 1); }
            }));
          }, tok, true);
          await tween(300, (t) => lg.setAttribute('opacity', t), tok);
        };
      },
    },
    {
      label: 'Validate by retraining',
      title: 'Validate by retraining',
      body: 'Remove a random 1% of the window’s blocks, retrain the 100 steps from the same checkpoint, and measure the change in held-out loss. Do that 48 times. LDS is the rank correlation between predicted and measured change for each query: 1 is exact agreement, 0 is chance.',
      facts: [['Retrains per window', '48'], ['Removed each time', '1% of blocks'], ['Held-out queries', '8'], ['Shown: skill forming', 'median LDS 0.99']],
      build(el) {
        const W = 600, Hh = 360;
        const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Left: a grid of training blocks with a few removed in each of 48 retrains. Right: predicted versus measured loss change for the skill-forming window; the points fall on a line, median LDS 0.99.' });
        const cols = 14, rows = 14, cs = 13, gx = 20, gy = 60;
        const cells = [];
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const c = S('rect', { x: gx + q * (cs + 2), y: gy + r * (cs + 2), width: cs, height: cs, rx: 2.5, fill: 'var(--mid)' });
          svg.append(c); cells.push(c);
        }
        const counter = S('text', { x: gx, y: 36, 'font-size': 13, class: 't-ink' }, 'retrain 0 of 48');
        svg.append(counter, S('text', { x: gx, y: gy + rows * (cs + 2) + 18, 'font-size': 11, class: 't-muted' }, '1% of blocks removed per retrain'));
        // scatter
        const px = lin(-3.5, 3.5, 300, 580), py = lin(-3.5, 3.5, 300, 44);
        svg.append(S('line', { class: 'axis', x1: 300, x2: 580, y1: 300, y2: 300 }), S('line', { class: 'axis', x1: 300, x2: 300, y1: 44, y2: 300 }));
        svg.append(S('line', { x1: px(-3.4), y1: py(-3.4), x2: px(3.4), y2: py(3.4), stroke: 'var(--line)', 'stroke-width': 1 }));
        svg.append(S('text', { x: 580, y: 320, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, 'predicted change (summed scores)'));
        svg.append(S('text', { x: 300, y: 34, 'font-size': 11, class: 't-muted' }, 'measured change after retraining'));
        const P = D.scatter[2];
        const dots = P.map(([a, b]) => { const c = S('circle', { cx: px(a), cy: py(b), r: 2.4, fill: 'var(--mark)', opacity: 0 }); svg.append(c); return c; });
        const lds = S('text', { x: 574, y: 290, 'text-anchor': 'end', 'font-size': 20, 'font-weight': 600, class: 't-ink', opacity: 0 }, 'LDS 0.99');
        svg.append(lds);
        el.append(svg);
        const rand = rng(5);
        const subsets = Array.from({ length: 48 }, () => [Math.floor(rand() * cells.length), Math.floor(rand() * cells.length)]);
        return async (tok) => {
          let last = -1;
          await tween(3600, (t) => {
            const k = Math.min(48, Math.floor(t * 48) + (t > 0 ? 1 : 0));
            if (k === last) return; last = k;
            cells.forEach((c) => c.setAttribute('fill', 'var(--mid)'));
            if (k < 48 || t < 1) subsets[Math.max(0, k - 1)].forEach((i) => cells[i].setAttribute('fill', 'var(--bad)'));
            counter.textContent = `retrain ${k} of 48`;
            dots.forEach((d, i) => d.setAttribute('opacity', i < k * 8 ? 0.6 : 0));
          }, tok, true);
          await tween(300, (t) => lds.setAttribute('opacity', t), tok);
        };
      },
    },
  ];

  function pipeline() {
    const root = document.getElementById('fig-pipeline'); if (!root) return;
    const rail = root.querySelector('.rail'), vis = root.querySelector('.stage-visual');
    const playBtn = root.querySelector('[data-act="play"]');
    const ICON = {
      pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
      play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l11 7-11 7z"/></svg>',
    };
    let cur = 0, auto = !RM, tok = null, visible = false, started = false;
    // Each step is a checkpoint on a vertical rail; the open one carries its text.
    const items = SCENES.map((sc, i) => {
      const id = 'pipe-step-' + (i + 1);
      const fill = H('span', { class: 'fill' });
      const b = H('button', { type: 'button', 'aria-expanded': 'false', 'aria-controls': id },
        H('span', { class: 'node' }), H('span', { class: 'num', text: 'step ' + (i + 1) }), H('span', { class: 'lbl', text: sc.label }));
      const body = H('div', { class: 'step-body', id }, H('p', { text: sc.body }),
        H('ul', {}, sc.facts.map(([k, v]) => H('li', {}, H('span', { text: k }), H('b', { text: v })))));
      const li = H('li', {}, fill, b, body);
      b.addEventListener('click', () => { setAuto(false); show(i); });
      rail.append(li);
      return { li, b, fill };
    });
    function setAuto(v) {
      auto = v; playBtn.innerHTML = auto ? ICON.pause : ICON.play;
      playBtn.setAttribute('aria-label', auto ? 'Pause autoplay' : 'Start autoplay');
    }
    async function show(i) {
      if (tok) tok.cancelled = true;
      const my = (tok = { cancelled: false });
      cur = i;
      items.forEach(({ li, b, fill }, j) => {
        li.classList.toggle('on', j === i); li.classList.toggle('done', j < i);
        b.setAttribute('aria-expanded', j === i);
        fill.style.transform = `scaleY(${j < i ? 1 : 0})`;
      });
      vis.replaceChildren();
      const play = SCENES[i].build(vis);
      await play(my);
      if (my.cancelled || !auto) return;
      // The rail fills toward the next checkpoint while the step is on screen.
      await tween(4200, (t) => { items[i].fill.style.transform = `scaleY(${t})`; }, my, true);
      if (!my.cancelled && auto && visible) show((i + 1) % SCENES.length);
    }
    playBtn.addEventListener('click', () => { setAuto(!auto); if (auto) show(cur); });
    setAuto(auto);
    onVisible(root, () => { visible = true; if (!started || auto) { started = true; show(cur); } }, () => { visible = false; });
  }

  // ====================================================== full run vs window
  function spanFigure() {
    const root = document.getElementById('fig-span'); if (!root) return;
    const W = 960, Hh = 320, x0 = 150, x1 = 930, tw = x1 - x0;
    const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Top: full-run attribution sends the reverse pass back through all 30,518 training steps. Bottom: window attribution resumes from a checkpoint and differentiates only the next 100 steps, a 0.33 percent sliver of the run.' });
    root.querySelector('.fig-scroll').append(svg);
    const label = (y, a, b) => { svg.append(S('text', { x: 16, y, 'font-size': 14, 'font-weight': 600, class: 't-ink' }, a), S('text', { x: 16, y: y + 17, 'font-size': 12, class: 't-muted' }, b)); };
    // --- row A
    const yA = 64;
    label(yA + 2, 'Full run', '30,518 steps');
    svg.append(S('rect', { x: x0, y: yA - 7, width: tw, height: 14, rx: 7, fill: 'var(--line)' }));
    const aF = S('rect', { x: x0, y: yA - 7, width: 0, height: 14, rx: 7, fill: 'var(--ink-3)' });
    const aR = S('rect', { x: x1, y: yA - 7, width: 0, height: 14, rx: 7, fill: 'var(--bad)' });
    const aT = S('text', { x: x1, y: yA - 18, 'text-anchor': 'end', 'font-size': 12, class: 't-muted' }, '');
    const aV = S('g', { opacity: 0 }, cross(x0 + 6, yA + 46), S('text', { x: x0 + 20, y: yA + 51, 'font-size': 13, class: 't-ink' }, 'reverse pass crosses every update: 44.7% of scores come back non-finite'));
    svg.append(aF, aR, aT, aV);
    [[0, 'start'], [10000, '10k'], [20000, '20k'], [FULL_STEPS, 'end']].forEach(([s, l]) => {
      const x = x0 + (s / FULL_STEPS) * tw;
      svg.append(S('text', { x, y: yA + 22, 'text-anchor': s === 0 ? 'start' : s === FULL_STEPS ? 'end' : 'middle', 'font-size': 10.5, class: 't-muted' }, l));
    });
    // --- row B
    const yB = 190, ckx = x0 + 0.34 * tw, sl = Math.max(2.6, (100 / FULL_STEPS) * tw);
    label(yB + 2, 'One window', '100 steps');
    svg.append(S('rect', { x: x0, y: yB - 7, width: tw, height: 14, rx: 7, fill: 'var(--line)' }));
    const bF = S('rect', { x: x0, y: yB - 7, width: 0, height: 14, rx: 7, fill: 'var(--ink-3)' });
    const bS = S('rect', { x: ckx, y: yB - 11, width: sl, height: 22, fill: 'var(--ok)', opacity: 0 });
    const bC = S('g', { opacity: 0 }, S('path', { d: `M${ckx} ${yB - 30}l6 8-6 8-6-8z`, fill: 'var(--ink)' }), S('text', { x: ckx - 12, y: yB - 18, 'text-anchor': 'end', 'font-size': 11.5, class: 't-muted' }, 'saved checkpoint'));
    svg.append(bF, bS, bC);
    // zoom inset
    const zx0 = 520, zx1 = 900, zy = yB + 68;
    const zoom = S('g', { opacity: 0 });
    zoom.append(S('path', { d: `M${ckx} ${yB + 11}L${zx0} ${zy - 16}M${ckx + sl} ${yB + 11}L${zx1} ${zy - 16}`, stroke: 'var(--ink-3)', 'stroke-width': 1, fill: 'none' }));
    zoom.append(S('rect', { x: zx0, y: zy - 16, width: zx1 - zx0, height: 44, rx: 10, fill: 'var(--surface-2)', stroke: 'var(--line)' }));
    zoom.append(S('rect', { x: zx0 + 14, y: zy, width: zx1 - zx0 - 28, height: 12, rx: 6, fill: 'var(--line)' }));
    const zF = S('rect', { x: zx0 + 14, y: zy, width: 0, height: 12, rx: 6, fill: 'var(--ink-3)' });
    const zR = S('rect', { x: zx1 - 14, y: zy, width: 0, height: 12, rx: 6, fill: 'var(--ok)' });
    zoom.append(zF, zR, S('text', { x: zx0, y: zy + 46, 'font-size': 11.5, class: 't-muted' }, 'magnified ×' + Math.round((zx1 - zx0 - 28) / ((100 / FULL_STEPS) * tw)) + ': 100 steps on 25,600 unseen blocks'));
    const bV = S('g', { opacity: 0 }, check(x0 + 7, yB + 34), S('text', { x: x0 + 20, y: yB + 39, 'font-size': 13, class: 't-ink' }, 'reverse pass stops at the checkpoint'));
    svg.append(zoom, bV);

    let tok = null;
    async function play() {
      if (tok) tok.cancelled = true; const my = (tok = { cancelled: false });
      [aF, aR, bF, zF, zR].forEach((r) => r.setAttribute('width', 0));
      [aV, bS, bC, zoom, bV].forEach((g) => g.setAttribute('opacity', 0)); aT.textContent = '';
      await tween(450, (t) => aF.setAttribute('width', tw * t), my);
      await tween(900, (t) => {
        aR.setAttribute('x', x1 - tw * t); aR.setAttribute('width', tw * t);
        aT.textContent = fmt(FULL_STEPS * t) + ' steps unrolled';
      }, my, true);
      await tween(180, (t) => aV.setAttribute('opacity', t), my);
      await tween(320, (t) => bF.setAttribute('width', (ckx - x0) * t), my);
      await tween(180, (t) => { bC.setAttribute('opacity', t); bS.setAttribute('opacity', t); }, my);
      await tween(220, (t) => zoom.setAttribute('opacity', t), my);
      const zw = zx1 - zx0 - 28;
      await tween(280, (t) => zF.setAttribute('width', zw * t), my);
      await tween(380, (t) => { zR.setAttribute('x', zx1 - 14 - zw * t); zR.setAttribute('width', zw * t); }, my, true);
      await tween(180, (t) => bV.setAttribute('opacity', t), my);
    }
    let seen = false;
    onVisible(root, () => { if (!seen) { seen = true; play(); } });
    root.querySelector('[data-replay]').addEventListener('click', play);
  }

  // ====================================================== explode / clip / shorten
  function lab() {
    const root = document.getElementById('fig-lab'); if (!root) return;
    const W = 960, Hh = 400;
    const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Left: the running metagradient norm grows 0.4 to 0.5 percent per step and passes the largest finite score observed, 5.5 times ten to the thirtieth, about halfway through a 30,518-step reverse pass. For a 100-step window the chart zooms in: the norm grows by only about 1.5 to 1.6 times. Right: the resulting block scores and how well they predict retraining for a full run, a clipped full run, and a 100-step window.' });
    root.querySelector('.fig-scroll').append(svg);
    const cx0 = 76, cx1 = 560, cyT = 44, cyB = 336;
    const LN10 = Math.LN10, MAXF = Math.log10(5.5e30), CLIP = 11;

    // The view is what the axes currently span. zk = 0 is the whole run, zk = 1 is the
    // first 110 steps; in between it is interpolated geometrically, so the zoom is even.
    const FULL = { xs: FULL_STEPS, ys: 40 }, NEAR = { xs: 110, ys: Math.log10(1.8) };
    const view = { xs: FULL.xs, ys: FULL.ys };
    let zk = 0;
    const x = (st) => cx0 + (st / view.xs) * (cx1 - cx0);
    const y = (v) => cyB - (v / view.ys) * (cyB - cyT);
    const st = { clipped: false, ghost: false, cur: 0, rev: 0, act: 0 };   // what is drawn

    // ticks for both views; layout() places them and fades each set in or out
    const ticks = [];
    const yTick = (v, set, label) => {
      const line = S('line', { class: 'gridline', x1: cx0, x2: cx1 });
      const text = S('text', { x: cx0 - 8, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' });
      text.append(...label); svg.append(line, text); ticks.push({ axis: 'y', v, set, line, text });
    };
    const xTick = (v, set, label) => {
      const text = S('text', { y: cyB + 17, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, label);
      svg.append(text); ticks.push({ axis: 'x', v, set, text });
    };
    [0, 10, 20, 30, 40].forEach((v) => yTick(v, 'full', ['10', S('tspan', { dy: -5, 'font-size': 8 }, v)]));
    [1, 1.2, 1.4, 1.6, 1.8].forEach((m) => yTick(Math.log10(m), 'near', ['×' + m.toFixed(1)]));
    [0, 10000, 20000, 30000].forEach((v) => xTick(v, 'full', v ? v / 1000 + 'k' : '0'));
    [0, 25, 50, 75, 100].forEach((v) => xTick(v, 'near', String(v)));
    svg.append(S('text', { x: cx1, y: cyB + 36, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, 'optimizer steps unrolled by the reverse pass'));
    svg.append(S('text', { x: cx0 - 44, y: cyT - 16, 'font-size': 11, class: 't-muted' }, 'running metagradient norm, relative (log scale)'));

    // everything inside the axes is clipped to them, so it can slide out during the zoom
    const pid = 'clip' + ++uid, rid = 'clip' + ++uid;
    svg.append(S('clipPath', { id: pid }, S('rect', { x: cx0, y: cyT, width: cx1 - cx0, height: cyB - cyT + 1 })));
    const reveal = S('rect', { x: cx0, y: cyT - 2, width: 0, height: cyB - cyT + 4 });
    svg.append(S('clipPath', { id: rid }, reveal));
    const plot = S('g', { 'clip-path': `url(#${pid})` }); svg.append(plot);
    const zone = S('rect', { x: cx0, y: cyT, width: cx1 - cx0, fill: 'url(#hatch-nan)', opacity: 0.28 });
    const maxLine = S('line', { x1: cx0, x2: cx1, stroke: 'var(--bad)', 'stroke-width': 1.5 });
    const ghost = S('path', { fill: 'var(--bad)', 'fill-opacity': 0.07, stroke: 'var(--bad)', 'stroke-opacity': 0.35, 'stroke-width': 1.5, 'stroke-dasharray': '4 4', 'stroke-linejoin': 'round', opacity: 0 });
    const band = S('path', { fill: 'var(--bad)', 'fill-opacity': 0.2, stroke: 'var(--bad)', 'stroke-width': 2, 'stroke-linejoin': 'round' });
    const clipLine = S('line', { x1: cx0, x2: cx1, stroke: 'var(--ink-3)', 'stroke-width': 1, opacity: 0 });
    plot.append(zone, maxLine, ghost, S('g', { 'clip-path': `url(#${rid})` }, band), clipLine);
    const maxLabel = S('text', { x: cx0 + 8, 'font-size': 11.5, class: 't-ink' }, 'largest finite score observed: 5.5 × 10³⁰');
    const farLabel = S('text', { x: cx0 + 10, y: cyT + 18, 'font-size': 11.5, class: 't-muted', opacity: 0 }, '↑ the largest finite score, 5.5 × 10³⁰, is far above this view');
    const clipLabel = S('text', { x: cx1 - 6, 'text-anchor': 'end', 'font-size': 11.5, class: 't-muted', opacity: 0 }, 'clip threshold (no scale)');
    const bandLabel = S('text', { 'font-size': 11.5, class: 't-muted' }, 'growth at 0.4–0.5% per step');
    const nearLabel = S('text', { 'font-size': 11.5, class: 't-muted', opacity: 0 }, 'growth at 0.4–0.5% per step');
    // where the window's pass ends: a bracket across the band at step 100
    const endMark = S('g', { opacity: 0 });
    const endLine = S('path', { fill: 'none', stroke: 'var(--ok)', 'stroke-width': 2, 'stroke-linecap': 'round' });
    const endT1 = S('text', { 'font-size': 14, 'font-weight': 600, class: 't-ink' }, '≈ ×1.5–1.6');
    const endT2 = S('text', { 'font-size': 11.5, class: 't-muted' }, 'after 100 steps');
    endMark.append(endLine, endT1, endT2);
    const cursor = S('line', { y1: cyT, y2: cyB, stroke: 'var(--ink)', 'stroke-width': 1.5 });
    const cursorT = S('text', { y: cyT - 2, 'font-size': 11.5, 'text-anchor': 'middle', class: 't-ink t-mono' }, '');
    svg.append(maxLabel, farLabel, clipLabel, bandLabel, nearLabel, endMark, cursor, cursorT);

    function bandPath() {
      const up = [], lo = [], top = st.clipped ? CLIP : 1e9, n = 90;
      const sMax = Math.min(FULL_STEPS, view.xs);
      for (let i = 0; i <= n; i++) {
        const sv = (sMax * i) / n;
        up.push([x(sv), y(Math.min(top, (0.005 * sv) / LN10))]);
        lo.push([x(sv), y(Math.min(top, (0.004 * sv) / LN10))]);
      }
      return 'M' + up.concat(lo.reverse()).map((p) => p[0].toFixed(1) + ' ' + Math.max(-400, p[1]).toFixed(1)).join('L') + 'Z';
    }
    const inY = (py) => py >= cyT - 0.5 && py <= cyB + 0.5, inX = (px) => px >= cx0 - 0.5 && px <= cx1 + 0.5;
    function layout() {
      view.xs = FULL.xs * Math.pow(NEAR.xs / FULL.xs, zk);
      view.ys = FULL.ys * Math.pow(NEAR.ys / FULL.ys, zk);
      const oFull = clamp(1 - 2.2 * zk, 0, 1), oNear = clamp(2.2 * zk - 1.2, 0, 1);
      ticks.forEach((tk) => {
        const o = tk.set === 'full' ? oFull : oNear;
        if (tk.axis === 'y') {
          const py = y(tk.v), on = inY(py) ? o : 0;
          tk.line.setAttribute('y1', py); tk.line.setAttribute('y2', py); tk.line.setAttribute('opacity', on * 0.7);
          tk.text.setAttribute('y', py + 4); tk.text.setAttribute('opacity', on);
        } else {
          const px = x(tk.v); tk.text.setAttribute('x', px); tk.text.setAttribute('opacity', inX(px) ? o : 0);
        }
      });
      const ym = y(MAXF);
      zone.setAttribute('height', Math.max(0, ym - cyT)); maxLine.setAttribute('y1', ym); maxLine.setAttribute('y2', ym);
      maxLabel.setAttribute('y', ym - 7); maxLabel.setAttribute('opacity', ym - 20 > cyT ? oFull : 0);
      farLabel.setAttribute('opacity', oNear);
      const d = bandPath(); band.setAttribute('d', d); ghost.setAttribute('d', d);
      ghost.setAttribute('opacity', st.ghost ? 1 : 0);
      const yc = y(CLIP), cOn = st.clipped ? oFull : 0;
      clipLine.setAttribute('y1', yc); clipLine.setAttribute('y2', yc); clipLine.setAttribute('opacity', cOn);
      clipLabel.setAttribute('y', yc - 7); clipLabel.setAttribute('opacity', cOn);
      bandLabel.setAttribute('x', x(9500)); bandLabel.setAttribute('y', y(8)); bandLabel.setAttribute('opacity', st.act === 2 ? 0 : oFull);
      nearLabel.setAttribute('x', x(46)); nearLabel.setAttribute('y', y(Math.log10(1.09))); nearLabel.setAttribute('opacity', oNear);
      const ex = x(100), e0 = y(0.4 / LN10), e1 = y(0.5 / LN10);
      endLine.setAttribute('d', `M${ex - 6} ${e1}H${ex}V${e0}H${ex - 6}`);
      endT1.setAttribute('x', ex + 9); endT1.setAttribute('y', (e0 + e1) / 2 + 1);
      endT2.setAttribute('x', ex + 9); endT2.setAttribute('y', (e0 + e1) / 2 + 17);
      const xc = x(st.cur), xr = x(st.rev);
      reveal.setAttribute('width', Math.max(0, xr - cx0 + 1));
      cursor.setAttribute('x1', xc); cursor.setAttribute('x2', xc);
      cursorT.setAttribute('x', clamp(xc, cx0 + 40, cx1 - 40));
    }

    // right panel: block grid + verdict
    const gx = 620, gy = 66, cols = 16, rows = 9, cs = 17, gap = 3;
    svg.append(S('text', { x: gx, y: gy - 22, 'font-size': 13, 'font-weight': 600, class: 't-ink' }, 'Block scores'));
    const gridNote = S('text', { x: gx + cols * (cs + gap) - gap, y: gy - 22, 'text-anchor': 'end', 'font-size': 11.5, class: 't-muted' }, '');
    svg.append(gridNote);
    const rand = rng(42);
    const cells = [];
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const c = S('rect', { x: gx + q * (cs + gap), y: gy + r * (cs + gap), width: cs, height: cs, rx: 3, fill: 'var(--mid)' });
      svg.append(c); cells.push({ c, v: rand() * 2 - 1, order: rand() });
    }
    const vy = gy + rows * (cs + gap) + 24;
    const vBox = S('rect', { x: gx, y: vy, width: cols * (cs + gap) - gap, height: 96, rx: 12, fill: 'var(--surface-2)', stroke: 'var(--line)', 'stroke-width': 1.5 });
    const vNum = S('text', { x: gx + 18, y: vy + 42, 'font-size': 32, 'font-weight': 600, class: 't-ink' }, '');
    const vLab = S('text', { x: gx + 18, y: vy + 62, 'font-size': 12, class: 't-muted' }, '');
    const vIcon = S('g'); const vMsg = S('text', { x: gx + 38, y: vy + 83, 'font-size': 12.5, 'font-weight': 600, class: 't-ink' }, '');
    svg.append(vBox, vNum, vLab, vIcon, vMsg);

    function paint(intensity, nanFrac) {
      cells.forEach(({ c, v, order }) => {
        if (order < nanFrac) { c.setAttribute('fill', 'url(#hatch-nan)'); c.setAttribute('opacity', 1); return; }
        c.setAttribute('fill', intensity <= 0 ? 'var(--mid)' : v < 0 ? 'var(--neg)' : 'var(--pos)');
        c.setAttribute('opacity', intensity <= 0 ? 1 : 0.2 + 0.8 * Math.min(1, Math.abs(v) * intensity * 1.2));
      });
    }
    function verdict(num, labText, ok, msg) {
      vNum.textContent = num; vLab.textContent = labText; vMsg.textContent = msg;
      vIcon.replaceChildren(ok ? check(gx + 24, vy + 80, 6) : cross(gx + 24, vy + 79, 5));
      vBox.setAttribute('stroke', ok ? 'var(--ok)' : 'var(--bad)');
    }

    const btns = [...root.querySelectorAll('.seg button')];
    let tok = null, auto = !RM;
    const cross30 = (Math.log(5.5e30) / 0.005); // step where the fast edge of the band passes 5.5e30
    async function run(act) {
      if (tok) tok.cancelled = true; const my = (tok = { cancelled: false });
      btns.forEach((b, i) => b.setAttribute('aria-pressed', i === act));
      endMark.setAttribute('opacity', 0);
      paint(0, 0); verdict('', '', act === 2, ''); vIcon.replaceChildren(); vBox.setAttribute('stroke', 'var(--line)');
      gridNote.textContent = '';
      // leave the close-up before showing a full-run act
      if (zk > 0 && act !== 2) { const z0 = zk; await tween(260, (t) => { zk = z0 * (1 - t); layout(); }, my); if (my.cancelled) return; }
      st.act = act; st.clipped = act === 1; st.ghost = false; st.cur = 0; st.rev = 0; cursorT.textContent = '';
      if (act !== 2) zk = 0;
      layout();

      if (act < 2) {
        await tween(1700, (t) => {
          const sv = FULL_STEPS * t;
          st.cur = st.rev = sv; layout(); cursorT.textContent = fmt(sv) + ' steps';
          if (act === 0) {
            const f = clamp((sv - cross30) / (FULL_STEPS - cross30), 0, 1) * 0.447;
            paint(0.25 + 2 * t, f);
            gridNote.textContent = f > 0 ? (f * 100).toFixed(1) + '% non-finite' : '';
          } else paint(0.25 + 0.9 * t, 0);
        }, my, true);
        if (my.cancelled) return;
        if (act === 0) verdict('44.7%', 'of block scores are non-finite', false, 'No usable ranking to validate');
        else { gridNote.textContent = '0% non-finite'; verdict('0.22 · 0.17', 'LDS on two seeds (0 is chance)', false, 'Finite, but does not predict retraining'); }
      } else {
        // The pass stops at step 100. On the full axis that is invisible, so zoom in on it:
        // the dashed band is where a longer pass would keep going.
        st.ghost = true; st.cur = 100; st.rev = 0; cursorT.textContent = '100 steps'; layout();
        const z0 = zk;
        await tween(RM ? 0 : 950 * (1 - z0), (t) => { zk = z0 + (1 - z0) * t; layout(); }, my);
        if (my.cancelled) return;
        zk = 1; layout();
        await tween(650, (t) => { st.rev = 100 * t; layout(); paint(0.2 + 0.5 * t, 0); }, my, true);
        if (my.cancelled) return;
        endMark.setAttribute('opacity', 1);
        gridNote.textContent = '0% non-finite'; verdict('0.94', 'LDS, 100-step window at 86M', true, 'Predicts retraining');
      }
      if (!auto) return;
      await sleep(1900);
      if (!my.cancelled && auto && act < 2) run(act + 1);
    }
    btns.forEach((b, i) => b.addEventListener('click', () => { auto = false; run(i); }));
    layout();
    let seen = false;
    onVisible(root, () => { if (!seen) { seen = true; run(0); } });
  }

  // ====================================================== LDS vs horizon bars
  function horizonBars() {
    const root = document.getElementById('fig-horizon-bars'); if (!root) return;
    const W = 960, Hh = 310, m = { l: 60, r: 24, t: 30, b: 62 };
    const rows = [
      { a: 'Full run, clipped', b: '30,518 steps · seed 0', v: 0.217 },
      { a: 'Full run, clipped', b: '30,518 steps · seed 1', v: 0.168 },
      { a: 'Window', b: '400 steps', v: -0.08 },
      { a: 'Window', b: '200 steps', v: 0.28 },
      { a: 'Window', b: '100 steps', v: 0.94 },
    ];
    const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Mean per-query LDS: clipped full run 0.22 and 0.17, 400-step window minus 0.08, 200-step window 0.28, 100-step window 0.94.' });
    root.querySelector('.fig-scroll').append(svg);
    const y = lin(-0.2, 1, Hh - m.b, m.t);
    [0, 0.5, 1].forEach((v) => {
      svg.append(S('line', { class: v === 0 ? 'axis' : 'gridline', x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }));
      svg.append(S('text', { x: m.l - 10, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, v.toFixed(1)));
    });
    svg.append(S('text', { x: W - m.r, y: y(1) - 7, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, 'exact rank agreement'));
    svg.append(S('text', { x: W - m.r, y: y(0) - 7, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, 'chance'));
    const bw = 24, slot = (W - m.l - m.r - 150) / rows.length;
    const bars = rows.map((r, i) => {
      const cx = m.l + slot * (i + 0.5);
      const ok = r.v >= 0.8;
      const p = S('path', { fill: ok ? 'var(--ok)' : 'var(--bad)' });
      const val = S('text', { x: cx, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, class: 't-ink', opacity: 0 }, r.v.toFixed(2).replace('-', '−'));
      svg.append(p, val);
      svg.append(S('text', { x: cx, y: Hh - m.b + 22, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 600, class: 't-ink' }, r.a));
      svg.append(S('text', { x: cx, y: Hh - m.b + 39, 'text-anchor': 'middle', 'font-size': 11.5, class: 't-muted' }, r.b));
      const hit = tip(S('rect', { x: cx - slot / 2, y: m.t, width: slot, height: Hh - m.b - m.t, fill: 'transparent' }), `<b>${r.a}</b>, ${r.b}<br>Mean per-query LDS ${r.v.toFixed(3).replace('-', '−')}`);
      svg.append(hit);
      return { p, val, cx, v: r.v, ok };
    });
    svg.append(S('line', { x1: m.l + slot * 2, x2: m.l + slot * 2, y1: m.t - 6, y2: Hh - m.b + 44, stroke: 'var(--line)', 'stroke-width': 1 }));
    let seen = false;
    onVisible(root, async () => {
      if (seen) return; seen = true;
      bars.forEach(async (b, i) => {
        await sleep(i * 80);
        tween(380, (t) => {
          const yy = y(b.v * t);
          b.p.setAttribute('d', vbar(b.cx - bw / 2, bw, y(0), yy));
          b.val.setAttribute('y', b.v >= 0 ? yy - 8 : yy + 18); b.val.setAttribute('opacity', t);
        });
      });
    });
  }

  // ====================================================== window explorer
  function explorer() {
    const root = document.getElementById('fig-explorer'); if (!root) return;
    const seg = root.querySelector('.seg');
    // curve
    const c = acqChart(960, 250, { top: 40 });
    root.querySelector('[data-part="curve"]').append(c.svg);
    const marks = WIN.map((w, i) => {
      const g = S('g');
      const x0 = c.x(w.step), x1 = c.x(w.step + 100);
      const bandR = S('rect', { x: x0, y: c.m.t, width: Math.max(3, x1 - x0), height: c.H - c.m.b - c.m.t, fill: 'var(--accent)', opacity: 0.18 });
      const line = S('line', { x1: x0, x2: x0, y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--ink-3)', 'stroke-width': 1.5 });
      const dot = S('circle', { cx: x0, cy: c.y(w.acc), r: 5.5, fill: 'var(--ink-3)', stroke: 'var(--surface)', 'stroke-width': 2 });
      const badge = S('circle', { cx: x0, cy: c.m.t - 13, r: 10, fill: 'var(--ink-3)' });
      const num = S('text', { x: x0, y: c.m.t - 9, 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 600, style: 'fill:var(--surface)' }, i + 1);
      g.append(bandR, line, dot, badge, num);
      c.over.append(g);
      return { bandR, line, dot, badge };
    });
    const info = S('text', { x: c.W - c.m.r, y: 130, 'text-anchor': 'end', 'font-size': 13, 'font-weight': 600, class: 't-ink' }, '');
    const info2 = S('text', { x: c.W - c.m.r, y: 150, 'text-anchor': 'end', 'font-size': 12, class: 't-muted' }, '');
    c.svg.append(info, info2);

    // A point the reader can drag along the curve. Its step and accuracy are read off the
    // real curve; the panels below follow the nearest of the four windows that were measured.
    const S0 = 302, S1 = 91552, L0 = Math.log10(S0), L1 = Math.log10(S1);
    const guide = S('line', { y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--accent-ink)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4' });
    const knob = S('circle', { r: 8, fill: 'var(--accent)', stroke: 'var(--ink)', 'stroke-width': 2.5 });
    const hint = S('text', { 'font-size': 11.5, 'text-anchor': 'middle', class: 't-ink' }, '◂ drag ▸');
    const pad = S('rect', { x: c.m.l, y: 0, width: c.W - c.m.r - c.m.l, height: c.H - c.m.b + 6, fill: 'transparent', style: 'cursor:ew-resize' });
    const grip = S('circle', { r: 22, fill: 'transparent', tabindex: 0, role: 'slider', 'aria-label': 'Position on the training trajectory', 'aria-valuemin': S0, 'aria-valuemax': S1, style: 'cursor:grab;touch-action:none' });
    c.svg.append(guide, knob, hint, pad, grip);
    let hs = WIN[0].step, dragging = false;
    const nearest = (step) => { let best = 0, bd = 1e9; WIN.forEach((w, i) => { const d = Math.abs(Math.log(step) - Math.log(w.step + 50)); if (d < bd) { bd = d; best = i; } }); return best; };
    const stepAt = (clientX) => {
      const r = c.svg.getBoundingClientRect();
      const sx = (clientX - r.left) * (c.W / r.width);
      const f = clamp((sx - c.m.l) / (c.W - c.m.r - c.m.l), 0, 1);
      return Math.pow(10, Math.log10(300) + f * (Math.log10(92000) - Math.log10(300)));
    };
    function placeHandle(step) {
      hs = clamp(step, S0, S1);
      const hx = c.x(hs), acc = Math.round(c.at(hs)), hy = c.y(c.at(hs));
      guide.setAttribute('x1', hx); guide.setAttribute('x2', hx);
      [knob, grip].forEach((e) => { e.setAttribute('cx', hx); e.setAttribute('cy', hy); });
      hint.setAttribute('x', clamp(hx, c.m.l + 30, c.W - c.m.r - 30)); hint.setAttribute('y', hy < c.m.t + 34 ? hy + 28 : hy - 16);
      const i = nearest(hs), w = WIN[i], inside = hs >= w.step && hs <= w.step + 100;
      info.textContent = `step ${fmt(hs)} · ${acc} / 200 held-out solved`;
      info2.textContent = `${inside ? 'inside' : 'nearest measured'} window: ${i + 1} · ${w.name}, steps ${fmt(w.step)}–${fmt(w.step + 100)}`;
      grip.setAttribute('aria-valuenow', Math.round(hs));
      grip.setAttribute('aria-valuetext', `step ${fmt(hs)}, ${acc} of 200 solved, ${inside ? 'inside' : 'nearest'} window ${i + 1}, ${w.name}`);
      return i;
    }
    // user moves: follow the pointer, and switch panels when another window becomes nearest
    function userMove(step) {
      auto = false; hint.setAttribute('opacity', 0);
      const i = placeHandle(step);
      if (i !== sel) select(i, true);
    }
    const startDrag = (e) => {
      dragging = true; grip.style.cursor = 'grabbing';
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
      userMove(stepAt(e.clientX)); e.preventDefault();
    };
    const moveDrag = (e) => { if (dragging) userMove(stepAt(e.clientX)); };
    const endDrag = () => { dragging = false; grip.style.cursor = 'grab'; };
    grip.addEventListener('pointerdown', startDrag);
    // with a mouse the whole plot is draggable; on touch only the point is, so the page still scrolls
    pad.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') startDrag(e); });
    pad.addEventListener('click', (e) => { if (!dragging) userMove(stepAt(e.clientX)); });
    [grip, pad].forEach((el) => { el.addEventListener('pointermove', moveDrag); el.addEventListener('pointerup', endDrag); el.addEventListener('pointercancel', endDrag); });
    grip.addEventListener('keydown', (e) => {
      const lg = Math.log10(hs), d = (L1 - L0) / 60;
      const to = { ArrowLeft: lg - d, ArrowDown: lg - d, ArrowRight: lg + d, ArrowUp: lg + d, Home: L0, End: L1 }[e.key];
      if (to == null) return;
      e.preventDefault(); userMove(Math.pow(10, clamp(to, L0, L1)));
    });

    // scatter
    const SW = 440, SH = 300;
    const sv = S('svg', { viewBox: `0 0 ${SW} ${SH}`, role: 'img', 'aria-label': 'Predicted versus measured loss change for the selected window.' });
    root.querySelector('[data-part="scatter"]').append(sv);
    const R = 5.3, px = lin(-R, R, 44, SW - 12), py = lin(-R, R, SH - 34, 12);
    [-4, -2, 0, 2, 4].forEach((v) => {
      sv.append(S('line', { class: 'gridline', x1: px(v), x2: px(v), y1: py(-R), y2: py(R) }), S('line', { class: 'gridline', x1: px(-R), x2: px(R), y1: py(v), y2: py(v) }));
      sv.append(S('text', { x: px(v), y: SH - 18, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, String(v).replace('-', '−')), S('text', { x: 36, y: py(v) + 4, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, String(v).replace('-', '−')));
    });
    sv.append(S('text', { x: SW - 12, y: SH - 3, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, 'predicted (summed scores, standardized)'));
    sv.append(S('text', { x: 44, y: SH - 3, 'font-size': 11, class: 't-muted' }, '↑ measured'));
    const dots = Array.from({ length: 384 }, () => { const d = S('circle', { r: 2.3, fill: 'var(--mark)', opacity: 0.5 }); sv.append(d); return d; });
    const ldsT = S('text', { x: 56, y: 34, 'font-size': 24, 'font-weight': 600, class: 't-ink' }, '');
    const ldsL = S('text', { x: 56, y: 52, 'font-size': 11.5, class: 't-muted' }, '');
    sv.append(ldsT, ldsL);

    // lift bars
    const LW = 440, LH = 300, lm = { l: 34, r: 8, t: 16, b: 42 };
    const lv = S('svg', { viewBox: `0 0 ${LW} ${LH}`, role: 'img', 'aria-label': 'Helpful-tail and harmful-tail lift per data family for the selected window.' });
    root.querySelector('[data-part="lift"]').append(lv);
    const ly = lin(0, 3, LH - lm.b, lm.t);
    [0, 1, 2, 3].forEach((v) => {
      lv.append(S('line', { class: v === 0 ? 'axis' : 'gridline', x1: lm.l, x2: LW - lm.r, y1: ly(v), y2: ly(v) }));
      lv.append(S('text', { x: lm.l - 8, y: ly(v) + 4, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, v + '×'));
    });
    lv.append(S('line', { x1: lm.l, x2: LW - lm.r, y1: ly(1), y2: ly(1), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    const slot = (LW - lm.l - lm.r) / FAM.length, bw = 22;
    const lbars = FAM.map((f, i) => {
      const cx = lm.l + slot * (i + 0.5);
      const h = S('path', { fill: fc(f.key) });
      const r = S('path', { fill: `url(#hatch-${f.key})`, stroke: fc(f.key), 'stroke-width': 1 });
      const t = S('text', { x: cx - bw / 2 - 1, 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 600, class: 't-ink' }, '');
      const hitH = S('rect', { x: cx - bw - 1, y: lm.t, width: bw, height: LH - lm.b - lm.t, fill: 'transparent' });
      const hitR = S('rect', { x: cx + 1, y: lm.t, width: bw, height: LH - lm.b - lm.t, fill: 'transparent' });
      lv.append(h, r, t, hitH, hitR);
      const [n1, n2] = f.name.split(' ');
      lv.append(S('text', { x: cx, y: LH - lm.b + 16, 'text-anchor': 'middle', 'font-size': 11.5, class: 't-ink' }, n1), S('text', { x: cx, y: LH - lm.b + 30, 'text-anchor': 'middle', 'font-size': 11.5, class: 't-ink' }, n2));
      return { h, r, t, cx, hitH, hitR, cur: [0, 0], name: f.name };
    });
    lbars.forEach((b, i) => {
      const mk = (el, which) => {
        el.addEventListener('pointermove', (e) => {
          const w = WIN[sel]; const v = (which ? w.harm : w.help)[i];
          tipEl.innerHTML = `<b>${b.name}</b><br>${which ? 'Most harmful' : 'Most helpful'} 5%: ${v.toFixed(2)}× corpus share`;
          tipEl.classList.add('on');
          tipEl.style.left = clamp(e.clientX + 14, 8, innerWidth - tipEl.offsetWidth - 8) + 'px'; tipEl.style.top = e.clientY + 16 + 'px';
        });
        el.addEventListener('pointerleave', () => tipEl.classList.remove('on'));
      };
      mk(b.hitH, 0); mk(b.hitR, 1);
    });

    let sel = 0, tok = null, auto = !RM, visible = false;
    const btns = WIN.map((w, i) => {
      const b = H('button', { 'aria-pressed': 'false', text: `${i + 1} · ${w.name}` });
      b.addEventListener('click', () => { auto = false; hint.setAttribute('opacity', 0); select(i); });
      seg.append(b); return b;
    });
    async function select(i, fromDrag) {
      if (tok) tok.cancelled = true; const my = (tok = { cancelled: false });
      sel = i; const w = WIN[i];
      const lgFrom = Math.log10(hs), lgTo = Math.log10(w.step);
      btns.forEach((b, j) => b.setAttribute('aria-pressed', j === i));
      marks.forEach((mk, j) => {
        const on = j === i;
        mk.dot.setAttribute('fill', on ? 'var(--accent-ink)' : 'var(--ink-3)'); mk.badge.setAttribute('fill', on ? 'var(--accent-ink)' : 'var(--ink-3)');
        mk.line.setAttribute('stroke', on ? 'var(--accent-ink)' : 'var(--ink-3)'); mk.bandR.setAttribute('opacity', on ? 0.42 : 0.12);
        mk.dot.setAttribute('r', on ? 7 : 5.5);
      });
      ldsT.textContent = w.lds.toFixed(2); ldsL.textContent = `median per-query LDS (range ${w.range})`;
      const P = D.scatter[i];
      const from = dots.map((d) => [parseFloat(d.getAttribute('cx')) || px(0), parseFloat(d.getAttribute('cy')) || py(0)]);
      const fromB = lbars.map((b) => b.cur.slice());
      await tween(fromDrag ? 380 : 600, (t) => {
        if (!fromDrag) placeHandle(Math.pow(10, lgFrom + (lgTo - lgFrom) * t));
        dots.forEach((d, k) => { d.setAttribute('cx', from[k][0] + (px(P[k][0]) - from[k][0]) * t); d.setAttribute('cy', from[k][1] + (py(P[k][1]) - from[k][1]) * t); });
        lbars.forEach((b, k) => {
          const a = fromB[k][0] + (w.help[k] - fromB[k][0]) * t, c2 = fromB[k][1] + (w.harm[k] - fromB[k][1]) * t;
          b.cur = [a, c2];
          b.h.setAttribute('d', vbar(b.cx - bw - 1, bw, ly(0), ly(a)));
          b.r.setAttribute('d', vbar(b.cx + 1, bw, ly(0), ly(c2)));
          b.t.setAttribute('y', ly(a) - 6); b.t.textContent = a.toFixed(2);
        });
      }, my);
      if (my.cancelled || !auto) return;
      await sleep(3200);
      if (!my.cancelled && auto && visible) select((i + 1) % WIN.length);
    }
    placeHandle(hs);
    let started = false;
    onVisible(root, () => { visible = true; if (!started || auto) { started = true; select(sel); } }, () => { visible = false; });
  }

  // ====================================================== MAGIC vs gradient-dot
  function baseline() {
    const root = document.getElementById('fig-baseline'); if (!root) return;
    // MAGIC bar values are read off the paper's Figure 9; gradient-dot values are quoted in Appendix text.
    const rows = [
      ['86M · skill appearing', 0.57, 0.08], ['86M · skill appearing · batch 512', 0.97, -0.08],
      ['86M · skill appearing · damping 10⁻⁶', 0.96, 0.10], ['86M · skill appearing · rerun', 0.83, -0.04],
      ['152M web→math · 50% math', 0.99, 0.21], ['152M web→math · early branch', 0.99, 0.13],
    ];
    const W = 960, rh = 34, m = { l: 290, r: 60, t: 14, b: 34 }, Hh = m.t + rows.length * rh + m.b;
    const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'On six windows MAGIC reaches LDS 0.57 to 0.99 while gradient-dot stays between minus 0.08 and 0.21.' });
    root.querySelector('.fig-scroll').append(svg);
    const x = lin(-0.2, 1, m.l, W - m.r);
    [0, 0.5, 1].forEach((v) => {
      svg.append(S('line', { class: v === 0 ? 'axis' : 'gridline', x1: x(v), x2: x(v), y1: m.t, y2: Hh - m.b }));
      svg.append(S('text', { x: x(v), y: Hh - m.b + 16, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, v.toFixed(1)));
    });
    svg.append(S('text', { x: W - m.r, y: Hh - 3, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, 'mean per-query LDS'));
    const items = rows.map(([name, a, b], i) => {
      const cy = m.t + rh * (i + 0.5);
      svg.append(S('text', { x: m.l - 16, y: cy + 4, 'text-anchor': 'end', 'font-size': 12.5, class: 't-ink' }, name));
      const link = S('line', { x1: x(b), x2: x(b), y1: cy, y2: cy, stroke: 'var(--line)', 'stroke-width': 3, 'stroke-linecap': 'round' });
      const g = S('circle', { cx: x(b), cy, r: 6, fill: 'var(--ink-3)', stroke: 'var(--surface)', 'stroke-width': 2 });
      const mg = S('circle', { cx: x(b), cy, r: 6.5, fill: 'var(--mark)', stroke: 'var(--surface)', 'stroke-width': 2 });
      const v = S('text', { x: x(a) + 12, y: cy + 4, 'font-size': 12, 'font-weight': 600, class: 't-ink', opacity: 0 }, a.toFixed(2));
      svg.append(link, g, mg, v);
      svg.append(tip(S('rect', { x: m.l, y: cy - rh / 2, width: W - m.l, height: rh, fill: 'transparent' }), `<b>${name}</b><br>MAGIC ${a.toFixed(2)}<br>Gradient-dot ${b.toFixed(2).replace('-', '−')}`));
      return { link, mg, v, a, b };
    });
    let seen = false;
    onVisible(root, () => {
      if (seen) return; seen = true;
      tween(1100, (t) => items.forEach((it) => {
        const xx = x(it.b + (it.a - it.b) * t);
        it.mg.setAttribute('cx', xx); it.link.setAttribute('x2', xx); it.v.setAttribute('opacity', t);
      }));
    });
  }

  // ====================================================== blocks vs families
  function transfer() {
    const root = document.getElementById('fig-transfer'); if (!root) return;
    // --- strip: six pairwise block-rank correlations (Table 12)
    const pairs = [['Base vs. large batch', 0.091], ['Base vs. damped', 0.020], ['Large batch vs. damped', -0.010], ['Base vs. Muon', 0.005], ['Large batch vs. Muon', 0.012], ['Muon vs. damped', 0.040]];
    const W = 440, Hh = 250, m = { l: 24, r: 24 };
    const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'All six pairwise rank correlations between block scores lie between minus 0.01 and plus 0.09, far from 1.' });
    root.querySelector('[data-part="strip"]').append(svg);
    const x = lin(-1, 1, m.l, W - m.r), ay = 170;
    svg.append(S('line', { class: 'axis', x1: x(-1), x2: x(1), y1: ay, y2: ay }));
    [-1, -0.5, 0, 0.5, 1].forEach((v) => {
      svg.append(S('line', { class: 'axis', x1: x(v), x2: x(v), y1: ay, y2: ay + 5 }));
      svg.append(S('text', { x: x(v), y: ay + 20, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, (v > 0 ? '+' : '') + String(v).replace('-', '−')));
    });
    svg.append(S('text', { x: x(0), y: ay + 42, 'text-anchor': 'middle', 'font-size': 11.5, class: 't-muted' }, 'Spearman rank correlation of block scores'));
    svg.append(S('circle', { cx: x(1), cy: ay - 14, r: 6, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    svg.append(S('text', { x: x(1) + 8, y: ay - 30, 'text-anchor': 'end', 'font-size': 11.5, class: 't-muted' }, 'same ranking'));
    svg.append(S('text', { x: x(-1), y: ay - 30, 'font-size': 11.5, class: 't-muted' }, 'reversed'));
    const sorted = pairs.slice().sort((a, b) => a[1] - b[1]);
    const dots = sorted.map(([n, v], i) => {
      const cy = ay - 14 - i * 15;
      const d = tip(S('circle', { cx: x(v), cy: 20, r: 6, fill: 'var(--mark)', stroke: 'var(--surface)', 'stroke-width': 2, opacity: 0 }), `<b>${n}</b><br>ρ = ${(v > 0 ? '+' : '') + v.toFixed(3).replace('-', '−')}`);
      svg.append(d); return { d, cy };
    });
    const note = S('text', { x: x(0.14), y: ay - 60, 'font-size': 12.5, 'font-weight': 600, class: 't-ink', opacity: 0 }, 'all six pairs: −0.01 to +0.09');
    svg.append(note);

    // --- dumbbell: helpful-tail lift, 86M reference window vs 152M skill appearing (Tables 9 and 10)
    const fam = [['worked', 'Worked examples', 2.41, 2.64], ['primitive', 'Primitive facts', 2.01, 2.14], ['code', 'Code traces', 1.46, 1.39], ['verbal', 'Verbal procedures', 0.93, 1.21], ['web', 'Web text', 0.30, 0.16]];
    const m2 = { l: 128, r: 16, t: 34 }, rh = 34;
    const sv = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Helpful-tail lift per family at 86M and 152M. Worked examples and primitive facts are above 2, code traces about 1.4, verbal procedures about 1, web text under 0.3, in the same order at both sizes.' });
    root.querySelector('[data-part="dumbbell"]').append(sv);
    const x2 = lin(0, 3, m2.l, W - m2.r);
    [0, 1, 2, 3].forEach((v) => {
      sv.append(S('line', { class: 'gridline', x1: x2(v), x2: x2(v), y1: m2.t - 8, y2: m2.t + rh * 5 }));
      sv.append(S('text', { x: x2(v), y: m2.t + rh * 5 + 16, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, v + '×'));
    });
    sv.append(S('line', { x1: x2(1), x2: x2(1), y1: m2.t - 8, y2: m2.t + rh * 5, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    sv.append(S('text', { x: x2(1), y: m2.t - 14, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, 'chance'));
    sv.append(S('circle', { cx: m2.l + 150, cy: Hh - 12, r: 5, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2 }), S('text', { x: m2.l + 160, y: Hh - 8, 'font-size': 11.5 }, '86M'));
    sv.append(S('circle', { cx: m2.l + 210, cy: Hh - 12, r: 5.5, fill: 'var(--ink-2)' }), S('text', { x: m2.l + 220, y: Hh - 8, 'font-size': 11.5 }, '152M'));
    const rowsEl = fam.map(([k, n, a, b], i) => {
      const cy = m2.t + rh * (i + 0.5);
      sv.append(S('rect', { x: 4, y: cy - 6, width: 10, height: 10, rx: 3, fill: fc(k) }));
      sv.append(S('text', { x: 20, y: cy + 4, 'font-size': 12, class: 't-ink' }, n));
      const link = S('line', { x1: x2(a), x2: x2(a), y1: cy, y2: cy, stroke: fc(k), 'stroke-width': 3, opacity: 0.45, 'stroke-linecap': 'round' });
      const o = S('circle', { cx: x2(a), cy, r: 5.5, fill: 'var(--surface)', stroke: fc(k), 'stroke-width': 2.5, opacity: 0 });
      const f = S('circle', { cx: x2(a), cy, r: 6, fill: fc(k), stroke: 'var(--surface)', 'stroke-width': 2, opacity: 0 });
      sv.append(link, o, f);
      sv.append(tip(S('rect', { x: 0, y: cy - rh / 2, width: W, height: rh, fill: 'transparent' }), `<b>${n}</b><br>86M reference window: ${a.toFixed(2)}×<br>152M skill appearing: ${b.toFixed(2)}×`));
      return { link, o, f, a, b };
    });
    let seen = false;
    onVisible(root, async () => {
      if (seen) return; seen = true;
      tween(900, (t) => rowsEl.forEach((r) => { r.o.setAttribute('opacity', Math.min(1, t * 2)); r.f.setAttribute('opacity', Math.min(1, t * 2)); const xx = x2(r.a + (r.b - r.a) * t); r.f.setAttribute('cx', xx); r.link.setAttribute('x2', xx); }));
      for (const { d, cy } of dots) await tween(220, (t) => { d.setAttribute('opacity', t); d.setAttribute('cy', 20 + (cy - 20) * t); });
      tween(300, (t) => note.setAttribute('opacity', t));
    });
  }

  // ====================================================== family deletion
  function deletion() {
    const root = document.getElementById('fig-deletion'); if (!root) return;
    // Table 11. lift = helpful-tail lift in the matching 100-step window.
    const rows = [
      { k: 'worked', n: 'Worked examples', seeds: [0, 0, 0], mean: 0, d: '−148.0', p: 'p < 0.0001', lift: '2.64' },
      { k: 'primitive', n: 'Primitive facts', seeds: [119, 126, 133], mean: 126, d: '−22.0', p: 'p = 0.015', lift: '2.14' },
      { k: 'code', n: 'Code traces', seeds: [137, 139, 141], mean: 139, d: '−9.0', p: 'n.s.', lift: '1.39' },
      { k: 'verbal', n: 'Verbal procedures', seeds: [142, 143, 146], mean: 143.7, d: '−4.3', p: 'n.s.', lift: '1.21' },
      { k: null, n: 'Random removal (control)', seeds: [143, 146, 155], mean: 148, d: '', p: '', lift: '' },
      { k: 'web', n: 'Web text', seeds: [161, 163, 165], mean: 163, d: '+15.0', p: 'p = 0.017', lift: '0.16' },
    ];
    const W = 960, rh = 36, m = { l: 210, r: 250, t: 30, b: 34 }, Hh = m.t + rows.length * rh + m.b;
    const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Held-out problems solved after deleting each family: worked examples 0, primitive facts 126, code traces 139, verbal procedures 143.7, random control 148, web text 163.' });
    root.querySelector('.fig-scroll').append(svg);
    const x = lin(0, 200, m.l, W - m.r);
    [0, 50, 100, 150, 200].forEach((v) => {
      svg.append(S('line', { class: v === 0 ? 'axis' : 'gridline', x1: x(v), x2: x(v), y1: m.t, y2: Hh - m.b }));
      svg.append(S('text', { x: x(v), y: Hh - m.b + 16, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, v));
    });
    svg.append(S('text', { x: x(200), y: Hh - 3, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, 'held-out problems solved (of 200)'));
    svg.append(S('line', { x1: x(148), x2: x(148), y1: m.t - 6, y2: Hh - m.b, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    svg.append(S('text', { x: x(148), y: m.t - 12, 'text-anchor': 'middle', 'font-size': 11, class: 't-muted' }, 'random removal: 148'));
    const cx1 = W - m.r + 24, cx2 = W - 16;
    svg.append(S('text', { x: cx1, y: m.t - 12, 'font-size': 11, class: 't-muted' }, 'vs. random'), S('text', { x: cx2, y: m.t - 12, 'text-anchor': 'end', 'font-size': 11, class: 't-muted' }, 'window tail lift'));
    const bh = 18;
    const items = rows.map((r, i) => {
      const cy = m.t + rh * (i + 0.5);
      if (r.k) svg.append(S('rect', { x: 8, y: cy - 6, width: 10, height: 10, rx: 3, fill: fc(r.k) }));
      svg.append(S('text', { x: 26, y: cy + 4, 'font-size': 12.5, class: r.k ? 't-ink' : 't-muted' }, r.n));
      const bar = S('path', { fill: r.k ? fc(r.k) : 'var(--line)' });
      svg.append(bar);
      const pts = r.seeds.map((s) => { const c = S('circle', { cx: x(s), cy, r: 3, fill: 'var(--ink)', stroke: 'var(--surface)', 'stroke-width': 1.5, opacity: 0 }); svg.append(c); return c; });
      const val = S('text', { y: cy + 4, 'font-size': 12.5, 'font-weight': 600, class: 't-ink', opacity: 0 }, r.mean === 0 ? '0 on all three seeds' : r.mean % 1 ? r.mean.toFixed(1) : r.mean);
      svg.append(val);
      if (r.d) svg.append(S('text', { x: cx1, y: cy + 4, 'font-size': 12.5, class: 't-ink' }, r.d), S('text', { x: cx1 + 52, y: cy + 4, 'font-size': 11.5, class: 't-muted' }, r.p));
      if (r.lift) svg.append(S('text', { x: cx2, y: cy + 4, 'text-anchor': 'end', 'font-size': 12.5, class: 't-ink' }, r.lift + '×'));
      svg.append(tip(S('rect', { x: 0, y: cy - rh / 2, width: W, height: rh, fill: 'transparent' }), `<b>${r.n}</b><br>Seeds: ${r.seeds.join(', ')} of 200<br>Mean ${r.mean}${r.d ? `, ${r.d} vs. random (${r.p})` : ''}`));
      return { bar, pts, val, cy, mean: r.mean, top: Math.max(...r.seeds) };
    });
    let tok = null;
    async function play() {
      if (tok) tok.cancelled = true; const my = (tok = { cancelled: false });
      await tween(1200, (t) => items.forEach((it) => {
        const xe = x(it.mean * t);
        it.bar.setAttribute('d', it.mean ? hbar(x(0), xe, it.cy - bh / 2, bh) : '');
        it.val.setAttribute('x', x(it.top) + (it.mean ? 16 : 8)); it.val.setAttribute('opacity', t);
        it.pts.forEach((p) => p.setAttribute('opacity', t > 0.8 && it.mean ? 1 : 0));
      }), my);
    }
    let seen = false;
    onVisible(root, () => { if (!seen) { seen = true; play(); } });
    root.querySelector('[data-replay]').addEventListener('click', play);
  }

  // -------------------------------------------------------------------- go
  [pipeline, spanFigure, lab, horizonBars, explorer, baseline, transfer, deletion].forEach((f) => {
    try { f(); } catch (e) { console.error('figure failed:', f.name, e); }
  });
})();
