// Builds public/resume.pdf from the site data, so the CV always matches the portfolio.
// Usage: node scripts/make_cv.mjs <fonts-dir>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FONTS = process.argv[2];
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/site.json'), 'utf8'));
const profile = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/profile.json'), 'utf8'));
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const font = (fam, file, w) => `@font-face{font-family:"${fam}";src:url("file://${FONTS}/${file}") format("woff2");font-weight:${w}}`;

const cvProjects = [
  ['pharma-distribution-dbt', 'dbt + DuckDB star schema for a pharma distributor: SCD Type 2 pharmacy history, 39 data tests, OTIF and expiry-loss marts. Found the European-side warehouse at 83% on time and 10 SKUs causing 45% of expiry loss.'],
  ['tcmb-fx-rates-pipeline', 'Incremental, idempotent daily load of Central Bank of Türkiye FX bulletins on GitHub Actions: watermark, holiday detection, retries, quality checks, live dashboard. 205 bulletins, 0 failed days.'],
  ['construction-cost-control', 'Earned value model in DuckDB SQL for six construction projects (PV, EV, AC, CPI, SPI, EAC, TCPI) with a live dashboard; separated a cost overrun (steel, CPI 0.90) from a schedule slip (SPI 0.67).'],
  ['invoice-intake-automation', 'Python pipeline that reads Turkish supplier PDF invoices, validates them against vendor and PO master data with 14 rules and books clean ones to SQLite; 29 booked, 11 routed to review.'],
  ['csv-data-profiler', 'pip-installable data quality tool: type inference, duplicate and label checks, quality score, offline HTML report and a CI quality gate.'],
  ['logistics-analytics-sql-powerbi', 'Layered SQL Server pipeline and Power BI report for a delivery company: on-time rate, failure rate and driver-level drill-down.'],
].map(([slug, line]) => ({ p: projects.find(x => x.slug === slug), line })).filter(x => x.p);

const skills = [
  ['Data engineering', 'ETL/ELT pipelines, dbt, dimensional modelling (star schema, SCD Type 2), Medallion architecture, incremental and idempotent loads, data quality testing'],
  ['Databases', 'SQL Server, PostgreSQL, DuckDB, MySQL, SQLite; Databricks SQL and Apache Spark (familiar)'],
  ['Programming and tools', 'SQL, Python (pandas), Git and GitHub, GitHub Actions (CI/CD), Bash'],
  ['BI and reporting', 'Power BI (DAX, Power Query), advanced Excel, dashboard design, report automation'],
  ['Business and systems', 'SAP ERP, requirements gathering, process modelling, IT project management, data governance'],
];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${font('Serif', 'source-serif-4-latin-400-normal.woff2', 400)}${font('Serif', 'source-serif-4-latin-600-normal.woff2', 600)}
${font('Sans', 'plus-jakarta-sans-latin-400-normal.woff2', 400)}${font('Sans', 'plus-jakarta-sans-latin-500-normal.woff2', 500)}${font('Sans', 'plus-jakarta-sans-latin-600-normal.woff2', 600)}${font('Sans', 'plus-jakarta-sans-latin-700-normal.woff2', 700)}
@page{size:A4;margin:14mm 15mm 13mm}
*{box-sizing:border-box}body{margin:0;font:9.4pt/1.45 Sans,sans-serif;color:#2A1A20}
h1{font:600 25pt/1 Serif,serif;margin:0;letter-spacing:-.01em}h1 span{color:#5C2E3E}
.role{font:600 10.5pt Sans;color:#9A7633;margin:5px 0 7px;letter-spacing:.02em}
.contact{font-size:8.6pt;color:#6E5A61}.contact a{color:#5C2E3E;text-decoration:none}
.rule{height:2px;background:#5C2E3E;margin:10px 0 2px}.rule+.rule2{height:1px;background:#C7A46A;margin:0 0 4px;width:60px}
h2{font:600 11.5pt Serif,serif;color:#5C2E3E;margin:13px 0 6px;padding-bottom:3px;border-bottom:1px solid #E6D9DD}
p{margin:0 0 4px}.job{margin:0 0 8px;break-inside:avoid}.jh{display:flex;justify-content:space-between;gap:12px}
.jh b{font-weight:700}.jh span{color:#6E5A61;white-space:nowrap;font-size:8.6pt}.org{color:#9A7633;font-weight:600;font-size:8.8pt}
ul{margin:3px 0 0;padding-left:14px}li{margin:1.5px 0}
.sk{display:grid;grid-template-columns:128px 1fr;gap:3px 12px}.sk b{font-weight:600}
.proj{margin:0 0 6px;break-inside:avoid}.proj b{font-weight:700}.proj a{color:#5C2E3E;text-decoration:none;font-size:8.4pt}
.two{display:grid;grid-template-columns:1fr 1fr;gap:2px 22px}.cert{font-size:8.7pt}.cert span{color:#6E5A61}
</style></head><body>
<h1>Lidiana <span>Houro</span></h1>
<div class="role">Data Engineer · SQL, Python, dbt, Power BI</div>
<div class="contact">${esc(site.location)} · <a href="mailto:${site.email}">${site.email}</a> · <a href="${site.linkedin}">linkedin.com/in/lidiana-houro</a> · <a href="https://github.com/${site.github}">github.com/${site.github}</a> · <a href="${site.url}">${site.url.replace('https://', '')}</a></div>
<div class="rule"></div><div class="rule2"></div>
<h2>Profile</h2>
<p>Data engineer with more than nine years across information systems, data warehousing and business intelligence, mostly in pharmaceutical distribution and construction in Istanbul. I build ETL/ELT pipelines in SQL Server, Python and dbt, model data into tested star schemas, and deliver Power BI dashboards that management uses to track KPIs. I care about the parts that keep data trustworthy: data quality checks, access control, backups and queries that stay fast.</p>
<h2>Technical skills</h2>
<div class="sk">${skills.map(([k, v]) => `<b>${k}</b><span>${v}</span>`).join('')}</div>
<h2>Professional experience</h2>
${profile.experience.map(x => `<div class="job"><div class="jh"><b>${esc(x.role)}</b><span>${esc(x.dates)}</span></div><div class="org">${esc(x.org)} · ${esc(x.place)}</div><ul>${x.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>`).join('')}
<h2>Selected projects</h2>
${cvProjects.map(({ p, line }) => `<div class="proj"><b>${esc(p.title)}</b> · <a href="${p.liveUrl || p.repo}">${(p.liveUrl || p.repo).replace('https://', '')}</a><br>${esc(line)}</div>`).join('')}
<h2>Education</h2>
<div class="jh"><b>${esc(profile.education.degree)}</b><span>Graduated 2016</span></div><div class="org">${esc(profile.education.school)} · Aleppo, Syria · taught in English</div>
<h2>Certificates</h2>
<div class="two">${profile.credentials.map(c => `<div class="cert">${esc(c.title)} <span>· ${esc(c.issuer)}, ${esc(c.date)}</span></div>`).join('')}</div>
<h2>Languages</h2>
<p>Arabic (native) · English (C1, professional)</p>
</body></html>`;

const tmp = path.join(FONTS, '..', 'cv.html');
fs.writeFileSync(tmp, html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + tmp);
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: path.join(ROOT, 'public/resume.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('public/resume.pdf written');
