"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle, LockKeyhole, UnlockKeyhole } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import s from "./page.module.css";

export default function SoalUjianPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/soal-ujian")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat soal.");
        if (!cancelled) setData(result);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function setActive(aktif) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/soal-ujian", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengubah status.");
      setData((current) => ({ ...current, aktif: result.aktif }));
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell breadcrumb="Soal Ujian">
      <div className={s.wrap}>
        <div>
          <h1 className={s.title}>Bank Soal Ujian</h1>
          <p className={s.subtitle}>Kelola dan publikasikan soal Tes Potensi Akademik untuk calon siswa.</p>
        </div>

        <section className={s.publishCard} aria-live="polite">
          <div className={s.statusIcon}>
            {data?.aktif ? <UnlockKeyhole size={22} /> : <LockKeyhole size={22} />}
          </div>
          <div className={s.statusCopy}>
            <h2>{data?.aktif ? "Tes sedang aktif" : "Tes belum diaktifkan"}</h2>
            <p>
              {data?.aktif
                ? `${data.totalSoal} soal sudah tersedia langsung di halaman tes calon siswa.`
                : "Aktifkan untuk langsung memublikasikan seluruh soal yang tersedia kepada calon siswa."}
            </p>
          </div>
          <button
            type="button"
            className={`${s.toggle} ${data?.aktif ? s.toggleOff : ""}`}
            onClick={() => setActive(!data?.aktif)}
            disabled={!data || saving || loading}
          >
            {saving ? <LoaderCircle size={16} className={s.spin} /> : data?.aktif ? "Nonaktifkan Tes" : "Aktifkan Semua Soal"}
          </button>
        </section>

        {error && <p className={s.error} role="alert"><CircleAlert size={16} />{error}</p>}
        {loading ? (
          <p className={s.message}>Memuat bank soal...</p>
        ) : !data ? (
          <p className={s.message}>Bank soal belum dapat ditampilkan.</p>
        ) : (
          <>
            <div className={s.listHeader}>
              <h2>Daftar Soal</h2>
              <span>{data.totalSoal} soal tersedia</span>
            </div>
            {data.questions.length === 0 ? (
              <p className={s.message}>Belum ada soal. Pastikan database/soal-ujian.sql sudah dijalankan.</p>
            ) : (
              <div className={s.questions}>
                {data.questions.map((question, index) => (
                  <article className={s.question} key={question.id}>
                    <div className={s.questionHead}>
                      <span className={s.number}>Soal {index + 1}</span>
                      <span className={s.category}>{question.kategori}</span>
                    </div>
                    <p className={s.prompt}>{question.pertanyaan}</p>
                    <div className={s.options}>
                      {Object.entries(question.opsi).map(([key, value]) => (
                        <span className={key === question.jawabanBenar ? s.correct : s.option} key={key}>
                          <strong>{key}.</strong> {value}
                          {key === question.jawabanBenar && <CheckCircle2 size={15} aria-label="Kunci jawaban" />}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
