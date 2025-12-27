const { GoogleGenerativeAI } = require("@google/generative-ai");

// ===== Validate API Key =====
if (!process.env.GOOGLE_GEMINI_KEY) {
  throw new Error("❌ GOOGLE_GEMINI_KEY is missing in environment variables");
}

// ===== Init Gemini API =====
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);

// ===== List available models for safety (optional) =====
async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available models:", models.map(m => m.name));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}
// Uncomment to see available models
// listModels();

// ===== Select a working model =====
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite", // replace with a model from listModels() if needed
  systemInstruction: `
You are a Senior Code Reviewer with 7+ years of experience.

Focus on:
- Code Quality
- Best Practices
- Performance & Efficiency
- Security vulnerabilities
- Scalability
- Readability & Maintainability

Guidelines:
1. Provide constructive, concise feedback
2. Suggest refactored code when needed
3. Detect bugs & performance bottlenecks
4. Follow DRY & SOLID principles
5. Encourage modern development practices

Tone:
- Professional, precise, encouraging
- Assume developer competence
`
});

// ===== Generate content safely =====
async function generateContent(prompt) {
  try {
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt must be a non-empty string");
    }

    const result = await model.generateContent(prompt);
    const responseText = result?.response?.text();

    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    console.log(responseText);
    return responseText;

  } catch (error) {
    // ===== Handle quota / rate-limit errors =====
    if (error?.status === 429) {
      console.error("⚠️ Gemini quota exceeded");
      return "❌ AI quota exceeded. Please try again later or upgrade your plan.";
    }

    // ===== Handle model not found =====
    if (error?.status === 404) {
      console.error("⚠️ Model not found. Check your model name.");
      return "❌ Model not found. Please check your configuration.";
    }

    // ===== Handle other API errors =====
    if (error?.name === "GoogleGenerativeAIFetchError") {
      console.error("Gemini API Error:", error.message);
      return "❌ AI service temporarily unavailable.";
    }

    // ===== Unknown errors =====
    console.error("Unexpected AI Error:", error);
    return "❌ Something went wrong while reviewing the code.";
  }
}

module.exports = generateContent;
