const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "db", "NetflixLight.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erreur DB :", err);
    } else {
        console.log("Connecté à SQLite");
    }
});
console.log("DB path:", dbPath);

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id_users INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        pseudo TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

module.exports = db;