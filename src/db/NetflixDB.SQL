/*sqlite3 NetflixLight.db*/

CREATE TABLE IF NOT EXISTS users (
    id_users INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    pseudo TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
);

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
);

