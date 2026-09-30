/* Island Breeze — small, dependency-free enhancements.
   Everything is progressive: without JS the page is complete and every link works. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var header = document.querySelector('.site-header');
  var nav = document.getElementById('nav');
  var menuBtn = document.querySelector('.menu-btn');
  var menuLabel = menuBtn && menuBtn.querySelector('.menu-label');
  var mobileMenu = window.matchMedia('(max-width: 1060px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* ---------- Mobile menu: focus trap, Escape to close, body scroll lock ---------- */
  function setMenu(open, returnFocus) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    if (open) nav.querySelector('a').focus();
    else if (returnFocus) menuBtn.focus();
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true', true); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a') && mobileMenu.matches) setMenu(false, false); });
    document.addEventListener('keydown', function (e) {
      if (!nav.classList.contains('open')) return;
      if (e.key === 'Escape') { setMenu(false, true); return; }
      if (e.key === 'Tab') {
        var items = [menuBtn].concat(Array.prototype.slice.call(nav.querySelectorAll('a')));
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    mobileMenu.addEventListener('change', function (e) { if (!e.matches) setMenu(false, false); });
  }

  /* ---------- Header shadow, timeline progress ---------- */
  var timeline = document.querySelector('.timeline');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
      if (timeline && !reduce) {
        var r = timeline.getBoundingClientRect();
        var p = (window.innerHeight * 0.6 - r.top) / r.height;
        timeline.style.setProperty('--progress', Math.max(0, Math.min(1, p)).toFixed(3));
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal: once, at 12% visible; list items staggered ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (!reduce && hasIO && reveals.length) {
    each(document.querySelectorAll('.steps, .timeline, .activity-grid, .supporter-cols'), function (list) {
      each(list.children, function (item, i) {
        if (item.classList.contains('reveal')) item.style.setProperty('--delay', (i % 4 * 0.08).toFixed(2) + 's');
      });
    });
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); revealIO.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    each(reveals, function (el) { revealIO.observe(el); });
    doc.classList.add('reveal-ready');
  }

  /* ---------- Scroll-spy: aria-current on the nav link for the section in view ---------- */
  var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if (sections.length && hasIO) {
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
    if (hasIO) {
      var mapIO = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { loadMap(); mapIO.disconnect(); }
      }, { rootMargin: '300px 0px' });
      mapIO.observe(map);
    } else { loadMap(); }
  }

  /* ---------- Mobile call bar: appears after the hero, hides over the form and while typing ---------- */
  var callBar = document.querySelector('.call-bar');
  var hero = document.querySelector('.hero');
  var formWrap = document.getElementById('contact');
  if (callBar && hero && hasIO) {
    var pastHero = false, nearForm = false, typing = false;
    var update = function () {
      var show = pastHero && !nearForm && !typing;
      callBar.classList.toggle('show', show);
      document.body.classList.toggle('has-callbar', show);
    };
    new IntersectionObserver(function (e) { pastHero = !e[0].isIntersecting; update(); }).observe(hero);
    if (formWrap) new IntersectionObserver(function (e) { nearForm = e[0].isIntersecting; update(); }, { rootMargin: '0px 0px 120px 0px' }).observe(formWrap);
    document.addEventListener('focusin', function (e) { typing = !!e.target.closest('input, textarea, select'); update(); });
    document.addEventListener('focusout', function () { typing = false; setTimeout(update, 0); });
  }

  /* ---------- Contact form: callback or email, honest success/error ---------- */
  var form = document.getElementById('contact-form');
  if (form && window.fetch && window.FormData) {
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var btnText = submitBtn.querySelector('.btn-text');
    var name = form.querySelector('#f-name');
    var phone = form.querySelector('#f-phone');
    var email = form.querySelector('#f-email');
    var byPhone = form.querySelector('#f-by-phone');
    var reqPhone = form.querySelector('[data-req-phone]');
    var reqEmail = form.querySelector('[data-req-email]');
    var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); };
    var phoneOk = function (v) { return v.replace(/\D/g, '').length >= 10; };

    function syncRequired() {
      var wantsCall = byPhone.checked;
      reqPhone.textContent = wantsCall ? '(needed for a call back)' : '(optional)';
      reqEmail.textContent = wantsCall ? '(optional)' : '(needed to email you)';
      phone.required = wantsCall; email.required = !wantsCall;
    }
    each(form.querySelectorAll('input[name="preferred_contact"]'), function (r) { r.addEventListener('change', syncRequired); });
    syncRequired();

    function mark(el, bad) {
      el.setAttribute('aria-invalid', String(bad));
      document.getElementById(el.id + '-err').hidden = !bad;
    }
    function validate() {
      var wantsCall = byPhone.checked;
      var badName = !name.value.trim();
      var badPhone = wantsCall ? !phoneOk(phone.value) : (phone.value.trim() !== '' && !phoneOk(phone.value));
      var badEmail = wantsCall ? (email.value.trim() !== '' && !emailOk(email.value)) : !emailOk(email.value);
      mark(name, badName); mark(phone, badPhone); mark(email, badEmail);
      return badName ? name : badPhone ? phone : badEmail ? email : null;
    }
    [name, phone, email].forEach(function (el) {
      el.addEventListener('blur', function () { if (el.getAttribute('aria-invalid') === 'true') validate(); });
    });
    function showStatus(kind, html) {
      status.className = 'form-status ' + kind;
      status.innerHTML = html;
      status.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad) { bad.focus(); return; }
      if (form.querySelector('#f-honey').value) return;
      submitBtn.disabled = true;
      btnText.textContent = 'Sending…';
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (email.value.trim()) data._replyto = email.value.trim();
      fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          // Only report success when the service confirms delivery.
          if (!res.ok || String(res.body.success) !== 'true') throw new Error('not delivered');
          form.reset(); syncRequired();
          [name, phone, email].forEach(function (el) { el.removeAttribute('aria-invalid'); });
          showStatus('ok', 'Thank you &mdash; your message was sent. We&rsquo;ll be in touch soon. If it&rsquo;s urgent, please call <a href="tel:+14163197763">416-319-7763</a>.');
        })
        .catch(function () {
          showStatus('err', 'Sorry, we couldn&rsquo;t send your message. Please try again, or call us at <a href="tel:+14163197763">416-319-7763</a>.');
        })
        .then(function () { submitBtn.disabled = false; btnText.textContent = 'Send message'; });
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
