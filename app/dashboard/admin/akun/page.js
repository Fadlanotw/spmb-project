"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Pencil, Trash2, X } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import s from "./page.module.css";

// Data contoh. Ganti dengan fetch ke API (GET /api/akun) kalau backend sudah siap.
const AWAL = [
  { id: 1, nama: "Muhammad Fadlan Sabani", email: "admin@spmb.test", peran: "Super Administrator", aktif: true },
  { id: 2, nama: "Kepala Sekolah", email: "kepsek@spmb.test", peran: "Kepala Sekolah", aktif: true },
];

const PERAN = ["Super Administrator", "Kepala Sekolah", "Admin Verifikasi", "Admin Keuangan", "Panitia Tes"];
const KOSONG = { nama: "", email: "", peran: PERAN[2], aktif: true };

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

export default function KelolaAkunPage() {
  const router = useRouter();
  const [akun, setAkun] = useState(AWAL);
  const [cari, setCari] = useState("");
  const [form, setForm] = useState(null); // null = modal tertutup
  const [editId, setEditId] = useState(null);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return akun;
    return akun.filter((a) => a.nama.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.peran.toLowerCase().includes(q));
  }, [akun, cari]);

  function kembali() {
    if (window.history.length > 1) router.back();
    else router.push("/dashboard/admin");
  }

  function tambah() {
    setEditId(null);
    setForm(KOSONG);
  }

  function ubah(a) {
    setEditId(a.id);
    setForm({ nama: a.nama, email: a.email, peran: a.peran, aktif: a.aktif });
  }

  function simpan(e) {
    e.preventDefault();
    if (editId) {
      setAkun((list) => list.map((a) => (a.id === editId ? { ...a, ...form } : a)));
    } else {
      setAkun((list) => [...list, { id: Date.now(), ...form }]);
    }
    // TODO: kirim ke API (POST/PUT /api/akun)
    setForm(null);
  }

  function hapus(a) {
    if (!window.confirm(`Hapus akun ${a.nama}?`)) return;
    // TODO: DELETE /api/akun/:id
    setAkun((list) => list.filter((x) => x.id !== a.id));
  }

  function toggleAktif(id, v) {
    setAkun((list) => list.map((a) => (a.id === id ? { ...a, aktif: v } : a)));
  }

  const inisial = (n) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <AdminShell breadcrumb="Kelola Akun">
      <div className={s.wrap}>
        <div className={s.titleRow}>
          <div>
            <h1 className={s.title}>Kelola Akun</h1>
            <p className={s.subtitle}>Atur akun admin dan panitia yang bisa masuk ke dashboard SPMB.</p>
          </div>
          <button type="button" className={s.backBtn} onClick={kembali}>
            <ArrowLeft size={14} />
            Kembali
          </button>
        </div>

        <div className={s.card}>
          <div className={s.toolbar}>
            <label className={s.searchBox}>
              <Search size={15} />
              <input
                className={s.searchInput}
                placeholder="Cari nama, email, atau peran"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
              />
            </label>
            <button type="button" className={s.addBtn} onClick={tambah}>
              <Plus size={15} />
              Tambah Akun
            </button>
          </div>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Peran</th>
                  <th>Status</th>
                  <th className={s.right}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tampil.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className={s.person}>
                        <span className={s.avatar}>{inisial(a.nama)}</span>
                        <div>
                          <p className={s.name}>{a.nama}</p>
                          <p className={s.mail}>{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={s.badge}>{a.peran}</span>
                    </td>
                    <td>
                      <div className={s.statusCell}>
                        <Toggle on={a.aktif} onChange={(v) => toggleAktif(a.id, v)} label={`Aktifkan ${a.nama}`} />
                        <span className={a.aktif ? s.on : s.off}>{a.aktif ? "Aktif" : "Nonaktif"}</span>
                      </div>
                    </td>
                    <td>
                      <div className={`${s.actions} ${s.right}`}>
                        <button type="button" className={s.iconBtn} aria-label={`Ubah ${a.nama}`} onClick={() => ubah(a)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className={`${s.iconBtn} ${s.danger}`} aria-label={`Hapus ${a.nama}`} onClick={() => hapus(a)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tampil.length === 0 && (
                  <tr>
                    <td colSpan={4} className={s.empty}>
                      Tidak ada akun yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {form && (
        <div className={s.overlay} onClick={() => setForm(null)}>
          <form className={s.modal} onClick={(e) => e.stopPropagation()} onSubmit={simpan}>
            <div className={s.modalHead}>
              <h2 className={s.modalTitle}>{editId ? "Ubah Akun" : "Tambah Akun"}</h2>
              <button type="button" className={s.iconBtn} aria-label="Tutup" onClick={() => setForm(null)}>
                <X size={16} />
              </button>
            </div>

            <label className={s.field}>
              <span className={s.label}>Nama Lengkap</span>
              <input required className={s.input} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </label>
            <label className={s.field}>
              <span className={s.label}>Email</span>
              <input required type="email" className={s.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className={s.field}>
              <span className={s.label}>Peran</span>
              <select className={s.input} value={form.peran} onChange={(e) => setForm({ ...form, peran: e.target.value })}>
                {PERAN.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <div className={s.modalToggle}>
              <span className={s.label}>Akun aktif</span>
              <Toggle on={form.aktif} onChange={(v) => setForm({ ...form, aktif: v })} label="Akun aktif" />
            </div>

            <div className={s.modalFoot}>
              <button type="button" className={s.backBtn} onClick={() => setForm(null)}>
                Batal
              </button>
              <button type="submit" className={s.saveBtn}>
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}