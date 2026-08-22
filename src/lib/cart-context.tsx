"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine, Product } from "./types";

export type OrderingContext =
  | { source: "qr_table"; tableNumber: number; campaign: string | null }
  | { source: "qr_online"; tableNumber: null; campaign: string | null };

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  orderingContext: OrderingContext | null;
  clearOrderingContext: () => void;
  totalCents: number;
  totalItems: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "grainbuds-cart-v1";
const ORDERING_CONTEXT_KEY = "grainbuds-ordering-context-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [orderingContext, setOrderingContext] =
    useState<OrderingContext | null>(null);

  useEffect(() => {
    // Hydrating the cart from localStorage must happen after mount so the
    // server and client render the same initial HTML.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));

      const params = new URLSearchParams(window.location.search);
      const orderMode = params.get("order");
      const campaignParam = params.get("campaign");
      const campaign = campaignParam?.match(/^[a-z0-9-]{1,60}$/)
        ? campaignParam
        : null;
      const tableNumber = Number.parseInt(params.get("table") ?? "", 10);
      if (
        orderMode === "table" &&
        Number.isInteger(tableNumber) &&
        tableNumber >= 1 &&
        tableNumber <= 999
      ) {
        const context: OrderingContext = {
          source: "qr_table",
          tableNumber,
          campaign,
        };
        sessionStorage.setItem(ORDERING_CONTEXT_KEY, JSON.stringify(context));
        setOrderingContext(context);
      } else if (orderMode === "online") {
        const context: OrderingContext = {
          source: "qr_online",
          tableNumber: null,
          campaign,
        };
        sessionStorage.setItem(ORDERING_CONTEXT_KEY, JSON.stringify(context));
        setOrderingContext(context);
      } else {
        const savedContext = sessionStorage.getItem(ORDERING_CONTEXT_KEY);
        if (savedContext) setOrderingContext(JSON.parse(savedContext));
      }
    } catch {
      // corrupted storage — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage unavailable — cart lives in memory only
    }
  }, [lines, hydrated]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + quantity }
            : line
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((line) => line.product.id !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.product.id !== productId)
        : prev.map((line) =>
            line.product.id === productId ? { ...line, quantity } : line
          )
    );
  }, []);

  const clearCart = useCallback(() => setLines([]), []);
  const clearOrderingContext = useCallback(() => {
    setOrderingContext(null);
    try {
      sessionStorage.removeItem(ORDERING_CONTEXT_KEY);
    } catch {
      // storage unavailable — context is still cleared in memory
    }
  }, []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalCents = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + line.product.price_cents * line.quantity,
        0
      ),
    [lines]
  );
  const totalItems = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      lines,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      orderingContext,
      clearOrderingContext,
      totalCents,
      totalItems,
    }),
    [
      lines,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      orderingContext,
      clearOrderingContext,
      totalCents,
      totalItems,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
