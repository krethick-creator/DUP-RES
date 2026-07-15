require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

(async () => {
  console.log("API KEY:", process.env.GEMINI_API_KEY);

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY.trim()
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Say OK"
    });

    console.log("SUCCESS");
    console.log(response.text);

  } catch (e) {

    console.log("STATUS:", e.status);

    console.log("MESSAGE:");
    console.log(e.message);

    console.log("\nFULL ERROR:");
    console.dir(e,{depth:10});
  }
})();
