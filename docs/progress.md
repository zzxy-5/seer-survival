# SEER Survival Lookup Progress

- Project: SEER survival lookup
- Branch: feature/survival-lookup
- Runtime constraint: static lookup only

## Task Checklist

- [x] Task 1: Repository skeleton and commands
- [x] Task 2: Normalization library and tests
- [x] Task 3: Kaplan-Meier calculator and tests
- [x] Task 4: Streaming XLSX extraction and tests
- [x] Task 5: Lookup builder, validation, and tests
- [x] Task 6: Offline lookup build CLI and generated public data artifacts
- [x] Task 7: React static lookup interface and frontend tests
- [x] Task 8: Add Greenwood log-log 95% confidence intervals to lookup artifacts and UI
- [x] Task 9: Add publication-ready KM axis labels, risk table, and median helper lines

## Latest Updates

- 2026-07-04: Added KM Y-axis label, 0/12/24/36/48-month number-at-risk table, median survival helper drop-line support, and regenerated the manuscript KM figure asset.
- 2026-07-04: Added offline Greenwood log-log 95% confidence intervals for 12/36/60-month survival, curve confidence bands, metadata, generated lookup data, and UI display.
- 2026-05-19: Added Task 7 React interface, deterministic browser lookup, survival summary display, KM curve view, and frontend tests.
- 2026-05-19: Added Task 6 offline build CLI, generated static lookup/options/metadata JSON, clarified skipped-row reasons, and kept the source workbook ignored.
- 2026-05-19: Added Task 5 lookup artifact builder, quality flags, artifact validation checks, and tests for generated rows and validation failures.
- 2026-05-19: Added Task 4 streaming XLSX reader, shared-string extraction, required-column selection, and minimal workbook tests.
- 2026-05-19: Added Task 3 Kaplan-Meier calculator with censoring-aware curve, survival horizons, median survival handling, and unit tests.
- 2026-05-19: Added Task 2 normalization schema, age grouping, TNM standardization, event parsing, lookup key generation, and unit tests.
- 2026-05-19: Created Task 1 skeleton files, command definitions, README summary, gitignore data directory rules, and this progress record.
