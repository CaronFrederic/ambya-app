import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  duration?: number;
  quantity?: number;
};

export type BookingDraft = {
  cart: CartItem[];
  salonId?: string;
  salonName?: string;

  // schedule
  date?: { day: string; date: number }; // simple pour coller à la maquette
  time?: string;
  professionalName?: string; // “Pas de préférence” possible

  selectedDateIso?: string; // YYYY-MM-DD
  selectedEmployeeId?: string;

  // payment
  depositEnabled?: boolean;
  depositPercentage?: number;
  paymentChoice?: "full" | "deposit";
  paymentMethod?: "card" | "mobile_money" | "cash";
  operator?: string;
};

type BookingContextValue = {
  draft: BookingDraft;
  setCart: (cart: CartItem[]) => void;
  patch: (partial: Partial<BookingDraft>) => void;
  reset: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>({
    cart: [],
    depositEnabled: true,
    depositPercentage: 30,
    paymentChoice: "full",
  });

  const setCart = useCallback((cart: CartItem[]) => {
    setDraft((d) => ({ ...d, cart }));
  }, []);

  const patch = useCallback((partial: Partial<BookingDraft>) => {
    setDraft((d) => ({ ...d, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setDraft({
      cart: [],
      depositEnabled: true,
      depositPercentage: 30,
      paymentChoice: "full",
    });
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({
      draft,
      setCart,
      patch,
      reset,
    }),
    [draft, patch, reset, setCart],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
