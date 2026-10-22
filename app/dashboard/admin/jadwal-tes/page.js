"use client";

import { Plus, Clock, MapPin } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import s from "./page.module.css";

// Data contoh sesuai Figma. Nanti ganti dengan data dari API/MySQL.
const JADWAL = [
  { id: 1, status: "terjadwal", label: "Terjadwal", tanggal: "07 Maret 2026", nama: "TPA (Tes Potensi Akademik)", jam: "08:00 - 11:00 WIB", tempat: "Online (CBT Portal)", peserta: "450 Peserta Terdaftar" },
  { id: 2, status: "berlangsung", label: "Berlangsung", tanggal: "14 Maret 2026", nama: "Tes Wawancara", jam: "08:00 - 16:00 WIB", tempat: "Offline (Garuda Utama)", peserta: "450 Peserta Terbagi" },
  { id: 3, status: "selesai", label: "Selesai", tanggal: "21 Maret 2026", nama: "Tes Praktik & Kejuruan", jam: "08:00 - 12:00 WIB", tempat: "Offline (Lab RPL & Bisnis)", peserta: "320 Peserta Terdaftar" },
];

const TIMELINE = [
  { id: 1, tanggal: "01 - 28 Feb 2026", teks: "Masa Pendaftaran & Upload Berkas Gelombang I", selesai: true },
  { id: 2, tanggal: "07 Maret 2026", teks: "Pelaksanaan Tes Potensi Akademik (TPA)", selesai: false },
  { id: 3, tanggal: "14 Maret 2026", teks: "Tes Wawancara Kepribadian & Kemandirian", selesai: false },
  { id: 4, tanggal: "21 Maret 2026", teks: "Pengumuman Kelulusan Akhir Gelombang I", selesai: false },
];

export default function JadwalTesPage() {
  return (
    <AdminShell breadcrumb="Jadwal Tes Seleksi">
      <div className={s.wrap}>
        <div className={s.titleRow}>
          <div>
            <h1 className={`${s.serif} ${s.title}`}>Jadwal Tes &amp; Seleksi Masuk</h1>
            <p className={s.subtitle}>
              Kelola jadwal, ruangan, metode tes, dan pantau jumlah partisipasi peserta seleksi.
            </p>
          </div>
          {/* TODO: buka form/modal tambah jadwal */}
          <button type="button" className={s.addBtn}>
            <Plus size={14} />
            Tambah Jadwal Baru
          </button>
        </div>

        <div className={s.grid}>
          {JADWAL.map((j) => (
            <div key={j.id} className={s.card}>
              <div className={s.cardTop}>
                <span className={`${s.badge} ${s[j.status]}`}>{j.label}</span>
                <span className={s.date}>{j.tanggal}</span>
              </div>

              <div className={s.info}>
                <h2 className={`${s.serif} ${s.cardTitle}`}>{j.nama}</h2>
                <p className={s.meta}>
                  <Clock size={14} />
                  {j.jam}
                </p>
                <p className={s.meta}>
                  <MapPin size={14} />
                  {j.tempat}
                </p>
              </div>

              <hr className={s.divider} />

              <div className={s.cardFoot}>
                <p className={s.count}>{j.peserta}</p>
                <div className={s.actions}>
                  <button type="button" className={`${s.btn} ${s.btnEdit}`}>Edit</button>
                  <button type="button" className={`${s.btn} ${s.btnView}`}>Lihat Peserta</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={s.timeline}>
          <h2 className={`${s.serif} ${s.tlTitle}`}>Alur Timeline Kegiatan Terdekat</h2>
          <div className={s.tlList}>
            {TIMELINE.map((t) => (
              <div key={t.id} className={s.tlRow}>
                <span className={s.tlDate}>{t.tanggal}</span>
                <span className={s.dotBox}>
                  <span className={`${s.dot} ${t.selesai ? s.dotDone : ""}`} />
                </span>
                <p className={s.tlText}>{t.teks}</p>
                <span className={`${s.badge} ${t.selesai ? s.selesai : s.akan}`}>
                  {t.selesai ? "Selesai" : "Akan Datang"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}