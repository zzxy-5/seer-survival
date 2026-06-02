import { describe, expect, it } from "vitest";

import {
  APP_COPY,
  APP_COPY_EN,
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
    expect(formatMedianSurvival(42, "en")).toBe("42 mo");
    expect(formatMedianSurvival(null, "en")).toBe("Not reached");
  });

  it("labels quality and fallback levels", () => {
    expect(qualityLabel("stable")).toBe("样本稳定");
    expect(qualityLabel("very_small_sample")).toBe("极小样本");
    expect(matchingLevelLabel("site_tnm")).toBe("部位 + TNM");
    expect(qualityLabel("stable", "en")).toBe("Stable sample");
    expect(matchingLevelLabel("site_tnm", "en")).toBe("Site + TNM");
  });

  it("uses the redesigned product name and non-technical status copy", () => {
    expect(APP_COPY.name).toBe("头颈肿瘤生存图谱");
    expect(APP_COPY_EN.name).toBe("Head and Neck Tumor Survival Atlas");
    expect(APP_COPY.statusBadges).toEqual(["SEER 队列数据", "研究参考", "不用于临床决策"]);
    expect(APP_COPY_EN.statusBadges).toEqual(["SEER cohort data", "Research reference", "Not for clinical decisions"]);
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
    expect(displayLabel("Male", "en")).toBe("Male");
    expect(displayLabel("Tongue")).toBe("舌");
    expect(displayLabel("Tongue", "en")).toBe("Tongue");
    expect(displayLabel("Larynx")).toBe("喉");
    expect(displayLabel("8050-8089: squamous cell neoplasms")).toBe("8050-8089：鳞状细胞肿瘤");
    expect(displayLabel("8050-8089: squamous cell neoplasms", "en")).toBe("8050-8089: squamous cell neoplasms");
    expect(displayLabel("Unknown")).toBe("未知");
    expect(displayLabel("T2")).toBe("T2");
  });

  it("explains TNM source versions and source data provenance", () => {
    expect(APP_COPY.tnm.title).toBe("TNM 分期口径");
    expect(APP_COPY.tnm.points).toEqual([
      "2010-2015 年病例使用 Derived AJCC T/N/M, 7th ed (2010-2015)。",
      "2016 年及以后病例使用 Derived SEER Combined T/N/M (2016+)。",
      "下拉项统一为 T/N/M 主分期；子分期已合并，缺失或无法解析值标为 Unknown。",
    ]);
    expect(APP_COPY.source.title).toBe("数据来源");
    expect(APP_COPY.source.note).toBe("源字段来自 SEER 导出表，网站运行时只读取离线生成的静态查找表。");
  });

  it("formats matched lookup combinations without raw pipe-delimited keys", () => {
    expect(formatMatchedKey("site_tnm|Any|Tongue|Any|Any|T2|N1|M0")).toBe(
      "部位 + TNM · 性别不限 · 舌 · 组织学不限 · 年龄不限 · T2 / N1 / M0",
    );
    expect(formatMatchedKey("site_tnm|Any|Tongue|Any|Any|T2|N1|M0", "en")).toBe(
      "Site + TNM · Sex: any · Tongue · Histology: any · Age: any · T2 / N1 / M0",
    );
  });
});
