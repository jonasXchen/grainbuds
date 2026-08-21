"use client";

import { useState } from "react";

export default function CopyEmailsButton({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      disabled={emails.length === 0}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(emails.join(", "));
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // clipboard unavailable — nothing to do
        }
      }}
      className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-cream disabled:opacity-50"
    >
      {copied ? "✓ Copied" : "Copy all emails"}
    </button>
  );
}
