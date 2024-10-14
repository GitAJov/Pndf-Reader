# Pndf-Reader

This project was developed as part of the Human-Computer Interaction course by Team Panda. <br>
This is a web-based PDF reader designed to assist users with accessibility challenges such as reading difficulties, dyslexia, and ADHD.

## Features

- **Speed Reading:** Adjust reading speed to suit user preferences.
- **Customizable Text Display:** Change font styles (e.g., OpenDyslexia, Times New Roman), font sizes, letter, and word spacing to improve readability.
- **Bookmarks:** Easily save and access important sections of a document.
- **Text-to-Speech:** Convert text into speech for users who prefer listening.
- **Voice Commands:** Navigate and control the reader using voice commands, powered by the Gemini API.

## Technologies Used

- **JavaScript**
- **PHP**
- **MySQL Database**
- **PDF.js** for rendering PDF files
- **Gemini API** for voice commands
- **Speech Synthesis API** for text-to-speech
- **Speech Recognition API** for recognizing voice commands
- **Composer** for PHP dependency management

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/GitAJov/Pndf-Reader.git
    ```
2. Navigate to the project directory:
    ```bash
    cd Pndf-Reader
    ```
3. Install dependencies using Composer:
    ```bash
    composer install
    ```

4. Import the database:
    - Use the `db_pndf.sql` file to set up the database.

5. Configure the environment variables:
    - Open the `var.env` file in the root directory.
    - Add your Gemini API key to the `GEMINI_API_KEY` variable.

    To get your Gemini API key, follow the steps [here](https://ai.google.dev/gemini-api/docs/api-key).

6. Place the entire project folder in `htdocs`:
    - Make sure the folder is inside the `htdocs` directory of your local server. (Example: C:\xampp\htdocs)

## Usage

1. Start your local server (e.g., XAMPP).
2. Open the application in your browser by navigating to:
    ```
    localhost/PNDF-reader
    ```
3. Upload a PDF file or open an existing one.
4. Use the customization options to adjust the reading view.
5. Enable text-to-speech to have the content read aloud.
6. Utilize voice commands for hands-free navigation.
