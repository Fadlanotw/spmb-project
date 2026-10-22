"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Clock3, GraduationCap, RefreshCw, Users } from "lucide-react";
import KepsekShell from "../KepsekShell";
import styles from "../kepsek-pages.module.css";
import { getNameInitials } from "@/lib/kepsekApplicantDisplay";

const fmtDate = (value) => value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function MonitoringKepsekPage() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/kepsek/monitoring", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal memuat monitoring.");
      setData(result);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const rows = (data?.monitoring || []).filter((row) =>
    !filter || (filter === "belum-biodata" ? !row.biodataSelesai
      : filter === "belum-berkas" ? row.jumlahBerkas < 6
        : filter === "belum-tes" ? !row.sudahTes
          : filter === "selesai" ? row.sudahTes && row.jumlahBerkas === 6
            : true)
  );
  const total = data?.ringkasan.total || 0;
  const biodataCount = data?.ringkasan.biodataLengkap || 0;
  const documentCount = data?.ringkasan.berkasLengkap || 0;
  const testCount = data?.ringkasan.sudahTes || 0;

  return (
    <KepsekShell title="Monitoring">
      <div className={styles.page}>
        <div className={styles.titleRow}><div><h1 className={styles.title}>Monitoring Proses Seleksi</h1><p className={styles.subtitle}>Pantau kelengkapan biodata, dokumen, dan keikutsertaan tes seluruh calon siswa.</p></div><button className={styles.button} type="button" onClick={load} disabled={refreshing}><RefreshCw size={14} /> {refreshing ? "Memperbarui..." : "Perbarui Data"}</button></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {data && <>
          <div className={styles.titleRow}><span className={data.tesAktif ? styles.live : styles.badgeAmber}>{data.tesAktif ? "Tes sedang aktif" : "Tes belum diaktifkan"}</span><span className={styles.muted}>Menampilkan aktivitas dari seluruh pendaftar · tabel menampilkan 50 terbaru</span></div>
          <div className={styles.funnel}>
            <article className={styles.funnelItem}><span><Users size={14} /> Terdaftar</span><strong>{total.toLocaleString("id-ID")}</strong><small>Calon siswa baru</small></article>
            <article className={styles.funnelItem}><span><CheckCircle2 size={14} /> Biodata</span><strong>{biodataCount.toLocaleString("id-ID")}</strong><small>{total ? Math.round(biodataCount / total * 100) : 0}% lengkap</small></article>
            <article className={styles.funnelItem}><span><Activity size={14} /> Dokumen</span><strong>{documentCount.toLocaleString("id-ID")}</strong><small>{total ? Math.round(documentCount / total * 100) : 0}% lengkap</small></article>
            <article className={styles.funnelItem}><span><GraduationCap size={14} /> Selesai tes</span><strong>{testCount.toLocaleString("id-ID")}</strong><small>{total ? Math.round(testCount / total * 100) : 0}% sudah tes</small></article>
          </div>
          <div className={styles.filters}>
            <label htmlFor="monitoring-filter" className={styles.muted}>Tampilkan:</label>
            <select id="monitoring-filter" className={styles.select} value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="">Semua Pendaftar</option><option value="belum-biodata">Biodata Belum Lengkap</option><option value="belum-berkas">Berkas Belum Lengkap</option><option value="belum-tes">Belum Mengikuti Tes</option><option value="selesai">Semua Tahap Selesai</option>
            </select>
          </div>
          <section className={styles.card}>
            <div className={styles.cardHead}><div><h2>Aktivitas Pendaftar Terbaru</h2><p>{rows.length} calon siswa pada filter terpilih</p></div><Clock3 size={16} color="#64748b" /></div>
            <div className={styles.activity}>
              {rows.map((row) => <div className={styles.activityRow} key={row.id}>
                <div className={styles.activityIdentity}><span className={styles.applicantAvatar} aria-hidden="true">{getNameInitials(row.nama)}</span><span><strong>{row.nama}</strong><small className={styles.activityNisn}>{row.nisn || "NISN belum tersedia"}</small></span></div>
                <span>{row.jurusan || "Jurusan belum dipilih"}</span>
                <span><Clock3 size={12} /> {fmtDate(row.terakhirAktivitas)}</span>
                <span className={`${styles.badge} ${row.sudahTes ? styles.badgeGreen : styles.badgeAmber}`}>{row.sudahTes ? `Tes selesai · ${Number(row.nilai).toFixed(2)}` : `${row.jumlahBerkas}/6 berkas`}</span>
              </div>)}
              {!rows.length && <div className={styles.empty}>Tidak ada aktivitas untuk status ini.</div>}
            </div>
          </section>
        </>}
        {!data && !error && <div className={styles.loading}>Memuat monitoring pendaftaran...</div>}
      </div>
    </KepsekShell>
  );
}
