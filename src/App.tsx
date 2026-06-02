import { useEffect, useMemo, useState } from "react";

import { dataUrl } from "./data-path";
import { findLookupResult, hasSiteData, type LookupArtifact, type LookupInputs, type LookupResult, type LookupRow } from "./lookup";
import {
  APP_COPY,
  UI_COPY,
  appCopy,
  displayLabel,
  formatMatchedKey,
  formatMedianSurvival,
  formatProbability,
  type Language,
  matchingLevelLabel,
  qualityLabel,
} from "./presentation";
import "./styles.css";

type OptionsData = {
  sexes: string[];
  sites: string[];
  histology_groups: string[];
  age_groups: string[];
  t_stages: string[];
  n_stages: string[];
  m_stages: string[];
};

type Metadata = {
  source_file: string;
  processed_rows: number;
  record_count: number;
  skipped_rows: number;
  lookup_rows: number;
  runtime_mode: string;
};

type FormState = {
  sex: string;
  site: string;
  histologyGroup: string;
  age: string;
  tStage: string;
  nStage: string;
  mStage: string;
};

const defaultForm: FormState = {
  sex: "",
  site: "",
  histologyGroup: "",
  age: "63",
  tStage: "T2",
  nStage: "N1",
  mStage: "M0",
};

function preferred(options: string[], value: string): string {
  return options.includes(value) ? value : options[0] ?? "";
}

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json() as Promise<T>;
}

function makeInputs(form: FormState, ui: (typeof UI_COPY)[Language]): LookupInputs {
  if (form.age.trim() === "") {
    throw new Error(ui.emptyAge);
  }
  const age = Number(form.age);
  if (!Number.isFinite(age)) {
    throw new Error(ui.invalidAge);
  }
  return {
    sex: form.sex,
    site: form.site,
    histologyGroup: form.histologyGroup,
    age,
    tStage: form.tStage,
    nStage: form.nStage,
    mStage: form.mStage,
  };
}

export default function App() {
  const [artifact, setArtifact] = useState<LookupArtifact | null>(null);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("zh");
  const copy = appCopy(language);
  const ui = UI_COPY[language];

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadJson<LookupArtifact>(dataUrl("survival_lookup.json")),
      loadJson<OptionsData>(dataUrl("options.json")),
      loadJson<Metadata>(dataUrl("metadata.json")),
    ])
      .then(([nextArtifact, nextOptions, nextMetadata]) => {
        if (cancelled) {
          return;
        }
        setArtifact(nextArtifact);
        setOptions(nextOptions);
        setMetadata(nextMetadata);
        setForm({
          sex: preferred(nextOptions.sexes, "Male"),
          site: preferred(nextOptions.sites, "Tongue"),
          histologyGroup: preferred(nextOptions.histology_groups, "8050-8089: squamous cell neoplasms"),
          age: "63",
          tStage: preferred(nextOptions.t_stages, "T2"),
          nStage: preferred(nextOptions.n_stages, "N1"),
          mStage: preferred(nextOptions.m_stages, "M0"),
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "数据加载失败");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const lookup = useMemo((): { result: LookupResult | null; error: string | null } => {
    if (!artifact || !form.sex || !form.site || !form.histologyGroup) {
      return { result: null, error: null };
    }
    if (!hasSiteData(artifact, form.site)) {
      return {
        result: null,
        error: ui.missingSite(displayLabel(form.site, language)),
      };
    }
    try {
      return { result: findLookupResult(artifact, makeInputs(form, ui)), error: null };
    } catch (error: unknown) {
      return { result: null, error: error instanceof Error ? error.message : ui.lookupFailed };
    }
  }, [artifact, form, language, ui]);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <main className="app-shell">
      <header className="masthead">
        <div className="brand-lockup">
          <div>
            <p className="kicker">{copy.eyebrow}</p>
            <h1>{copy.name}</h1>
            <p className="lede">{copy.description}</p>
          </div>
        </div>
        <div className="masthead-actions">
          <LanguageToggle language={language} onChange={setLanguage} />
          <div className="status-strip">
            {copy.statusBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
      </header>

      <section className="workspace" aria-label={ui.workspaceAria}>
        <section className="input-panel" aria-label={ui.inputPanelAria}>
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">{ui.inputKicker}</p>
              <h2>{ui.inputTitle}</h2>
            </div>
            {metadata ? (
              <p>
                {metadata.record_count.toLocaleString()} {ui.recordsUnit}
              </p>
            ) : (
              <p>{ui.loading}</p>
            )}
          </div>

          {loadError ? <div className="notice error">{loadError}</div> : null}

          {metadata ? (
            <div className="meta-strip" aria-label={ui.dataOverviewAria}>
              <div>
                <span>{ui.effectiveRecords}</span>
                <strong>{metadata.record_count.toLocaleString()}</strong>
              </div>
              <div>
                <span>{ui.lookupGroups}</span>
                <strong>{metadata.lookup_rows.toLocaleString()}</strong>
              </div>
            </div>
          ) : null}

          <div className="control-grid">
            <SelectField label={ui.sex} value={form.sex} options={options?.sexes ?? []} language={language} onChange={(value) => updateForm("sex", value)} />
            <SiteSelectField
              value={form.site}
              options={options?.sites ?? []}
              availableSites={artifact?.summary.sites ?? []}
              language={language}
              ui={ui}
              onChange={(value) => updateForm("site", value)}
            />
            <SelectField
              label={ui.histologyGroup}
              value={form.histologyGroup}
              options={options?.histology_groups ?? []}
              language={language}
              onChange={(value) => updateForm("histologyGroup", value)}
            />
            <label className="field">
              <span>{ui.age}</span>
              <input min="0" max="120" type="number" value={form.age} onChange={(event) => updateForm("age", event.target.value)} />
            </label>
          </div>

          <div className="tnm-grid">
            <SelectField label="T" value={form.tStage} options={options?.t_stages ?? []} language={language} onChange={(value) => updateForm("tStage", value)} />
            <SelectField label="N" value={form.nStage} options={options?.n_stages ?? []} language={language} onChange={(value) => updateForm("nStage", value)} />
            <SelectField label="M" value={form.mStage} options={options?.m_stages ?? []} language={language} onChange={(value) => updateForm("mStage", value)} />
          </div>

          <TnmAnnotation copy={copy} />
          <SourceAnnotation metadata={metadata} copy={copy} ui={ui} />
        </section>

        <section className="result-panel" aria-label={ui.resultAria}>
          <div className="result-content">
            {lookup.error ? (
              <EmptyResult title={lookup.error} />
            ) : lookup.result ? (
              <ResultView result={lookup.result} language={language} ui={ui} />
            ) : artifact ? (
              <EmptyResult title={ui.noGroup} />
            ) : (
              <EmptyResult title={ui.loadingGroup} />
            )}
          </div>
          <MethodBoundary copy={copy} />
        </section>
      </section>
    </main>
  );
}

function LanguageToggle({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return (
    <div className="language-toggle" aria-label="Language">
      <button type="button" aria-pressed={language === "zh"} onClick={() => onChange("zh")}>
        中文
      </button>
      <button type="button" aria-pressed={language === "en"} onClick={() => onChange("en")}>
        English
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  language,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  language: Language;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={options.length === 0}>
        {options.map((option) => (
          <option key={option} value={option}>
            {displayLabel(option, language)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SiteSelectField({
  value,
  options,
  availableSites,
  language,
  ui,
  onChange,
}: {
  value: string;
  options: string[];
  availableSites: string[];
  language: Language;
  ui: (typeof UI_COPY)[Language];
  onChange: (value: string) => void;
}) {
  const available = new Set(availableSites);
  return (
    <label className="field">
      <span>{ui.tumorSite}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={options.length === 0}>
        {options.map((option) => {
          const isUnavailable = availableSites.length > 0 && !available.has(option);
          return (
            <option key={option} value={option} disabled={isUnavailable}>
              {displayLabel(option, language)}
              {isUnavailable ? ui.unavailable : ""}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function EmptyResult({ title }: { title: string }) {
  return (
    <div className="empty-state">
      <p>{title}</p>
    </div>
  );
}

function TnmAnnotation({ copy }: { copy: typeof APP_COPY | typeof import("./presentation").APP_COPY_EN }) {
  return (
    <section className="annotation-panel" aria-labelledby="tnm-note-title">
      <h3 id="tnm-note-title">{copy.tnm.title}</h3>
      <ul>
        {copy.tnm.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}

function SourceAnnotation({
  metadata,
  copy,
  ui,
}: {
  metadata: Metadata | null;
  copy: typeof APP_COPY | typeof import("./presentation").APP_COPY_EN;
  ui: (typeof UI_COPY)[Language];
}) {
  return (
    <section className="annotation-panel source-panel" aria-label={copy.source.title} aria-labelledby="source-note-title">
      <h3 id="source-note-title">{copy.source.title}</h3>
      <dl>
        <div>
          <dt>{ui.sourceFile}</dt>
          <dd>{metadata ? metadata.source_file : ui.loading}</dd>
        </div>
        <div>
          <dt>{ui.processedRows}</dt>
          <dd>{metadata ? metadata.processed_rows.toLocaleString() : ui.loading}</dd>
        </div>
        <div>
          <dt>{ui.includedRecords}</dt>
          <dd>{metadata ? metadata.record_count.toLocaleString() : ui.loading}</dd>
        </div>
        <div>
          <dt>{ui.skippedRecords}</dt>
          <dd>{metadata ? metadata.skipped_rows.toLocaleString() : ui.loading}</dd>
        </div>
      </dl>
      <p>{copy.source.note}</p>
    </section>
  );
}

function MethodBoundary({ copy }: { copy: typeof APP_COPY | typeof import("./presentation").APP_COPY_EN }) {
  return (
    <section className="method-boundary" aria-labelledby="method-boundary-title">
      <h2 id="method-boundary-title">{copy.method.title}</h2>
      <ul>
        {copy.method.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}

function ResultView({ result, language, ui }: { result: LookupResult; language: Language; ui: (typeof UI_COPY)[Language] }) {
  const row = result.row;
  return (
    <>
      <div className="result-topline">
        <div>
          <p className="kicker">{ui.medianSurvival}</p>
          <h2>{formatMedianSurvival(row.median_survival_months, language)}</h2>
        </div>
        <span className={`quality ${row.data_quality_flag}`}>{qualityLabel(row.data_quality_flag, language)}</span>
      </div>

      <div className="metric-grid">
        <Metric label={ui.survival12} value={formatProbability(row.survival_12m)} />
        <Metric label={ui.survival36} value={formatProbability(row.survival_36m)} />
        <Metric label={ui.survival60} value={formatProbability(row.survival_60m)} />
        <Metric label={ui.sampleSize} value={row.sample_size.toLocaleString()} />
      </div>

      <SurvivalCurve row={row} ui={ui} />

      <dl className="detail-list">
        <div>
          <dt>{ui.matchLevel}</dt>
          <dd>{matchingLevelLabel(row.matching_level, language)}</dd>
        </div>
        <div>
          <dt>{ui.eventsCensored}</dt>
          <dd>
            {row.event_count.toLocaleString()} / {row.censor_count.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt>{ui.matchedGroup}</dt>
          <dd>{formatMatchedKey(result.matchedKey, language)}</dd>
        </div>
      </dl>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SurvivalCurve({ row, ui }: { row: LookupRow; ui: (typeof UI_COPY)[Language] }) {
  const maxMonth = Math.max(60, ...row.curve_months);
  const points = row.curve_months.map((month, index) => {
    const x = 8 + (month / maxMonth) * 84;
    const y = 88 - row.curve_survival_probs[index] * 76;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <figure className="curve-panel">
      <figcaption>{ui.kmCurve}</figcaption>
      <svg viewBox="0 0 100 100" role="img" aria-label={ui.kmCurve}>
        <line className="grid-line" x1="8" y1="50" x2="94" y2="50" />
        <line className="axis-line" x1="8" y1="88" x2="94" y2="88" />
        <line className="axis-line" x1="8" y1="10" x2="8" y2="88" />
        <polygon className="curve-fill" points={`${points.join(" ")} 92,88 8,88`} />
        <polyline className="curve-line" points={points.join(" ")} />
        <text x="7" y="97">
          0
        </text>
        <text x="84" y="97">
          {maxMonth} {ui.monthSuffix}
        </text>
        <text x="0" y="15">
          100%
        </text>
      </svg>
    </figure>
  );
}
