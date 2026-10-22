"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, CheckCircle2, Circle, Clock3, FileCheck2, FileText, UserRound } from "lucide-react";
import StudentShell from "./StudentShell";
import styles from "./student-pages.module.css";

const REQUIRED_DOCUMENTS = ["pas_foto", "rapor", "akta", "kk", "surat_sehat", "ijazah"];

export default function DashboardCalonSiswa() {
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [examActive, setExamActive] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/siswa/profil").then((response) => response.json()),
      fetch("/api/siswa/berkas").then((response) => response.json()),
      fetch("/api/siswa/tagihan").then((response) => response.json()),
      fetch("/api/soal-ujian").then((response) => response.json()),
      fetch("/api/siswa/hasil").then((response) => response.json()),
    ]).then(([profileData, documentData, paymentData, examData, resultData]) => {
      if (cancelled) return;
      if (profileData.profile) setProfile(profileData.profile);
      if (documentData.berkas) setDocuments(documentData.berkas);
      if (paymentData.invoice) setInvoice(paymentData.invoice);
      setExamActive(Boolean(examData.aktif));
      if (resultData.hasil?.[0]) setResult(resultData.hasil[0]);
      const failed = [profileData, documentData, paymentData, examData, resultData].find((item) => item.message);
      if (failed) setError(failed.message);
    }).catch((loadError) => {
      if (!cancelled) setError(loadError.message || "Gagal memuat status pendaftaran.");
    });
    return () => { cancelled = true; };
  }, []);

  const biodataComplete = Boolean(profile?.tempat_lahir && profile?.tanggal_lahir && profile?.jenis_kelamin && profile?.alamat && profile?.asal_sekolah && profile?.nama_orang_tua);
  const documentsComplete = REQUIRED_DOCUMENTS.every((type) => documents.some((document) => document.jenis === type));
  const progress = [
    { title: "Registrasi", note: "Akun calon siswa berhasil dibuat.", complete: true, href: "/dashboard/calon-siswa" },
    { title: "Isi Biodata", note: biodataComplete ? "Biodata sudah dilengkapi." : "Lengkapi data diri, orang tua, dan sekolah asal.", complete: biodataComplete, href: "/dashboard/calon-siswa/biodata" },
    { title: "Upload Berkas", note: `${documents.length} dari ${REQUIRED_DOCUMENTS.length} dokumen sudah diunggah.`, complete: documentsComplete, href: "/dashboard/calon-siswa/berkas" },
    { title: "Tagihan Pembayaran", note: invoice?.status === "lunas" ? "Pembayaran sudah terverifikasi." : invoice?.status === "menunggu_verifikasi" ? "Bukti pembayaran menunggu verifikasi panitia." : invoice?.status === "ditolak" ? "Bukti ditolak. Periksa catatan dan kirim ulang." : invoice ? "Silakan selesaikan pembayaran dan unggah bukti transfer." : documentsComplete ? "Menunggu tagihan diaktifkan panitia." : "Tagihan tersedia setelah berkas lengkap.", complete: invoice?.status === "lunas", href: "/dashboard/calon-siswa/tagihan" },
    { title: "Tes Seleksi", note: result ? "Ujian telah selesai." : examActive ? "Tes aktif dan siap dikerjakan." : "Menunggu tes diaktifkan panitia.", complete: Boolean(result), href: "/dashboard/calon-siswa/tes" },
    { title: "Hasil Tes", note: result ? `Nilai ujian: ${Number(result.nilai).toFixed(2)}.` : "Hasil akan muncul setelah ujian dikumpulkan.", complete: Boolean(result), href: "/dashboard/calon-siswa/hasil" },
    { title: "Pengumuman", note: "Pantau informasi dan pengumuman dari panitia.", complete: false, href: "/dashboard/calon-siswa/pengumuman" },
  ];

  return (
    <StudentShell title="Status Pendaftaran">
      <div className={styles.page}>
        <div className={styles.pageHeading}>
          <div>
            <p className={styles.eyebrow}>PENERIMAAN MURID BARU · T.A. 2026/2027</p>
            <h1>Selamat datang, {profile?.nama || "Calon Siswa"}</h1>
            <p>Pantau tahapan pendaftaran dan lanjutkan proses seleksi Anda.</p>
          </div>
          <span className={styles.statusBadge}><span /> Pendaftaran Dibuka</span>
        </div>

        {error && <p className={styles.error} role="alert">{error}. Pastikan migrasi database portal siswa dan tagihan sudah dijalankan.</p>}

        <section className={styles.summaryGrid} aria-label="Ringkasan pendaftaran">
          <article className={styles.summaryCard}><span className={styles.summaryIcon}><UserRound size={18} /></span><div><small>DATA BIODATA</small><strong>{biodataComplete ? "Lengkap" : "Belum lengkap"}</strong></div></article>
          <article className={styles.summaryCard}><span className={styles.summaryIcon}><FileCheck2 size={18} /></span><div><small>BERKAS MASUK</small><strong>{documents.length}/{REQUIRED_DOCUMENTS.length} Dokumen</strong></div></article>
          <article className={styles.summaryCard}><span className={styles.summaryIcon}><Banknote size={18} /></span><div><small>PEMBAYARAN</small><strong>{invoice?.status === "lunas" ? "Lunas" : invoice?.status === "menunggu_verifikasi" ? "Menunggu verifikasi" : invoice?.status === "ditolak" ? "Perlu diperbaiki" : invoice ? "Belum dibayar" : "Belum tersedia"}</strong></div></article>
          <article className={styles.summaryCard}><span className={styles.summaryIcon}><Clock3 size={18} /></span><div><small>STATUS TES</small><strong>{result ? "Selesai" : examActive ? "Aktif" : "Menunggu"}</strong></div></article>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div><h2>Progres Pendaftaran</h2><p>Ikuti tahapan di bawah untuk menyelesaikan pendaftaran.</p></div>
            <span>{progress.filter((step) => step.complete).length} dari {progress.length} tahap</span>
          </div>
          <ol className={styles.progressList}>
            {progress.map((step, index) => (
              <li key={step.title} className={styles.progressItem}>
                <span className={`${styles.progressIcon} ${step.complete ? styles.progressComplete : ""}`}>
                  {step.complete ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                </span>
                <div className={styles.progressCopy}>
                  <strong>{index + 1}. {step.title}</strong>
                  <p>{step.note}</p>
                </div>
                <Link className={styles.progressLink} href={step.href}>
                  {step.complete ? "Lihat" : "Buka"} <ArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <div className={styles.bottomGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}><div><h2>Aksi Cepat</h2><p>Lanjutkan proses pendaftaran Anda.</p></div></div>
            <div className={styles.quickLinks}>
              <Link href="/dashboard/calon-siswa/biodata"><UserRound size={18} /><span><strong>Lengkapi Biodata</strong><small>Isi informasi pribadi dan sekolah</small></span><ArrowRight size={15} /></Link>
              <Link href="/dashboard/calon-siswa/berkas"><FileCheck2 size={18} /><span><strong>Upload Dokumen</strong><small>Unggah berkas persyaratan</small></span><ArrowRight size={15} /></Link>
              <Link href="/dashboard/calon-siswa/tagihan"><Banknote size={18} /><span><strong>Tagihan Pembayaran</strong><small>{invoice?.status === "lunas" ? "Pembayaran sudah lunas" : "Lihat tagihan dan status pembayaran"}</small></span><ArrowRight size={15} /></Link>
              <Link href="/dashboard/calon-siswa/tes"><FileText size={18} /><span><strong>{result ? "Lihat Hasil Tes" : "Tes Seleksi"}</strong><small>{examActive ? "Tes tersedia untuk dikerjakan" : "Cek status aktivasi tes"}</small></span><ArrowRight size={15} /></Link>
            </div>
          </section>
          <section className={styles.noticePanel}>
            <span className={styles.noticeIcon}><Clock3 size={18} /></span>
            <h2>Informasi Seleksi</h2>
            <p>{examActive ? "Tes seleksi sudah diaktifkan. Persiapkan diri dan mulai ujian melalui menu Tes Seleksi." : "Lengkapi biodata dan dokumen persyaratan. Tes seleksi akan dapat dikerjakan setelah diaktifkan oleh panitia."}</p>
            <Link href={examActive ? "/dashboard/calon-siswa/tes" : "/dashboard/calon-siswa/pengumuman"}>Lihat informasi <ArrowRight size={14} /></Link>
          </section>
        </div>
      </div>
    </StudentShell>
  );
}
