<?php
session_start();
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$otp = $data['otp'];

if (isset($_SESSION['otp']) && $_SESSION['otp'] == $otp) {
    // OTP is correct, destroy the session OTP
    unset($_SESSION['otp']);
    echo json_encode(['status' => 'success']);
} else {
    // OTP is incorrect
    echo json_encode(['status' => 'fail']);
}
?>