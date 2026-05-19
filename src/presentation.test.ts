import { describe, expect, it } from "vitest";

import {
  APP_COPY,
  displayLabel,
  formatMatchedKey,
  formatMedianSurvival,
  formatProbability,
  matchingLevelLabel,
  qualityLabel,
} from "./presentation";

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

  it("uses the redesigned product name and non-technical status copy", () => {
    expect(APP_COPY.name).toBe("头颈肿瘤生存图谱");
    expect(APP_COPY.statusBadges).toEqual(["SEER 队列数据", "研究参考", "不用于临床决策"]);
    expect(APP_COPY.statusBadges).not.toContain("科研展示版");
    expect(APP_COPY.statusBadges).not.toContain("静态 JSON");
  });

  it("defines concise method and boundary guidance", () => {
    expect(APP_COPY.method.title).toBe("方法与边界");
    expect(APP_COPY.method.points).toEqual([
      "基于 SEER 队列中相似病例组的统计生存结果。",
      "展示队列层面的生存参照，不是个人预后预测。",
      "不用于临床决策，具体诊疗需要结合医生判断。",
    ]);
  });

  it("renders SEER coded values as Chinese interface labels", () => {
    expect(displayLabel("Male")).toBe("男性");
    expect(displayLabel("Tongue")).toBe("舌");
    expect(displayLabel("8050-8089: squamous cell neoplasms")).toBe("8050-8089：鳞状细胞肿瘤");
    expect(displayLabel("Unknown")).toBe("未知");
    expect(displayLabel("T2")).toBe("T2");
  });

  it("formats matched lookup combinations without raw pipe-delimited keys", () => {
    expect(formatMatchedKey("site_tnm|Any|Tongue|Any|Any|T2|N1|M0")).toBe(
      "部位 + TNM · 性别不限 · 舌 · 组织学不限 · 年龄不限 · T2 / N1 / M0",
    );
  });
});
