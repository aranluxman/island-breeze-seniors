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
  var closeMenu = function () { if (nav && nav.classList.contains('open')) setMenu(false, false); };
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

  /* ---------- Header scroll-edge fade ---------- */
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
    // The story line draws downward once the timeline arrives (it isn't a .reveal itself)
    each(document.querySelectorAll('.timeline'), function (el) { revealIO.observe(el); });
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

  /* ---------- Photo carousel: swipe or scroll natively; buttons step one photo at a time ---------- */
  var track = document.querySelector('.gallery-track');
  var controls = document.querySelector('.gallery-controls');
  if (track && controls) {
    var slides = track.querySelectorAll('.slide');
    var prev = controls.querySelector('[data-dir="-1"]');
    var next = controls.querySelector('[data-dir="1"]');
    var count = controls.querySelector('.g-count');
    var edge = function () { return parseFloat(getComputedStyle(track).paddingLeft) || 0; };
    var current = function () {
      var x = track.scrollLeft, best = 0;
      each(slides, function (s, i) { if (Math.abs(s.offsetLeft - edge() - x) < Math.abs(slides[best].offsetLeft - edge() - x)) best = i; });
      return best;
    };
    var dotsWrap = document.querySelector('.g-dots');
    var dots = [];
    var sync = function () {
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      var i = atEnd ? slides.length - 1 : current();
      count.textContent = (i + 1) + ' of ' + slides.length;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = atEnd;
      dots.forEach(function (d, j) { if (j === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    };
    var go = function (dir) {
      var i = Math.max(0, Math.min(slides.length - 1, current() + dir));
      track.scrollTo({ left: slides[i].offsetLeft - edge(), behavior: reduce ? 'auto' : 'smooth' });
    };
    // Dots: one 48px target per photo (shown on wider screens; phones use the "3 of 9" count)
    if (dotsWrap) {
      each(slides, function (sl, i) {
        var d = document.createElement('button');
        d.type = 'button'; d.className = 'g-dot';
        d.setAttribute('aria-label', 'Photo ' + (i + 1) + ' of ' + slides.length);
        d.addEventListener('click', function () { track.scrollTo({ left: sl.offsetLeft - edge(), behavior: reduce ? 'auto' : 'smooth' }); });
        dotsWrap.appendChild(d); dots.push(d);
      });
      dotsWrap.hidden = false;
    }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    var pending = false;
    track.addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { sync(); pending = false; });
    }, { passive: true });
    window.addEventListener('resize', sync);

    // Mouse drag (touch and trackpads already scroll natively): 1:1 tracking from the grab
    // point, then a momentum projection picks the photo the throw is heading for.
    var drag = null, moved = false;
    var project = function (v) { return (v / 1000) * 0.998 / (1 - 0.998); }; // px/s -> px
    track.classList.add('can-drag');
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, hist: [{ x: e.clientX, t: e.timeStamp }] };
      moved = false;
    });
    track.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!moved && Math.abs(dx) < 10) return; // small threshold before committing to a drag
      if (!moved) { moved = true; track.setPointerCapture(e.pointerId); track.classList.add('dragging'); }
      track.scrollLeft = drag.left - dx;
      drag.hist.push({ x: e.clientX, t: e.timeStamp });
      if (drag.hist.length > 5) drag.hist.shift();
    });
    var release = function () {
      if (!drag) return;
      var h = drag.hist, a = h[0], b = h[h.length - 1];
      var v = b.t > a.t ? -(b.x - a.x) / (b.t - a.t) * 1000 : 0; // scroll velocity, px/s
      drag = null;
      if (!moved) return;
      var aim = track.scrollLeft + project(v), best = 0;
      each(slides, function (sl, i) { if (Math.abs(sl.offsetLeft - edge() - aim) < Math.abs(slides[best].offsetLeft - edge() - aim)) best = i; });
      var from = track.scrollLeft;
      track.classList.remove('dragging');
      track.scrollLeft = from; // re-enabling snap must not jump; start the glide from where it is
      track.scrollTo({ left: slides[best].offsetLeft - edge(), behavior: reduce ? 'auto' : 'smooth' });
    };
    track.addEventListener('pointerup', release);
    track.addEventListener('pointercancel', release);
    // A drag shouldn't count as a click on anything inside the track.
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    controls.hidden = false;
    sync();
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


  /* ---------- Cursor glow (E5): CSS custom properties, rAF-throttled; mouse only, never with reduced motion ---------- */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!reduce) {
    each(document.querySelectorAll('.glow'), function (el) {
      var raf = 0, gx = 0, gy = 0;
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !finePointer.matches) return;
        gx = e.clientX; gy = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = el.getBoundingClientRect();
          el.style.setProperty('--gx', (gx - r.left).toFixed(0) + 'px');
          el.style.setProperty('--gy', (gy - r.top).toFixed(0) + 'px');
          el.classList.add('glowing');
        });
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('glowing'); });
    });
  }

  /* ---------- Panels (Join Now, Help): native <dialog> with focus trap, Escape, backdrop click,
     focus return, body scroll lock, and an exit along the same path as the entrance ---------- */
  var sheetMedia = window.matchMedia('(max-width: 640px)');
  var focusables = function (root) {
    return Array.prototype.filter.call(root.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), textarea, [tabindex="0"]'), function (el) {
      return el.offsetParent !== null && !el.closest('[hidden]');
    });
  };
  function openPanel(dlg, trigger) {
    if (!dlg || dlg.open) return;
    closeMenu();
    each(document.querySelectorAll('dialog.sheet[open]'), function (d) { closePanel(d, 'instant'); });
    dlg._trigger = trigger || document.activeElement;
    dlg.classList.remove('closing', 'dragging', 'settling', 'flinging');
    dlg.style.transform = '';
    dlg.showModal();
    doc.classList.add('has-modal');
    // Grow out of the control that opened it
    if (dlg._trigger && dlg._trigger.getBoundingClientRect) {
      var r = dlg.getBoundingClientRect(), b = dlg._trigger.getBoundingClientRect();
      dlg.style.setProperty('--ox', (b.left + b.width / 2 - r.left).toFixed(0) + 'px');
      dlg.style.setProperty('--oy', (b.top + b.height / 2 - r.top).toFixed(0) + 'px');
    }
    var title = dlg.querySelector('h2');
    title.setAttribute('tabindex', '-1');
    title.focus();
    updateLauncher();
  }
  // mode: undefined = animated; 'now' = no animation, focus returns; 'instant' = no animation, focus stays
  function closePanel(dlg, mode) {
    if (!dlg || !dlg.open || (dlg.classList.contains('closing') && mode === undefined)) return;
    var finish = function () {
      if (!dlg.open) return;
      dlg.classList.remove('closing', 'dragging', 'settling', 'flinging');
      dlg.style.transform = '';
      dlg.close();
      if (!document.querySelector('dialog.sheet[open]')) doc.classList.remove('has-modal');
      if (mode !== 'instant' && dlg._trigger && dlg._trigger.isConnected) dlg._trigger.focus();
      updateLauncher();
    };
    if (mode) { finish(); return; }
    dlg.classList.add('closing');
    var done = false;
    var end = function () { if (done) return; done = true; finish(); };
    dlg.addEventListener('animationend', end, { once: true });
    setTimeout(end, 450); // in case no animation runs
  }
  each(document.querySelectorAll('dialog.sheet'), function (dlg) {
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closePanel(dlg); }); // Escape
    dlg.addEventListener('close', function () {
      if (!document.querySelector('dialog.sheet[open]')) doc.classList.remove('has-modal');
      updateLauncher();
    });
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { closePanel(dlg); return; }
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect(); // a click on the dialog box itself, outside its content, is the backdrop
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closePanel(dlg);
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = focusables(dlg);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dlg.contains(document.activeElement) || document.activeElement.tagName === 'H2')) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Bottom sheet (phones): drag the handle or header down; follows the finger 1:1, then either
    // flings away with the throw's momentum or springs back with a slight bounce.
    var grabZones = dlg.querySelectorAll('.sheet-grab, .sheet-head');
    var drag = null;
    each(grabZones, function (zone) {
      zone.addEventListener('pointerdown', function (e) {
        if (!sheetMedia.matches || e.button > 0 || e.target.closest('button, a, input')) return;
        drag = { y: e.clientY, dy: 0, t: e.timeStamp, v: 0, id: e.pointerId };
        zone.setPointerCapture(e.pointerId);
        dlg.classList.add('dragging');
      });
      zone.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dy = Math.max(0, e.clientY - drag.y);
        var dt = Math.max(1, e.timeStamp - drag.t);
        drag.v = (dy - drag.dy) / dt * 1000; drag.dy = dy; drag.t = e.timeStamp;
        dlg.style.transform = 'translateY(' + dy + 'px)';
      });
      var release = function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var d = drag; drag = null;
        dlg.classList.remove('dragging');
        var h = dlg.offsetHeight;
        if (d.dy > h * 0.3 || (d.v > 700 && d.dy > 20)) {
          if (reduce) { closePanel(dlg, 'now'); return; }
          dlg.classList.add('flinging');
          dlg.style.transform = 'translateY(100%)';
          setTimeout(function () { closePanel(dlg, 'now'); }, 230);
        } else if (d.dy > 0) {
          if (!reduce) dlg.classList.add('settling');
          dlg.style.transform = '';
          setTimeout(function () { dlg.classList.remove('settling'); }, 520);
        }
      };
      zone.addEventListener('pointerup', release);
      zone.addEventListener('pointercancel', release);
    });
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-opens]');
    if (!t) return;
    var dlg = document.getElementById(t.getAttribute('data-opens'));
    if (!dlg || !dlg.showModal) return; // no <dialog> support: the link's own href still works
    e.preventDefault();
    if (dlg.id === 'join-panel') showView(dlg, 'choices', false);
    openPanel(dlg, t);
  });

  /* ---------- Join Now panel: three choices, or an inline message form ---------- */
  var joinPanel = document.getElementById('join-panel');
  function showView(dlg, name, focus) {
    each(dlg.querySelectorAll('.sheet-view'), function (v) {
      var on = v.getAttribute('data-view') === name;
      v.hidden = !on;
      v.classList.toggle('view-in', on && focus);
    });
    if (!focus) return;
    var target = name === 'message' ? dlg.querySelector('#j-name') : dlg.querySelector('[data-show="message"]');
    if (target) target.focus();
  }
  if (joinPanel) {
    joinPanel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-show]');
      if (b) showView(joinPanel, b.getAttribute('data-show'), true);
    });
  }
  function openJoinWithMessage(question, trigger) {
    if (!joinPanel) return;
    var msg = joinPanel.querySelector('#j-message');
    msg.value = question ? 'My question: ' + question : '';
    joinPanel.querySelector('[name="question_asked"]').value = question || '';
    joinPanel.querySelector('[name="sent_from"]').value = question ? 'Help assistant' : 'Join Now panel';
    showView(joinPanel, 'message', false);
    openPanel(joinPanel, trigger);
    joinPanel.querySelector('#j-name').focus();
  }

  // Sends any of the new forms through the SAME FormSubmit endpoint as the main contact form.
  var contactForm = document.getElementById('contact-form');
  function postForm(data) {
    var url = contactForm.getAttribute('action').replace('formsubmit.co/', 'formsubmit.co/ajax/');
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        // Only report success when the service confirms delivery.
        if (!res.ok || String(res.body.success) !== 'true') throw new Error('not delivered');
      });
  }

  var joinForm = document.getElementById('join-form');
  if (joinForm && contactForm && window.fetch && window.FormData) {
    var jStatus = joinForm.querySelector('.form-status');
    var jBtn = joinForm.querySelector('button[type="submit"]');
    var jBtnText = jBtn.querySelector('.btn-text');
    var jName = joinForm.querySelector('#j-name');
    var jPhone = joinForm.querySelector('#j-phone');
    var jEmail = joinForm.querySelector('#j-email');
    var jByPhone = joinForm.querySelector('#j-by-phone');
    var jEmailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); };
    var jPhoneOk = function (v) { return v.replace(/\D/g, '').length >= 10; };
    var jSync = function () {
      var call = jByPhone.checked;
      joinForm.querySelector('[data-req-phone]').textContent = call ? '(needed for a call back)' : '(optional)';
      joinForm.querySelector('[data-req-email]').textContent = call ? '(optional)' : '(needed to email you)';
    };
    each(joinForm.querySelectorAll('input[name="preferred_contact"]'), function (r) { r.addEventListener('change', jSync); });
    jSync();
    var jMark = function (el, bad) {
      el.setAttribute('aria-invalid', String(bad));
      document.getElementById(el.id + '-err').hidden = !bad;
    };
    var jValidate = function () {
      var call = jByPhone.checked;
      var badName = !jName.value.trim();
      var badPhone = call ? !jPhoneOk(jPhone.value) : (jPhone.value.trim() !== '' && !jPhoneOk(jPhone.value));
      var badEmail = call ? (jEmail.value.trim() !== '' && !jEmailOk(jEmail.value)) : !jEmailOk(jEmail.value);
      jMark(jName, badName); jMark(jPhone, badPhone); jMark(jEmail, badEmail);
      return badName ? jName : badPhone ? jPhone : badEmail ? jEmail : null;
    };
    var jShow = function (kind, html) {
      jStatus.className = 'form-status ' + kind;
      jStatus.innerHTML = html;
      jStatus.focus();
    };
    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = jValidate();
      if (bad) { bad.focus(); return; }
      if (joinForm.querySelector('#j-honey').value) return;
      jBtn.disabled = true;
      jBtnText.textContent = 'Sending…';
      var data = {};
      new FormData(joinForm).forEach(function (v, k) { if (v !== '' || k === '_honey') data[k] = v; });
      if (jEmail.value.trim()) data._replyto = jEmail.value.trim();
      postForm(data).then(function () {
        joinForm.reset(); jSync();
        [jName, jPhone, jEmail].forEach(function (el) { el.removeAttribute('aria-invalid'); });
        jShow('ok', 'Thank you &mdash; your message was sent. We&rsquo;ll be in touch soon. If it&rsquo;s urgent, please call <a href="tel:+14163197763">416-319-7763</a>.');
      }).catch(function () {
        jShow('err', 'Sorry, we couldn&rsquo;t send your message. Please call us at <a href="tel:+14163197763">416-319-7763</a> or email <a href="mailto:islandbreezeseniors@gmail.com">islandbreezeseniors@gmail.com</a>.');
      }).then(function () { jBtn.disabled = false; jBtnText.textContent = 'Send message'; });
    });
  }

  /* ---------- Help assistant (D): scripted, never guesses. Matches a question to data/faq.json
     by keywords, phrases, aliases and one-letter typos. Nothing is stored or sent anywhere. ---------- */
  var help = document.getElementById('help-panel');
  var launcher = document.querySelector('.help-launcher');
  var helpLog = help && help.querySelector('.help-log');
  var kb = null, kbLoading = null;
  var STOP = {};
  'a an the is are am be been i im you your youre we us our it its my me to of for in on at and or with do does did can could would should will what whats how which there this that please hi hello hey just know tell want like any some have has get go if so too also'.split(' ').forEach(function (w) { STOP[w] = 1; });
  var esc = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
  function norm(t) {
    t = ' ' + String(t).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    Object.keys(kb.aliases || {}).forEach(function (k) { t = t.split(' ' + k + ' ').join(' ' + kb.aliases[k] + ' '); });
    return t.replace(/-/g, ' ').replace(/\s+/g, ' ');
  }
  function lev1(a, b) { // true when a and b differ by at most one edit
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }
  function match(question) {
    var t = norm(question);
    var words = t.trim().split(' ').filter(function (w) { return w && !STOP[w]; });
    var best = null, bestScore = 0;
    kb.entries.forEach(function (entry) {
      var score = 0;
      entry.keywords.forEach(function (kw) {
        kw = norm(kw).trim();
        if (kw.indexOf(' ') > -1) { if (t.indexOf(' ' + kw + ' ') > -1) score += 3; return; }
        if (words.some(function (w) { return w === kw || w === kw + 's' || w + 's' === kw; })) score += 2;
        else if (kw.length >= 5 && words.some(function (w) { return w.length >= 4 && lev1(w, kw); })) score += 1;
      });
      if (score > bestScore) { best = entry; bestScore = score; }
    });
    return bestScore >= 2 ? best : null;
  }
  function loadKb() {
    if (kbLoading) return kbLoading;
    kbLoading = fetch('data/faq.json').then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) { kb = j; renderChips(); })
      .catch(function () { kbLoading = null; addBot('<p>Sorry, the quick answers didn&rsquo;t load. A real person can help:</p>', ''); });
    return kbLoading;
  }
  function renderChips() {
    var wrap = help.querySelector('.help-chips');
    if (!wrap || wrap.children.length) return;
    kb.suggest.forEach(function (id) {
      var entry = kb.entries.filter(function (x) { return x.id === id; })[0];
      if (!entry) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'help-chip'; b.textContent = entry.q;
      b.addEventListener('click', function () { ask(entry.q); });
      wrap.appendChild(b);
    });
  }
  function actions(question) {
    var body = question ? '\n\nMy question: ' + question + '\n' : '';
    return '<div class="msg-actions">' +
      '<a class="btn btn-primary" href="tel:+14163197763"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Call 416-319-7763</a>' +
      '<a class="btn btn-ghost" href="mailto:islandbreezeseniors@gmail.com?subject=' + encodeURIComponent('Question from the website') + '&amp;body=' + encodeURIComponent(body) + '"><svg class="ico" aria-hidden="true"><use href="#i-mail"/></svg>Email us</a>' +
      '<button class="btn btn-ghost" type="button" data-send-q="' + esc(question || '') + '"><svg class="ico" aria-hidden="true"><use href="#a-chat"/></svg>Send a message</button>' +
      '</div>';
  }
  function addMsg(cls, html) {
    var m = document.createElement('div');
    m.className = 'msg ' + cls + (reduce ? '' : ' msg-in');
    m.innerHTML = html;
    helpLog.appendChild(m);
    return m;
  }
  function addBot(html, question) { return addMsg('msg-bot', html + actions(question)); }
  function ask(question) {
    question = String(question).trim().slice(0, 300);
    if (!question) return;
    var user = addMsg('msg-user', '<p>' + esc(question) + '</p>');
    var reply;
    if (/^(thanks|thank you|thx|ty)\b/i.test(question)) {
      reply = addMsg('msg-bot', '<p>You&rsquo;re welcome! Ask anything else, or reach a real person here:</p>' + actions(''));
    } else if (/^(hi|hello|hey|good (morning|afternoon|evening))\W*$/i.test(question)) {
      reply = addMsg('msg-bot', '<p>Hello! Tap one of the questions above, or type your own question below.</p>');
    } else {
      var entry = match(question);
      reply = entry
        ? addBot('<p>' + entry.answer + '</p>', question)
        : addBot('<p>Sorry, I don&rsquo;t have an answer to that on this website, and I don&rsquo;t want to guess. A real person can help:</p>', question);
    }
    user.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    return reply;
  }
  if (help && helpLog && launcher && window.fetch) {
    launcher.hidden = false;
    launcher.addEventListener('click', loadKb);
    help.querySelector('.help-ask').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = help.querySelector('#help-q');
      var q = input.value;
      if (!q.trim()) { input.focus(); return; }
      input.value = '';
      (kb ? Promise.resolve() : loadKb()).then(function () { if (kb) ask(q); });
    });
    helpLog.addEventListener('click', function (e) {
      var b = e.target.closest('[data-send-q]');
      if (!b) return;
      var q = b.getAttribute('data-send-q');
      closePanel(help, 'instant');
      openJoinWithMessage(q, launcher);
    });
  }

  // The launcher steps aside over the contact form and footer, and while a panel is open.
  var launcherBlocked = {};
  function updateLauncher() {
    if (!launcher || launcher.hidden) return;
    var away = launcherBlocked.form || launcherBlocked.footer || !!document.querySelector('dialog.sheet[open]');
    launcher.classList.toggle('away', away);
    launcher.classList.toggle('show', !away);
  }
  if (launcher && hasIO) {
    var watch = function (el, key) {
      if (!el) return;
      new IntersectionObserver(function (e) { launcherBlocked[key] = e[0].isIntersecting; updateLauncher(); }).observe(el);
    };
    watch(document.getElementById('contact'), 'form');
    watch(document.querySelector('.site-footer'), 'footer');
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
