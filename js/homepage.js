import { formatText } from "../js/gemini.js";
import { formatDisplayText } from "../js/gemini.js";

var { pdfjsLib } = globalThis;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";

let pdfDoc = null,
  pageNum = 1,
  pageRendering = false,
  pageNumPending = null,
  scale = 1.5,
  canvases = [],
  renderTasks = [],
  renderingPdf = false,
  mode = "",
  overlayActive = false;

// PDF Loading
async function loadPDF(url) {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    console.log("PDF loaded");
    return pdf;
  } catch (error) {
    console.error("Error loading PDF:", error);
  }
}

async function initializePDF(url) {
  reset();
  let tempDoc = await loadPDF(url);
  pdfDoc = tempDoc;
  if (pdfDoc) {
    document.getElementById("page_count").textContent = pdfDoc.numPages;
    document.getElementById("page_num").textContent = pageNum; // Update page number immediately
    await renderAllPages(pdfDoc, scale); // Render all pages at once

    // Add scroll event listener to update pageNum based on visible page
    const canvasContainer = document.getElementById("canvas-container");
    canvasContainer.addEventListener("scroll", updatePageNumBasedOnScroll);
  }
}

function reset() {
  (pageNum = 1),
    (pageRendering = false),
    (pageNumPending = null),
    (scale = 1.5),
    (canvases = []),
    (renderTasks = []),
    (document.getElementById("canvas-container").innerHTML = "");
  console.log("Reset done");
}

async function renderAllPages(pdf = pdfDoc, scale = 1.5) {
  try {
    const numPages = pdf.numPages;
    renderingPdf = true;
    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
      if (pdfDoc.constructor === String) {
        console.log("Pdf Changed in renderAllPages");
        reset();
        initializePDF(pdfDoc);
        return;
      }
      await renderPage(pdf, pageNumber, scale);
    }
    renderingPdf = false;
    console.log("All pages rendered");
    handleTextToSpeech();
  } catch (error) {
    console.error("Error rendering pages:", error);
  }
}

async function renderPage(pdf = pdfDoc, pageNumber = pageNum, scale = 1.5) {
  try {
    //if pdfdoc type is string
    if (pdfDoc.constructor === String) {
      console.log("Pdf Changed in renderPage");
      reset();
      return;
    }
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: scale });

    // Create a new canvas element for this page
    const canvas = document.createElement("canvas");
    canvas.id = `page-${pageNumber}`;
    canvas.className = "pdf-page"; // Optional: add a class for styling
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Insert the new canvas at the correct position
    const canvasContainer = document.getElementById("canvas-container");
    const existingCanvas = document.getElementById(`page-${pageNumber}`);
    if (existingCanvas) {
      canvasContainer.insertBefore(canvas, existingCanvas.nextSibling);
      existingCanvas.remove(); // Remove the old canvas
    } else {
      canvasContainer.appendChild(canvas); // Append new canvas if it doesn't exist
    }

    canvases.push(canvas); // Add canvas to the array

    const context = canvas.getContext("2d");
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    // Ensure previous rendering task is completed or canceled
    if (renderTasks[pageNumber - 1]) {
      await renderTasks[pageNumber - 1].promise;
    }

    // Start rendering the page to the canvas
    renderTasks[pageNumber - 1] = page.render(renderContext);
    await renderTasks[pageNumber - 1].promise;

    console.log(`Page ${pageNumber} rendered`);
  } catch (error) {
    console.error("Error rendering page:", error);
  }
}

function updatePageNumBasedOnScroll() {
  const canvasContainer = document.getElementById("canvas-container");
  const scrollPosition = canvasContainer.scrollTop;
  const viewportHeight = canvasContainer.clientHeight;
  const viewportMidpoint = scrollPosition + viewportHeight / 2;
  let visiblePage = 1;

  // Calculate the visible page based on the midpoint of the viewport
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    const pageTop = canvas.offsetTop;
    const pageBottom = pageTop + canvas.height;

    if (viewportMidpoint >= pageTop && viewportMidpoint < pageBottom) {
      visiblePage = i + 1; // Pages are 1-indexed
      break;
    }
  }

  if (visiblePage !== pageNum) {
    pageNum = visiblePage;
    console.log(`Visible page: ${pageNum}`);
    document.getElementById("page_num").textContent = pageNum;
  }
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    pageRendering = true;
    renderPage(pdfDoc, num, scale);
  }
}

function onPrevPage() {
  if (pageNum > 1) {
    pageNum--;

    const canvas = canvases[pageNum - 1];
    if (canvas) {
      canvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

function onNextPage() {
  if (pageNum < pdfDoc.numPages) {
    pageNum++;
    console.log("Page Number: ", pageNum);
    const canvas = canvases[pageNum - 1];
    if (canvas) {
      canvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

function blurPage(blur) {
  var elementsToBlur = document.body.children;
  for (var i = 0; i < elementsToBlur.length; i++) {
    var element = elementsToBlur[i];
    if (element.id !== "grayOverlay") {
      if (blur) {
        element.style.filter = "blur(5px)";
      } else {
        element.style.filter = "none";
      }
    }
  }
}

function toggleOverlay() {
  overlayActive = !overlayActive;
  blurPage(overlayActive);
  let grayOverlay = document.getElementById("grayOverlay");
  grayOverlay.style.display = overlayActive ? "block" : "none";
}

async function extractParagraphs(pageNumber) {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const textItems = textContent.items;
    let finalString = "";
    let line = 0;

    // Concatenate the string of the item to the final string
    for (let i = 0; i < textItems.length; i++) {
      if (line != textItems[i].transform[5]) {
        if (line != 0) {
          finalString += "\r\n";
        }
        line = textItems[i].transform[5];
      }
      finalString += textItems[i].str;
    }

    return finalString;
  } catch (error) {
    console.error("Error extracting text:", error);
  }
}

function exitOverlay(event) {
  if (event.target.id === "grayOverlay") {
    overlayActive = false;
    blurPage(false);
    let grayOverlay = document.getElementById("grayOverlay");
    grayOverlay.style.display = "none";
    let speedreadTextElement = document.getElementById("speedreadText");
    speedreadTextElement.style.letterSpacing = "";
    clearTextMenu();
    mode = "";
    const buttonPrev = document.getElementById("prevPage");
    buttonPrev.removeEventListener("click", pressPrev);

    const buttonNext = document.getElementById("nextPage");
    buttonNext.removeEventListener("click", pressNext);

  }
}

function chooseFont() {
  let font = document.getElementById("fontChooser").value;
  let size = document.getElementById("fontSize").value;
  let speedreadTextElement = document.getElementById("speedreadText");
  speedreadTextElement.style.fontFamily = font;
  speedreadTextElement.style.fontSize = size + "px";
}

function chooseFile() {
  const inputElement = document.createElement("input");
  inputElement.type = "file";
  inputElement.multiple = false;
  inputElement.accept = ".pdf";

  inputElement.addEventListener("change", async function (event) {
    const files = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      pdfDoc = URL.createObjectURL(file);
      if (!renderingPdf) {
        initializePDF(pdfDoc);
        document.getElementById("footbar").style.display = "flex";
      }
    }
  });
  inputElement.click();
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("mainContent").style.display = "flex";
}

function createFontSizeElements() {
  const fontLabel = document.createElement("label");
  fontLabel.setAttribute("for", "fontChooser");
  fontLabel.textContent = "Font:";

  const fontChooser = document.createElement("select");
  fontChooser.id = "fontChooser";

  const fonts = ["Arial", "Times New Roman", "Verdana", "OpenDyslexic"];
  fonts.forEach((font) => {
    const option = document.createElement("option");
    option.value = font;
    option.textContent = font;
    fontChooser.appendChild(option);
  });

  const fontSizeLabel = document.createElement("label");
  fontSizeLabel.setAttribute("for", "fontSize");
  fontSizeLabel.textContent = "Font Size:";

  const fontSizeInput = document.createElement("input");
  fontSizeInput.type = "number";
  fontSizeInput.id = "fontSize";
  fontSizeInput.value = 36;
  fontSizeInput.min = 10;
  fontSizeInput.max = 72;

  fontChooser.addEventListener("change", chooseFont);
  fontSizeInput.addEventListener("change", chooseFont);

  return { fontLabel, fontChooser, fontSizeLabel, fontSizeInput };
}

function pressPrev() {
  if (overlayActive) {
    if (mode === "dyslexia") {
      onPrevPage();
      displayDyslexiaText();
    } else if (mode === "speedread") {
      onPrevPage();
      displaySpeedreadText();
    }
  }
}

function pressNext() {
  if (overlayActive) {
    if (mode === "dyslexia") {
      console.log("Next page button pressed!");
      onNextPage();
      displayDyslexiaText();
    } else if (mode === "speedread") {
      onNextPage();
      displaySpeedreadText();
    }
  }
}

async function speedread() {
  speedTextMenu();
  toggleOverlay();
  if (overlayActive) {
    mode = "speedread";
    displaySpeedreadText();
  }
}

function speedTextMenu() {
  let textMenu = document.getElementById("textMenu");

  const { fontLabel, fontChooser, fontSizeLabel, fontSizeInput } =
    createFontSizeElements();

  const wpmLabel = document.createElement("label");
  wpmLabel.setAttribute("for", "wpm");
  wpmLabel.textContent = "Words Per Minute:";

  const wpmInput = document.createElement("input");
  wpmInput.type = "number";
  wpmInput.id = "wpm";
  wpmInput.value = 300;
  wpmInput.min = 50;
  wpmInput.max = 800;
  wpmInput.step = 25;

  textMenu.appendChild(fontLabel);
  textMenu.appendChild(fontChooser);
  textMenu.appendChild(fontSizeLabel);
  textMenu.appendChild(fontSizeInput);
  textMenu.appendChild(wpmLabel);
  textMenu.appendChild(wpmInput);

  const buttonPrev = document.getElementById("prevPage");
  buttonPrev.addEventListener("click", pressPrev);

  const buttonNext = document.getElementById("nextPage");
  buttonNext.addEventListener("click", pressNext);
}

async function displaySpeedreadText() {
  try {
    let speedreadWordElement = document.getElementById("speedreadText");
    let paragraphContainer = document.getElementById("paragraphContainer");
    let speedreadTextElement = document.getElementById("speedreadText");

    let paragraph = await extractParagraphs(pageNum);
    let formattedParagraph = await formatDisplayText(paragraph);
    let lines = formattedParagraph.split("\n"); // Split by new lines

    paragraphContainer.textContent = ""; // Clear previous content

    // // Apply font settings
    let selectedFont = document.getElementById("fontChooser").value;
    let selectedFontSize = document.getElementById("fontSize").value;
    speedreadTextElement.style.fontFamily = selectedFont;
    speedreadTextElement.style.fontSize = selectedFontSize + "px";

    // Create a fragment to hold the lines and words
    let fragment = document.createDocumentFragment();
    lines.forEach((line) => {
      let lineElement = document.createElement("div");
      let splitLine = line.split(" ").filter(function (el) {
        return el != "";
      });

      splitLine.forEach((word, index) => {
        let span = document.createElement("span");
        span.textContent = word + " ";
        lineElement.appendChild(span);
      });

      fragment.appendChild(lineElement);
    });
    paragraphContainer.appendChild(fragment);

    let words = paragraphContainer.querySelectorAll("span");
    for (let i = 0; i < words.length; i++) {
      if (!overlayActive) break;
      let word = words[i].textContent.trim();

      // Display current word with underline
      speedreadWordElement.textContent = word;

      // Update the current word class
      let currentWordElements =
        paragraphContainer.querySelectorAll(".current-word");
      currentWordElements.forEach((el) => el.classList.remove("current-word"));
      let currentWordElement = words[i];
      currentWordElement.classList.add("current-word");

      // Scroll down when the underlined word reaches the bottom
      if (currentWordElement) {
        let rect = currentWordElement.getBoundingClientRect();
        let containerRect = paragraphContainer.getBoundingClientRect();
        if (rect.bottom > containerRect.bottom) {
          paragraphContainer.scrollTop += rect.bottom - containerRect.bottom;
        }
      }

      let wpm = document.getElementById("wpm").value;
      let delay = 60000 / wpm;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  } catch (error) {
    console.error("Error displaying text:", error);
  }
}

function dyslexia() {
  dyslexiaMenu();
  toggleOverlay();
  if (overlayActive) {
    mode = "dyslexia";
    displayDyslexiaText();
  }
}

function dyslexiaMenu() {
  const textMenu = document.getElementById("textMenu");

  // Create font controls
  const { fontLabel, fontChooser, fontSizeLabel, fontSizeInput } =
    createFontSizeElements();
  const fontChooserLabel = document.createElement("label");
  fontChooserLabel.setAttribute("for", "fontChooser");
  fontChooserLabel.textContent = "Font:";
  textMenu.appendChild(fontChooserLabel);
  textMenu.appendChild(fontChooser);
  textMenu.appendChild(fontSizeLabel);
  textMenu.appendChild(fontSizeInput);

  // Create spacing controls
  const spacingLabel = document.createElement("label");
  spacingLabel.setAttribute("for", "spacing");
  spacingLabel.textContent = "Spacing:";
  textMenu.appendChild(spacingLabel);

  const spacingInput = document.createElement("input");
  spacingInput.type = "number";
  spacingInput.id = "spacing";
  spacingInput.value = 1;
  spacingInput.min = 0;
  spacingInput.max = 10;
  textMenu.appendChild(spacingInput);
  spacingInput.addEventListener("change", updateSpacing);

  // Create alignment controls container
  const alignmentContainer = document.createElement("div");
  alignmentContainer.classList.add("alignment-container");
  textMenu.appendChild(alignmentContainer);

  // Create alignment controls
  const alignmentLabel = document.createElement("label");
  alignmentLabel.setAttribute("for", "alignmentChooser");
  alignmentLabel.textContent = "Text Alignment:";
  alignmentContainer.appendChild(alignmentLabel);

  const alignmentChooser = document.createElement("select");
  alignmentChooser.id = "alignmentChooser";
  const alignments = ["left", "center", "right", "justify"];
  alignments.forEach((alignment) => {
    const option = document.createElement("option");
    option.value = alignment;
    option.textContent = alignment.charAt(0).toUpperCase() + alignment.slice(1);
    alignmentChooser.appendChild(option);
  });
  alignmentContainer.appendChild(alignmentChooser);
  alignmentChooser.addEventListener("change", updateAlignment);

  // Create Bold and Italic buttons with hover/click states
  const boldButton = document.createElement("button");
  boldButton.textContent = "B";
  boldButton.classList.add("toggle-button");
  boldButton.addEventListener("click", function () {
    boldButton.classList.toggle("active");
    const speedreadText = document.getElementById("speedreadText");
    speedreadText.style.fontWeight = boldButton.classList.contains("active")
      ? "bold"
      : "normal";
  });
  alignmentContainer.appendChild(boldButton);

  const italicButton = document.createElement("button");
  italicButton.textContent = "I";
  italicButton.classList.add("toggle-button");
  italicButton.addEventListener("click", function () {
    italicButton.classList.toggle("active");
    const speedreadText = document.getElementById("speedreadText");
    speedreadText.style.fontStyle = italicButton.classList.contains("active")
      ? "italic"
      : "normal";
  });
  alignmentContainer.appendChild(italicButton);

  const buttonPrev = document.getElementById("prevPage");
  buttonPrev.addEventListener("click", pressPrev);

  const buttonNext = document.getElementById("nextPage");
  buttonNext.addEventListener("click", pressNext);

  // Initial text display
  displayDyslexiaText();
}

function updateSpacing() {
  let spacing = document.getElementById("spacing").value;
  let speedreadTextElement = document.getElementById("speedreadText");
  speedreadTextElement.style.wordSpacing = spacing + "px";
}

function updateAlignment() {
  let alignmentChooser = document.getElementById("alignmentChooser");
  let speedreadTextElement = document.getElementById("speedreadText");
  speedreadTextElement.style.textAlign = alignmentChooser.value;
}

async function displayDyslexiaText() {
  try {
    // Clear the paragraph container before loading new text
    let paragraphContainer = document.getElementById("paragraphContainer");
    paragraphContainer.innerHTML = "";

    // Clear the speedread text container before loading new text
    let speedreadTextElement = document.getElementById("speedreadText");
    speedreadTextElement.textContent = "";

    // Extract and display the new paragraph
    let paragraph = await extractParagraphs(pageNum);
    let formattedParagraph = await formatDisplayText(paragraph);

    console.log("Formatted paragraph:", formattedParagraph);

    // Replace new lines with <br> tags for proper HTML rendering
    let paragraphWithLineBreaks = formattedParagraph.replace(/\n/g, "<br>");

    // Use innerHTML instead of textContent to render the HTML
    speedreadTextElement.innerHTML = paragraphWithLineBreaks;
  } catch (error) {
    console.error("Error displaying text:", error);
  }
}

function clearTextMenu() {
  const textMenu = document.getElementById("textMenu");
  while (textMenu.firstChild) {
    textMenu.removeChild(textMenu.firstChild);
  }
}

function addEventListeners() {
  document.getElementById("speedread").addEventListener("click", speedread);
  document.getElementById("grayOverlay").addEventListener("click", exitOverlay);
  document.getElementById("choosefile").addEventListener("click", chooseFile);
  document.getElementById("file").addEventListener("click", chooseFile);
  document.getElementById("dyslexia").addEventListener("click", dyslexia);
}

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

async function handleTextToSpeech() {
  try {
    const numPages = pdfDoc.numPages;
    let allText = [];

    // Iterate through each page and extract text
    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
      const pageText = await extractParagraphs(pageNumber);
      allText.push(pageText); // Collect raw text for each page
    }

    let formattedTextArray = [];

    for (let text of allText) {
      let formattedText = await formatText(text);
      formattedTextArray.push(formattedText);
    }

    for (let formattedText of formattedTextArray) {
      await tts(formattedText);
    }
  } catch (error) {
    console.error("Error handling text to speech:", error);
  }
}

function tts(text) {
  let utterances = [];
  let voicesList = [];
  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.volume = 0.7;
  utterance.pitch = 1;

  utterance.addEventListener("error", (event) => {
    console.log("An error occurred: " + event.error);
  });

  const populateVoices = () => {
    voicesList = window.speechSynthesis.getVoices();
    if (voicesList.length) {
      utterance.voice = voicesList.find((voice) => voice.lang === "en-US");
      clearInterval(voiceTimer);
    }
  };

  const voiceTimer = setInterval(populateVoices, 1000);

  const speechUtteranceChunker = (utt, settings = {}, callback) => {
    const chunkLength = settings.chunkLength || 160;
    const txt =
      settings.offset !== undefined
        ? utt.text.substring(settings.offset)
        : utt.text;
    const chunkArr = txt.match(
      new RegExp(
        `^[\\s\\S]{${Math.floor(
          chunkLength / 2
        )},${chunkLength}}[.!?,]{1}|^[\\s\\S]{1,${chunkLength}}$|^[\\s\\S]{1,${chunkLength}} `
      )
    );

    if (!chunkArr || chunkArr[0].length <= 2) {
      if (callback) callback();
      return;
    }

    const chunk = chunkArr[0];
    const newUtt = new SpeechSynthesisUtterance(chunk);
    Object.assign(newUtt, utt, { text: chunk });
    newUtt.addEventListener("end", () => {
      if (speechUtteranceChunker.cancel) {
        speechUtteranceChunker.cancel = false;
        return;
      }
      settings.offset = (settings.offset || 0) + chunk.length - 1;
      speechUtteranceChunker(utt, settings, callback);
    });

    newUtt.addEventListener("error", (event) => {
      console.log("An error occurred: " + event.error);
    });

    utterances.push(newUtt);
    speechSynthesis.speak(newUtt);
  };

  document.getElementById("start").addEventListener("click", () => {
    speechUtteranceChunker.cancel = false;
    speechUtteranceChunker(utterance, { chunkLength: 120 }, () => {
      console.log("done");
    });
  });

  document.getElementById("pause").addEventListener("click", () => {
    window.speechSynthesis.pause();
  });

  document.getElementById("resume").addEventListener("click", () => {
    window.speechSynthesis.resume();
  });

  document.getElementById("cancel").addEventListener("click", () => {
    speechUtteranceChunker.cancel = true;
    window.speechSynthesis.cancel();
  });
}

window.addEventListener("scroll", function () {
  const topMenuHeight = document.getElementById("topMenu").offsetHeight;
  const navigate = document.getElementById("navigate");
  if (window.scrollY > topMenuHeight) {
    navigate.classList.add("fixed");
  } else {
    navigate.classList.remove("fixed");
  }
});

// Main Function
async function main() {
  // const url = "";
  // const url = "asdfasdf.pdf";

  addEventListeners();
  // initializePDF(url);
}

main();
