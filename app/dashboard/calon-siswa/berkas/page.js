"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, FileText, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import StudentShell from "../StudentShell";
import styles from "../student-pages.module.css";

const DOCUMENTS = [
  { id: "pas_foto", label: "Pas Foto 3×4 (Latar Merah)" },
  { id: "rapor", label: "Scan Rapor Semester 1–5" },
  { id: "akta", label: "Akta Kelahiran" },
  { id: "kk", label: "Kartu Keluarga (KK)" },
  { id: "surat_sehat", label: "Surat Keterangan Sehat" },
  { id: "ijazah", label: "Ijazah / SKL" },
];

function fileSize(size) {
  return `${(size / 1024).toFixed(0)} KB`;
}

export default function BerkasSiswaPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFiles = useCallback(async () => {
    const response = await fetch("/api/siswa/berkas");
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal memuat berkas.");
    setFiles(result.berkas);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/siswa/berkas")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat berkas.");
        if (!cancelled) setFiles(result.berkas);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function upload(kind, file) {
    setError("");
    setMessage("");
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran berkas maksimal 2 MB.");
      return;
    }
    setBusy(kind);
    try {
      const formData = new FormData();
      formData.set("jenis", kind);
      formData.set("file", file);
      const response = await fetch("/api/siswa/berkas", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengunggah berkas.");
      await loadFiles();
      setMessage(result.message);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy("");
    }
  }

  async function remove(document) {
    setError("");
    setMessage("");
    setBusy(document.jenis);
    try {
      const response = await fetch(`/api/siswa/berkas?id=${document.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menghapus berkas.");
      await loadFiles();
      setMessage(result.message);
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setBusy("");
    }
  }

  const complete = DOCUMENTS.every((document) => files.some((file) => file.jenis === document.id));

  return (
    <StudentShell title="Upload Berkas">
      <div className={styles.page}>
        <div className={styles.pageHeading}>
          <div><p className={styles.eyebrow}>TAHAP 3 · DOKUMEN PERSYARATAN</p><h1>Unggah Dokumen Persyaratan</h1><p>Format file yang diterima: JPG / JPEG / PNG / PDF. Ukuran maksimal per file: 2 MB.</p></div>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {message && <p className={`${styles.message} ${styles.success}`} role="status">{message}</p>}
        {loading ? <div className={styles.formPanel}>Memuat daftar berkas...</div> : (
          <div className={styles.documentsGrid}>
            {DOCUMENTS.map((document) => {
              const uploaded = files.find((file) => file.jenis === document.id);
              return (
                <article className={styles.documentCard} key={document.id}>
                  <div className={styles.documentHead}>
                    <strong>{document.label}</strong>
                    <span className={`${styles.documentStatus} ${uploaded ? styles.documentUploaded : ""}`}>{uploaded ? "Terunggah" : "Wajib"}</span>
                  </div>
                  {uploaded ? (
                    <>
                      <span className={styles.fileName}><FileText size={13} /> {uploaded.nama} · {fileSize(uploaded.ukuran)}</span>
                      <div className={styles.documentActions}>
                        <a href={uploaded.url} target="_blank" rel="noreferrer">Lihat berkas</a>
                        <button type="button" onClick={() => remove(uploaded)} disabled={busy === document.id} aria-label={`Hapus ${document.label}`}><Trash2 size={13} /> Hapus</button>
                      </div>
                      <label className={styles.filePicker}>
                        <Upload size={14} /> Ganti file
                        <input className={styles.fileInput} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => { const [file] = event.target.files || []; if (file) upload(document.id, file); event.target.value = ""; }} />
                      </label>
                    </>
                  ) : (
                    <label className={styles.filePicker}>
                      <Upload size={16} />
                      {busy === document.id ? "Mengunggah..." : "Pilih atau tarik file"}
                      <input className={styles.fileInput} type="file" accept=".jpg,.jpeg,.png,.pdf" disabled={Boolean(busy)} onChange={(event) => { const [file] = event.target.files || []; if (file) upload(document.id, file); event.target.value = ""; }} />
                    </label>
                  )}
                </article>
              );
            })}
          </div>
        )}
        <div className={styles.formActions}>
          {!complete && !loading && <span className={styles.formHint}>Unggah semua {DOCUMENTS.length} dokumen wajib untuk melanjutkan.</span>}
          {complete ? (
            <Link className={styles.primaryButton} href="/dashboard/calon-siswa/tes">Simpan &amp; Lanjutkan <Check size={14} /></Link>
          ) : (
            <button className={styles.primaryButton} type="button" disabled>Dokumen belum lengkap <Check size={14} /></button>
          )}
        </div>
      </div>
    </StudentShell>
  );
}
