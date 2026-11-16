/* ============================================================
   AUG DEV STUDIO® — main.js v3
   pinned assembly hero · inertial scroll · word ramps · accordion
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp  = (a, b, n) => a + (b - a) * n;
  const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));
  const ezo   = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const FINE  = matchMedia('(pointer:fine)').matches;
  const RM    = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const S = { y: scrollY, ly: scrollY, v: 0, sv: 0, mx: innerWidth / 2, my: innerHeight / 2, lmx: innerWidth / 2, lmy: innerHeight / 2, vh: innerHeight };
  addEventListener('mousemove', e => { S.mx = e.clientX; S.my = e.clientY; }, { passive: true });

  /* ============================================================
     TEXT SPLITTING
     ============================================================ */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text.trim());
    let i = 0;
    for (const ch of text) {
      if (ch === ' ') { el.appendChild(document.createTextNode(' ')); continue; }
      const w = document.createElement('span'); w.className = 'chw';
      const c = document.createElement('span'); c.className = 'ch';
      c.style.setProperty('--i', i++); c.textContent = ch;
      w.appendChild(c); el.appendChild(w);
    }
  }
  // masked slide-in words (one-shot reveal)
  function splitMasked(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const mask = document.createElement('span'); mask.className = 'wdw';
      const wd = document.createElement('span'); wd.className = 'wd';
      wd.style.setProperty('--i', i); wd.textContent = w;
      mask.appendChild(wd); el.appendChild(mask);
      el.appendChild(document.createTextNode(' '));
    });
  }
  // scroll-ramped words (opacity driven by pin progress)
  function splitRamp(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map(w => {
      const s = document.createElement('span');
      s.className = 'rw'; s.textContent = w;
      el.appendChild(s); el.appendChild(document.createTextNode(' '));
      return s;
    });
  }

  $$('[data-split]').forEach(splitChars);
  $$('[data-words]').forEach(splitMasked);

  const ramps = $$('[data-ramp]').map(el => {
    const pin = el.closest('[data-pin]');
    return { words: splitRamp(el), pin,
      meter: pin ? pin.querySelector('.p-meter i') : null,
      top: 0, range: 1, lp: 0, last: -1 };
  });

  // rolling chars for the contact mega-link
  $$('[data-roll]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    for (const ch of text) {
      const c = ch === ' ' ? '\u00A0' : ch;
      const w = document.createElement('span'); w.className = 'rcw';
      const r = document.createElement('span'); r.className = 'rc';
      r.style.setProperty('--i', i++);
      r.textContent = c;
      const b = document.createElement('b'); b.textContent = c;
      r.appendChild(b); w.appendChild(r); el.appendChild(w);
    }
  });

  /* ============================================================
     INERTIAL SMOOTH SCROLL
     ============================================================ */
  const sm = { on: FINE && !RM, t: scrollY, c: scrollY };
  let lastWheel = 0;
  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);

  if (sm.on) {
    document.documentElement.classList.add('js-smooth');
    addEventListener('wheel', e => {
      if (e.ctrlKey || e.deltaY === 0) return;
      e.preventDefault();
      lastWheel = performance.now();
      sm.t = clamp(sm.t + e.deltaY * (e.deltaMode === 1 ? 16 : 1), 0, maxScroll());
    }, { passive: false });
    addEventListener('scroll', () => {
      if (performance.now() - lastWheel > 140 && Math.abs(scrollY - sm.c) > 4) {
        sm.t = sm.c = scrollY;
      }
    }, { passive: true });
  }
  addEventListener('scroll', () => { S.y = scrollY; }, { passive: true });

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    e.preventDefault();
    if (id === '#') return;
    const y = id === '#top' ? 0 :
      ($(id) ? $(id).getBoundingClientRect().top + scrollY : 0);
    if (sm.on) sm.t = clamp(y, 0, maxScroll());
    else scrollTo({ top: y, behavior: 'smooth' });
  }));

  /* ============================================================
     PRELOADER
     ============================================================ */
  document.body.classList.add('locked');
  const loaderAssets = [
    'assets/p1-skull.jpg', 'assets/p2-headphones.jpg', 'assets/p3-statue.jpg',
    'assets/p4-environment.jpg', 'assets/p5-arch.jpg', 'assets/p6-android.jpg',
    'assets/about.jpg', 'assets/break-clay.jpg'
  ];
  let loadedCount = 0;
  const fileEl = $('#loaderFile');
  loaderAssets.forEach(src => {
    const im = new Image();
    im.onload = im.onerror = () => {
      loadedCount++;
      if (fileEl) fileEl.textContent = src.toUpperCase();
    };
    im.src = src;
  });

  const countEl = $('#loaderCount'), barEl = $('#loaderBar'), loaderEl = $('#loader');
  const t0 = performance.now();
  let shown = 0, booted = false;

  function boot() {
    if (booted) return; booted = true;
    countEl.textContent = '100';
    barEl.style.transform = 'scaleX(1)';
    document.body.classList.add('boot');
    setTimeout(() => {
      document.body.classList.remove('locked');
      document.body.classList.add('loaded');
      measure();
    }, 750);
    setTimeout(() => $('#heroTitle').classList.add('in'), 880);
    setTimeout(initObservers, 1000);
  }
  requestAnimationFrame(function preload(now) {
    const elapsed = now - t0;
    const target = Math.max(loadedCount / loaderAssets.length, elapsed / 2100) * 100;
    shown = lerp(shown, Math.min(target, 100), 0.11);
    countEl.textContent = Math.floor(shown);
    barEl.style.transform = `scaleX(${shown / 100})`;
    if ((shown > 99.2 && loadedCount >= loaderAssets.length) || elapsed > 4600) { boot(); return; }
    requestAnimationFrame(preload);
  });
  requestAnimationFrame(() => loaderEl.classList.add('init'));

  /* ============================================================
     REVEAL OBSERVER
     ============================================================ */
  function initObservers() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    $$('[data-split],[data-words],.wcard,.rvl').forEach(el => {
      if (el.closest('.hero')) return;
      io.observe(el);
    });
  }

  /* ============================================================
     HERO — WebGL assembly scene (three.js) + 2D fallback
     ============================================================ */
  const stage = $('#heroStage');
  let gl = null;

  function initGL() {
    if (!window.THREE) return false;
    try {
      const T = THREE;
      const holder = document.createElement('div');
      holder.id = 'glc';
      stage.insertBefore(holder, stage.firstChild);
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      holder.appendChild(renderer.domElement);

      const scene = new T.Scene();
      scene.fog = new T.Fog(0x060606, 8, 20);
      const cam = new T.PerspectiveCamera(46, 1, 0.1, 80);
      cam.position.set(0, 3.6, 12.5);

      scene.add(new T.AmbientLight(0x2a2a2a, 1));
      const key = new T.SpotLight(0xffffff, 2.4); key.position.set(5, 7, 6); scene.add(key);
      const rim = new T.PointLight(0xffffff, 1.5); rim.position.set(-7, -2, -5); scene.add(rim);
      const top = new T.PointLight(0xffffff, 0.8); top.position.set(0, 8, 1); scene.add(top);

      const g = new T.Group(); scene.add(g);

      const coreMat = new T.MeshStandardMaterial({ color: 0xe6e6e3, roughness: 0.27, metalness: 0.38, transparent: true, opacity: 0 });
      const core = new T.Mesh(new T.TorusKnotGeometry(1, 0.34, 240, 36), coreMat);
      core.scale.setScalar(0.001);
      g.add(core);

      const cage1 = new T.LineSegments(
        new T.EdgesGeometry(new T.IcosahedronGeometry(2.05, 1)),
        new T.LineBasicMaterial({ color: 0xf4f4f1, transparent: true, opacity: 0 }));
      const cage2 = new T.LineSegments(
        new T.EdgesGeometry(new T.DodecahedronGeometry(2.65, 0)),
        new T.LineBasicMaterial({ color: 0xf4f4f1, transparent: true, opacity: 0 }));
      g.add(cage1, cage2);

      function ring(r, rx) {
        const pts = [];
        for (let i = 0; i <= 128; i++) pts.push(new T.Vector3(Math.cos(i / 128 * Math.PI * 2) * r, 0, Math.sin(i / 128 * Math.PI * 2) * r));
        const l = new T.Line(new T.BufferGeometry().setFromPoints(pts),
          new T.LineBasicMaterial({ color: 0xf4f4f1, transparent: true, opacity: 0 }));
        l.rotation.x = rx; l.scale.setScalar(1.6); g.add(l); return l;
      }
      const ring1 = ring(3.35, 1.25), ring2 = ring(3.8, 1.05);

      const n = 520, dp = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = 3.1 + Math.random() * 1.6, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        dp[i * 3] = r * Math.sin(ph) * Math.cos(th);
        dp[i * 3 + 1] = r * Math.cos(ph);
        dp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      const dustGeo = new T.BufferGeometry();
      dustGeo.setAttribute('position', new T.BufferAttribute(dp, 3));
      const dustMat = new T.PointsMaterial({ color: 0xf4f4f1, size: 0.022, transparent: true, opacity: 0 });
      const dust = new T.Points(dustGeo, dustMat);
      dust.scale.setScalar(1.7);
      g.add(dust);

      const gc = document.createElement('canvas'); gc.width = gc.height = 256;
      const gx = gc.getContext('2d');
      const grad = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255,255,255,.5)');
      grad.addColorStop(0.4, 'rgba(255,255,255,.12)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      gx.fillStyle = grad; gx.fillRect(0, 0, 256, 256);
      const glow = new T.Sprite(new T.SpriteMaterial({
        map: new T.CanvasTexture(gc), transparent: true, opacity: 0,
        blending: T.AdditiveBlending, depthWrite: false }));
      glow.scale.set(8, 8, 1); glow.position.z = -2.5;
      g.add(glow);

      function size() {
        const w = holder.clientWidth, h = holder.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        cam.aspect = w / h; cam.updateProjectionMatrix();
      }
      size();

      let spin = 0, trx = 0, tryy = 0;

      // ASSEMBLY TIMELINE — scrubbed by sf ∈ [0,1]  (their door-layer pattern)
      return {
        size,
        draw(dt, sf) {
          spin += dt * 0.00014;
          g.rotation.y = spin * (0.25 + sf);

          // cages converge from deep space
          cage2.scale.setScalar(lerp(3.4, 1, ezo(sf / 0.5)));
          cage1.scale.setScalar(lerp(2.2, 1, ezo((sf - 0.05) / 0.55)));
          cage2.material.opacity = 0.18 * ezo(sf / 0.2);
          cage1.material.opacity = 0.34 * ezo((sf - 0.12) / 0.35);
          cage1.rotation.y -= dt * 0.00016; cage1.rotation.x += dt * 0.00009;
          cage2.rotation.y += dt * 0.00010; cage2.rotation.z -= dt * 0.00007;

          // core materializes
          const cs = ezo((sf - 0.2) / 0.5);
          core.scale.setScalar(Math.max(cs, 0.001));
          coreMat.opacity = cs;
          core.rotation.y = spin * (0.4 + sf);
          core.rotation.x = 0.5 + sf * 0.6;

          // rings lock in
          const rl = ezo((sf - 0.6) / 0.35);
          ring1.material.opacity = 0.5 * rl; ring2.material.opacity = 0.28 * rl;
          ring1.scale.setScalar(lerp(1.6, 1, rl)); ring2.scale.setScalar(lerp(1.6, 1, rl));
          ring1.rotation.z += dt * 0.0002; ring2.rotation.z -= dt * 0.00014;

          // dust settles + glow blooms
          dustMat.opacity = 0.55 * ezo((sf - 0.3) / 0.5);
          dust.scale.setScalar(lerp(1.7, 1, ezo(sf / 0.8)));
          dust.rotation.y += dt * 0.00007;
          glow.material.opacity = 0.55 * ezo((sf - 0.55) / 0.4);

          // mouse parallax
          const nx = S.lmx / innerWidth - 0.5, ny = S.lmy / innerHeight - 0.5;
          trx = lerp(trx, ny * 0.26, 0.05); tryy = lerp(tryy, nx * 0.38, 0.05);
          g.rotation.x = trx;

          // camera: orbit arc + dolly + fov ramp (unzoom-to-orbit)
          const orb = ezo(sf / 0.88);
          const rad = lerp(12.5, 7.4, orb);
          const ang = lerp(-1.1, 0, orb);
          cam.position.x = Math.sin(ang) * rad + nx * 0.6;
          cam.position.z = Math.cos(ang) * rad;
          cam.position.y = lerp(3.6, 0, ezo(sf)) - ny * 0.5;
          cam.fov = lerp(46, 38, orb);
          cam.updateProjectionMatrix();
          cam.lookAt(0, 0, 0);

          renderer.render(scene, cam);
        }
      };
    } catch (e) { return false; }
  }

  /* ---------- 2D canvas fallback (converging layers) ---------- */
  const canvas2d = $('#sculpt');
  const ctx = canvas2d.getContext('2d');
  let CW = 0, CH = 0;
  const TAU = Math.PI * 2;
  const LAYERS = [{ s: .58, pts: 460, ph: .9 }, { s: .82, pts: 460, ph: .45 }, { s: 1.06, pts: 460, ph: 0 }];
  const DUST = Array.from({ length: 340 }, () => ({
    r: 1.9 + Math.random() * 1.3, th: Math.random() * TAU,
    ph: Math.acos(2 * Math.random() - 1), sp: 0.02 + Math.random() * 0.05
  }));
  let spin2 = 0;

  function size2d() {
    const DPR = Math.min(devicePixelRatio || 1, 1.75);
    CW = canvas2d.clientWidth; CH = canvas2d.clientHeight;
    if (!CW || !CH) return;
    canvas2d.width = CW * DPR; canvas2d.height = CH * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function knot(t, s, ph) {
    const r = 2 + Math.cos(3 * t);
    return [s * r * Math.cos(2 * t + ph), s * r * Math.sin(2 * t + ph), s * Math.sin(3 * t) * 1.25];
  }
  function draw2D(dt, sf) {
    if (!CW) return;
    if (sf >= 1) { ctx.clearRect(0, 0, CW, CH); return; }
    spin2 += dt * 0.00016 * (0.4 + sf * 2);
    const rotY = spin2 + (S.lmx / CW - 0.5) * 0.9;
    const rotX = 0.48 + (S.lmy / CH - 0.5) * 0.5 + (1 - ezo(sf)) * 0.6;
    const spread = lerp(2.5, 1, ezo(sf / 0.8));           // converge, not explode
    const size = Math.min(CW, CH) * 0.148 * lerp(0.55, 1, ezo(sf));
    const cx = CW / 2, cy = CH / 2;
    const cY = Math.cos(rotY), sY = Math.sin(rotY), cX = Math.cos(rotX), sX = Math.sin(rotX);
    const FL = 4.6;
    ctx.clearRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(244,244,241,.5)';
    const dustA = ezo((sf - 0.3) / 0.5);
    for (const d of DUST) {
      d.th += d.sp * dt * 0.001;
      const dr = d.r * lerp(1.8, 1, ezo(sf / 0.8));
      let x = dr * Math.sin(d.ph) * Math.cos(d.th), y = dr * Math.cos(d.ph), z = dr * Math.sin(d.ph) * Math.sin(d.th);
      let x1 = x * cY - z * sY, z1 = x * sY + z * cY;
      let y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
      const p = FL / (FL + z2);
      ctx.globalAlpha = clamp((p - 0.72) / 0.55, 0.04, 0.5) * 0.55 * dustA;
      ctx.fillRect(cx + x1 * size * p * 1.15, cy + y1 * size * p * 1.15, 1.4, 1.4);
    }
    LAYERS.forEach((L, li) => {
      const ls = L.s * spread;
      const pts = [];
      for (let i = 0; i <= L.pts; i++) {
        const [x, y, z] = knot((i / L.pts) * TAU, ls, L.ph);
        let x1 = x * cY - z * sY, z1 = x * sY + z * cY;
        let y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
        const p = FL / (FL + z2);
        pts.push([cx + x1 * size * p, cy + y1 * size * p, p]);
      }
      for (let c = 0; c < pts.length - 1; c += 46) {
        const seg = pts.slice(c, c + 47);
        const avg = seg.reduce((a, p) => a + p[2], 0) / seg.length;
        ctx.beginPath();
        seg.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.globalAlpha = clamp((avg - 0.68) / 0.6, 0.03, 1) * (li === 2 ? 0.75 : 0.4) * ezo(sf / 0.25);
        ctx.lineWidth = li === 2 ? 1.1 : 0.7;
        ctx.strokeStyle = '#f4f4f1';
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ============================================================
     MEASUREMENTS
     ============================================================ */
  const hero = { top: 0, h: 0, range: 1 };
  const svc = { top: 0, range: 1, track: 0 };
  let pxItems = [], colItems = [], driftItems = [], mqW = 0;
  const svcTrack = $('#svcTrack');
  const mqTrack = $('#mqTrack');

  function measure() {
    S.vh = innerHeight;
    const heroEl = $('.hero'), svcEl = $('#services');
    hero.top = heroEl.offsetTop; hero.h = heroEl.offsetHeight; hero.range = hero.h - S.vh;
    svc.top = svcEl.offsetTop; svc.range = svcEl.offsetHeight - S.vh;
    svc.track = Math.max(0, svcTrack.scrollWidth - innerWidth + innerWidth * 0.06);
    mqW = mqTrack.children[0] ? mqTrack.children[0].offsetWidth : 0;

    ramps.forEach(r => {
      if (!r.pin) return;
      const rect = r.pin.getBoundingClientRect();
      r.top = rect.top + scrollY;
      r.range = Math.max(rect.height - S.vh, 1);
    });
    pxItems = $$('[data-speed]').map(el => {
      const r = el.getBoundingClientRect();
      return { el, sp: parseFloat(el.dataset.speed), top: r.top + scrollY, h: r.height,
               zoom: el.hasAttribute('data-zoom') };
    });
    colItems = $$('[data-colspeed]').map(el => ({
      el, sp: parseFloat(el.dataset.colspeed), top: el.getBoundingClientRect().top + scrollY
    }));
    driftItems = $$('[data-drift]').map(el => {
      const r = el.parentElement.getBoundingClientRect();
      return { el, f: parseFloat(el.dataset.drift), top: r.top + scrollY, h: r.height };
    });
    if (gl) gl.size(); else size2d();
  }
  const layout = (() => { let t; return () => { clearTimeout(t); t = setTimeout(measure, 180); }; })();
  addEventListener('resize', layout, { passive: true });

  /* ============================================================
     CURSOR + MAGNETS
     ============================================================ */
  const dot = $('#cursorDot'), ring = $('#cursorRing');
  let rx = S.mx, ry = S.my;
  document.addEventListener('mouseover', e => {
    const view = e.target.closest('[data-cursor="view"]');
    const link = e.target.closest('[data-hover],a,button');
    document.body.classList.toggle('is-view', !!view);
    document.body.classList.toggle('is-link', !!link && !view);
  });
  $$('.magnet').forEach(m => {
    if (!FINE) return;
    m.addEventListener('mousemove', e => {
      const r = m.getBoundingClientRect();
      m.style.transition = 'transform 0s';
      m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.28}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    m.addEventListener('mouseleave', () => {
      m.style.transition = 'transform .5s cubic-bezier(.19,1,.22,1)';
      m.style.transform = 'translate(0,0)';
    });
  });

  /* ============================================================
     ACCORDION + PROCESS INDEX
     ============================================================ */
  $$('.ap-row').forEach(row => {
    row.querySelector('.ap-head').addEventListener('click', () => {
      const was = row.classList.contains('open');
      $$('.ap-row.open').forEach(r => r.classList.remove('open'));
      if (!was) row.classList.add('open');
    });
  });

  const apCur = $('#apCur');
  const stackEls = $$('.ap-stack span');
  const apIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const n = e.target.dataset.ap;
    apCur.textContent = n;
    stackEls.forEach(s => s.classList.toggle('on', s.dataset.i === n));
  }), { rootMargin: '-40% 0px -50% 0px' });
  $$('.ap-row').forEach(r => apIO.observe(r));

  // hero HUD + stage tags
  const hudEl = $('#hudPct'), tgEls = $$('.tg');
  const TG_T = [0.06, 0.3, 0.52, 0.74];
  let hudLast = -1;

  /* ============================================================
     STATS
     ============================================================ */
  const statIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    statIO.unobserve(e.target);
    const end = +e.target.dataset.count, suf = e.target.dataset.suffix || '';
    const t = performance.now();
    (function tick(now) {
      const p = clamp((now - t) / 1400, 0, 1);
      e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t);
  }), { threshold: 0.6 });
  $$('.stat-num').forEach(el => statIO.observe(el));

  $('#toTop').addEventListener('click', () => {
    if (sm.on) sm.t = 0; else scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ============================================================
     MASTER LOOP
     ============================================================ */
  gl = initGL();
  if (gl) canvas2d.remove();

  const progressEl = $('#progress');
  const ht1 = $('.ht-1'), ht2 = $('.ht-2');
  const svcCur = $('#svcCur'), svcBar = $('#svcBar');
  let svcLP = 0, mqPos = 0, prevLy = S.y, svcLastIdx = -1;
  let lastT = performance.now();

  function frame(now) {
    const dt = Math.min(now - lastT, 50); lastT = now;

    // --- smooth scroll
    if (sm.on) {
      sm.c = lerp(sm.c, sm.t, 0.088);
      if (Math.abs(sm.t - sm.c) < 0.05) sm.c = sm.t;
      if (Math.abs(scrollY - sm.c) > 0.5) window.scrollTo(0, sm.c);
      S.y = sm.c; S.ly = sm.c;
    } else {
      S.ly = lerp(S.ly, S.y, 0.1);
    }
    S.v = S.ly - prevLy; prevLy = S.ly;
    S.sv = lerp(S.sv, S.v, 0.12);
    S.lmx = lerp(S.lmx, S.mx, 0.16); S.lmy = lerp(S.lmy, S.my, 0.16);

    // --- cursor
    if (FINE) {
      rx = lerp(rx, S.mx, 0.11); ry = lerp(ry, S.my, 0.11);
      dot.style.transform = `translate(${S.mx}px,${S.my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    }

    // --- progress bar + nav
    const max = maxScroll();
    progressEl.style.transform = `scaleX(${max > 0 ? S.ly / max : 0})`;
    if (S.ly > 160 && S.sv > 0.6) document.body.classList.add('nav-hide');
    else if (S.sv < -0.4 || S.ly < 160) document.body.classList.remove('nav-hide');

    // --- marquee (velocity reactive)
    if (mqW > 0) {
      mqPos += (RM ? 0.15 : 1.1) + Math.min(Math.abs(S.sv) * 0.25, 8);
      mqPos %= mqW;
      mqTrack.style.transform = `translate3d(${-mqPos}px,0,0)`;
    }

    // --- HERO assembly
    const heroP = clamp((S.ly - hero.top) / hero.range, 0, 1);
    if (S.ly < hero.top + hero.h + 200) {
      if (gl) gl.draw(dt, heroP); else draw2D(dt, heroP);

      // HUD + tags
      const pct = Math.round(heroP * 100);
      if (pct !== hudLast) {
        hudLast = pct;
        hudEl.textContent = String(pct).padStart(3, '0');
        tgEls.forEach((t, i) => t.classList.toggle('on', heroP >= TG_T[i]));
      }
      // title drift + tail fade
      ht1.style.transform = `translate3d(${-heroP * 6}vw,0,0)`;
      ht2.style.transform = `translate3d(${heroP * 6}vw,0,0)`;
      const to = 1 - clamp((heroP - 0.86) / 0.14, 0, 1) * 0.85;
      ht1.style.opacity = to; ht2.style.opacity = to;
    }

    // --- services horizontal pin
    const sp = clamp((S.ly - svc.top) / svc.range, 0, 1);
    svcLP = lerp(svcLP, sp, RM ? 1 : 0.12);
    if (Math.abs(svcLP - sp) > 0.0002 || (sp > 0 && sp < 1)) {
      svcTrack.style.transform = `translate3d(${(-svcLP * svc.track).toFixed(1)}px,0,0)`;
      svcBar.style.transform = `scaleX(${svcLP})`;
      const idx = clamp(Math.round(svcLP * 5) + 1, 1, 6);
      if (idx !== svcLastIdx) { svcLastIdx = idx; svcCur.textContent = String(idx).padStart(2, '0'); }
    }

    // --- word ramps (manifesto + philosophy)
    for (const r of ramps) {
      const p = clamp((S.ly - r.top + S.vh * 0.1) / r.range, 0, 1);
      r.lp = lerp(r.lp, p, RM ? 1 : 0.1);
      if (Math.abs(r.lp - r.last) < 0.0004) continue;
      r.last = r.lp;
      const n = r.words.length;
      for (let i = 0; i < n; i++) {
        r.words[i].style.opacity = clamp((r.lp - (i / n) * 0.86) * 6.5, 0.12, 1);
      }
      if (r.meter) r.meter.style.transform = `scaleY(${r.lp})`;
    }

    // --- parallax / zoom / velocity skew
    const vc = S.ly + S.vh / 2;
    const skew = clamp(-S.sv * 0.09, -5, 5);
    for (const it of pxItems) {
      if (it.zoom) {
        const pz = clamp((S.ly + S.vh - it.top) / (S.vh + it.h), 0, 1);
        const ty = clamp((vc - (it.top + it.h / 2)) * it.sp, -60, 60);
        it.el.style.transform = `translate3d(0,${ty.toFixed(1)}px,0) scale(${(1.32 - pz * 0.22).toFixed(3)})`;
      } else {
        const y = clamp((vc - (it.top + it.h / 2)) * it.sp, -90, 90);
        it.el.style.transform = `translate3d(0,${y.toFixed(1)}px,0) scale(1.18) skewY(${skew.toFixed(2)}deg)`;
      }
    }
    for (const it of colItems) {
      const y = clamp((vc - it.top) * it.sp * 2, -140, 140);
      it.el.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    }
    for (const it of driftItems) {
      const x = (vc - (it.top + it.h / 2)) * it.f * -1;
      it.el.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    }

    requestAnimationFrame(frame);
  }

  // boot
  measure();
  addEventListener('load', measure);
  if (document.fonts) document.fonts.ready.then(measure);
  requestAnimationFrame(frame);
})();
