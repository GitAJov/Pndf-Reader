<?php
require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__, 'var.env');
$dotenv->load();
$api_key = $_ENV['MY_API_KEY'];

session_start();
$isLoggedIn = isset($_SESSION['user_id']);
$username = '';
$file_path = '';

if ($isLoggedIn) {
  include 'php/database.php';

  $user_id = $_SESSION['user_id'];
  $sql = "SELECT username FROM users WHERE id = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("s", $user_id);
  $stmt->execute();
  $stmt->bind_result($username);
  $stmt->fetch();
  $stmt->close();

  // Check if doc_id is set and get the document path
  if (isset($_GET['doc_id'])) {
    $doc_id = $_GET['doc_id'];
    $doc_sql = "SELECT file_path FROM pdf_files WHERE id = ? AND user_id = ?";
    $doc_stmt = $conn->prepare($doc_sql);
    $doc_stmt->bind_param("ii", $doc_id, $user_id);
    $doc_stmt->execute();
    $doc_stmt->bind_result($file_path);
    $doc_stmt->fetch();
    $doc_stmt->close();
  }
  $conn->close();
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Reader</title>
  <style>
    .hiddenCanvasElement {
      display: none;
    }
  </style>
  <script type="importmap">
    {
      "imports": {
        "@google/generative-ai": "https://esm.run/@google/generative-ai"
      }
    }
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.mjs" type="module"></script>
  <script src="js/homepage.js" type="module"></script>
  <script src="js/darkmode.js" type="module"></script>
  <script src="js/voiceRecognition.js" type="module"></script>
  <link rel="stylesheet" href="css/homepage.css" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

  <script type="module">
    import { initializeGemini } from './js/gemini.js';
    import { initializePDF, onNextPage, onPrevPage } from './js/homepage.js';  // Import initializePDF function
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
      const filePath = "<?php echo $file_path; ?>";
      if (filePath) {
        initializePDF(filePath);

        // Hide main menu, show mainContent and show footbar if doc_id is present
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('mainContent').style.display = 'flex';
        document.getElementById('footbar').style.display = 'flex';
      }
    };

    document.addEventListener('DOMContentLoaded', (event) => {
      document.getElementById('next').addEventListener('click', onNextPage);
      document.getElementById('prev').addEventListener('click', onPrevPage);

      const startButton = document.getElementById('start');
      const pauseButton = document.getElementById('pause');
      const resumeButton = document.getElementById('resume');
      const cancelButton = document.getElementById('cancel');
      // const voicesSelect = document.getElementById('voices');

      pauseButton.style.display = 'none';
      resumeButton.style.display = 'none';

      startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
        // voicesSelect.style.display = 'inline-block';
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
</head>

<body>
  <div id="container">
    <div id="topMenu">
      <img src="Resources/pndf-logo.png" id="pndf-logo" alt="PNDF Reader">
      <div class="nav-right">
        <button id="docs" class="docsbtn" onclick="window.location.href='mydocs.php'">My Documents</button>
        <button id="file" class="filebtn">New File</button>

        <div class="dropdown">
          <button class="dropbtn">Tools
            <img src="Resources/drop-icon.png" alt="Drop Icon" class="drop-icon">
          </button>
          <div class="dropdown-content">
            <a href="#" id="speedread" style="display: none">Speedread</a>
            <a href="#" id="dyslexia" style="display: none">Dyslexia</a>
            <a href="#" id="theme-toggle-item">Toggle Theme</a>
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
              <!-- <a href="profile.php">Profile</a> -->
              <a href="./php/logout.php">Logout</a>
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
          <p>Files remain private and are automatically deleted after use.</p>
        </div>
        <img src="Resources/panda-upload.png" alt="Panda Image" class="panda-upload">
      </div>
    </div>

    <div id="mainContent">
      <div id="pdf">
        <div id="navigate">
          <button id="prev">Previous</button>
          <span>Page:
            <span><input type="text" id="pageInput" value="1" /></span>
            /
            <span id="page_count">-</span>
          </span>
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
            <button id="mic"><i class="material-icons">mic</i></button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div id="loadingOverlay">
    <img src="Resources/panda-slide.gif" alt="Loading..." />
    <label>Rendering...</label>
  </div>
  </div>

  <div id="grayOverlay">
    <div id="textBox">
      <!-- Start of text menu -->
      <div id="textMenu"></div>
      <div id="speedreadContainer">
        <div id="speedreadTextContainer">
          <span id="speedreadText"></span>
        </div>
        <div id="paragraphContainer"></div>
      </div>
      <div class="textMenu-buttons">
        <button id="prevPage">Previous Page</button>
        <button id="nextPage">Next Page</button>
      </div>
    </div>
  </div>
</body>

</html>