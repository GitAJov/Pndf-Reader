<?php
session_start();
$isLoggedIn = isset($_SESSION['user_id']);
$username = '';

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
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Reader</title>
    <script src="js/homepage.js" type="module"></script>
    <script src="js/dark-mode.js" type="module"></script>
    <link rel="stylesheet" href="css/homepage.css" />
    <link rel="stylesheet" href="css/welcome.css" />
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@40,400,0,0" />
</head>

<body style="overflow-y: auto">
    <div id="container">
        <div id="topMenu">
            <img src="Resources/pndf-logo.png" id="pndf-logo" alt="PNDF Reader"
                onclick="window.location.href = 'welcome.php';">
            <div class="nav-right">
                <button onclick="window.location.href='index.php'" class="pdfbtn">Upload File</button>
                <div class="dropdown">
                    <button class="dropbtn">Tools
                        <i class="material-symbols-outlined" style="font-size: 36px"> arrow_drop_down </i>
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
        <!-- New Welcome Page Content -->
        <div class="pndf-reader-container">
            <section class="hero-section">
                <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/e87e1c1bb4bdb777c8d2bce00b936d100e2061d08fbee611eaeb915b0b1acfa7?"
                    alt="PNDF Reader Hero Background" class="hero-image" />
                <h1 class="hero-title"><?php
                if ($isLoggedIn) {
                    echo "Welcome to Pndf Reader, " . htmlspecialchars($username) . "!";
                } else {
                    echo "Welcome to Pndf Reader, Guest";
                }
                ?></h1>
                <p class="hero-description">Upload, manage, and read your PDFs with a friendly panda mascot. Try it for
                    free.</p>
            </section>

            <section class="features-section">
                <div class="features-container">
                    <article class="feature-column">
                        <div class="feature-item" onclick="window.location.href = 'index.php'">
                            <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/1b49f92d71b1854b068665cb204180a5fd9f9627d1eee10b7411728e14475108?"
                                alt="Upload PDFs Icon" class="feature-icon" />
                            <h2 class="feature-title">Upload PDFs</h2>
                            <p class="feature-description">Easily upload any PDF from your computer.</p>
                        </div>
                    </article>
                    <article class="feature-column">
                        <div class="feature-item" onclick="window.location.href = 'mydocs.php'">
                            <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/f65807204f2ca7070de8467e61e2734324660c3735669d0415201b49009143c8?"
                                alt="Organize PDFs Icon" class="feature-icon" />
                            <h2 class="feature-title">Organize your PDFs</h2>
                            <p class="feature-description">Create folders to organize your PDFs.</p>
                        </div>
                    </article>
                    <article class="feature-column">
                        <div class="feature-item" onclick="window.location.href = 'index.php'">
                            <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/9ad0432ff97524d4a1b294da49a8fd484cbf4ce0fd2c0703974659f918160b72?"
                                alt="Read with Ease Icon" class="feature-icon" />
                            <h2 class="feature-title">Read with ease</h2>
                            <p class="feature-description">Enjoy a simple and beautiful reading experience.</p>
                        </div>
                    </article>
                </div>
            </section>

            <section class="cta-section">
                <h2 class="cta-title">Ready to start reading your PDFs with a friendly panda?</h2>
                <p class="cta-description">Sign up for free and get instant access to the best PDF reader on the
                    internet</p>
                <a href="register.php" class="cta-button">Get Started</a>
            </section>
        </div>

    </div>
</body>

</html>