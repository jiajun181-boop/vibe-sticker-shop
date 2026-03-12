import { shouldAttemptBgRemoval, shouldBuildMaskOverlay } from "./generate-contour";

describe("generate-contour fast-path safeguards", () => {
  test("prefers fast mask fallback for borderline coverage in admin mode", () => {
    expect(
      shouldAttemptBgRemoval({
        maskCoverage: 0.015,
        preferFastMode: true,
        originalPixels: 1200000,
      })
    ).toBe(false);
  });

  test("still allows background removal when mask coverage is effectively unusable", () => {
    expect(
      shouldAttemptBgRemoval({
        maskCoverage: 0.995,
        preferFastMode: true,
        originalPixels: 1200000,
      })
    ).toBe(true);
  });

  test("skips background removal for oversized source images", () => {
    expect(
      shouldAttemptBgRemoval({
        maskCoverage: 0.999,
        originalPixels: 4000000,
      })
    ).toBe(false);
  });

  test("only builds mask overlays for manageable preview sizes", () => {
    expect(shouldBuildMaskOverlay(320, 320)).toBe(true);
    expect(shouldBuildMaskOverlay(500, 400)).toBe(false);
  });
});
