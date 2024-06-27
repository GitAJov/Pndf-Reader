<?php
session_start();
$isLoggedIn = isset($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html>

<head>
  <title>PDF Reader</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.mjs" type="module"></script>
  <script src="homepage.js" type="module"></script>
  <link rel="stylesheet" href="css/homepage.css" />
</head>

<body>
  <div id="container">
    <div id="topMenu">
      <button id="file">File</button>
      <button id="tools">Tools</button>
      <button id="view">View</button>
      <button id="help">Help</button>
      <form action="<?php echo $isLoggedIn ? 'logout.php' : 'login.php'; ?>" method="post" style="display:inline;">
        <button type="submit" id="loginlogout"><?php echo $isLoggedIn ? 'Logout' : 'Login'; ?></button>
      </form>
    </div>

    <div id="mainContent">
      <div id="pdf">
        <div id="navigate">
          <button id="prev">Previous</button>
          <button id="next">Next</button>
          &nbsp; &nbsp;
          <span>Page: <span id="page_num"></span> / <span id="page_count"></span></span>
          <br />
        </div>
        <canvas id="the-canvas"></canvas>
        <br />
      </div>
      <div id="sideMenu">
        <button id="speedread">Speedread</button>
        <button id="dyslexia">Dyslexia</button>
        <button id="zoom">Zoom</button>
      </div>
    </div>
  </div>

  <div id="grayOverlay">
    <div id="textBox">
      <div id="textMenu">
        <!-- <label for="fontChooser">Font:</label>
        <select id="fontChooser">
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
        </select>
        <label for="fontSize">Font Size:</label>
        <input type="number" id="fontSize" value="36" min="10" max="72" />
        <label for="wpm">Words Per Minute:</label>
        <input type="number" id="wpm" value="300" min="50" max="800" step="25" /> -->
      </div>
      <div id="speedreadTextContainer">
        <div id="speedreadText"></div>
      </div>
    </div>
  </div>
</body>

</html>