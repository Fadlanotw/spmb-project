"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, Bell, Check, ClipboardList, FileCheck2, FileText, GraduationCap, LayoutDashboard, Megaphone, UserRound } from "lucide-react";
import LogoutButton from "../LogoutButton";
import styles from "./StudentShell.module.css";

const NAV = [
  { href: "/dashboard/calon-siswa", label: "Status Pendaftaran", icon: LayoutDashboard, step: 0 },
  { href: "/dashboard/calon-siswa/biodata", label: "Isi Biodata", icon: UserRound, step: 1 },
  { href: "/dashboard/calon-siswa/berkas", label: "Upload Berkas", icon: FileCheck2, step: 2 },
  { href: "/dashboard/calon-siswa/tagihan", label: "Tagihan Pembayaran", icon: Banknote, step: 3 },
  { href: "/dashboard/calon-siswa/tes", label: "Tes Seleksi", icon: ClipboardList, step: 4 },
  { href: "/dashboard/calon-siswa/hasil", label: "Hasil Tes", icon: GraduationCap, step: 5 },
  { href: "/dashboard/calon-siswa/pengumuman", label: "Pengumuman", icon: Megaphone, step: 6 },
];

const STEPS = ["Registrasi", "Isi Biodata", "Upload Berkas", "Pembayaran", "Ikut Tes", "Hasil Tes", "Pengumuman"];

export default function StudentShell({ children, title = "Status Pendaftaran", showProgress = true }) {
  const pathname = usePathname();
  const [nama, setNama] = useState("Calon Siswa");
  const [completedSteps, setCompletedSteps] = useState([true, false, false, false, false, false, false]);
  const activeStep = NAV.find((item) => item.href === pathname)?.step ?? 0;
  const initials = nama.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/siswa/profil")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat profil.");
        if (!cancelled) setNama(result.profile.nama);
      })
      .catch((error) => {
        if (!cancelled) console.error("Load student shell profile error:", error);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      try {
        const [profileResponse, documentsResponse, paymentResponse, resultResponse] = await Promise.all([
          fetch("/api/siswa/profil"),
          fetch("/api/siswa/berkas"),
          fetch("/api/siswa/tagihan"),
          fetch("/api/siswa/hasil"),
        ]);
        if (!profileResponse.ok || !documentsResponse.ok || !paymentResponse.ok || !resultResponse.ok) return;
        const [{ profile }, { berkas }, paymentData, { hasil }] = await Promise.all([
          profileResponse.json(),
          documentsResponse.json(),
          paymentResponse.json(),
          resultResponse.json(),
        ]);
        const biodataComplete = Boolean(profile.tempat_lahir && profile.tanggal_lahir && profile.jenis_kelamin && profile.alamat && profile.asal_sekolah && profile.nama_orang_tua && profile.whatsapp_orang_tua);
        const documentsComplete = ["pas_foto", "rapor", "akta", "kk", "surat_sehat", "ijazah"].every((type) => berkas.some((document) => document.jenis === type));
        if (!cancelled) {
          setCompletedSteps([
            true,
            biodataComplete,
            documentsComplete,
            paymentData.invoice?.status === "lunas",
            hasil.length > 0,
            hasil.length > 0,
            false,
          ]);
        }
      } catch (error) {
        if (!cancelled) console.error("Load student progress error:", error);
      }
    }
    loadProgress();
    return () => { cancelled = true; };
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/dashboard/calon-siswa" className={styles.brand}>
          <span className={styles.crest}>
            <Image src="/avatars/logo.png" alt="Logo Garuda Utama" width={40} height={40} priority />
          </span>
          <span><strong>GARUDA UTAMA</strong><small>SPMB STUDENT PORTAL</small></span>
        </Link>
        <nav className={styles.nav} aria-label="Menu calon siswa">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard/calon-siswa" && pathname.startsWith(`${href}/`));
            return (
              <Link key={href} href={href} className={`${styles.navItem} ${active ? styles.navActive : ""}`} aria-current={active ? "page" : undefined}>
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarUser}>
          <span className={styles.avatar} aria-label={nama}>{initials}</span>
          <span><strong>{nama}</strong><small>Calon Siswa Baru</small></span>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}><span>SPMB Student Portal</span><span>/</span><strong>{title}</strong></div>
          <div className={styles.topUser}>
            <button type="button" aria-label="Notifikasi"><Bell size={17} /></button>
            <span>{nama}</span>
            <span className={styles.topAvatar} aria-label={nama}>{initials}</span>
            <LogoutButton />
          </div>
        </header>
        <main className={styles.main}>
          {showProgress && (
            <ol className={styles.progress}>
              {STEPS.map((step, index) => {
                const completed = completedSteps[index];
                const current = index === activeStep;
                return (
                  <li key={step} className={`${styles.progressStep} ${completed ? styles.progressDone : ""} ${current ? styles.progressCurrent : ""}`}>
                    <span>{completed ? <Check size={13} /> : index + 1}</span>
                    <small>{step}</small>
                  </li>
                );
              })}
            </ol>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
