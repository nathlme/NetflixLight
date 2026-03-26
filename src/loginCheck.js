module.exports = {
    ComparePassword,
};

const bcrypt = require("bcrypt")



// return true if the two passwords are the same
async function ComparePassword(pass1, pass2) {
    return bcrypt.compare(pass1,pass2);
}





