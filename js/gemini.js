import { GoogleGenerativeAI } from "@google/generative-ai";

// Fetch your API_KEY
var API_KEY = "", genAI="", model="";

export async function formatText(promptText) {
  const prompt =
    "Format and make this text more neat so that a text-to-speech can read it," +
    " such that the whitespaces are removed and the text has proper punctuations. Do NOT change any sentence" +
    "if no text is provided, ONLY REPLY WITH 'text not found'" +
    "here is the text:" +
    promptText;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  if(text == "text not found") {
    return promptText;
  }
  return text;
};

export async function formatDisplayText(promptText) {
  const prompt =
    "The following text was extracted from a pdf. It is not neat and tidy." +
    "Format and make this text more neat so that it can be displayed, processed, and read by a dyslexic in plain text," +
    "such that the whitespaces are removed and the text has proper punctuations. Do NOT change any sentence" +
    "if no text is provided, ONLY REPLY WITH 'text not found'" +
    "here is the text:" +
    promptText;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  if(text == "text not found") {
    return promptText;
  }
  console.log(text);
  return text;
};

export async function getIntent(promptText){
  // return promptText;
  const prompt =
    "You are a command interpreter. A user will give you a string of instructions, and you are to determine and reply with ONLY THE COMMAND that the user wants to run. " +
    "The user can ONLY RUN ONE COMMAND. If the user gives multiple commands, choose the one that has the highest priority (requesting for text to speech, dyslexia, or speedread is the highest priority). " +
    "If the user's instructions does not seem to match any of the commands, only reply with 'no'. " +
    "The possible commands include: " +
    "1. navigate number (as in the number itself, for ex navigate 2, navigate 3, navigate 4, which means navigate to page 2 3 or 4.) " +
    "2. text to speech (reads a text out loud) " +
    "3. pause (pause the text to speech) " +
    "4. resume " +
    "5. stop (stops the text to speech) " +
    "6. speedread (a feature that lets the user reads fast.) " +
    "7. dyslexia (a feature that displays a text in a dyslexia friendly way) " +
    "8. change (change/read/upload a new file) " +
    "9. toggle (toggle the theme of the website from dark mode to light mode vice versa). " +
    "Here is the user's instruction: " +
    promptText;
    
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim().toLowerCase();
  console.log("gemini determined intent:" + text);
  return text;
}

export function initializeGemini(apiKey) {
  API_KEY = apiKey;
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log("gemini initialised!");
}