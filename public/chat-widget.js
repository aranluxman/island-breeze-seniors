(function () {
  // ---------- SETTINGS (override any of these with window.IA_CHAT_CONFIG before loading this file) ----------
  var C = {
    FUNCTION_URL: "https://zciulgqkqusjxomyapcz.supabase.co/functions/v1/ib-chat",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaXVsZ3FrcXVzanhvbXlhcGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDc5ODgsImV4cCI6MjA5NDQ4Mzk4OH0.bTD_xfUpDTu_LG8uSuj2bhV7l1VnxNR5WwPOFyrG2a8",
    TITLE: "Island Breeze",
    SUBTITLE: "Ask us anything",
    LAUNCH_LABEL: "Ask a question",
    GREETING: "Hello! I can help with what's on this week, where we meet, how to join, or donating. What would you like to know?",
    SUGGESTIONS: ["What's on this week?", "Where are programs held?", "How do I join?"],
    NOTICE: "I'm an automatic helper. Your messages are sent to an AI service to answer and are saved so we can improve. Please don't share health or private details here.",
    PHONE: "416-319-7763",
    PHONE_TEL: "+14163197763",
    FOOTER: "Prefer to talk? Call Charmaine at ",
    ACCENT: "#b8410f",        // main colour (send button, your messages)
    ACCENT_2: "#0b4f7c",      // second colour (launcher, avatar)
    ACCENT_TEXT: "#ffffff",   // text on top of the accent colours
    BG: "#fff8ef",            // window background
    SURFACE: "#ffffff",       // bot bubbles and input
    BORDER: "#e6d8c6",
    TEXT: "#1d2b36",
    MUTED: "#3d4b56",
    FONT: '"Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif',
    // Call-back requests are also emailed through the site's own FormSubmit contact form (same inbox as the form)
    LEAD_FORM: "#contact-form",
    // The launcher steps aside while these are on screen, so it never covers the form or the footer links
    HIDE_OVER: ["#contact", ".site-footer"]
  };
  var user = window.IA_CHAT_CONFIG || {};
  for (var k in user) if (Object.prototype.hasOwnProperty.call(user, k)) C[k] = user[k];
  // -----------------------------------------------------------------------------------------------------

  function init() {
    if (document.getElementById("ia-chat-root")) return;

    var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
                  set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
    var sessionId = store.get("ia_chat_sid");
    if (!sessionId) {
      sessionId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2);
      store.set("ia_chat_sid", sessionId);
    }

    var ICON_CHAT = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H10l-5.5 4v-4H4A1.5 1.5 0 0 1 2.5 16V6A1.5 1.5 0 0 1 4 4.5Z"/><path d="M7 9.5h10M7 13h6"/></svg>';
    var ICON_CLOSE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    var ICON_SEND = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    var ICON_SUN = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';

    var css = `
    #ia-chat-root{--ia-a:${C.ACCENT};--ia-b:${C.ACCENT_2};--ia-at:${C.ACCENT_TEXT};--ia-bg:${C.BG};--ia-sf:${C.SURFACE};--ia-bd:${C.BORDER};--ia-tx:${C.TEXT};--ia-mu:${C.MUTED};font-family:${C.FONT};font-size:17px;line-height:1.5}
    #ia-chat-root *{box-sizing:border-box;font-family:inherit}
    .ia-launch{position:fixed;right:16px;bottom:calc(16px + var(--callbar-h, 0px));z-index:2147483000;display:inline-flex;align-items:center;gap:10px;min-height:56px;padding:0 22px 0 16px;border:1px solid rgba(255,255,255,.28);border-radius:999px;cursor:pointer;
      color:var(--ia-at);background:var(--ia-b);font:700 19px/1 ${C.FONT};box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 14px 30px -12px rgba(10,30,50,.55);transition:transform .2s ease,background .2s ease}
    .ia-launch:hover{background:#0a3d61}
    .ia-launch:active{transform:scale(.97)}
    .ia-launch:focus-visible,.ia-x:focus-visible,.ia-chip:focus-visible,.ia-send:focus-visible,.ia-m a:focus-visible{outline:3px solid #0a3d61;outline-offset:3px}
    .ia-open .ia-launch{display:none}
    .ia-launch.ia-away{opacity:0;visibility:hidden;transform:translateY(12px);transition:opacity .25s,transform .25s,visibility 0s linear .25s}
    .ia-win{position:fixed;right:16px;bottom:calc(16px + var(--callbar-h, 0px));width:410px;height:640px;max-height:calc(100vh - 32px - var(--callbar-h, 0px));background:var(--ia-bg);color:var(--ia-tx);
      border:1px solid var(--ia-bd);border-radius:18px;box-shadow:0 30px 70px -24px rgba(30,20,10,.45),0 8px 20px -10px rgba(30,20,10,.2);display:flex;flex-direction:column;overflow:hidden;z-index:2147483001;
      opacity:0;visibility:hidden;pointer-events:none;transform:translateY(16px);transform-origin:bottom right;
      transition:opacity .25s ease,transform .3s cubic-bezier(.16,1,.3,1),visibility 0s linear .3s}
    .ia-open .ia-win{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition-delay:0s}
    .ia-head{display:flex;align-items:center;gap:12px;padding:14px 14px 14px 18px;background:var(--ia-b);color:var(--ia-at)}
    .ia-av{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.16);color:#ffd166;display:flex;align-items:center;justify-content:center;flex:none}
    .ia-ht{flex:1;min-width:0}
    .ia-title{font-weight:700;font-size:19px;line-height:1.2;margin:0;color:var(--ia-at);letter-spacing:0}
    .ia-sub{font-size:15px;opacity:.9;margin-top:2px}
    .ia-x{border:0;background:rgba(255,255,255,.14);color:#fff;min-width:48px;height:48px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 12px;font-weight:700;font-size:16px}
    .ia-x:hover{background:rgba(255,255,255,.24)}
    .ia-log{flex:1;overflow-y:auto;padding:18px 16px;display:flex;flex-direction:column;gap:12px;background:var(--ia-bg)}
    .ia-m{max-width:88%;padding:12px 16px;font-size:17px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word;animation:ia-in .3s ease both}
    .ia-m a{color:inherit;font-weight:700;text-decoration:underline;text-underline-offset:2px}
    .ia-b a{color:var(--ia-a)}
    .ia-u{align-self:flex-end;color:var(--ia-at);background:var(--ia-a);border-radius:16px 16px 4px 16px}
    .ia-b{align-self:flex-start;color:var(--ia-tx);background:var(--ia-sf);border:1px solid var(--ia-bd);border-radius:16px 16px 16px 4px}
    .ia-err{background:#fdecea;border-color:#f1b6ae}
    .ia-typing{display:flex;gap:6px;align-items:center;padding:16px 18px}
    .ia-typing span{width:8px;height:8px;border-radius:50%;background:var(--ia-mu);animation:ia-bounce 1.2s infinite ease-in-out}
    .ia-typing span:nth-child(2){animation-delay:.15s}.ia-typing span:nth-child(3){animation-delay:.3s}
    .ia-chips{display:flex;flex-direction:column;align-items:flex-start;gap:8px;animation:ia-in .4s .15s ease both}
    .ia-chip{border:2px solid var(--ia-b);color:var(--ia-b);background:var(--ia-sf);border-radius:999px;padding:10px 16px;min-height:48px;font-size:17px;font-weight:700;text-align:left;cursor:pointer;transition:background .2s,color .2s}
    .ia-chip:hover{background:var(--ia-b);color:var(--ia-at)}
    .ia-form{padding:12px 14px 10px;background:var(--ia-sf);border-top:1px solid var(--ia-bd)}
    .ia-label{display:block;font-size:15px;font-weight:700;color:var(--ia-mu);margin:0 0 6px}
    .ia-row{display:flex;align-items:center;gap:8px}
    .ia-in{flex:1;min-width:0;min-height:52px;border:2px solid var(--ia-bd);border-radius:12px;padding:10px 14px;font-size:17px;outline:none;background:#fff;color:var(--ia-tx);transition:border-color .2s,box-shadow .2s}
    .ia-in:focus{border-color:var(--ia-b);box-shadow:0 0 0 3px rgba(11,79,124,.2)}
    .ia-send{width:52px;height:52px;border:0;border-radius:12px;flex:none;cursor:pointer;color:var(--ia-at);display:flex;align-items:center;justify-content:center;background:var(--ia-a);transition:opacity .2s}
    .ia-send:disabled{opacity:.4;cursor:default}
    .ia-foot{font-size:15px;color:var(--ia-mu);padding:8px 2px 0;text-align:center}
    .ia-foot a{color:var(--ia-a);font-weight:700}
    .ia-note{align-self:stretch;font-size:14px;line-height:1.45;color:var(--ia-mu);margin:-2px 2px 2px}
    .ia-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
    @keyframes ia-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes ia-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-6px);opacity:1}}
    @media (max-width:520px){.ia-win{right:0;left:0;bottom:0;top:0;width:100%;height:100%;max-height:none;border-radius:0;border:0}.ia-launch{right:12px}}
    @media (prefers-reduced-motion:reduce){#ia-chat-root *{animation:none!important;transition:none!important}}
    @media print{#ia-chat-root{display:none!important}}
    `;

    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.id = "ia-chat-root";
    document.body.appendChild(root);
    root.innerHTML =
      '<button class="ia-launch" type="button" aria-haspopup="dialog" aria-expanded="false">' + ICON_CHAT + '<span class="ia-ll"></span></button>' +
      '<div class="ia-win" role="dialog" aria-modal="false" aria-labelledby="ia-title">' +
        '<div class="ia-head"><div class="ia-av">' + ICON_SUN + '</div>' +
        '<div class="ia-ht"><h2 class="ia-title" id="ia-title"></h2><div class="ia-sub"></div></div>' +
        '<button class="ia-x" type="button">' + ICON_CLOSE + '<span>Close</span></button></div>' +
        '<div class="ia-log" role="log" aria-live="polite" aria-label="Conversation" tabindex="0"></div>' +
        '<form class="ia-form"><label class="ia-label" for="ia-in">Type your question</label><div class="ia-row">' +
        '<input class="ia-in" id="ia-in" autocomplete="off" maxlength="1000" enterkeyhint="send">' +
        '<button class="ia-send" type="submit" disabled>' + ICON_SEND + '<span class="ia-sr">Send</span></button></div>' +
        (C.FOOTER ? '<div class="ia-foot"></div>' : '') + '</form>' +
      '</div>';

    var q = function (s) { return root.querySelector(s); };
    var log = q(".ia-log"), input = q(".ia-in"), sendBtn = q(".ia-send"), form = q(".ia-form"), launch = q(".ia-launch");
    q(".ia-ll").textContent = C.LAUNCH_LABEL;
    q(".ia-title").textContent = C.TITLE;
    q(".ia-sub").textContent = C.SUBTITLE;
    if (C.FOOTER) {
      var foot = q(".ia-foot");
      foot.appendChild(document.createTextNode(C.FOOTER));
      var fa = document.createElement("a");
      fa.href = "tel:" + C.PHONE_TEL;
      fa.textContent = C.PHONE;
      foot.appendChild(fa);
    }

    var messages = [], busy = false, chips = null;
    try { messages = JSON.parse(store.get("ia_chat_log") || "[]"); } catch (e) { messages = []; }
    function save() { store.set("ia_chat_log", JSON.stringify(messages.slice(-20))); }

    function scroll() { log.scrollTop = log.scrollHeight; }

    // Turn phone numbers, emails and web links into tappable links without using innerHTML
    var LINK_RE = /(https?:\/\/[^\s)]+[^\s).,!?;:'"])|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b)/gi;
    function fill(el, text) {
      el.textContent = "";
      var last = 0, m;
      LINK_RE.lastIndex = 0;
      while ((m = LINK_RE.exec(text))) {
        if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
        var a = document.createElement("a");
        a.textContent = m[0];
        if (m[1]) { a.href = m[1]; a.target = "_blank"; a.rel = "noopener"; }
        else if (m[2]) { a.href = "mailto:" + m[2]; }
        else { a.href = "tel:+1" + m[3].replace(/\D/g, "").slice(-10); }
        el.appendChild(a);
        last = m.index + m[0].length;
      }
      if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
    }

    function add(role, text) {
      var d = document.createElement("div");
      d.className = "ia-m " + (role === "user" ? "ia-u" : "ia-b");
      if (role === "user") d.textContent = text; else fill(d, text);
      log.appendChild(d);
      scroll();
      return d;
    }

    function typing() {
      var d = document.createElement("div");
      d.className = "ia-m ia-b ia-typing";
      d.setAttribute("aria-label", "Typing");
      d.innerHTML = "<span></span><span></span><span></span>";
      log.appendChild(d);
      scroll();
      return d;
    }

    function setOpen(open) {
      root.classList.toggle("ia-open", open);
      launch.setAttribute("aria-expanded", String(open));
      if (open) setTimeout(function () { input.focus(); }, 250);
      else launch.focus();
    }

    function send(text) {
      text = (text || "").trim();
      if (!text || busy) return;
      busy = true;
      sendBtn.disabled = true;
      input.value = "";
      if (chips) { chips.remove(); chips = null; }
      add("user", text);
      messages.push({ role: "user", content: text });
      var pending = typing();

      var reply = "", lead = null;
      function show(t) {
        reply += t;
        pending.className = "ia-m ia-b";
        pending.removeAttribute("aria-label");
        fill(pending, reply);
        scroll();
      }

      fetch(C.FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + C.ANON_KEY, "apikey": C.ANON_KEY },
        body: JSON.stringify({ messages: messages, session_id: sessionId, stream: true })
      })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          var type = r.headers.get("content-type") || "";
          // Streamed reply: words appear as they are written
          if (type.indexOf("text/event-stream") >= 0 && r.body && window.TextDecoder) {
            return readStream(r.body, show, function (l) { lead = l; });
          }
          // Plain JSON reply (older backend)
          return r.json().then(function (data) {
            if (!data.reply) throw new Error("no reply");
            show(data.reply);
            lead = data.lead || null;
          });
        })
        .then(function () {
          if (!reply.trim()) throw new Error("no reply");
          messages.push({ role: "assistant", content: reply });
          save();
          if (lead) forwardLead(lead, text);
        })
        .catch(function () {
          pending.className = "ia-m ia-b ia-err";
          pending.removeAttribute("aria-label");
          fill(pending, "Sorry, I couldn't answer just now. Please try again, or call Charmaine at " + C.PHONE + ".");
          messages.pop(); // remove the failed user message so history stays valid
        })
        .then(function () { busy = false; sendBtn.disabled = !input.value.trim(); scroll(); });
    }

    // Read "data: {...}" server-sent events from a fetch body
    function readStream(body, onText, onLead) {
      var reader = body.getReader(), dec = new TextDecoder(), buf = "";
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) return;
          buf += dec.decode(res.value, { stream: true });
          var parts = buf.split("\n\n");
          buf = parts.pop();
          for (var i = 0; i < parts.length; i++) {
            var line = parts[i].trim();
            if (line.indexOf("data:") !== 0) continue;
            var ev = JSON.parse(line.slice(5));
            if (ev.error) throw new Error("stream error");
            if (ev.t) onText(ev.t);
            if (ev.lead) onLead(ev.lead);
          }
          return pump();
        });
      }
      return pump();
    }

    // Email a saved call-back request through the page's contact form endpoint (best effort; Supabase keeps a copy)
    function forwardLead(lead, lastText) {
      var formEl = C.LEAD_FORM && document.querySelector(C.LEAD_FORM);
      var action = formEl && formEl.getAttribute("action");
      if (!action || action.indexOf("formsubmit.co/") < 0) return;
      var body = {
        _subject: "Island Breeze website: chatbot call-back request",
        _template: "table",
        _captcha: "false",
        name: lead.name || "(not given)",
        phone: lead.phone || "",
        email: lead.email || "",
        preferred_contact: lead.phone ? "Phone call back" : "Email",
        message: lead.message || lastText,
        sent_from: "Website chatbot"
      };
      if (lead.email) body._replyto = lead.email;
      fetch(action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body)
      }).catch(function () {});
    }

    // Step the launcher aside over the contact form and footer
    if (C.HIDE_OVER && C.HIDE_OVER.length && "IntersectionObserver" in window) {
      var blocked = {};
      C.HIDE_OVER.forEach(function (sel) {
        var el = document.querySelector(sel);
        if (!el) return;
        new IntersectionObserver(function (e) {
          blocked[sel] = e[0].isIntersecting;
          var away = Object.keys(blocked).some(function (k) { return blocked[k]; });
          launch.classList.toggle("ia-away", away);
        }).observe(el);
      });
    }

    add("assistant", C.GREETING);
    if (C.NOTICE) {
      var note = document.createElement("p");
      note.className = "ia-note";
      note.textContent = C.NOTICE;
      log.appendChild(note);
    }
    if (messages.length) {
      messages.forEach(function (m) { add(m.role, m.content); });
    } else if (C.SUGGESTIONS && C.SUGGESTIONS.length) {
      chips = document.createElement("div");
      chips.className = "ia-chips";
      chips.setAttribute("role", "group");
      chips.setAttribute("aria-label", "Suggested questions");
      C.SUGGESTIONS.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ia-chip";
        b.textContent = s;
        b.onclick = function () { send(s); };
        chips.appendChild(b);
      });
      log.appendChild(chips);
    }

    launch.onclick = function () { setOpen(true); };
    q(".ia-x").onclick = function () { setOpen(false); };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("ia-open")) setOpen(false); });
    input.addEventListener("input", function () { sendBtn.disabled = busy || !input.value.trim(); });
    form.onsubmit = function (e) { e.preventDefault(); send(input.value); };

    // Lets the page open the chat from its own buttons: IslandBreezeChat.open("optional question")
    window.IslandBreezeChat = {
      open: function (question) { setOpen(true); if (question) send(question); },
      close: function () { setOpen(false); }
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
