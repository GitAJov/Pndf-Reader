<?php
include 'database.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'];
$otp = $data['otp'];

// Update the OTP in the users table
$sql = "UPDATE users SET otp=? WHERE email=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("is", $otp, $email);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error"]);
}

$stmt->close();
$conn->close();
?>