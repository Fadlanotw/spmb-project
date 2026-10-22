// Koneksi MySQL (Laragon). Jika project kamu sudah punya lib/db.js yang berfungsi, PAKAI YANG LAMA.
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "spmb",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
