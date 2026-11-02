(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* theme */
  const themeBtns = $$('[data-theme-toggle]');
  const current = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const syncTheme = () => themeBtns.forEach(b => b.setAttribute('aria-label', current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
  themeBtns.forEach(b => b.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next; store.set('theme', next); syncTheme();
  }));
  if (!root.dataset.theme) root.dataset.theme = current();
  syncTheme();

  /* header */
  const header = $('.header');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const moreBtn = $('.more-btn'), moreMenu = $('.more-menu');
  if (moreBtn) {
    moreBtn.addEventListener('click', e => { e.stopPropagation(); const o = moreMenu.classList.toggle('open'); moreBtn.setAttribute('aria-expanded', o); });
    document.addEventListener('click', e => { if (!moreMenu.contains(e.target)) { moreMenu.classList.remove('open'); moreBtn.setAttribute('aria-expanded', 'false'); } });
  }
  const menuToggle = $('.menu-toggle'), mobileNav = $('.mobile-nav');
  if (menuToggle) menuToggle.addEventListener('click', () => { const o = mobileNav.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', o); });

  /* pause animation */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || store.get('paused') === '1') root.classList.add('paused');
  const syncPause = () => $$('[data-pause]').forEach(b => { const p = root.classList.contains('paused'); b.querySelector('.label').textContent = p ? 'Play animation' : 'Pause animation'; b.setAttribute('aria-pressed', p); });
  $$('[data-pause]').forEach(b => b.addEventListener('click', () => { root.classList.toggle('paused'); store.set('paused', root.classList.contains('paused') ? '1' : '0'); syncPause(); }));
  syncPause();

  /* reveal */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('in'));

  /* modals */
  const openModal = m => { m.classList.add('open'); m.dataset.prev = ''; document.body.style.overflow = 'hidden'; };
  const closeModal = m => { m.classList.remove('open'); document.body.style.overflow = ''; if (m._return) m._return.focus(); };
  $$('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.modal.open').forEach(closeModal);
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName))) { e.preventDefault(); openSearch(); }
  });

  /* search */
  const sModal = $('#search-modal'), sInput = $('#search-input'), sList = $('#search-results');
  let index = null, sel = 0;
  async function loadIndex() { if (index) return index; try { index = await (await fetch('/search-index.json')).json(); } catch { index = []; } return index; }
  async function openSearch() { if (!sModal) return; sModal._return = document.activeElement; openModal(sModal); await loadIndex(); sInput.value = ''; render(''); sInput.focus(); }
  function render(q) {
    const t = q.trim().toLowerCase();
    const hits = index.filter(i => !t || (i.title + ' ' + i.text + ' ' + i.type).toLowerCase().includes(t)).slice(0, 10);
    sel = 0;
    sList.innerHTML = hits.length ? hits.map((h, i) => `<li role="option" aria-selected="${i === 0}"><a href="${h.url}"><b>${esc(h.title)}</b><small>${esc(h.type)} · ${esc(h.text.slice(0, 90))}</small></a></li>`).join('') : '<li class="empty" style="margin:8px">No match yet. Try a tool like SQL or Power BI.</li>';
  }
  if (sInput) {
    sInput.addEventListener('input', () => render(sInput.value));
    sInput.addEventListener('keydown', e => {
      const items = $$('li[role=option]', sList); if (!items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[sel].setAttribute('aria-selected', 'false'); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items[sel].setAttribute('aria-selected', 'true'); items[sel].scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'Enter') { e.preventDefault(); location.href = $('a', items[sel]).href; }
    });
  }
  $$('[data-search]').forEach(b => b.addEventListener('click', openSearch));

  /* project preview */
  const pModal = $('#preview-modal');
  let pList = [], pIdx = 0, projects = null;
  async function loadProjects() { if (projects) return projects; try { projects = await (await fetch('/projects.json')).json(); } catch { projects = []; } return projects; }
  function showPreview() {
    const p = projects.find(x => x.slug === pList[pIdx]); if (!p) return;
    $('#preview-content').innerHTML = `
      <div class="preview-lg">${p.vizHtml}</div>
      <div class="card-cat">${esc(p.categoryLabel)}${p.status === 'progress' ? ' <span class="badge">In progress</span>' : ''}</div>
      <h3>${esc(p.title)}</h3>
      <p class="muted">${esc(p.summary)}</p>
      <div class="tags" style="margin:14px 0 20px">${p.tools.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="btns"><a class="btn btn-primary btn-sm" href="/projects/${p.slug}/">Follow the story</a>${p.repo ? `<a class="btn btn-sm" href="${p.repo}" target="_blank" rel="noopener">GitHub</a>` : ''}${p.dashboard ? `<a class="btn btn-sm" href="/dashboards/${p.slug}/">Report preview</a>` : ''}</div>`;
    $('#preview-count').textContent = `${pIdx + 1} / ${pList.length}`;
  }
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-preview]'); if (!t) return;
    e.preventDefault(); await loadProjects();
    const scope = t.closest('[data-preview-scope]') || document;
    pList = $$('[data-preview]', scope).filter(el => !el.closest('[hidden]')).map(el => el.dataset.preview);
    pIdx = Math.max(0, pList.indexOf(t.dataset.preview));
    pModal._return = t; showPreview(); openModal(pModal); $('[data-close]', pModal).focus();
  });
  if (pModal) {
    $('#preview-prev').addEventListener('click', () => { pIdx = (pIdx - 1 + pList.length) % pList.length; showPreview(); });
    $('#preview-next').addEventListener('click', () => { pIdx = (pIdx + 1) % pList.length; showPreview(); });
    pModal.addEventListener('keydown', e => { if (e.key === 'ArrowRight') $('#preview-next').click(); if (e.key === 'ArrowLeft') $('#preview-prev').click(); });
  }

  /* work filters */
  const wf = $('#work-filters');
  if (wf) {
    const grid = $('#work-grid'), count = $('#work-count'), empty = $('#work-empty');
    const q = $('#f-q'), kind = $('#f-kind'), status = $('#f-status'), sort = $('#f-sort');
    let cat = 'all';
    const params = new URLSearchParams(location.search);
    if (params.get('q')) q.value = params.get('q');
    if (params.get('kind')) kind.value = params.get('kind');
    if (params.get('status')) status.value = params.get('status');
    if (params.get('category')) cat = params.get('category');
    if (params.get('view') === 'list') grid.classList.add('list-view');
    const apply = () => {
      const t = q.value.trim().toLowerCase(); let n = 0;
      const cards = $$('.card', grid);
      cards.forEach(c => {
        const ok = (!t || c.dataset.search.includes(t)) && (kind.value === 'all' || c.dataset.kind === kind.value) && (status.value === 'all' || c.dataset.status === status.value) && (cat === 'all' || c.dataset.category === cat);
        c.hidden = !ok; if (ok) n++;
      });
      const by = sort.value;
      cards.sort((a, b) => by === 'name' ? a.dataset.title.localeCompare(b.dataset.title) : by === 'updated' ? (b.dataset.updated || '').localeCompare(a.dataset.updated || '') : (+b.dataset.case - +a.dataset.case) || (+a.dataset.order - +b.dataset.order)).forEach(c => grid.appendChild(c));
      count.textContent = `${n} ${n === 1 ? 'project' : 'projects'}`; empty.hidden = n > 0;
      $$('.chip[data-cat]', wf).forEach(c => c.setAttribute('aria-pressed', c.dataset.cat === cat));
      const p = new URLSearchParams();
      if (t) p.set('q', q.value.trim()); if (kind.value !== 'all') p.set('kind', kind.value); if (status.value !== 'all') p.set('status', status.value); if (cat !== 'all') p.set('category', cat); if (grid.classList.contains('list-view')) p.set('view', 'list');
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    };
    [q, kind, status, sort].forEach(el => el.addEventListener('input', apply));
    $$('.chip[data-cat]', wf).forEach(c => c.addEventListener('click', () => { cat = c.dataset.cat; apply(); }));
    $$('[data-view]').forEach(b => b.addEventListener('click', () => { grid.classList.toggle('list-view', b.dataset.view === 'list'); $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b)); apply(); }));
    $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', (x.dataset.view === 'list') === grid.classList.contains('list-view')));
    apply();

    /* GitHub refresh: add public repos not curated yet */
    const user = wf.dataset.github, gh = $('#gh-status');
    if (user) fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`).then(r => r.ok ? r.json() : Promise.reject()).then(repos => {
      const known = new Set($$('.card', grid).map(c => (c.dataset.repo || '').toLowerCase()));
      let added = 0;
      repos.filter(r => !known.has(r.html_url.toLowerCase()) && r.name.toLowerCase() !== user.toLowerCase()).forEach(r => {
        added++;
        const el = document.createElement('article');
        el.className = 'card'; el.dataset.search = `${r.name} ${r.description || ''} ${r.language || ''}`.toLowerCase();
        el.dataset.kind = r.fork ? 'fork' : 'original'; el.dataset.status = 'done'; el.dataset.category = 'learning'; el.dataset.title = r.name; el.dataset.case = '0'; el.dataset.order = '999'; el.dataset.updated = r.pushed_at; el.dataset.repo = r.html_url;
        el.innerHTML = `<a class="card-media" href="${r.html_url}" target="_blank" rel="noopener"><div class="viz"><div class="viz-head"><span class="dots"><i></i><i></i><i></i></span> repository / ${esc(r.name)}</div><div class="viz-files"><div class="viz-file"><span>01</span>README.md</div><div class="viz-file"><span>↗</span>${esc(r.language || 'Code & documentation')}</div></div></div><span class="open-hint">Open on GitHub</span></a><div class="card-body"><div class="card-cat">${r.fork ? 'Learning fork' : 'From GitHub'}</div><h3><a href="${r.html_url}" target="_blank" rel="noopener">${esc(r.name)}</a></h3><p>${esc(r.description || 'A public repository on GitHub.')}</p><div class="card-links"><a href="${r.html_url}" target="_blank" rel="noopener">GitHub</a></div></div>`;
        grid.appendChild(el);
      });
      $$('.card', grid).forEach(c => { const r = repos.find(x => x.html_url.toLowerCase() === (c.dataset.repo || '').toLowerCase()); if (r) c.dataset.updated = r.pushed_at; });
      gh.textContent = `Public GitHub snapshot refreshed: ${repos.length} repositories${added ? `, ${added} added automatically` : ''}.`;
      apply();
    }).catch(() => { gh.textContent = 'Showing the curated collection. GitHub metadata could not be refreshed right now.'; });
  }

  /* source file filter on project pages */
  $$('[data-file-filter]').forEach(box => {
    const inp = $('input', box), list = $$('[data-type]', box.parentElement);
    let type = 'all';
    const apply = () => list.forEach(li => li.hidden = !((type === 'all' || li.dataset.type === type) && li.textContent.toLowerCase().includes(inp.value.toLowerCase())));
    inp.addEventListener('input', apply);
    $$('.chip', box).forEach(c => c.addEventListener('click', () => { type = c.dataset.type; $$('.chip', box).forEach(x => x.setAttribute('aria-pressed', x === c)); apply(); }));
  });

  /* tabs (about "how I think", home example) */
  $$('[data-tabs]').forEach(t => {
    const btns = $$('[role=tab]', t), panels = $$('.panel', t.parentElement);
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-selected', x === b));
      panels.forEach(p => p.classList.toggle('active', p.id === b.getAttribute('aria-controls')));
      const live = $('[data-tabs-live]', t.parentElement); if (live) live.textContent = `${b.textContent} selected.`;
    }));
  });

  /* copy link / email */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const txt = b.dataset.copy || location.href;
    try { await navigator.clipboard.writeText(txt); const l = b.querySelector('.label'); const o = l.textContent; l.textContent = 'Copied'; b.classList.add('done'); setTimeout(() => { l.textContent = o; b.classList.remove('done'); }, 1800); } catch {}
  }));

  /* GitHub live on project page */
  const live = $('[data-gh-repo]');
  if (live) {
    const [owner, repo] = live.dataset.ghRepo.split('/');
    fetch(`https://api.github.com/repos/${owner}/${repo}`).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
      $('[data-gh-updated]', live).textContent = 'Source updated ' + new Date(d.pushed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      $('[data-gh-desc]', live).textContent = d.description || 'No repository description yet.';
      $('[data-gh-meta]', live).textContent = [d.language, d.stargazers_count ? `${d.stargazers_count} stars` : '', d.default_branch ? `branch ${d.default_branch}` : ''].filter(Boolean).join(' · ');
    }).catch(() => { $('[data-gh-updated]', live).textContent = 'Live source details are unavailable right now.'; });
  }

  /* contact form → mailto */
  const form = $('#contact-form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault(); let ok = true;
    $$('[required]', form).forEach(f => { const err = f.parentElement.querySelector('.err'); const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)); err.textContent = bad ? (f.type === 'email' ? 'Enter a valid email address.' : 'This field is needed.') : ''; if (bad) ok = false; });
    if (!ok) return;
    const to = form.dataset.to;
    if (!to) { $('#form-status').textContent = 'Email is not set up yet. Please use LinkedIn or GitHub for now.'; return; }
    const d = new FormData(form);
    location.href = `mailto:${to}?subject=${encodeURIComponent(`[${d.get('topic')}] from ${d.get('name')}`)}&body=${encodeURIComponent(d.get('message') + '\n\n' + d.get('name') + ' · ' + d.get('email'))}`;
  });
  $$('#contact-form [required]').forEach(f => f.addEventListener('input', () => { f.parentElement.querySelector('.err').textContent = ''; }));
})();
