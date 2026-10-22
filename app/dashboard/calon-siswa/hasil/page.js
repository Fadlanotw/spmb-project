"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CalendarClock, FileText } from "lucide-react";
import StudentShell from "../StudentShell";
import styles from "../student-pages.module.css";

export default function HasilTesSiswaPage() {
  const [hasil, setHasil] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/siswa/hasil")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat hasil tes.");
        if (!cancelled) setHasil(result.hasil);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <StudentShell title="Hasil Tes">
      <div className={styles.page}>
        <div className={styles.pageHeading}><div><p className={styles.eyebrow}>TAHAP 5 · HASIL SELEKSI</p><h1>Hasil Tes</h1><p>Nilai ujian seleksi Anda ditampilkan di halaman ini setelah jawaban dikumpulkan.</p></div></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {loading ? <div className={styles.formPanel}>Memuat hasil tes...</div> : hasil.length ? (
          <div className={styles.resultList}>
            {hasil.map((item, index) => (
              <article className={styles.resultCard} key={`${item.dikumpulkan_pada}-${index}`}>
                <div><strong><Award size={16} /> Tes Potensi Akademik</strong><small><CalendarClock size={13} /> {new Date(item.dikumpulkan_pada).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}</small><small><FileText size={13} /> {item.jawaban_benar} dari {item.jumlah_soal} soal benar</small></div>
                <span className={styles.resultScore}>{Number(item.nilai).toFixed(2)}</span>
              </article>
            ))}
          </div>
        ) : (
          <section className={styles.noticePanel}>
            <span className={styles.noticeIcon}><Award size={18} /></span>
            <h2>Hasil belum tersedia</h2>
            <p>Hasil tes akan muncul di sini setelah Anda menyelesaikan ujian. Pastikan tes sudah diaktifkan oleh panitia.</p>
            <Link href="/dashboard/calon-siswa/tes">Buka Tes Seleksi <span aria-hidden="true">→</span></Link>
          </section>
        )}
      </div>
    </StudentShell>
  );
}
