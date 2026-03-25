const express=require("express")
const path = require("path");
const { globalCheck } = require("./registerCheck");


const app=express()
const PORT=3000

//  JSON -> Objet JS
app.use(express.json());
// Form HTML -> Objet JS
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "..", "static")));


// Route page inscription
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "static", "templates", "RegisterPage.html"));
});


// Post Inscription
app.post("/register",(req,res) => {
    const data = req.body;

    const error = globalCheck(
        data.email,
        data.pseudo,
        data.password,
        data.confPassword
    );

    if (!error) {
        return res.json({
            success: true,
            message: "Inscription réussie"
        });
    }

    return res.json({
        success: false,
        message: error
    });

    
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

