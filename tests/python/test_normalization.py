import unittest

from scripts.seer_lookup_pipeline.normalization import (
    age_group,
    coarse_age_group,
    key_to_string,
    matching_keys,
    normalize_m_stage,
    normalize_n_stage,
    normalize_record,
    normalize_t_stage,
    parse_event,
    parse_survival_months,
)
from scripts.seer_lookup_pipeline.schema import SOURCE_COLUMNS


class NormalizationTests(unittest.TestCase):
    def test_age_group_boundaries(self):
        self.assertEqual(age_group("39"), "<40")
        self.assertEqual(age_group("40"), "40-49")
        self.assertEqual(age_group("59"), "50-59")
        self.assertEqual(age_group("60"), "60-69")
        self.assertEqual(age_group("79"), "70-79")
        self.assertEqual(age_group("80"), "80+")

    def test_coarse_age_group_boundaries(self):
        self.assertEqual(coarse_age_group("59"), "<60")
        self.assertEqual(coarse_age_group("60"), "60-69")
        self.assertEqual(coarse_age_group("70"), "70+")

    def test_tnm_substages_collapse_to_major_stage(self):
        self.assertEqual(normalize_t_stage("T2a"), "T2")
        self.assertEqual(normalize_t_stage("cT4b"), "T4")
        self.assertEqual(normalize_n_stage("N2c"), "N2")
        self.assertEqual(normalize_m_stage("M1a"), "M1")

    def test_tnm_unknown_values(self):
        for raw in ["", "Blank(s)", "N/A", "Not applicable", "88"]:
            self.assertEqual(normalize_t_stage(raw), "Unknown")
            self.assertEqual(normalize_n_stage(raw), "Unknown")
            self.assertEqual(normalize_m_stage(raw), "Unknown")

    def test_tnm_rejects_ambiguous_values(self):
        self.assertEqual(normalize_t_stage("T1/T2"), "Unknown")
        self.assertEqual(normalize_t_stage("T1-2"), "Unknown")
        self.assertEqual(normalize_t_stage("T12"), "Unknown")
        self.assertEqual(normalize_n_stage("N1/N2"), "Unknown")
        self.assertEqual(normalize_m_stage("M01"), "Unknown")

    def test_survival_and_event_parsing(self):
        self.assertEqual(parse_survival_months("0"), 0)
        self.assertEqual(parse_survival_months("83"), 83)
        self.assertTrue(parse_event("Dead"))
        self.assertFalse(parse_event("Alive"))

    def test_invalid_survival_months_identifies_field(self):
        with self.assertRaisesRegex(ValueError, "Invalid survival months: Unknown"):
            parse_survival_months("Unknown")

    def test_normalize_record_uses_ajcc_for_2015(self):
        row = self._source_row("2015", ajcc=("T2a", "N2c", "M0"), seer=("T4", "N3", "M1"))
        record = normalize_record(row)

        self.assertEqual(record.sex, "Male")
        self.assertEqual(record.site, "Tongue")
        self.assertEqual(record.histology_group, "8050-8089: squamous cell neoplasms")
        self.assertEqual(record.age_group, "60-69")
        self.assertEqual(record.coarse_age_group, "60-69")
        self.assertEqual(record.t_stage, "T2")
        self.assertEqual(record.n_stage, "N2")
        self.assertEqual(record.m_stage, "M0")
        self.assertEqual(record.survival_months, 36)
        self.assertTrue(record.event)

    def test_normalize_record_uses_seer_combined_for_2016(self):
        row = self._source_row("2016", ajcc=("T2", "N1", "M0"), seer=("cT4b", "N3", "M1a"))
        record = normalize_record(row)

        self.assertEqual(record.t_stage, "T4")
        self.assertEqual(record.n_stage, "N3")
        self.assertEqual(record.m_stage, "M1")

    def test_matching_keys_order_and_key_string(self):
        record = normalize_record(self._source_row("2016", seer=("T2", "N1", "M0")))
        keys = matching_keys(record)

        self.assertEqual([key.matching_level for key in keys], ["full", "no_sex", "no_histology", "coarse_age", "site_tnm", "site_m", "site_only"])
        self.assertEqual(key_to_string(keys[0]), "full|Male|Tongue|8050-8089: squamous cell neoplasms|60-69|T2|N1|M0")
        self.assertEqual(key_to_string(keys[5]), "site_m|Any|Tongue|Any|Any|Any|Any|M0")
        self.assertEqual(key_to_string(keys[6]), "site_only|Any|Tongue|Any|Any|Any|Any|Any")

    def _source_row(self, year, ajcc=("T1", "N0", "M0"), seer=("Blank(s)", "Blank(s)", "Blank(s)")):
        return {
            SOURCE_COLUMNS["sex"]: "Male",
            SOURCE_COLUMNS["year"]: year,
            SOURCE_COLUMNS["site"]: "Tongue",
            SOURCE_COLUMNS["histology_group"]: "8050-8089: squamous cell neoplasms",
            SOURCE_COLUMNS["survival_months"]: "36",
            SOURCE_COLUMNS["vital_status"]: "Dead",
            SOURCE_COLUMNS["age"]: "63",
            SOURCE_COLUMNS["ajcc_t_7"]: ajcc[0],
            SOURCE_COLUMNS["ajcc_n_7"]: ajcc[1],
            SOURCE_COLUMNS["ajcc_m_7"]: ajcc[2],
            SOURCE_COLUMNS["seer_t_2016"]: seer[0],
            SOURCE_COLUMNS["seer_n_2016"]: seer[1],
            SOURCE_COLUMNS["seer_m_2016"]: seer[2],
        }


if __name__ == "__main__":
    unittest.main()
