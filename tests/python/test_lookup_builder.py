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

        self.assertEqual(
            levels,
            {
                "full",
                "no_sex",
                "site_histology_coarse_age",
                "site_histology_tnm",
                "site_histology_m",
                "site_histology",
                "no_histology",
                "coarse_age",
                "site_tnm",
                "site_m",
                "site_only",
            },
        )
        full_row = self._first_full_row(artifact)
        self.assertIn("site_histology_m|Any|Tongue|8050-8089: squamous cell neoplasms|Any|Any|Any|M0", artifact["index"])
        self.assertEqual(full_row["median_followup_months"], 12.0)
        self.assertEqual(full_row["risk_60m"], 0)
        self.assertEqual(full_row["risk_table_months"], [0, 12, 24, 36, 48, 60])
        self.assertEqual(full_row["risk_table_counts"], [2, 1, 0, 0, 0, 0])
        self.assertEqual(full_row["censor_months"], [18])
        self.assertIn("survival_60m_ci", full_row)
        self.assertIn("curve_ci_lower_probs", full_row)
        self.assertEqual(artifact["version"], 3)
        self.assertEqual(artifact["confidence_interval"]["level"], 0.95)
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
        artifact["rows"][0]["curve_ci_lower_probs"] = [1.0, 0.2, 0.4]
        artifact["rows"][0]["curve_ci_upper_probs"] = [1.0, 0.8, 0.9]

        with self.assertRaisesRegex(ValueError, "monotonic"):
            validate_lookup_artifact(artifact)

    def test_validation_rejects_curve_probability_out_of_range(self):
        artifact = build_lookup_artifact([record(months=6, event=True), record(months=10, event=False)])
        artifact["rows"][0]["curve_survival_probs"] = [1.0, -0.1]

        with self.assertRaisesRegex(ValueError, "curve_survival_probs"):
            validate_lookup_artifact(artifact)

    def test_validation_rejects_invalid_confidence_interval(self):
        artifact = build_lookup_artifact([record(months=6, event=True), record(months=10, event=False)])
        artifact["rows"][0]["survival_12m_ci"] = [0.9, 0.2]

        with self.assertRaisesRegex(ValueError, "survival_12m_ci"):
            validate_lookup_artifact(artifact)

    def test_validation_rejects_unsorted_censor_months(self):
        artifact = build_lookup_artifact([record(months=6, event=True), record(months=10, event=False), record(months=20, event=False)])
        artifact["rows"][0]["censor_months"] = [20, 10]

        with self.assertRaisesRegex(ValueError, "Censor months"):
            validate_lookup_artifact(artifact)

    def test_validation_rejects_increasing_risk_table_counts(self):
        artifact = build_lookup_artifact([record(months=6, event=True), record(months=10, event=False)])
        artifact["rows"][0]["risk_table_counts"] = [1, 2, 0, 0, 0, 0]

        with self.assertRaisesRegex(ValueError, "Risk table counts"):
            validate_lookup_artifact(artifact)

    def _first_full_row(self, artifact):
        return next(row for row in artifact["rows"] if row["matching_level"] == "full")


if __name__ == "__main__":
    unittest.main()
