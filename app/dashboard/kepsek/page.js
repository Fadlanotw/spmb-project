"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, Download, FileCheck2, GraduationCap, Users } from "lucide-react";
import KepsekShell from "./KepsekShell";
import styles from "./kepsek-pages.module.css";

const COLORS = ["#d4af37", "#0b1e33", "#94a3b8"];
const number = (value) => Number(value || 0).toLocaleString("id-ID");

export default function DashboardKepsekPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/kepsek/statistik")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat statistik.");
        if (!cancelled) setData(result);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      });
    return () => { cancelled = true; };
  }, []);

  const stats = data?.ringkasan;
  const maxTrend = Math.max(1, ...(data?.tren || []).map((item) => item.jumlah));
  const percent = (part, total) => total ? Math.round((part / total) * 100) : 0;

  return (
    <KepsekShell title="Statistik & Laporan">
      <div className={styles.page}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Pusat Analisis &amp; Pelaporan SPMB</h1>
            <p className={styles.subtitle}>Statistik pendaftaran, hasil ujian, dan kelengkapan berkas berdasarkan data terbaru.</p>
          </div>
          <div className={styles.actions}>
            <span className={styles.button}>Tahun Ajaran 2026/2027</span>
            <a className={styles.exportButton} href="/api/kepsek/laporan"><Download size={14} /> Unduh Laporan</a>
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {!data ? <div className={styles.loading}>Memuat statistik pendaftaran...</div> : (
          <>
            <div className={styles.kpis}>
              <article className={styles.kpi}><span className={styles.kpiIcon}><Users size={18} /></span><div><small>TOTAL PENDAFTAR</small><strong>{number(stats.totalPendaftar)}</strong><span>{number(stats.biodataLengkap)} biodata diisi</span></div></article>
              <article className={styles.kpi}><span className={`${styles.kpiIcon} ${styles.green}`}><FileCheck2 size={18} /></span><div><small>BERKAS LENGKAP</small><strong>{number(stats.berkasLengkap)}</strong><span>{percent(stats.berkasLengkap, stats.totalPendaftar)}% dari pendaftar</span></div></article>
              <article className={styles.kpi}><span className={`${styles.kpiIcon} ${styles.gold}`}><GraduationCap size={18} /></span><div><small>SUDAH TES</small><strong>{number(stats.sudahMengerjakan)}</strong><span>{stats.tesAktif ? "Tes sedang aktif" : "Tes belum diaktifkan"}</span></div></article>
              <article className={styles.kpi}><span className={`${styles.kpiIcon} ${styles.red}`}><Activity size={18} /></span><div><small>RATA-RATA NILAI TES</small><strong>{stats.rataRataNilai === null ? "—" : Number(stats.rataRataNilai).toFixed(2)}</strong><span>{number(stats.diAtasStandar)} nilai ≥ 70</span></div></article>
            </div>

            <div className={styles.grid}>
              <section className={styles.card}>
                <div className={styles.cardHead}><div><h2>Persentase Pendaftar per Jurusan</h2><p>{number(stats.totalPendaftar)} calon siswa terdaftar</p></div></div>
                {data.jurusan.length ? (
                  <div className={styles.majorList}>
                    {data.jurusan.map((major, index) => {
                      const share = percent(major.jumlah, stats.totalPendaftar);
                      return <div className={styles.majorRow} key={major.kode}>
                        <div className={styles.majorLabels}><span>{major.nama}</span><strong>{number(major.jumlah)} siswa ({share}%)</strong></div>
                        <div className={styles.track}><div className={styles.fill} style={{ width: `${share}%`, background: COLORS[index] }} /></div>
                      </div>;
                    })}
                  </div>
                ) : <p className={styles.empty}>Belum ada data pendaftar.</p>}
              </section>

              <section className={styles.card}>
                <div className={styles.cardHead}><div><h2>Tren Registrasi</h2><p>Jumlah pendaftar per minggu · 8 minggu terakhir</p></div><span className={styles.muted}>{stats.pertumbuhanMingguan === null ? "Belum ada pembanding" : `${stats.pertumbuhanMingguan > 0 ? "+" : ""}${stats.pertumbuhanMingguan}% pekan ini`}</span></div>
                <div className={styles.chart} role="img" aria-label="Grafik jumlah pendaftar per minggu">
                  {data.tren.map((week) => <div className={styles.barCol} key={week.pekan}>
                    <span className={styles.barCount}>{week.jumlah}</span>
                    <div className={styles.bar} style={{ height: `${Math.max(2, (week.jumlah / maxTrend) * 125)}px` }} />
                    <span className={styles.barLabel}>{week.pekan}</span>
                  </div>)}
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHead}><div><h2>Rata-Rata Nilai Ujian per Jurusan</h2><p>Skor standar kelulusan: 70</p></div></div>
                <div className={styles.scoreList}>
                  {data.jurusan.map((major, index) => <div className={styles.scoreRow} key={major.kode}>
                    <div className={styles.scoreHead}><span>{major.nama} ({number(major.pesertaTes)} peserta)</span><strong>{major.rataRataNilai === null ? "Belum ada nilai" : Number(major.rataRataNilai).toFixed(2)}</strong></div>
                    <div className={styles.track}><div className={styles.fill} style={{ width: `${Math.min(100, major.rataRataNilai || 0)}%`, background: COLORS[index] }} /></div>
                  </div>)}
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHead}><div><h2>Status Kelengkapan Dokumen</h2><p>Setiap pendaftar wajib mengunggah enam dokumen</p></div></div>
                <div className={styles.statusRows}>
                  <div className={styles.statusRow}><span>Dokumen lengkap</span><div className={styles.statusTrack}><span style={{ width: `${percent(stats.berkasLengkap, stats.totalPendaftar)}%` }} /></div><strong>{number(stats.berkasLengkap)}</strong></div>
                  <div className={styles.statusRow}><span>Belum lengkap</span><div className={styles.statusTrack}><span style={{ width: `${percent(stats.berkasBelumLengkap, stats.totalPendaftar)}%`, background: "#ef4444" }} /></div><strong>{number(stats.berkasBelumLengkap)}</strong></div>
                  <div className={styles.statusRow}><span>Sudah mengerjakan tes</span><div className={styles.statusTrack}><span style={{ width: `${percent(stats.sudahMengerjakan, stats.totalPendaftar)}%`, background: "#3b82f6" }} /></div><strong>{number(stats.sudahMengerjakan)}</strong></div>
                </div>
              </section>
            </div>
            <div className={styles.actions}>
              <Link className={styles.button} href="/dashboard/kepsek/data-pendaftar">Lihat Data Pendaftar</Link>
              <Link className={styles.button} href="/dashboard/kepsek/hasil-tes">Lihat Hasil Tes</Link>
              <Link className={styles.button} href="/dashboard/kepsek/monitoring">Buka Monitoring</Link>
            </div>
          </>
        )}
      </div>
    </KepsekShell>
  );
}
