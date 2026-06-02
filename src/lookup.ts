export type DataQualityFlag = "stable" | "small_sample" | "very_small_sample";

export type LookupRow = {
  key: string;
  matching_level: string;
  sex: string;
  site: string;
  histology_group: string;
  age_group: string;
  t_stage: string;
  n_stage: string;
  m_stage: string;
  sample_size: number;
  event_count: number;
  censor_count: number;
  median_survival_months: number | null;
  survival_12m: number;
  survival_36m: number;
  survival_60m: number;
  curve_months: number[];
  curve_survival_probs: number[];
  data_quality_flag: DataQualityFlag;
};

export type LookupArtifact = {
  version: number;
  generated_at: string;
  thresholds: {
    minimum_sample: number;
    stable_sample: number;
  };
  rows: LookupRow[];
  index: Record<string, number>;
  summary: {
    record_count: number;
    row_count: number;
    sites: string[];
    sexes: string[];
    histology_groups: string[];
  };
};

export type LookupInputs = {
  sex: string;
  site: string;
  histologyGroup: string;
  age: number;
  tStage: string;
  nStage: string;
  mStage: string;
};

export type LookupResult = {
  row: LookupRow;
  matchedKey: string;
  attemptedKeys: string[];
};

export function ageGroupsForAge(age: number): { fine: string; coarse: string } {
  if (!Number.isFinite(age) || age < 0) {
    throw new Error(`Invalid age: ${age}`);
  }

  const fine = age < 40 ? "<40" : age < 50 ? "40-49" : age < 60 ? "50-59" : age < 70 ? "60-69" : age < 80 ? "70-79" : "80+";
  const coarse = age < 60 ? "<60" : age < 70 ? "60-69" : "70+";
  return { fine, coarse };
}

export function buildLookupKeys(inputs: LookupInputs): string[] {
  const ageGroups = ageGroupsForAge(inputs.age);
  return [
    ["full", inputs.sex, inputs.site, inputs.histologyGroup, ageGroups.fine, inputs.tStage, inputs.nStage, inputs.mStage],
    ["no_sex", "Any", inputs.site, inputs.histologyGroup, ageGroups.fine, inputs.tStage, inputs.nStage, inputs.mStage],
    ["no_histology", "Any", inputs.site, "Any", ageGroups.fine, inputs.tStage, inputs.nStage, inputs.mStage],
    ["coarse_age", "Any", inputs.site, "Any", ageGroups.coarse, inputs.tStage, inputs.nStage, inputs.mStage],
    ["site_tnm", "Any", inputs.site, "Any", "Any", inputs.tStage, inputs.nStage, inputs.mStage],
    ["site_m", "Any", inputs.site, "Any", "Any", "Any", "Any", inputs.mStage],
    ["site_only", "Any", inputs.site, "Any", "Any", "Any", "Any", "Any"],
  ].map((parts) => parts.join("|"));
}

export function findLookupResult(artifact: LookupArtifact, inputs: LookupInputs): LookupResult | null {
  const attemptedKeys = buildLookupKeys(inputs);
  for (const key of attemptedKeys) {
    const rowIndex = artifact.index[key];
    if (rowIndex === undefined) {
      continue;
    }
    const row = artifact.rows[rowIndex];
    if (row === undefined || row.key !== key) {
      continue;
    }
    return { row, matchedKey: key, attemptedKeys };
  }
  return null;
}

export function hasSiteData(artifact: LookupArtifact, site: string): boolean {
  return artifact.summary.sites.includes(site);
}
