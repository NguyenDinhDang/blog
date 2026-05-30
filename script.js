/* =====================================================
   MEMORY LETTER — script.js
   Handles:
     1. Opening scene particles + envelope animation
     2. Blog page ambient canvas (dust / grain / light)
     3. Scroll-reveal via IntersectionObserver
     4. Falling particles in ending section
     5. Music toggle button
   ===================================================== */

'use strict';

// ── DOM Refs ──────────────────────────────────────────
const openingScene  = document.getElementById('opening-scene');
const openingCanvas = document.getElementById('opening-canvas');
const blogPage      = document.getElementById('blog-page');
const blogCanvas    = document.getElementById('blog-canvas');
const envelopeWrap  = document.getElementById('envelope-wrap');
const envelope      = document.getElementById('envelope');
const paper         = document.getElementById('paper');
const clickHint     = document.getElementById('click-hint');
const musicBtn      = document.getElementById('music-btn');
const bgMusic       = document.getElementById('bg-music');
const musicIcon     = document.getElementById('music-icon');


/* =========================================================
   1.  OPENING SCENE — Ambient Particle Canvas
   ========================================================= */

(function initOpeningCanvas() {
  const ctx = openingCanvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = openingCanvas.width  = openingCanvas.offsetWidth;
    H = openingCanvas.height = openingCanvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Build dust particles
  function buildParticles(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        r:  Math.random() * 1.8 + 0.3,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.14,
        alpha: Math.random() * 0.5 + 0.1,
        phase: Math.random() * Math.PI * 2,   // for alpha shimmer
      });
    }
    return arr;
  }
  particles = buildParticles(90);

  // A few larger "light orb" blobs
  const orbs = Array.from({ length: 3 }, () => ({
    x:  W * (0.2 + Math.random() * 0.6),
    y:  H * (0.2 + Math.random() * 0.6),
    r:  80 + Math.random() * 60,
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.10,
    alpha: 0.06 + Math.random() * 0.07,
  }));

  let frame = 0;
  let active = true;

  function tick() {
    if (!active) return;
    requestAnimationFrame(tick);
    frame++;

    ctx.clearRect(0, 0, W, H);

    // Draw soft light orbs
    orbs.forEach(o => {
      o.x += o.vx;
      o.y += o.vy;
      if (o.x < -o.r) o.x = W + o.r;
      if (o.x > W + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = H + o.r;
      if (o.y > H + o.r) o.y = -o.r;

      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, `rgba(255,230,180,${o.alpha})`);
      g.addColorStop(1, 'rgba(255,230,180,0)');
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });

    // Draw dust particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      // Wrap
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      // Shimmer
      const shimmer = Math.sin(frame * 0.025 + p.phase) * 0.2 + 0.8;
      ctx.globalAlpha = p.alpha * shimmer;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = '#b8956a';
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  tick();

  // Expose stop function
  openingCanvas._stop = () => { active = false; };
})();


/* =========================================================
   2.  ENVELOPE CLICK — Cinematic Opening Sequence
   ========================================================= */

let animating = false;

envelopeWrap.addEventListener('click', function () {
  if (animating) return;
  animating = true;

  // Step 1: Hide hint text
  clickHint.style.transition = 'opacity 0.5s ease';
  clickHint.style.opacity = '0';

  // Step 2: Trigger envelope opening CSS class
  setTimeout(() => {
    envelope.classList.add('opening');
  }, 100);

  // Step 3: Add burst particles around the envelope
  spawnBurstParticles();

  // Step 4: Zoom in (CSS class)
  setTimeout(() => {
    envelopeWrap.classList.add('zooming');
    setTimeout(() => {
      envelopeWrap.classList.add('zoom-grow');
    }, 200);
  }, 900);

  // Step 5: Detach paper and expand it to full screen
  setTimeout(() => {
    // Move paper out of envelope into the fixed layer
    const rect = paper.getBoundingClientRect();
    const clone = paper.cloneNode(true);
    clone.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      z-index: 2000;
      border-radius: 4px;
      background: linear-gradient(170deg, #fdf8f0 0%, #f7eeda 100%);
      transition: all 0.85s cubic-bezier(0.4,0,0.2,1);
      box-shadow: 0 4px 24px rgba(100,70,50,0.3);
    `;
    document.body.appendChild(clone);

    // Force reflow then expand
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clone.style.top    = '0';
        clone.style.left   = '0';
        clone.style.width  = '100vw';
        clone.style.height = '100vh';
        clone.style.borderRadius = '0';
        clone.style.boxShadow    = 'none';
      });
    });

    // Step 6: Fade opening scene out
    setTimeout(() => {
      openingScene.classList.add('fade-out');
      if (openingCanvas._stop) openingCanvas._stop();
    }, 500);

    // Step 7: Reveal blog page, then remove clone
    setTimeout(() => {
      openingScene.style.display = 'none';
      blogPage.classList.remove('hidden');
      clone.remove();

      // Start blog canvas + reveal observers
      initBlogCanvas();
      initScrollReveal();
      initFallingParticles();

      // Show music button
      musicBtn.classList.remove('hidden');
    }, 900);

  }, 1400);
});

/* Small burst particles for visual flair on click */
function spawnBurstParticles() {
  const openCtx = openingCanvas.getContext('2d');
  const rect = envelopeWrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height * 0.3;

  const bursts = Array.from({ length: 28 }, () => ({
    x: cx, y: cy,
    vx: (Math.random() - 0.5) * 4.5,
    vy: (Math.random() - 1.2) * 4,
    r:  Math.random() * 3 + 1,
    alpha: 0.9,
    color: ['#d4aa7d','#c49a6c','#e8c99a','#b8956a','#f0d5b0'][Math.floor(Math.random()*5)],
  }));

  let life = 0;
  (function anim() {
    if (life > 55) return;
    life++;
    bursts.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.12;   // gravity
      b.alpha -= 0.016;
      openCtx.globalAlpha = Math.max(0, b.alpha);
      openCtx.beginPath();
      openCtx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      openCtx.fillStyle = b.color;
      openCtx.fill();
    });
    openCtx.globalAlpha = 1;
    requestAnimationFrame(anim);
  })();
}


/* =========================================================
   3.  BLOG PAGE — Ambient Canvas (dust, grain, slow light)
   ========================================================= */

function initBlogCanvas() {
  const ctx = blogCanvas.getContext('2d');
  let W, H;

  function resize() {
    W = blogCanvas.width  = window.innerWidth;
    H = blogCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Soft floating dust in blog
  const dust = Array.from({ length: 55 }, () => ({
    x:  Math.random() * W,
    y:  Math.random() * H,
    r:  Math.random() * 1.2 + 0.2,
    vx: (Math.random() - 0.5) * 0.08,
    vy: -Math.random() * 0.1 - 0.02,   // drift upward slowly
    alpha: Math.random() * 0.25 + 0.05,
    phase: Math.random() * Math.PI * 2,
  }));

  // Slow drifting light gradient
  let lightX = W * 0.5, lightY = H * 0.2;
  let lightDX = 0.15, lightDY = 0.08;

  let f = 0;
  (function tick() {
    requestAnimationFrame(tick);
    f++;

    // Scroll-offset for parallax on the light blob
    const scrollY = window.scrollY;

    ctx.clearRect(0, 0, W, H);

    // Drifting warm light
    lightX += lightDX;
    lightY += lightDY * Math.sin(f * 0.003);
    if (lightX < 0 || lightX > W) lightDX *= -1;

    const lg = ctx.createRadialGradient(lightX, lightY - scrollY * 0.05, 0,
                                         lightX, lightY - scrollY * 0.05, W * 0.55);
    lg.addColorStop(0, 'rgba(255,235,190,0.07)');
    lg.addColorStop(1, 'rgba(255,235,190,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);

    // Dust motes
    dust.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
      if (d.x < 0) d.x = W;
      if (d.x > W) d.x = 0;

      const shimmer = Math.sin(f * 0.02 + d.phase) * 0.15 + 0.85;
      ctx.globalAlpha = d.alpha * shimmer;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = '#c0906a';
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  })();
}


/* =========================================================
   4.  SCROLL REVEAL — IntersectionObserver
   ========================================================= */

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings slightly if they appear together
        const delay = (i % 3) * 80;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  elements.forEach(el => observer.observe(el));
}


/* =========================================================
   5.  FALLING PARTICLES — Ending Section
   ========================================================= */

function initFallingParticles() {
  const container = document.getElementById('falling-particles');
  if (!container) return;

  for (let i = 0; i < 22; i++) {
    const p = document.createElement('span');
    p.className = 'fall-particle';
    p.style.setProperty('--dur',   `${2.5 + Math.random() * 3.5}s`);
    p.style.setProperty('--delay', `${Math.random() * 6}s`);
    p.style.left = `${Math.random() * 100}%`;
    p.style.top  = `${Math.random() * 80}%`;

    // Vary size and hue slightly
    const size = 2 + Math.random() * 4;
    p.style.width  = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = `hsl(${20 + Math.random()*20}, 40%, ${68 + Math.random()*14}%)`;

    container.appendChild(p);
  }
}


/* =========================================================
   6.  MUSIC TOGGLE
   ========================================================= */

let musicPlaying = false;

musicBtn.addEventListener('click', () => {
  if (!bgMusic.src || bgMusic.src === window.location.href) {
    // No music file attached — show a gentle reminder
    showMusicHint();
    return;
  }

  if (musicPlaying) {
    bgMusic.pause();
    musicIcon.textContent = '♪';
    musicBtn.classList.remove('playing');
    musicPlaying = false;
  } else {
    bgMusic.play().catch(() => showMusicHint());
    musicIcon.textContent = '♫';
    musicBtn.classList.add('playing');
    musicPlaying = true;
  }
});

function showMusicHint() {
  // Create a small toast
  let toast = document.getElementById('music-toast');
  if (toast) return;
  toast = document.createElement('div');
  toast.id = 'music-toast';
  toast.textContent = 'Add a music file to <audio id="bg-music">';
  toast.style.cssText = `
    position: fixed; bottom: 5.5rem; right: 2rem;
    background: rgba(248,244,238,0.95);
    color: #6e5d51;
    border: 1px solid #d0b49f;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 0.88rem;
    font-style: italic;
    box-shadow: 0 4px 18px rgba(138,111,92,0.18);
    z-index: 600;
    opacity: 0;
    transition: opacity 0.4s ease;
    max-width: 240px;
    text-align: center;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}


/* =========================================================
   7.  HOVER PARTICLES — Envelope area (extra detail)
   ========================================================= */

envelopeWrap.addEventListener('mouseenter', () => {
  const canvas = openingCanvas;
  const ctx = canvas.getContext('2d');
  const rect = envelopeWrap.getBoundingClientRect();

  // Spawn a few sparkle dots around the envelope on hover
  const sparkles = Array.from({ length: 10 }, () => ({
    x: rect.left + Math.random() * rect.width,
    y: rect.top  + Math.random() * rect.height,
    r: Math.random() * 2 + 0.5,
    alpha: 0.8,
    vy: (Math.random() - 0.5) * 1.2,
    vx: (Math.random() - 0.5) * 1.0,
  }));

  let life = 0;
  (function sparkle() {
    if (life > 40) return;
    life++;
    sparkles.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= 0.02;
      if (s.alpha <= 0) return;
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#e8c99a';
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(sparkle);
  })();
});