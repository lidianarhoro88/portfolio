import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const si = require('simple-icons');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'dist');
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
const site = read('site.json');
const profile = read('profile.json');
const projects = read('projects.json').map((p, i) => ({ ...p, order: i }));
const hasPortrait = fs.existsSync(path.join(ROOT, 'public', 'portrait.webp'));
const hasCv = fs.existsSync(path.join(ROOT, 'public', 'resume.pdf'));
const year = new Date().getFullYear();

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const em = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
const catLabel = id => (site.categories.find(c => c.id === id) || {}).label || id;
const ext = href => /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
const ghUrl = `https://github.com/${site.github}`;
const ico = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-back" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></symbol>
<symbol id="i-external" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
<symbol id="i-pause" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></symbol>
<symbol id="i-list" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></symbol>
<symbol id="i-cup" viewBox="0 0 24 24"><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm13 1h1a3 3 0 0 1 0 6h-1M8 2v3m4-3v3"/></symbol>
</defs></svg>`;

const LOGO = { 'Python': 'siPython', 'PostgreSQL': 'siPostgresql', 'Pandas': 'siPandas', 'JavaScript': 'siJavascript', 'HTML': 'siHtml5', 'CSS': 'siCss3', 'Chart.js': 'siChartdotjs', 'SAP': 'siSap', 'MySQL': 'siMysql', 'GitHub': 'siGithub' };
const TXT = { 'Power BI': 'BI', 'SQL Server': 'SS', 'SQL': 'SQL', 'Excel': 'XL', 'DAX': 'DAX', 'Power Query': 'PQ' };
const logo = t => {
  const k = LOGO[t];
  if (k && si[k]) return `<span class="logo" style="color:var(--wine)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${si[k].path}"/></svg></span>`;
  return `<span class="logo txt" aria-hidden="true">${esc(TXT[t] || t.slice(0, 2).toUpperCase())}</span>`;
};

/* generated visual previews */
const viz = (p, big = false) => {
  if (p.image) return `<img src="${p.image}" alt="${esc(p.title)} preview" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top left">`;
  const v = p.visual, s = v.steps;
  const head = (label) => `<div class="viz-head"><span class="dots"><i></i><i></i><i></i></span><span>${esc(label)}</span></div>`;
  if (v.type === 'architecture') return `<div class="viz">${head('Architecture / ' + p.slug)}<div class="viz-flow">${s.map((x, i) => `${i ? '<span class="viz-arrow">→</span>' : ''}<div class="viz-node${i === s.length - 1 ? ' hl' : /gold/i.test(x) ? ' gold' : ''}">${esc(x)}</div>`).join('')}</div><div class="viz-foot"><span>${esc(p.tools.slice(0, 3).join(' / '))}</span><span>Architecture overview</span></div></div>`;
  if (v.type === 'workflow') return `<div class="viz">${head('Workflow / ' + p.slug)}<div class="viz-steps">${s.map((x, i) => `<div class="viz-step"><span>0${i + 1}</span><b>${esc(x)}</b></div>`).join('')}</div><div class="viz-foot"><span>${esc(p.tools.slice(0, 3).join(' / '))}</span><span>Workflow overview</span></div></div>`;
  if (v.type === 'dashboard') {
    const h = [42, 66, 54, 80, 61, 92, 70, 85, 58, 76];
    return `<div class="viz">${head('Report / ' + p.slug)}<div class="viz-dash">${s.slice(0, 3).map(x => `<div class="viz-kpi"><small>${esc(x)}</small><i style="width:${50 + x.length * 4}%"></i></div>`).join('')}<div class="viz-chart">${h.map(x => `<i style="height:${x}%"></i>`).join('')}</div></div><div class="viz-foot"><span>${esc(p.tools.slice(0, 3).join(' / '))}</span><span>Report preview</span></div></div>`;
  }
  return `<div class="viz">${head('terminal / ' + p.slug)}<div class="viz-files">${s.map((x, i) => `<div class="viz-file"><span>0${i + 1}</span>${esc(x)}</div>`).join('')}</div><div class="viz-foot"><span>${esc(p.tools.slice(0, 3).join(' / '))}</span><span>Source preview ↗</span></div></div>`;
};

const card = p => `<article class="card reveal" data-search="${esc((p.title + ' ' + p.summary + ' ' + p.tools.join(' ') + ' ' + catLabel(p.category)).toLowerCase())}" data-kind="${p.kind}" data-status="${p.status}" data-category="${p.category}" data-title="${esc(p.title)}" data-case="${p.caseStudy ? 1 : 0}" data-order="${p.order}" data-repo="${esc(p.repo)}">
  <button class="card-media" type="button" data-preview="${p.slug}" aria-label="Preview ${esc(p.title)}">${viz(p)}<span class="open-hint">Open project</span></button>
  <div class="card-body">
    <div class="card-cat">${esc(catLabel(p.category))}${p.status === 'progress' ? '<span class="badge">In progress</span>' : ''}${p.kind === 'course' ? '<span class="badge wine">Course project</span>' : ''}</div>
    <h3><a href="/projects/${p.slug}/">${esc(p.title)}</a></h3>
    <p>${esc(p.summary)}</p>
    <div class="tags">${p.tools.slice(0, 4).map(t => `<span>${esc(t)}</span>`).join('')}</div>
    <div class="card-links"><a href="/projects/${p.slug}/">${p.caseStudy ? 'Follow the story' : 'Explore project story'} ${ico('arrow')}</a>${p.liveUrl ? `<a class="muted" href="${p.liveUrl}" target="_blank" rel="noopener">Live</a>` : ''}${p.repo ? `<a class="muted" href="${p.repo}" target="_blank" rel="noopener">GitHub</a>` : ''}</div>
  </div>
</article>`;

const head = (eyebrow, title, text, extra = '') => `<div class="section-head reveal"><div><div class="eyebrow">${eyebrow}</div><h2>${em(title)}</h2></div><div>${text ? `<p>${esc(text)}</p>` : ''}${extra}</div></div>`;
const tile = (href, k, b, s, cta = 'Explore') => `<a class="tile reveal" href="${href}"${ext(href)}><span>${esc(k)}</span><b>${esc(b)}</b><small>${esc(s)}</small><span class="arrow">${esc(cta)} ${ico('arrow')}</span></a>`;
const portrait = cls => hasPortrait ? `<img src="/portrait.webp" alt="${esc(site.name)}" width="600" height="750">` : `<div class="mono" role="img" aria-label="${esc(site.name)}">${esc(site.initials)}</div>`;

/* ---------- layout ---------- */
const navLink = (l, cur) => `<a href="${l.href}"${cur === l.href ? ' aria-current="page"' : ''}>${esc(l.label)}</a>`;
const header = cur => `<a class="skip" href="#main">Skip to content</a>${sprite}
<header class="header"><div class="nav-shell wrap">
  <a class="brand" href="/" aria-label="${esc(site.short)} home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${esc(site.brand)}<span class="brand-dot">.</span></span></a>
  <nav class="nav" aria-label="Main">
    ${site.nav.map(l => navLink(l, cur)).join('')}
    <div class="more"><button class="more-btn" type="button" aria-expanded="false" aria-haspopup="true">More ${ico('chev')}</button>
      <div class="more-menu">${site.more.map(l => navLink(l, cur)).join('')}</div></div>
  </nav>
  <button class="icon-btn search-btn" type="button" data-search aria-label="Find a project">${ico('search')}</button>
  <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch theme">${ico('sun', 'icon sun')}${ico('moon', 'icon moon')}</button>
  <a class="btn btn-primary btn-sm nav-cta" href="/contact/">Let’s connect</a>
  <button class="icon-btn menu-toggle" type="button" aria-expanded="false" aria-label="Menu">${ico('menu')}</button>
</div>
<nav class="mobile-nav wrap" aria-label="Mobile">${[...site.nav, ...site.more, { label: 'Contact', href: '/contact/' }].map(l => navLink(l, cur)).join('')}</nav>
</header>`;

const cta = () => `<section class="cta"><div class="wrap reveal"><div class="eyebrow">A question worth exploring?</div><h2>Let’s build something <em>reliable.</em></h2><a class="btn" href="/contact/">Start a conversation ${ico('arrow')}</a></div></section>`;

const footer = () => `<footer class="footer"><div class="wrap">
  <div class="footer-grid">
    <div><a class="brand" href="/"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${esc(site.brand)}<span class="brand-dot">.</span></span></a><p class="muted" style="margin-top:14px">${esc(site.tagline)}</p><div class="eyebrow" style="margin:0">${esc(site.location)} · ${esc(site.availability)}</div></div>
    <nav class="footer-links" aria-label="Footer">${[...site.nav, ...site.more, { label: 'Contact', href: '/contact/' }].map(l => `<a href="${l.href}">${esc(l.label)}</a>`).join('')}</nav>
    <div class="footer-social"><a href="${ghUrl}" target="_blank" rel="noopener">GitHub</a>${site.linkedin ? `<a href="${site.linkedin}" target="_blank" rel="noopener">LinkedIn</a>` : ''}${site.email ? `<a href="mailto:${site.email}">${esc(site.email)}</a>` : ''}</div>
  </div>
  <div class="footer-base"><span>© ${year} ${esc(site.name)}</span><span>${esc(site.footerNote)}</span><a href="#main">Back to top ↑</a></div>
</div></footer>
<div class="modal" id="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title"><div class="modal-box">
  <div class="modal-top"><h2 id="preview-title">Project preview</h2><button class="icon-btn" data-close aria-label="Close">${ico('x')}</button></div>
  <div class="preview-body" id="preview-content"></div>
  <div class="preview-nav"><button class="btn btn-sm" id="preview-prev" type="button">← Previous</button><span class="muted" id="preview-count"></span><button class="btn btn-sm" id="preview-next" type="button">Next →</button></div>
</div></div>
<div class="modal" id="search-modal" role="dialog" aria-modal="true" aria-labelledby="search-title"><div class="modal-box">
  <div class="modal-top"><h2 id="search-title">Find a project</h2><button class="icon-btn" data-close aria-label="Close">${ico('x')}</button></div>
  <label class="sr-only" for="search-input">Search project titles, tools, and topics</label>
  <input class="search-input" id="search-input" type="search" placeholder="Search project titles, tools, and topics" autocomplete="off">
  <ul class="search-results" id="search-results" role="listbox"></ul>
  <div class="modal-foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> to navigate · <span class="kbd">Enter</span> to open · <span class="kbd">Esc</span> to close</span><a class="link" href="/work/">Browse all work ↗</a></div>
</div></div>`;

const layout = ({ title, desc = site.description, cur, body }) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="${site.themeColor}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"><meta name="author" content="${esc(site.name)}">
<link rel="canonical" href="${site.url}${cur}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(site.name)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${site.url}${cur}"><meta property="og:image" content="${site.url}/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(site.name)} — data engineering and BI portfolio">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${site.url}/social-card.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;if(localStorage.getItem('paused')==='1')document.documentElement.classList.add('paused')}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/styles.css">
</head><body>${header(cur)}<main id="main">${body}</main>${cta()}${footer()}<script src="/assets/app.js" defer></script></body></html>`;

const pages = {};
const page = (p, o) => { pages[p] = layout({ ...o, cur: p }); };
const T = t => `${t} | ${site.name}`;

/* ---------- derived ---------- */
const featured = [...projects.filter(p => p.featured), ...projects.filter(p => !p.featured && p.kind === 'original')].slice(0, 6);
const building = projects.filter(p => p.status === 'progress');
const dashboards = projects.filter(p => p.dashboard);
const originals = projects.filter(p => p.kind === 'original');
const caseStudies = projects.filter(p => p.caseStudy);
const inProgressCourses = profile.learning.filter(l => l.status === 'In progress');
const toolsAll = [...new Set(projects.flatMap(p => p.tools))];
const liveBtn = (p, primary = false) => p.liveUrl ? `<a class="btn${primary ? ' btn-primary' : ''}" href="${p.liveUrl}" target="_blank" rel="noopener">${esc(p.liveLabel || 'Live demo')} ${ico('external')}</a>` : '';
const sourceBtn = p => p.repo ? `<a class="btn" href="${p.repo}" target="_blank" rel="noopener">Source on GitHub ${ico('external')}</a>` : `<span class="btn" aria-disabled="true" style="opacity:.6;cursor:default">Repository coming soon</span>`;

/* ---------- HOME ---------- */
const exRows = [['O-101', 'Kadıköy', 120, ''], ['O-102', 'Beşiktaş', 95, ''], ['O-102', 'Beşiktaş', 95, 'dup'], ['O-103', 'Kadıköy', 80, ''], ['O-104', 'TEST', 999, 'test'], ['O-105', 'Şişli', 140, '']];
const exTable = mode => `<table class="mini"><thead><tr><th>Order</th><th>Branch</th><th>Amount (₺)</th>${mode !== 'raw' ? '<th>Check</th>' : ''}</tr></thead><tbody>${exRows.map(([o, b, a, f]) => `<tr${mode === 'clean' && f ? ' class="flag"' : mode === 'answer' && f ? ' class="drop"' : ''}><td>${o}</td><td>${b}</td><td>${a}</td>${mode !== 'raw' ? `<td>${f === 'dup' ? 'Duplicate order' : f === 'test' ? 'Test record' : 'OK'}</td>` : ''}</tr>`).join('')}</tbody></table>`;

page('/', { title: `${site.name} | ${site.role}`, body: `
<section class="hero"><div class="wrap hero-grid">
  <div class="reveal">
    <div class="hero-name">${esc(site.name)}</div>
    <div class="hero-role">${esc(site.roleLine)}</div>
    <h1>From scattered systems to <em>clear answers.</em></h1>
    <p class="lede">Nine years of turning operational data into one trusted place: ETL pipelines in SQL Server and Python, star schemas, and Power BI dashboards that management actually uses.</p>
    <div class="btns"><a class="btn btn-primary" href="/work/">Explore my work ${ico('arrow')}</a><a class="btn" href="/services/">Work with me</a></div>
    <div class="hero-meta"><span class="pin">${esc(site.location)} / ${esc(site.availability)}</span><button class="pause-btn" type="button" data-pause aria-pressed="false">${ico('pause')}<span class="label">Pause animation</span></button></div>
  </div>
  <div class="stage reveal" aria-label="Portrait and toolkit">
    <div class="portrait">${portrait()}</div>
    <div class="portrait-tag">The person behind the models<b>${esc(site.initials)} · ${esc(site.short)}</b></div>
    ${['SQL', 'Python', 'Power BI'].map(t => `<span class="chip-float">${logo(t)}${esc(t)}</span>`).join('')}
  </div>
</div>
<div class="wrap"><div class="hero-ribbon">Structure. Context. Clarity.</div></div></section>

<section class="toolkit" aria-label="Core toolkit"><div class="wrap toolkit-row"><span class="toolkit-label">My core toolkit</span>
<div class="marquee"><div class="marquee-track">${[...site.toolkit, ...site.toolkit].map(t => `<span class="tool">${logo(t)}${esc(t)}</span>`).join('')}</div></div></div></section>

<section class="section tight"><div class="wrap">
  <div class="disciplines reveal"><div>A portfolio in three connected disciplines.</div>
    <a href="/work/?category=engineering"><span>01 / Engineer</span><b>Warehouses & pipelines</b></a>
    <a href="/dashboards/"><span>02 / Analyze</span><b>Reports & dashboards</b></a>
    <a href="/resume/"><span>03 / Coordinate</span><b>Systems & projects</b></a></div>
  <div class="recruiter-strip reveal"><b>Here with a role or project in mind?</b><a class="link" href="/recruiters/">The 60-second overview ${ico('arrow')}</a></div>
</div></section>

<section class="section" id="work"><div class="wrap">
  ${head('<b>Selected work</b> / Open the notebook <span class="tag">Built with context</span>', 'From raw tables to *something useful.*', 'Explore the warehouses, pipelines and dashboards behind the work. Real repositories, documented choices, and room to keep improving.')}
  <div class="grid grid-3" data-preview-scope>${featured.map(card).join('')}</div>
  <div class="section-foot"><span>${originals.length} original projects. ${dashboards.length} reporting projects. One connected collection.</span><a class="btn" href="/work/">Explore the full collection ${ico('arrow')}</a></div>
</div></section>

<section class="section band"><div class="wrap">
  ${head('<b>Currently building</b>', 'Still asking. *Still improving.*', 'A look at the projects I’m actively shaping right now.', `<a class="link" href="/work/?status=progress" style="margin-top:12px">See work in progress ${ico('arrow')}</a>`)}
  <div class="building">${building.map(p => `<a class="build-card reveal" href="/projects/${p.slug}/"><span class="badge" style="align-self:flex-start">In progress</span><h3>${esc(p.title)}</h3><p class="muted" style="margin:0">${esc(p.summary)}</p><span class="link">Explore the project ${ico('arrow')}</span></a>`).join('')}</div>
</div></section>

<section class="section"><div class="wrap">
  ${head('<b>On screen</b> / Dashboard collection <span class="tag">Report previews</span>', 'A closer look. *A clearer picture.*', 'Explore the reports behind the repositories, from coffee shop branches to logistics routes.')}
  <div class="grid grid-3" data-preview-scope>${dashboards.slice(0, 3).map(p => `<article class="card reveal"><a class="card-media" href="/dashboards/${p.slug}/">${viz({ ...p, visual: { type: 'dashboard', steps: p.pages.length ? p.pages : p.visual.steps } })}<span class="open-hint">Explore report</span></a><div class="card-body"><div class="card-cat">Interactive report</div><h3><a href="/dashboards/${p.slug}/">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p><div class="card-links"><a href="/dashboards/${p.slug}/">View report preview ${ico('arrow')}</a>${p.repo ? `<a class="muted" href="${p.repo}" target="_blank" rel="noopener">GitHub</a>` : ''}</div></div></article>`).join('')}</div>
  <div class="section-foot"><span>${dashboards.length} reporting projects, with source links and previews.</span><a class="btn" href="/dashboards/">Explore all dashboards ${ico('arrow')}</a></div>
</div></section>

<section class="section band"><div class="wrap">
  ${head('<b>02 / How I think</b> <span class="tag">Clarity is a process</span>', 'The dashboard is *the last step.*', 'Useful analytics starts with the question, the grain, and the quality of the data underneath. Here’s a tiny example of how I connect them.')}
  <div class="think">
    <div class="think-steps reveal">
      <div class="think-step"><span>01</span><div><b>Name the decision</b><small>Start from the choice someone actually has to make.</small></div></div>
      <div class="think-step"><span>02</span><div><b>Make the data agree</b><small>Check the grain, the keys and the records that shouldn’t be there.</small></div></div>
      <div class="think-step"><span>03</span><div><b>Answer, then explain</b><small>Show the result and the rule that produced it.</small></div></div>
    </div>
    <div class="example reveal">
      <div class="example-head"><div><div class="eyebrow" style="margin:0 0 4px">The thinking, in practice / Illustrative</div><b>Which branch sold most this week?</b></div>
        <div class="seg" role="tablist" data-tabs><button role="tab" aria-selected="true" aria-controls="ex-raw">Raw</button><button role="tab" aria-selected="false" aria-controls="ex-clean">Checked</button><button role="tab" aria-selected="false" aria-controls="ex-answer">Answer</button><span class="sr-only" aria-live="polite" data-tabs-live></span></div></div>
      <div class="example-body">
        <div class="panel active" id="ex-raw">${exTable('raw')}<div class="example-note">Summed as-is, the “TEST” branch wins with ₺999. That’s the kind of answer a dashboard can show with total confidence.</div></div>
        <div class="panel" id="ex-clean">${exTable('clean')}<div class="example-note">One order appears twice and one record is a system test. Both are flagged, not silently deleted, so the rule is visible.</div></div>
        <div class="panel" id="ex-answer">${exTable('answer')}<div class="example-note"><span class="example-answer">Kadıköy · ₺200</span><br>Rule: one row per order, test branches excluded. Invented records, transparent logic.</div></div>
      </div>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap split">
  <div class="photo-card reveal">${portrait()}</div>
  <div class="reveal"><div class="eyebrow"><b>The person</b> / The practice</div><h2>Systems background. <em>Data-first habits.</em></h2>
    <p class="lede" style="margin-top:22px">My path runs from computer systems engineering and information coordination to data warehousing and BI roles in pharmaceutical distribution and construction in Istanbul.</p>
    <p class="muted">I work across SQL Server, Python, PostgreSQL and Power BI, with SAP, Microsoft and Google credentials. Coordinating people and systems is part of the practice too.</p>
    <div class="btns" style="margin-top:26px"><a class="btn" href="/about/">More about my journey ${ico('arrow')}</a><a class="link" href="/resume/">Experience & education</a></div></div>
</div></section>

<section class="section band"><div class="wrap">
  ${head('<b>A useful collaboration</b>', 'Bring the question. *Let’s model it.*', '')}
  <div class="tiles">${profile.services.map((s, i) => tile(`/services/#service-${i}`, `0${i + 1} / ${s.title}`, s.line, s.points[0])).join('')}</div>
  <div class="section-foot"><span>Small, well-documented work that your team can keep running.</span><a class="btn" href="/services/">How I can help ${ico('arrow')}</a></div>
</div></section>

<section class="section"><div class="wrap">
  ${head('<b>Current study</b> / Connected to the work <span class="tag">Snapshot · ' + site.snapshot + '</span>', 'The next layer *of understanding.*', 'Continuing to strengthen the tools behind the projects. Coursework and hands-on evidence each have their own place.')}
  <div class="tiles">${inProgressCourses.slice(0, 3).map(c => tile(`/learning/#course-${c.id}`, `${c.status} · ${c.provider}`, c.title, c.tags.join(' · '), 'Explore the learning log')).join('')}</div>
  <div class="section-foot"><span>${profile.learning.length} courses and programmes across SQL, BI, data engineering and cloud.</span><a class="btn" href="/learning/">All courses & related work ${ico('arrow')}</a></div>
</div></section>

<section class="section band"><div class="wrap">
  ${head('<b>Writing</b> / Keep the conversation going', 'Build it. Explain it. *Share what I learn.*', 'Notes, dashboards and reflections from the work. Explore recent posts.')}
  <div class="tiles">${profile.posts.map(p => tile(`/posts/#post-${p.id}`, p.topic, p.title, p.summary, 'Read & preview the post')).join('')}</div>
  <div class="section-foot"><span>Recent posts and project write-ups.</span><a class="btn" href="/posts/">Explore posts ${ico('arrow')}</a></div>
</div></section>

<section class="section"><div class="wrap">
  ${head('<b>Learning in the open</b> <span class="tag">Build. Explain. Share.</span>', 'Good questions deserve *good company.*', '')}
  <div class="tiles">
    ${tile('/community/', '01 / Community', 'Learning in public', 'Sharing builds and lessons with data learners in Arabic and English.')}
    ${tile('/learn/', '02 / Resources', 'Field notes & labs', 'Excel, SQL, warehousing and data-cleaning notes I write as I learn.')}
    ${tile('/credentials/', '03 / Continued learning', 'Courses & credentials', 'A collected view of my learning across BI, systems and data engineering.')}
  </div>
</div></section>` });

/* ---------- WORK ---------- */
const catCount = id => projects.filter(p => id === 'all' || p.category === id).length;
page('/work/', { title: T('Work & GitHub repositories'), desc: `Browse ${site.short}’s data warehouses, ETL pipelines, BI dashboards and GitHub repositories.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Work</b> / From question to implementation</div><h1>A collection of <em>connected builds.</em></h1><p class="lede">Warehouses, pipelines, dashboards and learning projects. Explore the case studies or search the full GitHub collection.</p>
<div class="stats"><span><b>${projects.length}</b>curated projects</span><span><b>${caseStudies.length}</b>case studies</span><span><b>${dashboards.length}</b>reporting projects</span><a class="link" href="${ghUrl}" target="_blank" rel="noopener">GitHub profile ${ico('external')}</a></div></div></section>
<section class="section" style="padding-top:0"><div class="wrap">
  <div class="eyebrow"><b>GitHub</b> / The full collection <span class="tag">Source snapshot ${site.snapshot}</span></div>
  <div class="filters" id="work-filters" data-github="${site.github}">
    <div class="filter-row">
      <label class="field">Search repositories<input id="f-q" type="search" placeholder="Try SQL, Power BI, warehouse…"></label>
      <label class="field">Repository type<select id="f-kind"><option value="all">All repositories</option><option value="original">Original repositories</option><option value="course">Course projects</option><option value="fork">Forks & learning</option></select></label>
      <label class="field">Project status<select id="f-status"><option value="all">All projects</option><option value="progress">In progress</option><option value="done">Completed</option></select></label>
      <label class="field">Sort by<select id="f-sort"><option value="case">Case studies first</option><option value="updated">Recently updated</option><option value="name">Name · A to Z</option></select></label>
    </div>
    <div class="chips"><button class="chip" type="button" data-cat="all" aria-pressed="true">All work <small>${catCount('all')}</small></button>${site.categories.map(c => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="false">${esc(c.label)} <small>${catCount(c.id)}</small></button>`).join('')}</div>
  </div>
  <div class="result-bar"><span>Open a project to explore its preview, toolkit and source. · <b id="work-count"></b></span><div class="seg"><button type="button" data-view="grid" aria-pressed="true">${ico('grid')} <span class="sr-only">Gallery</span>Gallery</button><button type="button" data-view="list" aria-pressed="false">${ico('list')} <span class="sr-only">List</span>List</button></div></div>
  <div class="grid grid-3" id="work-grid" data-preview-scope>${projects.map(card).join('')}</div>
  <div class="empty" id="work-empty" hidden>No project matches these filters yet. Try clearing the search.</div>
  <p class="note" id="gh-status">Public source snapshot: ${site.snapshot}. Checking current GitHub metadata…</p>
  <p class="note">New public repositories appear here automatically. Course projects keep their original author credit. Case studies and status are curated separately.</p>
</div></section>` });

/* ---------- PROJECT PAGES ---------- */
const related = p => projects.filter(x => x.slug !== p.slug).map(x => ({ x, s: x.tools.filter(t => p.tools.includes(t)).length + (x.category === p.category ? 1 : 0) })).sort((a, b) => b.s - a.s).slice(0, 3).map(({ x }) => x);
projects.forEach(p => {
  const gh = p.repo ? p.repo.replace('https://github.com/', '') : '';
  page(`/projects/${p.slug}/`, { title: T(p.title), desc: p.summary, body: `
<section class="proj-head"><div class="wrap">
  <a class="back" href="/work/">${ico('back')} All work</a>
  <div class="eyebrow"><b>${esc(p.eyebrow)}</b>${p.status === 'progress' ? '<span class="tag">In progress</span>' : ''}${p.kind === 'course' ? '<span class="tag">Course project</span>' : ''}</div>
  <h1>${esc(p.title)}</h1><p class="lede">${esc(p.summary)}</p>
  <div class="btns" style="margin-top:28px"><a class="btn btn-primary" href="#project-story">Follow the project story ${ico('arrow')}</a>${liveBtn(p)}${sourceBtn(p)}${p.dashboard ? `<a class="btn" href="/dashboards/${p.slug}/">Report preview</a>` : ''}<button class="btn copy-btn" type="button" data-copy>${ico('copy')}<span class="label">Copy page link</span></button></div>
</div></section>
<section id="project-story"><div class="wrap">
  <div class="eyebrow"><b>The project</b> / Follow the thread</div><h2>A question. A process. <em>Work you can explore.</em></h2>
  <p class="muted" style="margin-top:14px">Follow the decisions behind the implementation, then inspect the original work.</p>
  <nav class="story-nav" aria-label="Project story"><a href="#story-question"><span>01</span><b>The question</b></a><a href="#story-build"><span>02</span><b>The approach</b></a><a href="#story-result"><span>03</span><b>Explore the result</b></a><a href="#story-evidence"><span>04</span><b>Source evidence</b></a></nav>

  <div class="story" id="story-question"><div><div class="eyebrow">01 / Why this work exists</div><h3>The question behind the build.</h3><p class="lede">${esc(p.question)}</p></div>
    <div class="facts"><div class="fact"><small>Project</small><b>${esc(p.title)}</b></div><div class="fact"><small>Category</small><b>${esc(catLabel(p.category))}</b></div><div class="fact"><small>Status</small><b>${p.status === 'progress' ? 'In progress' : 'Completed'}</b></div>${p.credit ? `<div class="fact"><small>Credit</small><b>${esc(p.credit)}</b></div>` : ''}</div></div>

  <div class="story" id="story-build"><div><div class="eyebrow">02 / The choices & connections</div><h3>Follow the implementation.</h3>
    <ol class="steps-list">${p.approach.map((a, i) => `<li><span>0${i + 1}</span><div>${esc(a)}</div></li>`).join('')}</ol>
    <div class="tags">${p.tools.map(t => `<a href="/work/?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div></div>
    <div class="facts">${p.tools.map(t => `<div class="fact" style="display:flex;gap:12px;align-items:center">${logo(t)}<b>${esc(t)}</b></div>`).join('')}</div></div>

  <div class="story" id="story-result"><div><div class="eyebrow">03 / Open the work</div><h3>See the work. Inspect the details.</h3><p>${esc(p.result)}</p>
    <div class="preview-lg">${viz(p, true)}</div><p class="caption">${esc(p.visual.steps.join(' → '))}</p></div>
    <div class="facts">${liveBtn(p)}${p.dashboard ? `<a class="btn" href="/dashboards/${p.slug}/">Explore report preview ${ico('arrow')}</a>` : ''}${p.repo ? `<a class="btn" href="${p.repo}#readme" target="_blank" rel="noopener">Read the documentation ${ico('external')}</a><a class="btn" href="${p.repo}" target="_blank" rel="noopener">View the original source ${ico('external')}</a>` : '<p class="muted">The repository will be linked here once it is published.</p>'}</div></div>

  <div class="story" id="story-evidence"><div><div class="eyebrow">04 / The work behind the claim</div><h3>Choose where to look deeper.</h3>
    ${p.files.length ? `<div data-file-filter><label class="field" style="margin-bottom:12px">Find a source file<input type="search"></label><div class="chips" style="margin-bottom:14px">${['all', 'doc', 'code', 'report'].map((t, i) => `<button class="chip" type="button" data-type="${t}" aria-pressed="${i === 0}">${['All files', 'Documentation', 'Code & configuration', 'Reports & models'][i]}</button>`).join('')}</div></div><ul class="list-rows" style="list-style:none;padding:0">${p.files.map(f => `<li data-type="${f.type}" class="row"><a class="link" href="${p.repo}/blob/main/${f.path}" target="_blank" rel="noopener">${esc(f.path)}</a><small>${esc(f.type.toUpperCase())}</small></li>`).join('')}</ul>`
      : `<p>${p.repo ? 'Every script, model and note lives in the repository. Open it to inspect the full history of the build.' : 'Source files will be linked here as soon as the repository is public.'}</p>`}
    <div class="scope"><b>Context & scope</b>${esc(p.scope)}</div></div>
    <div>${gh ? `<div class="gh-live" data-gh-repo="${gh}"><div class="eyebrow" style="margin:0">Latest from GitHub</div><b data-gh-updated>Checking the repository…</b><p class="muted" data-gh-desc style="margin:0"></p><small data-gh-meta></small><a class="link" href="${p.repo}/commits" target="_blank" rel="noopener">Explore source changes ${ico('external')}</a></div>` : ''}</div></div>
</div></section>
<section class="section band"><div class="wrap">${head('<b>Keep exploring</b> / Connected work', 'A different question. *A connected skill.*', '')}
  <div class="grid grid-3" data-preview-scope>${related(p).map(card).join('')}</div></div></section>` });
});

/* ---------- DASHBOARDS ---------- */
const dashCard = p => `<article class="card reveal"><a class="card-media" href="/dashboards/${p.slug}/">${viz({ ...p, visual: { type: 'dashboard', steps: p.pages.length ? p.pages : p.visual.steps } })}<span class="open-hint">Explore report</span></a><div class="card-body"><div class="card-cat">${esc(p.tools.slice(0, 2).join(' · '))}</div><h3><a href="/dashboards/${p.slug}/">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p><div class="card-links"><a href="/dashboards/${p.slug}/">View report preview ${ico('arrow')}</a>${p.repo ? `<a class="muted" href="${p.repo}" target="_blank" rel="noopener">GitHub</a>` : ''}</div></div></article>`;
page('/dashboards/', { title: T('Dashboards & reports'), desc: `Power BI and interactive reports by ${site.short}, with source links and previews.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Dashboards</b> / Reports with their source</div><h1>A closer look. <em>A clearer picture.</em></h1><p class="lede">Each report links back to the model and the repository behind it, so the numbers can be traced.</p><div class="stats"><span><b>${dashboards.length}</b>reporting projects</span><span><b>${dashboards.reduce((n, p) => n + p.pages.length, 0)}</b>report pages</span></div></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="grid grid-3">${dashboards.map(dashCard).join('')}</div></div></section>` });
dashboards.forEach(p => {
  page(`/dashboards/${p.slug}/`, { title: T(`${p.title} report`), desc: p.summary, body: `
<section class="proj-head"><div class="wrap"><a class="back" href="/dashboards/">${ico('back')} All dashboards</a><div class="eyebrow"><b>Interactive report</b> / ${esc(p.tools.join(' · '))}</div><h1>${esc(p.title)}</h1><p class="lede">${esc(p.summary)}</p>
<div class="btns" style="margin-top:28px">${liveBtn(p, true)}<a class="btn${p.liveUrl ? '' : ' btn-primary'}" href="/projects/${p.slug}/">Follow the project story ${ico('arrow')}</a>${sourceBtn(p)}</div></div></section>
<section class="section" style="padding-top:0"><div class="wrap story" style="border:0;padding-top:0"><div><div class="preview-lg">${viz({ ...p, visual: { type: 'dashboard', steps: p.pages.length ? p.pages : p.visual.steps } }, true)}</div><p class="caption">Report preview. Screenshots of the live report can be added to this page.</p></div>
<div class="facts"><div class="eyebrow" style="margin:0">Report pages</div>${(p.pages.length ? p.pages : ['Overview']).map((x, i) => `<div class="fact"><small>Page 0${i + 1}</small><b>${esc(x)}</b></div>`).join('')}<div class="scope"><b>Context & scope</b>${esc(p.scope)}</div></div></div></section>` });
});

/* ---------- ABOUT ---------- */
const lenses = [
  { id: 'eng', label: 'Data engineering', title: 'A path from source files to a model people can trust.', q: 'What is the grain? Where can a record fail? Can every transformation be traced back to the raw file?', steps: [['Sources', 'Files, databases & ERP'], ['Bronze', 'Keep raw inputs as they arrived'], ['Silver', 'Clean keys, types & duplicates'], ['Gold', 'Facts, dimensions & grain'], ['Serve', 'A model reports can rely on']], rel: ['pharma-distribution-dbt', 'tcmb-fx-rates-pipeline'] },
  { id: 'bi', label: 'BI & analytics', title: 'From a business question to a page someone actually uses.', q: 'Who reads this? Which decision does it change? Is every measure defined once?', steps: [['Question', 'The decision behind the report'], ['Model', 'Star schema & relationships'], ['Measures', 'DAX defined once, reused'], ['Design', 'One page, one story'], ['Handover', 'Documented logic']], rel: ['construction-cost-control', 'sales-profit-executive-dashboard'] },
  { id: 'sys', label: 'Systems & coordination', title: 'Most data problems start as process problems.', q: 'Which system owns this record? Who changes it, and when? What does the team need to see?', steps: [['Process', 'How work actually flows'], ['Systems', 'ERP and tools that hold the data'], ['Requirements', 'What each team needs'], ['Alignment', 'Shared definitions'], ['Delivery', 'Coordinated rollout']], rel: ['invoice-intake-automation', 'logistics-analytics-sql-powerbi'] }
];
const skillGroups = [
  ['Data engineering & warehousing', ['SQL', 'Python', 'Pandas', 'ETL / ELT', 'Medallion architecture', 'Star schema', 'Stored procedures', 'SQL Server', 'PostgreSQL', 'Data quality']],
  ['Business intelligence', ['Power BI', 'DAX', 'Power Query', 'Excel PivotTables', 'Chart.js', 'KPI design', 'Google Analytics']],
  ['Systems, ERP & administration', ['SAP ERP', 'Business process modelling', 'Requirements gathering', 'Access control', 'Backup & recovery', 'Query optimisation', 'Data governance', 'Project coordination']],
  ['Web & tools', ['Git & GitHub', 'JavaScript', 'HTML & CSS', 'WordPress', 'SEO']]
];
page('/about/', { title: T(`About ${site.short}`), desc: `Meet ${site.name}, ${site.role} based in ${site.location}. Background, skills and experience.`, body: `
<section class="page-head"><div class="wrap split"><div class="reveal"><div class="eyebrow"><b>About</b> / My path into data</div><h1>A systems starting point. <em>The same question.</em></h1><p class="lede">${esc(profile.aboutIntro)}</p></div><div class="photo-card reveal" style="justify-self:end">${portrait()}</div></div></section>
<section class="section" style="padding-top:20px"><div class="wrap split" style="align-items:start">
  <div class="reveal"><div class="eyebrow"><b>${esc(site.name)}</b> / The person behind the work</div><h2>Hi, I’m <em>${esc(site.short)}.</em></h2></div>
  <div class="prose reveal">${profile.aboutBody.map(p => `<p>${esc(p)}</p>`).join('')}
    <div class="fact" style="margin:22px 0"><small>Professional headline</small><b>${esc(site.headline)}</b></div>
    <h3 style="margin:26px 0 10px">${esc(profile.focusTitle)}</h3><p>${esc(profile.focus)}</p>
    <p class="muted">Languages: ${esc(profile.languages.join(' · '))}</p>
    <div class="btns" style="margin-top:20px"><a class="btn" href="/resume/">Explore my experience ${ico('arrow')}</a><a class="link" href="/recruiters/">Skills connected to project evidence</a></div></div>
</div></section>
<section class="section band"><div class="wrap">${head('<b>The work</b> / A few concrete numbers <span class="tag">Snapshot ' + site.snapshot + '</span>', 'A growing practice. *Something you can inspect.*', 'These numbers describe the public portfolio and current learning log. Open the collection behind each one.')}
  <div class="numbers">
    <a class="number reveal" href="/resume/"><b>9+</b><span>Years in data & systems</span><small>Information systems, data warehousing and BI in Istanbul.</small></a>
    <a class="number reveal" href="/work/?kind=original"><b>${originals.length}</b><span>Original projects</span><small>Built from scratch; course projects counted separately.</small></a>
    <a class="number reveal" href="/work/"><b>${caseStudies.length}</b><span>Detailed case studies</span><small>The question, the implementation choices and the scope.</small></a>
    <a class="number reveal" href="/dashboards/"><b>${dashboards.length}</b><span>Reporting projects</span><small>Power BI and interactive reports with their source.</small></a>
    <a class="number reveal" href="/credentials/"><b>${profile.credentials.length}</b><span>Earned credentials</span><small>SAP, Microsoft, IBM, Google and Deloitte.</small></a>
  </div></div></section>
<section class="section"><div class="wrap">
  <div class="section-head reveal"><div><div class="eyebrow"><b>How I think</b> / Follow the data <button class="pause-btn" type="button" data-pause aria-pressed="false">${ico('pause')}<span class="label">Pause animation</span></button></div><h2>Different tools. <em>Connected thinking.</em></h2></div><p>Choose a focus to explore the workflow and the projects behind it.</p></div>
  <div class="seg" role="tablist" data-tabs style="margin-bottom:24px">${lenses.map((l, i) => `<button role="tab" aria-selected="${i === 0}" aria-controls="lens-${l.id}">${esc(l.label)}</button>`).join('')}<span class="sr-only" aria-live="polite" data-tabs-live></span></div>
  ${lenses.map((l, i) => `<div class="panel${i === 0 ? ' active' : ''}" id="lens-${l.id}"><div class="eyebrow">${esc(l.label)}</div><h3 style="font-size:1.8rem">${esc(l.title)}</h3><p class="muted" style="margin-top:10px">The questions I look for: ${esc(l.q)}</p>
    <ol class="flow">${l.steps.map(([b, s], j) => `<li><span>0${j + 1}</span><b>${esc(b)}</b><small>${esc(s)}</small><i class="flow-dot" aria-hidden="true"></i></li>`).join('')}</ol>
    <div class="eyebrow" style="margin-bottom:10px">Explore related work</div><div class="btns">${l.rel.map(s => { const r = projects.find(x => x.slug === s); return `<a class="btn btn-sm" href="/projects/${s}/">${esc(r.title)}</a>`; }).join('')}</div></div>`).join('')}
</div></section>
<section class="section band"><div class="wrap"><div class="eyebrow"><b>The toolkit</b> / Connected by purpose</div>
  <div class="skills" style="margin-top:26px">${skillGroups.map(([h, s]) => `<div class="reveal"><h3>${esc(h)}</h3><div class="tags">${s.map(x => `<span>${esc(x)}</span>`).join('')}</div></div>`).join('')}</div></div></section>
<section class="section"><div class="wrap split" style="align-items:start"><div><div class="eyebrow"><b>Experience</b> / Learning through delivery</div><h2>Where the <em>habits</em> come from.</h2></div>
  <div class="timeline">${profile.experience.map(x => `<div class="tl-item reveal"><div class="tl-meta">${esc([x.dates, x.place].filter(Boolean).join(' · ') || ' ')}</div><h3>${esc(x.role)}</h3><div class="org">${esc(x.org)}</div><ul>${x.points.map(pt => `<li>${esc(pt)}</li>`).join('')}</ul></div>`).join('')}</div></div></section>
<section class="section band"><div class="wrap">${head('<b>Learning & community</b>', 'Keep learning. *Keep sharing.*', '')}<div class="tiles">${tile('/community/', 'Community', 'The people behind the practice', 'Learning in public with data learners in Arabic and English.')}${tile('/credentials/', 'Credentials', 'Courses & credentials', 'SAP, Google Analytics and continued learning in data engineering.')}</div></div></section>
<section class="section"><div class="wrap"><div class="eyebrow"><b>The foundation</b></div><h2 style="margin-bottom:30px">Every model starts <em>with a system.</em></h2>
  <div class="edu reveal"><h3>${esc(profile.education.degree)}</h3><p class="org" style="color:var(--wine);font-weight:600;margin:6px 0 12px">${esc(profile.education.school)}${profile.education.year ? ' · ' + esc(profile.education.year) : ''}</p><p class="muted" style="margin:0">${esc(profile.education.note)}</p></div></div></section>` });

/* ---------- RESUME ---------- */
page('/resume/', { title: T('Résumé'), desc: `Experience, education and credentials of ${site.name}.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Résumé</b> / Experience & education</div><h1>The work, <em>in order.</em></h1><p class="lede">${esc(site.headline)}</p>
<div class="btns" style="margin-top:26px">${hasCv ? `<a class="btn btn-primary" href="/resume.pdf" download>Download CV (PDF) ${ico('arrow')}</a>` : `<a class="btn btn-primary" href="/contact/">Request the full CV ${ico('arrow')}</a>`}<a class="btn" href="/recruiters/">60-second overview</a></div></div></section>
<section class="section" style="padding-top:0"><div class="wrap split" style="align-items:start"><div><div class="eyebrow"><b>Experience</b></div></div>
<div class="timeline">${profile.experience.map(x => `<div class="tl-item"><div class="tl-meta">${esc([x.dates, x.place].filter(Boolean).join(' · ') || ' ')}</div><h3>${esc(x.role)}</h3><div class="org">${esc(x.org)}</div><ul>${x.points.map(pt => `<li>${esc(pt)}</li>`).join('')}</ul></div>`).join('')}</div></div></section>
<section class="section band"><div class="wrap split" style="align-items:start"><div><div class="eyebrow"><b>Education</b></div></div><div class="edu"><h3>${esc(profile.education.degree)}</h3><p style="color:var(--wine);font-weight:600;margin:6px 0 10px">${esc(profile.education.school)} · ${esc(profile.education.year)}</p><p class="muted" style="margin:0">${esc(profile.education.note)}</p></div></div></section>
<section class="section"><div class="wrap split" style="align-items:start"><div><div class="eyebrow"><b>Credentials</b></div></div><div class="list-rows">${profile.credentials.map(c => `<div class="row"><div><h3>${esc(c.title)}</h3><small>${esc(c.issuer)} · ${esc(c.area)}</small></div><span class="badge">${esc(c.date || c.status)}</span></div>`).join('')}</div></div></section>
<section class="section band"><div class="wrap"><div class="eyebrow"><b>Skills</b></div><div class="skills" style="margin-top:20px">${skillGroups.map(([h, s]) => `<div><h3>${esc(h)}</h3><div class="tags">${s.map(x => `<span>${esc(x)}</span>`).join('')}</div></div>`).join('')}</div></div></section>` });

/* ---------- RECRUITERS ---------- */
const evidence = toolsAll.map(t => ({ t, ps: projects.filter(p => p.tools.includes(t)) })).sort((a, b) => b.ps.length - a.ps.length);
page('/recruiters/', { title: T('For hiring teams'), desc: `A 60-second overview of ${site.name}: roles, skills and the projects that prove them.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>For hiring teams</b> / The 60-second overview</div><h1>The short version. <em>With evidence.</em></h1><p class="lede">${esc(site.role)} with an information systems background. Here is what I do, where to look first, and how to reach me.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="numbers">
  <div class="number"><span>Role</span><small>${esc(site.role)}</small></div>
  <div class="number"><span>Experience</span><small>9+ years in information systems, data warehousing and BI</small></div>
  <div class="number"><span>Based in</span><small>${esc(site.location)} · ${esc(site.availability)}</small></div>
  <div class="number"><span>Current position</span><small>${esc(profile.experience[0].role)}, ${esc(profile.experience[0].org)}</small></div>
  <div class="number"><span>Languages</span><small>${esc(profile.languages.join(' · '))}</small></div>
</div></div></section>
<section class="section band"><div class="wrap">${head('<b>Where to look first</b>', 'Three projects. *Three skills.*', 'If you only open three things, open these.')}<div class="grid grid-3" data-preview-scope>${caseStudies.slice(0, 3).map(card).join('')}</div></div></section>
<section class="section"><div class="wrap">${head('<b>Skills connected to project evidence</b>', 'Every skill, *linked to proof.*', 'Each tool links to the projects where it was actually used.')}
<div class="list-rows">${evidence.map(e => `<div class="row"><div><h3>${esc(e.t)}</h3><small>${e.ps.map(p => `<a class="link" href="/projects/${p.slug}/">${esc(p.title)}</a>`).join(' · ')}</small></div><span class="badge wine">${e.ps.length} project${e.ps.length > 1 ? 's' : ''}</span></div>`).join('')}</div>
<div class="btns" style="margin-top:34px"><a class="btn btn-primary" href="/resume/">Full résumé ${ico('arrow')}</a><a class="btn" href="/contact/">Get in touch</a></div></div></section>` });

/* ---------- LEARN (field notes) ---------- */
page('/learn/', { title: T('Field notes & labs'), desc: `Notes, labs and explanations from ${site.short}’s data learning.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Field notes</b> / Learning in the open <span class="tag">${ico('cup')}</span></div><h1>Notes I wish <em>I had earlier.</em></h1><p class="lede">Short labs and explanations from the work, written as I learn, for people starting their own data path.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="tiles">${profile.notes.map(n => `<div class="tile reveal"><span>${esc(n.tags.join(' · '))}</span><b>${esc(n.title)}</b><small>${esc(n.line)}</small><span class="badge" style="align-self:flex-start;margin-top:auto">${esc(n.status)}</span></div>`).join('')}</div>
<p class="note">Notes are published as they are finished. Follow along on <a class="link" href="${ghUrl}" target="_blank" rel="noopener">GitHub</a>.</p></div></section>` });

/* ---------- LEARNING LOG ---------- */
page('/learning/', { title: T('Learning log'), desc: `Courses and programmes ${site.short} is taking, connected to the projects they feed.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Learning log</b> / Connected to the work <span class="tag">Snapshot ${site.snapshot}</span></div><h1>The next layer <em>of understanding.</em></h1><p class="lede">Current coursework, kept separate from earned credentials, and linked to the project where each skill gets used.</p>
<div class="stats">${['In progress', 'Planned'].map(s => `<span><b>${profile.learning.filter(l => l.status === s).length}</b>${s.toLowerCase()}</span>`).join('')}<a class="link" href="/credentials/">Earned credentials ${ico('arrow')}</a></div></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="list-rows">${profile.learning.map(c => { const r = projects.find(p => p.slug === c.related); return `<div class="row" id="course-${c.id}" style="scroll-margin-top:90px"><div><div class="card-cat" style="margin-bottom:6px">${esc(c.provider)}</div><h3>${esc(c.title)}</h3><div class="tags" style="margin:10px 0">${c.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>${r ? `<small>Used in: <a class="link" href="/projects/${r.slug}/">${esc(r.title)}</a></small>` : ''}</div><span class="badge${c.status === 'Planned' ? ' wine' : ''}">${esc(c.status)}</span></div>`; }).join('')}</div></div></section>` });

/* ---------- POSTS ---------- */
page('/posts/', { title: T('Writing & posts'), desc: `Posts and write-ups by ${site.name} about data warehousing, BI and dashboards.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Writing</b> / Keep the conversation going</div><h1>Build it. Explain it. <em>Share what I learn.</em></h1><p class="lede">Posts and project write-ups, each connected to the work it describes.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="grid grid-2">${profile.posts.map(p => { const r = projects.find(x => x.slug === p.project); return `<article class="card reveal" id="post-${p.id}" style="scroll-margin-top:90px"><div class="card-body"><div class="card-cat">${esc(p.topic)} · ${esc(p.date)}</div><h3>${esc(p.title)}</h3><p style="-webkit-line-clamp:unset">${esc(p.summary)}</p><div class="card-links">${p.url ? `<a href="${p.url}" target="_blank" rel="noopener">Read the post ${ico('external')}</a>` : '<span class="pending">Post link coming soon</span>'}${r ? `<a class="muted" href="/projects/${r.slug}/">Related project</a>` : ''}</div></div></article>`; }).join('')}</div>
${site.linkedin ? `<div class="btns" style="margin-top:30px"><a class="btn" href="${site.linkedin}" target="_blank" rel="noopener">Explore LinkedIn posts ${ico('external')}</a></div>` : ''}</div></section>` });

/* ---------- SERVICES ---------- */
page('/services/', { title: T('Work with me'), desc: `BI, data warehousing and systems coordination services by ${site.name}.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Work with me</b> / A useful collaboration</div><h1>Bring the question. <em>Let’s model it.</em></h1><p class="lede">Focused, documented work your team can understand and keep running after I hand it over.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="list-rows">${profile.services.map((s, i) => `<div class="row reveal" id="service-${i}" style="grid-template-columns:120px minmax(0,1fr) minmax(0,1fr);align-items:start;scroll-margin-top:90px"><span class="eyebrow" style="margin:6px 0 0">0${i + 1}</span><div><h3>${esc(s.title)}</h3><p class="muted">${esc(s.line)}</p></div><ul style="margin:0;padding-left:18px;color:var(--ink-2)">${s.points.map(pt => `<li>${esc(pt)}</li>`).join('')}</ul></div>`).join('')}</div>
<div class="section-head" style="margin-top:80px"><div><div class="eyebrow"><b>How we’d work</b></div><h2>Small steps. <em>Visible progress.</em></h2></div></div>
<div class="tiles">${[['01', 'Understand', 'We agree on the decision the work should support.'], ['02', 'Model', 'I map the sources, the grain and the definitions.'], ['03', 'Build', 'Warehouse, pipeline or report, in short reviewed steps.'], ['04', 'Hand over', 'Documentation so your team can run it without me.']].map(([n, b, s]) => `<div class="tile"><span>${n}</span><b>${b}</b><small>${s}</small></div>`).join('')}</div>
<div class="btns" style="margin-top:34px"><a class="btn btn-primary" href="/contact/">Start a conversation ${ico('arrow')}</a></div></div></section>` });

/* ---------- COMMUNITY ---------- */
page('/community/', { title: T('Community'), desc: `How ${site.short} learns in public and shares data knowledge.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Community</b> / The people behind the practice</div><h1>Good questions deserve <em>good company.</em></h1><p class="lede">I learn faster when I explain what I build. These are the places where that happens.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="tiles">${profile.community.map((c, i) => `<div class="tile reveal"><span>0${i + 1}</span><b>${esc(c.title)}</b><small>${esc(c.line)}</small></div>`).join('')}</div>
<div class="btns" style="margin-top:34px"><a class="btn" href="/learn/">Field notes ${ico('arrow')}</a><a class="btn" href="/posts/">Writing & posts</a></div></div></section>` });

/* ---------- CREDENTIALS ---------- */
page('/credentials/', { title: T('Credentials'), desc: `Earned credentials and continued learning of ${site.name}.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Credentials</b> / Continued learning</div><h1>What’s earned. <em>What’s next.</em></h1><p class="lede">Earned credentials first, then the learning that is still in progress.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="eyebrow"><b>Earned</b></div><div class="tiles" style="margin-bottom:60px">${profile.credentials.map(c => `<div class="tile reveal"><span>${esc(c.issuer)} · ${esc(c.area)}</span><b>${esc(c.title)}</b><span class="badge" style="align-self:flex-start;margin-top:auto">${esc(c.status)} · ${esc(c.date)}</span>${c.url ? `<a class="link" href="${c.url}" target="_blank" rel="noopener">Verify ${ico('external')}</a>` : ''}</div>`).join('')}</div>
<div class="eyebrow"><b>In progress & planned</b></div><div class="tiles">${profile.learning.map(c => tile(`/learning/#course-${c.id}`, `${c.status} · ${c.provider}`, c.title, c.tags.join(' · '), 'Open in learning log')).join('')}</div></div></section>` });

/* ---------- CONTACT ---------- */
page('/contact/', { title: T('Contact'), desc: `Get in touch with ${site.name}.`, body: `
<section class="page-head"><div class="wrap"><div class="eyebrow"><b>Contact</b> / Let’s connect</div><h1>A question worth <em>exploring?</em></h1><p class="lede">Tell me about the role, the project or the data problem. I reply to every serious message.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap contact-grid">
  <div class="facts" style="gap:16px">
    ${site.email ? `<div class="fact"><small>Email</small><b><a class="link" href="mailto:${site.email}">${esc(site.email)}</a></b> <button class="btn btn-sm copy-btn" type="button" data-copy="${site.email}" style="margin-top:10px">${ico('copy')}<span class="label">Copy email</span></button></div>` : ''}
    <div class="fact"><small>GitHub</small><b><a class="link" href="${ghUrl}" target="_blank" rel="noopener">github.com/${esc(site.github)}</a></b></div>
    ${site.linkedin ? `<div class="fact"><small>LinkedIn</small><b><a class="link" href="${site.linkedin}" target="_blank" rel="noopener">LinkedIn profile</a></b></div>` : ''}
    <div class="fact"><small>Based in</small><b>${esc(site.location)}</b><p class="muted" style="margin:4px 0 0">${esc(site.availability)}</p></div>
  </div>
  <form class="form" id="contact-form" data-to="${esc(site.email)}" novalidate>
    <label>Your name<input name="name" required autocomplete="name"><span class="err"></span></label>
    <label>Your email<input name="email" type="email" required autocomplete="email" placeholder="name@company.com"><span class="err"></span></label>
    <label>Topic<select name="topic"><option>Role</option><option>Project</option><option>Collaboration</option><option>Other</option></select></label>
    <label>Message<textarea name="message" required placeholder="What are you working on?"></textarea><span class="err"></span></label>
    <button class="btn btn-primary" type="submit">Send message ${ico('arrow')}</button><p class="muted" id="form-status" style="margin:0;font-size:.85rem">Opens your email app with the message ready to send.</p>
  </form>
</div></section>` });

/* ---------- 404 ---------- */
pages['/404'] = layout({ title: T('Page not found'), cur: '/404', body: `<section class="page-head"><div class="wrap"><div class="eyebrow"><b>404</b></div><h1>This record <em>isn’t in the model.</em></h1><p class="lede">The page you’re looking for doesn’t exist or has moved.</p><div class="btns"><a class="btn btn-primary" href="/">Back home</a><button class="btn" type="button" data-search>Find a project</button></div></div></section>` });

/* ---------- write ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
for (const [p, html] of Object.entries(pages)) {
  const file = p === '/404' ? path.join(OUT, '404.html') : path.join(OUT, p, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
fs.cpSync(path.join(ROOT, 'src', 'assets'), path.join(OUT, 'assets'), { recursive: true });
if (fs.existsSync(path.join(ROOT, 'public'))) fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });

fs.writeFileSync(path.join(OUT, 'projects.json'), JSON.stringify(projects.map(p => ({ slug: p.slug, title: p.title, summary: p.summary, tools: p.tools, status: p.status, repo: p.repo, dashboard: p.dashboard, categoryLabel: catLabel(p.category), vizHtml: viz(p, true) }))));
const idx = [
  ...projects.map(p => ({ title: p.title, url: `/projects/${p.slug}/`, type: catLabel(p.category), text: p.summary + ' ' + p.tools.join(' ') })),
  ...dashboards.map(p => ({ title: p.title + ' report', url: `/dashboards/${p.slug}/`, type: 'Dashboard', text: p.pages.join(' · ') + ' ' + p.tools.join(' ') })),
  ...profile.learning.map(c => ({ title: c.title, url: `/learning/#course-${c.id}`, type: 'Learning', text: c.provider + ' ' + c.tags.join(' ') })),
  ...profile.posts.map(p => ({ title: p.title, url: `/posts/#post-${p.id}`, type: 'Post', text: p.summary })),
  ...[...site.nav, ...site.more, { label: 'Contact', href: '/contact/' }].map(l => ({ title: l.label, url: l.href, type: 'Page', text: '' }))
];
fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify(idx));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(pages).filter(p => p !== '/404').map(p => `<url><loc>${site.url}${p}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
console.log(`Built ${Object.keys(pages).length} pages → dist/`);
