console.log ("login.js chargé");

const form = document.getElementById("loginForm");

form.addEventListener("submit", function(event) {
    console.log("submit intercepté");
    event.preventDefault();

    const _email = document.getElementById("email").value 
    const _password = document.getElementById("password").value 


    const formData = {
        email: _email,
        password: _password 
    };

    fetch ("/login", {
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
            window.location.href = "/"
        }
    })
})