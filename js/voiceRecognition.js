
export async function RecognizeandVisualize() {
  const AudioVisualizer = class {
    constructor(audioContext, processFrame, processError) {
      this.audioContext = audioContext;
      this.processFrame = processFrame;
      this.connectStream = this.connectStream.bind(this);
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(this.connectStream)
        .catch((error) => {
          if (processError) {
            processError(error);
          }
        });
    }

    connectStream(stream) {
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      this.analyser.smoothingTimeConstant = 0.5;
      this.analyser.fftSize = 32;

      this.initRenderLoop(this.analyser);
    }

    initRenderLoop() {
      const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      const processFrame = this.processFrame || (() => {});

      const renderFrame = () => {
        this.analyser.getByteFrequencyData(frequencyData);
        processFrame(frequencyData);

        requestAnimationFrame(renderFrame);
      };
      requestAnimationFrame(renderFrame);
    }
  };

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechGrammarList =
    window.SpeechGrammarList || window.webkitSpeechGrammarList;
  const SpeechRecognitionEvent =
    window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

  const commands = [
    "text to speech",
    "speak",
    "pause",
    "start",
    "cancel",
    "stop",
    "exit",
    "resume",
    "speedread",
    "dyslexia",
    "change",
    "dark mode",
    "night mode",
    "light mode",
    "jump",
    "navigate",
  ];
  const grammar = `#JSGF V1.0; grammar commands; public <command> = ${commands.join(
    " | "
  )};`;

  const recognition = new SpeechRecognition();
  const speechRecognitionList = new SpeechGrammarList();

  speechRecognitionList.addFromString(grammar, 1);

  recognition.grammars = speechRecognitionList;
  recognition.continuous = false;
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  async function voiceRecognition() {
    return new Promise((resolve, reject) => {
      recognition.start();

      recognition.onresult = async (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        transcript = transcript.trim();

        const liveWordsSpan = document.getElementById("liveWords");
        if (liveWordsSpan) {
          liveWordsSpan.textContent = transcript;
        }

        try {
          console.log("User says:", transcript);
          resolve(transcript);
        } catch (error) {
          console.error("Error getting intent:", error);
          reject(error);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        reject(event.error);
      };
    });
  }

  const init = async () => {
    let visualElements;
    const createDOMElements = () => {
      const visualMainElement = document.querySelector("main");
      visualMainElement.innerHTML = "";
      const visualValueCount = 16;
      for (let i = 0; i < visualValueCount; ++i) {
        const elm = document.createElement("div");
        visualMainElement.appendChild(elm);
      }
      visualElements = document.querySelectorAll("main div");
    };

    const audioContext = new AudioContext();
    createDOMElements();

    const dataMap = {
      0: 15,
      1: 10,
      2: 8,
      3: 9,
      4: 6,
      5: 5,
      6: 2,
      7: 1,
      8: 0,
      9: 4,
      10: 3,
      11: 7,
      12: 11,
      13: 12,
      14: 13,
      15: 14,
    };

    const processFrame = (data) => {
      const values = Object.values(data);
      for (let i = 0; i < values.length; ++i) {
        const value = values[dataMap[i]] / 255;
        const elmStyles = visualElements[i].style;
        elmStyles.transform = `scaleY(${value})`;
        elmStyles.opacity = Math.max(0.25, value);
      }
    };

    const processError = (error) => {
      console.error("Audio visualization error:", error);
      const visualMainElement = document.querySelector("main");
      visualMainElement.classList.add("error");
      visualMainElement.innerText =
        "Please allow access to your microphone in order to see this demo.\nNothing bad is going to happen... hopefully :P";
    };

    // Initialize both audio visualization and voice recognition
    new AudioVisualizer(audioContext, processFrame, processError);

    try {
      const userCommand = await voiceRecognition();
      console.log("voiceRecognition returned to init:", userCommand);
      return userCommand; // Return the recognized intent
    } catch (error) {
      console.error("Voice recognition error:", error);
      throw error; // Propagate the error
    }
  };

  return init();
}
