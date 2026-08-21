"use client";

import { createContext, useContext } from "react";

/** True when the current visitor has a staff session — unlocks inline
 *  product controls on the public shop. */
const AdminModeContext = createContext(false);

export function AdminModeProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdminModeContext.Provider value={isAdmin}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode(): boolean {
  return useContext(AdminModeContext);
}
