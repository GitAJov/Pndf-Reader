<?php
session_start();
require 'database.php'; // file yang berisi koneksi ke database

$email_or_username = $_POST['email-username'];
$password = $_POST['password'];

// Query untuk mendapatkan pengguna berdasarkan username atau email
$query = $conn->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
$query->bind_param("ss", $email_or_username, $email_or_username);
$query->execute();
$user = $query->get_result()->fetch_assoc();

if ($user && password_verify($password, $user['password'])) {
    // Password cocok, buat sesi
    $_SESSION['user_id'] = $user['id'];
    $username = $user['username']; // Retrieve the username
    header('Location: index.php');
    exit();
} else {
    // Password tidak cocok, redirect dengan pesan error
    header("Location: login.php?error=Username+atau+password+salah!");
    exit();
}
?>
