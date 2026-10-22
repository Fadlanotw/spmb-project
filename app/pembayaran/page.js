import KepsekShell from "../KepsekShell";
import PembayaranTable from "../../_components/PembayaranTable";

export default function Page() {
  return (
    <KepsekShell title="Monitoring Pembayaran">
      <PembayaranTable
        judul="Monitoring Pembayaran"
        deskripsi="Pantau status pembayaran seluruh calon siswa (hanya lihat)."
      />
    </KepsekShell>
  );
}