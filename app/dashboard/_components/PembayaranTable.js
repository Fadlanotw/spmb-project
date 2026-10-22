"use client";

import { useEffect, useState } from "react";

const LABEL = {
  belum_bayar: "Belum dibayar",
  menunggu_pembayaran: "Menunggu pembayaran",
  menunggu_verifikasi: "Menunggu verifikasi",
  ditolak: "Ditolak",
  kadaluarsa: "Kedaluwarsa",
  lunas: "Lunas",
};
const WARNA = {
  lunas: ["#dcfce7", "#15803d"],
  menunggu_verifikasi: ["#fef3c7", "#b45309"],
  menunggu_pembayaran: ["#fef3c7", "#b45309"],
  ditolak: ["#fee2e2", "#b91c1c"],
  kadaluarsa: ["#fee2e2", "#b91c1c"],
  belum_bayar: ["#f1f5f9", "#475569"],
};
const JURUSAN = {
  PPLG: "PPLG (RPL)",
  MPLB: "MPLB (Layanan Bisnis)",
  PM: "Pemasaran (BDR)",
};
const rupiah = (v) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

export default function PembayaranTable({ judul, deskripsi }) {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("semua");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/pembayaran");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setData(json);
    } catch (e) {
      setError(e.message || "Gagal memuat data.");
    }
  }
  useEffect(() => { load(); }, []);

  async function proses(id, aksi) {
    let catatan = "";
    if (aksi === "tolak") {
      catatan = window.prompt("Alasan penolakan:") || "";
      if (!catatan.trim()) return;
    } else if (!window.confirm("Verifikasi pembayaran ini sebagai LUNAS?")) return;

    setBusyId(id);
    const res = await fetch(`/api/admin/pembayaran/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi, catatan }),
    });
    const json = await res.json();
    setBusyId(null);
    setError(res.ok ? "" : json.message);
    load();
  }

  if (error && !data) return <p style={{ padding: 24, color: "#b91c1c" }}>{error}</p>;
  if (!data) return <p style={{ padding: 24 }}>Memuat data pembayaran...</p>;

  const s = data.summary;
  const cards = [
    ["Total pemasukan", rupiah(s.pemasukan)],
    ["Lunas", s.lunas],
    ["Menunggu verifikasi", s.verifikasi],
    ["Belum bayar", s.belum],
    ["Ditolak / kedaluwarsa", s.gagal],
  ];
  const items = data.items.filter((i) => filter === "semua" || i.status === filter);

  return (
    <div style={{ padding: 24, display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "serif", fontSize: 32, margin: 0 }}>{judul}</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0" }}>{deskripsi}</p>
      </div>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {cards.map(([t, v]) => (
          <div key={t} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16 }}>
            <small style={{ color: "#64748b", textTransform: "uppercase" }}>{t}</small>
            <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["semua", "menunggu_verifikasi", "lunas", "belum_bayar", "ditolak"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px", borderRadius: 999, border: "1px solid #cbd5e1", cursor: "pointer",
              background: filter === f ? "#0f2347" : "#fff", color: filter === f ? "#fff" : "#334155",
            }}
          >
            {f === "semua" ? "Semua" : LABEL[f]}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>
              {["Nama", "Jurusan", "Nominal", "Metode", "Bukti", "Status", ...(data.canApprove ? ["Aksi"] : [])].map((h) => (
                <th key={h} style={{ padding: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>Belum ada data.</td></tr>
            )}
            {items.map((i) => {
              const [bg, fg] = WARNA[i.status] || WARNA.belum_bayar;
              return (
                <tr key={i.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                  <td style={{ padding: 12 }}>
                    <strong>{i.nama}</strong><br /><small style={{ color: "#94a3b8" }}>{i.nisn}</small>
                  </td>
                  <td>{JURUSAN[i.jurusan] || i.jurusan || "-"}</td>
                  <td>{rupiah(i.nominal)}</td>
                  <td>{i.metode}</td>
                  <td>
                    {i.adaBukti
                      ? <a href={`/api/admin/pembayaran/${i.id}/bukti`} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>Lihat</a>
                      : "-"}
                  </td>
                  <td>
                    <span style={{ background: bg, color: fg, padding: "3px 10px", borderRadius: 999, fontSize: 12 }}>
                      {LABEL[i.status]}
                    </span>
                    {i.catatan && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>{i.catatan}</div>}
                  </td>
                  {data.canApprove && (
                    <td style={{ whiteSpace: "nowrap" }}>
                      {i.status === "menunggu_verifikasi" && (
                        <>
                          <button disabled={busyId === i.id} onClick={() => proses(i.id, "acc")}
                            style={{ background: "#16a34a", color: "#fff", border: 0, borderRadius: 8, padding: "6px 12px", marginRight: 6, cursor: "pointer" }}>
                            ACC
                          </button>
                          <button disabled={busyId === i.id} onClick={() => proses(i.id, "tolak")}
                            style={{ background: "#ef4444", color: "#fff", border: 0, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
                            Tolak
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}