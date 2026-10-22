"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, Check, CheckCircle2, Clock3, Copy, FileCheck2, ShieldCheck, QrCode, XCircle } from "lucide-react";
import StudentShell from "../StudentShell";
import styles from "../student-pages.module.css";
import s from "./page.module.css";

const STATUS = {
  belum_bayar: { label: "Belum dibayar", className: s.unpaid, Icon: Clock3 },
  menunggu_pembayaran: { label: "Menunggu pembayaran", className: s.pending, Icon: Clock3 },
  menunggu_verifikasi: { label: "Menunggu verifikasi", className: s.pending, Icon: Clock3 },
  ditolak: { label: "Perlu pembayaran ulang", className: s.rejected, Icon: XCircle },
  kadaluarsa: { label: "Tagihan kedaluwarsa", className: s.rejected, Icon: Clock3 },
  lunas: { label: "Pembayaran terverifikasi", className: s.paid, Icon: CheckCircle2 },
};

const BANKS = [
  { code: "bca", name: "BCA" },
  { code: "bni", name: "BNI" },
  { code: "bri", name: "BRI" },
  { code: "permata", name: "Permata" },
  { code: "cimb", name: "CIMB Niaga" },
];

function currency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function dateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TagihanSiswaPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("qris");
  const [bank, setBank] = useState("bca");
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadInvoice() {
    const response = await fetch("/api/siswa/tagihan");
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal memuat tagihan.");
    setData(result);
  }

  async function refreshPaymentStatus() {
    const response = await fetch("/api/siswa/tagihan/payment");
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal memeriksa status pembayaran.");
    if (result.transaction) {
      const invoiceStatus = result.transaction.status === "settlement" || result.transaction.status === "capture"
        ? "lunas"
        : result.transaction.status === "expire"
          ? "kadaluarsa"
          : result.transaction.status === "pending"
            ? "menunggu_pembayaran"
            : "belum_bayar";
      setData((current) => current?.invoice
        ? { ...current, invoice: { ...current.invoice, status: invoiceStatus, transaction: result.transaction } }
        : current);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/siswa/tagihan")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat tagihan.");
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

  const transaction = data?.invoice?.transaction;

  useEffect(() => {
    if (transaction?.status !== "pending") return undefined;
    const interval = window.setInterval(() => {
      refreshPaymentStatus().catch((statusError) => {
        console.error("Refresh payment status error:", statusError);
      });
    }, 10000);
    return () => window.clearInterval(interval);
  }, [transaction?.status, transaction?.orderId]);

  async function startPayment() {
    setError("");
    setMessage("");
    setPaying(true);
    try {
      const response = await fetch("/api/siswa/tagihan/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, bank }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal membuat pembayaran.");
      setData((current) => current?.invoice
        ? { ...current, invoice: { ...current.invoice, status: "menunggu_pembayaran", transaction: result.transaction } }
        : current);
      setMessage(result.reused ? "Pembayaran yang masih aktif ditemukan." : "Instruksi pembayaran berhasil dibuat.");
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      setPaying(false);
    }
  }

  async function copyPaymentCode(value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error("Copy payment code error:", copyError);
      setError("Nomor pembayaran tidak dapat disalin. Silakan salin secara manual.");
    }
  }

  const invoice = data?.invoice;
  const status = invoice ? STATUS[invoice.status] : null;
  const invoiceCanPay = invoice && ["belum_bayar", "ditolak", "kadaluarsa"].includes(invoice.status);
  const canPay = Boolean(data?.configured && data?.gatewayReady && invoiceCanPay && transaction?.status !== "pending");
  const canSelectMethod = Boolean(data?.configured && data?.gatewayReady && invoiceCanPay && transaction?.status !== "pending");
  const paymentPending = transaction?.status === "pending";

  return (
    <StudentShell title="Tagihan Pembayaran">
      <div className={`${styles.page} ${s.page}`}>
        <div className={styles.pageHeading}>
          <div>
            <p className={styles.eyebrow}>TAHAP 4 · PEMBAYARAN</p>
            <h1>Tagihan Pembayaran</h1>
            <p>Pilih metode pembayaran, selesaikan transaksi, dan pantau status pembayaran Anda.</p>
          </div>
          {status && <span className={`${s.status} ${status.className}`}><status.Icon size={14} />{status.label}</span>}
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {message && <p className={`${styles.message} ${styles.success}`} role="status">{message}</p>}

        {loading ? <div className={styles.formPanel}>Memuat informasi tagihan...</div> : !data ? (
          <section className={s.notice}>
            <span><XCircle size={20} /></span>
            <div>
              <h2>Informasi tagihan belum dapat dimuat</h2>
              <p>{error || "Silakan muat ulang halaman atau hubungi panitia."}</p>
            </div>
          </section>
        ) : !data.eligible ? (
          <div className={s.preCheckout}>
            <section className={s.notice}>
              <span><FileCheck2 size={20} /></span>
              <div>
                <h2>Lengkapi dokumen persyaratan terlebih dahulu</h2>
                <p>Setelah enam dokumen wajib diunggah, Anda dapat melanjutkan ke pembayaran.</p>
                <Link href="/dashboard/calon-siswa/berkas">Buka menu upload berkas <ArrowLeft size={14} /></Link>
              </div>
            </section>
            <aside className={s.orderSummary}>
              <div className={s.summaryHeading}><span><Banknote size={18} /></span><h2>Biaya pendaftaran</h2></div>
              {data.pengaturan.nominal > 0 ? (
                <>
                  <p className={s.productName}>Pendaftaran siswa baru<br /><small>Tahun ajaran 2026/2027</small></p>
                  <div className={s.summaryTotal}><span>Total pembayaran</span><strong>{currency(data.pengaturan.nominal)}</strong></div>
                  <p className={s.secureNote}>Metode pembayaran tersedia setelah berkas Anda lengkap.</p>
                </>
              ) : <p className={s.notConfigured}>Biaya pendaftaran akan ditampilkan setelah ditetapkan oleh panitia.</p>}
            </aside>
          </div>
        ) : !invoice ? (
          <section className={s.notice}>
            <span><Clock3 size={20} /></span>
            <div>
              <h2>Tagihan belum tersedia</h2>
              {data.pengaturan.nominal > 0 && <p className={s.unavailableAmount}>Biaya pendaftaran: <strong>{currency(data.pengaturan.nominal)}</strong></p>}
              <p>{data?.pengaturan?.aktif ? "Pengaturan tagihan belum lengkap. Hubungi panitia untuk informasi lebih lanjut." : "Panitia belum membuka pembayaran. Silakan cek kembali setelah menerima informasi dari sekolah."}</p>
            </div>
          </section>
        ) : (
          <div className={s.checkout}>
            <div className={s.checkoutMain}>
              {paymentPending ? (
                <section className={s.checkoutCard}>
                  <div className={s.sectionHeading}>
                    <span className={s.stepNumber}><CheckCircle2 size={14} /></span>
                    <div><h2>Selesaikan pembayaran</h2><p>Ikuti instruksi berikut. Status akan diperbarui otomatis setelah pembayaran diterima.</p></div>
                  </div>
                  {transaction.method === "qris" ? (
                    <div className={s.qrPayment}>
                      <div className={s.qrFrame}>
                        {transaction.qrUrl ? <img src={transaction.qrUrl} alt="QRIS pembayaran Midtrans" /> : <QrCode size={80} />}
                      </div>
                      <strong>Pindai QRIS untuk membayar</strong>
                      <p>Buka aplikasi mobile banking atau e-wallet yang mendukung QRIS, lalu pindai kode di atas.</p>
                    </div>
                  ) : (
                    <div className={s.vaPayment}>
                      <div className={s.vaBank}>{BANKS.find((item) => item.code === transaction.bank)?.name || transaction.bank?.toUpperCase()} VIRTUAL ACCOUNT</div>
                      <small>NOMOR VIRTUAL ACCOUNT</small>
                      <div className={s.vaCode}>
                        <strong>{transaction.paymentCode || "Menyiapkan nomor VA..."}</strong>
                        {transaction.paymentCode && <button type="button" onClick={() => copyPaymentCode(transaction.paymentCode)} aria-label="Salin nomor Virtual Account">{copied ? <Check size={15} /> : <Copy size={15} />}</button>}
                      </div>
                      {copied && <span className={s.copied}>Nomor VA disalin</span>}
                      <p>Bayar melalui ATM, mobile banking, atau internet banking. Pilih menu Virtual Account dan masukkan nomor di atas.</p>
                    </div>
                  )}
                  <div className={s.paymentMeta}>
                    <span>Nominal pembayaran</span><strong>{currency(invoice.nominal)}</strong>
                    {transaction.expiresAt && <><span>Batas pembayaran</span><strong>{dateTime(transaction.expiresAt)}</strong></>}
                    <span>Status</span><strong className={s.awaiting}><Clock3 size={13} /> Menunggu pembayaran</strong>
                  </div>
                  {transaction.redirectUrl && <a className={s.redirectButton} href={transaction.redirectUrl} target="_blank" rel="noreferrer">Buka halaman pembayaran Midtrans</a>}
                  <button className={s.refreshButton} type="button" onClick={() => refreshPaymentStatus().catch((statusError) => setError(statusError.message))}>Saya sudah membayar · periksa status</button>
                </section>
              ) : invoice.status === "lunas" ? (
                <section className={s.paidPanel}>
                  <CheckCircle2 size={28} />
                  <div><h2>Pembayaran berhasil</h2><p>Pembayaran Anda sudah dikonfirmasi. Terima kasih.</p></div>
                </section>
              ) : (
                <section className={s.checkoutCard}>
                  <div className={s.sectionHeading}>
                    <span className={s.stepNumber}>1</span>
                    <div><h2>Pilih metode pembayaran</h2><p>Pembayaran online aman diproses oleh Midtrans.</p></div>
                  </div>
                  <button type="button" className={`${s.methodOption} ${method === "qris" ? s.methodSelected : ""}`} onClick={() => setMethod("qris")} disabled={!canSelectMethod}>
                    <span className={s.radioMark}>{method === "qris" && <span />}</span>
                    <span className={s.qrisMark}>QRIS</span>
                    <span className={s.methodCopy}><strong>QRIS</strong><small>Scan &amp; bayar dari mobile banking atau e-wallet</small></span>
                  </button>
                  <button type="button" className={`${s.methodOption} ${method === "virtual_account" ? s.methodSelected : ""}`} onClick={() => setMethod("virtual_account")} disabled={!canSelectMethod}>
                    <span className={s.radioMark}>{method === "virtual_account" && <span />}</span>
                    <span className={s.vaMark}><Banknote size={18} /></span>
                    <span className={s.methodCopy}><strong>Virtual Account</strong><small>Transfer otomatis melalui rekening bank</small></span>
                  </button>
                  {method === "virtual_account" && (
                    <div className={s.bankChoices} aria-label="Pilih bank Virtual Account">
                      {BANKS.map((item) => <button type="button" key={item.code} className={bank === item.code ? s.bankActive : ""} onClick={() => setBank(item.code)} disabled={!canSelectMethod}>{item.name}</button>)}
                    </div>
                  )}
                  {!data.gatewayReady && <p className={s.gatewayNotice}>Pembayaran online belum aktif. Silakan hubungi panitia untuk informasi lebih lanjut.</p>}
                  {invoice.status === "kadaluarsa" && <p className={s.gatewayNotice}>Transaksi sebelumnya sudah kedaluwarsa. Buat pembayaran baru untuk mendapatkan kode bayar baru.</p>}
                  {invoice.status === "menunggu_verifikasi" && <p className={s.gatewayNotice}>Bukti transfer manual sedang diverifikasi panitia.</p>}
                  <div className={s.selectionFooter}>
                    <ShieldCheck size={15} />
                    <span>Status pembayaran akan diperbarui otomatis setelah pembayaran berhasil.</span>
                    <button className={styles.primaryButton} type="button" onClick={startPayment} disabled={!canPay || paying}>
                      {paying ? "Menyiapkan..." : "Bayar sekarang"}
                    </button>
                  </div>
                </section>
              )}
            </div>

            <aside className={s.orderSummary}>
              <div className={s.summaryHeading}><span><Banknote size={18} /></span><h2>Rincian pembayaran</h2></div>
              <p className={s.productName}>Pendaftaran siswa baru<br /><small>Tahun ajaran 2026/2027</small></p>
              <div className={s.summaryLine}><span>Biaya pendaftaran</span><strong>{currency(invoice.nominal)}</strong></div>
              <div className={s.summaryLine}><span>Biaya layanan sekolah</span><strong>{currency(0)}</strong></div>
              <div className={s.summaryTotal}><span>Total pembayaran</span><strong>{currency(invoice.nominal)}</strong></div>
              <p className={s.invoiceRef}>ID tagihan #{invoice.id}</p>
              <p className={s.secureNote}><ShieldCheck size={15} /> Pembayaran diproses aman oleh Midtrans. Status lunas dikirim otomatis.</p>
            </aside>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
