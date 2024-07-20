// PDF.JS CONFIGURATION ====================================
var { pdfjsLib } = globalThis;

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.mjs";

let documentList = document.getElementById('documentList');

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
        alert('File uploaded successfully');
        fetchDocuments();
      } else {
        alert('Failed to upload PDF: ' + result.message);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
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
      documentList.style.justifyContent = 'none';
      documents.forEach(doc => {
        const div = document.createElement('div');
        div.className = 'document-item';
        div.innerHTML = `
          <canvas class="doc-canvas" id="pdf-${doc.id}"></canvas>
          <span class="doc-file-txt">${doc.file_name}</span>
          <div>
            <button onclick="viewDocument(${doc.id})">View</button>
            <button class="delete-button" onclick="confirmDeleteDocument(${doc.id})">Delete</button>
          </div>
        `;
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

function confirmDeleteDocument(id) {
  if (confirm('Are you sure you want to delete this document?')) {
    deleteDocument(id);
  }
}

export { confirmDeleteDocument };

document.addEventListener('DOMContentLoaded', fetchDocuments);

async function renderPDFPage(url, canvasId) {
  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(function (pdf) {
    pdf.getPage(1).then(function (page) {
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.max(200 / viewport.width, 200 / viewport.height);
      const scaledViewport = page.getViewport({ scale: scale });

      const canvas = document.getElementById(canvasId);
      const context = canvas.getContext('2d');
      canvas.height = 200;
      canvas.width = 200;

      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };

      // Center the page in the canvas
      const translateX = (canvas.width - scaledViewport.width) / 2;
      const translateY = (canvas.height - scaledViewport.height) / 2;
      context.translate(translateX, translateY);

      page.render(renderContext).promise.then(() => {
        // Reset the transform after rendering
        context.setTransform(1, 0, 0, 1, 0, 0);
      });
    });
  }).catch(function (error) {
    console.error('Error rendering PDF page:', error);
  });
}