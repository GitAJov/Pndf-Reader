var { pdfjsLib } = globalThis;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";

let pdfDoc = null,
  pageNum = 1,
  pageRendering = false,
  pageNumPending = null,
  scale = 0.8,
  canvas = document.getElementById("the-canvas"),
  ctx = canvas.getContext("2d"),
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

// PDF Rendering
async function renderPage(
  pdf = pdfDoc,
  pageNumber = pageNum,
  canvasId = "the-canvas",
  scale = 0.8
) {
  try {
    const page = await pdf.getPage(pageNumber);
    console.log("Page loaded");

    const viewport = page.getViewport({ scale: scale });

    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;
    console.log("Page rendered");

    document.getElementById("page_num").textContent = pageNumber;

    pageRendering = false;
    if (pageNumPending !== null) {
      const nextPage = pageNumPending;
      pageNumPending = null;
      renderPage(pdf, nextPage, canvasId, scale);
    }
  } catch (error) {
    console.error("Error rendering page:", error);
    pageRendering = false;
  }
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    pageRendering = true;
    renderPage(pdfDoc, num, "the-canvas", scale);
  }
}

// Navigation
function onPrevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}

function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}

// Overlay and Text Extraction
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

async function extractParagraphs(pdfUrl, pageNumber) {
  try {
    const pdfDocument = await pdfjsLib.getDocument(pdfUrl).promise;
    console.log("PDF loaded for text extraction");
    const page = await pdfDocument.getPage(pageNumber);
    console.log("Page loaded for text extraction");

    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(" ");
    console.log(text);
    return text;
  } catch (error) {
    console.error("Error extracting text:", error);
  }
}

async function displayText() {
  try {
    let speedreadTextElement = document.getElementById("speedreadText");
    let paragraph = await extractParagraphs("innotech.pdf", pageNum);
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

// Speed Read and Dyslexia Features
async function speedread() {
  speedTextMenu();
  toggleOverlay();
  if (overlayActive) {
    displayText();
  }
}

function dyslexia() {
  toggleOverlay();
  if (overlayActive) {
    let speedreadTextElement = document.getElementById("speedreadText");
    speedreadTextElement.textContent = "Hello";
    speedreadTextElement.style.fontFamily = "OpenDyslexic";
    speedreadTextElement.style.fontSize = "24px";
  }
}

function exitOverlay(event) {
  if (event.target.id === "grayOverlay") {
    overlayActive = false;
    blurPage(false);
    let grayOverlay = document.getElementById("grayOverlay");
    grayOverlay.style.display = "none";
    clearTextMenu();
  }
}

// Font and File Selection
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
      const url = URL.createObjectURL(file);

      pdfDoc = await loadPDF(url);
      if (pdfDoc) {
        document.getElementById("page_count").textContent = pdfDoc.numPages;
        pageNum = 1;
        queueRenderPage(pageNum);
      }
    }
  });

  inputElement.click();
}

// Text Menu for Speed Reading
function speedTextMenu() {
  let textMenu = document.getElementById("textMenu");

  const fontLabel = document.createElement("label");
  fontLabel.setAttribute("for", "fontChooser");
  fontLabel.textContent = "Font:";

  const fontChooser = document.createElement("select");
  fontChooser.id = "fontChooser";

  const fonts = ["Arial", "Times New Roman", "Verdana"];
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

  fontChooser.addEventListener("change", chooseFont);
  fontSizeInput.addEventListener("change", chooseFont);
}

function clearTextMenu() {
  const textMenu = document.getElementById("textMenu");
  while (textMenu.firstChild) {
    textMenu.removeChild(textMenu.firstChild);
  }
}

// Main Function
async function main() {
  const url = "innotech.pdf";
  document.getElementById("prev").addEventListener("click", onPrevPage);
  document.getElementById("next").addEventListener("click", onNextPage);
  document.getElementById("speedread").addEventListener("click", speedread);
  document.getElementById("grayOverlay").addEventListener("click", exitOverlay);
  document.getElementById("file").addEventListener("click", chooseFile);
  document.getElementById("dyslexia").addEventListener("click", dyslexia);

  pdfDoc = await loadPDF(url);
  if (pdfDoc) {
    document.getElementById("page_count").textContent = pdfDoc.numPages;
    queueRenderPage(pageNum);
  }
}

main();
