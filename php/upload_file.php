<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['file'])) {
  include 'database.php';

  $user_id = $_SESSION['user_id'];
  $file = $_FILES['file'];
  $file_name = $file['name'];
  $file_tmp = $file['tmp_name'];
  $file_data = file_get_contents($file_tmp);

  $sql = "INSERT INTO pdf_files (user_id, file_name, file_data) VALUES (?, ?, ?)";
  $stmt = $conn->prepare($sql);
  if ($stmt === false) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement']);
    exit;
  }

  $stmt->bind_param("isb", $user_id, $file_name, $null);
  $stmt->send_long_data(2, $file_data);

  if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'File uploaded successfully']);
  } else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to upload PDF']);
  }
  $stmt->close();
  $conn->close();
} else {
  echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
}
?>