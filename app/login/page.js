"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Instrument_Serif, Inter } from "next/font/google";
import styles from "./login.module.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Gambar banner dari Figma. Link ini hanya aktif 7 hari.
const BANNER_IMAGE =
  "https://www.figma.com/api/mcp/asset/2c6a819b-bf06-4c5e-b102-18753de71fad.png";
const SHIELD_IMAGE = "/avatars/logo.png";

function Icon({ children }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setPesan("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPesan(data.message || "Login gagal.");
        return;
      }

      if (data.user.role === "calon_siswa") {
        router.push("/dashboard/calon-siswa");
      } else if (data.user.role === "admin") {
        router.push("/dashboard/admin");
      } else if (data.user.role === "kepsek") {
        router.push("/dashboard/kepsek");
      } else {
        setPesan("Role akun tidak dikenali.");
        return;
      }

      router.refresh();
    } catch {
      setPesan("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${styles.page} ${serif.variable} ${inter.variable}`} style={{ fontFamily: "var(--font-sans), sans-serif" }}>
      {/* Sisi kiri: banner */}
      <section className={styles.banner}>
        <img className={styles.bannerImage} src={BANNER_IMAGE} alt="" />
        <div className={styles.bannerOverlay} />

        <div className={styles.bannerContent}>
          <div className={styles.brand}>
            <img className={styles.crest} src={SHIELD_IMAGE} alt="" />
            <div>
              <p className={styles.brandName}>GARUDA UTAMA</p>
              <p className={styles.brandSub}>SPMB ONLINE</p>
            </div>
          </div>
          <h2 className={styles.headline}>Mulai Langkah Emas Anda di Sini.</h2>
        </div>

        <p className={styles.description}>
          Sistem Penerimaan Murid Baru (SPMB) Tahun Ajaran 2026/2027.
          Bergabunglah dengan komunitas akademik terbaik untuk masa depan
          gemilang.
        </p>

        <div className={styles.bannerFooter}>
          <p>Panitia SPMB Garuda Utama © 2026</p>
          <p>Layanan Informasi: (021) 555-8899</p>
        </div>
      </section>

      {/* Sisi kanan: form login */}
      <main className={styles.formSide}>
        <div className={styles.formIntro}>
          <div className={styles.loginBrand}>
            <img src="/avatars/logo.png" alt="Logo Garuda Utama" />
            <span>GARUDA UTAMA</span>
          </div>
          <div className={styles.formHeader}>
            <h1>Selamat Datang</h1>
            <p>Silakan masuk ke akun pendaftaran Anda.</p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <div className={styles.inputWrap}>
              <Icon>
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </Icon>
              <input
                id="email"
                className={styles.input}
                type="email"
                autoComplete="email"
                placeholder="Masukkan email resmi Anda..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <a className={styles.forgot} href="#">
                Lupa Password?
              </a>
            </div>
            <div className={styles.inputWrap}>
              <Icon>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </Icon>
              <input
                id="password"
                className={styles.input}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <Icon>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </Icon>
                ) : (
                  <Icon>
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </Icon>
                )}
              </button>
            </div>
          </div>

          {pesan && (
            <p className={styles.error} role="alert">
              {pesan}
            </p>
          )}

          <div className={styles.cta}>
            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Masuk Sekarang"}
            </button>
            <div className={styles.register}>
              <span>Belum punya akun?</span>
              <Link href="/register">Daftar Sekarang</Link>
            </div>
          </div>
        </form>

        <div className={styles.divider}>ATAU</div>

        <button type="button" className={styles.google}>
          <Icon>
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </Icon>
          Masuk dengan Akun Google
        </button>
      </main>
    </div>
  );
}