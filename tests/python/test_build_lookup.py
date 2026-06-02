import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

from build_lookup import build_options


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


if __name__ == "__main__":
    unittest.main()
