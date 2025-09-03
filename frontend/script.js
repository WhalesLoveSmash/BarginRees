'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // ============ Tiny helpers ============
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersNoMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============ Year ============
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ============ Smooth focus after in-page nav (a11y polish) ============
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = $(id);
      if (!target) return;
      // let CSS do smooth-scrolling; then move focus for keyboard users
      setTimeout(() => {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }, 250);
    });
  });

  // ============ Sticky header shadow ============
  const header = $('.site-header');
  const updateHeader = () => {
    if (!header) return;
    const on = window.scrollY > 4;
    header.style.boxShadow = on ? '0 8px 24px rgba(0,0,0,.06)' : 'none';
    header.style.background = on ? 'rgba(255,255,255,.75)' : 'transparent';
    header.style.backdropFilter = on ? 'saturate(120%) blur(8px)' : 'none';
    header.style.transition = 'box-shadow .2s ease, background .2s ease, backdrop-filter .2s ease';
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // ============ Toast system ============
  const toastHost = document.createElement('div');
  Object.assign(toastHost.style, {
    position: 'fixed', inset: 'auto 0 18px 0', display: 'grid', placeItems: 'center',
    pointerEvents: 'none', zIndex: 9999
  });
  document.body.appendChild(toastHost);

  function showToast(message, subtype = 'pink', timeout = 2800) {
    const t = document.createElement('div');
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    Object.assign(t.style, {
      pointerEvents: 'auto', padding: '12px 16px', margin: '6px', borderRadius: '14px',
      fontWeight: '700', boxShadow: '0 14px 30px rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.12)',
      backdropFilter: 'saturate(130%) blur(6px)', transition: 'transform .18s ease, opacity .18s ease'
    });
    if (subtype === 'pink') {
      t.style.background = 'linear-gradient(180deg, #ec4899, #be185d)'; t.style.color = '#fff';
    } else { t.style.background = 'rgba(17,19,26,.86)'; t.style.color = 'var(--fg, #e7e9ee)'; }
    t.textContent = message; t.style.transform = 'translateY(10px)'; t.style.opacity = '0';
    toastHost.appendChild(t);
    requestAnimationFrame(() => { t.style.transform = 'translateY(0)'; t.style.opacity = '1'; });
    const dismiss = () => { t.style.transform = 'translateY(6px)'; t.style.opacity = '0'; setTimeout(() => t.remove(), 180); };
    if (timeout > 0) setTimeout(dismiss, timeout);
    t.addEventListener('click', dismiss);
    window.addEventListener('keydown', (ev) => ev.key === 'Escape' && dismiss(), { once: true, capture: true });
  }

  // ============ Reveal-on-enter (IO) ============
  const toReveal = ['.hero-inner', '.section-head', '.card'].flatMap(sel => $$(sel));
  const revealOnce = (el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity .45s ease, transform .45s ease';
  };
  const revealDo = (el) => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  };
  if (!prefersNoMotion && 'IntersectionObserver' in window) {
    toReveal.forEach(revealOnce);
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) { revealDo(ent.target); obs.unobserve(ent.target); }
      });
    }, { threshold: 0.12 });
    toReveal.forEach(el => io.observe(el));
  }

  // ============ Button ripple ============
  function attachRipple(btn) {
    btn.style.position ||= 'relative';
    btn.style.overflow ||= 'hidden';
    btn.addEventListener('click', (e) => {
      if (prefersNoMotion) return;
      const r = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      Object.assign(r.style, {
        position: 'absolute', left: `${e.clientX - rect.left - size/2}px`, top: `${e.clientY - rect.top - size/2}px`,
        width: `${size}px`, height: `${size}px`, borderRadius: '50%',
        background: 'rgba(255,255,255,.35)', transform: 'scale(0)', opacity: '0.9',
        transition: 'transform .45s ease, opacity .6s ease', pointerEvents: 'none'
      });
      btn.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = 'scale(1)'; r.style.opacity = '0'; });
      setTimeout(() => r.remove(), 650);
    });
  }
  $$('.button').forEach(attachRipple);

  // ============ 3D tilt on product card ============
  const card = $('.card');
  if (card && !prefersNoMotion) {
    const media = $('.card-media', card);
    const MAX = 10; // deg
    const resetTilt = () => { card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)'; };
    card.style.transition = 'transform .15s ease';
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;  // 0..1
      const y = (e.clientY - r.top)  / r.height; // 0..1
      const rx = (0.5 - y) * MAX;
      const ry = (x - 0.5) * MAX;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      if (media) media.style.willChange = 'transform';
    });
    ['pointerleave','blur'].forEach(ev => card.addEventListener(ev, resetTilt));
  }

  // ============ Simple confetti on Bargain ============
  function confettiBurst(x, y) {
    if (prefersNoMotion) return;
    const cnv = document.createElement('canvas');
    const ctx = cnv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = cnv.width = Math.ceil(innerWidth * dpr);
    const H = cnv.height = Math.ceil(innerHeight * dpr);
    Object.assign(cnv.style, { position:'fixed', inset:0, pointerEvents:'none', zIndex:9998 });
    document.body.appendChild(cnv);

    const colors = ['#ec4899','#f472b6','#f43f5e','#22c55e','#3b82f6','#f59e0b'];
    const N = 32;
    const parts = Array.from({length:N}, () => ({
      x: x * dpr, y: y * dpr, r: Math.random()*6+4, a: Math.random()*Math.PI*2,
      vx: (Math.random()-0.5)*5, vy: -Math.random()*6-3, g: 0.15+Math.random()*0.1,
      c: colors[Math|Math.random()*colors.length]
    }));
    let t = 0;
    (function tick(){
      ctx.clearRect(0,0,W,H);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.a += 0.1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r);
        ctx.restore();
      });
      t++;
      if (t < 60) requestAnimationFrame(tick); else cnv.remove();
    })();
  }

  // ============ Bargain / Buy handlers (+count) ============
  let bargainClicks = Number(localStorage.getItem('br_bargain_clicks') || '0');

  function updateBargainBadge() {
    const btn = $('[data-action="bargain"]');
    if (!btn) return;
    let badge = btn.querySelector('.br-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'br-badge';
      Object.assign(badge.style, {
        marginLeft: '8px', fontSize: '12px', fontWeight: '700',
        padding: '2px 6px', borderRadius: '999px',
        background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.24)'
      });
      btn.appendChild(badge);
    }
    badge.textContent = `${bargainClicks} bargained`;
  }
  updateBargainBadge();

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button,[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'bargain') {
      bargainClicks += 1;
      localStorage.setItem('br_bargain_clicks', String(bargainClicks));
      updateBargainBadge();
      localStorage.setItem('br_last_action', 'bargain');
      showToast('Offer sent — we’ll see what we can do 💸', 'pink');
      // confetti from button center
      const r = btn.getBoundingClientRect();
      confettiBurst(r.left + r.width/2, r.top + r.height/2);
    }
    if (action === 'buy') {
      localStorage.setItem('br_last_action', 'buy');
      showToast('Buy flow opens at launch — thanks for the support ❤️', 'ghost');
    }
  });

  // ============ Shortcuts ============
  window.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'b') {
      const bargainBtn = $('[data-action="bargain"]');
      if (bargainBtn) { bargainBtn.focus(); showToast('Bargain shortcut', 'ghost', 1200); }
    } else if (k === 's') {
      const store = $('#store');
      if (store) { store.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
  });
});