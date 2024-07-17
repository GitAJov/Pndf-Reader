<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

include 'database.php';

$user_id = $_SESSION['user_id'];
$sql = "SELECT pdf_files.id, pdf_files.file_name, users.username FROM pdf_files JOIN users ON pdf_files.user_id = users.id WHERE pdf_files.user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$documents = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$conn->close();

echo json_encode($documents);
?>