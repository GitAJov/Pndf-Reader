<?php
session_start();
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'];
$otp = $data['otp'];

// Store OTP in session
$_SESSION['otp'] = $otp;

echo json_encode(['status' => 'success']);
?>