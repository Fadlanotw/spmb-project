import {
  Banknote,
  CalendarDays,
  CircleX,
  Clock,
  Download,
  FileCheck,
  LayoutGrid,
  MegaphoneOff,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import DashboardShell from "../_components/DashboardShell";
import styles from "./admin.module.css";

// Dari Figma: admin-spmb (3:184)
// PENTING: jika page.js lama kamu punya pengecekan sesi/role (redirect ke /login),
// pindahkan ke sini, lalu isi `user` dan data di bawah dari database.

const nav = [
  { label: "Dashboard", href: "/dashboard/admin", icon: "LayoutGrid", active: true },
  { label: "Data Pendaftar", href: "/dashboard/admin/data-pendaftar", icon: "Users" },
  { label: "Verifikasi Berkas", href: "/dashboard/admin/verifikasi-berkas", icon: "FileCheck" },
  { label: "Jadwal Tes", href: "/dashboard/admin/jadwal-tes", icon: "CalendarDays" },
  { label: "Soal Ujian", href: "/dashboard/admin/soal-ujian", icon: "FileCheck" },
  { label: "Pengumuman", href: "/dashboard/admin/pengumuman", icon: "MegaphoneOff" },
  { label: "Tagihan Pembayaran", href: "/dashboard/admin/tagihan", icon: "Banknote" },
  { label: "Pengaturan", href: "/dashboard/admin/pengaturan", icon: "Settings" },
];

const kpis = [
  { label: "Total Pendaftar", value: "1,248", note: "+12% dari minggu lalu", icon: Users, tone: "navy" },
  { label: "Terverifikasi", value: "876", note: "70.1% dari total berkas", icon: ShieldCheck, tone: "green" },
  { label: "Menunggu Review", value: "312", note: "Butuh tindakan segera", icon: Clock, tone: "amber" },
  { label: "Ditolak", value: "60", note: "Tidak memenuhi kualifikasi", icon: CircleX, tone: "red" },
];

const recent = [
  { no: 1, nama: "Arissa Zulaikha", jurusan: "PPLG (RPL)", tanggal: "12 Feb 2026", status: "Terverifikasi" },
  { no: 2, nama: "Baskara Putra", jurusan: "PPLG (RPL)", tanggal: "12 Feb 2026", status: "Terverifikasi" },
  { no: 3, nama: "Raka Oktadiansyah", jurusan: "MPLB (LAYANAN BISNIS)", tanggal: "11 Feb 2026", status: "Menunggu" },
  { no: 4, nama: "Ahmad Miftahul Khair", jurusan: "Pemasaran (BDR)", tanggal: "11 Feb 2026", status: "Terverifikasi" },
  { no: 5, nama: "Arbia Corrona Aldo", jurusan: "MPLB (LAYANAN BISNIS)", tanggal: "10 Feb 2026", status: "Ditolak" },
];

const statusClass = {
  Terverifikasi: styles.stGreen,
  Menunggu: styles.stAmber,
  Ditolak: styles.stRed,
};

const majors = [
  { name: "PPLG (RPL)", count: 648, pct: 52, color: "#f5f10e" },
  { name: "MPLB (LAYANAN BISNIS)", count: 412, pct: 33, color: "#fb2388" },
  { name: "PEMASARAN (BDR)", count: 188, pct: 15, color: "#ebc074" },
];

export default function DashboardAdminPage() {
  return (
    <DashboardShell
      brandSub="SPMB ADMIN"
      nav={nav}
      sidebarUser={{
        name: "MR. SABANI",
        role: "Kepala Admin SPMB",
        avatar: "/avatars/avatar-cewe.jpg",
      }}
      breadcrumb={{ root: "SPMB Portal", current: "Dashboard Overview" }}
      topUser={{
        name: "MUHAMMAD FADLAN SABANI",
        role: "Super Administrator",
        avatar: "/avatars/avatar-cowo.jpg",
      }}
    >
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>Dashboard Utama</h1>
          <p className={styles.subtitle}>
            Penerimaan Murid Baru Tahun Akademik 2026/2027
          </p>
        </div>
        <button type="button" className={styles.ghostBtn}>
          <Download size={16} strokeWidth={1.75} />
          Unduh Laporan
        </button>
      </div>

      <div className={styles.kpiGrid}>
        {kpis.map(({ label, value, note, icon: Icon, tone }) => (
          <div key={label} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <span className={styles.kpiLabel}>{label}</span>
              <span className={`${styles.kpiIcon} ${styles[tone]}`}>
                <Icon size={18} strokeWidth={1.75} />
              </span>
            </div>
            <div className={styles.kpiBody}>
              <span className={styles.kpiValue}>{value}</span>
              <span className={styles.kpiNote}>{note}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.split}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Pendaftar Terbaru</h2>
            <a href="/dashboard/admin/data-pendaftar" className={styles.link}>
              Lihat Semua
            </a>
          </div>

          <div className={styles.table}>
            <div className={`${styles.tr} ${styles.thead}`}>
              <span className={styles.cNo}>NO</span>
              <span className={styles.cName}>NAMA LENGKAP</span>
              <span className={styles.cMajor}>JURUSAN</span>
              <span className={styles.cDate}>TANGGAL</span>
              <span className={styles.cStatus}>STATUS</span>
            </div>
            {recent.map((r) => (
              <div key={r.no} className={`${styles.tr} ${styles.trow}`}>
                <span className={`${styles.cNo} ${styles.tNo}`}>{r.no}</span>
                <span className={`${styles.cName} ${styles.tName}`}>{r.nama}</span>
                <span className={`${styles.cMajor} ${styles.tMajor}`}>{r.jurusan}</span>
                <span className={`${styles.cDate} ${styles.tDate}`}>{r.tanggal}</span>
                <span className={styles.cStatus}>
                  <span className={`${styles.pill} ${statusClass[r.status]}`}>
                    {r.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className={`${styles.card} ${styles.majors}`}>
          <h2 className={styles.cardTitle}>Persentase Jurusan</h2>
          <div className={styles.majorList}>
            {majors.map((m) => (
              <div key={m.name} className={styles.major}>
                <div className={styles.majorHead}>
                  <span>{m.name}</span>
                  <strong>
                    {m.count} Siswa ({m.pct}%)
                  </strong>
                </div>
                <div className={styles.track}>
                  <div
                    className={styles.fill}
                    style={{ width: `${m.pct}%`, background: m.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <hr className={styles.hr} />
          <p className={styles.footnote}>
            * Jurusan PPLG masih memegang kuota pendaftar tertinggi untuk SPMB
            Tahun Akademik 2026/2027.
          </p>
        </aside>
      </div>
    </DashboardShell>
  );
}
