from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any

from seer_lookup_pipeline.lookup_builder import build_lookup_artifact
from seer_lookup_pipeline.normalization import normalize_record
from seer_lookup_pipeline.schema import SOURCE_COLUMNS
from seer_lookup_pipeline.validation import validate_lookup_artifact
from seer_lookup_pipeline.xlsx_stream import iter_selected_rows


DATA_SOURCE = {
    "zh": "SEER 数据库导出表（头颈肿瘤队列，诊断年份 2010-2016）",
    "en": "SEER database export table (head and neck tumor cohort, diagnosis years 2010-2016)",
}


def build_options(artifact: dict[str, Any]) -> dict[str, Any]:
    return {
        "sexes": artifact["summary"]["sexes"],
        "sites": artifact["summary"]["sites"],
        "histology_groups": artifact["summary"]["histology_groups"],
        "age_groups": ["<40", "40-49", "50-59", "60-69", "70-79", "80+"],
        "t_stages": ["T0", "T1", "T2", "T3", "T4", "TX", "Unknown"],
        "n_stages": ["N0", "N1", "N2", "N3", "NX", "Unknown"],
        "m_stages": ["M0", "M1", "MX", "Unknown"],
    }


def build_metadata(
    source_path: str,
    processed: int,
    artifact: dict[str, Any],
    skipped: int,
    skipped_reasons: Counter[str],
) -> dict[str, Any]:
    return {
        "data_source": DATA_SOURCE,
        "source_file": Path(source_path).name,
        "processed_rows": processed,
        "record_count": artifact["summary"]["record_count"],
        "skipped_rows": skipped,
        "skipped_reasons": dict(sorted(skipped_reasons.items())),
        "lookup_rows": artifact["summary"]["row_count"],
        "thresholds": artifact["thresholds"],
        "runtime_mode": "static_lookup_only",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build static SEER survival lookup artifacts.")
    parser.add_argument("--input", required=True, help="Path to source .xlsx workbook")
    parser.add_argument("--output", required=True, help="Directory for generated JSON files")
    parser.add_argument("--limit", type=int, default=None, help="Optional row limit for quick pipeline checks")
    parser.add_argument("--progress-every", type=int, default=5000, help="Print progress after this many source rows")
    args = parser.parse_args()

    records = []
    skipped = 0
    skipped_reasons: Counter[str] = Counter()
    processed = 0
    for row in iter_selected_rows(args.input, SOURCE_COLUMNS):
        processed += 1
        try:
            records.append(normalize_record(row))
        except (KeyError, ValueError) as exc:
            skipped += 1
            skipped_reasons[f"{type(exc).__name__}: {exc}"] += 1
        if args.progress_every and processed % args.progress_every == 0:
            print(f"Processed {processed} source rows; normalized {len(records)}; skipped {skipped}", flush=True)
        if args.limit is not None and processed >= args.limit:
            break

    artifact = build_lookup_artifact(records)
    validate_lookup_artifact(artifact)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    metadata = build_metadata(args.input, processed, artifact, skipped, skipped_reasons)

    (output_dir / "survival_lookup.json").write_text(
        json.dumps(artifact, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (output_dir / "options.json").write_text(json.dumps(build_options(artifact), ensure_ascii=False, indent=2), encoding="utf-8")
    (output_dir / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
