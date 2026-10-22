import "./globals.css";

export const metadata = {
  title: "SPMB Garuda Utama | Tahun Ajaran 2026/2027",
  description:
    "Pendaftaran murid baru Garuda Utama tahun ajaran 2026/2027. Daftar, lengkapi berkas, dan pantau proses seleksi secara online.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
