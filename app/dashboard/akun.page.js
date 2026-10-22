"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import AkunManager from "./AkunManager";
import s from "./page.module.css";
import t from "./AkunManager.module.css";

// Catatan: halaman Pengaturan tidak ada di Figma, jadi tampilannya mengikuti
// gaya halaman admin lain. Nilai awal di bawah masih contoh.
const AWAL = {
  namaSekolah: "Garuda Utama",
  tahunAjaran: "2026/2027",
  gelombang: "Gelombang I",
  emailAdmin: "admin@garudautama.sch.id",
  pendaftaranBuka: true,
  notifEmail: true,
  notifPortal: true,
};

const TABS = [
  { id: "umum", label: "Umum" },
  { id: "kepsek", label: "Akun Kepala Sekolah" },
  { id: "siswa", label: "Akun Siswa" },
];

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`${s.switch} ${on ? s.switchOn : ""}`}
    />
  );
}

export default function PengaturanPage() {
  const router = useRouter();
  const [tab, setTab] = useState("umum");
  const [form, setForm] = useState(AWAL);
  const [tersimpan, setTersimpan] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setTersimpan(false);
  };

  function kembali() {
    // Kembali ke halaman sebelumnya; kalau tidak ada riwayat, ke dashboard.
    if (window.history.length > 1) router.back();
    else router.push("/dashboard/admin");
  }

  function simpan(e) {
    e.preventDefault();
    // TODO: ganti dengan fetch ke API (PUT /api/pengaturan) lalu tampilkan hasilnya
    setTersimpan(true);
  }

  return (
    <AdminShell breadcrumb="Pengaturan">
      <div className={s.wrap}>
        <div className={s.titleRow}>
          <div>
            <h1 className={`${s.serif} ${s.title}`}>Pengaturan</h1>
            <p className={s.subtitle}>Atur informasi sekolah, masa pendaftaran, notifikasi, dan akun pengguna SPMB.</p>
          </div>
          <button type="button" className={s.backBtn} onClick={kembali}>
            <ArrowLeft size={14} />
            Kembali
          </button>
        </div>

        <div className={t.tabs} role="tablist">
          {TABS.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={tab === x.id}
              className={`${t.tab} ${tab === x.id ? t.tabOn : ""}`}
              onClick={() => setTab(x.id)}
            >
              {x.label}
            </button>
          ))}
        </div>

        {tab === "kepsek" && <AkunManager role="KEPSEK" />}
        {tab === "siswa" && <AkunManager role="SISWA" />}

        {tab === "umum" && (
          // display: contents supaya kartu-kartu tetap mengikuti layout s.wrap
          <form onSubmit={simpan} style={{ display: "contents" }}>
            <div className={s.card}>
              <div>
                <h2 className={`${s.serif} ${s.cardTitle}`}>Informasi Umum</h2>
                <p className={s.cardDesc}>Data ini tampil di halaman publik dan surat pengumuman.</p>
              </div>
              <div className={s.fields}>
                <label className={s.field}>
                  <span className={s.label}>Nama Sekolah</span>
                  <input className={s.input} value={form.namaSekolah} onChange={(e) => set("namaSekolah", e.target.value)} />
                </label>
                <label className={s.field}>
                  <span className={s.label}>Tahun Ajaran</span>
                  <input className={s.input} value={form.tahunAjaran} onChange={(e) => set("tahunAjaran", e.target.value)} />
                </label>
                <label className={s.field}>
                  <span className={s.label}>Gelombang Aktif</span>
                  <select className={s.select} value={form.gelombang} onChange={(e) => set("gelombang", e.target.value)}>
                    <option>Gelombang I</option>
                    <option>Gelombang II</option>
                    <option>Gelombang III</option>
                  </select>
                </label>
                <label className={s.field}>
                  <span className={s.label}>Email Admin</span>
                  <input type="email" className={s.input} value={form.emailAdmin} onChange={(e) => set("emailAdmin", e.target.value)} />
                </label>
              </div>
            </div>

            <div className={s.card}>
              <div>
                <h2 className={`${s.serif} ${s.cardTitle}`}>Pendaftaran &amp; Notifikasi</h2>
                <p className={s.cardDesc}>Kontrol kapan pendaftaran dibuka dan lewat mana pengumuman dikirim.</p>
              </div>
              <div className={s.toggleList}>
                <div className={s.toggleRow}>
                  <div>
                    <p className={s.toggleName}>Pendaftaran dibuka</p>
                    <p className={s.toggleDesc}>Calon siswa bisa mendaftar dan mengunggah berkas.</p>
                  </div>
                  <Toggle on={form.pendaftaranBuka} onChange={(v) => set("pendaftaranBuka", v)} label="Pendaftaran dibuka" />
                </div>
                <div className={s.toggleRow}>
                  <div>
                    <p className={s.toggleName}>Kirim notifikasi lewat email</p>
                    <p className={s.toggleDesc}>Pengumuman dikirim ke email calon siswa.</p>
                  </div>
                  <Toggle on={form.notifEmail} onChange={(v) => set("notifEmail", v)} label="Notifikasi email" />
                </div>
                <div className={s.toggleRow}>
                  <div>
                    <p className={s.toggleName}>Tampilkan di portal siswa</p>
                    <p className={s.toggleDesc}>Pengumuman muncul di dashboard calon siswa.</p>
                  </div>
                  <Toggle on={form.notifPortal} onChange={(v) => set("notifPortal", v)} label="Notifikasi portal" />
                </div>
              </div>
            </div>

            <div className={s.footer}>
              {tersimpan && <span className={s.saved}>Pengaturan tersimpan</span>}
              <button type="submit" className={s.saveBtn}>Simpan Perubahan</button>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  );
}