import { describe, expect, it } from "vitest";

import html from "../index.html?raw";

describe("index.html file-open fallback", () => {
  it("shows a visible fallback when the Vite entry script cannot load", () => {
    expect(html).toContain("请通过本地服务器打开");
    expect(html).toContain("npm run dev");
    expect(html).toContain('src="/src/main.tsx"');
  });
});
