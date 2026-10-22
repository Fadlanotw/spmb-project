// Membuat hash bcrypt untuk dimasukkan manual ke database (cara paling mudah untuk akun admin/kepsek).
// Pakai:  node scripts/hash-password.js PasswordKuat123
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error("Isi password minimal 8 karakter. Contoh: node scripts/hash-password.js PasswordKuat123");
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 12));
