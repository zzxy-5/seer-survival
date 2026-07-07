import { describe, expect, it } from "vitest";

import { ageGroupsForAge, findLookupResult, hasSiteData, type LookupArtifact, type LookupRow } from "./lookup";

function row(key: string, matchingLevel: string, sampleSize: number): LookupRow {
  const [, sex, site, histologyGroup, ageGroup, tStage, nStage, mStage] = key.split("|");
  return {
    key,
    matching_level: matchingLevel,
    sex: sex ?? "Any",
    site: site ?? "Tongue",
    histology_group: histologyGroup ?? "Any",
    age_group: ageGroup ?? "Any",
    t_stage: tStage ?? "T2",
    n_stage: nStage ?? "N1",
    m_stage: mStage ?? "M0",
    sample_size: sampleSize,
    event_count: 4,
    censor_count: sampleSize - 4,
    median_survival_months: null,
    median_followup_months: 48.6,
    risk_60m: 42,
    risk_table_months: [0, 12, 24, 36, 48, 60],
    risk_table_counts: [
      sampleSize,
      Math.max(0, sampleSize - 2),
      Math.max(0, sampleSize - 5),
      Math.max(0, sampleSize - 8),
      Math.max(0, sampleSize - 10),
      42,
    ],
    survival_12m: 0.91,
    survival_12m_ci: [0.84, 0.95],
    survival_36m: 0.74,
    survival_36m_ci: [0.63, 0.82],
    survival_60m: 0.63,
    survival_60m_ci: [0.51, 0.73],
    curve_months: [0, 12, 36, 60],
    curve_survival_probs: [1, 0.91, 0.74, 0.63],
    curve_ci_lower_probs: [1, 0.84, 0.63, 0.51],
    curve_ci_upper_probs: [1, 0.95, 0.82, 0.73],
    censor_months: [18, 42, 60],
    data_quality_flag: sampleSize >= 50 ? "stable" : "small_sample",
  };
}

function artifact(rows: LookupRow[]): LookupArtifact {
  return {
    version: 3,
    generated_at: "2026-05-19T00:00:00Z",
    thresholds: { minimum_sample: 20, stable_sample: 50 },
    confidence_interval: { level: 0.95, method: "Greenwood log-log" },
    rows,
    index: Object.fromEntries(rows.map((item, index) => [item.key, index])),
    summary: {
      record_count: 100,
      row_count: rows.length,
      sites: ["Tongue"],
      sexes: ["Female", "Male"],
      histology_groups: ["Squamous"],
    },
  };
}

describe("ageGroupsForAge", () => {
  it("maps continuous age to fine and coarse groups", () => {
    expect(ageGroupsForAge(39)).toEqual({ fine: "<40", coarse: "<60" });
    expect(ageGroupsForAge(60)).toEqual({ fine: "60-69", coarse: "60-69" });
    expect(ageGroupsForAge(80)).toEqual({ fine: "80+", coarse: "70+" });
  });
});

describe("findLookupResult", () => {
  it("uses the full match before broader fallback rows", () => {
    const full = row("full|Female|Tongue|Squamous|60-69|T2|N1|M0", "full", 24);
    const fallback = row("site_tnm|Any|Tongue|Any|Any|T2|N1|M0", "site_tnm", 91);
    const result = findLookupResult(
      artifact([fallback, full]),
      {
        sex: "Female",
        site: "Tongue",
        histologyGroup: "Squamous",
        age: 63,
        tStage: "T2",
        nStage: "N1",
        mStage: "M0",
      },
    );

    expect(result?.row.key).toBe(full.key);
    expect(result?.attemptedKeys[0]).toBe(full.key);
  });

  it("falls back through predefined lookup keys when a specific row is missing", () => {
    const fallback = row("site_tnm|Any|Tongue|Any|Any|T2|N1|M0", "site_tnm", 91);
    const result = findLookupResult(
      artifact([fallback]),
      {
        sex: "Female",
        site: "Tongue",
        histologyGroup: "Squamous",
        age: 63,
        tStage: "T2",
        nStage: "N1",
        mStage: "M0",
      },
    );

    expect(result?.row).toBe(fallback);
    expect(result?.matchedKey).toBe(fallback.key);
    expect(result?.attemptedKeys).toContain("coarse_age|Any|Tongue|Any|60-69|T2|N1|M0");
  });

  it("preserves histology through broader matches before ignoring histology", () => {
    const histologyFallback = row("site_histology_m|Any|Tongue|Squamous|Any|Any|Any|M0", "site_histology_m", 47);
    const broadFallback = row("site_tnm|Any|Tongue|Any|Any|T2|N1|M0", "site_tnm", 91);
    const result = findLookupResult(
      artifact([broadFallback, histologyFallback]),
      {
        sex: "Female",
        site: "Tongue",
        histologyGroup: "Squamous",
        age: 63,
        tStage: "T2",
        nStage: "N1",
        mStage: "M0",
      },
    );

    expect(result).not.toBeNull();
    if (!result) {
      return;
    }
    expect(result.row).toBe(histologyFallback);
    expect(result.matchedKey).toBe(histologyFallback.key);
    expect(result.attemptedKeys.indexOf(histologyFallback.key)).toBeLessThan(result.attemptedKeys.indexOf(broadFallback.key));
  });

  it("returns null when no lookup key exists", () => {
    const result = findLookupResult(artifact([]), {
      sex: "Female",
      site: "Tongue",
      histologyGroup: "Squamous",
      age: 63,
      tStage: "T2",
      nStage: "N1",
      mStage: "M0",
    });

    expect(result).toBeNull();
  });
});

describe("hasSiteData", () => {
  it("reports whether the lookup artifact contains survival rows for a site", () => {
    expect(hasSiteData(artifact([row("site_only|Any|Tongue|Any|Any|Any|Any|Any", "site_only", 91)]), "Tongue")).toBe(true);
    expect(hasSiteData(artifact([row("site_only|Any|Tongue|Any|Any|Any|Any|Any", "site_only", 91)]), "Larynx")).toBe(false);
  });
});
