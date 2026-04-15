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

db.serialize(() => {
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

    db.run(`
        CREATE TABLE IF NOT EXISTS user_watchlist (
            id_watchlist INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            media_type TEXT NOT NULL,
            media_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            poster_path TEXT,
            release_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id_users) ON DELETE CASCADE,
            UNIQUE(user_id, media_type, media_id)
        )
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_watchlist_user
        ON user_watchlist(user_id)
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS user_recently_watched (
            id_history INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            media_type TEXT NOT NULL,
            media_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            poster_path TEXT,
            release_date TEXT,
            watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id_users) ON DELETE CASCADE,
            UNIQUE(user_id, media_type, media_id)
        )
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_recently_watched_user
        ON user_recently_watched(user_id, watched_at DESC)
    `);
});


module.exports = db;