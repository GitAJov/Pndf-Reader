<?php
session_start();
if (!isset($_SESSION['user_id'])) {
  header('Location: login.php');
  exit;
}

include 'php/database.php';

$user_id = $_SESSION['user_id'];
$sql = "SELECT username FROM users WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $user_id);
$stmt->execute();
$stmt->bind_result($username);
$stmt->fetch();
$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Documents</title>
  <link rel="stylesheet" href="css/mydocs.css">
  <link rel="stylesheet" href="css/homepage.css">
  <script type="module">
    import { fetchDocuments, confirmDeleteDocument } from './js/mydocs.js';
    document.addEventListener('DOMContentLoaded', fetchDocuments);
    window.confirmDeleteDocument = confirmDeleteDocument;
  </script>
  <script src="js/dark-mode.js" type="module"></script>
</head>

<body>
  <div id="container">
    <div id="topMenu">
      <img src="Resources/pndf-logo.png" id="pndf-logo" alt="PNDF Reader">
      <div class="nav-right">
        <button onclick="window.location.href='index.php'" class="homebtn">Home</button>
        <div class="dropdown">
          <button class="dropbtn">Tools
            <img src="Resources/drop-icon.png" alt="Drop Icon" class="drop-icon">
          </button>
          <div class="dropdown-content">
            <a href="#" id="theme-toggle-item">Toggle Theme</a>
          </div>
        </div>
        <div class="dropdown">
          <button class="dropbtn" onclick="toggleDropdown()">
            <?php echo htmlspecialchars($username); ?>
            <img src="Resources/profile-icon.png" alt="Profile Icon" class="profile-icon">
          </button>
          <div id="profileDropdown" class="dropdown-content">
            <a href="profile.php">Profile</a>
            <a href="logout.php">Logout</a>
          </div>
        </div>
      </div>
    </div>
    <div id="headerMydocs">
      <label id="headerTxt">My Documents</label>
      <input type="file" id="fileInput" accept=".pdf" style="display: none;">
      <button class="fileUpload" onclick="document.getElementById('fileInput').click();">
        Upload File
      </button>
    </div>
    <div id="documentList">
      <!-- List of uploaded documents will be displayed here -->
      <script>
        function viewDocument(id) {
          window.location.href = `index.php?doc_id=${id}`;
        }
      </script>
    </div>
  </div>
</body>

</html>
