'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // ===== Helpers =====
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ===== Year =====
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Smooth focus after in-page nav (a11y polish) =====
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = $(id);
      if (!target) return;

      // Allow native smooth scroll via CSS, then focus section for keyboard users
      setTimeout(() => {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }, 250);
    });
  });

  // ===== Toast system =====
  const toastHost = document.createElement('div');
  toastHost.style.position = 'fixed';
  toastHost.style.inset = 'auto 0 18px 0';
  toastHost.style.display = 'grid';
  toastHost.style.placeItems = 'center';
  toastHost.style.pointerEvents = 'none';
  toastHost.style.zIndex = '9999';
  document.body.appendChild(toastHost);

  function showToast(message, subtype = 'pink', timeout = 2800) {
    const t = document.createElement('div');
    t.role = 'status';
    t.ariaLive = 'polite';
    t.style.pointerEvents = 'auto';
    t.style.padding = '12px 16px';
    t.style.margin = '6px';
    t.style.borderRadius = '14px';
    t.style.fontWeight = '700';
    t.style.boxShadow = '0 14px 30px rgba(0,0,0,.35)';
    t.style.border = '1px solid rgba(255,255,255,.12)';
    t.style.backdropFilter = 'saturate(130%) blur(6px)';
    t.style.transition = 'transform .18s ease, opacity .18s ease';

    if (subtype === 'pink') {
      t.style.background = 'linear-gradient(180deg, #ec4899, #be185d)';
      t.style.color = '#fff';
    } else if (subtype === 'ghost') {
      t.style.background = 'rgba(17,19,26,.8)';
      t.style.color = 'var(--fg, #e7e9ee)';
    }

    t.textContent = message;
    t.style.transform = 'translateY(10px)';
    t.style.opacity = '0';
    toastHost.appendChild(t);

    requestAnimationFrame(() => {
      t.style.transform = 'translateY(0)';
      t.style.opacity = '1';
    });

    const dismiss = () => {
      t.style.transform = 'translateY(6px)';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 180);
      window.removeEventListener('keydown', escListener, true);
    };
    const escListener = (ev) => { if (ev.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', escListener, true);

    if (timeout > 0) setTimeout(dismiss, timeout);
    t.addEventListener('click', dismiss);
  }

  // ===== Bargain / Buy handlers =====
  let bargainClicks = Number(localStorage.getItem('br_bargain_clicks') || '0');

  function updateBargainBadge() {
    // Optional: show count on the Bargain button as a tiny badge for social proof
    const btn = $('[data-action="bargain"]');
    if (!btn) return;
    let badge = btn.querySelector('.br-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'br-badge';
      Object.assign(badge.style, {
        marginLeft: '8px',
        fontSize: '12px',
        fontWeight: '700',
        padding: '2px 6px',
        borderRadius: '999px',
        background: 'rgba(255,255,255,.18)',
        border: '1px solid rgba(255,255,255,.24)'
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
    }
    if (action === 'buy') {
      localStorage.setItem('br_last_action', 'buy');
      showToast('Buy flow opens at launch — thanks for the support ❤️', 'ghost');
    }
  });

  // ===== Launch banner date sanity (optional formatting) =====
  // If you ever change the date in HTML, we could parse & pretty-print here.
  // Keeping it static for now because you requested a specific brand line.

  // ===== Small UX niceties =====
  // Press "b" to focus Bargain, "s" to jump to Store (optional shortcuts)
  window.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key.toLowerCase() === 'b') {
      const bargainBtn = $('[data-action="bargain"]');
      if (bargainBtn) { bargainBtn.focus(); showToast('Bargain shortcut', 'ghost', 1200); }
    } else if (e.key.toLowerCase() === 's') {
      const store = $('#store');
      if (store) { store.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
  });
});