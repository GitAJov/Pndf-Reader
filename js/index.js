function choosefile() {
  const inputElement = document.createElement("input");
  inputElement.type = "file";
  inputElement.multiple = false;
  inputElement.accept = ".pdf";

  inputElement.addEventListener("change", async function (event) {
    const files = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);

      
    }
  });

  inputElement.click();
}
