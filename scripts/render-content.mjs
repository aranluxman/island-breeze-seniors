#!/usr/bin/env node
/*
 * Renders content/site-content.json into public/index.html.
 * No dependencies. Replaces everything between <!-- @content:NAME --> and <!-- /@content:NAME -->.
 * Run after editing the content file:  node scripts/render-content.mjs
 * The generated HTML is committed, so Cloudflare Pages still needs no build step.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = JSON.parse(readFileSync(join(root, 'content/site-content.json'), 'utf8'));
const htmlPath = join(root, 'public/index.html');
let html = readFileSync(htmlPath, 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Rich fields are author-controlled and may hold simple inline HTML.
const rich = (s) => String(s);
// Rich text as plain text (for structured data): tags dropped, the entities we use decoded.
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&rsquo;/g, '\u2019').replace(/&amp;/g, '&');
const src = (s) => !s ? '' : !s.url ? esc(s.label) : `<a class="source" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}<span class="visually-hidden"> (opens in a new tab)</span></a>`;
const statusLabel = { regular: 'Regular activity', project: 'Past workshop', event: 'Event' };
const icon = (id, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"><use href="#${id}"/></svg>`;

/* ---------- Calendar helpers ---------- */
const cal = content.calendar;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ymd = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }; };
// "14:00" -> { h: 2, min: "00", ap: "p.m." }; noon reads as "noon"
const clock = (t) => { const [h, mi] = t.split(':').map(Number); return { h: h % 12 || 12, mi: String(mi).padStart(2, '0'), ap: h < 12 ? 'a.m.' : 'p.m.', noon: h === 12 && mi === 0 }; };
const timeRange = (a, b) => {
  const s = clock(a), e = clock(b);
  const end = e.noon ? 'noon' : `${e.h}:${e.mi} ${e.ap}`;
  return s.ap === e.ap && !e.noon ? `${s.h}:${s.mi} to ${end}` : `${s.h}:${s.mi} ${s.ap} to ${end}`;
};
const timeHtml = (a, b) => {
  // No break inside "12:45 p.m."; a break is allowed around "to"
  return timeRange(a, b).split(' to ').map((x) => x.replace(/ /g, '\u00a0')).join(' to ');
};
const shortRange = (a, b) => timeRange(a, b).replace(/:00/g, '');
const venueOf = (e) => cal.venues[e.venue || cal.defaultVenue];
const venueLine = (v) => [v.room, v.name].filter(Boolean).join(', ');
const venueFull = (v) => [v.room, v.name, v.street + ', ' + v.city].filter(Boolean).join(', ');
const longDate = (s) => { const d = parseDate(s); return `${DAYS[d.wd]}, ${MONTHS[d.m - 1]} ${d.d}`; };
const kindOf = (e) => cal.kinds[e.kind];
// The month to feature: the first one that hasn't ended yet, else the latest.
const today = new Date().toISOString().slice(0, 10);
const featured = cal.months.find((m) => m.events.some((e) => e.date >= today)) || cal.months[cal.months.length - 1];
// Weekly rhythm: a kind that repeats on the same weekday at the same time is "every Monday"; the rest are special events.
const rhythm = (month) => {
  const groups = {};
  month.events.forEach((e) => { const k = `${parseDate(e.date).wd}|${e.kind}|${e.start}|${e.end}`; (groups[k] = groups[k] || []).push(e); });
  const regular = [], special = [];
  Object.entries(groups).forEach(([k, list]) => (list.length >= 3 ? regular : special).push(...(list.length >= 3 ? [{ wd: +k.split('|')[0], e: list[0], n: list.length }] : list)));
  regular.sort((a, b) => a.wd - b.wd);
  const specialDays = [...new Set(special.map((e) => parseDate(e.date).wd))];
  return { regular, special, specialDays };
};
const weeklyText = (month) => {
  const r = rhythm(month);
  const parts = r.regular.map((x) => `${kindOf(x.e).name} every ${DAYS[x.wd]} (${shortRange(x.e.start, x.e.end)})`);
  let t = parts.length ? parts.slice(0, -1).join(', ') + (parts.length > 1 ? ' and ' : '') + parts[parts.length - 1] : '';
  if (r.special.length) t += (t ? ', plus ' : '') + (r.specialDays.length === 1 ? `a special event on ${DAYS[r.specialDays[0]]}s` : 'special events through the month');
  return t ? `In ${month.title.split(' ')[0]}: ${t}.` : '';
};


// Responsive photo, rendered only when its optimized files exist (no empty placeholders).
const photoKey = (slot) => (content.photoSlots || {})[slot];
const pic = (key, sizes, lazy = true) => {
  const a = (content.photos || {})[key];
  if (!a || !existsSync(join(root, 'public/img', `${a.base}-800.webp`))) return '';
  const set = (ext) => [800, 1280].filter((w) => existsSync(join(root, 'public/img', `${a.base}-${w}.${ext}`))).map((w) => `img/${a.base}-${w}.${ext} ${w}w`).join(', ');
  const pos = a.pos ? ` style="object-position: ${esc(a.pos)}"` : '';
  return `<picture>
                <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
                <img src="img/${a.base}-800.jpg" srcset="${set('jpg')}" sizes="${sizes}" alt="${esc(a.alt)}" width="${a.w}" height="${a.h}"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async"${pos}>
              </picture>`;
};
const photo = (key, cls, sizes) => {
  const p = pic(key, sizes);
  return p ? `
            <figure class="${cls}">
              ${p}
            </figure>` : '';
};

const fill = (t) => String(t).replace('{{weekly}}', weeklyText(featured));

const blocks = {
  // Past highlights: compact cards (the monthly calendar above shows what's on now).
  activities: () => content.activityGroups.map((g) => `
          <section class="past-card" aria-labelledby="ag-${g.id}">
            <h3 id="ag-${g.id}">${esc(g.title)}</h3>
            <ul class="activity-list" role="list">${g.items.map((it) => `
              <li>
                <p class="activity-name">${esc(it.name)}</p>
                <p class="activity-desc">${rich(it.desc)}</p>
                <p class="activity-note">${esc(it.note)}</p>
              </li>`).join('')}
            </ul>
          </section>`).join('') + '\n        ',

  // Monthly calendar: weekly rhythm, a month grid (wide screens, print) and a week-by-week list (phones).
  calendar: () => cal.months.map((month) => {
    const r = rhythm(month);
    const [y, m] = month.id.split('-').map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const byDate = {};
    month.events.forEach((e) => (byDate[e.date] = byDate[e.date] || []).push(e));
    const obs = {};
    (month.observances || []).forEach((o) => (obs[o.date] = o));
    // Days of the week that have programs get wider columns
    const busy = new Set(month.events.map((e) => parseDate(e.date).wd));
    const weights = DAYS.map((_, i) => (busy.has(i) ? 1.7 : 0.75));
    const total = weights.reduce((a, b) => a + b, 0);
    const evHtml = (e) => {
      const k = kindOf(e), v = venueOf(e), away = e.venue && e.venue !== cal.defaultVenue;
      return `<div class="ev" data-accent="${k.accent}">${icon(k.icon, 'ev-ico')}<span class="ev-name">${esc(k.name)}</span><span class="ev-time">${timeHtml(e.start, e.end)}</span>${away ? `<span class="ev-where">${icon('i-pin', 'ico')}${esc(v.name)}, ${esc(v.street.replace('Drive', 'Dr.'))}</span>` : ''}</div>`;
    };
    const cells = [];
    for (let i = 0; i < first; i++) cells.push('<td class="out"></td>');
    for (let d = 1; d <= daysIn; d++) {
      const date = ymd(y, m, d), list = byDate[date] || [], o = obs[date];
      const wd = parseDate(date).wd;
      cells.push(`<td class="day${list.length ? ' has' : ''}" data-date="${date}"><span class="d-num"><span class="visually-hidden">${DAYS[wd]}, ${MONTHS[m - 1]} </span>${d}</span>${o ? `<div class="obs">${icon(o.icon, 'obs-ico')}${esc(o.name)}</div>` : ''}${list.map(evHtml).join('')}${!list.length ? '<span class="visually-hidden">No program</span>' : ''}</td>`);
    }
    while (cells.length % 7) cells.push('<td class="out"></td>');
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(`
                <tr>${cells.slice(i, i + 7).join('')}</tr>`);
    // Week-by-week list
    const weeks = [];
    month.events.forEach((e) => {
      const d = parseDate(e.date), monday = d.d - ((d.wd + 6) % 7);
      const key = Math.max(1, monday);
      let w = weeks.find((x) => x.key === key);
      if (!w) weeks.push((w = { key, events: [] }));
      w.events.push(e);
    });
    const list = weeks.map((w) => `
              <section class="cl-week" data-last="${w.events[w.events.length - 1].date}">
                <h4 class="cl-week-title">Week of ${DAYS[parseDate(ymd(y, m, w.key)).wd]}, ${MONTHS[m - 1]} ${w.key}</h4>
                <ol class="cl-items" role="list">${w.events.map((e) => {
                  const d = parseDate(e.date), k = kindOf(e), v = venueOf(e), o = obs[e.date];
                  return `
                  <li class="cl-item" data-date="${e.date}" data-accent="${k.accent}">
                    <p class="cl-date" aria-hidden="true"><span class="cl-wd">${DAYS[d.wd].slice(0, 3)}</span><span class="cl-num">${d.d}</span></p>
                    <div class="cl-body">
                      <h5 class="cl-name">${icon(k.icon, 'cl-ico')}<span><span class="visually-hidden">${DAYS[d.wd]}, ${MONTHS[m - 1]} ${d.d}: </span>${esc(k.name)}</span></h5>
                      <p class="cl-time">${icon('i-clock', 'ico')}<span>${timeHtml(e.start, e.end)}</span></p>
                      <p class="cl-where${e.venue && e.venue !== cal.defaultVenue ? ' cl-away' : ''}">${icon('i-pin', 'ico')}<span>${e.venue && e.venue !== cal.defaultVenue ? `${esc(venueLine(v))}, ${esc(v.street)}` : esc(v.room || v.name)}</span></p>${o ? `
                      <p class="cl-obs">${icon(o.icon, 'ico')}${esc(o.name)}</p>` : ''}
                    </div>
                  </li>`;
                }).join('')}
                </ol>
              </section>`).join('');
    const home = cal.venues[cal.defaultVenue];
    const kindsUsed = [...new Set(month.events.map((e) => e.kind))];
    return `
          <div class="cal${month === featured ? ' is-featured' : ''}" data-month="${month.id}">
            <ul class="weekly reveal" role="list" aria-label="Every week in ${esc(month.title.split(' ')[0])}">${r.regular.map((x) => `
              <li class="wk" data-accent="${kindOf(x.e).accent}"><span class="wk-icon">${icon(kindOf(x.e).icon)}</span><span class="wk-text"><span class="wk-day">Every ${DAYS[x.wd]}</span><strong class="wk-name">${esc(kindOf(x.e).name)}</strong><span class="wk-time">${timeRange(x.e.start, x.e.end)}</span></span></li>`).join('')}${r.special.length ? `
              <li class="wk" data-accent="sunset"><span class="wk-icon">${icon('a-celebrate')}</span><span class="wk-text"><span class="wk-day">${r.specialDays.length === 1 ? `${DAYS[r.specialDays[0]]}s` : 'Through the month'}</span><strong class="wk-name">Special events</strong><span class="wk-time">${r.special.map((e) => esc(kindOf(e).name)).join(', ')}</span></span></li>` : ''}
            </ul>
            <div class="cal-card reveal">
              <div class="cal-head">
                <svg class="cal-palms" viewBox="0 0 400 160" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false"><use href="#palm" x="268" y="-6" width="120" height="170"/><g transform="translate(722 0) scale(-1 1)"><use href="#palm" x="318" y="30" width="86" height="132"/></g></svg>
                <div class="cal-head-text">
                  <h3 class="cal-title">${esc(month.title)}</h3>
                  <p class="cal-sub">${icon('i-pin', 'ico')}${esc(venueFull(home))}</p>
                </div>
                <div class="cal-actions">
                  <button class="btn btn-light cal-print" type="button" hidden>${icon('a-print', 'ico')}Print calendar</button>${month.pdf ? `
                  <a class="btn btn-light" href="${esc(month.pdf)}" download>${icon('a-download', 'ico')}Download PDF</a>` : ''}
                </div>
              </div>
              <ul class="cal-legend" role="list" aria-label="Key">${kindsUsed.map((k) => `<li data-accent="${cal.kinds[k].accent}">${icon(cal.kinds[k].icon)}${esc(cal.kinds[k].name)}</li>`).join('')}<li class="lg-none"><span class="lg-swatch"></span>No program</li></ul>
              <table class="cal-grid">
                <caption class="visually-hidden">${esc(month.title)} program calendar. Days without a program are shaded.</caption>
                <colgroup>${weights.map((w) => `<col style="width:${(w / total * 100).toFixed(2)}%">`).join('')}</colgroup>
                <thead><tr>${DAYS.map((d, i) => `<th scope="col"${busy.has(i) ? ' class="busy"' : ''}><span class="th-long">${d}</span><span class="th-short" aria-hidden="true">${d.slice(0, 3)}</span></th>`).join('')}</tr></thead>
                <tbody>${rows.join('')}
                </tbody>
              </table>
              <div class="cal-list">
                <div class="cl-earlier" hidden><button class="btn btn-ghost cl-toggle" type="button" aria-expanded="false">${icon('i-chevron', 'ico')}<span>Show earlier dates</span></button></div>${list}
              </div>
              <p class="cal-foot">Programs are facilitated by Island Breeze. No program on shaded days. For information, contact <strong>${esc(content.owner.name)}</strong> at <a class="tel-link" href="tel:+14163197763">${esc(content.owner.phone)}</a>.</p>
            </div>
          </div>`;
  }).join('') + '\n        ',

  // Event structured data: one Event per program day (helps "seniors chair yoga Markham"-type searches).
  'calendar-schema': () => {
    const site = 'https://island-breeze-seniors.pages.dev/';
    const events = cal.months.flatMap((month) => month.events.map((e) => {
      const k = kindOf(e), v = venueOf(e);
      return {
        '@type': 'Event',
        name: `${k.name}, Island Breeze Seniors Day Program`,
        description: `${k.desc} For adults 55+ in Markham. Contact ${content.owner.name} at ${content.owner.phone}.`,
        startDate: `${e.date}T${e.start}:00${cal.timezone}`,
        endDate: `${e.date}T${e.end}:00${cal.timezone}`,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: [v.room, v.name].filter(Boolean).join(', '), address: { '@type': 'PostalAddress', streetAddress: v.street, addressLocality: v.city, addressRegion: v.region, ...(v.postal ? { postalCode: v.postal } : {}), addressCountry: 'CA' } },
        image: [site + 'img/og-image.jpg'],
        organizer: { '@type': 'NGO', '@id': site + '#org', name: 'Island Breeze Seniors Day Program', url: site },
        audience: { '@type': 'PeopleAudience', suggestedMinAge: 55 },
        url: site + '#calendar',
      };
    }));
    return '\n  <script type="application/ld+json">\n  ' + JSON.stringify({ '@context': 'https://schema.org', '@graph': events }, null, 2).replace(/\n/g, '\n  ') + '\n  </script>\n  ';
  },

  'hero-times': () => {
    const r = rhythm(featured);
    const bits = r.regular.map((x) => `${DAYS[x.wd]}s ${shortRange(x.e.start, x.e.end)}`);
    if (r.specialDays.length === 1) bits.push(`${DAYS[r.specialDays[0]]} events`);
    return `${bits.join(', ')}. <a href="#calendar">See the calendar</a>`;
  },

  project: () => {
    const p = content.featuredProject;
    return `
          <h3>${esc(p.title)} <span class="project-year">(${esc(p.when)})</span></h3>
          <p>${rich(p.text)}</p>
          <ol class="project-timeline" role="list">${(p.timeline || []).map((t) => `
            <li><span class="pt-month">${esc(t.month)}</span><span><strong>${esc(t.title)}</strong> ${rich(t.text)}</span></li>`).join('')}
          </ol>${p.source ? `
          <p class="source-line">Source: ${src(p.source)}</p>` : ''}
        `;
  },

  'hero-photo': () => `
          ${pic(photoKey('hero'), '(max-width: 900px) 62vw, 300px', false)}
          `,

  gallery: () => content.gallery.filter((k) => pic(k, '')).map((k, i, all) => `
          <div class="slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${all.length}">
            <figure>
              ${pic(k, '(max-width: 700px) 86vw, 640px', i > 1)}
            </figure>
          </div>`).join('') + '\n        ',

  'join-photo': () => photo(photoKey('join'), 'photo photo-join reveal', '(max-width: 900px) 92vw, 480px') + '\n          ',

  'story-photo': () => photo(photoKey('story'), 'photo photo-story', '(max-width: 1000px) 92vw, 380px') + '\n          ',

  'callband-photo': () => `
        ${pic(photoKey('callband'), '180px')}
        `,

  steps: () => content.joinSteps.map((s, i) => `
            <li class="step reveal"><span class="step-num" aria-hidden="true">${i + 1}</span><div><h3>${esc(s.title)}</h3><p>${rich(s.text)}</p></div></li>`).join('') + '\n          ',

  faq: () => content.faq.map((f) => `
            <details class="faq-item">
              <summary><span>${esc(f.q)}</span><svg class="chev" aria-hidden="true"><use href="#i-chevron"/></svg></summary>
              <div class="faq-answer"><p>${fill(f.a)}</p></div>
            </details>`).join('') + '\n          ',

  milestones: () => content.milestones.map((m) => `
            <li class="milestone reveal">
              <p class="milestone-date">${esc(m.date)}</p>
              <div class="milestone-body">
                <h3>${esc(m.title)}</h3>
                <p>${rich(m.text)}</p>${m.source ? `
                <p class="source-line">Source: ${src(m.source)}</p>` : ''}
              </div>
            </li>`).join('') + '\n          ',

  // FAQPage structured data, built from the same answers as the "Common questions" accordion.
  'faq-schema': () => '\n  <script type="application/ld+json">\n  ' + JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plain(fill(f.a)) } })),
  }, null, 2).replace(/\n/g, '\n  ') + '\n  </script>\n  ',

  collaborators: () => content.collaborators.map((c) => `
              <li><h4>${esc(c.name)}</h4><p>${rich(c.text)}</p>${c.source ? `<p class="source-line">${src(c.source)}</p>` : ''}</li>`).join('') + '\n            ',

  funding: () => content.funding.map((c) => `
              <li><h4>${esc(c.name)}</h4><p>${rich(c.text)}</p>${c.source ? `<p class="source-line">${src(c.source)}</p>` : ''}</li>`).join('') + '\n            ',

  outings: () => content.outings.map((c) => `
              <li><h4>${esc(c.name)}</h4><p>${rich(c.text)}</p></li>`).join('') + '\n            ',
};

let count = 0;
for (const [name, render] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- @content:${name} -->)[\\s\\S]*?(<!-- /@content:${name} -->)`);
  if (!re.test(html)) { console.error(`Marker for "${name}" not found in index.html`); process.exit(1); }
  const body = render(); // function replacement: content like "$18,750" must not be read as a $1 pattern
  html = html.replace(re, (_, open, close) => open + body + close);
  count++;
}
writeFileSync(htmlPath, html);

// Data for main.js (next-up card, today highlight) and the Help assistant's schedule answers.
const calData = {
  _readme: 'Generated by scripts/render-content.mjs from content/site-content.json. Do not edit by hand.',
  owner: content.owner, timezone: cal.timezone, defaultVenue: cal.defaultVenue, venues: cal.venues, kinds: cal.kinds,
  weekly: weeklyText(featured),
  months: cal.months.map((mo) => ({ id: mo.id, title: mo.title, pdf: mo.pdf, observances: mo.observances || [],
    events: mo.events.map((e) => ({ ...e, time: timeRange(e.start, e.end), when: longDate(e.date) })) })),
};
writeFileSync(join(root, 'public/data/calendar.json'), JSON.stringify(calData, null, 2) + '\n');
console.log(`Rendered ${count} content blocks into public/index.html; wrote public/data/calendar.json`);
