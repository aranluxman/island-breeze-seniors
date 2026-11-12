/* Island Breeze: small, dependency-free enhancements.
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
    each(document.querySelectorAll('.steps, .timeline, .past-grid, .supporter-cols'), function (list) {
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
          showStatus('ok', 'Thank you, your message was sent. We&rsquo;ll be in touch soon. If it&rsquo;s urgent, please call <a href="tel:+14163197763">416-319-7763</a>.');
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
        jShow('ok', 'Thank you, your message was sent. We&rsquo;ll be in touch soon. If it&rsquo;s urgent, please call <a href="tel:+14163197763">416-319-7763</a>.');
      }).catch(function () {
        jShow('err', 'Sorry, we couldn&rsquo;t send your message. Please call us at <a href="tel:+14163197763">416-319-7763</a> or email <a href="mailto:islandbreezeseniors@gmail.com">islandbreezeseniors@gmail.com</a>.');
      }).then(function () { jBtn.disabled = false; jBtnText.textContent = 'Send message'; });
    });
  }

  /* ---------- Calendar data (shared by the calendar and the Help assistant) ---------- */
  var calLoading = null, calData = null;
  function loadCal() {
    if (calLoading) return calLoading;
    calLoading = window.fetch ? fetch('data/calendar.json').then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) { calData = j; return j; })
      .catch(function () { calLoading = null; return null; }) : Promise.resolve(null);
    return calLoading;
  }
  // "Now" in Markham, whatever the visitor's own time zone: { date: "2026-11-06", min: 845 }
  function nowToronto() {
    var d = new Date();
    try {
      var parts = {};
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
        .formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
      return { date: parts.year + '-' + parts.month + '-' + parts.day, min: (+parts.hour % 24) * 60 + +parts.minute };
    } catch (e) {
      var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
      return { date: d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  var toMin = function (t) { var a = t.split(':'); return +a[0] * 60 + +a[1]; };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var dateObj = function (s) { var a = s.split('-'); return new Date(Date.UTC(+a[0], a[1] - 1, +a[2])); };
  var isoDate = function (d) { return d.toISOString().slice(0, 10); };
  var addDays = function (s, n) { var d = dateObj(s); d.setUTCDate(d.getUTCDate() + n); return isoDate(d); };
  var longDate = function (s) { var d = dateObj(s); return DAYS[d.getUTCDay()] + ', ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
  function allEvents(data) {
    var list = [];
    data.months.forEach(function (m) { m.events.forEach(function (e) { list.push(e); }); });
    return list.sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? -1 : 1; });
  }
  var venueOf = function (data, e) { return data.venues[e.venue || data.defaultVenue]; };
  var venueText = function (data, e) {
    var v = venueOf(data, e);
    return (v.room ? v.room + ', ' : '') + v.name + (e.venue && e.venue !== data.defaultVenue ? ', ' + v.street : '');
  };
  // Upcoming = hasn't finished yet (an event happening right now still counts)
  function upcoming(data, now) {
    return allEvents(data).filter(function (e) { return e.date > now.date || (e.date === now.date && toMin(e.end) > now.min); });
  }

  // Add to my calendar: a one-event .ics file (works with Apple, Google and Outlook calendars)
  function icsFor(data, e) {
    var stamp = function (d, t) { return d.replace(/-/g, '') + 'T' + t.replace(':', '') + '00'; };
    var v = venueOf(data, e), k = data.kinds[e.kind];
    var loc = [v.room, v.name, v.street, v.city + ' ' + v.region].filter(Boolean).join(', ').replace(/,/g, '\\,');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Island Breeze Seniors//Calendar//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + e.date + '-' + e.kind + '@islandbreezeseniors', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART;TZID=America/Toronto:' + stamp(e.date, e.start), 'DTEND;TZID=America/Toronto:' + stamp(e.date, e.end),
      'SUMMARY:' + k.name + ' (Island Breeze)', 'LOCATION:' + loc,
      'DESCRIPTION:' + (k.desc + ' Questions? Call ' + data.owner.name + ' at ' + data.owner.phone + '.').replace(/,/g, '\\,'),
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function downloadIcs(data, e) {
    var blob = new Blob([icsFor(data, e)], { type: 'text/calendar' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'island-breeze-' + e.kind + '-' + e.date + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* ---------- Calendar: today, past days, next program, earlier weeks, print ---------- */
  var calRoot = document.getElementById('calendar');
  if (calRoot) {
    var now = nowToronto();
    // Stagger order for the one-time entrance (reading order: week by week)
    each(calRoot.querySelectorAll('.cal-card'), function (card) {
      each(card.querySelectorAll('.ev'), function (el, i) { el.style.setProperty('--i', Math.min(i, 14)); });
      each(card.querySelectorAll('.cl-item'), function (el, i) { el.style.setProperty('--i', Math.min(i, 8)); });
    });
    each(calRoot.querySelectorAll('.cal-grid td[data-date]'), function (td) {
      var d = td.getAttribute('data-date');
      if (d < now.date) td.classList.add('is-past');
      if (d === now.date) {
        td.classList.add('is-today');
        td.setAttribute('aria-current', 'date');
        var badge = document.createElement('span');
        badge.className = 'today-badge'; badge.textContent = 'Today';
        td.querySelector('.d-num').appendChild(badge);
      }
    });
    // Phones: weeks that are over fold away behind one button
    each(calRoot.querySelectorAll('.cal-list'), function (list) {
      var past = Array.prototype.filter.call(list.querySelectorAll('.cl-week'), function (w) { return w.getAttribute('data-last') < now.date; });
      each(list.querySelectorAll('.cl-item'), function (li) {
        var d = li.getAttribute('data-date');
        if (d < now.date) li.classList.add('is-past');
        if (d === now.date) li.classList.add('is-today');
      });
      var wrap = list.querySelector('.cl-earlier');
      if (!past.length || !wrap || past.length === list.querySelectorAll('.cl-week').length) return;
      var btn = wrap.querySelector('.cl-toggle'), label = btn.querySelector('span');
      var setOpen = function (open) {
        past.forEach(function (w) { w.hidden = !open; w.classList.toggle('cl-unfold', open && !reduce); });
        btn.setAttribute('aria-expanded', String(open));
        label.textContent = open ? 'Hide earlier dates' : 'Show earlier dates (' + past.length + (past.length === 1 ? ' week)' : ' weeks)');
      };
      btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
      setOpen(false);
      wrap.hidden = false;
    });
    // Print just the calendar (landscape, in colour)
    each(calRoot.querySelectorAll('.cal-print'), function (b) {
      if (!window.print) return;
      b.hidden = false;
      b.addEventListener('click', function () { doc.classList.add('print-cal'); window.print(); });
    });
    window.addEventListener('afterprint', function () { doc.classList.remove('print-cal'); });

    // Next program card
    var nextUp = calRoot.querySelector('.next-up');
    loadCal().then(function (data) {
      if (!data || !nextUp) return;
      var up = upcoming(data, now)[0];
      var T = '<a href="tel:+14163197763">' + data.owner.phone + '</a>';
      if (!up) {
        nextUp.innerHTML = '<div class="nu-body"><p class="nu-label">Coming soon</p><p class="nu-name">The next calendar is on its way</p><p class="nu-when">For upcoming programs, call ' + esc(data.owner.name) + ' at ' + T + '.</p></div>';
      } else {
        var k = data.kinds[up.kind], v = venueOf(data, up);
        var live = up.date === now.date && toMin(up.start) <= now.min;
        var label = live ? 'Happening now' : up.date === now.date ? 'Today' : up.date === addDays(now.date, 1) ? 'Tomorrow' : 'Next program';
        nextUp.setAttribute('data-accent', k.accent);
        nextUp.innerHTML =
          '<span class="nu-icon"><svg aria-hidden="true"><use href="#' + k.icon + '"/></svg></span>' +
          '<div class="nu-body"><p class="nu-label">' + label + '</p>' +
          '<p class="nu-name">' + esc(k.name) + '</p>' +
          '<p class="nu-when"><strong>' + esc(up.when) + '</strong><span class="nu-dot" aria-hidden="true"> &middot; </span><span class="nowrap">' + esc(up.time) + '</span></p>' +
          '<p class="nu-where"><svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg>' + esc(venueText(data, up)) + '</p></div>' +
          '<div class="nu-actions">' +
          (window.Blob && window.URL ? '<button class="btn btn-light" type="button" data-ics><svg class="ico" aria-hidden="true"><use href="#a-calendar"/></svg>Add to my calendar</button>' : '') +
          '<a class="btn btn-outline-light" href="' + esc(v.map) + '" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg>Directions<span class="visually-hidden"> (opens Google Maps in a new tab)</span></a></div>';
        var icsBtn = nextUp.querySelector('[data-ics]');
        if (icsBtn) icsBtn.addEventListener('click', function () { downloadIcs(data, up); });
      }
      nextUp.hidden = false;
    });
  }

  /* ---------- Help assistant (D): scripted, never guesses. Understands the calendar ("what's on
     Tuesday?", "when is bingo?"), and matches everything else to data/faq.json by keywords,
     phrases, aliases and typos (including swapped letters). Nothing is stored or sent anywhere. ---------- */
  var help = document.getElementById('help-panel');
  var launcher = document.querySelector('.help-launcher');
  var helpLog = help && help.querySelector('.help-log');
  var kb = null, kbLoading = null, df = {};
  var STOP = {};
  'a an the is are am be been being i im ive id you your youre we us our it its my me to of for in on at and or with do does did can could would should will shall what whats how which there theres this that these those please hi hello hey just know tell want wanted like any some have has had get got go going if so too also about from by up out there then than them they their he she his her who whom was were wondering need okay ok yes no'.split(' ').forEach(function (w) { STOP[w] = 1; });
  // Words that carry meaning even though they look like filler
  ['who', 'where', 'when', 'what', 'need', 'about'].forEach(function (w) { delete STOP[w]; });
  var esc = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
  function baseNorm(t) {
    return ' ' + String(t).toLowerCase().replace(/[’']/g, '').replace(/&/g, ' and ').replace(/(\d)(st|nd|rd|th)\b/g, '$1 $1$2')
      .replace(/[^a-z0-9\s-]/g, ' ').replace(/([a-z])\1{2,}/g, '$1$1').replace(/-/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }
  var aliasKeys = [];
  function norm(t) {
    t = baseNorm(t);
    aliasKeys.forEach(function (k) { if (t.indexOf(' ' + k + ' ') > -1) t = t.split(' ' + k + ' ').join(' ' + kb.aliases[k] + ' '); });
    return t.replace(/\s+/g, ' ');
  }
  var wordsOf = function (t) { return t.trim().split(' ').filter(function (w) { return w && !STOP[w]; }); };
  var stem = function (w) { return w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w; };
  // Optimal string alignment distance (insert, delete, change, swap two letters), with an early exit
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev2 = null, prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i]; var low = i;
      for (j = 1; j <= b.length; j++) {
        var v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v; if (v < low) low = v;
      }
      if (low > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[b.length];
  }
  // How alike two words are: 1 exact, .95 same stem, .75 one typo, .6 two typos; short words must start the same
  var vocab = {};
  function sim(w, k) {
    if (w === k) return 1;
    if (stem(w) === stem(k)) return 0.95;
    if (vocab[w]) return 0; // a word we know is not a typo of a different word
    if (k.length < 4 || w.length < 3 || /\d/.test(k)) return 0;
    var max = k.length <= 5 ? 1 : k.length <= 8 ? 2 : 3;
    if (k.length <= 6 && w[0] !== k[0]) return 0;
    var d = dist(w, k, max);
    return d > max ? 0 : d === 1 ? 0.75 : d === 2 ? 0.6 : 0.5;
  }
  // Best match for a (possibly multi-word) keyword among the question's words
  function kwScore(words, kw) {
    var parts = kw.split(' ');
    if (parts.length === 1) {
      var best = 0;
      words.forEach(function (w) { var s = sim(w, kw); if (s > best) best = s; });
      // "chairyoga", "pricesright": a phrase typed as one word
      return best;
    }
    var all = words.join(' '), bestP = 0;
    if ((' ' + all + ' ').indexOf(' ' + kw + ' ') > -1) return 1;
    var joined = parts.join('');
    words.forEach(function (w) { if (w.length > 6) { var s = sim(w, joined); if (s > bestP) bestP = s; } });
    for (var i = 0; i + parts.length <= words.length; i++) {
      var tot = 0, ok = true;
      for (var j = 0; j < parts.length; j++) { var s2 = sim(words[i + j], parts[j]); if (!s2) { ok = false; break; } tot += s2; }
      if (ok) bestP = Math.max(bestP, tot / parts.length);
    }
    return bestP;
  }
  function prepareKb() {
    aliasKeys = Object.keys(kb.aliases || {}).sort(function (a, b) { return b.split(' ').length - a.split(' ').length; });
    // Phrases keep their small words ("get there", "what is on"); single keywords never match filler
    kb.entries.forEach(function (e) {
      e._kw = e.keywords.map(function (k) { var t = norm(k).trim(); return t.indexOf(' ') > -1 || !STOP[t] ? t : ''; }).filter(Boolean);
      e._kw.forEach(function (k) { df[k] = (df[k] || 0) + 1; k.split(' ').forEach(function (w) { if (w.length > 3) vocab[w] = 1; }); });
    });
  }
  function rank(question) {
    var all = norm(question).trim().split(' ').filter(Boolean), words = wordsOf(all.join(' '));
    if (!all.length) return [];
    return kb.entries.map(function (e) {
      var score = 0;
      e._kw.forEach(function (k) {
        var s = kwScore(k.indexOf(' ') > -1 ? all : words, k);
        if (s) score += s * (k.indexOf(' ') > -1 ? 3 : 2) / Math.sqrt(df[k]);
      });
      return { e: e, score: score };
    }).filter(function (r) { return r.score > 0; }).sort(function (a, b) { return b.score - a.score; });
  }

  /* Calendar understanding */
  var KIND_WORDS = {
    'exercise': ['exercise', 'exercise class', 'workout', 'fitness', 'gym', 'work out'],
    'chair-yoga': ['chair yoga', 'yoga'],
    'pancake': ['pancake', 'breakfast', 'pancake breakfast'],
    'price-is-right': ['price is right', 'game show', 'guessing game'],
    'seniors-circle': ['seniors circle', 'circle', 'milliken'],
    'bingo': ['bingo']
  };
  function kindsIn(words) {
    var found = [];
    Object.keys(KIND_WORDS).forEach(function (k) {
      if (KIND_WORDS[k].some(function (kw) { return kwScore(words, wordsOf(norm(kw)).join(' ')) >= 0.75; })) found.push(k);
    });
    if (found.indexOf('chair-yoga') > -1 && found.indexOf('exercise') > -1 && words.indexOf('exercise') < 0) found.splice(found.indexOf('exercise'), 1);
    return found;
  }
  // Which day(s) the question is about, as ISO dates. Weekday names mean the next one (today included).
  function daysIn(text, words, now) {
    var t = ' ' + words.join(' ') + ' ', out = [], i;
    if (/ (today|tonight|now|this morning|this afternoon) /.test(t)) out.push(now.date);
    if (/ tomorrow /.test(t)) out.push(addDays(now.date, 1));
    var wd = dateObj(now.date).getUTCDay();
    var weekFrom = function (start, n) { var r = []; for (var j = 0; j < n; j++) r.push(addDays(start, j)); return r; };
    if (/ next week /.test(t)) return { range: weekFrom(addDays(now.date, 8 - (wd || 7)), 7), label: 'next week' };
    if (/ (this week|week) /.test(t)) return { range: weekFrom(now.date, 7 - ((wd + 6) % 7)), label: 'this week' };
    if (/ weekend /.test(t)) { var sat = addDays(now.date, (6 - wd + 7) % 7); return { range: wd === 0 ? [now.date] : [sat, addDays(sat, 1)], label: 'this weekend' }; }
    words.forEach(function (w) {
      if (w.length < 5) return;
      var w2 = w.replace(/s$/, ''), best = -1, bestD = 9, tie = false;
      DAYS.forEach(function (name, n) {
        var d = dist(w2, name.toLowerCase(), 3);
        if (d < bestD) { bestD = d; best = n; tie = false; } else if (d === bestD) tie = true;
      });
      if (best > -1 && !tie && bestD <= (w2.length >= 7 ? 2 : 1)) {
        var iso = addDays(now.date, (best - wd + 7) % 7);
        if (out.indexOf(iso) < 0) out.push(iso);
      }
    });
    // "November 18", "nov 18th", "the 18th"
    var m = text.toLowerCase().match(/\b(?:november|nov)\.?\s*(\d{1,2})|\b(\d{1,2})(?:st|nd|rd|th)\b|\bthe\s+(\d{1,2})\b/);
    if (m) { var day = +(m[1] || m[2] || m[3]); if (day >= 1 && day <= 31) out.push(now.date.slice(0, 8) + (day < 10 ? '0' : '') + day); }
    return out.length ? { range: out, label: '' } : null;
  }
  var evLine = function (data, e) {
    return '<strong>' + esc(data.kinds[e.kind].name) + '</strong>, ' + esc(e.time) + ', ' + esc(venueText(data, e));
  };
  function answerDays(data, q, now) {
    var events = allEvents(data);
    var lastDate = events.length ? events[events.length - 1].date : '';
    var rows = q.range.map(function (d) {
      var list = events.filter(function (e) { return e.date === d; });
      var obs = [];
      data.months.forEach(function (m) { (m.observances || []).forEach(function (o) { if (o.date === d) obs.push(o.name); }); });
      var head = (d === now.date ? 'Today, ' : d === addDays(now.date, 1) ? 'Tomorrow, ' : '') + longDate(d);
      if (d > lastDate) return '<li><strong>' + head + ':</strong> that calendar isn&rsquo;t posted yet.</li>';
      if (!list.length) return q.label ? '' : '<li><strong>' + head + ':</strong> no program' + (obs.length ? ' (' + esc(obs.join(', ')) + ')' : '') + '.</li>';
      return '<li><strong>' + head + ':</strong> ' + list.map(function (e) {
        var done = d === now.date && toMin(e.end) <= now.min;
        return evLine(data, e) + (done ? ' (finished for today)' : '');
      }).join('; ') + (obs.length ? ' (' + esc(obs.join(', ')) + ')' : '') + '</li>';
    }).filter(Boolean);
    var html = rows.length ? '<ul class="msg-list">' + rows.join('') + '</ul>' : '<p>There&rsquo;s no program ' + q.label + '.</p>';
    if (q.label && rows.length) html = '<p>Here&rsquo;s what&rsquo;s on ' + q.label + ':</p>' + html;
    var empty = !rows.length || rows.every(function (r) { return r.indexOf('no program') > -1; });
    if (empty) {
      var nx = upcoming(data, now)[0];
      if (nx) html += '<p>The next program is ' + evLine(data, nx) + ' on <strong>' + esc(nx.when) + '</strong>.</p>';
    }
    return html;
  }
  function answerKinds(data, kinds, now) {
    var up = upcoming(data, now);
    return kinds.map(function (k) {
      var kind = data.kinds[k], list = up.filter(function (e) { return e.kind === k; });
      if (!list.length) {
        var past = allEvents(data).filter(function (e) { return e.kind === k; }).pop();
        return '<p><strong>' + esc(kind.name) + '</strong>' + (past ? ' was on <strong>' + esc(past.when) + '</strong>, ' + esc(past.time) + '. It isn&rsquo;t on the calendar again yet' : ' isn&rsquo;t on the calendar right now') + '. For future dates, call ' + esc(data.owner.name) + ' at <a href="tel:+14163197763">' + esc(data.owner.phone) + '</a>.</p>';
      }
      var first = list[0];
      var html = '<p><strong>' + esc(kind.name) + '</strong>: ' + esc(kind.desc) + '</p>';
      if (list.length === 1) html += '<p>Next: <strong>' + (first.date === now.date ? 'today, ' : '') + esc(first.when) + '</strong>, ' + esc(first.time) + ', ' + esc(venueText(data, first)) + '.</p>';
      else html += '<p>' + esc(first.time) + ', ' + esc(venueText(data, first)) + '. Coming up:</p><ul class="msg-list">' + list.slice(0, 4).map(function (e) { return '<li>' + (e.date === now.date ? '<strong>Today</strong>, ' : '') + esc(e.when) + '</li>'; }).join('') + '</ul>';
      return html;
    }).join('');
  }
  function answerSchedule(data, now) {
    var nx = upcoming(data, now)[0];
    return '<p>' + esc(data.weekly) + '</p>' + (nx ? '<p>Next up: ' + evLine(data, nx) + ' on <strong>' + (nx.date === now.date ? 'today, ' : '') + esc(nx.when) + '</strong>.</p>' : '<p>That&rsquo;s the end of the posted calendar. Call ' + esc(data.owner.name) + ' at <a href="tel:+14163197763">' + esc(data.owner.phone) + '</a> for what&rsquo;s next.</p>');
  }
  function answerGames(data, now) {
    var kinds = ['price-is-right', 'bingo'].filter(function (k) { return upcoming(data, now).some(function (e) { return e.kind === k; }); });
    return (kinds.length ? answerKinds(data, kinds, now) : '<p>There are no more games on this month&rsquo;s calendar.</p>') + '<p>Members have also enjoyed game nights with dominoes.</p>';
  }
  var fillTokens = function (html) {
    return html.replace('{{months}}', calData ? calData.months.map(function (m) { return esc(m.title); }).join(' and ') : 'this month&rsquo;s calendar');
  };

  function loadKb() {
    if (kbLoading) return kbLoading;
    kbLoading = Promise.all([
      fetch('data/faq.json').then(function (r) { if (!r.ok) throw new Error(); return r.json(); }),
      loadCal()
    ]).then(function (res) { kb = res[0]; prepareKb(); renderChips(); })
      .catch(function () { kbLoading = null; addBot('<p>Sorry, the quick answers didn&rsquo;t load. A real person can help:</p>', '', { full: true }); });
    return kbLoading;
  }
  function chip(label, q) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'help-chip'; b.textContent = label;
    b.addEventListener('click', function () { ask(q || label); });
    return b;
  }
  function renderChips() {
    var wrap = help.querySelector('.help-chips');
    if (!wrap || wrap.children.length) return;
    kb.suggest.forEach(function (id) {
      var entry = kb.entries.filter(function (x) { return x.id === id; })[0];
      if (entry) wrap.appendChild(chip(entry.q));
    });
  }
  function actions(question, opts) {
    opts = opts || {};
    var body = question ? '\n\nMy question: ' + question + '\n' : '';
    var extra = '';
    if (opts.calendar) extra += '<a class="btn btn-ghost" href="#calendar" data-goto><svg class="ico" aria-hidden="true"><use href="#a-calendar"/></svg>See the calendar</a>';
    if (opts.directions) extra += '<a class="btn btn-ghost" href="https://www.google.com/maps/dir/?api=1&amp;destination=4460+14th+Avenue%2C+Markham%2C+ON" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg>Get directions<span class="visually-hidden"> (opens Google Maps in a new tab)</span></a>';
    if (!opts.full) return extra ? '<div class="msg-actions msg-actions-row">' + extra + '</div>' : '';
    return '<div class="msg-actions">' +
      '<a class="btn btn-primary" href="tel:+14163197763"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Call 416-319-7763</a>' +
      '<a class="btn btn-ghost" href="mailto:islandbreezeseniors@gmail.com?subject=' + encodeURIComponent('Question from the website') + '&amp;body=' + encodeURIComponent(body) + '"><svg class="ico" aria-hidden="true"><use href="#i-mail"/></svg>Email us</a>' +
      '<button class="btn btn-ghost" type="button" data-send-q="' + esc(question || '') + '"><svg class="ico" aria-hidden="true"><use href="#a-chat"/></svg>Send a message</button>' +
      extra + '</div>';
  }
  function addMsg(cls, html) {
    var m = document.createElement('div');
    m.className = 'msg ' + cls + (reduce ? '' : ' msg-in');
    m.innerHTML = html;
    helpLog.appendChild(m);
    return m;
  }
  function addBot(html, question, opts) { return addMsg('msg-bot', html + actions(question, opts)); }
  function related(msg, list) {
    if (!list.length) return;
    var box = document.createElement('div');
    box.className = 'msg-related';
    box.innerHTML = '<p class="msg-label">You might also ask</p>';
    var chips = document.createElement('div');
    chips.className = 'help-chips';
    list.forEach(function (e) { chips.appendChild(chip(e.q)); });
    box.appendChild(chips);
    msg.appendChild(box);
  }
  var PRACTICAL = { cost: 1, register: 1, caregivers: 1, bring: 1, access: 1, transit: 1, parking: 1, join: 1, 'fitness-level': 1, food: 1, friend: 1, dropin: 1 };
  function ask(question) {
    question = String(question).trim().slice(0, 300);
    if (!question) return;
    var user = addMsg('msg-user', '<p>' + esc(question) + '</p>');
    var reply, t = baseNorm(question).trim();
    if (/^(thanks|thank you|thank u|thx|ty|thanx|cheers)\b/.test(t)) {
      reply = addBot('<p>You&rsquo;re welcome! Ask anything else, or reach a real person here:</p>', '', { full: true });
    } else if (/^(hi|hello|hey|hiya|good (morning|afternoon|evening))( there)?$/.test(t)) {
      reply = addMsg('msg-bot', '<p>Hello! Ask me about this month&rsquo;s programs, where we meet, joining, or anything else about Island Breeze.</p>');
    } else if (/^(bye|goodbye|good bye|see you|cya)\b/.test(t)) {
      reply = addMsg('msg-bot', '<p>Goodbye, and take care! We hope to see you soon.</p>');
    } else {
      reply = answer(question);
    }
    user.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    return reply;
  }
  function answer(question) {
    var now = nowToronto();
    var words = wordsOf(norm(question));
    var ranked = rank(question);
    var top = ranked[0], best = top && top.score >= 1.5 ? top.e : null;
    var opts = { calendar: false, directions: false };
    var html = '', usedPractical = '', fromCalendar = false;
    if (calData) {
      var kinds = kindsIn(words);
      var days = daysIn(question, words, now);
      if (kinds.length) {
        html = answerKinds(calData, kinds, now); opts.calendar = true;
      } else if (days) {
        html = answerDays(calData, days, now); opts.calendar = true;
      } else if (best && best.dynamic) {
        if (best.dynamic === 'games') html = answerGames(calData, now);
        else if (best.dynamic === 'today') html = answerDays(calData, { range: [now.date], label: '' }, now);
        else if (best.dynamic === 'weekend') html = answerDays(calData, daysIn('weekend', ['weekend'], now), now);
        else html = answerSchedule(calData, now);
        opts.calendar = true;
      }
      fromCalendar = !!html;
      // "How much is bingo?", "Can my daughter come to chair yoga?": add the practical answer too
      var prac = ranked.filter(function (r) { return r.score >= 1.5 && PRACTICAL[r.e.id]; })[0];
      if (html && prac) { html += '<p>' + fillTokens(prac.e.answer) + '</p>'; usedPractical = prac.e.id; }
    }
    if (!html && best && !best.dynamic) {
      html = '<p>' + fillTokens(best.answer) + '</p>';
      (best.show || []).forEach(function (s) { opts[s] = true; });
    } else if (!html && best && best.dynamic) {
      html = '<p>For this month&rsquo;s programs and times, see the calendar on this page or call Charmaine at <a href="tel:+14163197763">416-319-7763</a>.</p>';
      opts.calendar = true;
    }
    if (!html) {
      opts.full = true;
      var msg = addBot('<p>Sorry, I don&rsquo;t have an answer to that on this website, and I don&rsquo;t want to guess. A real person can help:</p>', question, opts);
      related(msg, ranked.filter(function (r) { return r.score >= 0.9; }).slice(0, 3).map(function (r) { return r.e; }));
      return msg;
    }
    var reply = addBot(html, question, opts);
    var shown = best ? best.id : '';
    related(reply, ranked.filter(function (r) {
      return r.e.id !== shown && r.e.id !== usedPractical && !(fromCalendar && r.e.dynamic) && r.score >= Math.max(1.2, top.score * 0.55);
    }).slice(0, 2).map(function (r) { return r.e; }));
    return reply;
  }
  if (help && helpLog && launcher && window.fetch && window.Promise) {
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
      var go = e.target.closest('[data-goto]');
      if (go) { // close the panel first, then take the visitor to the calendar
        e.preventDefault();
        closePanel(help, 'instant');
        var target = document.querySelector(go.getAttribute('href'));
        if (target) { target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); var h = target.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
        return;
      }
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
