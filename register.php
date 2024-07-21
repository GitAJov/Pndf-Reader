<div?php session_start(); if (isset($_SESSION['user_id'])) { header("Location: index.php"); exit(); } ?>

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

            function checkUsernameEmail() {
                var username = document.getElementById("username").value;
                var email = document.getElementById("email").value;

                fetch("php/check_username_email.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username: username, email: email })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === "success") {
                            sendOTP();
                        } else {
                            document.getElementById("error-message").innerHTML = data.message;
                        }
                    })
                    .catch(error => {
                        console.error("Error in fetch request:", error);
                        alert("An error occurred. Please try again.");
                    });
            }

            function sendOTP() {
                var email = document.getElementById("email").value;
                var otp = Math.floor(100000 + Math.random() * 900000);

                fetch("php/store_otp.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email: email, otp: otp })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === "success") {
                            fetch("https://api.emailjs.com/api/v1.0/email/send", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    service_id: "service_t0zfyzj",
                                    template_id: "template_swfrv9e",
                                    user_id: "RrEwYdZ5Fd01DZxzD",
                                    template_params: {
                                        to_name: email,
                                        from_name: "PNDF Reader",
                                        message: `Your OTP for verification is: ${otp}`
                                    }
                                })
                            }).then(response => {
                                if (response.ok) {
                                    document.getElementById('otp-popup').style.display = 'flex';
                                } else {
                                    response.json().then(data => {
                                        console.error("Failed to send OTP via EmailJS:", data);
                                        alert("Failed to send OTP. Please try again.");
                                    });
                                }
                            }).catch(error => {
                                console.error("Error in EmailJS request:", error);
                                alert("Failed to send OTP. Please try again.");
                            });
                        } else {
                            console.error("Failed to store OTP:", data.message);
                            alert("Failed to store OTP. Please try again.");
                        }
                    }).catch(error => {
                        console.error("Error in fetch request:", error);
                        alert("An error occurred. Please try again.");
                    });
            }

            function verifyOTP() {
                var otp = document.getElementById("otp").value;

                fetch("php/verify_otp.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ otp: otp })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === "success") {
                            alert("OTP verified successfully!");
                            document.getElementById('form-regis').submit();
                        } else {
                            alert("Invalid OTP. Please try again.");
                        }
                    }).catch(error => {
                        console.error("Error in fetch request:", error);
                        alert("An error occurred. Please try again.");
                    });
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
        <div id="brand-title">
            <img src="Resources/pndf-logo.png" alt="PNDF Reader" onclick="window.location.href = 'index.php';">
        </div>

        <div id="form-regis-container">
            <div class="header-register">
                <label id="header-text">Register</label>
                <div class="error-text" style="margin-top: 15px">
                    <label id="error-message" style="color: red; font-size: 20px;"></label>
                </div>
            </div>
            <form action="php/submit.php" id="form-regis" method="post"
                onsubmit="event.preventDefault(); validateForm() && checkUsernameEmail()">
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

        <div id="otp-popup" style="display:none;">
            <div id="otp-content">
                <div id="otp-close">
                    <span class="close"
                        onclick="document.getElementById('otp-popup').style.display='none'">&times;</span>
                </div>
                <label for="otp">Enter OTP:</label>
                <input type="text" id="otp" name="otp">
                <button onclick="verifyOTP()">Verify OTP</button>
            </div>
        </div>
    </body>

    </html>