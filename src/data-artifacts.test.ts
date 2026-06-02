import { describe, expect, it } from "vitest";

import options from "../public/data/options.json";
import lookup from "../public/data/survival_lookup.json";

describe("generated data artifacts", () => {
  it("uses only primary tumor sites present in the lookup artifact", () => {
    expect(options.sites).toEqual(lookup.summary.sites);
    expect(options.sites).not.toContain("Larynx");
  });
});
