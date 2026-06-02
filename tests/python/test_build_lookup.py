from collections import Counter
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

from build_lookup import DATA_SOURCE, build_metadata, build_options


class BuildLookupTests(unittest.TestCase):
    def test_build_options_uses_only_artifact_sites(self):
        options = build_options(
            {
                "summary": {
                    "sexes": ["Female", "Male"],
                    "sites": ["Tongue"],
                    "histology_groups": ["8050-8089: squamous cell neoplasms"],
                },
            },
        )

        self.assertEqual(options["sites"], ["Tongue"])
        self.assertNotIn("Larynx", options["sites"])

    def test_build_metadata_keeps_user_facing_data_source_separate_from_file_name(self):
        artifact = {
            "summary": {"record_count": 12, "row_count": 3},
            "thresholds": {"minimum_sample": 20, "stable_sample": 50},
        }
        metadata = build_metadata("统计表.xlsx", 14, artifact, 2, Counter({"bad row": 2}))

        self.assertEqual(metadata["data_source"], DATA_SOURCE)
        self.assertEqual(metadata["source_file"], "统计表.xlsx")
        self.assertIn("SEER 数据库导出表", metadata["data_source"]["zh"])
        self.assertNotEqual(metadata["data_source"]["zh"], metadata["source_file"])


if __name__ == "__main__":
    unittest.main()
