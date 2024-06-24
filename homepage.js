//create shortcut to access PDF.js exports.
var { pdfjsLib } = globalThis;

// specify workerSrc property (worker of pdf.js), worker is used to render the pdf pages.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";

let pdfDoc = null, // PDF document
  pageNum = 1, // Current page number
  pageRendering = false, // Flag for rendering the page
  pageNumPending = null, // Page number that is pending to be rendered
  scale = 0.8, // Scale of the PDF
  canvas = document.getElementById("the-canvas"), // Canvas element
  ctx = canvas.getContext("2d");  

// Function to load the PDF document
async function loadPDF(url) {
  try {
    const loadingTask = pdfjsLib.getDocument(url); // Load the PDF document
    const pdf = await loadingTask.promise; 
    console.log("PDF loaded");
    return pdf;
  } catch (error) {
    console.error("Error loading PDF:", error);
  }
}

// render a page of the PDF onto a canvas
async function renderPage(
  pdf = pdfDoc,
  pageNumber = pageNum,
  canvasId = "the-canvas",
  scale = 0.8
) {
  try {
    const page = await pdf.getPage(pageNumber);
    console.log("Page loaded"); 

    const viewport = page.getViewport({ scale: scale });  // Get the viewport of the page

    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = { // Render the page on the canvas
      canvasContext: context,
      viewport: viewport,
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;
    console.log("Page rendered");

    // Update page counters
    document.getElementById("page_num").textContent = pageNumber;
 
    // Update the page number input field
    pageRendering = false; // Set the flag to false
    if (pageNumPending !== null) { // Check if there is a pending page to render
      const nextPage = pageNumPending;
      pageNumPending = null;
      renderPage(pdf, nextPage, canvasId, scale);
    }
  } catch (error) {
    console.error("Error rendering page:", error);
    pageRendering = false;
  }
}

// Function to queue the rendering of a page
// queue because rendering is async and we need to wait for the previous page to finish rendering
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    pageRendering = true;
    renderPage(pdfDoc, num, "the-canvas", scale);
  }
}

// Function to display the previous page
function onPrevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}

// Function to display the next page
function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}

// Main function to initialize the PDF viewer
async function main() {
  let url = "innotech.pdf";

  document // Add event listeners for the buttons, not using html onclick bc it doesn't work with async functions (somehow)
    .getElementById("prev")
    .addEventListener("click", onPrevPage);
  document
    .getElementById("next")
    .addEventListener("click", onNextPage);
  document
    .getElementById("speedread")
    .addEventListener("click", toggleSpeedread);
  document
    .getElementById("speedreadOverlay")
    .addEventListener("click", exitSpeedread);
  document
    .getElementById("fontChooser")
    .addEventListener("change", chooseFont);
  document
    .getElementById("fontSize")
    .addEventListener("change", chooseFont);
  document
    .getElementById("file")
    .addEventListener("click", chooseFile);
  pdfDoc = await loadPDF(url);
  if (pdfDoc) {
    document.getElementById("page_count").textContent = pdfDoc.numPages;
    queueRenderPage(pageNum);
  }
}

// Call the main function
main();

// Function to extract the first paragraph from a specific page of the PDF
async function extractParagraphs(pdfUrl, pageNumber) {
  try {
    const pdfDocument = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdfDocument.getPage(pageNumber);

    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(" ");
    const paragraphs = text.split(/\n\n/);
    return paragraphs[0]; // Return the first paragraph
  } catch (error) {
    console.error("Error extracting text:", error);
  }
}

function blurPage(blur) { // Function to blur the entire page except the speedread overlay
  var elementsToBlur = document.body.children;
  for (var i = 0; i < elementsToBlur.length; i++) {
    var element = elementsToBlur[i];
    if (element.id !== "speedreadOverlay") {
      if (blur) {
        element.style.filter = "blur(5px)";
      } else {
        element.style.filter = "none";
      }
    }
  }
}

// Function to handle speedread mode
async function toggleSpeedread() {
  try {
    // Blur the entire page except the speedread overlay
    blurPage(true);
    let speedreadTextElement = document.getElementById("speedreadText");
    // Show the speedread overlay
    let speedreadOverlay = document.getElementById("speedreadOverlay");
    speedreadOverlay.style.display = "block";

    // Extract a paragraph of text from the PDF
    let paragraph = await extractParagraphs("innotech.pdf", 2);
    let splitParagraph = paragraph.split(" ").filter(function (el) { // Split the paragraph into words, remove empty strings
      return el != "";
    });
    for (let i = 0; i < splitParagraph.length; i++) {
      let word = splitParagraph[i];
      speedreadTextElement.textContent = word;
      let wpm = document.getElementById("wpm").value;
      let delay = 60000/wpm; // Calculate the delay based on the WPM
      console.log(delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  } catch (error) {
    console.error("Error extracting paragraph:", error);
  }
}

// Function to exit speedread mode
function exitSpeedread(event) {
  // Check if the click happened directly on speedreadOverlay
  if (event.target.id === "speedreadOverlay") {
    // Remove blur from the page
    blurPage(false);

    // Hide the speedread overlay
    let speedreadOverlay = document.getElementById("speedreadOverlay");
    speedreadOverlay.style.display = "none";
  }
}

function chooseFont(){
  let font = document.getElementById("fontChooser").value;
  let size = document.getElementById("fontSize").value;
  let speedreadTextElement = document.getElementById("speedreadText");
  speedreadTextElement.style.fontFamily = font;
  speedreadTextElement.style.fontSize = size + "px";
}