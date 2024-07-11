import { GoogleGenerativeAI } from "@google/generative-ai";

// Fetch your API_KEY
var API_KEY = "", genAI="", model="";

export async function formatText(promptText) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt =
    "Format and make this text more neat so that a text-to-speech can read it," +
    " such that the whitespaces and such are removed, and has proper punctuations (no ** to bold, etc). Do NOT change any sentence" +
    "if no text is provided, reply 'no'" +
    "here is the text:" +
    promptText;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  if(text == "no") {
    return;
  }
  return text;
};

export function initializeGemini(apiKey) {
  API_KEY = apiKey;
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  console.log("initialized!");
}