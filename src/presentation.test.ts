import { describe, expect, it } from "vitest";

import { formatMedianSurvival, formatProbability, matchingLevelLabel, qualityLabel } from "./presentation";

describe("presentation helpers", () => {
  it("formats survival probabilities as percentages", () => {
    expect(formatProbability(0.91234)).toBe("91.2%");
    expect(formatProbability(1)).toBe("100%");
  });

  it("formats median survival months", () => {
    expect(formatMedianSurvival(42)).toBe("42 月");
    expect(formatMedianSurvival(null)).toBe("未达到");
  });

  it("labels quality and fallback levels", () => {
    expect(qualityLabel("stable")).toBe("样本稳定");
    expect(qualityLabel("very_small_sample")).toBe("极小样本");
    expect(matchingLevelLabel("site_tnm")).toBe("部位 + TNM");
  });
});
