import { formatText } from "../js/gemini.js";
import { formatDisplayText } from "../js/gemini.js";
import { voiceRecognition } from "./voiceRecognition.js";

var { pdfjsLib } = globalThis;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";

let pdfDoc = null,
  pageNum = 1,
  visiblePage = 1,
  scale = 1.5,
  canvases = [],
  renderTasks = [],
  renderingPdf = false,
  mode = "",
  max = 1,
  loadingTimeout = null,
  overlayActive = false;

// Get doc_id from URL
const urlParams = new URLSearchParams(window.location.search);
let doc_id = urlParams.get("doc_id");

// PDF RELATED FUNCTIONS ===================================
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
  showLoadingOverlay(); // Show loading overlay
  let tempDoc = await loadPDF(url);
  pdfDoc = tempDoc;
  if (pdfDoc) {
    document.getElementById("page_count").textContent = pdfDoc.numPages;
    max = pdfDoc.numPages;
    await renderAllPages(pdfDoc, scale); // Render all pages at once

    // Add scroll event listener to update pageNum based on visible page
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
  }, 3000);
}

function reset() {
  pageNum = 1;
  scale = 1.5;
  canvases = [];
  renderTasks = [];
  document.getElementById("canvas-container").innerHTML = "";
  document.getElementById("pageInput").value = pageNum;
  document.getElementById("page_count").textContent = "-";

  clearTextMenu();
  document.getElementById("speedreadText").innerHTML = "";
  document.getElementById("paragraphContainer").innerHTML = "";

  resetTTS();
  console.log("Reset done");
}

function resetTTS() {
  document.getElementById("cancel").click();
  let btnStart = document.getElementById("start");
  let btnPause = document.getElementById("pause");
  let btnResume = document.getElementById("resume");
  let btnCancel = document.getElementById("cancel");
  let newBtnStart = btnStart.cloneNode(true);
  let newBtnPause = btnPause.cloneNode(true);
  let newBtnResume = btnResume.cloneNode(true);
  let newBtnCancel = btnCancel.cloneNode(true);
  btnStart.parentNode.replaceChild(newBtnStart, btnStart);
  btnPause.parentNode.replaceChild(newBtnPause, btnPause);
  btnResume.parentNode.replaceChild(newBtnResume, btnResume);
  btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
}

// <div class="texttospeech-nav">
//           <button id="start"><i class="material-icons">play_arrow</i></button>
//           <button id="pause"><i class="material-icons">pause</i></button>
//           <button id="resume"><i class="material-icons">play_arrow</i></button>
//           <button id="cancel"><i class="material-icons">stop</i></button>
//         </div>

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
    const existingPageContainer = document.getElementById(`page-container-${pageNumber}`);
    if (existingPageContainer) {
      canvasContainer.insertBefore(pageContainer, existingPageContainer.nextSibling);
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
      enhanceTextSelection: true // Optional: enhances text selection for better UX
    });
    
    // Apply styles to each span element in the text layer
    await textLayer.render();
    const spans = textLayerDiv.querySelectorAll("span");
    spans.forEach(span => {
      span.style.position = "absolute";
      span.style.color = "transparent"; // Make the text transparent
      span.style.background = "none"; // Ensure no background by default

      // Position each span correctly based on its transform attribute
      const transform = span.style.transform.match(/translate\(([^)]+)\)/);
      if (transform) {
        const [x, y] = transform[1].split(',').map(coord => parseFloat(coord));
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
  grayOverlay.style.display = overlayActive ? "block" : "none";
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
  fontSizeInput.value = 36;
  fontSizeInput.min = 10;
  fontSizeInput.max = 72;

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

let isSpeedreadActive = false; // Flag to indicate if speed reading is active
let cancelSpeedread = false; // Flag to cancel the speed reading process
let currentWordIndex = 0; // Track the current word index

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
      let currentWordElements = paragraphContainer.querySelectorAll(".current-word");
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

// TEXT TO SPEECH FUNCTIONS ================================
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
      // console.log("done");
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
  if (doc_id !== null){
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
async function getCommandfromResponse() {
  const intent = await voiceRecognition();
  switch (intent) {
    case "start":
      document.getElementById("start").click();
      break;
    case "stop":
      document.getElementById("cancel").click();
      break;
    case "pause":
      document.getElementById("pause").click();
      break;
    case "resume":
      document.getElementById("resume").click();
      break;
    case "speedread":
      speedread();
      break;
    case "dyslexia":
      dyslexia();
      break;
    case "change":
      chooseFile();
      break;
    case "dark mode":
    case "night mode":
    case "light mode":
      document.getElementById("theme-toggle-item").click(); // Trigger the theme toggle
      break;
    default:
      console.log("No matching intent found");
  }
}

// EVENT LISTENERS =========================================
function addEventListeners() {
  document.getElementById("speedread").addEventListener("click", speedread);
  document.getElementById("grayOverlay").addEventListener("click", exitOverlay);
  document.getElementById("choosefile").addEventListener("click", chooseFile);
  document.getElementById("file").addEventListener("click", chooseFile);
  document.getElementById("dyslexia").addEventListener("click", dyslexia);
  document.getElementById("prev").addEventListener("click", onPrevPage);
  document.getElementById("next").addEventListener("click", onNextPage);
  // Event listener for the page input field
  let pageInputElement = document.getElementById("pageInput");
  pageInputElement.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      pageInput();
    }
  });
  pageInputElement.addEventListener("focusout", function (event) {
    let pageInputValue = pageInputElement.value;
    if (!isNaN(pageInputValue)) {
      pageInput();
    } else {
      pageInputValue = pageNum;
    }
  });
  pageInputElement.addEventListener("input", function (event) {
    let input = event.target.value.trim();
    event.target.value = input.replace(/\D/g, "");
  });
  pageInputElement.addEventListener("focus", function (event) {
    event.target.setSelectionRange(0, event.target.value.length);
  });
  document
    .getElementById("mic")
    .addEventListener("click", getCommandfromResponse);
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
