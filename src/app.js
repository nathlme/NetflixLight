const express=require("express")
const path = require("path");
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
    res.sendFile(path.join(__dirname, "..", "static", "templates", "RegisterPage.html"));
});

// Route page de connexion
app.get("/login", redirectIfAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "static", "templates", "LoginPage.html"));
});

//  Route accueil
app.get("/",(req,res) => {
    res.send('Serveur Express démarré, <a href="/register">/register</a>');
});

// Route session
app.get("/profile", requireAuth, (req, res) => {
    res.send("Bienvenue utilisateur " + req.session.userId);
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

app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`)
});

