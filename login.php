<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header("Location: homepage.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <script>
        function getParameterByName(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, '\\$&');
            var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        }

        // Cek untuk "success" dalam parameter
        window.onload = function () {
            var success = getParameterByName('success');
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

    <div id="form-login-container">
        <div class="header-login">
            <label id="header-text">Login</label>
            <?php if (isset($_GET['error'])): ?>
                <div class="error-text" style="color: red; font-size: 20px; margin-top:15px">
                    <label><?php echo $_GET['error']; ?></label>
                </div>
            <?php endif; ?>
        </div>
        <form action="authenticate.php" id="form-login" method="POST">
            <input type="text" id="email-username" name="email-username"
                placeholder="Enter your email address or username">
            <input type="password" id="password" name="password" placeholder="Enter your password">
            <input type="submit" id="submit-login" name="log_user" value="Login">
            <p id="body-text">Don't have an account?<br> <a href="register.php">Register here</a></p>
        </form>

        <img id="panda-login" src="Resources/panda-login.png" alt="Panda">
    </div>

</body>

</html>
