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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.mjs" type="module"></script>
  <script src="homepage.js" type="module"></script>
  <link rel="stylesheet" href="css/homepage.css" />

  <script>
    function getParameterByName(name, url = window.location.href) {
      name = name.replace(/[\[\]]/g, '\\$&');
      let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    window.onload = function () {
      let successMessage = getParameterByName('success');
      if (successMessage) {
        alert(successMessage);
      }
    };
  </script>
</head>

<body>
  <div id="container">
    <div id="topMenu">
      <img src="Resources/pndf-logo.png" id="pndf-logo" alt="PNDF Reader">
      <div class="nav-right">
        <div class="dropdown">
          <button class="dropbtn">Tools
            <img src="Resources/Drop_Icon.png" alt="Drop Icon" class="drop-icon">
          </button>
          <div class="dropdown-content">
            <a href="#">Tool 1</a>
            <a href="#">Tool 2</a>
            <a href="#">Tool 3</a>
          </div>
        </div>
        <div class="dropdown">
          <button class="dropbtn" onclick="toggleDropdown()">
            <?php
            if ($isLoggedIn) {
              echo htmlspecialchars($username);
            } else {
              echo "Guest";
            }
            ?>
            <img src="Resources/Profile_Icon.png" alt="Profile Icon" class="profile-icon">
          </button>
          <div id="profileDropdown" class="dropdown-content">
            <?php if ($isLoggedIn): ?>
              <a href="profile.php">Profile</a>
              <a href="logout.php">Logout</a>
            <?php else: ?>
              <a href="login.php">Login</a>
            <?php endif; ?>
          </div>
        </div>
      </div>
    </div>


    <div id="mainContent">
      <div id="pdf">
        <div id="navigate">
          <button id="prev">Previous</button>
          <span>Page: <span id="page_num">loading</span> / <span id="page_count">-</span></span>
          <button id="next">Next</button>
          &nbsp; &nbsp;
          <br />
        </div>
        <div id="canvas-container">
        </div> <br />
      </div>
    </div>
  </div>

  <div id="grayOverlay">
    <div id="textBox">
      <div id="textMenu">
        <!-- Commented code for text menu -->
      </div>
      <div id="speedreadTextContainer">
        <div id="speedreadText"></div>
      </div>
    </div>
  </div>
</body>

</html>