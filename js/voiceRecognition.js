import { getIntent } from "../js/gemini.js";

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

export async function voiceRecognition() {
  return new Promise((resolve, reject) => {
    recognition.start();

    recognition.onresult = async (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }
      transcript = transcript.trim();

      try {
        const intent = await getIntent(transcript);
        console.log("command:" + intent);
        resolve(intent);
      } catch (error) {
        reject(error);
      }
    };

    recognition.onerror = (event) => {
      reject(event.error);
    };
  });
}
