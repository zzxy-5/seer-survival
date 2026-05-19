import unittest

from scripts.seer_lookup_pipeline.km import kaplan_meier


class KaplanMeierTests(unittest.TestCase):
    def test_curve_uses_censoring_without_survival_drop(self):
        result = kaplan_meier([(1, True), (2, False), (3, True), (4, False)])

        self.assertEqual(result.sample_size, 4)
        self.assertEqual(result.event_count, 2)
        self.assertEqual(result.censor_count, 2)
        self.assertEqual(result.curve_months, [0, 1, 3])
        self.assertAlmostEqual(result.curve_survival_probs[0], 1.0)
        self.assertAlmostEqual(result.curve_survival_probs[1], 0.75)
        self.assertAlmostEqual(result.curve_survival_probs[2], 0.375)
        self.assertEqual(result.median_survival_months, 3)

    def test_median_not_reached(self):
        result = kaplan_meier([(10, False), (20, True), (30, False), (40, False)])

        self.assertIsNone(result.median_survival_months)
        self.assertGreater(result.survival_12m, 0.0)
        self.assertGreater(result.survival_36m, 0.0)

    def test_zero_month_event_is_supported(self):
        result = kaplan_meier([(0, True), (5, False)])

        self.assertEqual(result.curve_months[1], 0)
        self.assertAlmostEqual(result.curve_survival_probs[1], 0.5)

    def test_same_month_events_and_censors_use_pre_censor_risk_set(self):
        result = kaplan_meier([(5, True), (5, False), (5, False), (10, True)])

        self.assertEqual(result.curve_months, [0, 5, 10])
        self.assertAlmostEqual(result.curve_survival_probs[1], 0.75)
        self.assertAlmostEqual(result.curve_survival_probs[2], 0.0)
        self.assertEqual(result.survival_12m, 0.0)

    def test_exact_horizon_event_is_included(self):
        result = kaplan_meier([(12, True), (24, False)])

        self.assertAlmostEqual(result.survival_12m, 0.5)

    def test_empty_observations_raise(self):
        with self.assertRaises(ValueError):
            kaplan_meier([])

    def test_all_censored_group_has_flat_curve(self):
        result = kaplan_meier([(10, False), (20, False)])

        self.assertIsNone(result.median_survival_months)
        self.assertEqual(result.curve_months, [0])
        self.assertEqual(result.curve_survival_probs, [1.0])
        self.assertEqual(result.survival_60m, 1.0)

    def test_all_events_at_one_month(self):
        result = kaplan_meier([(8, True), (8, True), (8, True)])

        self.assertEqual(result.median_survival_months, 8)
        self.assertEqual(result.curve_months, [0, 8])
        self.assertAlmostEqual(result.curve_survival_probs[1], 0.0)


if __name__ == "__main__":
    unittest.main()
