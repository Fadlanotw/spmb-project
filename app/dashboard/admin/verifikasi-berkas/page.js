"use client";

import { useState } from "react";
import { FileCheck, CheckCircle, Clock, XCircle } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import s from "./page.module.css";

// Angka dasar sesuai desain Figma (semua gelombang).
// Nanti ganti dengan data dari API/MySQL.
const BASE = { total: 1248, terverifikasi: 876, menunggu: 312, ditolak: 60 };

const DATA_AWAL = [
  { id: 1, nama: "Aisyah Rahmawati", jurusan: "PPLG (RPL)", berkas: "Rapor Semester 1-5", tanggal: "12 Feb 2026", status: "menunggu" },
  { id: 2, nama: "Budi Santoso", jurusan: "PPLG (RPL)", berkas: "Ijazah & SKHUN", tanggal: "12 Feb 2026", status: "menunggu" },
  { id: 3, nama: "Cynthia Bella", jurusan: "MPLB (Layanan Bisnis)", berkas: "Sertifikat Prestasi", tanggal: "11 Feb 2026", status: "menunggu" },
  { id: 4, nama: "Dedi Kurniawan", jurusan: "Pemasaran (BDR)", berkas: "Akte Kelahiran", tanggal: "11 Feb 2026", status: "terverifikasi" },
  { id: 5, nama: "Eka Saputra", jurusan: "PPLG (RPL)", berkas: "Kartu Keluarga", tanggal: "10 Feb 2026", status: "ditolak" },
  { id: 6, nama: "Fatimah Zahra", jurusan: "MPLB (Layanan Bisnis)", berkas: "Surat Kesehatan", tanggal: "10 Feb 2026", status: "menunggu" },
];

const STATUS_LABEL = { menunggu: "Menunggu", terverifikasi: "Terverifikasi", ditolak: "Ditolak" };

const TABS = [
  { key: "semua", label: "Semua" },
  { key: "menunggu", label: "Menunggu Verifikasi" },
  { key: "terverifikasi", label: "Terverifikasi" },
  { key: "ditolak", label: "Ditolak" },
];

function hitung(rows) {
  return {
    menunggu: rows.filter((r) => r.status === "menunggu").length,
    terverifikasi: rows.filter((r) => r.status === "terverifikasi").length,
    ditolak: rows.filter((r) => r.status === "ditolak").length,
  };
}

const AWAL = hitung(DATA_AWAL);

export default function VerifikasiBerkasPage() {
  const [rows, setRows] = useState(DATA_AWAL);
  const [tab, setTab] = useState("menunggu");

  const sekarang = hitung(rows);
  const angka = {
    total: BASE.total,
    menunggu: BASE.menunggu + (sekarang.menunggu - AWAL.menunggu),
    terverifikasi: BASE.terverifikasi + (sekarang.terverifikasi - AWAL.terverifikasi),
    ditolak: BASE.ditolak + (sekarang.ditolak - AWAL.ditolak),
  };
  const tabCount = { semua: angka.total, menunggu: angka.menunggu, terverifikasi: angka.terverifikasi, ditolak: angka.ditolak };

  const tampil = tab === "semua" ? rows : rows.filter((r) => r.status === tab);

  function ubahStatus(id, status) {
    // TODO: ganti dengan fetch ke API (PATCH /api/berkas/[id]) lalu update state
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const kartu = [
    { label: "Total Berkas Masuk", nilai: angka.total, ket: "Semua gelombang", Ikon: FileCheck, warna: "#1f4260", bg: "rgba(31,66,96,0.08)" },
    { label: "Terverifikasi", nilai: angka.terverifikasi, ket: "Sudah disetujui", Ikon: CheckCircle, warna: "#10b981", bg: "rgba(16,185,129,0.08)" },
    { label: "Menunggu Verifikasi", nilai: angka.menunggu, ket: "Butuh review segera", Ikon: Clock, warna: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    { label: "Berkas Ditolak", nilai: angka.ditolak, ket: "Perlu upload ulang", Ikon: XCircle, warna: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  ];

  return (
    <AdminShell breadcrumb="Verifikasi Berkas">
    <div className={s.wrap}>
      <div>
        <h1 className={`${s.serif} ${s.title}`}>Verifikasi Dokumen Pendaftaran</h1>
        <p className={s.subtitle}>Periksa kelengkapan administrasi syarat seleksi murid baru Garuda Utama.</p>
      </div>

      <div className={s.grid}>
        {kartu.map(({ label, nilai, ket, Ikon, warna, bg }) => (
          <div key={label} className={s.card}>
            <div className={s.cardTop}>
              <p className={s.cardLabel}>{label}</p>
              <div className={s.iconBox} style={{ background: bg }}>
                <Ikon size={16} color={warna} />
              </div>
            </div>
            <div>
              <p className={`${s.serif} ${s.cardValue}`}>{nilai.toLocaleString("en-US")}</p>
              <p className={s.cardNote}>{ket}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={s.panel}>
        <div className={s.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`${s.tab} ${tab === t.key ? s.tabActive : ""}`}
            >
              {t.label}
              <span className={s.pill}>{tabCount[t.key]}</span>
            </button>
          ))}
        </div>

        <div className={s.scroll}>
          <div className={s.table}>
            <div className={s.head}>
              <span className={s.cNo}>NO</span>
              <span className={s.cNama}>NAMA PENDAFTAR</span>
              <span className={s.cJurusan}>JURUSAN</span>
              <span className={s.cBerkas}>JENIS BERKAS</span>
              <span className={s.cTanggal}>TANGGAL UPLOAD</span>
              <span className={s.cStatus}>STATUS</span>
              <span className={s.cAksi}>AKSI VERIFIKASI</span>
            </div>

            {tampil.length === 0 && <p className={s.empty}>Tidak ada berkas pada kategori ini.</p>}

            {tampil.map((r, i) => (
              <div key={r.id} className={s.row}>
                <p className={`${s.txt} ${s.cNo}`}>{i + 1}</p>
                <p className={`${s.name} ${s.cNama}`}>{r.nama}</p>
                <p className={`${s.txt} ${s.cJurusan}`}>{r.jurusan}</p>
                <p className={`${s.txt} ${s.cBerkas}`}>{r.berkas}</p>
                <p className={`${s.txtMuted} ${s.cTanggal}`}>{r.tanggal}</p>
                <div className={s.cStatus}>
                  <span className={`${s.badge} ${s[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                </div>
                <div className={s.cAksi}>
                  {r.status === "menunggu" ? (
                    <>
                      <button type="button" className={`${s.btn} ${s.btnOk}`} onClick={() => ubahStatus(r.id, "terverifikasi")}>Terima</button>
                      <button type="button" className={`${s.btn} ${s.btnNo}`} onClick={() => ubahStatus(r.id, "ditolak")}>Tolak</button>
                    </>
                  ) : (
                    <button type="button" className={`${s.btn} ${s.btnDetail}`}>Detail Review</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={s.footer}>
          <span className={s.txt}>Menampilkan {tampil.length} berkas teratas</span>
          <button type="button" className={s.link}>Kelola Semua Berkas →</button>
        </div>
      </div>
    </div>
    </AdminShell>
  );
}