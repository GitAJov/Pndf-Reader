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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  include 'database.php';

  $user_id = $_SESSION['user_id'];
  $doc_id = $_GET['doc_id'];

  $sql = "SELECT last_page FROM pdf_files WHERE id = ? AND user_id = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("ii", $doc_id, $user_id);
  $stmt->execute();
  $stmt->bind_result($last_page);

  if ($stmt->fetch()) {
    echo json_encode(['status' => 'success', 'last_page' => $last_page]);
  } else {
    echo json_encode(['status' => 'error', 'message' => 'Bookmark not found']);
  }

  $stmt->close();
  $conn->close();
} else {
  echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
}
?>