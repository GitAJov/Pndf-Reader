<?php
session_start();
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
  exit;
}

// Mengaktifkan pelaporan kesalahan
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['file'])) {
  include 'database.php';

  $user_id = $_SESSION['user_id'];
  $file = $_FILES['file'];
  $file_name = $file['name'];
  $file_tmp = $file['tmp_name'];

  // Get username
  $sql = "SELECT username FROM users WHERE id = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("i", $user_id);
  $stmt->execute();
  $stmt->bind_result($username);
  $stmt->fetch();
  $stmt->close();

  // Create user folder if not exists
  $user_folder = 'uploads/' . $username;
  if (!file_exists($user_folder)) {
    mkdir($user_folder, 0777, true);
  }

  $file_path = $user_folder . '/' . $file_name;

  if (move_uploaded_file($file_tmp, $file_path)) {
    // Insert file path into database
    $sql = "INSERT INTO pdf_files (user_id, file_name, file_path) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $file_path_real = 'php/'. $user_folder . '/' . $file_name;
    $stmt->bind_param("iss", $user_id, $file_name, $file_path_real);

    if ($stmt->execute()) {
      echo json_encode(['status' => 'success', 'message' => 'File uploaded successfully']);
    } else {
      echo json_encode(['status' => 'error', 'message' => 'Failed to save file path to database']);
    }
    $stmt->close();
  } else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file']);
  }

  $conn->close();
} else {
  echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
}
?>