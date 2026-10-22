"use client";

import { usePathname } from "next/navigation";
import DashboardShell from "../_components/DashboardShell";

const ITEMS = [
  { label: "Data Pendaftar", href: "/dashboard/kepsek/data-pendaftar", icon: "Users" },
  { label: "Pembayaran", href: "/dashboard/admin/pembayaran", icon: 'Banknote' },
  { label: "Hasil Tes", href: "/dashboard/kepsek/hasil-tes", icon: "FileCheck" },
  { label: "Statistik & Laporan", href: "/dashboard/kepsek", icon: "ChartNoAxesColumn" },
  { label: "Monitoring", href: "/dashboard/kepsek/monitoring", icon: "Clock" },
];

export default function KepsekShell({ children, title }) {
  const pathname = usePathname();
  const nav = ITEMS.map((item) => ({
    ...item,
    active: item.href === "/dashboard/kepsek"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));

  return (
    <DashboardShell
      brandSub="SPMB KEPALA SEKOLAH"
      nav={nav}
      sidebarUser={{ name: "Drs. H. Farish Arfa, M.Pd", role: "Kepala Sekolah", initials: "FA" }}
      breadcrumb={{ root: "Kepsek Portal", current: title }}
      topUser={{ name: "Drs H. Farish Arfa, M.Pd", role: "NIP. 19720814 199803 1 002", initials: "FA" }}
    >
      {children}
    </DashboardShell>
  );
}
