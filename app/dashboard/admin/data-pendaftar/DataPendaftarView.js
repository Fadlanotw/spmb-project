'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './data-pendaftar.module.css';

/* ---------- Ikon (inline, tanpa library) ---------- */
const svg = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const IconPlus = (p) => (<svg {...svg} {...p}><path d="M5 12h14M12 5v14" /></svg>);
const IconDownload = (p) => (<svg {...svg} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></svg>);
const IconSearch = (p) => (<svg {...svg} {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
const IconX = (p) => (<svg {...svg} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>);

/* ---------- Format tanggal & angka (tanpa Intl, aman untuk SSR) ---------- */
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const pad = (n) => String(n).padStart(2, '0');
const isoHariIni = () => { const n = new Date(); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`; };
const tglPendek = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${pad(d)} ${BULAN[m - 1]} ${y}`; };
const angka = (n) => Number(n).toLocaleString('en-US');

/* ---------- Modal sederhana ---------- */
function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Tutup"><IconX /></button>
        </div>
        {children}
        {footer ? <div className={styles.modalFoot}>{footer}</div> : null}
      </div>
    </div>
  );
}

const JURUSAN = ['PPLG (RPL)', 'MPLB (Layanan Bisnis)', 'Pemasaran (BDR)'];
const PAGE_SIZE = 8;

// 8 baris pertama sama dengan desain Figma, sisanya data contoh. Ganti dengan data dari API/database.
const SEED = [
  { nama: 'Arissa Zulaikha', nisn: '0082341234', jurusan: 'PPLG (RPL)', tgl: '2026-02-12', berkas: 'Lengkap', bayar: 'Lunas', gel: 1 },
  { nama: 'Baskara Putra', nisn: '0084561211', jurusan: 'PPLG (RPL)', tgl: '2026-02-12', berkas: 'Lengkap', bayar: 'Lunas', gel: 1 },
  { nama: 'Raka Oktadiansyah', nisn: '0091212456', jurusan: 'MPLB (Layanan Bisnis)', tgl: '2026-02-11', berkas: 'Belum Lengkap', bayar: 'Lunas', gel: 1 },
  { nama: 'Ahmad Miftahul Khair', nisn: '0086782299', jurusan: 'Pemasaran (BDR)', tgl: '2026-02-11', berkas: 'Lengkap', bayar: 'Lunas', gel: 1 },
  { nama: 'Arbia Corrona Aldo', nisn: '0075561112', jurusan: 'MPLB (Layanan Bisnis)', tgl: '2026-02-10', berkas: 'Belum Lengkap', bayar: 'Dibatalkan', gel: 1 },
  { nama: 'Muhammad Yanto', nisn: '0081238877', jurusan: 'PPLG (RPL)', tgl: '2026-02-10', berkas: 'Lengkap', bayar: 'Lunas', gel: 1 },
  { nama: 'Dimas Anggara', nisn: '0096512322', jurusan: 'Pemasaran (BDR)', tgl: '2026-02-09', berkas: 'Belum Lengkap', bayar: 'Menunggu', gel: 1 },
  { nama: 'Nur Safa Athyra', nisn: '0089901144', jurusan: 'MPLB (Layanan Bisnis)', tgl: '2026-02-08', berkas: 'Lengkap', bayar: 'Lunas', gel: 1 },
  { nama: 'Salsabila Putri', nisn: '0087712033', jurusan: 'PPLG (RPL)', tgl: '2026-02-07', berkas: 'Lengkap', bayar: 'Lunas', gel: 1 },
  { nama: 'Rizky Maulana', nisn: '0079934120', jurusan: 'Pemasaran (BDR)', tgl: '2026-02-07', berkas: 'Lengkap', bayar: 'Menunggu', gel: 1 },
  { nama: 'Putri Ayu Lestari', nisn: '0093321870', jurusan: 'MPLB (Layanan Bisnis)', tgl: '2026-02-06', berkas: 'Belum Lengkap', bayar: 'Menunggu', gel: 1 },
  { nama: 'Fikri Ramadhan', nisn: '0085540912', jurusan: 'PPLG (RPL)', tgl: '2026-02-05', berkas: 'Lengkap', bayar: 'Lunas', gel: 1 },
  { nama: 'Nabila Khairunnisa', nisn: '0094412205', jurusan: 'PPLG (RPL)', tgl: '2026-03-03', berkas: 'Lengkap', bayar: 'Menunggu', gel: 2 },
  { nama: 'Galih Pratama', nisn: '0088812330', jurusan: 'Pemasaran (BDR)', tgl: '2026-03-03', berkas: 'Belum Lengkap', bayar: 'Menunggu', gel: 2 },
  { nama: 'Zahra Amelia', nisn: '0092201457', jurusan: 'MPLB (Layanan Bisnis)', tgl: '2026-03-02', berkas: 'Lengkap', bayar: 'Lunas', gel: 2 },
  { nama: 'Andi Saputra', nisn: '0083376540', jurusan: 'PPLG (RPL)', tgl: '2026-03-01', berkas: 'Belum Lengkap', bayar: 'Menunggu', gel: 2 },
];

const berkasTone = (r) => (r.berkas === 'Lengkap' ? 'green' : r.bayar === 'Dibatalkan' ? 'red' : 'amber');
const bayarTone = (v) => ({ Lunas: 'green', Menunggu: 'amber', Dibatalkan: 'red' }[v] || 'gray');

function exportCsv(rows) {
  const head = ['No', 'Nama Lengkap', 'NISN', 'Jurusan Pilihan', 'Tgl Daftar', 'Status Berkas', 'Pembayaran'];
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const body = rows.map((r, i) => [i + 1, r.nama, `'${r.nisn}`, r.jurusan, tglPendek(r.tgl), r.berkas, r.bayar]);
  // "sep=;" memaksa Excel (termasuk pengaturan regional Indonesia) memisahkan kolom dengan benar.
  const text = 'sep=;\r\n' + [head, ...body].map((l) => l.map(esc).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data-pendaftar.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataPendaftarView() {
  const [rows, setRows] = useState(SEED);
  const [query, setQuery] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [berkas, setBerkas] = useState('');
  const [gel, setGel] = useState('1');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nama: '', nisn: '', jurusan: JURUSAN[0] });
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) =>
      (!q || r.nama.toLowerCase().includes(q) || r.nisn.includes(q)) &&
      (!jurusan || r.jurusan === jurusan) &&
      (!berkas || r.berkas === berkas) &&
      (!gel || r.gel === Number(gel))
    );
  }, [rows, query, jurusan, berkas, gel]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const onFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  function submitAdd(e) {
    e.preventDefault();
    if (!form.nama.trim()) return setError('Nama lengkap wajib diisi.');
    if (!/^\d{10}$/.test(form.nisn)) return setError('NISN harus 10 digit angka.');
    if (rows.some((r) => r.nisn === form.nisn)) return setError('NISN sudah terdaftar.');
    setRows([{ nama: form.nama.trim(), nisn: form.nisn, jurusan: form.jurusan, tgl: isoHariIni(), berkas: 'Belum Lengkap', bayar: 'Menunggu', gel: Number(gel) || 1 }, ...rows]);
    setForm({ nama: '', nisn: '', jurusan: JURUSAN[0] });
    setError('');
    setAdding(false);
    setPage(1);
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>Data Calon Siswa Baru</h1>
          <p className={styles.subtitle}>Kelola pendaftaran, penyaringan, dan rekapitulasi data murid tahun ajaran 2026/2027.</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => exportCsv(filtered)}>
            <IconDownload width={14} height={14} /> Ekspor Excel
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setError(''); setAdding(true); }}>
            <IconPlus width={14} height={14} /> Tambah Calon Siswa
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <label className={styles.search}>
          <IconSearch width={14} height={14} />
          <input value={query} onChange={onFilter(setQuery)} placeholder="Cari Nama Pendaftar atau NISN..." />
        </label>
        <select className={styles.select} value={jurusan} onChange={onFilter(setJurusan)} aria-label="Filter jurusan">
          <option value="">Semua Jurusan</option>
          {JURUSAN.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <select className={styles.select} value={berkas} onChange={onFilter(setBerkas)} aria-label="Filter status berkas">
          <option value="">Status Berkas</option>
          <option value="Lengkap">Lengkap</option>
          <option value="Belum Lengkap">Belum Lengkap</option>
        </select>
        <select className={styles.select} value={gel} onChange={onFilter(setGel)} aria-label="Filter gelombang">
          <option value="">Semua Gelombang</option>
          <option value="1">Gelombang I</option>
          <option value="2">Gelombang II</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>NO</th><th>NAMA LENGKAP</th><th>NISN</th><th>JURUSAN PILIHAN</th>
                <th>TGL DAFTAR</th><th>STATUS BERKAS</th><th>PEMBAYARAN</th><th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={r.nisn}>
                  <td>{start + i + 1}</td>
                  <td className={styles.name}>{r.nama}</td>
                  <td>{r.nisn}</td>
                  <td>{r.jurusan}</td>
                  <td className={styles.date}>{tglPendek(r.tgl)}</td>
                  <td><span className={`${styles.badge} ${styles[berkasTone(r)]}`}>{r.berkas}</span></td>
                  <td><span className={`${styles.badge} ${styles[bayarTone(r.bayar)]}`}>{r.bayar}</span></td>
                  <td><button type="button" className={styles.sbtn} onClick={() => setDetail(r)}>Lihat Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <div className={styles.empty}>Tidak ada data yang cocok dengan filter.</div>}
        </div>
        <div className={styles.tableFoot}>
          <span>
            Menampilkan <strong>{filtered.length ? `${start + 1}-${start + visible.length}` : '0'}</strong> dari <strong>{angka(filtered.length)}</strong> data
          </span>
          <div className={styles.pager}>
            <button type="button" className={styles.pageBtn} disabled={current === 1} onClick={() => setPage(current - 1)}>Sebelumnya</button>
            {Array.from({ length: pages }, (_, n) => n + 1).map((n) => (
              <button key={n} type="button" className={`${styles.pageBtn} ${n === current ? styles.pageActive : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button type="button" className={styles.pageBtn} disabled={current === pages} onClick={() => setPage(current + 1)}>Selanjutnya</button>
          </div>
        </div>
      </div>

      {detail && (
        <Modal title="Detail Calon Siswa" onClose={() => setDetail(null)} footer={<button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setDetail(null)}>Tutup</button>}>
          <dl className={styles.dl}>
            <dt>Nama lengkap</dt><dd>{detail.nama}</dd>
            <dt>NISN</dt><dd>{detail.nisn}</dd>
            <dt>Jurusan pilihan</dt><dd>{detail.jurusan}</dd>
            <dt>Tanggal daftar</dt><dd>{tglPendek(detail.tgl)}</dd>
            <dt>Gelombang</dt><dd>Gelombang {detail.gel === 1 ? 'I' : 'II'}</dd>
            <dt>Status berkas</dt><dd>{detail.berkas}</dd>
            <dt>Pembayaran</dt><dd>{detail.bayar}</dd>
          </dl>
        </Modal>
      )}

      {adding && (
        <Modal title="Tambah Calon Siswa" onClose={() => setAdding(false)}>
          <form className={styles.form} onSubmit={submitAdd}>
            <label className={styles.field}>Nama lengkap
              <input className={styles.input} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} autoFocus />
            </label>
            <label className={styles.field}>NISN
              <input className={styles.input} inputMode="numeric" maxLength={10} value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value.replace(/\D/g, '') })} />
            </label>
            <label className={styles.field}>Jurusan pilihan
              <select className={`${styles.input}`} value={form.jurusan} onChange={(e) => setForm({ ...form, jurusan: e.target.value })}>
                {JURUSAN.map((j) => <option key={j}>{j}</option>)}
              </select>
            </label>
            {error && <p className={styles.errorText}>{error}</p>}
            <div className={styles.modalFoot}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setAdding(false)}>Batal</button>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Simpan</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}