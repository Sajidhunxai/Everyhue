"use client";

import { Suspense, type ReactNode } from "react";
import { NavigationProgress } from "@/components/navigation-progress";
import { PwaRegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <PwaRegister />
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
    </ToastProvider>
  );
}
