import { describe, expect, it } from "vitest";

import appSource from "./App.tsx?raw";

describe("app interface copy", () => {
  it("uses user-facing data summary labels", () => {
    expect(appSource).toContain("可查询组合");
    expect(appSource).toContain("匹配组合");
    expect(appSource).not.toContain("查表");
    expect(appSource).not.toContain("匹配索引");
  });
});
