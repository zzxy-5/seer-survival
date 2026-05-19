import { describe, expect, it } from "vitest";

import { dataUrl } from "./data-path";

describe("dataUrl", () => {
  it("loads data under the deployed site base path", () => {
    expect(dataUrl("options.json", "/seer-survival/")).toBe("/seer-survival/data/options.json");
  });

  it("keeps file-only standalone builds relative", () => {
    expect(dataUrl("metadata.json", "./")).toBe("./data/metadata.json");
  });
});
