// Loaded via <script> tag, create shortcut to access PDF.js exports.
var { pdfjsLib } = globalThis;

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.js/build/pdf.worker.mjs";

// Initialize global variables
let pdfDoc = null,
  pageNum = 1,
  pageRendering = false,
  pageNumPending = null,
  scale = 0.8,
  canvas = document.getElementById("the-canvas"),
  ctx = canvas.getContext("2d");

// Function to load the PDF document
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

// Function to render a specific page of the PDF onto a canvas
async function renderPage(pdf, pageNumber, canvasId, scale) {
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

    // Update page counters
    document.getElementById("page_num").textContent = pageNumber;
  } catch (error) {
    console.error("Error rendering page:", error);
  }
}

// Function to extract the first paragraph from a specific page of the PDF
async function extractParagraphs(pdfUrl, pageNumber, outputElementId) {
  try {
    const pdfDocument = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdfDocument.getPage(pageNumber);

    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(" ");
    const paragraphs = text.split(/\n\n/);
    const firstParagraph = paragraphs[0];

    document.getElementById(outputElementId).innerText = firstParagraph;
  } catch (error) {
    console.error("Error extracting text:", error);
  }
}



// Function to render the current page
function renderCurrentPage() {
  pageRendering = true;
  pdfDoc.getPage(pageNum).then(function (page) {
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };
    const renderTask = page.render(renderContext);

    renderTask.promise.then(function () {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderCurrentPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });

  document.getElementById("page_num").textContent = pageNum;
}

// Function to queue the rendering of a page
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderCurrentPage(num);
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
  const url = "innotech.pdf";

  document.getElementById("prev").addEventListener("click", onPrevPage);
  document.getElementById("next").addEventListener("click", onNextPage);

  pdfDoc = await loadPDF(url);
  if (pdfDoc) {
    document.getElementById("page_count").textContent = pdfDoc.numPages;
    await renderPage(pdfDoc, pageNum, "the-canvas", scale);
    extractParagraphs("innotech.pdf", 2, "pdf-content");
  }
}

// Call the main function
main();
