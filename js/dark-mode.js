document.addEventListener("DOMContentLoaded", () => {
    const themeToggleItem = document.getElementById("theme-toggle-item");
    const body = document.body;
    const topMenu = document.getElementById("topMenu");
    const navigate = document.getElementById("navigate");
    const dropdowns = document.querySelectorAll(".dropdown, .profile-dropdown");
    const pndfLogo = document.getElementById("pndf-logo");
    const fileBtns = document.getElementsByClassName("filebtn");
    const homeBtns = document.getElementsByClassName("homebtn");
    const pdfBtns = document.getElementsByClassName("pdfbtn");
    const textBox = document.getElementById("textBox");
    const textMenuButtons = document.querySelector(".textMenu-buttons");
    const mainContent = document.getElementById("mainContent");

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
        if (navigate) navigate.classList.add("dark-mode");
        if (textBox) textBox.classList.add("dark-mode");
        if (textMenuButtons) textMenuButtons.classList.add("dark-mode");
        if (mainContent) mainContent.classList.add("dark-mode");
        Array.from(fileBtns).forEach((fileBtn) => {
            fileBtn.classList.add("dark-mode");
        });
        Array.from(homeBtns).forEach((homeBtn) => {
            homeBtn.classList.add("dark-mode");
        });
        Array.from(pdfBtns).forEach((pdfBtn) => {
            pdfBtn.classList.add("dark-mode");
        });
        dropdowns.forEach((dropdown) => {
            dropdown.querySelector(".dropbtn").classList.add("dark-mode");
            dropdown.querySelector(".dropdown-content").classList.add("dark-mode");
        });
        pndfLogo.src = "Resources/pndf-logo-dark-mode.png";
    }

    // Update the button text based on the initial theme
    updateThemeToggleText();

    themeToggleItem.addEventListener("click", () => {
        const isDarkMode = body.classList.toggle("dark-mode");
        topMenu.classList.toggle("dark-mode");
        if (navigate) navigate.classList.toggle("dark-mode");
        if (textBox) textBox.classList.toggle("dark-mode");
        if (textMenuButtons) textMenuButtons.classList.toggle("dark-mode");
        if (mainContent) mainContent.classList.toggle("dark-mode");
        Array.from(fileBtns).forEach((fileBtn) => {
            fileBtn.classList.toggle("dark-mode");
        });
        Array.from(homeBtns).forEach((homeBtn) => {
            homeBtn.classList.toggle("dark-mode");
        });
        Array.from(pdfBtns).forEach((pdfBtn) => {
            pdfBtn.classList.toggle("dark-mode");
        });
        dropdowns.forEach((dropdown) => {
            dropdown.querySelector(".dropbtn").classList.toggle("dark-mode");
            dropdown.querySelector(".dropdown-content").classList.toggle("dark-mode");
        });
        // Change logos based on the theme
        if (isDarkMode) {
            pndfLogo.src = "Resources/pndf-logo-dark-mode.png";
        } else {
            pndfLogo.src = "Resources/pndf-logo.png";
        }
        // Update the theme toggle button text
        updateThemeToggleText();
        // Save the user's preference in local storage
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    });
});
