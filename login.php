<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header("Location: homepage.html");
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
</head>

<body>
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