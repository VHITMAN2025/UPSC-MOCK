import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.log("No valid API key found in .env");
  process.exit(1);
}

async function listModels() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  if (data.models) {
    console.log("Available Models:");
    data.models.forEach(m => {
      console.log(`- ${m.name} (${m.displayName}) - Vision: ${m.supportedGenerationMethods.includes('generateContent')}`);
    });
  } else {
    console.log("Error fetching models:", data);
  }
}

listModels();
