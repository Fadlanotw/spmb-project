"use client";

import { useEffect, useState } from "react";
import { Download, Search, Users } from "lucide-react";
import KepsekShell from "../KepsekShell";
import styles from "../kepsek-pages.module.css";
import { getNameInitials } from "@/lib/kepsekApplicantDisplay";

const fmtDate = (value) => value ? new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function DataPendaftarKepsekPage() {
  const [query, setQuery] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [berkas, setBerkas] = useState("");
  const [tes, setTes] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ q: query, jurusan, berkas, tes, page: String(page) });
    fetch(`/api/kepsek/pendaftar?${params}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat pendaftar.");
        if (!cancelled) { setData(result); setError(""); }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      });
    return () => { cancelled = true; };
  }, [query, jurusan, berkas, tes, page]);

  const onFilter = (setter) => (event) => { setter(event.target.value); setPage(1); };

  return (
    <KepsekShell title="Data Pendaftar">
      <div className={styles.page}>
        <div className={styles.titleRow}>
          <div><h1 className={styles.title}>Data Pendaftar Murid Baru</h1><p className={styles.subtitle}>Daftar calon siswa dan progres seleksi berdasarkan data terdaftar di SPMB.</p></div>
          <a className={styles.exportButton} href="/api/kepsek/laporan"><Download size={14} /> Ekspor CSV</a>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.filters}>
          <label className={styles.search}><Search size={15} /><input aria-label="Cari nama, NISN, atau email" placeholder="Cari nama, NISN, atau email..." value={query} onChange={onFilter(setQuery)} /></label>
          <select className={styles.select} aria-label="Filter jurusan" value={jurusan} onChange={onFilter(setJurusan)}>
            <option value="">Semua Jurusan</option><option value="PPLG">PPLG (RPL)</option><option value="MPLB">MPLB (Layanan Bisnis)</option><option value="PM">Pemasaran (BDR)</option>
          </select>
          <select className={styles.select} aria-label="Filter berkas" value={berkas} onChange={onFilter(setBerkas)}>
            <option value="">Semua Status Berkas</option><option value="lengkap">Berkas Lengkap</option><option value="belum">Belum Lengkap</option>
          </select>
          <select className={styles.select} aria-label="Filter tes" value={tes} onChange={onFilter(setTes)}>
            <option value="">Semua Status Tes</option><option value="sudah">Sudah Tes</option><option value="belum">Belum Tes</option>
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>NO</th><th>NAMA LENGKAP</th><th>NISN</th><th>JURUSAN PILIHAN</th><th>TGL DAFTAR</th><th>STATUS BERKAS</th><th>STATUS TES</th><th>AKSI</th></tr></thead>
            <tbody>
              {data?.pendaftar.map((student, index) => (
                <tr key={student.id}>
                  <td>{(page - 1) * data.pageSize + index + 1}</td>
                <td><span className={styles.applicantName}><span className={styles.applicantAvatar} aria-hidden="true">{getNameInitials(student.nama)}</span><strong>{student.nama}</strong></span></td><td>{student.nisn || "—"}</td><td>{student.jurusan || "—"}</td><td>{fmtDate(student.tanggalDaftar)}</td>
                  <td><span className={`${styles.badge} ${student.berkasLengkap ? styles.badgeGreen : styles.badgeAmber}`}>{student.jumlahBerkas}/6 berkas</span></td>
                  <td><span className={`${styles.badge} ${student.nilai === null ? styles.badgeAmber : student.nilai >= 70 ? styles.badgeGreen : styles.badgeRed}`}>{student.nilai === null ? "Belum Tes" : student.nilai >= 70 ? "Lulus" : "Belum Lulus"}</span></td>
                  <td><button type="button" className={styles.pageBtn} onClick={() => setSelected(student)}>Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data && !error && <div className={styles.loading}>Memuat data pendaftar...</div>}
          {data?.pendaftar.length === 0 && <div className={styles.empty}><Users size={19} /><p>Tidak ada pendaftar yang cocok dengan filter.</p></div>}
          {data && <div className={styles.tableFoot}><span>Menampilkan {data.total ? (page - 1) * data.pageSize + 1 : 0}–{Math.min(page * data.pageSize, data.total)} dari {data.total.toLocaleString("id-ID")} pendaftar</span><div className={styles.pager}><button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><span className={`${styles.pageBtn} ${styles.pageActive}`}>{page} / {data.pages}</span><button className={styles.pageBtn} disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Selanjutnya</button></div></div>}
        </div>
        {selected && <div className={styles.detail} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className={styles.detailCard} role="dialog" aria-modal="true" aria-labelledby="applicant-detail-title">
            <div className={styles.detailHead}><div className={styles.detailIdentity}><span className={styles.applicantAvatar} aria-hidden="true">{getNameInitials(selected.nama)}</span><div><h2 id="applicant-detail-title">{selected.nama}</h2><p className={styles.subtitle}>Detail calon siswa</p></div></div><button className={styles.close} type="button" aria-label="Tutup" onClick={() => setSelected(null)}>×</button></div>
            <dl className={styles.detailList}>
              <div><dt>NISN</dt><dd>{selected.nisn || "—"}</dd></div><div><dt>Jurusan pilihan</dt><dd>{selected.jurusan || "—"}</dd></div>
              <div><dt>Email</dt><dd>{selected.email || "—"}</dd></div><div><dt>WhatsApp</dt><dd>{selected.whatsapp || "—"}</dd></div>
              <div><dt>Sekolah asal</dt><dd>{selected.asalSekolah || "Belum dilengkapi"}</dd></div><div><dt>Orang tua / wali</dt><dd>{selected.orangTua || "Belum dilengkapi"}</dd></div>
              <div><dt>Tanggal daftar</dt><dd>{fmtDate(selected.tanggalDaftar)}</dd></div><div><dt>Kelengkapan berkas</dt><dd>{selected.jumlahBerkas} dari 6</dd></div>
              <div><dt>Nilai tes</dt><dd>{selected.nilai === null ? "Belum tes" : Number(selected.nilai).toFixed(2)}</dd></div><div><dt>Tanggal tes</dt><dd>{fmtDate(selected.terakhirTes)}</dd></div>
            </dl>
          </section>
        </div>}
      </div>
    </KepsekShell>
  );
}
