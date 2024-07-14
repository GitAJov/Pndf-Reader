<?php
require 'database.php';

$email = $_POST['email'];
$otp = $_POST['otp'];
$new_password = password_hash($_POST['new-password'], PASSWORD_DEFAULT);

$stmt = $conn->prepare("SELECT otp FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->bind_result($stored_otp);
$stmt->fetch();
$stmt->close();

if ($stored_otp === $otp) {
    $stmt = $conn->prepare("UPDATE users SET password = ?, otp = NULL WHERE email = ?");
    $stmt->bind_param("ss", $new_password, $email);
    if ($stmt->execute()) {
        header("Location: ../login.php?success=Password reset successfully. You can now log in with your new password.");
        exit();
    } else {
        header("Location: ../reset_password.php?email=" . urlencode($email) . "&error=" . urlencode("Failed to update password. Please try again."));
        exit();
    }
    $stmt->close();
} else {
    header("Location: ../reset_password.php?email=" . urlencode($email) . "&error=" . urlencode("Invalid OTP. Please try again."));
    exit();
}

$conn->close();
?>
