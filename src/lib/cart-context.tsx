"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  cartLineId,
  cartLineUnitPrice,
  type CartLine,
  type Product,
  type SelectedProductOption,
} from "./types";

export type OrderingContext =
  | { source: "qr_table"; tableNumber: number; campaign: string | null }
  | { source: "qr_online"; tableNumber: null; campaign: string | null };

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    product: Product,
    quantity?: number,
    options?: { openCart?: boolean; selectedOptions?: SelectedProductOption[] }
  ) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  decrementProduct: (productId: string) => void;
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
      if (raw) {
        const stored = JSON.parse(raw) as Array<Partial<CartLine> & Pick<CartLine, "product" | "quantity">>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLines(stored.map((line) => {
          const selectedOptions = Array.isArray(line.selected_options)
            ? line.selected_options
            : [];
          return {
            id: line.id ?? cartLineId(line.product.id, selectedOptions),
            product: line.product,
            quantity: line.quantity,
            selected_options: selectedOptions,
          };
        }));
      }

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

  const addItem = useCallback(
    (
      product: Product,
      quantity = 1,
      options?: { openCart?: boolean; selectedOptions?: SelectedProductOption[] }
    ) => {
      setLines((prev) => {
        const selectedOptions = options?.selectedOptions ?? [];
        const id = cartLineId(product.id, selectedOptions);
        const existing = prev.find((line) => line.id === id);
        const productQuantity = prev
          .filter((line) => line.product.id === product.id)
          .reduce((sum, line) => sum + line.quantity, 0);
        const available = product.stock == null
          ? quantity
          : Math.max(0, Math.min(quantity, product.stock - productQuantity));
        if (available <= 0) return prev;
        if (existing) {
          return prev.map((line) =>
            line.id === id
              ? {
                  ...line,
                  quantity: line.quantity + available,
                }
              : line
          );
        }
        return [...prev, {
          id,
          product,
          quantity: available,
          selected_options: selectedOptions,
        }];
      });
      if (options?.openCart !== false) setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((line) => line.id !== lineId));
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.id !== lineId)
        : prev.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  quantity:
                    line.product.stock == null
                      ? quantity
                      : Math.min(
                          quantity,
                          line.product.stock - prev
                            .filter((other) => other.product.id === line.product.id && other.id !== line.id)
                            .reduce((sum, other) => sum + other.quantity, 0)
                        ),
                }
              : line
          )
    );
  }, []);

  const decrementProduct = useCallback((productId: string) => {
    setLines((current) => {
      const target = [...current].reverse().find((line) => line.product.id === productId);
      if (!target) return current;
      return target.quantity <= 1
        ? current.filter((line) => line.id !== target.id)
        : current.map((line) => line.id === target.id
            ? { ...line, quantity: line.quantity - 1 }
            : line);
    });
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
        (sum, line) => sum + cartLineUnitPrice(line) * line.quantity,
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
      decrementProduct,
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
      decrementProduct,
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
