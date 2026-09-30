/* Island Breeze — small, dependency-free enhancements.
   Everything here is progressive: without JS the page is complete and every link works. */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var nav = document.getElementById('nav');
  var menuBtn = document.querySelector('.menu-btn');
  var menuLabel = menuBtn && menuBtn.querySelector('.menu-label');
  var mobileMenu = window.matchMedia('(max-width: 960px)');

  /* ---------- Mobile menu: focus trap, Escape to close, body scroll lock ---------- */
  function focusables() {
    return [menuBtn].concat(Array.prototype.slice.call(nav.querySelectorAll('a')));
  }
  function setMenu(open, returnFocus) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    if (open) nav.querySelector('a').focus();
    else if (returnFocus) menuBtn.focus();
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true', true);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && mobileMenu.matches) setMenu(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (!nav.classList.contains('open')) return;
      if (e.key === 'Escape') { setMenu(false, true); return; }
      if (e.key === 'Tab') {
        var items = focusables();
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    mobileMenu.addEventListener('change', function (e) { if (!e.matches) setMenu(false, false); });
  }

  /* ---------- Header gains a soft shadow once the page scrolls ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Map loads only when it's about to scroll into view ---------- */
  var map = document.querySelector('.map[data-map-src]');
  function loadMap() {
    if (!map || map.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = map.getAttribute('data-map-src');
    f.title = 'Map showing 4460 14th Avenue, Markham';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    map.appendChild(f);
  }
  if (map) {
    if ('IntersectionObserver' in window) {
      var mapIO = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { loadMap(); mapIO.disconnect(); }
      }, { rootMargin: '300px 0px' });
      mapIO.observe(map);
    } else {
      loadMap();
    }
  }


  /* ---------- Scroll reveal: once, at 12% visible, grid items staggered 0.07s ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window && reveals.length) {
    Array.prototype.forEach.call(document.querySelectorAll('ul[role="list"]'), function (list) {
      Array.prototype.forEach.call(list.children, function (item, i) {
        if (item.classList.contains('reveal')) item.style.setProperty('--delay', (i * 0.07).toFixed(2) + 's');
      });
    });
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); revealIO.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(reveals, function (el) { revealIO.observe(el); });
    document.documentElement.classList.add('reveal-ready');
  }

  /* ---------- Scroll-spy: aria-current on the nav link for the section in view ---------- */
  var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    var visible = {};
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var current = null;
      sections.forEach(function (sec) { if (visible[sec.id] && !current) current = sec.id; });
      links.forEach(function (a) {
        if (current && a.getAttribute('href') === '#' + current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (sec) { spyIO.observe(sec); });
  }


  /* ---------- "Talk to us" / "Volunteer" buttons pre-fill the message ---------- */
  var msg = document.getElementById('f-message');
  Array.prototype.forEach.call(document.querySelectorAll('a[data-topic]'), function (a) {
    a.addEventListener('click', function () {
      if (msg && !msg.value.trim()) msg.value = a.getAttribute('data-topic') + ' ';
    });
  });

  /* ---------- Contact form: friendly validation + background send via FormSubmit ---------- */
  var form = document.getElementById('contact-form');
  if (form && window.fetch && window.FormData) {
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var btnText = submitBtn.querySelector('.btn-text');
    var checks = [
      { el: form.querySelector('#f-name'), ok: function (v) { return v.trim().length > 0; } },
      { el: form.querySelector('#f-email'), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      { el: form.querySelector('#f-message'), ok: function (v) { return v.trim().length > 0; } }
    ];
    function showStatus(kind, html) {
      status.className = 'form-status ' + kind;
      status.innerHTML = html;
      status.focus();
    }
    function validate() {
      var firstBad = null;
      checks.forEach(function (c) {
        var bad = !c.ok(c.el.value);
        c.el.setAttribute('aria-invalid', String(bad));
        document.getElementById(c.el.id + '-err').hidden = !bad;
        if (bad && !firstBad) firstBad = c.el;
      });
      return firstBad;
    }
    checks.forEach(function (c) {
      c.el.addEventListener('blur', function () {
        if (c.el.getAttribute('aria-invalid') === 'true') validate();
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad) { bad.focus(); return; }
      if (form.querySelector('#f-honey').value) return; // bot
      submitBtn.disabled = true;
      btnText.textContent = 'Sending\u2026';
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (!data.email_list) data.email_list = 'No';
      fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (!res.ok || String(res.body.success) !== 'true') throw new Error(res.body.message || 'Send failed');
          form.reset();
          checks.forEach(function (c) { c.el.removeAttribute('aria-invalid'); });
          showStatus('ok', 'Thank you! Your message has been sent. We\u2019ll get back to you soon. If it\u2019s urgent, please call <a href="tel:+14163197763">416-319-7763</a>.');
        })
        .catch(function () {
          showStatus('err', 'Sorry, your message didn\u2019t go through. Please try again in a moment, or call us at <a href="tel:+14163197763">416-319-7763</a>.');
        })
        .then(function () {
          submitBtn.disabled = false;
          btnText.textContent = 'Send message';
        });
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
