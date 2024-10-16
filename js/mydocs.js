// PDF.JS CONFIGURATION ====================================
var { pdfjsLib } = globalThis;

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";

const documentList = document.getElementById('documentList');

function showPopup(message, type, confirmCallback = null) {
  const popupBox = document.getElementById('popupBox');
  const popupMessage = document.getElementById('popupMessage');
  const popupConfirmButton = document.getElementById('popupConfirmButton');
  const popupCloseButton = document.getElementById('popupCloseButton');

  popupMessage.textContent = message;

  // Show confirm button if confirmCallback is provided
  if (confirmCallback) {
    popupConfirmButton.style.display = 'inline-block';
    popupConfirmButton.onclick = confirmCallback;
  } else {
    popupConfirmButton.style.display = 'none';
  }

  popupCloseButton.onclick = function () {
    popupBox.style.display = 'none';
  };

  popupBox.style.display = 'flex';
}

// Override alert function to use popup
window.alert = function (message) {
  showPopup(message);
};

document.getElementById('fileInput').addEventListener('change', async function () {
  const file = this.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('php/upload_file.php', {
        method: 'POST',
        body: formData
      });

      const text = await response.text();
      const result = JSON.parse(text);

      if (result.status === 'success') {
        showPopup('File uploaded successfully', 'success');
        fetchDocuments();
      } else {
        showPopup('Failed to upload PDF: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      showPopup('Error uploading PDF: ' + error.message, 'error');
    }
  }
});

export async function fetchDocuments() {
  try {
    const response = await fetch('php/fetch_documents.php');
    const documents = await response.json();
    documentList.innerHTML = '';

    if (documents.length === 0) {
      documentList.style.justifyContent = 'center';
      const div = document.createElement('div');
      div.className = 'no-documents';
      div.innerHTML = `
        <img src="Resources/panda-eating.gif" alt="No Documents" />
        <p>No documents found. <br> Do you want to upload a file?</p>
      `;
      documentList.appendChild(div);
    } else {
      documents.forEach(doc => {
        documentList.style.justifyContent = 'flex-start';
        const div = document.createElement('div');
        div.className = 'document-item';
        div.innerHTML = `
          <div class="canvas-container" id="canvas-container-${doc.id}" style="position: relative;">
            <canvas class="doc-canvas" id="pdf-${doc.id}"></canvas>
            <button class="delete-button" onclick="confirmDeleteDocument(event, ${doc.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <span class="doc-file-txt">${doc.file_name}</span>
        `;
        div.addEventListener('click', () => {
          viewDocument(doc.id);
        });
        documentList.appendChild(div);
        renderPDFPage(`php/uploads/${doc.username}/${doc.file_name}`, `pdf-${doc.id}`);
      });
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
  }
}

export async function deleteDocument(id) {
  try {
    const response = await fetch(`php/delete_document.php`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `id=${id}`
    });
    const responseText = await response.text();
    const result = JSON.parse(responseText);
    if (result.status === 'success') {
      alert('Document deleted successfully');
      fetchDocuments();
    } else {
      alert('Failed to delete document: ' + result.message);
    }
  } catch (error) {
    console.error('Error deleting document:', error);
  }
}

function confirmDeleteDocument(event, id) {
  showPopup('Are you sure you want to delete this document?', 'confirm', function () {
    deleteDocument(id);
    document.getElementById('popupBox').style.display = 'none';
  });
  event.stopPropagation();
}

export { confirmDeleteDocument };

document.addEventListener('DOMContentLoaded', fetchDocuments);

async function renderPDFPage(url, canvasId) {
  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(function (pdf) {
    pdf.getPage(1).then(function (page) {
      const viewport = page.getViewport({ scale: 1 });
      const canvas = document.getElementById(canvasId);
      const context = canvas.getContext('2d');

      // Define the desired canvas size
      const canvasSize = { width: 400, height: 400 }; // You can adjust this size as needed

      // Determine the scale to fit the page within the canvas
      const scale = Math.min(canvasSize.width / viewport.width, canvasSize.height / viewport.height);
      const scaledViewport = page.getViewport({ scale: scale });

      // Resize the canvas to fit the scaled viewport
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };

      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      page.render(renderContext).promise.then(() => {
        console.log('PDF page rendered successfully');
      });
    });
  }).catch(function (error) {
    console.error('Error rendering PDF page:', error);
  });
}

function viewDocument(id) {
  window.location.href = `index.php?doc_id=${id}`;
}