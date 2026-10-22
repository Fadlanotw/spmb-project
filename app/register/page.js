"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Instrument_Serif, Inter } from "next/font/google";
import styles from "./register.module.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Gambar dari Figma. Link ini hanya aktif 7 hari.
// Export gambarnya dari Figma, simpan di public/images/,
// lalu ganti jadi "/images/banner-register.png" dan "/images/shield.png".
const BANNER_IMAGE =
  "https://www.figma.com/api/mcp/asset/4077e992-3d75-4daf-a490-64853afa9fd2.png";
const SHIELD_IMAGE =
  "https://www.figma.com/api/mcp/asset/1a363bd7-d74c-451e-bce3-0917faf1b487.png";

const JURUSAN = [
  { value: "PPLG", label: "PPLG - Pengembangan Perangkat Lunak dan Gim" },
  { value: "MPLB", label: "MPLB - Manajemen Perkantoran dan Layanan Bisnis" },
  { value: "PM", label: "PM - Pemasaran" },
];

function Icon({ children, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

const icons = {
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  hash: (
    <>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  book: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nama: "",
    nisn: "",
    email: "",
    whatsapp: "",
    jurusan: "",
    password: "",
    konfirmasi: "",
  });
  const [pesan, setPesan] = useState({ text: "", type: "error" });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPesan({ text: "", type: "error" });

    // Validasi di browser (API tetap memvalidasi ulang)
    if (!/^\d{10}$/.test(form.nisn)) {
      setPesan({ text: "NISN harus 10 digit angka.", type: "error" });
      return;
    }
    if (!/^(\+62|62|0)8\d{8,12}$/.test(form.whatsapp.replace(/[\s-]/g, ""))) {
      setPesan({ text: "Nomor WhatsApp tidak valid. Contoh: 0812XXXXXXXX.", type: "error" });
      return;
    }
    if (form.password.length < 8) {
      setPesan({ text: "Password minimal 8 karakter.", type: "error" });
      return;
    }
    if (form.password !== form.konfirmasi) {
      setPesan({ text: "Konfirmasi password tidak sama.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: form.nama,
          email: form.email,
          nisn: form.nisn,
          whatsapp: form.whatsapp,
          jurusan: form.jurusan,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPesan({ text: data.message || "Registrasi gagal.", type: "error" });
        return;
      }

      setPesan({ text: data.message, type: "success" });
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setPesan({ text: "Tidak dapat terhubung ke server.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`${styles.page} ${serif.variable} ${inter.variable}`}
      style={{ fontFamily: "var(--font-sans), sans-serif" }}
    >
      {/* Sisi kiri: banner */}
      <section className={styles.banner}>
        <img className={styles.bannerImage} src={BANNER_IMAGE} alt="" />
        <div className={styles.bannerOverlay} />

        <div className={styles.brand}>
          <img className={styles.crest} src={SHIELD_IMAGE} alt="" />
          <div>
            <p className={styles.brandName}>GARUDA UTAMA</p>
            <p className={styles.brandSub}>SPMB ONLINE</p>
          </div>
        </div>

        <div className={styles.welcome}>
          <span className={styles.badge}>★ PMB Gelombang I T.A 2026/2027</span>
          <h2 className={styles.headline}>Wujudkan Prestasi Global Bersama Kami.</h2>
          <p className={styles.description}>
            Sistem Penerimaan Murid Baru (SPMB). Daftarkan diri Anda hari ini
            dan jadilah bagian dari institusi pendidikan berstandar global
            dengan fasilitas modern terbaik.
          </p>
        </div>

        <div className={styles.bannerFooter}>
          <div className={styles.bannerFooterLine} />
          <div className={styles.bannerFooterText}>
            <p>Panitia SPMB Garuda Utama © 2026</p>
            <p>Hubungi Kami: (021) 555-8899</p>
          </div>
        </div>
      </section>

      {/* Sisi kanan: form */}
      <main className={styles.formSide}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1>Buat Akun SPMB</h1>
            <p>Isi formulir di bawah ini dengan lengkap untuk memulai pendaftaran Anda.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="nama">
                  Nama Lengkap<span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Icon>{icons.user}</Icon>
                  <input
                    id="nama"
                    name="nama"
                    className={styles.input}
                    type="text"
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Masukkan nama lengkap sesuai ijazah/akta..."
                    value={form.nama}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="nisn">
                  NISN (Nomor Induk Siswa Nasional)
                  <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Icon>{icons.hash}</Icon>
                  <input
                    id="nisn"
                    name="nisn"
                    className={styles.input}
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Masukkan 10 digit NISN aktif Anda..."
                    value={form.nisn}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">
                  Email<span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Icon>{icons.mail}</Icon>
                  <input
                    id="email"
                    name="email"
                    className={styles.input}
                    type="email"
                    maxLength={150}
                    autoComplete="email"
                    placeholder="contoh: nama@email.com..."
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="whatsapp">
                  Nomor WhatsApp<span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Icon>{icons.phone}</Icon>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    className={styles.input}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Contoh: 0812XXXXXXXX..."
                    value={form.whatsapp}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="jurusan">
                  Pilih Jurusan<span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Icon>{icons.book}</Icon>
                  <select
                    id="jurusan"
                    name="jurusan"
                    className={`${styles.input} ${styles.select}`}
                    value={form.jurusan}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      -- Pilih Jurusan yang Diminati --
                    </option>
                    {JURUSAN.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                  <span className={styles.chevron}>
                    <Icon size={16}>{icons.chevron}</Icon>
                  </span>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="password">
                    Password<span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <Icon>{icons.lock}</Icon>
                    <input
                      id="password"
                      name="password"
                      className={styles.input}
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="konfirmasi">
                    Konfirmasi Password<span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <Icon>{icons.shieldCheck}</Icon>
                    <input
                      id="konfirmasi"
                      name="konfirmasi"
                      className={styles.input}
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={form.konfirmasi}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {pesan.text && (
              <p
                className={`${styles.message} ${
                  pesan.type === "success" ? styles.success : styles.error
                }`}
                role="alert"
              >
                {pesan.text}
              </p>
            )}

            <div className={styles.cta}>
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? "Memproses..." : "Daftar Sekarang"}
              </button>
              <div className={styles.login}>
                <span>Sudah punya akun?</span>
                <Link href="/login">Masuk di sini</Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}