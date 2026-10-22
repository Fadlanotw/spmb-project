import AdminShell from '../_components/AdminShell';
import DataPendaftarView from './DataPendaftarView';

export default function DataPendaftarPage() {
  return (
    // Jika punya file logo di folder public, tambahkan: logoSrc="/nama-logo.png"
    <AdminShell breadcrumb="Data Pendaftar">
      <DataPendaftarView />
    </AdminShell>

  );
}