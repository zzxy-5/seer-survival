import { describe, expect, it } from "vitest";

import appSource from "./App.tsx?raw";
import { UI_COPY } from "./presentation";

describe("app interface copy", () => {
  it("uses user-facing data summary labels", () => {
    expect(UI_COPY.zh.lookupGroups).toBe("可查询组合");
    expect(UI_COPY.zh.matchedGroup).toBe("匹配组合");
    expect(UI_COPY.zh.medianSurvival).toBe("中位总生存期（OS）");
    expect(UI_COPY.zh.medianNotReachedNote).toBe("截至最后随访，生存曲线尚未下降至 50%");
    expect(UI_COPY.zh.risk60).toBe("60个月在险人数");
    expect(UI_COPY.zh.histologyIgnoredNotice).toContain("未使用所选组织学");
    expect(appSource).toContain("ui.lookupGroups");
    expect(appSource).toContain("ui.matchedGroup");
    expect(appSource).toContain("ui.histologyIgnoredNotice");
    expect(appSource).toContain("ui.medianNotReachedNote");
    expect(appSource).not.toContain("查表");
    expect(appSource).not.toContain("匹配索引");
  });

  it("renders TNM source guidance and metadata-backed data provenance", () => {
    expect(appSource).toContain("copy.tnm.points.map");
    expect(appSource).toContain("metadata.data_source[language]");
    expect(appSource).not.toContain("metadata.source_file");
    expect(appSource).toContain("copy.source.title");
    expect(UI_COPY.zh.dataSource).toBe("具体来源");
  });

  it("uses primary tumor sites from the data and supports clearer missing-data errors", () => {
    expect(appSource).toContain("SiteSelectField");
    expect(appSource).toContain("ui.missingSite");
    expect(UI_COPY.zh.missingSite("喉")).toContain("当前数据源没有");
  });

  it("renders a language toggle for Chinese and English", () => {
    expect(appSource).toContain("language-toggle");
    expect(appSource).toContain("setLanguage");
    expect(appSource).toContain("English");
    expect(appSource).toContain("中文");
  });

  it("does not reload data and reset the form when switching language", () => {
    expect(appSource).not.toContain("[ui.lookupFailed]");
  });

  it("does not render a header icon", () => {
    expect(appSource).not.toContain("brand-mark");
    expect(appSource).not.toContain("brand-mark-icon");
  });
});
