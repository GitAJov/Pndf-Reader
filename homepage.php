<?php
session_start();
$isLoggedIn = isset($_SESSION['user_id']);
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
          <span>Page: <span id="page_num">loading</span> / <span id="page_count">-</span></span>
          <br />
        </div>
        <div id="canvas-container">
        </div> <br />
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
        <!-- Commented code for text menu -->
      </div>
      <div id="speedreadTextContainer">
        <div id="speedreadText"></div>
      </div>
    </div>
  </div>
</body>

</html>