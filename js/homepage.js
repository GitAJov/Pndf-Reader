import { formatText } from "../js/gemini.js";

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
  let visiblePage = 1;

  // Calculate the visible page based on scroll position
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    const pageHeight = canvas.height;
    if (
      scrollPosition >= canvas.offsetTop &&
      scrollPosition < canvas.offsetTop + pageHeight
    ) {
      visiblePage = i + 1; // Pages are 1-indexed
      break;
    }
  }

  if (visiblePage !== pageNum) {
    pageNum = visiblePage;
    console.log(`Visible page: ${pageNum}`);
    document.getElementById("page_num").textContent = pageNum;
    handleTextToSpeech(pageNum);
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
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}

function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
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
    const text = textContent.items.map((item) => item.str).join(" ");
    console.log(text);
    return text;
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
      }
    }
  });
  inputElement.click();
  console.log("whatsup");
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

async function speedread() {
  speedTextMenu();
  toggleOverlay();
  if (overlayActive) {
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
}

async function displaySpeedreadText() {
  try {
    let speedreadTextElement = document.getElementById("speedreadText");
    let paragraph = await extractParagraphs(pageNum);
    let splitParagraph = paragraph.split(" ").filter(function (el) {
      return el != "";
    });
    for (let i = 0; i < splitParagraph.length; i++) {
      if (!overlayActive) break;
      let word = splitParagraph[i];
      speedreadTextElement.textContent = word;
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
    displayDyslexiaText();
  }
}

function dyslexiaMenu() {
  let textMenu = document.getElementById("textMenu");

  const { fontLabel, fontChooser, fontSizeLabel, fontSizeInput } =
    createFontSizeElements();

  textMenu.appendChild(fontLabel);
  textMenu.appendChild(fontChooser);
  textMenu.appendChild(fontSizeLabel);
  textMenu.appendChild(fontSizeInput);

  const spacingLabel = document.createElement("label");
  spacingLabel.setAttribute("for", "spacing");
  spacingLabel.textContent = "Spacing:";

  const spacingInput = document.createElement("input");
  spacingInput.type = "number";
  spacingInput.id = "spacing";
  spacingInput.value = 1;
  spacingInput.min = 0;
  spacingInput.max = 10;

  textMenu.appendChild(spacingLabel);
  textMenu.appendChild(spacingInput);

  spacingInput.addEventListener("change", updateSpacing);

  const alignmentLabel = document.createElement("label");
  alignmentLabel.setAttribute("for", "alignmentChooser");
  alignmentLabel.textContent = "Text Alignment:";

  const alignmentChooser = document.createElement("select");
  alignmentChooser.id = "alignmentChooser";

  const alignments = ["left", "center", "right", "justify"];
  alignments.forEach((alignment) => {
    const option = document.createElement("option");
    option.value = alignment;
    option.textContent = alignment.charAt(0).toUpperCase() + alignment.slice(1);
    alignmentChooser.appendChild(option);
  });

  textMenu.appendChild(alignmentLabel);
  textMenu.appendChild(alignmentChooser);

  alignmentChooser.addEventListener("change", updateAlignment);

  // Adding Bold and Italic controls
  const boldLabel = document.createElement("label");
  boldLabel.textContent = "Bold:";
  boldLabel.style.marginLeft = "10px";

  const boldCheckbox = document.createElement("input");
  boldCheckbox.type = "checkbox";
  boldCheckbox.id = "boldCheckbox";

  textMenu.appendChild(boldLabel);
  textMenu.appendChild(boldCheckbox);

  boldCheckbox.addEventListener("change", function () {
    const speedreadText = document.getElementById("speedreadText");
    speedreadText.style.fontWeight = boldCheckbox.checked ? "bold" : "normal";
  });

  const italicLabel = document.createElement("label");
  italicLabel.speedreadText = "Italic:";
  italicLabel.style.marginLeft = "10px";

  const italicCheckbox = document.createElement("input");
  italicCheckbox.type = "checkbox";
  italicCheckbox.id = "italicCheckbox";

  textMenu.appendChild(italicLabel);
  textMenu.appendChild(italicCheckbox);

  italicCheckbox.addEventListener("change", function () {
    const speedreadText = document.getElementById("speedreadText");
    speedreadText.style.fontStyle = italicCheckbox.checked
      ? "italic"
      : "normal";
  });
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
    let speedreadTextElement = document.getElementById("speedreadText");
    let paragraph = await extractParagraphs(pageNum);
    speedreadTextElement.textContent = paragraph;
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
  //document.getElementById("prev").addEventListener("click", onPrevPage);
  //document.getElementById("next").addEventListener("click", onNextPage);
  document.getElementById("speedread").addEventListener("click", speedread);
  document.getElementById("grayOverlay").addEventListener("click", exitOverlay);
  document.getElementById("choosefile").addEventListener("click", chooseFile);
  // document.getElementById("file").addEventListener("click", chooseFile);
  document.getElementById("dyslexia").addEventListener("click", dyslexia);
}
//Attempt at dark mode
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;
  const topMenu = document.getElementById("topMenu");
  const navigate = document.getElementById("navigate");
  const dropdowns = document.querySelectorAll(".dropdown, .profile-dropdown");
  const pndfLogo = document.getElementById("pndf-logo");
  const dropIcon = document.querySelector(".drop-icon");
  const profileIcon = document.querySelector(".profile-icon");

  // Check local storage for saved theme preference
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    topMenu.classList.add("dark-mode");
    navigate.classList.add("dark-mode");
    dropdowns.forEach((dropdown) => {
      dropdown.querySelector(".dropbtn").classList.add("dark-mode");
      dropdown.querySelector(".dropdown-content").classList.add("dark-mode");
    });
    pndfLogo.src = "Resources/pndf-logo-dark-mode.png";
    dropIcon.src = "Resources/drop-icon-dark-mode.png";
    profileIcon.src = "Resources/profile-icon-dark-mode.png";
  }

  themeToggle.addEventListener("change", () => {
    body.classList.toggle("dark-mode");
    topMenu.classList.toggle("dark-mode");
    navigate.classList.toggle("dark-mode");
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
    // Save the user's preference in local storage
    localStorage.setItem(
      "theme",
      body.classList.contains("dark-mode") ? "dark" : "light"
    );
  });
});

async function handleTextToSpeech(pageNum) {
  try {
    let text = await extractParagraphs(pageNum);
    let formattedText = await formatText(text);
    tts(formattedText);
  } catch (error) {
    console.error("Error extracting paragraphs:", error);
  }
}

function tts(text) {
  window.utterances = [];
  let pausedByUser = false;

  var voicesList = [];

  var utterance = new SpeechSynthesisUtterance(text);

  utterance.addEventListener("error", function (event) {
    console.log(
      "An error has occurred with the speech synthesis: " + event.error
    );
  });

  var timer = setInterval(function () {
    voicesList = window.speechSynthesis.getVoices();
    if (voicesList.length !== 0) {
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.volume = 0.7;
      utterance.pitch = 1;
      utterance.voice = voicesList.find((voice) => voice.lang === "en-US");

      let voiceSelect = document.getElementById("voices");
      voicesList.forEach(
        (voice, i) => (voiceSelect.options[i] = new Option(voice.name, i))
      );

      clearInterval(timer);
    }
  }, 1000);

  var speechUtteranceChunker = function (utt, settings, callback) {
    settings = settings || {};
    var newUtt;
    var txt =
      settings && settings.offset !== undefined
        ? utt.text.substring(settings.offset)
        : utt.text;
    if (utt.voice && utt.voice.voiceURI === "native") {
      // Not part of the spec
      newUtt = utt;
      newUtt.text = txt;
      newUtt.voice = voicesList.find((voice) => voice.lang === "en-US");
      newUtt.lang = "en-US";
      newUtt.rate = 0.9;
      newUtt.volume = 0.7;
      newUtt.pitch = 1;
      newUtt.addEventListener("end", function () {
        if (speechUtteranceChunker.cancel) {
          speechUtteranceChunker.cancel = false;
        }
        if (callback !== undefined) {
          callback();
        }
      });

      newUtt.addEventListener("error", function (event) {
        console.log(
          "An error has occurred with the speech synthesis: " + event.error
        );
      });

      utterances.push(newUtt);
    } else {
      var chunkLength = (settings && settings.chunkLength) || 160;
      var pattRegex = new RegExp(
        "^[\\s\\S]{" +
        Math.floor(chunkLength / 2) +
        "," +
        chunkLength +
        "}[.!?,]{1}|^[\\s\\S]{1," +
        chunkLength +
        "}$|^[\\s\\S]{1," +
        chunkLength +
        "} "
      );
      var chunkArr = txt.match(pattRegex);

      if (chunkArr[0] === undefined || chunkArr[0].length <= 2) {
        //call once all text has been spoken...
        if (callback !== undefined) {
          callback();
        }
        return;
      }
      var chunk = chunkArr[0];
      newUtt = new SpeechSynthesisUtterance(chunk);
      newUtt.voice = voicesList.find((voice) => voice.lang === "en-US");
      newUtt.lang = "en-US";
      newUtt.rate = 0.9;
      newUtt.volume = 0.7;
      newUtt.pitch = 1;

      var x;
      for (x in utt) {
        if (utt.hasOwnProperty(x) && x !== "text") {
          newUtt[x] = utt[x];
        }
      }
      newUtt.addEventListener("end", function () {
        if (speechUtteranceChunker.cancel) {
          speechUtteranceChunker.cancel = false;
          return;
        }
        settings.offset = settings.offset || 0;
        settings.offset += chunk.length - 1;
        speechUtteranceChunker(utt, settings, callback);
      });

      newUtt.addEventListener("error", function (event) {
        console.log(
          "An error has occurred with the speech synthesis: " + event.error
        );
      });

      utterances.push(newUtt);
    }

    if (settings.modifier) {
      settings.modifier(newUtt);
    }

    //console.log(newUtt); //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
    //placing the speak invocation inside a callback fixes ordering and onend issues.

    var k = setInterval(function () {
      speechSynthesis.speak(newUtt);
      clearInterval(k);
    }, 10);
  };

  document.getElementById("start").addEventListener("click", () => {
    speechUtteranceChunker.cancel = false;
    speechUtteranceChunker(utterance, { chunkLength: 120 }, () => {
      console.log("done");
    });
  });

  document.getElementById("stop").addEventListener("click", () => {
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

window.addEventListener('scroll', function () {
  const topMenuHeight = document.getElementById('topMenu').offsetHeight;
  const navigate = document.getElementById('navigate');
  if (window.scrollY > topMenuHeight) {
    navigate.classList.add('fixed');
  } else {
    navigate.classList.remove('fixed');
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
