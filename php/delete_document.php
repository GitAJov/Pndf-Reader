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

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  ob_start(); // Start output buffering

  include 'database.php';

  $user_id = $_SESSION['user_id'];
  parse_str(file_get_contents("php://input"), $_DELETE);
  $doc_id = $_DELETE['id'] ?? null; // Use null coalescing operator to handle undefined key

  // Debugging statement
  error_log("Deleting document with ID: $doc_id for user ID: $user_id");

  if (!$doc_id) {
    echo json_encode(['status' => 'error', 'message' => 'Document ID not provided']);
    exit;
  }

  // Get the file path from the database
  $sql = "SELECT file_path FROM pdf_files WHERE id = ? AND user_id = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("ii", $doc_id, $user_id);
  $stmt->execute();
  $stmt->bind_result($file_path);
  if ($stmt->fetch()) {
    $stmt->close();

    // Remove first 4 characters from file path
    $file_path = substr($file_path, 4);
    
    // Debug output
    error_log("File path to delete: " . $file_path);

    // Check if file exists
    if (file_exists($file_path)) {
      // Delete the file
      if (unlink($file_path)) {
        // Remove the database record
        $sql = "DELETE FROM pdf_files WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $doc_id, $user_id);
        if ($stmt->execute()) {
          echo json_encode(['status' => 'success', 'message' => 'Document deleted successfully']);
        } else {
          error_log("Failed to delete document from database: " . $stmt->error);
          echo json_encode(['status' => 'error', 'message' => 'Failed to delete document from database']);
        }
        $stmt->close();
      } else {
        error_log("Failed to delete file: " . $file_path);
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete file']);
      }
    } else {
      error_log("File not found: " . $file_path);
      echo json_encode(['status' => 'error', 'message' => 'File not found']);
    }
  } else {
    error_log("Document not found with ID: $doc_id for user ID: $user_id");
    echo json_encode(['status' => 'error', 'message' => 'Document not found']);
  }

  $conn->close();

  // Ensure no additional output is sent
  ob_end_flush();
} else {
  echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
}
?>
