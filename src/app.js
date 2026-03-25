const express=require("express")
const path = require("path");
const { globalCheck } = require("./registerCheck");
const bcrypt = require("bcrypt");
const db = require("./db");


const app=express()
const PORT=3000

//  JSON -> Objet JS
app.use(express.json());
// Form HTML -> Objet JS
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "..", "static")));


// Route page inscription
app.get("/register",  (req, res) => {
    res.sendFile(path.join(__dirname, "..", "static", "templates", "RegisterPage.html"));
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

// Accueil
app.get("/",(req,res) => {
    res.send('Serveur Express démarré, <a href="/register">/register</a>');
})


// 404
app.use((req,res) => {
    res.status(404).send("Route non trouvée");
});





app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`)
});

