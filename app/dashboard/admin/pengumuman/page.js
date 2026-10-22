"use client";

import { useState } from "react";
import { Plus, CheckCircle } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import s from "./page.module.css";

// Data contoh. Pengumuman 1 sesuai Figma; isi pengumuman 2 dan 3 hanya
// teks sementara karena Figma tidak menampilkan pratinjaunya.
// Nanti ganti dengan data dari API/MySQL.
const DATA_AWAL = [
  {
    id: 1,
    status: "published",
    info: "Published 14 Maret 2026",
    judul: "Pengumuman Hasil Seleksi Gelombang I",
    penerima: 1248,
    pembuat: "Super Admin",
    tanggal: "14 Maret 2026",
    sapaan: "Yth. Calon Murid Garuda Utama,",
    paragraf: [
      "Berdasarkan keputusan panitia seleksi SPMB Garuda Utama tahun akademik 2026/2027, kami mengumumkan daftar calon siswa yang dinyatakan lulus seleksi administrasi dan ujian tertulis Gelombang I.",
      "Bagi calon siswa yang dinyatakan lulus, silakan klik tombol di bawah untuk mengunduh SK Kelulusan resmi dan panduan registrasi ulang.",
    ],
    tombol: "Unduh Surat Keputusan Kelulusan",
  },
  {
    id: 2,
    status: "published",
    info: "Published 15 Maret 2026",
    judul: "Jadwal Registrasi Ulang & Biaya Pendidikan",
    penerima: 450,
    pembuat: "Super Admin",
    tanggal: "15 Maret 2026",
    sapaan: "Yth. Calon Murid Garuda Utama,",
    paragraf: ["Isi pengumuman jadwal registrasi ulang dan biaya pendidikan ditulis di sini."],
    tombol: null,
  },
  {
    id: 3,
    status: "draft",
    info: "Terakhir diubah 20 Apr 2026",
    judul: "Pengumuman Hasil Seleksi Gelombang II",
    penerima: 0,
    pembuat: "Super Admin",
    tanggal: "20 Apr 2026",
    sapaan: "Yth. Calon Murid Garuda Utama,",
    paragraf: ["Isi pengumuman hasil seleksi Gelombang II ditulis di sini."],
    tombol: null,
  },
];

const BADGE_LABEL = { published: "Published", draft: "Draft" };
const fmt = (n) => n.toLocaleString("en-US");

export default function PengumumanPage() {
  const [items, setItems] = useState(DATA_AWAL);
  const [pilihId, setPilihId] = useState(1);

  const terpilih = items.find((i) => i.id === pilihId);

  function ubah(id, perubahan) {
    // TODO: ganti dengan fetch ke API (PATCH /api/pengumuman/[id]) lalu update state
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...perubahan } : i)));
  }

  const tarik = (id) => ubah(id, { status: "draft", info: "Baru saja ditarik ke draft" });
  const publish = (id) => ubah(id, { status: "published", info: "Published baru saja" });

  return (
    <AdminShell breadcrumb="Pengumuman">
      <div className={s.wrap}>
        <div className={s.titleRow}>
          <div>
            <h1 className={`${s.serif} ${s.title}`}>Manajemen Pengumuman &amp; Broadcast</h1>
            <p className={s.subtitle}>
              Publikasikan informasi kelulusan, jadwal registrasi ulang, dan berita penting SPMB.
            </p>
          </div>
          {/* TODO: buka form/modal buat pengumuman baru */}
          <button type="button" className={s.addBtn}>
            <Plus size={14} />
            Buat Pengumuman Baru
          </button>
        </div>

        <div className={s.cols}>
          {/* Daftar pengumuman */}
          <div className={s.listBox}>
            <h2 className={`${s.serif} ${s.boxTitle}`}>Daftar Pengumuman</h2>
            <div className={s.list}>
              {items.map((i) => (
                <div
                  key={i.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setPilihId(i.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setPilihId(i.id)}
                  className={`${s.item} ${pilihId === i.id ? s.itemActive : ""}`}
                >
                  <div className={s.itemTop}>
                    <span className={`${s.badge} ${s[i.status]}`}>{BADGE_LABEL[i.status]}</span>
                    <span className={s.itemDate}>{i.info}</span>
                  </div>
                  <p className={s.itemTitle}>{i.judul}</p>
                  <div className={s.itemBottom}>
                    <span className={s.recipients}>{fmt(i.penerima)} Penerima</span>
                    <div className={s.itemActions}>
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnEdit}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </button>
                      {i.status === "published" ? (
                        <button
                          type="button"
                          className={`${s.btn} ${s.btnTarik}`}
                          onClick={(e) => { e.stopPropagation(); tarik(i.id); }}
                        >
                          Tarik
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${s.btn} ${s.btnPublish}`}
                          onClick={(e) => { e.stopPropagation(); publish(i.id); }}
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pratinjau */}
          <div className={s.preview}>
            <p className={s.pvLabel}>Pratinjau Pengumuman</p>
            {terpilih ? (
              <>
                <div className={s.pvHead}>
                  <h2 className={`${s.serif} ${s.pvTitle}`}>{terpilih.judul}</h2>
                  <div className={s.pvMeta}>
                    <span>Dibuat oleh: {terpilih.pembuat}</span>
                    <span className={s.pvDot} />
                    <span>Tanggal: {terpilih.tanggal}</span>
                  </div>
                </div>
                <hr className={s.divider} />
                <div className={s.pvBody}>
                  <p className={s.pvGreet}>{terpilih.sapaan}</p>
                  {terpilih.paragraf.map((p, idx) => (
                    <p key={idx} className={s.pvText}>{p}</p>
                  ))}
                  {terpilih.tombol && (
                    <button type="button" className={s.pvBtn}>{terpilih.tombol}</button>
                  )}
                </div>
                <hr className={s.divider} />
                <div className={s.pvFoot}>
                  {terpilih.status === "published" ? (
                    <>
                      <span>Terkirim ke {fmt(terpilih.penerima)} murid via Email &amp; Portal</span>
                      <CheckCircle size={18} color="#10b981" />
                    </>
                  ) : (
                    <span>Belum dipublikasikan</span>
                  )}
                </div>
              </>
            ) : (
              <p className={s.empty}>Pilih pengumuman untuk melihat pratinjau.</p>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}