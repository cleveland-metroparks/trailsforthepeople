/**
 * Shared JS for Administration and Contributors pages.
 */

/**
 * Validate a user password change to ensure it fulfills requirements.
 */
 function validateNewPassword(password1, password2, userEmail) {
    // Do the two passwords match?
    if (password1 != password2) {
        alert("The two entries do not match.");
        return false;
    }

    // Are the password fields blank?
    if (! password1) {
        alert("To cancel changing your password, just navigate away from this page.");
        return false;
    }

    // Does the password follow our guidelines?
    var error = null;
    if (password1.length < 8) {
        error = "Passwords must be at least 8 characters.";
    }
    if (! password1.match(/\d/)) {
        error = "Passwords must contain at least one number.";
    }
    if (password1.toLowerCase() == userEmail.toLowerCase() ) {
        error = "Don't use your email address as your password.";
    }
    if (error) {
        alert(error);
        return false;
    }

    // We're good!
    return true;
}