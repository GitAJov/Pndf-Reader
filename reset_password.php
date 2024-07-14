<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <script>
        // Function to get the URL parameter
        function getParameterByName(name, url = window.location.href) {
            name = name.replace(/[\[\]]/g, '\\$&');
            let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        }

        // Check if the email parameter is present
        window.onload = function () {
            let email = getParameterByName('email');
            if (!email) {
                alert('No reset email detected. Redirecting to login page.');
                window.location.href = 'login.php';
            }
        };
    </script>
</head>
<body>
    <div id="brand-title">
        <img src="Resources/pndf-logo.png" alt="PNDF Reader">
    </div>

    <div id="form-login-container">
        <div class="header-login">
            <label id="header-text">Reset Password</label>
            <?php if (isset($_GET['error'])): ?>
                <div class="error-text" style="color: red; font-size: 20px; margin-top:15px">
                    <label><?php echo $_GET['error']; ?></label>
                </div>
            <?php endif; ?>
        </div>
        <form action="php/reset_password.php" id="form-reset-password" method="POST">
            <input type="hidden" id="email" name="email" value="<?php echo $_GET['email']; ?>">
            <input type="text" id="otp" name="otp" placeholder="Enter OTP" required>
            <input type="password" id="new-password" name="new-password" placeholder="Enter new password" required>
            <input type="submit" id="submit-reset-password" value="Reset Password">
        </form>

        <img id="panda-login" src="Resources/panda-login.png" alt="Panda">
    </div>
</body>
</html>