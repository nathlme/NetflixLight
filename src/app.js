const express=require("express")
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { globalCheck } = require("./registerCheck");
const bcrypt = require("bcrypt");
const db = require("./db");
const { ComparePassword } = require("./loginCheck");
const session = require("express-session");


const app=express()
const PORT=3000

//  JSON -> Objet JS
app.use(express.json());
// Form HTML -> Objet JS
app.use(express.urlencoded({ extended: true }));

app.use("/static", express.static(path.join(__dirname, "..", "static")));

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


// Route page inscription
app.get("/register",  (req, res) => {
    RenderPage(res, "NetflixLight - Inscription", "RegisterPage")
});

// Route page de connexion
app.get("/login", redirectIfAuth, (req, res) => {
    RenderPage(res, "NetflixLight - Connexion", "LoginPage")
});

//  Route accueil
app.get("/",(req,res) => {
    RenderPage(res, "NetflixLight", "index")
});

// Route backend pour TMDB
app.use('/api/tmdb/', async (req, res) => {
    try {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const endpoint = req.path.replace(/^\//, "");
        const params = new URLSearchParams(req.query);
        const url = `https://api.themoviedb.org/3/${endpoint}?${params.toString()}`;

        const response = await fetch(url, {
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

// Route session
app.get("/profile", requireAuth, (req, res) => {
    res.send("Bienvenue utilisateur " + req.session.userId);
});

app.get("/js/:filename", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "static", "javaScript", req.params.filename));
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
        `SELECT id_users, email, password_hash FROM users WHERE email = ?`, [data.email],

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
            message: "Deconnéxion réussie"
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

    res.render(GetTemplate("layout"), {
        Title: "NetflixLight - Détail",
        HTML: fs.readFileSync(GetTemplate("MovieDetails.html"), 'utf8')
    });
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

// Redirect to a session exist
function redirectIfAuth(req, res, next) {
    if (req.session.userId) {
        return  res.redirect("/profile")
    }

    next();
}

function GetTemplate(name){
    return path.join(__dirname, '..', 'static', 'templates', name)
}

//render page in the layout struct
function RenderPage(res, title, templateName) {
    res.render( GetTemplate("layout"), {
        Title: title,
        HTML: fs.readFileSync(GetTemplate(templateName + ".html"), 'utf8')
    });
}

app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`)
});




