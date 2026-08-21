"use client";

import { removeSubscriber } from "@/lib/actions/marketing";
import type { Subscriber } from "@/lib/types";

export default function SubscriberRow({
  subscriber,
}: {
  subscriber: Subscriber;
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">
          {subscriber.email}
        </p>
        <p className="text-xs text-ink/50">
          {subscriber.name || "—"} · joined{" "}
          {new Date(subscriber.created_at).toLocaleDateString()}
        </p>
      </div>
      <form
        action={removeSubscriber}
        onSubmit={(event) => {
          if (!confirm(`Remove ${subscriber.email} from the mailing list?`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={subscriber.id} />
        <button
          type="submit"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          Remove
        </button>
      </form>
    </li>
  );
}
