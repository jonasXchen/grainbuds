const fallbackReturnPath = "/admin/products";

/** Accept app-local return paths without allowing protocol-relative redirects. */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string") return fallbackReturnPath;

  const path = value.trim();
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /[\r\n]/.test(path)
  ) {
    return fallbackReturnPath;
  }

  return path;
}
