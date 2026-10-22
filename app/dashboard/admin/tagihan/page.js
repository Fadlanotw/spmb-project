"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, CheckCircle2, Clock3, ExternalLink, Save, XCircle } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import s from "./page.module.css";

const INITIAL_SETTINGS = {
  aktif: false,
  nominal: 0,
  namaBank: "",
  nomorRekening: "",
  namaPemilik: "",
  instruksi: "",
};
const INITIAL_GATEWAY = { siap: false, lingkungan: "sandbox" };

const STATUS_LABEL = {
  belum_bayar: "Belum bayar",
  menunggu_pembayaran: "Menunggu pembayaran",
  menunggu_verifikasi: "Menunggu verifikasi",
  kadaluarsa: "Kedaluwarsa",
  ditolak: "Ditolak",
  lunas: "Lunas",
};

const FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "menunggu_pembayaran", label: "Menunggu pembayaran" },
  { value: "menunggu_verifikasi", label: "Menunggu" },
  { value: "belum_bayar", label: "Belum bayar" },
  { value: "kadaluarsa", label: "Kedaluwarsa" },
  { value: "ditolak", label: "Ditolak" },
  { value: "lunas", label: "Lunas" },
];

function currency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function AdminTagihanPage() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [gateway, setGateway] = useState(INITIAL_GATEWAY);
  const [filter, setFilter] = useState("menunggu_verifikasi");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const response = await fetch("/api/admin/tagihan");
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal memuat tagihan.");
    setSettings(result.pengaturan);
    setInvoices(result.tagihan);
    setSummary(result.ringkasan);
    setGateway(result.gateway || INITIAL_GATEWAY);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/tagihan")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat tagihan.");
        if (cancelled) return;
        setSettings(result.pengaturan);
        setInvoices(result.tagihan);
        setSummary(result.ringkasan);
        setGateway(result.gateway || INITIAL_GATEWAY);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  async function saveSettings(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/tagihan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, nominal: Number(settings.nominal) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan pengaturan.");
      setMessage(result.message);
      await loadData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function verify(invoice, action) {
    let catatan = "";
    if (action === "ditolak") {
      catatan = window.prompt("Tuliskan alasan penolakan agar siswa dapat memperbaiki pembayaran:");
      if (catatan === null) return;
      if (!catatan.trim()) {
        setError("Catatan penolakan wajib diisi.");
        return;
      }
    }
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/tagihan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoice.id, action, catatan }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal memproses pembayaran.");
      setMessage(result.message);
      await loadData();
    } catch (verifyError) {
      setError(verifyError.message);
    }
  }

  const visibleInvoices = invoices.filter((invoice) => filter === "semua" || invoice.status === filter);

  return (
    <AdminShell breadcrumb="Tagihan Pembayaran">
      <div className={s.page}>
        <header className={s.heading}>
          <div>
            <p className={s.eyebrow}>PENERIMAAN MURID BARU · KEUANGAN</p>
            <h1>Tagihan &amp; Pembayaran</h1>
            <p>Atur biaya pendaftaran dan pantau pembayaran calon siswa.</p>
          </div>
          <span className={`${s.gatewayBadge} ${gateway.siap ? s.gatewayReady : s.gatewayPending}`}><span /> Midtrans {gateway.siap ? `aktif · ${gateway.lingkungan}` : "belum dikonfigurasi"}</span>
        </header>

        {error && <p className={s.error} role="alert">{error}</p>}
        {message && <p className={s.message} role="status">{message}</p>}

        <section className={s.summary} aria-label="Ringkasan tagihan">
          <article><span className={s.summaryIcon}><Banknote size={18} /></span><div><small>TOTAL TAGIHAN</small><strong>{summary.total || 0}</strong></div></article>
          <article><span className={`${s.summaryIcon} ${s.waitIcon}`}><Clock3 size={18} /></span><div><small>MENUNGGU BAYAR</small><strong>{summary.menungguPembayaran || 0}</strong></div></article>
          <article><span className={`${s.summaryIcon} ${s.paidIcon}`}><CheckCircle2 size={18} /></span><div><small>PEMBAYARAN LUNAS</small><strong>{summary.lunas || 0}</strong></div></article>
          <article><span className={`${s.summaryIcon} ${s.rejectedIcon}`}><XCircle size={18} /></span><div><small>DITOLAK</small><strong>{summary.ditolak || 0}</strong></div></article>
        </section>

        <form className={s.card} onSubmit={saveSettings}>
          <div className={s.cardHeading}>
            <div>
              <h2>Pengaturan pembayaran online</h2>
              <p>Siswa dapat membayar dengan QRIS atau Virtual Account BCA, BNI, BRI, Permata, dan CIMB. Tagihan dibuat setelah enam dokumen lengkap; nominal tagihan yang sudah terbit tidak berubah.</p>
            </div>
            <label className={s.toggle}>
              <input type="checkbox" checked={settings.aktif} onChange={(event) => updateSetting("aktif", event.target.checked)} />
              <span>{settings.aktif ? "Pembayaran dibuka" : "Pembayaran ditutup"}</span>
            </label>
          </div>
          <div className={s.fields}>
            <label className={s.field}>
              <span>Nominal tagihan (rupiah)</span>
              <input type="number" min="0" step="1000" value={settings.nominal} onChange={(event) => updateSetting("nominal", event.target.value)} required />
            </label>
          </div>
          <div className={s.formFooter}>
            <p>{gateway.siap ? `Midtrans berjalan di lingkungan ${gateway.lingkungan}. Status pembayaran akan dikonfirmasi otomatis oleh Midtrans.` : "Atur MIDTRANS_SERVER_KEY dan MIDTRANS_IS_PRODUCTION di environment server, lalu daftarkan endpoint notifikasi Midtrans."}</p>
            <button type="submit" disabled={saving}><Save size={15} />{saving ? "Menyimpan..." : "Simpan pengaturan"}</button>
          </div>
        </form>

        <section className={s.card}>
          <div className={s.cardHeading}>
            <div><h2>Daftar tagihan</h2><p>Pantau status transaksi online dan tinjau bukti pembayaran manual lama jika ada.</p></div>
          </div>
          <div className={s.filters} aria-label="Filter tagihan">
            {FILTERS.map((item) => (
              <button key={item.value} type="button" className={filter === item.value ? s.filterActive : ""} onClick={() => setFilter(item.value)}>
                {item.label}{item.value !== "semua" && <span>{summary[item.value === "menunggu_verifikasi" ? "menungguVerifikasi" : item.value === "menunggu_pembayaran" ? "menungguPembayaran" : item.value === "belum_bayar" ? "belumBayar" : item.value] || 0}</span>}
              </button>
            ))}
          </div>
          {loading ? <p className={s.empty}>Memuat data tagihan...</p> : visibleInvoices.length === 0 ? (
            <p className={s.empty}>Belum ada tagihan pada kategori ini.</p>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead><tr><th>CALON SISWA</th><th>NOMINAL</th><th>STATUS</th><th>BUKTI MANUAL</th><th>AKSI</th></tr></thead>
                <tbody>
                  {visibleInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><strong>{invoice.nama}</strong><small>{invoice.email}</small></td>
                      <td>{currency(invoice.nominal)}</td>
                      <td><span className={`${s.status} ${s[invoice.status]}`}>{STATUS_LABEL[invoice.status]}</span>{invoice.catatanAdmin && <small className={s.note}>Catatan: {invoice.catatanAdmin}</small>}</td>
                      <td>{invoice.buktiUrl ? <a className={s.proofLink} href={invoice.buktiUrl} target="_blank" rel="noreferrer">Lihat bukti <ExternalLink size={13} /></a> : <span className={s.muted}>Belum dikirim</span>}</td>
                      <td>
                        {invoice.status === "menunggu_verifikasi" ? (
                          <div className={s.actions}>
                            <button type="button" className={s.approve} onClick={() => verify(invoice, "lunas")}>Setujui</button>
                            <button type="button" className={s.reject} onClick={() => verify(invoice, "ditolak")}>Tolak</button>
                          </div>
                        ) : <span className={s.muted}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && invoices.length >= 500 && <p className={s.limitNotice}>Daftar dibatasi 500 tagihan terbaru.</p>}
        </section>
      </div>
    </AdminShell>
  );
}
