# 头颈肿瘤生存图谱

Research-reference website for SEER head and neck cancer overall survival lookup.

Runtime uses static JSON lookup only. The browser reads precomputed JSON and performs deterministic lookup; there is no backend inference, Cox runtime, ML runtime, or AI reasoning at website runtime.

The raw workbook `统计表.xlsx` is local input data and is ignored by git.

## Open Locally

Do not open `index.html` directly with `file://`; it is the Vite source entry and requires a local server.

```bash
npm run dev
```

Then open the localhost URL printed by Vite.

For a file-only preview that does not need localhost, generate the single-file build:

```bash
npm run build:standalone
```

Then open `standalone.html`.

## Commands

- Build local lookup data: `npm run build:data`
- Start app locally: `npm run dev`
- Build app: `npm run build`
- Build single-file app: `npm run build:standalone`
- Preview app build: `npm run preview`
- Run frontend tests: `npm test`
- Run Python tests: `npm run test:py`

## Deploy

This is a static site and does not need Streamlit or a backend service. Pushes to `main` or `master` run the GitHub Pages workflow in `.github/workflows/deploy-pages.yml`.

In GitHub, set Pages to use GitHub Actions. The published URL will be shown in the workflow deployment summary.

## Limitation

This project is for research reference only and is not intended for clinical decision-making or individual survival prediction.
