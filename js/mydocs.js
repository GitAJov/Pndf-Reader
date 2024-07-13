document.getElementById('fileInput').addEventListener('change', async function () {
  const file = this.files[0];
  if (file) {
    console.log('File selected:', file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('php/upload_file.php', {
        method: 'POST',
        body: formData
      });

      const text = await response.text();
      console.log('Raw response text:', text);

      const result = JSON.parse(text);
      console.log('Upload response:', result);

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

async function fetchDocuments() {
  try {
    const response = await fetch('php/fetch_documents.php');
    const documents = await response.json();
    console.log('Fetched documents:', documents);
    const documentList = document.getElementById('documentList');
    documentList.innerHTML = '';
    documents.forEach(doc => {
      const div = document.createElement('div');
      div.className = 'document-item';
      div.innerHTML = `
        <span>${doc.file_name}</span>
        <button onclick="viewDocument(${doc.id})">View</button>
      `;
      documentList.appendChild(div);
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
  }
}

function viewDocument(id) {
  window.location.href = `index.php?doc_id=${id}`;
}

document.addEventListener('DOMContentLoaded', fetchDocuments);