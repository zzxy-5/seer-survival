import unittest

from scripts.seer_lookup_pipeline.lookup_builder import build_lookup_artifact
from scripts.seer_lookup_pipeline.schema import NormalizedRecord
from scripts.seer_lookup_pipeline.validation import validate_lookup_artifact


def record(
    sex="Male",
    site="Tongue",
    histology="8050-8089: squamous cell neoplasms",
    age_group="60-69",
    coarse="60-69",
    t="T2",
    n="N1",
    m="M0",
    months=12,
    event=True,
):
    return NormalizedRecord(
        sex=sex,
        site=site,
        histology_group=histology,
        age_group=age_group,
        coarse_age_group=coarse,
        t_stage=t,
        n_stage=n,
        m_stage=m,
        survival_months=months,
        event=event,
    )


class LookupBuilderTests(unittest.TestCase):
    def test_artifact_contains_all_matching_levels(self):
        records = [
            record(months=6, event=True),
            record(months=18, event=False),
            record(sex="Female", months=24, event=True),
        ]

        artifact = build_lookup_artifact(records)
        levels = {row["matching_level"] for row in artifact["rows"]}

        self.assertEqual(levels, {"full", "no_sex", "no_histology", "coarse_age", "site_tnm", "site_m", "site_only"})
        validate_lookup_artifact(artifact)

    def test_index_points_to_rows(self):
        artifact = build_lookup_artifact([record(months=6, event=True), record(months=10, event=False)])

        for key, index in artifact["index"].items():
            self.assertIsInstance(key, str)
            self.assertEqual(artifact["rows"][index]["key"], key)

    def test_quality_flags_follow_sample_thresholds(self):
        small_artifact = build_lookup_artifact([record(months=i, event=True) for i in range(1, 20)])
        medium_artifact = build_lookup_artifact([record(months=i, event=True) for i in range(1, 21)])
        stable_artifact = build_lookup_artifact([record(months=i, event=True) for i in range(1, 51)])

        self.assertEqual(self._first_full_row(small_artifact)["data_quality_flag"], "very_small_sample")
        self.assertEqual(self._first_full_row(medium_artifact)["data_quality_flag"], "small_sample")
        self.assertEqual(self._first_full_row(stable_artifact)["data_quality_flag"], "stable")

    def test_validation_rejects_index_mismatch(self):
        artifact = build_lookup_artifact([record(months=6, event=True)])
        artifact["index"][artifact["rows"][0]["key"]] = 999

        with self.assertRaisesRegex(ValueError, "Index points to wrong row"):
            validate_lookup_artifact(artifact)

    def test_validation_rejects_non_monotonic_curve(self):
        artifact = build_lookup_artifact([record(months=6, event=True), record(months=10, event=False)])
        artifact["rows"][0]["curve_months"] = [0, 6, 10]
        artifact["rows"][0]["curve_survival_probs"] = [1.0, 0.4, 0.6]

        with self.assertRaisesRegex(ValueError, "monotonic"):
            validate_lookup_artifact(artifact)

    def test_validation_rejects_curve_probability_out_of_range(self):
        artifact = build_lookup_artifact([record(months=6, event=True), record(months=10, event=False)])
        artifact["rows"][0]["curve_survival_probs"] = [1.0, -0.1]

        with self.assertRaisesRegex(ValueError, "curve_survival_probs"):
            validate_lookup_artifact(artifact)

    def _first_full_row(self, artifact):
        return next(row for row in artifact["rows"] if row["matching_level"] == "full")


if __name__ == "__main__":
    unittest.main()
