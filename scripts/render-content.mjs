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
const src = (s) => !s ? '' : !s.url ? esc(s.label) : `<a class="source" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}<span class="visually-hidden"> (opens in a new tab)</span></a>`;
const statusLabel = { regular: 'Regular activity', project: 'Past workshop', event: 'Event' };
const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;


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
              <figcaption>${esc(content.photos[key].caption)}</figcaption>
            </figure>` : '';
};

const blocks = {
  latest: () => `${rich(content.latest.text)} ${src(content.latest.source)}`,

  activities: () => content.activityGroups.map((g) => `
          <section class="activity-group reveal" aria-labelledby="ag-${g.id}" data-accent="${g.accent}">
            <h3 id="ag-${g.id}"><span class="ag-icon">${icon(g.icon, 'draw')}</span>${esc(g.title)}</h3>${photo(photoKey(g.id), 'photo photo-group', '(max-width: 860px) 92vw, 540px')}
            <ul class="activity-list" role="list">${g.items.map((it) => `
              <li>
                <p class="activity-name">${esc(it.name)} <span class="tag tag-${it.status}">${statusLabel[it.status] || ''}</span></p>
                <p class="activity-desc">${rich(it.desc)}</p>
                <p class="activity-note">${esc(it.note)}</p>
              </li>`).join('')}
            </ul>
          </section>`).join('') + '\n        ',

  project: () => {
    const p = content.featuredProject;
    return `
          <p class="eyebrow">Recent project &middot; ${esc(p.when)}</p>
          <h3>${esc(p.title)}</h3>
          <p>${rich(p.text)}</p>
          <ol class="project-timeline" role="list">${(p.timeline || []).map((t) => `
            <li><span class="pt-month">${esc(t.month)}</span><span><strong>${esc(t.title)}</strong> ${rich(t.text)}</span></li>`).join('')}
          </ol>
          <p class="source-line">Source: ${src(p.source)}</p>
        `;
  },

  'about-art': () => photo(photoKey('about'), 'photo photo-wide', '(max-width: 1200px) 92vw, 1160px') + '\n      ',

  'hero-photo': () => `
          ${pic(photoKey('hero'), '(max-width: 900px) 62vw, 300px', false)}
          `,

  gallery: () => content.gallery.filter((k) => pic(k, '')).map((k, i, all) => `
          <li class="slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${all.length}">
            <figure>
              ${pic(k, '(max-width: 700px) 86vw, 640px', i > 1)}
              <figcaption>${esc(content.photos[k].caption)}</figcaption>
            </figure>
          </li>`).join('') + '\n        ',

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
              <div class="faq-answer"><p>${rich(f.a)}</p></div>
            </details>`).join('') + '\n          ',

  milestones: () => content.milestones.map((m) => `
            <li class="milestone reveal">
              <p class="milestone-date">${esc(m.date)}</p>
              <div class="milestone-body">
                <h3>${esc(m.title)}</h3>
                <p>${rich(m.text)}</p>
                <p class="source-line">Source: ${src(m.source)}</p>
              </div>
            </li>`).join('') + '\n          ',

  collaborators: () => content.collaborators.map((c) => `
              <li><h4>${esc(c.name)}</h4><p>${rich(c.text)}</p><p class="source-line">${src(c.source)}</p></li>`).join('') + '\n            ',

  funding: () => content.funding.map((c) => `
              <li><h4>${esc(c.name)}</h4><p>${rich(c.text)}</p><p class="source-line">${src(c.source)}</p></li>`).join('') + '\n            ',

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
console.log(`Rendered ${count} content blocks into public/index.html`);
