"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  Clock,
  FileCheck,
  LayoutGrid,
  LogOut,
  MegaphoneOff,
  Settings,
  Users,
} from "lucide-react";
import styles from "./DashboardShell.module.css";

const navIcons = {
  Banknote,
  CalendarDays,
  ChartNoAxesColumn,
  Clock,
  FileCheck,
  LayoutGrid,
  MegaphoneOff,
  Settings,
  Users,
};
/**
 * Layout dashboard (sidebar + top bar) dari Figma:
 *  - admin-spmb (3:184)
 *  - statistik-laporan-kepsek (73:1473)
 *
 * Props:
 *  brandSub        teks kecil emas di bawah "GARUDA UTAMA"
 *  nav             [{ label, href, icon, active }]
 *  sidebarUser     { name, role, avatar, initials }
 *  breadcrumb      { root, current }
 *  topUser         { name, role, avatar, initials }
 *  children        isi workspace
 */
export default function DashboardShell({
  brandSub,
  nav,
  sidebarUser,
  breadcrumb,
  topUser,
  children,
}) {
  const router = useRouter();

  async function handleLogout() {
    try {
      // SESUAIKAN dengan logika Logout yang sudah ada di project.
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img
            className={styles.crest}
            src="/avatars/dashboard-assets/shield.png"
            alt=""
            width={40}
            height={40}
          />
          <div className={styles.brandTexts}>
            <span className={styles.brandName}>GARUDA UTAMA</span>
            <span className={styles.brandSub}>{brandSub}</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {nav.map(({ label, href, icon, active }) => {
            const Icon = navIcons[icon];
            return (
              <Link
                key={label}
                href={href}
                className={`${styles.navItem} ${active ? styles.navActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span>{label}</span>
                {active && <i className={styles.navMarker} />}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userRow}>
            <span className={`${styles.avatar36} ${sidebarUser.initials ? styles.avatarInitials : ""}`}>
              {sidebarUser.initials || <img src={sidebarUser.avatar} alt="" />}
            </span>
            <div className={styles.userText}>
              <strong>{sidebarUser.name}</strong>
              <span>{sidebarUser.role}</span>
            </div>
            <button
              type="button"
              className={styles.logout}
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.breadcrumbs}>
            <span className={styles.crumbRoot}>{breadcrumb.root}</span>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbCurrent}>{breadcrumb.current}</span>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.bell} aria-label="Notifikasi">
              <Bell size={18} strokeWidth={1.75} />
            </button>
            <span className={styles.vline} />
            <div className={styles.meta}>
              <div className={styles.metaText}>
                <strong>{topUser.name}</strong>
                <span>{topUser.role}</span>
              </div>
              <span className={`${styles.avatar40} ${topUser.initials ? styles.avatarInitials : ""}`}>
                {topUser.initials || <img src={topUser.avatar} alt="" />}
              </span>
            </div>
          </div>
        </header>

        <div className={styles.workspace}>{children}</div>
      </div>
    </div>
  );
}
