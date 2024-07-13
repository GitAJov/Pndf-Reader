<?php
session_start();
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
  exit;
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  include 'database.php';

  $user_id = $_SESSION['user_id'];
  $doc_id = $_POST['doc_id'];
  $last_page = $_POST['last_page'];

  $sql = "UPDATE pdf_files SET last_page = ? WHERE id = ? AND user_id = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("iii", $last_page, $doc_id, $user_id);

  if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Bookmark updated successfully']);
  } else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update bookmark']);
  }

  $stmt->close();
  $conn->close();
} else {
  echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
}
?>