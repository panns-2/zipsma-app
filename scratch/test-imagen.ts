
import 'dotenv/config';

async function testImagen() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
  
  const payload = {
    instances: [
      { prompt: "A professional educational illustration of a cell structure, high quality, 4k" }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: "16:9"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log("Imagen response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Imagen error:", error);
  }
}

testImagen();
