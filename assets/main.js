(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const mq = (q) => window.matchMedia(q).matches;
  const touch = mq('(hover: none)');
  const reduce = mq('(prefers-reduced-motion: reduce)');
  const GAP = 18;

  // Foto da hero proporcional ao bloco de texto (desktop/tablet)
  const heroText = $('.hero__text');
  const heroImg = $('.hero__photo img');
  const heroGrid = $('.hero__grid');
  const fitHero = () => {
    if (!heroText || !heroImg) return;
    if (window.innerWidth <= 860) { heroImg.style.height = ''; return; }
    const cs = getComputedStyle(heroGrid);
    const pb = parseFloat(cs.paddingBottom) || 0;
    const col = parseFloat(cs.gridTemplateColumns.split(' ')[1]) || 0;
    heroImg.style.height = Math.round(Math.min(heroText.offsetHeight * 1.1 + pb, col * 1.5, 640)) + 'px';
  };
  fitHero();
  if (heroText && 'ResizeObserver' in window) new ResizeObserver(fitHero).observe(heroText);
  if (document.fonts) document.fonts.ready.then(fitHero);

  // Carrossel de consórcios em looping (1 card por gesto)
  const track = $('.cons__track');
  if (track) {
    const items = $$('.cons__item', track);
    const n = items.length;
    const clone = (el) => {
      const c = el.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
      return c;
    };
    items.forEach((el) => el.querySelectorAll('img').forEach((im) => { im.loading = 'eager'; }));
    items.forEach((el) => track.appendChild(clone(el)));
    items.slice().reverse().forEach((el) => track.insertBefore(clone(el), track.firstChild));

    const stepW = () => track.children[0].getBoundingClientRect().width + GAP;
    const jump = (x) => {
      track.style.scrollBehavior = 'auto';
      track.scrollLeft = x;
      track.style.scrollBehavior = '';
    };
    const normalize = () => {
      const s = stepW();
      const idx = ((Math.round(track.scrollLeft / s) % n) + n) % n;
      const target = (n + idx) * s;
      if (Math.abs(track.scrollLeft - target) > 2) jump(target);
    };
    let target = null;
    const go = (dir) => {
      const s = stepW();
      if (target === null) { normalize(); target = Math.round(track.scrollLeft / s); }
      target += dir;
      if (target < 1 || target > 3 * n - 2) { target = null; return; }
      track.scrollTo({ left: target * s, behavior: reduce ? 'auto' : 'smooth' });
    };
    $('.cons__arrow--prev').addEventListener('click', () => go(-1));
    $('.cons__arrow--next').addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    let sx = null, sy = 0, swiping = false, startLeft = 0, scrollT;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollT);
      scrollT = setTimeout(() => { if (sx === null) { target = null; normalize(); } }, 180);
    }, { passive: true });
    track.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = false; startLeft = track.scrollLeft; }, { passive: true });
    track.addEventListener('touchmove', (e) => {
      if (sx === null) return;
      const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
      if (!swiping && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) swiping = true;
      if (swiping) e.preventDefault();
    }, { passive: false });
    track.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (swiping && Math.abs(dx) > 30) {
        const s = stepW();
        target = null;
        track.scrollTo({ left: (Math.round(startLeft / s) + (dx < 0 ? 1 : -1)) * s, behavior: 'smooth' });
      }
      sx = null; swiping = false;
    }, { passive: true });
    window.addEventListener('resize', normalize);
    requestAnimationFrame(() => jump(n * stepW()));
  }

  // Carrossel de avaliações
  const vp = $('.reviews__viewport');
  const rt = $('.reviews__track');
  if (vp && rt) {
    const cards = $$('.review', rt);
    let i = 0, timer = null;
    const per = () => Math.max(1, Math.round((vp.clientWidth + GAP) / (cards[0].offsetWidth + GAP)));
    const apply = (animate = true) => {
      const max = Math.max(0, cards.length - per());
      if (i > max) i = 0;
      if (i < 0) i = max;
      rt.style.transition = animate ? '' : 'none';
      rt.style.transform = 'translate3d(' + (-i * (cards[0].offsetWidth + GAP)) + 'px,0,0)';
      cards.forEach((c, k) => c.setAttribute('aria-hidden', k < i || k >= i + per() ? 'true' : 'false'));
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const play = () => { if (!touch && !reduce && !timer) timer = setInterval(() => { i++; apply(); }, 5200); };
    $$('.reviews__arrows button').forEach((b) => b.addEventListener('click', () => { stop(); i += Number(b.dataset.dir); apply(); }));
    const region = $('.reviews');
    region.addEventListener('mouseenter', stop);
    region.addEventListener('focusin', stop);
    let tx = null, ty = 0, sw = false;
    vp.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; sw = false; }, { passive: true });
    vp.addEventListener('touchmove', (e) => {
      if (tx === null) return;
      const dx = e.touches[0].clientX - tx, dy = e.touches[0].clientY - ty;
      if (!sw && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) sw = true;
      if (sw) e.preventDefault();
    }, { passive: false });
    vp.addEventListener('touchend', (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) { stop(); i += dx < 0 ? 1 : -1; apply(); }
      tx = null; sw = false;
    }, { passive: true });
    window.addEventListener('resize', () => apply(false));
    apply(false);
    play();
  }

  // "Para quem é": destaque automático em telas sem mouse
  if (touch && !reduce) {
    const chips = $$('.chip');
    let c = -1;
    setInterval(() => {
      if (chips[c]) chips[c].classList.remove('is-on');
      c = (c + 1) % chips.length;
      chips[c].classList.add('is-on');
    }, 1100);
  }
})();
