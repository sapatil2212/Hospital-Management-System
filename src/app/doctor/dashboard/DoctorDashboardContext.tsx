"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface DoctorContextType {
  doctor: any;
  setDoctor: (d: any) => void;
  loading: boolean;
  logout: () => Promise<void>;
  accent: string;
  doctorName: string;
  deptName: string;
  initials: (name: string) => string;
  refreshDoctor: () => Promise<void>;
}

const DoctorDashboardContext = createContext<DoctorContextType | null>(null);

function getDeptAccent(deptName?: string): string {
  if (!deptName) return "#10b981";
  const n = deptName.toLowerCase();
  if (n.includes("cardio")) return "#ef4444";
  if (n.includes("neuro")) return "#8b5cf6";
  if (n.includes("ortho")) return "#f59e0b";
  if (n.includes("pedia") || n.includes("child")) return "#3b82f6";
  if (n.includes("gyne") || n.includes("obs")) return "#ec4899";
  if (n.includes("onco") || n.includes("cancer")) return "#6366f1";
  if (n.includes("derma") || n.includes("skin")) return "#14b8a6";
  if (n.includes("ophthal") || n.includes("eye")) return "#0ea5e9";
  if (n.includes("ent") || n.includes("ear")) return "#f97316";
  if (n.includes("surgery") || n.includes("surgical")) return "#dc2626";
  if (n.includes("radio") || n.includes("imaging")) return "#7c3aed";
  if (n.includes("emergency") || n.includes("icu")) return "#ef4444";
  return "#10b981";
}

export function DoctorDashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDoctor = async () => {
    try {
      const authRes = await fetch("/api/auth/me", { credentials: "include" });
      const authData = await authRes.json();
      if (!authData.success || authData.data.role !== "DOCTOR") {
        router.push("/login");
        return;
      }
      const docRes = await fetch("/api/doctors/me", { credentials: "include" });
      const docData = await docRes.json();
      if (docData.success) {
        setDoctor(docData.data);
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  const initials = (name: string) => name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const doctorName = doctor?.name || "Doctor";
  const deptName = doctor?.department?.name || "General";
  const accent = getDeptAccent(deptName);

  return (
    <DoctorDashboardContext.Provider value={{
      doctor,
      setDoctor,
      loading,
      logout,
      accent,
      doctorName,
      deptName,
      initials,
      refreshDoctor: fetchDoctor,
    }}>
      {children}
    </DoctorDashboardContext.Provider>
  );
}

export function useDoctorDashboard() {
  const context = useContext(DoctorDashboardContext);
  if (!context) {
    throw new Error("useDoctorDashboard must be used within DoctorDashboardProvider");
  }
  return context;
}
