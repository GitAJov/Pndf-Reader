<?php
require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__, 'var.env');
$dotenv->load();
$api_key = $_ENV['MY_API_KEY'];

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
  <script type="importmap">
      {
        "imports": {
          "@google/generative-ai": "https://esm.run/@google/generative-ai"
        }
      }
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.mjs" type="module"></script>
  <script src="js/homepage.js" type="module"></script>
  <link rel="stylesheet" href="css/homepage.css" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

  <script type="module">
    import { initializeGemini } from './js/gemini.js';
    const apiKey = "<?php echo htmlspecialchars($api_key); ?>";
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
      initializeGemini(apiKey);
    };
  </script>
</head>

<body>
  <div id="container">
    <div id="topMenu">
      <img src="Resources/pndf-logo.png" id="pndf-logo" alt="PNDF Reader">
      <div class="nav-right">
        <button id="file" class="filebtn"> File </button>
        <div class="dropdown">
          <button class="dropbtn">Tools
            <img src="Resources/drop-icon.png" alt="Drop Icon" class="drop-icon">
          </button>
          <div class="dropdown-content">
            <a href="#" id="speedread">Speedread</a>
            <a href="#" id="dyslexia">Dyslexia</a>
            <a href="#" id="theme-toggle-item">Toggle Theme</a> <!-- New theme toggle option -->
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
            <img src="Resources/profile-icon.png" alt="Profile Icon" class="profile-icon">
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
    <div id="mainMenu">
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
          <button id="choosefile" class="choose-file-button">Choose File</button>
          <p>... or drop a file here</p>
          <p>Files stay private. Automatically deletes after 2 hours</p>
        </div>
        <img src="Resources/panda-upload.png" alt="Panda Image" class="panda-upload">
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
        <div class="before-canvas-container">
          <div id="canvas-container">
          </div> <br />
        </div>
        <div id="footbar">
          <div class="texttospeech-nav">
            <button id="start"><i class="material-icons">play_arrow</i></button>
            <button id="pause"><i class="material-icons">pause</i></button>
            <button id="resume"><i class="material-icons">play_arrow</i></button>
            <button id="cancel"><i class="material-icons">stop</i></button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="grayOverlay">
    <div id="textBox">
      <!-- Start of text menu -->
      <div id="textMenu" class="text-menu"></div>
      <div id="speedreadContainer">
          <div id="speedreadTextContainer">
            <span id="speedreadText"></span>
          </div>
        </div>
      <div id="paragraphContainer"></div>
      <div class="textMenu-buttons">
        <button id="prevPage">Previous Page</button>
        <button id="nextPage">Next Page</button>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', (event) => {
      const startButton = document.getElementById('start');
      const pauseButton = document.getElementById('pause');
      const resumeButton = document.getElementById('resume');
      const cancelButton = document.getElementById('cancel');
      const voicesSelect = document.getElementById('voices');

      pauseButton.style.display = 'none';
      resumeButton.style.display = 'none';

      startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
        voicesSelect.style.display = 'inline-block';
      });

      pauseButton.addEventListener('click', () => {
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'inline-block';
      });

      resumeButton.addEventListener('click', () => {
        resumeButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
      });

      cancelButton.addEventListener('click', () => {
        startButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'none';
      });
    });
  </script>
</body>

</html>