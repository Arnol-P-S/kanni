import { describe, expect, it } from "vitest";

import { safeInternalPath } from "@/lib/navigation";

describe("safeInternalPath", () => {
  it("preserves a local path with query and fragment", () => {
    expect(safeInternalPath("/portal/student?notice=ready#goal")).toBe(
      "/portal/student?notice=ready#goal",
    );
  });

  it.each([
    "https://example.test",
    "//example.test/path",
    "/\\example.test/path",
    "/portal/student\nSet-Cookie: unsafe=true",
    "not-a-path",
  ])("rejects non-local or ambiguous destination %s", (value) => {
    expect(safeInternalPath(value)).toBe("/");
  });
});
