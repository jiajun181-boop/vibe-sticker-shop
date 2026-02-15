import { toSafeCsvCell } from "@/lib/csv";

describe("toSafeCsvCell", () => {
  it("escapes formula-like prefix", () => {
    expect(toSafeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(toSafeCsvCell("+1+1")).toBe("'+1+1");
    expect(toSafeCsvCell("-1+1")).toBe("'-1+1");
    expect(toSafeCsvCell("@cmd")).toBe("'@cmd");
  });

  it("keeps normal values untouched", () => {
    expect(toSafeCsvCell("hello")).toBe("hello");
    expect(toSafeCsvCell("123")).toBe("123");
  });
});
