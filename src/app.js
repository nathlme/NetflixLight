const express=require("express")
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { globalCheck } = require("./registerCheck");
const bcrypt = require("bcrypt");
const db = require("./db");
const { ComparePassword } = require("./loginCheck");
const session = require("express-session");
const fetchFromWeb = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const DEFAULT_EXTERNAL_PLAYER_DOMAIN = "https://tv.coflix.tv";


const app=express()
const PORT=3000

//  JSON -> Objet JS
app.use(express.json());
// Form HTML -> Objet JS
app.use(express.urlencoded({ extended: true }));

app.use("/static", express.static(path.join(__dirname, "..", "static")));

app.get("/manifest.webmanifest", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "static", "manifest.webmanifest"));
});

app.get("/sw.js", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "static", "sw.js"));
});

app.use(session({
    secret: "monSecretSuperFort",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true
    }
}));

// On définit HBS comme moteur de rendu
app.set('view engine', 'hbs');


// Route page detail film
app.get(["/detail", "/detail/:type/:id"], (req,res) => {
    RenderPage(req, res, "NetflixLight - Détail", "MovieDetails");
})

// Route page lecteur video
app.get(["/play", "/play/:type/:id"], (req,res) => {
    res.sendFile(path.join(__dirname,"..","static","templates","PlayerPage.html"));
})


// Route page inscription
app.get("/register",  (req, res) => {
    RenderPage(req, res, "NetflixLight - Inscription", "RegisterPage");
});

// Route page de connexion
app.get("/login", redirectIfAuth, (req, res) => {
    RenderPage(req, res, "NetflixLight - Connexion", "LoginPage");
});

//  Route accueil
app.get("/",(req,res) => {
    RenderPage(req, res, "NetflixLight", "index");
});

// Route page ma liste
app.get("/list", (req, res) => {
    RenderPage(req, res, "NetflixLight - Ma liste", "ListPage");
});

// Route backend pour TMDB
app.use('/api/tmdb/', async (req, res) => {
    try {
        const endpoint = req.path.replace(/^\//, "");
        const params = new URLSearchParams(req.query);
        const url = `https://api.themoviedb.org/3/${endpoint}?${params.toString()}`;

        const response = await fetchFromWeb(url, {
            headers: {
                Authorization: `Bearer ${process.env.API_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching TMDB:", error);
        res.status(500).json({ error: "Failed to fetch from TMDB" });
    }
});

app.get("/api/player/:type/:id/sources", async (req, res) => {
    const { type, id } = req.params;
    const providerId = req.query.providerId;
    const sourceId = String(providerId || id).trim();
    const domain = getExternalPlayerDomain();

    if (type !== "movie") {
        return res.status(400).json({
            success: false,
            message: "Seuls les films sont pris en charge pour le moment.",
            sources: []
        });
    }

    if (!sourceId) {
        return res.status(400).json({
            success: false,
            message: "Aucun identifiant fourni.",
            sources: []
        });
    }

    const decodedSources = await extractDecodedLinks(sourceId, domain);
    const sources = await resolvePlayableSources(decodedSources, domain);

    if (!sources.length) {
        return res.status(404).json({
            success: false,
            message: "Aucune source vidéo exploitable trouvée.",
            sources: []
        });
    }

    return res.json({
        success: true,
        sources
    });
});

// Route session
app.get("/profil", requireAuthPage, (req, res) => {
    RenderPage(req, res, "NetflixLight - Profil", "ProfilePage");
});

app.get("/video", (req,res) => {
    RenderPage(req, res, "NetflixLight - Lecteur", "videoPlayer");
});


app.get("/js/:filename", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "static", "javaScript", req.params.filename));
});

app.get("/api/session", (req, res) => {
    const isAuthenticated = Boolean(req.session.userId);

    return res.json({
        success: true,
        authenticated: isAuthenticated,
        user: isAuthenticated
            ? {
                id: req.session.userId,
                pseudo: req.session.pseudo
            }
            : null
    });
});

app.get("/api/list", requireAuth, (req, res) => {
    db.all(
        `
        SELECT media_type, media_id, title, poster_path, release_date, created_at
        FROM user_watchlist
        WHERE user_id = ?
        ORDER BY created_at DESC
        `,
        [req.session.userId],
        (err, rows) => {
            if (err) {
                console.error("Erreur DB liste:", err.message);
                return res.status(500).json({
                    success: false,
                    message: "Erreur lors du chargement de la liste"
                });
            }

            return res.json({
                success: true,
                items: rows || []
            });
        }
    );
});

app.get("/api/list/status/:type/:id", requireAuth, (req, res) => {
    const mediaType = normalizeMediaType(req.params.type);
    const mediaId = Number.parseInt(req.params.id, 10);

    if (!mediaType || Number.isNaN(mediaId)) {
        return res.status(400).json({
            success: false,
            message: "Type ou identifiant invalide"
        });
    }

    db.get(
        `
        SELECT 1 AS in_list
        FROM user_watchlist
        WHERE user_id = ? AND media_type = ? AND media_id = ?
        LIMIT 1
        `,
        [req.session.userId, mediaType, mediaId],
        (err, row) => {
            if (err) {
                console.error("Erreur DB status liste:", err.message);
                return res.status(500).json({
                    success: false,
                    message: "Erreur lors de la verification"
                });
            }

            return res.json({
                success: true,
                inList: Boolean(row)
            });
        }
    );
});

app.post("/api/list", requireAuth, (req, res) => {
    const mediaType = normalizeMediaType(req.body.mediaType);
    const mediaId = Number.parseInt(req.body.mediaId, 10);

    if (!mediaType || Number.isNaN(mediaId)) {
        return res.status(400).json({
            success: false,
            message: "Type ou identifiant invalide"
        });
    }

    const title = String(req.body.title || "Sans titre").trim() || "Sans titre";
    const posterPath = req.body.posterPath ? String(req.body.posterPath) : null;
    const releaseDate = req.body.releaseDate ? String(req.body.releaseDate) : null;

    db.run(
        `
        INSERT OR IGNORE INTO user_watchlist (user_id, media_type, media_id, title, poster_path, release_date)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [req.session.userId, mediaType, mediaId, title, posterPath, releaseDate],
        function (err) {
            if (err) {
                console.error("Erreur DB ajout liste:", err.message);
                return res.status(500).json({
                    success: false,
                    message: "Erreur lors de l'ajout"
                });
            }

            return res.json({
                success: true,
                added: this.changes > 0
            });
        }
    );
});

app.delete("/api/list/:type/:id", requireAuth, (req, res) => {
    const mediaType = normalizeMediaType(req.params.type);
    const mediaId = Number.parseInt(req.params.id, 10);

    if (!mediaType || Number.isNaN(mediaId)) {
        return res.status(400).json({
            success: false,
            message: "Type ou identifiant invalide"
        });
    }

    db.run(
        `
        DELETE FROM user_watchlist
        WHERE user_id = ? AND media_type = ? AND media_id = ?
        `,
        [req.session.userId, mediaType, mediaId],
        function (err) {
            if (err) {
                console.error("Erreur DB suppression liste:", err.message);
                return res.status(500).json({
                    success: false,
                    message: "Erreur lors de la suppression"
                });
            }

            return res.json({
                success: true,
                removed: this.changes > 0
            });
        }
    );
});

app.get("/api/history", requireAuth, (req, res) => {
    let limit = Number.parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit <= 0) {
        limit = 24;
    }

    if (limit > 100) {
        limit = 100;
    }

    db.all(
        `
        SELECT media_type, media_id, title, poster_path, release_date, watched_at
        FROM user_recently_watched
        WHERE user_id = ?
        ORDER BY watched_at DESC
        LIMIT ?
        `,
        [req.session.userId, limit],
        (err, rows) => {
            if (err) {
                console.error("Erreur DB historique:", err.message);
                return res.status(500).json({
                    success: false,
                    message: "Erreur lors du chargement de l'historique"
                });
            }

            return res.json({
                success: true,
                items: rows || []
            });
        }
    );
});

app.post("/api/history", requireAuth, (req, res) => {
    const mediaType = normalizeMediaType(req.body.mediaType);
    const mediaId = Number.parseInt(req.body.mediaId, 10);

    if (!mediaType || Number.isNaN(mediaId)) {
        return res.status(400).json({
            success: false,
            message: "Type ou identifiant invalide"
        });
    }

    const title = String(req.body.title || "Sans titre").trim() || "Sans titre";
    const posterPath = req.body.posterPath ? String(req.body.posterPath) : null;
    const releaseDate = req.body.releaseDate ? String(req.body.releaseDate) : null;

    db.run(
        `
        INSERT INTO user_recently_watched (user_id, media_type, media_id, title, poster_path, release_date, watched_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, media_type, media_id)
        DO UPDATE SET
            title = excluded.title,
            poster_path = excluded.poster_path,
            release_date = excluded.release_date,
            watched_at = CURRENT_TIMESTAMP
        `,
        [req.session.userId, mediaType, mediaId, title, posterPath, releaseDate],
        function (err) {
            if (err) {
                console.error("Erreur DB historique ajout:", err.message);
                return res.status(500).json({
                    success: false,
                    message: "Erreur lors de l'ajout a l'historique"
                });
            }

            return res.json({
                success: true,
                updated: this.changes > 0
            });
        }
    );
});


// Post Inscription
app.post("/register", async (req, res) => {
    const data = req.body;

    const error = globalCheck(
        data.email,
        data.pseudo,
        data.password,
        data.confPassword
    );

    if (error) {
        return res.json({
            success: false,
            message: error
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        db.run(
            `INSERT INTO users (email, password_hash, pseudo) VALUES (?, ?, ?)`,
            [data.email, hashedPassword, data.pseudo],
            function (err) {
                if (err) {
                    console.log("Erreur DB :", err);

                    if (err.message.includes("UNIQUE")) {
                        return res.json({
                            success: false,
                            message: "Email ou pseudo déjà utilisé"
                        });
                    }

                    return res.json({
                        success: false,
                        message: "Erreur serveur"
                    });
                }

                return res.json({
                    success: true,
                    message: "Inscription réussie"
                });
            }
        );

    } catch (err) {
        console.log("Erreur hash :", err);

        return res.json({
            success: false,
            message: "Erreur serveur"
        });
    }
});


// Page de connexion
app.post("/login",async (req,res) => {
    const data = req.body;

    db.get (
        `SELECT id_users, email, password_hash, pseudo FROM users WHERE email = ?`, [data.email],

        async (err,row) => {
            if (err) {
                console.log(err);
                return res.json({
                    success: false,
                    message: err.message
                });
            }

            if (!row) {
                return res.json({
                    success: false,
                    message: "Email incorrect"
                });
            }

            const DBPassword = row.password_hash

            if (! await ComparePassword(data.password, DBPassword)) {
                return res.json({
                    success: false,
                    message: "Mot de passe incorrect"
                });
            }
            
            req.session.userId = row.id_users
            req.session.pseudo = row.pseudo

            return res.json({
                success: true,
                message: "Connexion réussie"
            });
        }
    );
    
});



app.post("/logout", async (req,res) => {
    req.session.destroy( (err) => {
        if (err){
            return res.json({
                success: false,
                message: "Erreur lors de la déconnexion"
            });
        }
        return res.json({
            success: true,
            message: "Deconnexion réussie"
        });
    });
})  


// Route Content pour le détail Movie/TV
app.get("/content/:type/:id", (req, res) => {
    // on gère type: movie | tv
    const { type, id } = req.params;
    if (type !== "movie" && type !== "tv") {
        return res.status(404).send("Type inconnu.");
    }

    RenderPage(req, res, "NetflixLight - Détail", "MovieDetails");
});

// 404
app.use((req,res) => {
    res.status(404).send("Route non trouvée");
});


// Check if a session existe
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Session inéxistante"
        });
    }

    next();
}

function requireAuthPage(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    next();
}


// Redirect to a session exist
function redirectIfAuth(req, res, next) {
    if (req.session.userId) {
        return  res.redirect("/")
    }

    next();
}

function normalizeMediaType(type) {
    if (type === "movie" || type === "tv") {
        return type;
    }

    return null;
}

function GetTemplate(name){
    return path.join(__dirname, '..', 'static', 'templates', name)
}

function getExternalPlayerDomain() {
    return (process.env.EXTERNAL_PLAYER_DOMAIN || DEFAULT_EXTERNAL_PLAYER_DOMAIN).replace(/\/$/, "");
}

async function extractDecodedLinks(movieId, domain) {
    if (!domain || !movieId) return [];

    const targetUrl = `${domain}/wp-json/apiflix/v1/playermovie?post_id=${encodeURIComponent(movieId)}`;

    try {
        const response = await fetchFromWeb(targetUrl, {
            method: "GET",
            headers: {
                Referer: domain,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
                Accept: "application/json, text/javascript, */*; q=0.01"
            }
        });

        if (!response.ok) {
            throw new Error(`Echec de la requete: ${response.status}`);
        }

        const htmlContent = await response.text();
        const regex = /<li[^>]*onclick=["']showVideo\(['"]([^"']+)["']\)/g;
        const links = [];
        let match;

        while ((match = regex.exec(htmlContent)) !== null) {
            const base64Payload = match[1];

            try {
                const decodedUrl = Buffer.from(base64Payload, "base64").toString("utf8");
                const cleanUrl = decodedUrl.replace(/\\/g, "").trim();

                if (cleanUrl && !links.includes(cleanUrl)) {
                    links.push(cleanUrl);
                }
            } catch (decodeError) {
                console.warn("Echec du decodage pour une source.", decodeError.message);
            }
        }

        return links;
    } catch (error) {
        console.error("Erreur lors de la recuperation des sources:", error.message);
        return [];
    }
}

function isDirectMediaUrl(url) {
    return /\.(m3u8|mp4|webm|ogg)(\?|$)/i.test(url);
}

function cleanEscapedUrl(rawUrl) {
    return rawUrl
        .replace(/\\u0026/gi, "&")
        .replace(/\\\//g, "/")
        .replace(/\\/g, "")
        .trim();
}

async function resolvePlayableSources(decodedLinks, domain) {
    const playable = [];
    const seen = new Set();

    for (const rawLink of decodedLinks) {
        const link = cleanEscapedUrl(rawLink);
        if (!link || seen.has(link)) continue;
        seen.add(link);

        if (isDirectMediaUrl(link)) {
            playable.push(link);
            continue;
        }

        const embeddedSources = await extractMediaLinksFromHostPage(link, domain);
        for (const mediaUrl of embeddedSources) {
            if (!seen.has(mediaUrl)) {
                seen.add(mediaUrl);
                playable.push(mediaUrl);
            }
        }
    }

    return playable;
}

async function extractMediaLinksFromHostPage(pageUrl, domain) {
    const results = [];

    try {
        const response = await fetchFromWeb(pageUrl, {
            method: "GET",
            headers: {
                Referer: domain,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        });

        if (!response.ok) {
            return results;
        }

        const html = await response.text();
        const mediaRegex = /(https?:\\\/\\\/[^"'\s]+?\.(?:m3u8|mp4|webm|ogg)(?:\?[^"'\s]*)?|https?:\/\/[^"'\s]+?\.(?:m3u8|mp4|webm|ogg)(?:\?[^"'\s]*)?)/gi;
        let match;

        while ((match = mediaRegex.exec(html)) !== null) {
            const cleanUrl = cleanEscapedUrl(match[1]);
            if (cleanUrl && isDirectMediaUrl(cleanUrl) && !results.includes(cleanUrl)) {
                results.push(cleanUrl);
            }
        }

        return results;
    } catch (error) {
        console.warn("Impossible d'extraire des medias depuis une page hote:", error.message);
        return results;
    }
}


//render page in the layout struct
function RenderPage(req, res, title, templateName) {
    let templateFile = GetTemplate(templateName + ".html");
    if(!fs.existsSync(templateFile)) {
        templateFile = GetTemplate(templateName);
    }
    const htmlContent = fs.readFileSync(templateFile, 'utf8');

    // Détection navigation SPA
    if (req.headers['x-spa-request'] === 'true') {
        return res.send(htmlContent);
    }

    res.render( GetTemplate("layout"), {
        Title: title,
        HTML: htmlContent
    });
}


app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`)
});




