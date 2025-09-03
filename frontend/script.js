'use strict';

// Run after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const byId = id => document.getElementById(id);

  const app = byId('app');
  const year = byId('year');
  if (year) year.textContent = new Date().getFullYear();

  // Example: add a little “ready” notice
  if (app) {
    const notice = document.createElement('div');
    notice.className = 'notice';
    notice.textContent = 'Ready.';
    app.appendChild(notice);
  }

  // Tiny event delegation helper
  function on(event, selector, handler) {
    document.addEventListener(event, e => {
      const target = e.target.closest(selector);
      if (target) handler(e, target);
    });
  }

  // Expose a small app namespace if you want it
  window.App = { $, byId, on };
});