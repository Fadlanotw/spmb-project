"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Pencil, KeyRound, Power, Trash2, X } from "lucide-react";
import s from "./AkunManager.module.css";

const LABEL = {
  KEPSEK: { judul: "Akun Kepala Sekolah", tunggal: "kepala sekolah" },
  SISWA: { judul: "Akun Siswa", tunggal: "siswa" },
};

const KOSONG = { name: "", email: "", password: "" };

export default function AkunManager({ role }) {
  const [daftar, setDaftar] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pesan, setPesan] = useState("");

  // modal: null | { mode: "tambah" | "edit" | "reset" | "hapus", akun? }
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(KOSONG);
  const [menyimpan, setMenyimpan] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  const muat = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/akun?role=${role}&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat akun.");
      setDaftar(data.akun);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [role, q]);

  // Tunda 300 ms supaya tidak memanggil API di setiap ketikan.
  useEffect(() => {
    const t = setTimeout(muat, 300);
    return () => clearTimeout(t);
  }, [muat]);

  function buka(mode, akun) {
    setModal({ mode, akun });
    setErrorModal("");
    setForm(akun && mode === "edit" ? { name: akun.name, email: akun.email, password: "" } : KOSONG);
  }

  function tutup() {
    setModal(null);
    setErrorModal("");
  }

  async function kirim(url, method, body, sukses) {
    setMenyimpan(true);
    setErrorModal("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan.");
      setPesan(data.message || sukses);
      tutup();
      muat();
    } catch (e) {
      setErrorModal(e.message);
    } finally {
      setMenyimpan(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    const { mode, akun } = modal;
    if (mode === "tambah") {
      return kirim("/api/admin/akun", "POST", { ...form, role }, "Akun ditambahkan.");
    }
    if (mode === "edit") {
      return kirim(`/api/admin/akun/${akun.id}`, "PATCH", { name: form.name, email: form.email }, "Perubahan disimpan.");
    }
    if (mode === "reset") {
      return kirim(`/api/admin/akun/${akun.id}`, "PATCH", { password: form.password }, "Password diganti.");
    }
    if (mode === "hapus") {
      return kirim(`/api/admin/akun/${akun.id}`, "DELETE", null, "Akun dihapus.");
    }
  }

  async function ubahStatus(akun) {
    setPesan("");
    const res = await fetch(`/api/admin/akun/${akun.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktif: !akun.aktif }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || "Gagal mengubah status.");
    setPesan(akun.aktif ? "Akun dinonaktifkan." : "Akun diaktifkan.");
    muat();
  }

  const { judul, tunggal } = LABEL[role];

  return (
    <section className={s.card}>
      <div className={s.head}>
        <div>
          <h2 className={s.title}>{judul}</h2>
          <p className={s.desc}>
            {role === "KEPSEK"
              ? "Kepala sekolah yang bisa masuk ke dashboard admin."
              : "Akun calon siswa untuk masuk ke portal pendaftaran."}
          </p>
        </div>
        <button type="button" className={s.primary} onClick={() => buka("tambah")}>
          <Plus size={14} /> Tambah {tunggal}
        </button>
      </div>

      <label className={s.search}>
        <Search size={14} />
        <input
          placeholder="Cari nama atau email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cari akun"
        />
      </label>

      {pesan && <p className={s.ok} role="status">{pesan}</p>}
      {error && <p className={s.err} role="alert">{error}</p>}

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Status</th>
              <th className={s.right}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className={s.empty}>Memuat akun...</td></tr>
            )}
            {!loading && daftar.length === 0 && (
              <tr>
                <td colSpan={4} className={s.empty}>
                  {q ? "Tidak ada akun yang cocok dengan pencarian." : `Belum ada akun ${tunggal}.`}
                </td>
              </tr>
            )}
            {!loading &&
              daftar.map((a) => (
                <tr key={a.id}>
                  <td className={s.name}>{a.name}</td>
                  <td className={s.muted}>{a.email}</td>
                  <td>
                    <span className={`${s.badge} ${a.aktif ? s.badgeOn : s.badgeOff}`}>
                      {a.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <div className={s.actions}>
                      <button type="button" title="Edit" aria-label="Edit" onClick={() => buka("edit", a)}><Pencil size={14} /></button>
                      <button type="button" title="Reset password" aria-label="Reset password" onClick={() => buka("reset", a)}><KeyRound size={14} /></button>
                      <button type="button" title={a.aktif ? "Nonaktifkan" : "Aktifkan"} aria-label={a.aktif ? "Nonaktifkan" : "Aktifkan"} onClick={() => ubahStatus(a)}><Power size={14} /></button>
                      <button type="button" title="Hapus" aria-label="Hapus" className={s.danger} onClick={() => buka("hapus", a)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className={s.overlay} onClick={tutup}>
          <form className={s.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <div className={s.modalHead}>
              <h3 className={s.modalTitle}>
                {modal.mode === "tambah" && `Tambah ${tunggal}`}
                {modal.mode === "edit" && "Edit akun"}
                {modal.mode === "reset" && "Reset password"}
                {modal.mode === "hapus" && "Hapus akun"}
              </h3>
              <button type="button" className={s.close} onClick={tutup} aria-label="Tutup"><X size={16} /></button>
            </div>

            {modal.mode === "hapus" ? (
              <p className={s.confirm}>
                Hapus akun <strong>{modal.akun.name}</strong> ({modal.akun.email})? Akun yang sudah punya data
                tagihan akan dinonaktifkan saja agar riwayat pembayaran tetap ada.
              </p>
            ) : (
              <div className={s.fields}>
                {modal.mode !== "reset" && (
                  <>
                    <label className={s.field}>
                      <span>Nama lengkap</span>
                      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </label>
                    <label className={s.field}>
                      <span>Email</span>
                      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </label>
                  </>
                )}
                {modal.mode !== "edit" && (
                  <label className={s.field}>
                    <span>{modal.mode === "reset" ? "Password baru" : "Password awal"}</span>
                    <input
                      required
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <small>Minimal 8 karakter.</small>
                  </label>
                )}
              </div>
            )}

            {errorModal && <p className={s.err} role="alert">{errorModal}</p>}

            <div className={s.modalFoot}>
              <button type="button" className={s.ghost} onClick={tutup}>Batal</button>
              <button type="submit" className={modal.mode === "hapus" ? s.dangerBtn : s.primary} disabled={menyimpan}>
                {menyimpan
                  ? "Menyimpan..."
                  : modal.mode === "hapus"
                  ? "Hapus akun"
                  : modal.mode === "reset"
                  ? "Ganti password"
                  : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}