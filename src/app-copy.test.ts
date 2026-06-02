import { describe, expect, it } from "vitest";

import appSource from "./App.tsx?raw";
import { UI_COPY } from "./presentation";

describe("app interface copy", () => {
  it("uses user-facing data summary labels", () => {
    expect(UI_COPY.zh.lookupGroups).toBe("可查询组合");
    expect(UI_COPY.zh.matchedGroup).toBe("匹配组合");
    expect(appSource).toContain("ui.lookupGroups");
    expect(appSource).toContain("ui.matchedGroup");
    expect(appSource).not.toContain("查表");
    expect(appSource).not.toContain("匹配索引");
  });

  it("renders TNM source guidance and metadata-backed data provenance", () => {
    expect(appSource).toContain("copy.tnm.points.map");
    expect(appSource).toContain("metadata.source_file");
    expect(appSource).toContain("copy.source.title");
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
