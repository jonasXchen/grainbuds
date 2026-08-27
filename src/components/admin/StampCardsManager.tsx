"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLoyaltyStampBalances } from "@/lib/actions/admin";

type StampCardMember = {
  userId: string;
  email: string;
  stamps: number;
};

type StampCardsManagerProps = {
  members: StampCardMember[];
  labels: {
    search: string;
    searchPlaceholder: string;
    noResults: string;
    stamps: string;
    changedOne: string;
    changedMany: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
  };
};

export default function StampCardsManager({
  members,
  labels,
}: StampCardsManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [savedBalances, setSavedBalances] = useState<Record<string, number>>(
    () => Object.fromEntries(members.map((member) => [member.userId, member.stamps]))
  );
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleMembers = useMemo(
    () => members.filter((member) =>
      member.email.toLocaleLowerCase().includes(normalizedQuery)
    ),
    [members, normalizedQuery]
  );
  const changes = useMemo(
    () => Object.entries(drafts).map(([userId, stamps]) => ({ userId, stamps })),
    [drafts]
  );

  function changeBalance(userId: string, value: string) {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 0 || next > 1000) return;
    setDrafts((current) => {
      const updated = { ...current };
      if (next === savedBalances[userId]) delete updated[userId];
      else updated[userId] = next;
      return updated;
    });
    setFeedback(null);
  }

  function saveChanges() {
    if (changes.length === 0) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await updateLoyaltyStampBalances(changes);
      if (!result.ok) {
        setFeedback("error");
        return;
      }
      setSavedBalances((current) => ({
        ...current,
        ...Object.fromEntries(changes.map(({ userId, stamps }) => [userId, stamps])),
      }));
      setDrafts({});
      setFeedback("saved");
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative mt-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/40"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={labels.search}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-2xl border border-ink/10 bg-cream-light py-3 pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-matcha-deep"
        />
      </div>

      {feedback === "saved" && (
        <p aria-live="polite" className="mt-3 text-sm font-medium text-matcha-deep">
          ✓ {labels.saved}
        </p>
      )}

      {visibleMembers.length === 0 ? (
        <p className="mt-4 rounded-3xl bg-cream-light p-6 text-sm text-ink/55">
          {labels.noResults}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-cream-light">
          {visibleMembers.map((member) => {
            const current = drafts[member.userId] ?? savedBalances[member.userId];
            const changed = member.userId in drafts;
            return (
              <li
                key={member.userId}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <p className="min-w-0 truncate text-sm font-medium text-ink">
                  {member.email}
                </p>
                <label className={`flex shrink-0 items-center gap-2 rounded-2xl border p-1.5 pl-3 text-xs font-semibold transition-colors ${
                  changed
                    ? "border-sand-deep/40 bg-sand/15 text-sand-deep"
                    : "border-matcha/30 bg-matcha/10 text-matcha-deep"
                }`}>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="1"
                    required
                    value={current}
                    onChange={(event) => changeBalance(member.userId, event.target.value)}
                    aria-label={`${member.email}: ${labels.stamps}`}
                    className="w-16 rounded-xl border border-ink/10 bg-cream-light px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-ink outline-none focus:border-matcha-deep"
                  />
                  <span className="pr-2">{labels.stamps}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {changes.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream-light/95 p-3 pl-5 shadow-[0_18px_55px_-22px_rgba(18,26,37,0.65)] backdrop-blur-md md:left-[16rem]">
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium leading-none text-ink">
              {changes.length} {changes.length === 1 ? labels.changedOne : labels.changedMany}
            </p>
            {feedback === "error" && (
              <p aria-live="polite" className="mt-1.5 text-xs font-medium text-red-600">
                {labels.error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={saveChanges}
            disabled={isPending}
            className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isPending ? labels.saving : labels.save}
          </button>
        </div>
      )}
    </>
  );
}
