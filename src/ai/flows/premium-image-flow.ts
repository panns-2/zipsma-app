
'use server';

export async function generatePremiumImage(prompt: string): Promise<{ base64: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
  
  const payload = {
    instances: [
      { prompt: prompt }
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
    
    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      return { base64: data.predictions[0].bytesBase64Encoded };
    }
    
    // Log the error for the developer
    console.error("Imagen 4 error:", data.error?.message || "Unknown error");
    return null;
  } catch (error) {
    console.error("Premium Image Error:", error);
    return null;
  }
}
