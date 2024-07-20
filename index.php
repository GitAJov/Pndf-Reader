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
  <script src="https://unpkg.com/browse/@rwh/keystrokes@latest/dist/keystrokes.umd.cjs"></script>
  <script>
    keystrokes.bindKey('a', () => console.log('you pressed a'))
  </script>
  <link rel="stylesheet" href="css/homepage.css" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@40,400,0,0" />

  <script type="module">
      import {initializeGemini} from './js/gemini.js';
      import {initializePDF, onNextPage, onPrevPage} from './js/homepage.js';  // Import initializePDF function
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
      <div title="Go back to the homepage." style="--tooltip-position: bottom;">
        <img src="Resources/pndf-logo.png" id="pndf-logo" alt="PNDF Reader" title="Go back to the homepage."
          onclick="window.location.href = 'welcome.php';">
      </div>
      <div class="nav-right">
        <button id="docs" class="docsbtn" onclick="window.location.href='mydocs.php'"
          title="Open your saved documents. Shortcut: M">My Documents</button>
        <button id="file" class="filebtn" title="Open a new file. Shortcut: F">New File</button>

        <div class="dropdown">
          <button class="dropbtn">Tools
            <i class="material-symbols-outlined" style="font-size: 36px"> arrow_drop_down </i>
          </button>
          <div class="dropdown-content">
            <a href="#" id="speedread" style="display: none"
              title="Display words quickly to read faster. Shortcut: R">Speedread</a>
            <a href="#" id="dyslexia" style="display: none"
              title="Read the text with your own preferred settings. Shortcut: D">Dyslexia</a>
            <a href="#" id="theme-toggle-item" title="Toggle between light or dark mode. Shortcut: T">Toggle Theme</a>
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
            <i class="material-symbols-outlined" style="font-size: 36px"> account_circle </i>
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
        <div>
          <div id="navigate">
            <div>
              <button id="prev" title="Go to the previous page. Shortcut: ','" acceskey=",">Previous</button>
              <span>Page:
                <span><input type="text" id="pageInput" value="1" /></span>
                /
                <span id="page_count">-</span>
              </span>
            </div>
            <button id="next" title="Go to the next page. Shortcut: '.'">Next</button>
            &nbsp; &nbsp;
            <br />
          </div>
          <div class="before-canvas-container">
            <div id="canvas-container">
            </div> <br />
          </div>
          <div id="footbar">
            <div class="texttospeech-nav">
              <button id="speak" style="display:inline-block;"
                title="Let the website read the text out loud for you. Shortcut: 1 "><i
                  class="material-icons">headphones</i></button>
              <button id="start" style="display:none;" title="Start the text-to-speech. Shortcut: 2"><i
                  class="material-icons">play_arrow</i></button>
              <button id="pause" style="display:none;" title="Pause the text-to-speech. Shortcut: 3"><i
                  class="material-icons">pause</i></button>
              <button id="resume" style="display:none;" title="Resume the text-to-speech. Shortcut: 4"><i
                  class="material-icons">play_arrow</i></button>
              <button id="cancel" style="display:none;" title="Stop the text-to-speech. Shortcut: 5"><i
                  class="material-icons">stop</i></button>
              <button id="mic" title="Speak the commands you want the website to run. Shortcut: S"><i
                  class="material-icons">mic</i></button>
            </div>
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