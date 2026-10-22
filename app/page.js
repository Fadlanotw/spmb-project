import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  UserRoundPlus,
} from "lucide-react";
import styles from "./landing.module.css";

const steps = [
  {
    number: "01",
    icon: UserRoundPlus,
    title: "Buat akun",
    description: "Daftar dengan email aktif untuk memulai proses penerimaan.",
  },
  {
    number: "02",
    icon: FileText,
    title: "Lengkapi berkas",
    description: "Isi biodata dan unggah dokumen persyaratan secara online.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Ikuti seleksi",
    description: "Pantau jadwal tes dan pengumuman melalui akun Anda.",
  },
];

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Garuda Utama, beranda">
          <span className={styles.logoFrame}>
            <img src="/avatars/logo.png" alt="" className={styles.logo} />
          </span>
          <span className={styles.brandText}>
            <strong>GARUDA UTAMA</strong>
            <span>PENERIMAAN MURID BARU</span>
          </span>
        </Link>

        <nav className={styles.navigation} aria-label="Navigasi utama">
          <a href="#tentang">Tentang SPMB</a>
          <a href="#alur">Alur pendaftaran</a>
        </nav>

        <div className={styles.headerActions}>
          <Link href="/login" className={styles.loginLink}>
            Masuk
          </Link>
          <Link href="/register" className={styles.headerCta}>
            Daftar sekarang <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className={styles.hero} id="tentang">
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            SPMB TAHUN AJARAN 2026/2027
          </div>
          <h1>
            Awali masa depan
            <br />
            <span>gemilangmu</span> di sini.
          </h1>
          <p className={styles.heroDescription}>
            Setiap langkah besar dimulai dari pilihan yang tepat. Bergabunglah
            bersama keluarga besar Garuda Utama dan tumbuh menjadi generasi
            berprestasi.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className={styles.primaryButton}>
              Mulai pendaftaran <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href="#alur" className={styles.secondaryButton}>
              Lihat alur <ChevronRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className={styles.trustNote}>
            <span className={styles.trustIcon}>
              <CheckCircle2 size={16} aria-hidden="true" />
            </span>
            Pendaftaran mudah, aman, dan bisa dilakukan dari mana saja
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Informasi SPMB Garuda Utama">
          <div className={styles.visualGlow} />
          <div className={styles.visualPattern} />
          <div className={styles.visualTopline}>
            <span className={styles.visualMark}>
              <GraduationCap size={18} aria-hidden="true" />
            </span>
            <span>GERBANG MASA DEPAN</span>
            <span className={styles.liveDot} />
          </div>
          <div className={styles.crestWrap}>
            <div className={styles.crestHalo} />
            <img src="/avatars/logo.png" alt="Lambang Garuda Utama" className={styles.heroLogo} />
          </div>
          <div className={styles.visualTitle}>
            <span>Selamat datang di</span>
            <strong>Garuda Utama</strong>
          </div>
          <div className={styles.visualBottom}>
            <div>
              <span className={styles.visualLabel}>TAHUN AJARAN</span>
              <strong>2026 <i>/</i> 2027</strong>
            </div>
            <span className={styles.visualArrow}>
              <ArrowRight size={19} aria-hidden="true" />
            </span>
          </div>
          <div className={styles.floatingNote}>
            <span className={styles.bookIcon}>
              <BookOpen size={19} aria-hidden="true" />
            </span>
            <span>
              <strong>Langkah awalmu</strong>
              <small>menuju cita-cita</small>
            </span>
          </div>
        </div>
      </section>

      <section className={styles.process} id="alur">
        <div className={styles.processHeading}>
          <div>
            <span className={styles.sectionEyebrow}>MULAI DARI SINI</span>
            <h2>Tiga langkah menuju Garuda Utama</h2>
          </div>
          <p>
            Proses pendaftaran dirancang sederhana supaya kamu bisa fokus
            menyiapkan masa depan.
          </p>
        </div>
        <div className={styles.steps}>
          {steps.map(({ number, icon: Icon, title, description }) => (
            <article className={styles.step} key={number}>
              <div className={styles.stepTop}>
                <span className={styles.stepIcon}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className={styles.stepNumber}>{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 Garuda Utama</span>
        <span>Sistem Penerimaan Murid Baru</span>
      </footer>
    </main>
  );
}
