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
    const documentList = document.getElementById('documentList');
    documentList.innerHTML = '';
    if (documents.length === 0) {
      // Display panda-eating gif and message if no documents are found
      const div = document.createElement('div');
      div.className = 'no-documents';
      div.innerHTML = `
        <img src="Resources/panda-eating.gif" alt="No Documents" />
        <p>No documents found. <br> Do you want to upload a file?</p>
      `;
      documentList.appendChild(div);
    } else {
      // Display documents if found
      documents.forEach(doc => {
        const div = document.createElement('div');
        div.className = 'document-item';
        div.innerHTML = `
          <span>${doc.file_name}</span>
          <div>
            <button onclick="viewDocument(${doc.id})">View</button>
            <button class="delete-button" onclick="confirmDeleteDocument(${doc.id})">Delete</button>
          </div>
        `;
        documentList.appendChild(div);
      });
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
  }
}

function viewDocument(id) {
  window.location.href = `index.php?doc_id=${id}`;
}

export async function deleteDocument(id) {
  //console.log('Deleting document with id:', id);
  try {
    const response = await fetch(`php/delete_document.php`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded' // Change to form-urlencoded
      },
      body: `id=${id}` // Send id in the body
    });
    const responseText = await response.text();
    //console.log('Response text that caused error:', responseText);
    const result = JSON.parse(responseText);
    //console.log('Delete response:', result);
    if (result.status === 'success') {
      alert('Document deleted successfully');
      fetchDocuments();
    } else {
      alert('Failed to delete document: ' + result.message);
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    //console.error('Response text that caused error:', error.message);
  }
}

function confirmDeleteDocument(id) {
  if (confirm('Are you sure you want to delete this document?')) {
    deleteDocument(id);
  }
}

export { confirmDeleteDocument };

document.addEventListener('DOMContentLoaded', fetchDocuments);