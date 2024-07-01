<?php
session_start();
$isLoggedIn = isset($_SESSION['user_id']);
$username = '';

if ($isLoggedIn) {
    include 'database.php';

    $user_id = $_SESSION['user_id'];
    $sql = "SELECT username FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $user_id);
    $stmt->execute();
    $stmt->bind_result($username);
    $stmt->fetch();
    $stmt->close();
    $conn->close();
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Reader</title>
    <link rel="stylesheet" href="css/style.css" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro" />
</head>

<body>
    <div class="welcome-message">
        <div class="text-large-bold">
            <?php
            if ($isLoggedIn) {
                echo "Welcome, " . htmlspecialchars($username) . "!";
            } else {
                echo "Welcome, Guest";
            }
            ?>
        </div>
    </div>

    <div class="container-view-pdf">
        <div class="text-large-bold">
            <label>View PDF</label>
        </div>
        <div class="text-ssp">
            <label>View PDF you want with the easiest PDF viewer available</label>
        </div>
    </div>

    <div class="upload-container">
        <div class="upload-box">
            <button class="choose-file-button">Choose File</button>
            <p>... or drop a file here</p>
            <p>Files stay private. Automatically deletes after 2 hours</p>
        </div>
        <img src="Resources/panda-upload.png" alt="Panda Image" class="panda-upload">
    </div>
</body>

</html>