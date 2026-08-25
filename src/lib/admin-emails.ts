/** Server-side admin allowlist. Never expose this value to client code. */
export function getAdminEmails(): string[] {
  return [...new Set(
    (process.env.ORDER_ADMIN_EMAILS ?? "")
      .split(/[\n,;]/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )].slice(0, 50);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
