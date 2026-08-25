"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatuses } from "@/lib/actions/admin";
import type { OrderStatus } from "@/lib/types";

type StatusMap = Record<string, OrderStatus>;

type OrderStatusBatchContextValue = {
  statusFor: (orderId: string, fallback: OrderStatus) => OrderStatus;
  setStatus: (orderId: string, status: OrderStatus) => void;
};

const OrderStatusBatchContext = createContext<OrderStatusBatchContextValue | null>(null);

export function useOrderStatusBatch() {
  const context = useContext(OrderStatusBatchContext);
  if (!context) {
    throw new Error("OrderStatusSelect must be inside OrderStatusBatchProvider");
  }
  return context;
}

export default function OrderStatusBatchProvider({
  initialStatuses,
  labels,
  children,
}: {
  initialStatuses: StatusMap;
  labels: {
    hint: string;
    changedOne: string;
    changedMany: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
  };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [savedStatuses, setSavedStatuses] = useState(initialStatuses);
  const [draftStatuses, setDraftStatuses] = useState(initialStatuses);
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();
  const changes = useMemo(
    () =>
      Object.entries(draftStatuses)
        .filter(([id, status]) => savedStatuses[id] !== status)
        .map(([id, status]) => ({ id, status })),
    [draftStatuses, savedStatuses]
  );
  const context = useMemo<OrderStatusBatchContextValue>(
    () => ({
      statusFor: (orderId, fallback) => draftStatuses[orderId] ?? fallback,
      setStatus: (orderId, status) => {
        setDraftStatuses((current) => ({ ...current, [orderId]: status }));
        setFeedback(null);
      },
    }),
    [draftStatuses]
  );

  function saveChanges() {
    if (changes.length === 0) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await updateOrderStatuses(changes);
      if (!result.ok) {
        setFeedback("error");
        return;
      }
      setSavedStatuses(draftStatuses);
      setFeedback("saved");
      window.dispatchEvent(new Event("grainbuds:orders-changed"));
      router.refresh();
    });
  }

  return (
    <OrderStatusBatchContext.Provider value={context}>
      <div className="sticky top-3 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream-light/95 p-3 pl-4 shadow-[0_12px_35px_-24px_rgba(18,26,37,0.55)] backdrop-blur-md">
        <div>
          <p className="text-sm font-medium text-ink">
            {changes.length > 0
              ? `${changes.length} ${changes.length === 1 ? labels.changedOne : labels.changedMany}`
              : labels.hint}
          </p>
          <p
            aria-live="polite"
            className={`mt-0.5 min-h-4 text-xs font-medium ${
              feedback === "saved"
                ? "text-matcha-deep"
                : feedback === "error"
                  ? "text-red-600"
                  : "text-ink/45"
            }`}
          >
            {feedback === "saved"
              ? `✓ ${labels.saved}`
              : feedback === "error"
                ? labels.error
                : " "}
          </p>
        </div>
        <button
          type="button"
          onClick={saveChanges}
          disabled={isPending || changes.length === 0}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep disabled:cursor-not-allowed disabled:opacity-35"
        >
          {isPending ? labels.saving : labels.save}
        </button>
      </div>
      {children}
    </OrderStatusBatchContext.Provider>
  );
}
