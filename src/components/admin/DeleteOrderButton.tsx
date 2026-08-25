"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { deleteOrder } from "@/lib/actions/admin";

export default function DeleteOrderButton({
  orderId,
  labels,
}: {
  orderId: string;
  labels: {
    delete: string;
    deleting: string;
    confirmTitle: string;
    confirm: string;
    cancel: string;
    confirmDelete: string;
    error: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isConfirming) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) setIsConfirming(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    cancelButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isConfirming, isPending]);

  function handleDelete() {
    setError(false);
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (!result.ok) {
        setError(true);
        return;
      }
      setIsConfirming(false);
      window.dispatchEvent(new Event("grainbuds:orders-changed"));
      router.refresh();
    });
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setError(false);
          setIsConfirming(true);
        }}
        disabled={isPending}
        aria-label={isPending ? labels.deleting : labels.delete}
        title={isPending ? labels.deleting : labels.delete}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-50"
      >
        {isPending ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-600" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M5 7h14M9 7V4.5h6V7m-8 0 .8 13h8.4L17 7M10 10.5v6M14 10.5v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {isConfirming && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5" role="presentation">
          <button
            type="button"
            aria-label={labels.cancel}
            className="absolute inset-0 bg-ink/35 backdrop-blur-[3px]"
            onClick={() => !isPending && setIsConfirming(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-order-title-${orderId}`}
            aria-describedby={`delete-order-description-${orderId}`}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-cream-light p-7 shadow-[0_28px_90px_-30px_rgba(18,26,37,0.65)] sm:p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand/20 text-sand-deep">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M5 7h14M9 7V4.5h6V7m-8 0 .8 13h8.4L17 7M10 10.5v6M14 10.5v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 id={`delete-order-title-${orderId}`} className="mt-5 font-display text-2xl text-ink">
              {labels.confirmTitle}
            </h2>
            <p id={`delete-order-description-${orderId}`} className="mt-2 text-sm leading-6 text-ink/60">
              {labels.confirm}
            </p>
            {error && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {labels.error}
              </p>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={isPending}
                className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white/50 disabled:opacity-50"
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isPending ? labels.deleting : labels.confirmDelete}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
