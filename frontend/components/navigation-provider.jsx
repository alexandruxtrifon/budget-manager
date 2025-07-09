"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { LoadingScreen } from "@/components/ui/spinner";

const NavigationContext = createContext({
  isPending: false,
  startNavigation: () => {},
});

export function NavigationProvider({ children }) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  
  // Function to trigger navigation with loading state
  const startNavigation = (callback) => {
    startTransition(() => {
      callback();
    });
  };

  return (
    <NavigationContext.Provider value={{ isPending, startNavigation }}>
      {isPending && <LoadingScreen message="" />}
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => useContext(NavigationContext);