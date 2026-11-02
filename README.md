# lidiana. — Data Engineering & BI Portfolio

Personal portfolio of **Lidiana Houro**: data warehouses, ETL pipelines and Power BI reports.

A small static site generator (Node.js) reads JSON files from `data/` and writes plain HTML pages to `dist/`. No framework.

## Run locally

```bash
npm install
npm run build        # writes dist/
npx serve dist       # open http://localhost:3000
```

## Edit content (no code needed)

| What | File |
|---|---|
| Name, links, email, LinkedIn, navigation, toolkit | `data/site.json` |
| Projects (cards, project pages, dashboards, search) | `data/projects.json` |
| About text, experience, education, credentials, courses, posts, services, community, field notes | `data/profile.json` |
| Portrait photo | `public/portrait.webp` (portrait ~600×750) |
| Downloadable CV | `public/resume.pdf` |
| Social sharing image | `npm run og` regenerates `public/social-card.png` |

### Add a project
Copy any object in `data/projects.json`, change `slug`, `title`, `summary`, `tools`, `repo`, and the story fields
(`question`, `approach`, `result`, `scope`). Set `"dashboard": true` to also list it under Dashboards,
`"featured": true` to show it on the home page, and `"status": "progress"` for work in progress.
`visual.type` can be `architecture`, `workflow`, `dashboard` or `source`.

Public GitHub repositories that are not in `projects.json` appear on the Work page automatically.

## Theme
Wine & gold, light and dark. All colours are CSS variables at the top of `src/assets/styles.css`.

## Deploy (Vercel)
1. Push this folder to a GitHub repository.
2. On vercel.com → **Add New → Project** → import the repository.
3. Vercel reads `vercel.json` (build: `npm run build`, output: `dist`). Click **Deploy**.
4. Update `url` in `data/site.json` to the final address.
