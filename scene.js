/* One spring drives the watch, type, terrain and dusk. No dependencies. */
(() => {
  'use strict';
  const root = document.documentElement;
  const clock = document.querySelector('#clock');
  const still = document.querySelector('#still');
  const note = document.querySelector('#time-note');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let energy = 0.8;
  let holding = false;
  let angle = null;
  let last = 0;
  let elapsed = 0;
  let handTime = 10 * 3600 + 9 * 60;
  let frame;
  const words = [];
  document.querySelectorAll('.bio p').forEach(p => {
    const fragments = p.textContent.trim().split(/(\s+)/);
    p.textContent = '';
    fragments.forEach(text => {
      if (/^\s+$/.test(text)) return p.append(text);
      const span = document.createElement('span');
      span.textContent = text;
      span.className = 'word';
      p.append(span);
      words.push(span);
    });
  });
  const ns = 'http://www.w3.org/2000/svg';
  const ticks = [], numerals = [];
  for (let i = 0; i < 60; i++) {
    const line = document.createElementNS(ns, 'path');
    line.setAttribute('stroke-width', i % 5 === 0 ? 1.8 : 0.7);
    document.querySelector('#ticks').append(line);
    ticks.push(line);
  }
  const roman = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  for (let i = 0; i < 12; i++) {
    const text = document.createElementNS(ns, 'text');
    text.textContent = roman[i];
    document.querySelector('#numerals').append(text);
    numerals.push(text);
  }
  const rim = document.querySelector('#rim');
  const dial = document.querySelector('#dial');
  const hands = ['hour','minute','second'].map(id => document.getElementById(id));
  function warp(x, y, melt) {
    const lower = Math.max(0, (y + 16) / 136);
    return [170 + x * (1 - melt * .52 * lower) + melt * 36 * lower * lower,
      170 + y + melt * 103 * lower ** 2.3];
  }
  const point = (a, r, melt) => warp(Math.sin(a) * r, -Math.cos(a) * r, melt);
  function outline(r, melt) {
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const p = point(i * Math.PI / 60, r, melt);
      d += `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`;
    }
    return d + 'Z';
  }
  function hand(a, length, melt) {
    let d = '';
    for (let i = -2; i <= 16; i++) {
      const p = point(a, length * i / 16, melt);
      d += `${i === -2 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`;
    }
    return d;
  }
  // Draw the supplied photograph in narrow continuous strips. Only the land
  // sags, leaving the horizon quiet; the original img remains the fallback.
  const image = document.querySelector('#mountain-photo');
  const canvas = document.querySelector('#landscape-canvas');
  const ctx = canvas.getContext('2d');
  const buffer = document.createElement('canvas');
  const bctx = buffer.getContext('2d');
  let photoReady = false;
  function resize() {
    if (!ctx || !bctx || !image.naturalWidth) return;
    const ratio = Math.min(1.5, devicePixelRatio || 1);
    canvas.width = buffer.width = Math.round(innerWidth * ratio);
    canvas.height = buffer.height = Math.round(innerHeight * ratio);
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    bctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    photoReady = true;
    document.querySelector('.landscape').classList.add('ready');
    renderPhoto(paused ? 0 : 1 - energy);
  }
  function renderPhoto(melt) {
    if (!photoReady) return;
    const w = canvas.width, h = canvas.height, horizon = h * .39;
    ctx.drawImage(buffer, 0, 0);
    if (melt < .001) return;
    const strip = Math.max(2, Math.ceil(w / 650));
    for (let x = 0; x < w; x += strip) {
      const nx = x / w;
      const sag = melt * h * .075 * (.45 + .35 * Math.sin(nx * 13) + .2 * Math.sin(nx * 31));
      // A taller destination pulls the bottom of each mountain gently downward.
      ctx.drawImage(buffer, x, horizon, Math.min(strip, w - x), h - horizon,
        x, horizon, Math.min(strip, w - x), h - horizon + sag);
    }
  }
  image.addEventListener('load', resize);
  if (image.complete) resize();
  window.addEventListener('resize', resize);
  function render(melt) {
    root.style.setProperty('--melt', melt.toFixed(3));
    root.style.setProperty('--night', (melt * .9).toFixed(3));
    rim.setAttribute('d', outline(122, melt));
    dial.setAttribute('d', outline(113, melt));
    ticks.forEach((tick, i) => {
      const a = i * Math.PI / 30;
      const start = point(a, i % 5 === 0 ? 98 : 104, melt), end = point(a, 108, melt);
      tick.setAttribute('d', `M${start}L${end}`);
    });
    numerals.forEach((text, i) => {
      const p = point(i * Math.PI / 6, 86, melt);
      text.setAttribute('x', p[0]); text.setAttribute('y', p[1] + 7);
      const lean = melt * Math.sin(i * Math.PI / 6) * -12;
      text.setAttribute('transform', `rotate(${lean},${p[0]},${p[1]})`);
    });
    hands[0].setAttribute('d', hand(handTime / 43200 * 2 * Math.PI, 52, melt));
    hands[1].setAttribute('d', hand(handTime / 3600 * 2 * Math.PI, 78, melt));
    hands[2].setAttribute('d', hand(Math.floor(handTime) / 60 * 2 * Math.PI, 91, melt));
    words.forEach((word, i) => {
      const flow = .5 + .5 * Math.sin(i * 1.73);
      const stretch = 1 + melt * flow * .7;
      word.style.transform = `translate(${melt * Math.sin(i * 2) * 5}px,${melt * melt * flow * 29}px) skewX(${-melt * flow * 12}deg) scaleY(${stretch})`;
    });
    renderPhoto(melt);
  }
  function update(now) {
    const dt = Math.min(.06, (now - (last || now)) / 1000);
    last = now;
    if (!paused) {
      energy = Math.max(0, Math.min(1, energy + (holding ? .65 : -1 / 42) * dt));
      handTime += holding ? -dt * 1500 : dt;
      elapsed += dt;
    }
    // ~30 fps is enough for slow liquid movement and keeps this small page light.
    if (elapsed > 1 / 30 || paused || holding) {
      render(paused ? 0 : 1 - energy);
      elapsed = 0;
    }
    if (!paused) frame = requestAnimationFrame(update);
  }
  function start() { cancelAnimationFrame(frame); last = 0; frame = requestAnimationFrame(update); }
  function setPaused(value) {
    paused = value;
    holding = false;
    angle = null;
    document.body.classList.toggle('paused', paused);
    still.textContent = paused ? 'let time pass' : 'pause time';
    still.setAttribute('aria-pressed', String(paused));
    note.textContent = paused ? 'a moment, held' : 'time is passing';
    if (paused) energy = 1;
    render(paused ? 0 : 1 - energy);
    start();
  }
  function wind() {
    if (paused) setPaused(false);
    holding = true;
    note.textContent = 'turning back time';
  }
  function release() { holding = false; angle = null; note.textContent = paused ? 'a moment, held' : 'time is passing'; }
  function pointerAngle(event) {
    const box = clock.getBoundingClientRect();
    return Math.atan2(event.clientY - (box.top + box.height * 170 / 410), event.clientX - (box.left + box.width / 2));
  }
  clock.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    clock.setPointerCapture(event.pointerId);
    wind(); angle = pointerAngle(event);
  });
  clock.addEventListener('pointermove', event => {
    if (!holding || angle === null) return;
    const next = pointerAngle(event);
    const delta = Math.atan2(Math.sin(next - angle), Math.cos(next - angle));
    energy = Math.min(1, energy + Math.abs(delta) * .2);
    handTime -= Math.abs(delta) * 600;
    angle = next;
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture','blur']) clock.addEventListener(type, release);
  clock.addEventListener('keydown', event => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); wind(); }
  });
  clock.addEventListener('keyup', event => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); release(); }
  });
  // Supports assistive-technology activation without a physical key/pointer.
  clock.addEventListener('click', event => { if (event.detail === 0 && !holding) { energy = 1; render(0); } });
  still.addEventListener('click', () => setPaused(!paused));
  motion.addEventListener('change', event => setPaused(event.matches));
  document.addEventListener('visibilitychange', () => {
    release();
    if (document.hidden) cancelAnimationFrame(frame); else start();
  });
  document.querySelector('.clock-area').hidden = false;
  still.hidden = false;
  setPaused(paused);
})();
