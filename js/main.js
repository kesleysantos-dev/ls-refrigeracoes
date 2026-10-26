/* =========================================================
   LS Refrigerações — interações
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  document.body.classList.add('is-loading');
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Preloader ---------- */
  const finishLoading = () => {
    $('#preloader')?.classList.add('is-done');
    document.body.classList.remove('is-loading');
    requestAnimationFrame(() => document.body.classList.add('is-ready'));
  };
  window.addEventListener('load', () => setTimeout(finishLoading, 350));
  setTimeout(finishLoading, 3500); // fallback se algo demorar

  /* ---------- Vídeo do hero: loop de ~15s com crossfade ---------- */
  const LOOP = 15;
  const FADE = 1.2;
  const videos = $$('.hero__video');
  let current = 0;
  let swapping = false;

  const loopEnd = v => Math.min(LOOP, (v.duration || LOOP) - 0.1);

  const swap = () => {
    if (swapping) return;
    swapping = true;
    const from = videos[current];
    const to = videos[1 - current];
    to.currentTime = 0;
    to.play().catch(() => {});
    to.classList.add('is-active');
    from.classList.remove('is-active');
    current = 1 - current;
    setTimeout(() => { from.pause(); swapping = false; }, FADE * 1000);
  };

  videos.forEach(v => {
    v.addEventListener('timeupdate', () => {
      if (v === videos[current] && v.currentTime >= loopEnd(v) - FADE) swap();
    });
    v.addEventListener('ended', () => v === videos[current] && swap());
  });
  if (videos[0]) videos[0].play().catch(() => {});

  /* ---------- Header ---------- */
  const header = $('#header');
  let lastY = 0;
  const onHeader = y => {
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > 500 && y > lastY && !nav.classList.contains('is-open'));
    lastY = y;
  };

  /* ---------- Menu mobile ---------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const toggleMenu = open => {
    nav.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- Link ativo ---------- */
  const navLinks = $$('.nav a:not(.btn)');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => sectionObs.observe(s));

  /* ---------- Reveal + contadores ---------- */
  const animateCount = el => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || 0, 10);
    const dur = 1800;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(dec).replace('.', ',');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      $$('[data-count]', e.target).forEach(animateCount);
      revealObs.unobserve(e.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .reveal-img').forEach(el => revealObs.observe(el));

  /* ---------- Frase palavra por palavra ---------- */
  const quote = $('.split-words');
  let words = [];
  if (quote) {
    quote.innerHTML = quote.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    words = $$('.w', quote);
  }

  /* ---------- Parallax + progresso (loop de scroll) ---------- */
  const heroMedia = $('[data-hero-parallax]');
  const heroContent = $('[data-hero-content]');
  const parallaxEls = $$('[data-parallax]');
  const parallaxBgs = $$('[data-parallax-bg]');
  const steps = $('#steps');
  const stepItems = steps ? $$('.step', steps) : [];

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    onHeader(y);
    if (reduceMotion) return;

    if (y < vh * 1.2) {
      heroMedia.style.transform = `translate3d(0, ${y * 0.35}px, 0) scale(${1 + y / vh * 0.08})`;
      heroContent.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      heroContent.style.opacity = Math.max(0, 1 - y / (vh * 0.75));
    }

    parallaxEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
      el.style.translate = `0 ${offset}px`;
    });

    parallaxBgs.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      el.style.transform = `translate3d(0, ${(r.top + r.height / 2 - vh / 2) * -0.25}px, 0)`;
    });

    if (words.length) {
      const r = quote.getBoundingClientRect();
      const p = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0), 1);
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    }

    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = Math.min(Math.max((vh * 0.75 - r.top) / (r.height + vh * 0.15), 0), 1);
      steps.style.setProperty('--progress', p);
      stepItems.forEach((s, i) => s.classList.toggle('is-on', p >= (i + 0.3) / stepItems.length));
    }
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  if (reduceMotion) words.forEach(w => w.classList.add('is-lit'));

  /* ---------- Tilt 3D nos cards ---------- */
  if (!isTouch && !reduceMotion) {
    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', `${(x - .5) * 10}deg`);
        card.style.setProperty('--rx', `${(.5 - y) * 10}deg`);
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    /* Botões magnéticos */
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * .25}px`);
        btn.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * .35}px`);
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--bx', '0px');
        btn.style.setProperty('--by', '0px');
      });
    });
  }

  /* ---------- Carrossel infinito (direita → esquerda) ---------- */
  const track = $('#carouselTrack');
  if (track) {
    const carousel = track.parentElement;
    [...track.children].forEach(s => track.appendChild(s.cloneNode(true)));

    const BASE_SPEED = 0.6; // px por frame
    let x = 0;
    let speed = BASE_SPEED;
    let targetSpeed = BASE_SPEED;
    let dragging = false;
    let dragStartX = 0;
    let dragStartPos = 0;
    let half = track.scrollWidth / 2;

    const wrap = () => {
      if (x <= -half) x += half;
      if (x > 0) x -= half;
    };

    const frame = () => {
      if (!dragging) {
        speed += (targetSpeed - speed) * 0.06;
        x -= speed;
      }
      wrap();
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      requestAnimationFrame(frame);
    };
    if (!reduceMotion) requestAnimationFrame(frame);

    carousel.addEventListener('pointerenter', () => { targetSpeed = BASE_SPEED * 0.25; });
    carousel.addEventListener('pointerleave', () => { targetSpeed = BASE_SPEED; dragging = false; carousel.classList.remove('is-dragging'); });
    carousel.addEventListener('pointerdown', e => {
      dragging = true;
      dragStartX = e.clientX;
      dragStartPos = x;
      carousel.classList.add('is-dragging');
      carousel.setPointerCapture(e.pointerId);
    });
    carousel.addEventListener('pointermove', e => {
      if (dragging) x = dragStartPos + (e.clientX - dragStartX);
    });
    const endDrag = () => { dragging = false; carousel.classList.remove('is-dragging'); };
    carousel.addEventListener('pointerup', endDrag);
    carousel.addEventListener('pointercancel', endDrag);
    window.addEventListener('resize', () => { half = track.scrollWidth / 2; });
    window.addEventListener('load', () => { half = track.scrollWidth / 2; });
  }

  /* ---------- Neve no hero ---------- */
  const canvas = $('#snow');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let flakes = [];
    let w, h, running = true;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, w / 14));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.8 + .4, s: Math.random() * .5 + .2,
        d: Math.random() * Math.PI * 2, o: Math.random() * .5 + .2
      }));
    };
    const draw = () => {
      if (running) {
        ctx.clearRect(0, 0, w, h);
        flakes.forEach(f => {
          f.y += f.s; f.d += .01; f.x += Math.sin(f.d) * .3;
          if (f.y > h) { f.y = -5; f.x = Math.random() * w; }
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,230,255,${f.o})`;
          ctx.fill();
        });
      }
      requestAnimationFrame(draw);
    };
    new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(canvas);
    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  /* ---------- Formulário → WhatsApp ---------- */
  const form = $('#form');
  const msg = $('#formMsg');
  const WHATSAPP = '5500000000000';
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    let ok = true;
    ['nome', 'telefone', 'servico'].forEach(n => {
      const field = form.elements[n];
      const bad = !String(data.get(n) || '').trim();
      field.closest('.field').classList.toggle('is-error', bad);
      if (bad) ok = false;
    });
    if (!ok) {
      msg.className = 'form__msg';
      msg.textContent = 'Preencha nome, telefone e serviço.';
      return;
    }
    const text = [
      'Olá, LS Refrigerações! Gostaria de um orçamento.',
      `*Nome:* ${data.get('nome')}`,
      `*Telefone:* ${data.get('telefone')}`,
      `*Serviço:* ${data.get('servico')}`,
      data.get('mensagem') ? `*Detalhes:* ${data.get('mensagem')}` : ''
    ].filter(Boolean).join('\n');
    msg.className = 'form__msg ok';
    msg.textContent = 'Abrindo o WhatsApp...';
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    form.reset();
  });
})();
