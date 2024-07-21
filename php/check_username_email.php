<?php
require 'database.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'];
$email = $data['email'];

// Check if username already exists
$stmt_username = $conn->prepare("SELECT * FROM users WHERE username = ?");
$stmt_username->bind_param("s", $username);
$stmt_username->execute();
$result_username = $stmt_username->get_result();

// Check if email already exists
$stmt_email = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt_email->bind_param("s", $email);
$stmt_email->execute();
$result_email = $stmt_email->get_result();

if ($result_username->num_rows > 0 && $result_email->num_rows > 0) {
    echo json_encode(['status' => 'fail', 'message' => 'Username dan Email sudah terdaftar, silakan gunakan yang lain!']);
} elseif ($result_username->num_rows > 0) {
    echo json_encode(['status' => 'fail', 'message' => 'Username sudah terdaftar, silakan gunakan yang lain!']);
} elseif ($result_email->num_rows > 0) {
    echo json_encode(['status' => 'fail', 'message' => 'Email sudah terdaftar, silakan gunakan yang lain!']);
} else {
    echo json_encode(['status' => 'success']);
}

$conn->close();
?>