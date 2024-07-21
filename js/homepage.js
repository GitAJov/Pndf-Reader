import { formatText } from "../js/gemini.js";
import { formatDisplayText } from "../js/gemini.js";
import { RecognizeandVisualize } from "./voiceRecognition.js";

// PDF.JS CONFIGURATION ====================================
var { pdfjsLib } = globalThis;

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";

let pdfDoc = null, // PDF document object
  pageNum = 1, // Current page number
  visiblePage = 1, // Visible page number based on scroll
  scale = 1.5, // Initial zoom scale
  canvases = [], // Array to store all canvas elements
  renderTasks = [], // Array to store all rendering tasks
  renderingPdf = false, // Flag to indicate if PDF is being rendered
  mode = "", // Current mode (speedread or dyslexia)
  max = 1, // Maximum number of pages in the PDF
  loadingTimeout = null, // Timeout to hide the loading overlay
  overlayActive = false, // Flag to indicate if overlay is active
  isSpeedreadActive = false, // Flag to indicate if speed reading is active
  cancelSpeedread = false, // Flag to cancel the speed reading process
  currentWordIndex = 0; // Track the current word index

// Get doc_id from URL
const urlParams = new URLSearchParams(window.location.search);
let doc_id = urlParams.get("doc_id");

// PDF RELATED FUNCTIONS ===================================
async function loadPDF(url) {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    return pdf;
  } catch (error) {
    console.error("Error loading PDF:", error);
  }
}

async function initializePDF(url) {
  reset();
  showLoadingOverlay();

  document.getElementById("speedread").style.display = "block";
  document.getElementById("dyslexia").style.display = "block";
  let tempDoc = await loadPDF(url);
  pdfDoc = tempDoc;
  if (pdfDoc) {
    document.getElementById("page_count").textContent = pdfDoc.numPages;
    max = pdfDoc.numPages;
    await renderAllPages(pdfDoc, scale);

    const canvasContainer = document.getElementById("canvas-container");
    canvasContainer.addEventListener("scroll", updatePageNumBasedOnScroll);

    if (doc_id !== null) {
      fetchBookmark(); // Only fetch bookmark if doc_id is not null
    } else {
      document.getElementById("pageInput").value = 1; // Reset page input to 1
    }

    // Hide main menu, show main content and footbar if a doc is present
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("mainContent").style.display = "flex";
    document.getElementById("footbar").style.display = "flex";
  } else {
    // Hide loading overlay and keep the main menu visible
    hideLoadingOverlay();
  }
  // Ensure overlay stays for at least 3 seconds
  clearTimeout(loadingTimeout);
  loadingTimeout = setTimeout(() => {
    hideLoadingOverlay();
  }, 50);
}

function reset() {
  (pageNum = 1),
    (visiblePage = 1),
    (scale = 1.5),
    (canvases = []),
    (renderTasks = []),
    (renderingPdf = false),
    (mode = ""),
    (max = 1),
    (loadingTimeout = null),
    (overlayActive = false),
    (isSpeedreadActive = false),
    (cancelSpeedread = false),
    (currentWordIndex = 0);

  document.getElementById("canvas-container").innerHTML = "";
  document.getElementById("pageInput").value = pageNum;
  document.getElementById("page_count").textContent = "-";

  clearInGrayOverlay();
  document.getElementById("speedreadText").innerHTML = "";
  document.getElementById("paragraphContainer").innerHTML = "";

  if (document.getElementById("speak").style.display == "none") {
    document.getElementById("cancel").click();
  }
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
    // handleTextToSpeech();
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

    // Create a container for the canvas and text layer
    const pageContainer = document.createElement("div");
    pageContainer.className = "pdf-page-container";
    pageContainer.id = `page-container-${pageNumber}`;
    pageContainer.style.position = "relative";
    pageContainer.style.width = `${viewport.width}px`;
    pageContainer.style.height = `${viewport.height}px`;

    // Create a new canvas element for this page
    const canvas = document.createElement("canvas");
    canvas.id = `page-${pageNumber}`;
    canvas.className = "pdf-page"; // Optional: add a class for styling
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Create a text layer div for this page
    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "textLayer";
    textLayerDiv.id = `textLayer-${pageNumber}`;
    textLayerDiv.style.position = "absolute";
    textLayerDiv.style.top = "0";
    textLayerDiv.style.left = "0";
    textLayerDiv.style.height = `${viewport.height}px`;
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.zIndex = "1";
    textLayerDiv.style.setProperty("--scale-factor", scale);

    // Append the canvas and text layer to the page container
    pageContainer.appendChild(canvas);
    pageContainer.appendChild(textLayerDiv);

    // Insert the page container at the correct position
    const canvasContainer = document.getElementById("canvas-container");
    const existingPageContainer = document.getElementById(
      `page-container-${pageNumber}`
    );
    if (existingPageContainer) {
      canvasContainer.insertBefore(
        pageContainer,
        existingPageContainer.nextSibling
      );
      existingPageContainer.remove(); // Remove the old pageContainer
    } else {
      canvasContainer.appendChild(pageContainer); // Append new pageContainer if it doesn't exist
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

    // Render the text layer using the new TextLayer API
    const textContent = await page.getTextContent();
    const textLayer = new pdfjsLib.TextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: viewport,
      enhanceTextSelection: true, // Optional: enhances text selection for better UX
    });

    // Apply styles to each span element in the text layer
    await textLayer.render();
    const spans = textLayerDiv.querySelectorAll("span");
    spans.forEach((span) => {
      span.style.position = "absolute";
      span.style.color = "transparent"; // Make the text transparent
      span.style.background = "none"; // Ensure no background by default

      // Position each span correctly based on its transform attribute
      const transform = span.style.transform.match(/translate\(([^)]+)\)/);
      if (transform) {
        const [x, y] = transform[1]
          .split(",")
          .map((coord) => parseFloat(coord));
        span.style.left = `${x}px`;
        span.style.top = `${y}px`;
      }

      // Reset transform to prevent double translation
      span.style.transform = "none";
    });

    console.log(`Page ${pageNumber} rendered`);
  } catch (error) {
    console.error("Error rendering page:", error);
  }
}

// PAGE NUMBER RELATED FUNCTIONS ============================
function updatePageNumBasedOnScroll() {
  const canvasContainer = document.getElementById("canvas-container");
  const scrollPosition = canvasContainer.scrollTop;
  const viewportHeight = canvasContainer.clientHeight;
  const viewportMidpoint = scrollPosition + viewportHeight / 2;

  // Calculate the visible page based on the midpoint of the viewport
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    const pageContainer = canvas.parentElement;
    const pageTop = pageContainer.offsetTop;
    const pageBottom = pageTop + pageContainer.clientHeight; // Use clientHeight instead of height for more accurate measurement

    if (viewportMidpoint >= pageTop && viewportMidpoint < pageBottom) {
      visiblePage = i + 1; // Pages are 1-indexed
      break;
    }
  }

  if (visiblePage !== pageNum) {
    pageNum = visiblePage;
    document.getElementById("pageInput").value = pageNum;
    updateBookmark();
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
    const canvas = canvases[pageNum - 1];
    if (canvas) {
      canvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

async function pressPrev() {
  if (overlayActive) {
    cancelSpeedread = true; // Set the cancel flag
    await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay to ensure the cancellation
    if (mode === "dyslexia") {
      onPrevPage();
      displayDyslexiaText();
    } else if (mode === "speedread") {
      onPrevPage();
      displaySpeedreadText();
    }
  }
}

async function pressNext() {
  if (overlayActive) {
    cancelSpeedread = true; // Set the cancel flag
    await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay to ensure the cancellation
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

function pageInput() {
  let input = document.getElementById("pageInput");
  let parsedInput = parseInt(input.value);

  if (!isNaN(parsedInput) && parsedInput >= 1 && parsedInput <= max) {
    pageNum = parsedInput;
    const canvas = canvases[pageNum - 1];
    canvas.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    input.setAttribute("disabled", true);
    input.value = pageNum;
    input.removeAttribute("disabled");
  }
}

// OVERLAY RELATED FUNCTIONS ================================
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

  if (overlayActive) {
    grayOverlay.style.display = "block";
    // Trigger reflow to restart the animation
    grayOverlay.offsetHeight; // No need to store this value, the reading forces a reflow
    grayOverlay.classList.add("show");
  } else {
    // Add an event listener to hide the overlay after the animation ends
    grayOverlay.addEventListener("animationend", function handleAnimationEnd() {
      grayOverlay.style.display = "none";
      grayOverlay.removeEventListener("animationend", handleAnimationEnd);
    });
    grayOverlay.classList.remove("show");
  }
}

function clickOverlay() {
  let overlay = document.getElementById("grayOverlay");
  if (overlayActive) {
    overlay.click();
  }
}

function exitOverlay(event) {
  if (event.target.id !== "grayOverlay") return;

  // Reset overlay state
  overlayActive = false;
  blurPage(false);
  hideGrayOverlay();
  resetSpeedreadText();
  clearInGrayOverlay();
  mode = "";
  document.getElementById("paragraphContainer").innerHTML = "";
  // Show text menu buttons
  toggleTextMenuButtons(true);

  // Remove microphone menu if present
  removeMicMenu();

  // Remove event listeners from navigation buttons
  removeNavEventListeners();
}

function hideGrayOverlay() {
  const grayOverlay = document.getElementById("grayOverlay");
  grayOverlay.style.display = "none";
}

function resetSpeedreadText() {
  const speedreadTextElement = document.getElementById("speedreadText");
  speedreadTextElement.textContent = "";
  speedreadTextElement.style = "";
}

function toggleTextMenuButtons(visible) {
  const textMenuButtons =
    document.getElementsByClassName("textMenu-buttons")[0];
  textMenuButtons.style.display = visible ? "flex" : "none";
}

function removeMicMenu() {
  const micDiv = document.getElementById("micDiv");
  if (micDiv) micDiv.remove();
}

function removeNavEventListeners() {
  const buttonPrev = document.getElementById("prevPage");
  const buttonNext = document.getElementById("nextPage");

  if (buttonPrev) buttonPrev.removeEventListener("click", pressPrev);
  if (buttonNext) buttonNext.removeEventListener("click", pressNext);
}

function createButton(id, icon, text, onClick = null) {
  const button = document.createElement("button");
  if (id) button.id = id;
  button.innerHTML = `<i class="material-icons">${icon}</i> ${text}`;
  if (onClick) button.onclick = onClick;
  return button;
}

// TEXT RELATED FUNCTIONS ==================================
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
      doc_id = null; // Set doc_id to null to indicate a new file is chosen
      if (!renderingPdf) {
        initializePDF(pdfDoc);
      }
    }
  });
  inputElement.click();
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
  fontSizeInput.value = 72;
  fontSizeInput.min = 10;
  fontSizeInput.max = 144;

  fontChooser.addEventListener("change", chooseFont);
  fontSizeInput.addEventListener("change", chooseFont);

  return { fontLabel, fontChooser, fontSizeLabel, fontSizeInput };
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

// SPEEDREAD AND DYSLEXIA FUNCTIONS ========================
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
  wpmLabel.textContent = "Speed (words/minute):";

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

async function displaySpeedreadText(startIndex = 0) {
  if (isSpeedreadActive) return; // Exit if already running
  isSpeedreadActive = true; // Set the flag
  cancelSpeedread = false; // Reset the cancel flag

  try {
    let speedreadWordElement = document.getElementById("speedreadText");
    let paragraphContainer = document.getElementById("paragraphContainer");
    let speedreadTextElement = document.getElementById("speedreadText");

    let paragraph = await extractParagraphs(pageNum);
    let formattedParagraph = await formatDisplayText(paragraph);
    let lines = formattedParagraph.split("\n"); // Split by new lines

    paragraphContainer.textContent = ""; // Clear previous content

    // Apply font settings
    let selectedFont = document.getElementById("fontChooser").value;
    let selectedFontSize = document.getElementById("fontSize").value;
    speedreadTextElement.style.fontFamily = selectedFont;
    speedreadTextElement.style.fontSize = selectedFontSize + "px";

    // Create a fragment to hold the lines and words
    let fragment = document.createDocumentFragment();
    let wordIndex = 0; // Initialize word index
    lines.forEach((line) => {
      let lineElement = document.createElement("div");
      let splitLine = line.split(" ").filter(function (el) {
        return el != "";
      });

      splitLine.forEach((word) => {
        let span = document.createElement("span");
        span.textContent = word + " ";
        span.dataset.index = wordIndex++;
        span.addEventListener("click", () => jumpToWord(span.dataset.index));
        span.classList.add("clickable-word");
        lineElement.appendChild(span);
      });

      fragment.appendChild(lineElement);
    });
    paragraphContainer.appendChild(fragment);

    let wpmInput = document.getElementById("wpm");
    let wpm = wpmInput ? parseInt(wpmInput.value, 10) : 300; // Default to 300 if wpmInput is not found
    //console.log(`Current WPM: ${wpm}`); // Debugging WPM value

    let delay = 60000 / wpm;
    //console.log(`Delay between words: ${delay} ms`); // Debugging delay value

    let words = paragraphContainer.querySelectorAll("span");
    for (let i = startIndex; i < words.length; i++) {
      if (!overlayActive || cancelSpeedread) break; // Check cancel flag
      currentWordIndex = i; // Update the current word index
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

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  } catch (error) {
    console.error("Error displaying text:", error);
  } finally {
    isSpeedreadActive = false; // Reset the flag
  }
}

function jumpToWord(index) {
  cancelSpeedread = true;
  setTimeout(() => {
    currentWordIndex = parseInt(index);
    displaySpeedreadText(currentWordIndex);
  }, 200); // Small delay to ensure the cancellation
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".clickable-word").forEach((span) => {
    span.addEventListener("click", () => jumpToWord(span.dataset.index));
  });
});

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

  // Function to create labeled input pairs
  function createLabeledInput(labelText, inputElement) {
    const container = document.createElement("div");
    container.classList.add("labeled-input");

    const label = document.createElement("label");
    label.textContent = labelText;
    container.appendChild(label);
    container.appendChild(inputElement);

    return container;
  }

  // Create font controls
  const { fontLabel, fontChooser, fontSizeLabel, fontSizeInput } =
    createFontSizeElements();
  const fontChooserContainer = createLabeledInput("Font:", fontChooser);
  const fontSizeContainer = createLabeledInput("Font Size:", fontSizeInput);

  textMenu.appendChild(fontChooserContainer);
  textMenu.appendChild(fontSizeContainer);

  // Create spacing controls
  const spacingInput = document.createElement("input");
  spacingInput.type = "number";
  spacingInput.id = "spacing";
  spacingInput.value = 1;
  spacingInput.min = 0;
  spacingInput.max = 10;
  const spacingContainer = createLabeledInput("Spacing:", spacingInput);

  textMenu.appendChild(spacingContainer);
  spacingInput.addEventListener("change", updateSpacing);

  // Create alignment controls container
  const alignmentContainer = document.createElement("div");
  alignmentContainer.classList.add("alignment-container");
  textMenu.appendChild(alignmentContainer);

  // Create alignment controls
  const alignmentChooser = document.createElement("select");
  alignmentChooser.id = "alignmentChooser";
  const alignments = ["left", "center", "right", "justify"];
  alignments.forEach((alignment) => {
    const option = document.createElement("option");
    option.value = alignment;
    option.textContent = alignment.charAt(0).toUpperCase() + alignment.slice(1);
    alignmentChooser.appendChild(option);
  });
  const alignmentChooserContainer = createLabeledInput(
    "Text Alignment:",
    alignmentChooser
  );
  alignmentContainer.appendChild(alignmentChooserContainer);
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

  // Create color picker controls
  const colorPicker = document.createElement("input");
  colorPicker.type = "color";
  colorPicker.id = "colorPicker";
  const colorPickerContainer = createLabeledInput("Font Color:", colorPicker);

  textMenu.appendChild(colorPickerContainer);
  colorPicker.addEventListener("change", function () {
    const speedreadText = document.getElementById("speedreadText");
    speedreadText.style.color = colorPicker.value;
  });

  const buttonPrev = document.getElementById("prevPage");
  buttonPrev.addEventListener("click", pressPrev);

  const buttonNext = document.getElementById("nextPage");
  buttonNext.addEventListener("click", pressNext);

  // Initial text display
  displayDyslexiaText();
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

function clearInGrayOverlay() {
  const textMenu = document.getElementById("textMenu");
  while (textMenu.firstChild) {
    textMenu.removeChild(textMenu.firstChild);
  }
  // const speedreadContainer = document.getElementById("speedreadContainer");
  // while (speedreadContainer.firstChild) {
  //   speedreadContainer.removeChild(speedreadContainer.firstChild);
  // }
}

// TEXT TO SPEECH FUNCTIONS ================================
async function handleTextToSpeech() {
  try {
    const numPages = pdfDoc.numPages;
    let allText = [];

    console.log(pageNum);
    for (let pageNumber = pageNum; pageNumber <= numPages; pageNumber++) {
      const pageText = await extractParagraphs(pageNumber);
      console.log("extracted from page" + pageNumber + ":" + pageText);
      allText.push(pageText);
    }
    let formattedTextArray = [];

    for (let text of allText) {
      let formattedText = await formatText(text);
      formattedTextArray.push(formattedText);
    }

    for (let formattedText of formattedTextArray) {
      await tts(formattedText);
    }
    document.getElementById("start").click();
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
    console.log(newUtt); // do not remove.
    speechSynthesis.speak(newUtt);
  };

  const btnStart = document.getElementById("start");
  const btnPause = document.getElementById("pause");
  const btnResume = document.getElementById("resume");
  const btnCancel = document.getElementById("cancel");
  const btnSpeak = document.getElementById("speak");

  function handleStartClick() {
    btnStart.style.display = "none";
    btnPause.style.display = "inline-block";
    speechUtteranceChunker.cancel = false;
    speechUtteranceChunker(utterance, { chunkLength: 120 }, () => {
      // console.log("done");
    });
  }

  function handlePauseClick() {
    window.speechSynthesis.pause();
    btnPause.style.display = "none";
    btnResume.style.display = "inline-block";
  }

  function handleResumeClick() {
    window.speechSynthesis.resume();
    btnResume.style.display = "none";
    btnPause.style.display = "inline-block";
  }

  function handleCancelClick() {
    btnStart.style.display = "none";
    btnPause.style.display = "none";
    btnResume.style.display = "none";
    btnCancel.style.display = "none";
    btnSpeak.style.display = "inline-block";
    speechUtteranceChunker.cancel = true;
    window.speechSynthesis.cancel();
    btnStart.removeEventListener("click", handleStartClick);
    btnPause.removeEventListener("click", handlePauseClick);
    btnResume.removeEventListener("click", handleResumeClick);
    btnCancel.removeEventListener("click", handleCancelClick);
  }

  btnStart.addEventListener("click", handleStartClick);
  btnPause.addEventListener("click", handlePauseClick);
  btnResume.addEventListener("click", handleResumeClick);
  btnCancel.addEventListener("click", handleCancelClick);
}

// BOOKMARK FUNCTIONS =======================================
async function fetchBookmark() {
  if (doc_id !== null) {
    try {
      const response = await fetch(`php/get_bookmark.php?doc_id=${doc_id}`);
      const result = await response.json();
      if (result.status === "success") {
        pageNum = result.last_page;
        // document.getElementById("page_num").textContent = pageNum;
        document.getElementById("pageInput").value = pageNum;
        const canvas = canvases[pageNum - 1];
        if (canvas) {
          canvas.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        console.error("Failed to fetch bookmark:", result.message);
      }
    } catch (error) {
      console.error("Error fetching bookmark:", error);
    }
  }
}

async function updateBookmark() {
  if (doc_id !== null) {
    try {
      const response = await fetch("php/update_bookmark.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `doc_id=${doc_id}&last_page=${pageNum}`,
      });
      const result = await response.json();
      if (result.status !== "success") {
        console.error("Failed to update bookmark:", result.message);
      }
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", fetchBookmark);

function showLoadingOverlay() {
  document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoadingOverlay() {
  document.getElementById("loadingOverlay").style.display = "none";
}

export { initializePDF, onNextPage, onPrevPage };

// VOICE RECOGNITION ========================================
async function microphone() {
  microphoneMenu();
  toggleOverlay();
  if (overlayActive) {
    mode = "microphone";
    getCommandfromResponse();
  }
}

function microphoneMenu() {
  const textMenu = document.getElementById("textMenu");
  const speedreadContainer = document.getElementById("speedreadContainer");

  // Hide text menu buttons
  const textMenuButtons =
    document.getElementsByClassName("textMenu-buttons")[0];
  textMenuButtons.style.display = "none";

  // Create and configure main elements
  const main = document.createElement("main");
  const commandButton = createButton(
    "commandButton",
    "mic",
    "Microphone",
    getCommandfromResponse
  );
  const helpButton = createButton("helpbtn", "help", "Help");

  const liveWordsSpan = document.createElement("span");
  liveWordsSpan.id = "liveWords";

  const commandStatusSpan = document.createElement("span");
  commandStatusSpan.id = "commandStatus";

  // Append elements
  textMenu.appendChild(helpButton);

  const micDiv = document.createElement("div");
  micDiv.id = "micDiv";
  micDiv.appendChild(commandButton);
  micDiv.appendChild(main);
  micDiv.appendChild(liveWordsSpan);
  micDiv.appendChild(document.createElement("br"));
  micDiv.appendChild(commandStatusSpan);

  speedreadContainer.appendChild(micDiv);
}

async function getCommandfromResponse() {
  const userCommand = await RecognizeandVisualize();
  let commandStatus = document.getElementById("commandStatus");
  let navigateCheck = userCommand.split(" ");
  if (
    navigateCheck[0] == "navigate" ||
    navigateCheck[0] == "jump" ||
    navigateCheck[0] == "John"
  ) {
    if (navigateCheck[1] == "to" || navigateCheck[1] == "two") {
      navigateCheck[1] = "2";
    }
    let pageNum = parseInt(navigateCheck[1]);
    if (!isNaN(pageNum) && pageNum <= max && pageNum >= 1) {
      document.getElementById("pageInput").value = pageNum;
      pageInput();
      return;
    }
  }
  commandStatus.textContent = "Command found: " + userCommand;
  switch (userCommand) {
    case "text to speech":
    case "speak":
    case "speak speak":
      clickOverlay();
      document.getElementById("speak").click();
      break;
    case "pause":
      clickOverlay();
      document.getElementById("pause").click();
      break;
    case "start":
      clickOverlay();
      if(document.getElementById("speak").style.display == "none"){
        document.getElementById("start").click();
      }
      else{
        document.getElementById("speak").click();
      }
      break;
    case "cancel":
    case "stop":
    case "exit":
      clickOverlay();
      document.getElementById("cancel").click();
      break;
    case "resume":
      clickOverlay();
      document.getElementById("resume").click();
      break;
    case "speedread":
      clickOverlay();
      speedread();
      break;
    case "dyslexia":
      clickOverlay();
      dyslexia();
      break;
    case "change":
      clickOverlay();
      chooseFile();
      break;
    case "dark mode":
    case "night mode":
    case "light mode":
      clickOverlay();
      document.getElementById("theme-toggle-item").click(); // Trigger the theme toggle
      break;
    default:
      commandStatus.textContent =
        "Command not recognized. Please click the button again.";
      getCommandfromResponse();
  }
}

// EVENT LISTENERS =========================================
function addEventListeners() {
  // Utility function to add click event listeners
  function addClickListener(id, handler) {
    document.getElementById(id).addEventListener("click", handler);
  }

  // Add click event listeners
  addClickListener("speedread", speedread);
  addClickListener("grayOverlay", exitOverlay);
  addClickListener("choosefile", chooseFile);
  addClickListener("file", chooseFile);
  addClickListener("dyslexia", dyslexia);
  addClickListener("prev", onPrevPage);
  addClickListener("next", onNextPage);
  addClickListener("mic", microphone);

  // Page input field event listeners
  const pageInputElement = document.getElementById("pageInput");

  pageInputElement.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      pageInput();
    }
  });

  pageInputElement.addEventListener("focusout", () => {
    const pageInputValue = pageInputElement.value;
    if (!isNaN(pageInputValue)) {
      pageInput();
    } else {
      pageInputElement.value = pageNum;
    }
  });

  pageInputElement.addEventListener("input", (event) => {
    const input = event.target.value.trim();
    event.target.value = input.replace(/\D/g, "");
  });

  pageInputElement.addEventListener("focus", (event) => {
    event.target.setSelectionRange(0, event.target.value.length);
  });

  // Speak button event listener
  document.getElementById("speak").addEventListener("click", () => {
    handleTextToSpeech();
    document.getElementById("start").style.display = "inline-block";
    document.getElementById("cancel").style.display = "inline-block";
    document.getElementById("speak").style.display = "none";
  });

  // Global keydown event listener
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase(); // Convert key to lowercase

    switch (key) {
      case "a":
        console.log("You pressed a");
        break;
      case "f":
        window.location.href = "mydocs.php"; // Navigate to My Documents page
        break;
      case "m":
        window.location.href = "welcome.php"; // Navigate to homepage
        break;
      case "r":
        clickOverlay();
        document.getElementById("speedread").click();
        break;
      case "d":
        clickOverlay();
        document.getElementById("dyslexia").click();
        break;
      case "t":
        const themeToggle = document.getElementById("theme-toggle-item");
        if (themeToggle) {
          themeToggle.click();
        }
        break;
      case ",":
        onPrevPage();
        break;
      case ".":
        onNextPage();
        break;
      case "1":
        document.getElementById("speak").click();
        break;
      case "2":
        document.getElementById("start").click();
        break;
      case "3":
        document.getElementById("pause").click();
        break;
      case "4":
        document.getElementById("resume").click();
        break;
      case "5":
        document.getElementById("cancel").click();
        break;
      case "s":
        clickOverlay();
        document.getElementById("mic").click();
        break;
      default:
        break;
    }
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

// MAIN FUNCTION ===========================================
async function main() {
  // const url = "";
  // const url = "asdfasdf.pdf";

  addEventListeners();
  // initializePDF(url);
}

main();
