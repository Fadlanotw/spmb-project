"use client";

import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import KepsekShell from "../KepsekShell";
import styles from "../kepsek-pages.module.css";
import { getNameInitials } from "@/lib/kepsekApplicantDisplay";

const fmtDate = (value) => value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function HasilTesKepsekPage() {
  const [query, setQuery] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ q: query, jurusan, page: String(page) });
    fetch(`/api/kepsek/hasil-tes?${params}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat hasil tes.");
        if (!cancelled) { setData(result); setError(""); }
      })
      .catch((loadError) => { if (!cancelled) setError(loadError.message); });
    return () => { cancelled = true; };
  }, [query, jurusan, page]);

  return (
    <KepsekShell title="Hasil Tes">
      <div className={styles.page}>
        <div className={styles.titleRow}><div><h1 className={styles.title}>Hasil Tes Calon Siswa</h1><p className={styles.subtitle}>Pantau nilai ujian dan status kelulusan calon siswa berdasarkan skor standar 70.</p></div><a className={styles.exportButton} href="/api/kepsek/laporan"><Download size={14} /> Ekspor CSV</a></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.filters}>
          <label className={styles.search}><Search size={15} /><input aria-label="Cari nama atau NISN" placeholder="Cari nama atau NISN..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
          <select className={styles.select} aria-label="Filter jurusan" value={jurusan} onChange={(event) => { setJurusan(event.target.value); setPage(1); }}>
            <option value="">Semua Jurusan</option><option value="PPLG">PPLG (RPL)</option><option value="MPLB">MPLB (Layanan Bisnis)</option><option value="PM">Pemasaran (BDR)</option>
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>NO</th><th>NAMA LENGKAP</th><th>NISN</th><th>JURUSAN</th><th>JAWABAN BENAR</th><th>NILAI</th><th>STATUS</th><th>WAKTU SELESAI</th></tr></thead>
            <tbody>{data?.hasil.map((row, index) => (
              <tr key={row.id}><td>{(page - 1) * data.pageSize + index + 1}</td><td><span className={styles.applicantName}><span className={styles.applicantAvatar} aria-hidden="true">{getNameInitials(row.nama)}</span><strong>{row.nama}</strong></span></td><td>{row.nisn || "—"}</td><td>{row.jurusan || "—"}</td><td>{row.benar} / {row.jumlahSoal}</td><td><strong>{Number(row.nilai).toFixed(2)}</strong></td><td><span className={`${styles.badge} ${row.nilai >= 70 ? styles.badgeGreen : styles.badgeRed}`}>{row.nilai >= 70 ? "Lulus" : "Belum Lulus"}</span></td><td>{fmtDate(row.dikumpulkanPada)}</td></tr>
            ))}</tbody>
          </table>
          {!data && !error && <div className={styles.loading}>Memuat hasil ujian...</div>}
          {data?.hasil.length === 0 && <div className={styles.empty}>Belum ada hasil tes yang cocok.</div>}
          {data && <div className={styles.tableFoot}><span>{data.total.toLocaleString("id-ID")} hasil ujian</span><div className={styles.pager}><button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><span className={`${styles.pageBtn} ${styles.pageActive}`}>{page} / {data.pages}</span><button className={styles.pageBtn} disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Selanjutnya</button></div></div>}
        </div>
      </div>
    </KepsekShell>
  );
}
