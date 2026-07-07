import { useEffect, useMemo, useState } from "react";

import { dataUrl } from "./data-path";
import { findLookupResult, hasSiteData, type LookupArtifact, type LookupInputs, type LookupResult, type LookupRow } from "./lookup";
import {
  APP_COPY,
  UI_COPY,
  appCopy,
  displayLabel,
  formatCaseCount,
  formatConfidenceInterval,
  formatFollowupMonths,
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
  data_source: {
    zh: string;
    en: string;
  };
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
          site: preferred(nextOptions.sites, "Hypopharynx"),
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
          <SourceAnnotation metadata={metadata} copy={copy} ui={ui} language={language} />
        </section>

        <section className="result-panel" aria-label={ui.resultAria}>
          <div className="result-content">
            {lookup.error ? (
              <EmptyResult title={lookup.error} />
            ) : lookup.result ? (
              <ResultView result={lookup.result} selectedHistologyGroup={form.histologyGroup} language={language} ui={ui} />
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
  language,
}: {
  metadata: Metadata | null;
  copy: typeof APP_COPY | typeof import("./presentation").APP_COPY_EN;
  ui: (typeof UI_COPY)[Language];
  language: Language;
}) {
  return (
    <section className="annotation-panel source-panel" aria-label={copy.source.title} aria-labelledby="source-note-title">
      <h3 id="source-note-title">{copy.source.title}</h3>
      <dl>
        <div>
          <dt>{ui.dataSource}</dt>
          <dd>{metadata ? metadata.data_source[language] : ui.loading}</dd>
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

function ResultView({
  result,
  selectedHistologyGroup,
  language,
  ui,
}: {
  result: LookupResult;
  selectedHistologyGroup: string;
  language: Language;
  ui: (typeof UI_COPY)[Language];
}) {
  const row = result.row;
  const risk60Detail = row.risk_60m < 10 ? ui.risk60Caution : ui.risk60Context;
  const histologyWasIgnored = selectedHistologyGroup !== "" && row.histology_group === "Any";
  return (
    <>
      <div className="result-topline">
        <div className="survival-summary">
          <p className="kicker">{ui.medianSurvival}</p>
          <h2>{formatMedianSurvival(row.median_survival_months, language)}</h2>
          {row.median_survival_months === null ? <p className="median-note">{ui.medianNotReachedNote}</p> : null}
          <p className="cohort-summary">
            <span>
              {ui.sampleSize} {formatCaseCount(row.sample_size, language)}
            </span>
            <span>
              {ui.deaths} {formatCaseCount(row.event_count, language)}
            </span>
            <span>
              {ui.medianFollowup} {formatFollowupMonths(row.median_followup_months, language)}
            </span>
          </p>
        </div>
        <span className={`quality ${row.data_quality_flag}`}>{qualityLabel(row.data_quality_flag, language)}</span>
      </div>

      {histologyWasIgnored ? <p className="match-note">{ui.histologyIgnoredNotice}</p> : null}

      <div className="metric-grid">
        <Metric label={ui.survival12} value={formatProbability(row.survival_12m)} detail={formatConfidenceInterval(row.survival_12m_ci)} />
        <Metric label={ui.survival36} value={formatProbability(row.survival_36m)} detail={formatConfidenceInterval(row.survival_36m_ci)} />
        <Metric label={ui.survival60} value={formatProbability(row.survival_60m)} detail={formatConfidenceInterval(row.survival_60m_ci)} />
        <Metric
          label={ui.followupHint}
          value={`${ui.risk60Short}: ${formatCaseCount(row.risk_60m, language)}`}
          detail={risk60Detail}
          tone={row.risk_60m < 10 ? "warning" : "note"}
        />
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

function Metric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "note" | "warning";
}) {
  return (
    <div className={tone === "default" ? "metric" : `metric metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

const CENSOR_MARKER_LIMIT = 28;

function selectCensorMarkerMonths(months: number[], maxMonth: number): number[] {
  const uniqueMonths = [...new Set(months.filter((month) => month > 0 && month <= maxMonth))].sort((a, b) => a - b);
  if (uniqueMonths.length <= CENSOR_MARKER_LIMIT) {
    return uniqueMonths;
  }

  const step = (uniqueMonths.length - 1) / (CENSOR_MARKER_LIMIT - 1);
  return [...new Set(Array.from({ length: CENSOR_MARKER_LIMIT }, (_item, index) => uniqueMonths[Math.round(index * step)]))];
}

function SurvivalCurve({ row, ui }: { row: LookupRow; ui: (typeof UI_COPY)[Language] }) {
  const chart = { left: 62, right: 226, top: 16, bottom: 106 };
  const maxMonth = 60;
  const xScale = (month: number) => chart.left + (Math.min(month, maxMonth) / maxMonth) * (chart.right - chart.left);
  const yScale = (probability: number) => chart.bottom - Math.max(0, Math.min(1, probability)) * (chart.bottom - chart.top);
  type CurvePoint = { month: number; probability: number };
  const buildCurvePoints = (probabilities: number[]): CurvePoint[] =>
    row.curve_months
      .map((month, index) => ({ month, probability: probabilities[index] }))
      .filter((point): point is CurvePoint => typeof point.probability === "number" && point.month <= maxMonth);
  const extendToHorizon = (points: CurvePoint[]): CurvePoint[] => {
    const lastPoint = points.at(-1);
    if (!lastPoint) {
      return [];
    }

    return lastPoint.month < maxMonth ? [...points, { month: maxMonth, probability: lastPoint.probability }] : points;
  };
  const curvePoints = buildCurvePoints(row.curve_survival_probs);
  const displayedPoints = extendToHorizon(curvePoints);
  const stepCoordinates = (points: CurvePoint[]) => {
    const coordinates: Array<{ x: number; y: number }> = [];
    points.forEach((point, index) => {
      const x = xScale(point.month);
      const y = yScale(point.probability);
      if (index === 0) {
        coordinates.push({ x, y });
        return;
      }
      const previous = points[index - 1];
      coordinates.push({ x, y: yScale(previous.probability) }, { x, y });
    });
    return coordinates;
  };
  const coordinatesPath = (coordinates: Array<{ x: number; y: number }>, firstCommand = "M") =>
    coordinates
      .map((point, index) => `${index === 0 ? firstCommand : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");
  const stepPath = (points: CurvePoint[]) => coordinatesPath(stepCoordinates(points));
  const curvePath = stepPath(displayedPoints);
  const xTicks = [0, 12, 24, 36, 48, 60];
  const riskCountByMonth = new Map(row.risk_table_months.map((month, index) => [month, row.risk_table_counts[index]]));
  const riskTable = xTicks.map((month) => ({ month, count: month === 60 ? row.risk_60m : riskCountByMonth.get(month) })).filter((point) => point.count !== undefined);
  const yTicks = [
    { label: "100", value: 1 },
    { label: "80", value: 0.8 },
    { label: "60", value: 0.6 },
    { label: "40", value: 0.4 },
    { label: "20", value: 0.2 },
    { label: "0", value: 0 },
  ];
  const survivalAtMonth = (month: number) => {
    let probability = 1;
    for (const point of curvePoints) {
      if (point.month <= month) {
        probability = point.probability;
      } else {
        break;
      }
    }
    return probability;
  };
  const censorMarkers = selectCensorMarkerMonths(row.censor_months ?? [], maxMonth).map((month) => ({
    month,
    probability: survivalAtMonth(month),
  }));
  const censorMarkerHalfHeight = 1.35;
  const medianMonth = row.median_survival_months;
  const medianX = medianMonth !== null && medianMonth >= 0 && medianMonth <= maxMonth ? xScale(medianMonth) : null;
  const hasMedianMarker = medianX !== null;
  const medianY = yScale(0.5);
  const medianLabelX = medianX === null ? chart.left : Math.min(Math.max(chart.left, medianX + 2), chart.right - 24);

  return (
    <figure className="curve-panel">
      <figcaption>
        <span>{ui.kmCurve}</span>
        <span className="curve-legend">
          <span className="legend-censor">{ui.censorMarkers}</span>
        </span>
      </figcaption>
      <svg viewBox="0 0 244 166" role="img" aria-label={ui.kmCurve}>
        <text className="axis-title y-axis-title" x="11" y={(chart.top + chart.bottom) / 2} transform={`rotate(-90 11 ${(chart.top + chart.bottom) / 2})`}>
          {ui.overallSurvivalAxis}
        </text>
        {xTicks.map((tick) => (
          <g key={tick}>
            <line className="tick-line" x1={xScale(tick)} y1={chart.bottom} x2={xScale(tick)} y2={chart.bottom + 2.5} vectorEffect="non-scaling-stroke" />
            <text className="axis-label x-label" x={xScale(tick)} y="117">
              {tick}
            </text>
          </g>
        ))}
        {yTicks.map((tick) => (
          <g key={tick.label}>
            {tick.value > 0 && tick.value < 1 ? (
              <line className="reference-line" x1={chart.left} y1={yScale(tick.value)} x2={chart.right} y2={yScale(tick.value)} vectorEffect="non-scaling-stroke" />
            ) : null}
            <line className="y-tick-line" x1={chart.left - 2.8} y1={yScale(tick.value)} x2={chart.left} y2={yScale(tick.value)} vectorEffect="non-scaling-stroke" />
            <text className="axis-label y-label" x={chart.left - 4.2} y={yScale(tick.value) + 1.2}>
              {tick.label}
            </text>
          </g>
        ))}
        <line className="axis-line" x1={chart.left} y1={chart.bottom} x2={chart.right} y2={chart.bottom} vectorEffect="non-scaling-stroke" />
        <line className="axis-line" x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} vectorEffect="non-scaling-stroke" />
        {hasMedianMarker && medianX !== null ? (
          <g className="median-marker" aria-hidden="true">
            <line className="median-helper-line" x1={chart.left} y1={medianY} x2={medianX} y2={medianY} vectorEffect="non-scaling-stroke" />
            <line className="median-helper-line" x1={medianX} y1={medianY} x2={medianX} y2={chart.bottom} vectorEffect="non-scaling-stroke" />
            <text className="median-label" x={medianLabelX} y={medianY - 2}>
              {ui.medianMarker} {medianMonth} mo
            </text>
          </g>
        ) : null}
        <path className="curve-line" d={curvePath} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <g className="censor-marks" aria-hidden="true">
          {censorMarkers.map((marker) => {
            const y = yScale(marker.probability);
            return (
              <line
                key={marker.month}
                className="censor-mark"
                x1={xScale(marker.month)}
                x2={xScale(marker.month)}
                y1={Math.max(chart.top, y - censorMarkerHalfHeight)}
                y2={Math.min(chart.bottom, y + censorMarkerHalfHeight)}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </g>
        <text className="axis-title x-axis-title" x={(chart.left + chart.right) / 2} y="128">
          Time (Months)
        </text>
        <text className="risk-table-label" x={chart.left - 16} y="148">
          {ui.numberAtRisk}
        </text>
        {riskTable.map((point) => (
          <text key={point.month} className="risk-table-count" x={xScale(point.month)} y="148">
            {point.count}
          </text>
        ))}
      </svg>
    </figure>
  );
}
