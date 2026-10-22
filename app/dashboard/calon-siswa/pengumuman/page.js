import Link from "next/link";
import { CalendarDays, Info } from "lucide-react";
import StudentShell from "../StudentShell";
import styles from "../student-pages.module.css";

const ANNOUNCEMENTS = [
  {
    tag: "Informasi Pendaftaran",
    title: "Lengkapi Biodata dan Dokumen Persyaratan",
    text: "Pastikan biodata diisi dengan benar dan seluruh dokumen persyaratan diunggah dalam format JPG, PNG, atau PDF dengan ukuran maksimal 2 MB per file.",
    date: "Informasi SPMB 2026/2027",
  },
  {
    tag: "Informasi Tes",
    title: "Tes Potensi Akademik",
    text: "Tes seleksi hanya dapat dikerjakan setelah panitia mengaktifkannya. Waktu pengerjaan ujian adalah 60 menit. Pantau menu Tes Seleksi untuk mengetahui ketersediaan ujian.",
    date: "Pantau status aktivasi di portal",
  },
];

export default function PengumumanSiswaPage() {
  return (
    <StudentShell title="Pengumuman">
      <div className={styles.page}>
        <div className={styles.pageHeading}><div><p className={styles.eyebrow}>INFORMASI RESMI</p><h1>Pengumuman</h1><p>Informasi penting terkait proses penerimaan murid baru.</p></div></div>
        {ANNOUNCEMENTS.map((announcement) => (
          <article className={styles.announcement} key={announcement.title}>
            <small><Info size={13} /> {announcement.tag}</small>
            <h3>{announcement.title}</h3>
            <p>{announcement.text}</p>
            <p className={styles.announcementDate}><CalendarDays size={12} /> {announcement.date}</p>
          </article>
        ))}
        <section className={styles.panel}>
          <div className={styles.panelHeading}><div><h2>Menu Pendaftaran</h2><p>Lanjutkan ke tahap pendaftaran yang perlu diselesaikan.</p></div></div>
          <div className={styles.quickLinks}>
            <Link href="/dashboard/calon-siswa/biodata">Isi Biodata <span>→</span></Link>
            <Link href="/dashboard/calon-siswa/berkas">Upload Berkas <span>→</span></Link>
            <Link href="/dashboard/calon-siswa/tes">Tes Seleksi <span>→</span></Link>
          </div>
        </section>
      </div>
    </StudentShell>
  );
}
