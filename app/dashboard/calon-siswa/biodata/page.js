"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import StudentShell from "../StudentShell";
import styles from "../student-pages.module.css";

const EMPTY_FORM = {
  tempat_lahir: "",
  tanggal_lahir: "",
  jenis_kelamin: "",
  alamat: "",
  asal_sekolah: "",
  nama_orang_tua: "",
  whatsapp_orang_tua: "",
};

export default function BiodataSiswaPage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/siswa/profil")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat biodata.");
        if (cancelled) return;
        setProfile(result.profile);
        setForm(Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [
          key,
          key === "tanggal_lahir" ? (result.profile[key] || "").slice(0, 10) : result.profile[key] || "",
        ])));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/siswa/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan biodata.");
      setMessage(result.message);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <StudentShell title="Isi Biodata">
      <div className={styles.page}>
        <div className={styles.pageHeading}>
          <div><p className={styles.eyebrow}>TAHAP 2 · DATA CALON SISWA</p><h1>Isi Biodata</h1><p>Lengkapi data diri, orang tua, dan sekolah asal dengan benar.</p></div>
        </div>
        {loading ? <div className={styles.formPanel}>Memuat biodata...</div> : (
          <form className={styles.formPanel} onSubmit={save}>
            <h2>Informasi Pribadi</h2>
            <p className={styles.formHint}>Nama, NISN, email, dan jurusan diambil dari akun pendaftaran.</p>
            {error && <p className={styles.error} role="alert">{error}</p>}
            {message && <p className={`${styles.message} ${styles.success}`} role="status">{message}</p>}
            <div className={styles.formGrid}>
              <div className={styles.field}><label htmlFor="nama">Nama Lengkap</label><input id="nama" value={profile?.nama || ""} disabled /></div>
              <div className={styles.field}><label htmlFor="nisn">NISN</label><input id="nisn" value={profile?.nisn || ""} disabled /></div>
              <div className={styles.field}><label htmlFor="email">Email</label><input id="email" value={profile?.email || ""} disabled /></div>
              <div className={styles.field}><label htmlFor="jurusan">Jurusan Pilihan</label><input id="jurusan" value={profile?.jurusan || ""} disabled /></div>
              <div className={styles.field}><label htmlFor="tempat_lahir">Tempat Lahir *</label><input id="tempat_lahir" name="tempat_lahir" maxLength={100} value={form.tempat_lahir} onChange={change} required /></div>
              <div className={styles.field}><label htmlFor="tanggal_lahir">Tanggal Lahir *</label><input id="tanggal_lahir" name="tanggal_lahir" type="date" value={form.tanggal_lahir} onChange={change} required /></div>
              <div className={styles.field}><label htmlFor="jenis_kelamin">Jenis Kelamin *</label><select id="jenis_kelamin" name="jenis_kelamin" value={form.jenis_kelamin} onChange={change} required><option value="">Pilih jenis kelamin</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
              <div className={styles.field}><label htmlFor="asal_sekolah">Asal Sekolah *</label><input id="asal_sekolah" name="asal_sekolah" maxLength={150} value={form.asal_sekolah} onChange={change} required /></div>
              <div className={`${styles.field} ${styles.wide}`}><label htmlFor="alamat">Alamat Lengkap *</label><textarea id="alamat" name="alamat" maxLength={2000} value={form.alamat} onChange={change} required /></div>
              <div className={styles.field}><label htmlFor="nama_orang_tua">Nama Orang Tua/Wali *</label><input id="nama_orang_tua" name="nama_orang_tua" maxLength={100} value={form.nama_orang_tua} onChange={change} required /></div>
              <div className={styles.field}><label htmlFor="whatsapp_orang_tua">WhatsApp Orang Tua/Wali *</label><input id="whatsapp_orang_tua" name="whatsapp_orang_tua" type="tel" maxLength={20} value={form.whatsapp_orang_tua} onChange={change} required /></div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? "Menyimpan..." : <><Check size={14} /> Simpan Biodata</>}</button>
            </div>
          </form>
        )}
      </div>
    </StudentShell>
  );
}
