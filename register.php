<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration</title>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <script>
        function validateForm() {
            let email = document.getElementById("email").value;
            let username = document.getElementById("username").value;
            let password = document.getElementById("password").value;
            let confirmPassword = document.getElementById("confirm_password").value;
            let errorMsg = '';

            if (username.trim() === '' || email.trim() === '' || password.trim() === '' || confirmPassword.trim() === '') {
                errorMsg += "Semua field harus diisi.<br>";
            }

            if (!validateEmail(email)) {
                errorMsg += "Email tidak valid.<br>";
            }

            if (username.length < 4) {
                errorMsg += "Username harus lebih dari 3 karakter.<br>";
            }

            if (password.length < 6) {
                errorMsg += "Password harus lebih dari 5 karakter.<br>";
            }

            if (password !== confirmPassword) {
                errorMsg += "Password dan konfirmasi password tidak sama.<br>";
            }

            if (errorMsg) {
                document.getElementById("error-message").innerHTML = errorMsg;
                return false;
            }

            return true;
        }

        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        }

        function getParameterByName(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, '\\$&');
            var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        }

        // Cek "error" atau "success" dalam parameter dalam URL
        window.onload = function () {
            var error = getParameterByName('error');
            var success = getParameterByName('success');
            if (error) {
                document.getElementById('error-message').innerHTML = error;
            }
            if (success) {
                alert(success);
            }
        };
    </script>
</head>

<body>
    <!-- Brand Title -->
    <div id="brand-title">
        <img src="Resources/pndf-logo.png" alt="PNDF Reader">
    </div>

    <div id="form-regis-container">
        <div class="header-register">
            <label id="header-text">Register</label>
            <div class="error-text" style="margin-top: 15px">
                <label id="error-message" style="color: red; font-size: 20px;"></label>
            </div>
        </div>
        <form action="php/submit.php" id="form-regis" method="post" onsubmit="return validateForm()">
            <input type="email" id="email" name="email" placeholder="Enter your email address" required>
            <input type="text" id="username" name="username" placeholder="Choose a username" required>
            <input type="password" id="password" name="password" placeholder="Create a password" required>
            <input type="password" id="confirm_password" name="confirm_password" placeholder="Confirm your password"
                required>
            <input type="submit" id="submit-register" name="reg_user" value="Register">
            <p id="body-text">Already have an account? <a href="login.php">Login here</a></p>
        </form>

        <img id="panda" src="Resources/panda-regis.png" alt="Panda">
    </div>
</body>

</html>