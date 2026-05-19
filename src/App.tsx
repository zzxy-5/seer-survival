import { useEffect, useMemo, useState } from "react";

import { findLookupResult, type LookupArtifact, type LookupInputs, type LookupResult, type LookupRow } from "./lookup";
import { formatMedianSurvival, formatProbability, matchingLevelLabel, qualityLabel } from "./presentation";
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

function makeInputs(form: FormState): LookupInputs {
  if (form.age.trim() === "") {
    throw new Error("年龄不能为空");
  }
  const age = Number(form.age);
  if (!Number.isFinite(age)) {
    throw new Error("年龄需要是数字");
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

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadJson<LookupArtifact>("/data/survival_lookup.json"),
      loadJson<OptionsData>("/data/options.json"),
      loadJson<Metadata>("/data/metadata.json"),
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
    try {
      return { result: findLookupResult(artifact, makeInputs(form)), error: null };
    } catch (error: unknown) {
      return { result: null, error: error instanceof Error ? error.message : "查表失败" };
    }
  }, [artifact, form]);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="kicker">SEER Survival Lookup</p>
          <h1>口腔与咽部肿瘤生存月数查表</h1>
        </div>
        <div className="status-strip">
          <span>科研展示版</span>
          <span>静态 JSON</span>
          <span>不用于临床决策</span>
        </div>
      </header>

      <section className="workspace" aria-label="Survival lookup workspace">
        <section className="input-panel" aria-label="Lookup inputs">
          <div className="panel-heading">
            <h2>输入组合</h2>
            {metadata ? <p>{metadata.record_count.toLocaleString()} 条有效记录</p> : <p>加载中</p>}
          </div>

          {loadError ? <div className="notice error">{loadError}</div> : null}

          <div className="control-grid">
            <SelectField label="性别" value={form.sex} options={options?.sexes ?? []} onChange={(value) => updateForm("sex", value)} />
            <SelectField label="肿瘤部位" value={form.site} options={options?.sites ?? []} onChange={(value) => updateForm("site", value)} />
            <SelectField
              label="组织学大类"
              value={form.histologyGroup}
              options={options?.histology_groups ?? []}
              onChange={(value) => updateForm("histologyGroup", value)}
            />
            <label className="field">
              <span>年龄</span>
              <input min="0" max="120" type="number" value={form.age} onChange={(event) => updateForm("age", event.target.value)} />
            </label>
          </div>

          <div className="tnm-grid">
            <SelectField label="T" value={form.tStage} options={options?.t_stages ?? []} onChange={(value) => updateForm("tStage", value)} />
            <SelectField label="N" value={form.nStage} options={options?.n_stages ?? []} onChange={(value) => updateForm("nStage", value)} />
            <SelectField label="M" value={form.mStage} options={options?.m_stages ?? []} onChange={(value) => updateForm("mStage", value)} />
          </div>
        </section>

        <section className="result-panel" aria-label="Lookup result">
          {lookup.error ? (
            <EmptyResult title={lookup.error} />
          ) : lookup.result ? (
            <ResultView result={lookup.result} />
          ) : artifact ? (
            <EmptyResult title="没有对应查表行" />
          ) : (
            <EmptyResult title="正在加载查表数据" />
          )}
        </section>
      </section>
    </main>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={options.length === 0}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
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

function ResultView({ result }: { result: LookupResult }) {
  const row = result.row;
  return (
    <>
      <div className="result-topline">
        <div>
          <p className="kicker">中位生存月数估计</p>
          <h2>{formatMedianSurvival(row.median_survival_months)}</h2>
        </div>
        <span className={`quality ${row.data_quality_flag}`}>{qualityLabel(row.data_quality_flag)}</span>
      </div>

      <div className="metric-grid">
        <Metric label="12 月生存率" value={formatProbability(row.survival_12m)} />
        <Metric label="36 月生存率" value={formatProbability(row.survival_36m)} />
        <Metric label="60 月生存率" value={formatProbability(row.survival_60m)} />
        <Metric label="样本量" value={row.sample_size.toLocaleString()} />
      </div>

      <SurvivalCurve row={row} />

      <dl className="detail-list">
        <div>
          <dt>查表层级</dt>
          <dd>{matchingLevelLabel(row.matching_level)}</dd>
        </div>
        <div>
          <dt>事件 / 删失</dt>
          <dd>
            {row.event_count.toLocaleString()} / {row.censor_count.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt>匹配键</dt>
          <dd>{result.matchedKey}</dd>
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

function SurvivalCurve({ row }: { row: LookupRow }) {
  const maxMonth = Math.max(60, ...row.curve_months);
  const points = row.curve_months.map((month, index) => {
    const x = 8 + (month / maxMonth) * 84;
    const y = 88 - row.curve_survival_probs[index] * 76;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <figure className="curve-panel">
      <figcaption>Kaplan-Meier 生存曲线</figcaption>
      <svg viewBox="0 0 100 100" role="img" aria-label="Survival curve">
        <line x1="8" y1="88" x2="94" y2="88" />
        <line x1="8" y1="10" x2="8" y2="88" />
        <polyline points={points.join(" ")} />
        <text x="7" y="97">
          0
        </text>
        <text x="84" y="97">
          {maxMonth} 月
        </text>
        <text x="0" y="15">
          100%
        </text>
      </svg>
    </figure>
  );
}
