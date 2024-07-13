document.addEventListener("DOMContentLoaded", () => {
    const themeToggleItem = document.getElementById("theme-toggle-item"); // Dropdown item for toggling theme
    const body = document.body;
    const topMenu = document.getElementById("topMenu");
    const navigate = document.getElementById("navigate");
    const dropdowns = document.querySelectorAll(".dropdown, .profile-dropdown");
    const pndfLogo = document.getElementById("pndf-logo");
    const dropIcon = document.querySelector(".drop-icon");
    const profileIcon = document.querySelector(".profile-icon");
    const fileBtns = document.getElementsByClassName("filebtn");
    const footbar = document.getElementById("footbar");
  
    // Function to update the text of the theme toggle item
    function updateThemeToggleText() {
      if (body.classList.contains("dark-mode")) {
        themeToggleItem.textContent = "Light Mode";
      } else {
        themeToggleItem.textContent = "Dark Mode";
      }
    }
  
    // Check local storage for saved theme preference
    if (localStorage.getItem("theme") === "dark") {
      body.classList.add("dark-mode");
      topMenu.classList.add("dark-mode");
      footbar.classList.add("dark-mode");
      navigate.classList.add("dark-mode");
      Array.from(fileBtns).forEach((fileBtn) => {
        fileBtn.classList.add("dark-mode");
      });
      dropdowns.forEach((dropdown) => {
        dropdown.querySelector(".dropbtn").classList.add("dark-mode");
        dropdown.querySelector(".dropdown-content").classList.add("dark-mode");
      });
      pndfLogo.src = "Resources/pndf-logo-dark-mode.png";
      dropIcon.src = "Resources/drop-icon-dark-mode.png";
      profileIcon.src = "Resources/profile-icon-dark-mode.png";
    }
  
    // Update the button text based on the initial theme
    updateThemeToggleText();
  
    themeToggleItem.addEventListener("click", () => {
      body.classList.toggle("dark-mode");
      topMenu.classList.toggle("dark-mode");
      footbar.classList.toggle("dark-mode");
      navigate.classList.toggle("dark-mode");
      Array.from(fileBtns).forEach((fileBtn) => {
        fileBtn.classList.toggle("dark-mode");
      });
      dropdowns.forEach((dropdown) => {
        dropdown.querySelector(".dropbtn").classList.toggle("dark-mode");
        dropdown.querySelector(".dropdown-content").classList.toggle("dark-mode");
      });
      // Change logos based on the theme
      if (body.classList.contains("dark-mode")) {
        pndfLogo.src = "Resources/pndf-logo-dark-mode.png";
        dropIcon.src = "Resources/drop-icon-dark-mode.png";
        profileIcon.src = "Resources/profile-icon-dark-mode.png";
      } else {
        pndfLogo.src = "Resources/pndf-logo.png";
        dropIcon.src = "Resources/drop-icon.png";
        profileIcon.src = "Resources/profile-icon.png";
      }
      // Update the theme toggle button text
      updateThemeToggleText();
      // Save the user's preference in local storage
      localStorage.setItem(
        "theme",
        body.classList.contains("dark-mode") ? "dark" : "light"
      );
    });
  });