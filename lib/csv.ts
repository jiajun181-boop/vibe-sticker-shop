export function toSafeCsvCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  const trimmed = raw.trimStart();
  if (
    trimmed.startsWith("=") ||
    trimmed.startsWith("+") ||
    trimmed.startsWith("-") ||
    trimmed.startsWith("@")
  ) {
    return `'${raw}`;
  }
  return raw;
}
