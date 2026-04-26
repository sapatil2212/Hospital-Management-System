"use client";

import DeptDashboardPage from "@/components/DeptDashboardPage";
import { Activity } from "lucide-react";

const cfg = {
  accent:       "#d97706",
  accent2:      "#b45309",
  accentLight:  "#fffbeb",
  accentBorder: "#fde68a",
  label:        "Diagnostic",
  basePath:     "/diagnostic/dashboard",
  icon:         <Activity size={26} color="#fff" />,
};

export default function DiagnosticDashboardPage() {
  return <DeptDashboardPage cfg={cfg} />;
}
