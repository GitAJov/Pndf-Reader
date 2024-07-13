<?php
require 'database.php';

// Handle form submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get form data
    $username = htmlspecialchars($_POST['username']);
    $email = htmlspecialchars($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    // Hash the password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

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
        // Both username and email already exist
        header('Location: ../register.php?error=Username dan Email sudah terdaftar, silakan gunakan yang lain!');
        exit();
    } elseif ($result_username->num_rows > 0) {
        // Username already exists
        header('Location: ../register.php?error=Username sudah terdaftar, silakan gunakan yang lain!');
        exit();
    } elseif ($result_email->num_rows > 0) {
        // Email already exists
        header('Location: ../register.php?error=Email sudah terdaftar, silakan gunakan yang lain!');
        exit();
    } else {
        // Insert the new user into the database
        $stmt_insert = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt_insert->bind_param("sss", $username, $email, $password_hash);
        
        if ($stmt_insert->execute()) {
            header('Location: ../login.php?success=Registration successful! Please login.');
            exit();
        } else {
            header('Location: ../register.php?error=Error: ' . $stmt_insert->error);
            exit();
        }
    }
} else {
    header('Location: ../register.php?error=Metode pengiriman tidak valid.');
    exit();
}

$conn->close();
?>
