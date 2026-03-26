//  EXPORTS 
module.exports = {
    emailCheck,
    passwordCheck,
    pseudoCheck,
    passwordMatch,
    globalCheck
};






//Check the email's size
function emailCheck(email) {
    if (email.length < 5) return "Email trop court (5 caractères minimum)" ;
    return null
}

function passwordCheck(password) {

    //Check the password's size
    if (password.length < 8) return "Mot de passe trop court (8 caractères minimum)";

    //Check for symbole
    if (!/[^A-Za-z0-9]/.test(password)) return "Le mot de passe doit contenir au moins un symbole";

    //Check for MAJ
    if (!/[A-Z]/.test(password)) return "Le mot de passe doit contenir au moins une majuscule";

    return null 
}

//Check the pseudo's size
function pseudoCheck(pseudo) {
    if (!pseudo) return "Pseudo requis";
    if (pseudo.length <= 3) return "Pseudo trop court (4 caractères minimum)";
    return null;
}

//Check if the passwords are the same 
function passwordMatch(psswrd1, psswrd2) {
    return psswrd1 === psswrd2;
}


function globalCheck(email, pseudo, password, confPassword ) {
    
    const pseudoError = pseudoCheck(pseudo);
    if (pseudoError) return pseudoError;

    const emailError = emailCheck(email);
    if (emailError) return emailError;

    const passwordError = passwordCheck(password);
    if (passwordError) return passwordError;

    if (!passwordMatch(password, confPassword)) return "Les mots de passe ne correspondent pas";

    return null
}