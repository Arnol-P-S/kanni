export function safeInternalPath(value: string): string {
  const normalized = value.normalize("NFC");
  if (
    !normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    normalized.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    return "/";
  }

  try {
    const base = new URL("https://kanni.invalid");
    const target = new URL(normalized, base);
    if (target.origin !== base.origin) return "/";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}
