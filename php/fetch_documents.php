<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

include 'database.php';

$user_id = $_SESSION['user_id'];
$sql = "SELECT id, file_name FROM pdf_files WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$documents = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$conn->close();

echo json_encode($documents);
?>