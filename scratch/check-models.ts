
import 'dotenv/config';
import { ai, googleAI } from '../src/ai/genkit';

async function testModels() {
  const models = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-1.0-pro'
  ];

  for (const modelName of models) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = googleAI.model(modelName);
      const result = await ai.generate({
        model,
        prompt: 'say hello'
      });
      console.log(`SUCCESS with ${modelName}:`, result.text());
      return;
    } catch (e) {
      console.log(`FAILED with ${modelName}`);
    }
  }
}

testModels();
