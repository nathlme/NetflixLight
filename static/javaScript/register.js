
console.log("register.js chargé");

const form = document.getElementById("registerForm");

form.addEventListener("submit", function(event) {
    console.log("submit intercepté");
    event.preventDefault()
    
    const _email = document.getElementById("email").value
    const _pseudo = document.getElementById("pseudo").value 
    const _password = document.getElementById("password").value 
    const _confPassword = document.getElementById("confPassword").value 

    const formData = {
        email: _email,
        pseudo: _pseudo,
        password: _password,
        confPassword: _confPassword
    };

    fetch ("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(formData)
    })

    .then(response => response.json())
    .then(data => {
        document.getElementById("message").textContent = data.message;
        if (data.success) {
            window.location.href = "/";
        }
    });
});