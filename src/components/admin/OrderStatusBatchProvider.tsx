"use client";

import {
  useCallback,
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
  stageStatus: (
    orderId: string,
    status: OrderStatus,
    savedStatus: OrderStatus
  ) => void;
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
  labels,
  children,
}: {
  labels: {
    changedOne: string;
    changedMany: string;
    save: string;
    saving: string;
    error: string;
  };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [draftChanges, setDraftChanges] = useState<StatusMap>({});
  const [feedback, setFeedback] = useState<"error" | null>(null);
  const [isPending, startTransition] = useTransition();
  const changes = useMemo(
    () => Object.entries(draftChanges).map(([id, status]) => ({ id, status })),
    [draftChanges]
  );
  const stageStatus = useCallback(
    (orderId: string, status: OrderStatus, savedStatus: OrderStatus) => {
      setDraftChanges((current) => {
        const next = { ...current };
        if (status === savedStatus) {
          delete next[orderId];
        } else {
          next[orderId] = status;
        }
        return next;
      });
      setFeedback(null);
    },
    []
  );
  const context = useMemo<OrderStatusBatchContextValue>(
    () => ({ stageStatus }),
    [stageStatus]
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
      setDraftChanges({});
      setFeedback(null);
      window.dispatchEvent(new Event("grainbuds:orders-changed"));
      router.refresh();
    });
  }

  return (
    <OrderStatusBatchContext.Provider value={context}>
      {changes.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream-light/95 p-3 pl-5 shadow-[0_18px_55px_-22px_rgba(18,26,37,0.65)] backdrop-blur-md md:left-[16rem]">
          <div className="text-left">
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
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isPending ? labels.saving : labels.save}
          </button>
        </div>
      )}
      {children}
    </OrderStatusBatchContext.Provider>
  );
}
