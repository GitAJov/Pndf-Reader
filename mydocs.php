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
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@40,400,0,0" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.mjs" type="module"></script>
  <script type="module">
    import { fetchDocuments, confirmDeleteDocument } from './js/mydocs.js';
    document.addEventListener('DOMContentLoaded', fetchDocuments);
    window.confirmDeleteDocument = confirmDeleteDocument;
  </script>
  <script src="js/dark-mode.js" type="module"></script>
  <script src="js/homepage.js" type="module"></script>
</head>

<body>
  <div id="container">
    <div id="topMenu">
      <img src="Resources/pndf-logo.png" id="pndf-logo" alt="PNDF Reader" onclick="window.location.href = 'index.php';">
      <div class="nav-right">
        <button onclick="window.location.href='welcome.php'" class="homebtn">Home</button>
        <button onclick="window.location.href='index.php'" class="pdfbtn">Upload File</button>
        <div class="dropdown">
          <button class="dropbtn">Tools
            <i class="material-symbols-outlined" style="font-size: 36px"> arrow_drop_down </i>
          </button>
          <div class="dropdown-content">
            <a href="#" id="theme-toggle-item">Toggle Theme</a>
          </div>
        </div>
        <div class="dropdown">
          <button class="dropbtn" onclick="toggleDropdown()">
            <?php echo htmlspecialchars($username); ?>
            <i class="material-symbols-outlined" style="font-size: 36px"> account_circle </i>
          </button>
          <div id="profileDropdown" class="dropdown-content">
            <!-- <a href="profile.php">Profile</a> -->
            <a href="php/logout.php">Logout</a>
          </div>
        </div>
      </div>
    </div>
    <div id="headerMydocs">
      <label id="headerTxt">My Documents</label>
      <input type="file" id="fileInput" accept=".pdf" style="display: none;">
      <button class="fileUpload" onclick="document.getElementById('fileInput').click();">Upload File</button>
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
  <script src="js/mydocs.js" type="module"></script>
</body>

</html>