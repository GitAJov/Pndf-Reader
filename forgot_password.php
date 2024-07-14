<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password</title>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <script>
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
                if(data.status === "success") {
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
                                message: `Your OTP for password reset is: ${otp}`
                            }
                        })
                    }).then(response => {
                        if (response.ok) {
                            alert("OTP sent to your email. Please check your inbox.");
                            window.location.href = `reset_password.php?email=${encodeURIComponent(email)}`;
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
    </script>
</head>
<body>
    <div id="brand-title">
        <img src="Resources/pndf-logo.png" alt="PNDF Reader">
    </div>

    <div id="form-login-container">
        <div class="header-login">
            <label id="header-text">Forgot Password</label>
        </div>
        <form id="form-forgot-password" onsubmit="event.preventDefault(); sendOTP();">
            <input type="email" id="email" name="email" placeholder="Enter your email address" required>
            <input type="submit" id="submit-forgot-password" value="Send OTP">
        </form>

        <img id="panda-login" src="Resources/panda-login.png" alt="Panda">
    </div>
</body>
</html>