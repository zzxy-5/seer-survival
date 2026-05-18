# SEER Survival Lookup

Research-display website for SEER oral/pharyngeal cancer overall survival lookup.

Runtime uses static JSON lookup only. The browser reads precomputed JSON and performs deterministic lookup; there is no backend inference, Cox runtime, ML runtime, or AI reasoning at website runtime.

The raw workbook `统计表.xlsx` is local input data and is ignored by git.

## Commands

- Build local lookup data: `npm run build:data`
- Start app locally: `npm run dev`
- Build app: `npm run build`
- Preview app build: `npm run preview`
- Run frontend tests: `npm test`
- Run Python tests: `npm run test:py`

## Limitation

This project is for research display only and is not intended for clinical decision-making or individual survival prediction.
