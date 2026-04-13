"use client";

import { createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/navigation";

const AppointmentContext = createContext<{
  openAppointment: () => void;
}>({ openAppointment: () => {} });

export function useAppointment() {
  return useContext(AppointmentContext);
}

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <AppointmentContext.Provider value={{ openAppointment: () => router.push("/appointment") }}>
      {children}
    </AppointmentContext.Provider>
  );
}
